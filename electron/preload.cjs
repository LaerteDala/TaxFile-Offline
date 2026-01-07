const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    db: {
        getSuppliers: () => ipcRenderer.invoke('db:getSuppliers'),
        addSupplier: (supplier) => ipcRenderer.invoke('db:addSupplier', supplier),
        updateSupplier: (supplier) => ipcRenderer.invoke('db:updateSupplier', supplier),
        deleteSupplier: (id) => ipcRenderer.invoke('db:deleteSupplier', id),
        getInvoices: () => ipcRenderer.invoke('db:getInvoices'),
        addInvoice: (invoice, taxLines) => ipcRenderer.invoke('db:addInvoice', { invoice, taxLines }),
        updateInvoice: (invoice, taxLines) => ipcRenderer.invoke('db:updateInvoice', { invoice, taxLines }),
        deleteInvoice: (id) => ipcRenderer.invoke('db:deleteInvoice', id),
        getDocumentTypes: () => ipcRenderer.invoke('db:getDocumentTypes'),
        addDocumentType: (docType) => ipcRenderer.invoke('db:addDocumentType', docType),
        updateDocumentType: (docType) => ipcRenderer.invoke('db:updateDocumentType', docType),
        deleteDocumentType: (id) => ipcRenderer.invoke('db:deleteDocumentType', id),
    },

    fs: {
        saveFile: (fileName, buffer) => ipcRenderer.invoke('fs:saveFile', { fileName, buffer }),
        openFile: (filePath) => ipcRenderer.invoke('fs:openFile', filePath),
        readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
    },


    auth: {

        login: (email, password) => ipcRenderer.invoke('auth:login', { email, password }),
    }
});

