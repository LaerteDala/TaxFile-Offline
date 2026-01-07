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
        getWithholdingTypes: () => ipcRenderer.invoke('db:getWithholdingTypes'),
        addWithholdingType: (wt) => ipcRenderer.invoke('db:addWithholdingType', wt),
        updateWithholdingType: (wt) => ipcRenderer.invoke('db:updateWithholdingType', wt),
        deleteWithholdingType: (id) => ipcRenderer.invoke('db:deleteWithholdingType', id),
        getCCDocuments: () => ipcRenderer.invoke('db:getCCDocuments'),
        addCCDocument: (doc) => ipcRenderer.invoke('db:addCCDocument', doc),
        updateCCDocument: (doc) => ipcRenderer.invoke('db:updateCCDocument', doc),
        deleteCCDocument: (id) => ipcRenderer.invoke('db:deleteCCDocument', id),
        getProvinces: () => ipcRenderer.invoke('db:getProvinces'),
        addProvince: (province) => ipcRenderer.invoke('db:addProvince', province),
        updateProvince: (province) => ipcRenderer.invoke('db:updateProvince', province),
        deleteProvince: (id) => ipcRenderer.invoke('db:deleteProvince', id),
        getMunicipalities: () => ipcRenderer.invoke('db:getMunicipalities'),
        addMunicipality: (municipality) => ipcRenderer.invoke('db:addMunicipality', municipality),
        updateMunicipality: (municipality) => ipcRenderer.invoke('db:updateMunicipality', municipality),
        deleteMunicipality: (id) => ipcRenderer.invoke('db:deleteMunicipality', id),
        getSupplierAttachments: (supplierId) => ipcRenderer.invoke('db:getSupplierAttachments', supplierId),
        addSupplierAttachment: (attachment) => ipcRenderer.invoke('db:addSupplierAttachment', attachment),
        deleteSupplierAttachment: (id) => ipcRenderer.invoke('db:deleteSupplierAttachment', id),
        getClients: () => ipcRenderer.invoke('db:getClients'),
        addClient: (client) => ipcRenderer.invoke('db:addClient', client),
        updateClient: (client) => ipcRenderer.invoke('db:updateClient', client),
        deleteClient: (id) => ipcRenderer.invoke('db:deleteClient', id),
        getClientAttachments: (clientId) => ipcRenderer.invoke('db:getClientAttachments', clientId),
        addClientAttachment: (attachment) => ipcRenderer.invoke('db:addClientAttachment', attachment),
        deleteClientAttachment: (id) => ipcRenderer.invoke('db:deleteClientAttachment', id),
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

