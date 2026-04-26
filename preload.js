const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electron', {
  minimize: () => ipcRenderer.send('win-minimize'),
  maximize: () => ipcRenderer.send('win-maximize'),
  close: () => ipcRenderer.send('win-close'),
  navigate: (page) => ipcRenderer.send('navigate', page),
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  openImageDialog: () => ipcRenderer.invoke('open-image-dialog'),
  getMediaDevices: () => ipcRenderer.invoke('get-media-devices'),
  dbQuery: (text, params) => ipcRenderer.invoke('db-query', { text, params }),
  dbStatus: () => ipcRenderer.invoke('db-status')
});
