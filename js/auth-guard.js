// js/auth-guard.js
import { supabase, signOut, getCurrentUser } from './supabase-config.js';
import { loadUserData, syncAllToSupabase } from './supabase-sync.js';

// Limpar dados do localStorage
function clearUserDataFromLocalStorage() {
    console.log('🧹 Limpando dados do localStorage...');
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('lancamentos_') || key === 'cartoes_credito')) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`✅ Removidas ${keysToRemove.length} chaves`);
}

// Verificar autenticação e carregar dados do usuário
async function checkAuthAndLoadData() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            window.location.href = 'login.html';
            return false;
        }
        
        // ⭐ LIMPAR DADOS ANTIGOS ANTES DE CARREGAR ⭐
        clearUserDataFromLocalStorage();
        
        // Carregar dados do usuário do Supabase
        const user = await getCurrentUser();
        if (user) {
            console.log(`👤 Usuário logado: ${user.email}`);
            await loadUserData();
        }
        
        // Mostrar email na interface
        const userEmailElement = document.getElementById('userEmail');
        if (userEmailElement) {
            userEmailElement.textContent = session.user.email;
        }
        
        return true;
    } catch (error) {
        console.error('Erro na verificação:', error);
        window.location.href = 'login.html';
        return false;
    }
}

// Função para fazer logout com sincronização
async function logoutAndSync() {
    if (confirm('Deseja sair da sua conta? Seus dados serão sincronizados.')) {
        // Sincronizar dados antes de sair
        await syncAllToSupabase();
        await signOut();
        window.location.href = 'login.html';
    }
}

// Adicionar botão de logout
function addLogoutButton() {
    if (document.getElementById('global-logout-btn')) return;
    
    const logoutBtn = document.createElement('button');
    logoutBtn.id = 'global-logout-btn';
    logoutBtn.innerHTML = '<i class="ri-logout-box-r-line"></i> Sair';
    logoutBtn.style.cssText = `
        position: fixed;
        bottom: 80px;
        right: 20px;
        background: #e53935;
        color: white;
        border: none;
        border-radius: 30px;
        padding: 10px 20px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        z-index: 9999;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        gap: 8px;
    `;
    
    logoutBtn.onclick = logoutAndSync;
    document.body.appendChild(logoutBtn);
}

// Executar
document.addEventListener('DOMContentLoaded', async () => {
    const isAuthenticated = await checkAuthAndLoadData();
    if (isAuthenticated) {
        addLogoutButton();
    }
});

export { checkAuthAndLoadData, logoutAndSync };