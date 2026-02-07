const webview = document.getElementById('main-webview');
const btnRefresh = document.getElementById('btn-refresh');
const btnSettings = document.getElementById('btn-settings');
const btnMinimize = document.getElementById('btn-minimize');
const btnClose = document.getElementById('btn-close');
const btnUpdate = document.getElementById('btn-update');

const updateOverlay = document.getElementById('update-overlay');
const btnYes = document.getElementById('btn-yes');
const btnNo = document.getElementById('btn-no');
const updateActions = document.getElementById('update-actions');
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const statusText = document.getElementById('status-text');
const updateTitle = document.getElementById('update-title');
const updateMsg = document.getElementById('update-msg');

// --- Window Controls ---
btnMinimize.addEventListener('click', () => {
    window.api.minimize();
});

btnClose.addEventListener('click', () => {
    window.api.close();
});

btnSettings.addEventListener('click', () => {
    if(confirm("Uygulama ayarlarını sıfırlayıp URL'i değiştirmek istiyor musunuz?")) {
        window.api.resetSettings();
    }
});

btnRefresh.addEventListener('click', () => {
    if (webview) {
        webview.reload();
    }
});

// --- Initial Load ---
window.api.onLoadUrl((url) => {
    if (webview) {
        webview.src = url;
    }
});

// --- Update Logic ---

// Güncelleme var mı?
window.api.onUpdateAvailable((info) => {
    // Sadece iconu göster veya direkt sor. Kullanıcı "yeni sürüm varsa soru soracak" dedi.
    // İkonu gösterelim, belki kullanıcı o an işini bölmek istemez.
    // AMA talepte "soru soracak" diyor. Direkt popup açalım.
    btnUpdate.style.display = 'flex'; // İkonu da açalım
    
    updateOverlay.style.display = 'flex';
    statusText.innerText = `Sürüm: ${info.version}`;
});

btnNo.addEventListener('click', () => {
    updateOverlay.style.display = 'none';
});

btnUpdate.addEventListener('click', () => {
    updateOverlay.style.display = 'flex';
});

btnYes.addEventListener('click', () => {
    // UI Değişimi
    updateActions.style.display = 'none';
    progressContainer.style.display = 'block';
    updateTitle.innerText = "İndiriliyor...";
    updateMsg.innerText = "Lütfen bekleyiniz, güncelleme indiriliyor.";
    
    // İndirmeyi başlat
    window.api.startDownload();
});

window.api.onDownloadProgress((progressObj) => {
    const percent = progressObj.percent;
    progressBar.style.width = percent + '%';
    statusText.innerText = `İndiriliyor: %${percent.toFixed(1)}`;
});

window.api.onUpdateDownloaded(() => {
    updateTitle.innerText = "Kuruluyor...";
    updateMsg.innerText = "Uygulama yeniden başlatılıyor...";
    progressBar.style.width = '100%';
    statusText.innerText = "Tamamlandı.";
    
    // Main process 2 saniye sonra restart atacak
});

window.api.onUpdateError((err) => {
    updateTitle.innerText = "Hata";
    updateMsg.innerText = "Güncelleme başarısız oldu.";
    statusText.innerText = err;
    setTimeout(() => {
        updateOverlay.style.display = 'none';
        updateActions.style.display = 'flex'; // Reset UI
        progressContainer.style.display = 'none';
    }, 3000);
});
