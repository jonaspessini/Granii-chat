// js/auth-guard.js
import { supabase, signOut, getCurrentUser } from './supabase-config.js';
import { loadUserData, syncAllToSupabase } from './supabase-sync.js';

// Limpar dados do localStorage
function clearUserDataFromLocalStorage() {
    console.log('🧹 Limpando dados do localStorage...');
    var keysToRemove = [];
    for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key && (key.startsWith('lancamentos_') || key === 'cartoes_credito')) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(function(k) { localStorage.removeItem(k); });
    console.log('✅ Removidas ' + keysToRemove.length + ' chaves');
}

// Verificar autenticação e carregar dados do usuário
async function checkAuthAndLoadData() {
    try {
        var sessionData = await supabase.auth.getSession();
        var session = sessionData.data.session;

        if (!session) {
            window.location.replace('./login.html');
            return false;
        }

        clearUserDataFromLocalStorage();

        var user = await getCurrentUser();
        if (user) {
            console.log('👤 Usuário logado: ' + user.email);
            await loadUserData();
        }

        var userEmailElement = document.getElementById('userEmail');
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

// Mostrar tela de loading de logout (bloqueia tudo e mostra spinner)
function showLoadingLogout() {
    // Injetar @keyframes no <head> — única forma garantida no Android WebView/PWA
    if (!document.getElementById('logout-spinner-style')) {
        var styleTag = document.createElement('style');
        styleTag.id = 'logout-spinner-style';
        styleTag.textContent = [
            '@keyframes logout-spin {',
            '  0%   { transform: rotate(0deg); }',
            '  100% { transform: rotate(360deg); }',
            '}'
        ].join('');
        document.head.appendChild(styleTag);
    }

    // Overlay que cobre TUDO
    var overlay = document.createElement('div');
    overlay.id = 'logout-loading-overlay';
    overlay.style.position      = 'fixed';
    overlay.style.top           = '0';
    overlay.style.left          = '0';
    overlay.style.width         = '100vw';
    overlay.style.height        = '100vh';
    overlay.style.background    = '#ffffff';
    overlay.style.display       = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.alignItems    = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.gap           = '18px';
    overlay.style.zIndex        = '2147483647';
    overlay.style.pointerEvents = 'all';

    // Spinner
    var spinner = document.createElement('div');
    spinner.style.width          = '56px';
    spinner.style.height         = '56px';
    spinner.style.border         = '6px solid #e0e0e0';
    spinner.style.borderTopColor = '#21c45d';
    spinner.style.borderRadius   = '50%';
    spinner.style.animation      = 'logout-spin 0.8s linear infinite';

    // Texto "Saindo..."
    var txt1 = document.createElement('p');
    txt1.textContent      = 'Saindo...';
    txt1.style.margin     = '0';
    txt1.style.fontFamily = 'sans-serif';
    txt1.style.fontWeight = '700';
    txt1.style.fontSize   = '20px';
    txt1.style.color      = '#1a1a1a';

    // Texto secundário
    var txt2 = document.createElement('p');
    txt2.textContent      = 'Sincronizando seus dados';
    txt2.style.margin     = '0';
    txt2.style.fontFamily = 'sans-serif';
    txt2.style.fontSize   = '13px';
    txt2.style.color      = '#999';

    overlay.appendChild(spinner);
    overlay.appendChild(txt1);
    overlay.appendChild(txt2);

    // Adiciona direto no <html> para não ser afetado por overflow:hidden do body
    document.documentElement.appendChild(overlay);
}

// Mostrar modal de confirmação (substitui confirm() que não funciona em PWA Android)
function showLogoutModal() {
    if (document.getElementById('logout-modal-overlay')) return;

    var overlay = document.createElement('div');
    overlay.id = 'logout-modal-overlay';
    overlay.style.position      = 'fixed';
    overlay.style.top           = '0';
    overlay.style.left          = '0';
    overlay.style.width         = '100vw';
    overlay.style.height        = '100vh';
    overlay.style.background    = 'rgba(0,0,0,0.55)';
    overlay.style.display       = 'flex';
    overlay.style.alignItems    = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex        = '2147483646';

    var card = document.createElement('div');
    card.style.background    = '#fff';
    card.style.borderRadius  = '20px';
    card.style.padding       = '28px 24px';
    card.style.margin        = '20px';
    card.style.textAlign     = 'center';
    card.style.boxShadow     = '0 8px 32px rgba(0,0,0,0.18)';
    card.style.maxWidth      = '320px';
    card.style.width         = '100%';
    card.style.fontFamily    = 'sans-serif';

    var emoji = document.createElement('div');
    emoji.textContent        = '👋';
    emoji.style.fontSize     = '40px';
    emoji.style.marginBottom = '12px';

    var titulo = document.createElement('p');
    titulo.textContent      = 'Deseja sair da conta?';
    titulo.style.fontWeight = '700';
    titulo.style.fontSize   = '16px';
    titulo.style.color      = '#1a1a1a';
    titulo.style.margin     = '0 0 6px 0';

    var subtitulo = document.createElement('p');
    subtitulo.textContent   = 'Seus dados serão sincronizados antes de sair.';
    subtitulo.style.fontSize = '13px';
    subtitulo.style.color   = '#666';
    subtitulo.style.margin  = '0 0 24px 0';

    var btnRow = document.createElement('div');
    btnRow.style.display = 'flex';
    btnRow.style.gap     = '10px';

    var btnCancelar = document.createElement('button');
    btnCancelar.textContent        = 'Cancelar';
    btnCancelar.style.flex         = '1';
    btnCancelar.style.background   = '#f0f0f0';
    btnCancelar.style.color        = '#333';
    btnCancelar.style.border       = 'none';
    btnCancelar.style.borderRadius = '10px';
    btnCancelar.style.padding      = '12px';
    btnCancelar.style.fontSize     = '15px';
    btnCancelar.style.fontWeight   = '600';
    btnCancelar.style.cursor       = 'pointer';

    var btnConfirmar = document.createElement('button');
    btnConfirmar.textContent        = 'Sair';
    btnConfirmar.style.flex         = '1';
    btnConfirmar.style.background   = '#e53935';
    btnConfirmar.style.color        = '#fff';
    btnConfirmar.style.border       = 'none';
    btnConfirmar.style.borderRadius = '10px';
    btnConfirmar.style.padding      = '12px';
    btnConfirmar.style.fontSize     = '15px';
    btnConfirmar.style.fontWeight   = '600';
    btnConfirmar.style.cursor       = 'pointer';

    btnCancelar.onclick = function() { overlay.remove(); };
    btnConfirmar.onclick = function() {
        overlay.remove();
        executeLogout();
    };

    btnRow.appendChild(btnCancelar);
    btnRow.appendChild(btnConfirmar);
    card.appendChild(emoji);
    card.appendChild(titulo);
    card.appendChild(subtitulo);
    card.appendChild(btnRow);
    overlay.appendChild(card);

    document.documentElement.appendChild(overlay);
}

// Executar o logout de fato
async function executeLogout() {
    // Mostrar tela de loading ANTES de qualquer await
    showLoadingLogout();

    try {
        var syncPromise = syncAllToSupabase();
        var timeout = new Promise(function(resolve) { setTimeout(resolve, 3000); });
        await Promise.race([syncPromise, timeout]);
    } catch (e) {
        console.warn('⚠️ Sync falhou, saindo mesmo assim:', e);
    }

    try {
        await signOut();
    } catch (e) {
        console.warn('⚠️ signOut falhou:', e);
    }

    window.location.replace('./login.html');
}

// Função exportada (compatibilidade com chamadas externas)
async function logoutAndSync() {
    showLogoutModal();
}

// Adicionar botão de logout
function addLogoutButton() {
    if (document.getElementById('global-logout-btn')) return;

    var logoutBtn = document.createElement('button');
    logoutBtn.id = 'global-logout-btn';
    logoutBtn.innerHTML = '<i class="ri-logout-box-r-line"></i> Sair';
    logoutBtn.style.position     = 'fixed';
    logoutBtn.style.bottom       = '80px';
    logoutBtn.style.right        = '20px';
    logoutBtn.style.background   = '#e53935';
    logoutBtn.style.color        = 'white';
    logoutBtn.style.border       = 'none';
    logoutBtn.style.borderRadius = '30px';
    logoutBtn.style.padding      = '10px 20px';
    logoutBtn.style.fontSize     = '14px';
    logoutBtn.style.fontWeight   = '600';
    logoutBtn.style.cursor       = 'pointer';
    logoutBtn.style.zIndex       = '9999';
    logoutBtn.style.boxShadow    = '0 2px 10px rgba(0,0,0,0.2)';
    logoutBtn.style.display      = 'flex';
    logoutBtn.style.alignItems   = 'center';
    logoutBtn.style.gap          = '8px';

    logoutBtn.onclick = showLogoutModal;
    document.body.appendChild(logoutBtn);
}

// Executar ao carregar página
document.addEventListener('DOMContentLoaded', async function() {
    var isAuthenticated = await checkAuthAndLoadData();
    if (isAuthenticated) {
        addLogoutButton();
    }
});

export { checkAuthAndLoadData, logoutAndSync };