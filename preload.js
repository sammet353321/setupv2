const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // Config
    saveConfig: (url) => ipcRenderer.invoke('save-config', url),
    
    // Window Controls
    minimize: () => ipcRenderer.send('minimize-window'),
    close: () => ipcRenderer.send('close-window'),
    resetSettings: () => ipcRenderer.send('open-settings'),
    
    // Update Events
    onUpdateAvailable: (callback) => ipcRenderer.on('update-available', (event, ...args) => callback(...args)),
    onUpdateNotAvailable: (callback) => ipcRenderer.on('update-not-available', (event, ...args) => callback(...args)), // Yeni eklendi
    onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (event, ...args) => callback(...args)),
    onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', (event, ...args) => callback(...args)),
    onUpdateError: (callback) => ipcRenderer.on('update-error', (event, ...args) => callback(...args)),
    
    // Actions
    startDownload: () => ipcRenderer.send('start-download'),
    
    // Initial Load
    onLoadUrl: (callback) => ipcRenderer.on('load-url', (event, url) => callback(url))
});
