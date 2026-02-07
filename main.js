const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

// Logging setup
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

// Auto-update config
autoUpdater.autoDownload = false; // Kullanıcıya soracağız

let mainWindow;
let setupWindow;

// Config file path - Executable'ın yanına kaydetmek için
const isDev = !app.isPackaged;
const configPath = isDev 
    ? path.join(__dirname, 'config.json') 
    : path.join(path.dirname(process.execPath), 'config.json');

function createSetupWindow() {
    setupWindow = new BrowserWindow({
        width: 500,
        height: 400,
        title: 'Koç Sigortam Kurulum',
        icon: path.join(__dirname, 'build/icon.png'), // Icon dosyasını build klasöründen alacağız (varsa)
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        },
        autoHideMenuBar: true
    });

    setupWindow.loadFile(path.join(__dirname, 'src/setup.html'));

    setupWindow.on('closed', () => {
        setupWindow = null;
    });
}

function createMainWindow(url) {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        title: 'Koç Sigortam',
        frame: false, // Çerçevesiz
        icon: path.join(__dirname, 'build/icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            webviewTag: true, // WebView kullanacağız
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'src/index.html'));
    
    // Yüklendikten sonra URL'i renderer'a gönder
    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('load-url', url);
        // Güncellemeleri kontrol et
        if (!isDev) {
            autoUpdater.checkForUpdates();
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.on('ready', () => {
    if (fs.existsSync(configPath)) {
        try {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            if (config.url) {
                createMainWindow(config.url);
            } else {
                createSetupWindow();
            }
        } catch (e) {
            console.error('Config okuma hatası:', e);
            createSetupWindow();
        }
    } else {
        createSetupWindow();
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// --- IPC Handlers ---

// Config Kaydetme
ipcMain.handle('save-config', async (event, url) => {
    try {
        // URL doğrulama basitçe
        if (!url.startsWith('http')) {
            url = 'https://' + url;
        }
        const config = { url: url };
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        
        // Setup penceresini kapat, ana pencereyi aç
        if (setupWindow) setupWindow.close();
        createMainWindow(url);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Pencere Kontrolleri
ipcMain.on('minimize-window', () => {
    if (mainWindow) mainWindow.minimize();
});

ipcMain.on('close-window', () => {
    if (mainWindow) mainWindow.close();
});

ipcMain.on('open-settings', () => {
    // Ayarlar için setup ekranına geri dönebiliriz veya config dosyasını sildirebiliriz
    // Basitlik için config silip yeniden başlatacağız
    try {
        if (fs.existsSync(configPath)) {
            fs.unlinkSync(configPath);
        }
        app.relaunch();
        app.exit();
    } catch (e) {
        console.error(e);
    }
});

// Update İşlemleri
autoUpdater.on('update-available', (info) => {
    if (mainWindow) mainWindow.webContents.send('update-available', info);
});

autoUpdater.on('update-not-available', (info) => {
    // log.info('Update not available.');
});

autoUpdater.on('error', (err) => {
    if (mainWindow) mainWindow.webContents.send('update-error', err.message);
});

autoUpdater.on('download-progress', (progressObj) => {
    if (mainWindow) mainWindow.webContents.send('download-progress', progressObj);
});

autoUpdater.on('update-downloaded', (info) => {
    if (mainWindow) mainWindow.webContents.send('update-downloaded', info);
    // İndirme bitti, hemen kurmak yerine kullanıcıya "Kuruluyor" ekranı gösterdikten sonra:
    setTimeout(() => {
        autoUpdater.quitAndInstall();
    }, 2000); // 2 saniye bekle
});

ipcMain.on('start-download', () => {
    autoUpdater.downloadUpdate();
});
