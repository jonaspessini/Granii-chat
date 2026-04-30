// js/supabase-sync.js
import { supabase, getCurrentUser } from './supabase-config.js';

let currentUser = null;

export async function getCurrentUserData() {
    // Sempre busca a sessão atual — evita token de outro usuário em cache
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    currentUser = session.user;
    return currentUser;
}

// Limpa transações e cartões do localStorage
function clearLocalData() {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('lancamentos_') || key === 'cartoes_credito')) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`🧹 Limpou ${keysToRemove.length} chaves do localStorage`);
}

// Gera um local_id único para cada transação que não tem um ainda
export function ensureLocalId(transaction) {
    if (!transaction.local_id) {
        transaction.local_id = 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    return transaction;
}

// CARREGAR transações do Supabase → localStorage
export async function loadUserTransactionsFromSupabase() {
    const user = await getCurrentUserData();
    if (!user) return false;

    console.log(`📥 Carregando transações do usuário: ${user.email}`);

    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id);

    if (error) {
        console.error('Erro ao carregar transações:', error);
        return false;
    }

    // Limpar dados antigos ANTES de escrever os novos
    clearLocalData();

    // Agrupar por mês
    const groupedByMonth = {};
    (data || []).forEach(t => {
        if (!groupedByMonth[t.month_key]) groupedByMonth[t.month_key] = [];

        groupedByMonth[t.month_key].push({
            local_id: t.local_id,
            descricao: t.description,
            valor: t.type === 'income' ? t.amount : -t.amount,
            tipo: t.type === 'income' ? 'receita' : 'despesa',
            pago: t.is_paid,
            dataVencimento: t.due_date,
            formaPagamento: t.payment_method,
            parcelamento: t.installment_info ? JSON.parse(t.installment_info) : undefined,
            ultimaModificacao: t.last_modified
        });
    });

    for (const [monthKey, transactions] of Object.entries(groupedByMonth)) {
        localStorage.setItem(`lancamentos_${monthKey}`, JSON.stringify(transactions));
        console.log(`💾 Salvo mês ${monthKey}: ${transactions.length} transações`);
    }

    console.log(`✅ Carregadas ${data?.length || 0} transações`);
    return true;
}

// SALVAR transações de UM MÊS no Supabase via upsert (não apaga outros meses)
export async function saveMonthTransactionsToSupabase(monthKey) {
    const user = await getCurrentUserData();
    if (!user) return false;

    const transactions = JSON.parse(localStorage.getItem(`lancamentos_${monthKey}`) || '[]');

    // Garantir que todas têm local_id e salvar de volta no localStorage
    let needsSave = false;
    transactions.forEach(t => {
        if (!t.local_id) {
            ensureLocalId(t);
            needsSave = true;
        }
    });
    if (needsSave) {
        localStorage.setItem(`lancamentos_${monthKey}`, JSON.stringify(transactions));
    }

    if (transactions.length === 0) {
        // Se o mês ficou vazio, apaga apenas as transações deste mês no Supabase
        await supabase
            .from('transactions')
            .delete()
            .eq('user_id', user.id)
            .eq('month_key', monthKey);
        return true;
    }

    const toUpsert = transactions.map(t => ({
        user_id: user.id,
        month_key: monthKey,
        local_id: t.local_id,
        description: t.descricao,
        amount: Math.abs(t.valor),
        type: t.valor > 0 ? 'income' : 'expense',
        is_paid: t.pago || false,
        due_date: t.dataVencimento,
        payment_method: t.formaPagamento || null,
        category: null,
        installment_info: t.parcelamento ? JSON.stringify(t.parcelamento) : null,
        last_modified: t.ultimaModificacao || null
    }));

    // Upsert: insere se não existe, atualiza se já existe (baseado em user_id + local_id)
    const { error } = await supabase
        .from('transactions')
        .upsert(toUpsert, { onConflict: 'user_id,local_id', ignoreDuplicates: false });

    if (error) {
        console.error(`Erro ao fazer upsert do mês ${monthKey}:`, error);
        return false;
    }

    // Remover do Supabase transações que foram deletadas localmente neste mês
    const localIds = transactions.map(t => t.local_id).filter(Boolean);
    if (localIds.length > 0) {
        await supabase
            .from('transactions')
            .delete()
            .eq('user_id', user.id)
            .eq('month_key', monthKey)
            .not('local_id', 'in', `(${localIds.map(id => `"${id}"`).join(',')})`);
    }

    console.log(`✅ Upsert mês ${monthKey}: ${toUpsert.length} transações`);
    return true;
}

