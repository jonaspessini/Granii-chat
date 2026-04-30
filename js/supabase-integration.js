// js/supabase-integration.js
import { getCurrentUser } from './supabase-config.js';
import { loadUserData, saveUserTransactionsToSupabase } from './supabase-sync.js';

let isInitialized = false;
let currentUserEmail = null;

// Função para limpar APENAS dados de transações e cartões
function clearUserDataFromLocalStorage() {
    console.log('🧹 Limpando dados antigos do localStorage...');
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('lancamentos_') || key === 'cartoes_credito')) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`  Removido: ${key}`);
    });
    console.log(`✅ Removidas ${keysToRemove.length} chaves`);
}

export async function initSupabaseForUser() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            console.log('⚠️ Nenhum usuário logado, redirecionando...');
            window.location.href = 'login.html';
            return false;
        }
        
        // Verificar se o usuário mudou
        if (currentUserEmail !== user.email) {
            console.log(`👤 Usuário mudou de ${currentUserEmail} para ${user.email}`);
            // LIMPAR DADOS ANTIGOS
            clearUserDataFromLocalStorage();
            currentUserEmail = user.email;
        }
        
        console.log(`🔄 Carregando dados do usuário: ${user.email}`);
        
        // Carregar dados do usuário do Supabase
        await loadUserData();
        
        // Forçar recarregamento da página atual
        if (typeof window !== 'undefined') {
            // Recarregar a página para garantir que tudo seja atualizado
            if (typeof updateMonthDisplay === 'function') {
                updateMonthDisplay();
            }
            if (typeof renderizarCartoes === 'function') {
                renderizarCartoes();
            }
            if (typeof renderizarResumoMes === 'function') {
                renderizarResumoMes();
            }
            if (typeof renderizarPendencias === 'function') {
                renderizarPendencias();
            }
            if (typeof renderizarHistorico === 'function') {
                renderizarHistorico();
            }
            if (typeof carregarFormasPagamento === 'function') {
                carregarFormasPagamento();
            }
        }
        
        isInitialized = true;
        console.log('✅ Supabase integrado com sucesso!');
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao inicializar Supabase:', error);
        return false;
    }
}