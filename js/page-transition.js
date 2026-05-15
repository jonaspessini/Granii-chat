// js/page-transition.js
// Previne flash de ícones (FOUC) sem atrasar a navegação

(function () {
  'use strict';

  // ─── 1. ESCONDER BODY IMEDIATAMENTE (antes do primeiro paint) ────────────
  var style = document.createElement('style');
  style.id = '_pt-init';
  style.textContent = 'body{opacity:0!important}*{-webkit-tap-highlight-color:transparent}';
  document.head.appendChild(style);

  // ─── 2. REVELAR NO DOMContentLoaded (não espera fontes externas) ─────────
  function revealPage() {
    var s = document.getElementById('_pt-init');
    if (s) s.remove();

    // Dois rAF garantem que o browser já pintou o frame com os ícones
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        document.body.style.transition = 'opacity 0.15s ease';
        document.body.style.opacity = '1';
        setTimeout(function () {
          document.body.style.transition = '';
          document.body.style.opacity = '';
        }, 160);
      });
    });
  }

  // DOMContentLoaded é muito mais rápido que 'load' (não espera Google Fonts)
  if (document.readyState !== 'loading') {
    revealPage();
  } else {
    document.addEventListener('DOMContentLoaded', revealPage);
  }

  // ─── 3. NAVEGAÇÃO SEM FADE-OUT (troca imediata, sem delay) ───────────────
  // Fade-out de saída removido — era o responsável pela lentidão.
  window.navigateWithTransition = function (url) {
    window.location.href = url;
  };

  // ─── 4. CORRIGIR BOTÕES DA NAV BAR ───────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    patchNavButtons();
    highlightActiveNavButton();
  });

  function highlightActiveNavButton() {
    var page = window.location.pathname.split('/').pop() || 'index.html';
    var map = { 'index.html': 0, 'index2.html': 1, 'index3.html': 2, 'index4.html': 3, '': 0 };
    var idx = map[page];
    if (idx === undefined) return;
    document.querySelectorAll('.nav-btn').forEach(function (btn, i) {
      btn.classList.toggle('active', i === idx);
    });
  }

  // ─── 5. BOTÃO VOLTAR DO ANDROID (bfcache) ────────────────────────────────
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) revealPage();
  });

})();