// SALVAR TODAS as transações (usado no logout — mais seguro)
export async function saveUserTransactionsToSupabase() {
    const user = await getCurrentUserData();
    if (!user) return false;

    console.log(`📤 Salvando todas as transações do usuário: ${user.email}`);

    const monthKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('lancamentos_')) {
            monthKeys.push(key.replace('lancamentos_', ''));
        }
    }

    if (monthKeys.length === 0) {
        console.warn('⚠️ Nenhuma transação local — sync cancelado para não apagar dados remotos.');
        return false;
    }

    for (const monthKey of monthKeys) {
        await saveMonthTransactionsToSupabase(monthKey);
    }

    console.log(`✅ Todos os meses sincronizados`);
    return true;
}

export async function loadUserCardsFromSupabase() {
    const user = await getCurrentUserData();
    if (!user) return false;

    const { data, error } = await supabase
        .from('user_cards')
        .select('*')
        .eq('user_id', user.id);

    if (error) {
        console.error('Erro ao carregar cartões:', error);
        return false;
    }

    if (data && data.length > 0) {
        const cards = data.map(c => ({
            id: c.card_id,
            nome: c.name,
            limite: c.limit_amount,
            limiteFormatado: c.limit_amount?.toFixed(2).replace('.', ',') || '0,00',
            diaVencimento: c.due_day
        }));
        localStorage.setItem('cartoes_credito', JSON.stringify(cards));
    }

    return true;
}

export async function deleteAllUserDataFromSupabase() {
    const user = await getCurrentUserData();
    if (!user) return false;

    const { error: transactionsError } = await supabase
        .from('transactions')
        .delete()
        .eq('user_id', user.id);

    if (transactionsError) {
        console.error('Erro ao apagar transacoes:', transactionsError);
        return false;
    }

    const { error: cardsError } = await supabase
        .from('user_cards')
        .delete()
        .eq('user_id', user.id);

    if (cardsError) {
        console.error('Erro ao apagar cartoes:', cardsError);
        return false;
    }

    console.log('Dados do usuario apagados do Supabase');
    return true;
}

export async function saveUserCardsToSupabase() {
    const user = await getCurrentUserData();
    if (!user) return false;

    const cards = JSON.parse(localStorage.getItem('cartoes_credito') || '[]');

    if (cards.length === 0) {
        console.warn('⚠️ Nenhum cartão local — sync de cartões cancelado.');
        return false;
    }

    // Cartões usam upsert por card_id
    const cardsToUpsert = cards.map(c => ({
        user_id: user.id,
        card_id: c.id,
        name: c.nome,
        limit_amount: c.limite,
        due_day: c.diaVencimento
    }));

    const { error } = await supabase
        .from('user_cards')
        .upsert(cardsToUpsert, { onConflict: 'user_id,card_id', ignoreDuplicates: false });

    if (error) {
        console.error('Erro ao salvar cartões:', error);
        return false;
    }

    // Remover cartões que foram deletados localmente
    const cardIds = cards.map(c => c.id);
    await supabase
        .from('user_cards')
        .delete()
        .eq('user_id', user.id)
        .not('card_id', 'in', `(${cardIds.map(id => `"${id}"`).join(',')})`);

    console.log(`✅ ${cards.length} cartões sincronizados`);
    return true;
}

export async function loadUserData() {
    const user = await getCurrentUserData();
    if (!user) return false;

    console.log(`🔄 Carregando dados do usuário: ${user.email}`);

    await loadUserTransactionsFromSupabase();
    await loadUserCardsFromSupabase();

    console.log('✅ Dados carregados!');
    return true;
}

export async function syncAllToSupabase() {
    await saveUserTransactionsToSupabase();
    await saveUserCardsToSupabase();
    console.log('✅ Sincronização completa!');
    return true;
}
