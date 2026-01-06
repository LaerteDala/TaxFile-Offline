const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    // Expose APIs here
    // example: send: (channel, data) => ipcRenderer.send(channel, data),
});
