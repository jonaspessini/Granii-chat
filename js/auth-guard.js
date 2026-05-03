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
    console.log('✅ Removidas ' + keysToRemove.length + ' chaves');
}

// Verificar autenticação e carregar dados do usuário
async function checkAuthAndLoadData() {
    try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            window.location.replace('./login.html');
            return false;
        }

        // ⭐ LIMPAR DADOS ANTIGOS ANTES DE CARREGAR ⭐
        clearUserDataFromLocalStorage();

        // Carregar dados do usuário do Supabase
        const user = await getCurrentUser();
        if (user) {
            console.log('👤 Usuário logado: ' + user.email);
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
        window.location.replace('./login.html');
        return false;
    }
}

// Mostrar modal de confirmação (substitui confirm() que não funciona em PWA Android)
function showLogoutModal() {
    // Evitar duplicata
    if (document.getElementById('logout-modal-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'logout-modal-overlay';
    overlay.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.55);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
    `;

    overlay.innerHTML = `
        <div style="
            background: #fff;
            border-radius: 20px;
            padding: 28px 24px;
            margin: 20px;
            text-align: center;
            box-shadow: 0 8px 32px rgba(0,0,0,0.18);
            max-width: 320px;
            width: 100%;
        ">
            <div style="font-size: 40px; margin-bottom: 12px;">👋</div>
            <p style="font-size: 16px; font-weight: 700; color: #1a1a1a; margin-bottom: 6px;">Deseja sair da conta?</p>
            <p style="font-size: 13px; color: #666; margin-bottom: 24px;">Seus dados serão sincronizados antes de sair.</p>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button id="logout-cancelar" style="
                    background: #f0f0f0;
                    color: #333;
                    border: none;
                    border-radius: 10px;
                    padding: 12px 24px;
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
                    flex: 1;
                ">Cancelar</button>
                <button id="logout-confirmar" style="
                    background: #e53935;
                    color: #fff;
                    border: none;
                    border-radius: 10px;
                    padding: 12px 24px;
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
                    flex: 1;
                ">Sair</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('logout-cancelar').onclick = function() {
        overlay.remove();
    };

    document.getElementById('logout-confirmar').onclick = function() {
        overlay.remove();
        executeLogout();
    };
}

// Executar o logout de fato (separado do modal)
async function executeLogout() {
    // Mostrar feedback visual de "aguarde"
    const loadingOverlay = document.createElement('div');
    loadingOverlay.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(255,255,255,0.85);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        font-size: 15px;
        color: #333;
        gap: 12px;
    `;
    loadingOverlay.innerHTML = `
        <div style="font-size: 32px;">⏳</div>
        <p style="font-weight: 600;">Sincronizando dados...</p>
    `;
    document.body.appendChild(loadingOverlay);

    try {
        // Sync com timeout de 6s para não travar indefinidamente
        const syncPromise = syncAllToSupabase();
        const timeout = new Promise(function(resolve) { setTimeout(resolve, 6000); });
        await Promise.race([syncPromise, timeout]);
    } catch (e) {
        console.warn('⚠️ Sync falhou, saindo mesmo assim:', e);
    }

    try {
        await signOut();
    } catch (e) {
        console.warn('⚠️ signOut falhou:', e);
    }

    // Garantir navegação para o login
    window.location.replace('./login.html');
}

// Função exportada (compatibilidade com chamadas externas)
async function logoutAndSync() {
    showLogoutModal();
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

    logoutBtn.onclick = showLogoutModal;
    document.body.appendChild(logoutBtn);
}

// Executar
document.addEventListener('DOMContentLoaded', async function() {
    const isAuthenticated = await checkAuthAndLoadData();
    if (isAuthenticated) {
        addLogoutButton();
    }
});

export { checkAuthAndLoadData, logoutAndSync };