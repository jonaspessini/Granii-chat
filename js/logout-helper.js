// js/logout-helper.js
// Módulo reutilizável de logout com modal e animação para PWA Android

function _logoutInjetarKeyframes() {
    if (document.getElementById('_logout-style')) return;
    var s = document.createElement('style');
    s.id = '_logout-style';
    s.textContent = '@keyframes _logout-spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}';
    document.head.appendChild(s);
}

function _logoutMostrarLoading() {
    _logoutInjetarKeyframes();
    if (document.getElementById('_logout-loading')) return;

    var overlay = document.createElement('div');
    overlay.id = '_logout-loading';
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

    var spinner = document.createElement('div');
    spinner.style.width          = '56px';
    spinner.style.height         = '56px';
    spinner.style.border         = '6px solid #e0e0e0';
    spinner.style.borderTopColor = '#21c45d';
    spinner.style.borderRadius   = '50%';
    spinner.style.animation      = '_logout-spin 0.8s linear infinite';

    var t1 = document.createElement('p');
    t1.textContent      = 'Saindo...';
    t1.style.margin     = '0';
    t1.style.fontFamily = 'sans-serif';
    t1.style.fontWeight = '700';
    t1.style.fontSize   = '20px';
    t1.style.color      = '#1a1a1a';

    var t2 = document.createElement('p');
    t2.textContent      = 'Sincronizando seus dados';
    t2.style.margin     = '0';
    t2.style.fontFamily = 'sans-serif';
    t2.style.fontSize   = '13px';
    t2.style.color      = '#999';

    overlay.appendChild(spinner);
    overlay.appendChild(t1);
    overlay.appendChild(t2);
    document.documentElement.appendChild(overlay);
}

// Executa o logout: mostra loading → sync → signOut → redireciona
async function executarLogout() {
    _logoutMostrarLoading();

    try {
        var { syncAllToSupabase } = await import('./supabase-sync.js');
        var syncPromise = syncAllToSupabase();
        var timeout = new Promise(function(r){ setTimeout(r, 3000); });
        await Promise.race([syncPromise, timeout]);
    } catch(e) {
        console.warn('Sync falhou, saindo mesmo assim:', e);
    }

    try {
        var { signOut } = await import('./supabase-config.js');
        await signOut();
    } catch(e) {
        console.warn('signOut falhou:', e);
    }

    window.location.replace('./login.html');
}

// Mostra modal de confirmação e chama executarLogout se confirmar
function confirmarLogout() {
    if (document.getElementById('_logout-modal')) return;

    _logoutInjetarKeyframes();

    var overlay = document.createElement('div');
    overlay.id = '_logout-modal';
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

    var sub = document.createElement('p');
    sub.textContent   = 'Seus dados serão sincronizados antes de sair.';
    sub.style.fontSize = '13px';
    sub.style.color   = '#666';
    sub.style.margin  = '0 0 24px 0';

    var row = document.createElement('div');
    row.style.display = 'flex';
    row.style.gap     = '10px';

    var btnNao = document.createElement('button');
    btnNao.textContent        = 'Cancelar';
    btnNao.style.flex         = '1';
    btnNao.style.background   = '#f0f0f0';
    btnNao.style.color        = '#333';
    btnNao.style.border       = 'none';
    btnNao.style.borderRadius = '10px';
    btnNao.style.padding      = '12px';
    btnNao.style.fontSize     = '15px';
    btnNao.style.fontWeight   = '600';
    btnNao.style.cursor       = 'pointer';

    var btnSim = document.createElement('button');
    btnSim.textContent        = 'Sair';
    btnSim.style.flex         = '1';
    btnSim.style.background   = '#e53935';
    btnSim.style.color        = '#fff';
    btnSim.style.border       = 'none';
    btnSim.style.borderRadius = '10px';
    btnSim.style.padding      = '12px';
    btnSim.style.fontSize     = '15px';
    btnSim.style.fontWeight   = '600';
    btnSim.style.cursor       = 'pointer';

    btnNao.onclick = function() { overlay.remove(); };
    btnSim.onclick = function() { overlay.remove(); executarLogout(); };

    row.appendChild(btnNao);
    row.appendChild(btnSim);
    card.appendChild(emoji);
    card.appendChild(titulo);
    card.appendChild(sub);
    card.appendChild(row);
    overlay.appendChild(card);
    document.documentElement.appendChild(overlay);
}

// Expor globalmente para que o HTML consiga chamar
window.confirmarLogout = confirmarLogout;
window.executarLogout = executarLogout;