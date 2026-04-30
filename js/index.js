document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    // Cordova is now initialized. Have fun!

    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);
    document.getElementById('deviceready').classList.add('ready');
    
    
    // ✅✅✅ CONFIGURAÇÃO DA STATUSBAR - VERSÃO MELHORADA ✅✅✅
    if (typeof StatusBar !== 'undefined') {
    // Aguardar um pouco para garantir que tudo carregou
    setTimeout(function() {
        StatusBar.overlaysWebView(false);
        StatusBar.backgroundColorByHexString("#21c45d"); // Cor do StatusBar
        StatusBar.styleLightContent();
        console.log("✅ StatusBar configurada! Cor: #21c45d"); // Cor do StatusBar
    }, 300);
    } else {
    console.log("❌ Plugin StatusBar não encontrado!");
    }
    // ✅✅✅ FIM DA CONFIGURAÇÃO ✅✅✅

}

function exportarDados() {
  const dados = JSON.stringify(localStorage);
  const blob = new Blob([dados], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "backup-financeiro.json";
  a.click();

  URL.revokeObjectURL(url);
}