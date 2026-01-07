import electron from 'electron';
const { app, BrowserWindow, ipcMain } = electron;
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb, dbOps } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
    const isDev = !app.isPackaged;
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        icon: path.join(__dirname, isDev ? '../public/icon.png' : '../dist/icon.png')
    });

    if (isDev) {
        win.loadURL('http://localhost:3000');
    } else {
        win.loadFile(path.join(__dirname, '../dist/index.html'));
    }
}

import pkg from 'electron-updater';
const { autoUpdater } = pkg;

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

// IPC Handlers
ipcMain.handle('db:getSuppliers', async () => dbOps.getSuppliers());
ipcMain.handle('db:addSupplier', async (_, supplier) => dbOps.addSupplier(supplier));
ipcMain.handle('db:updateSupplier', async (_, supplier) => dbOps.updateSupplier(supplier));
ipcMain.handle('db:deleteSupplier', async (_, id) => dbOps.deleteSupplier(id));

ipcMain.handle('db:getDocumentTypes', async () => dbOps.getDocumentTypes());
ipcMain.handle('db:addDocumentType', async (_, docType) => dbOps.addDocumentType(docType));
ipcMain.handle('db:updateDocumentType', async (_, docType) => dbOps.updateDocumentType(docType));
ipcMain.handle('db:deleteDocumentType', async (_, id) => dbOps.deleteDocumentType(id));
ipcMain.handle('db:getWithholdingTypes', async () => dbOps.getWithholdingTypes());
ipcMain.handle('db:addWithholdingType', async (_, wt) => dbOps.addWithholdingType(wt));
ipcMain.handle('db:updateWithholdingType', async (_, wt) => dbOps.updateWithholdingType(wt));
ipcMain.handle('db:deleteWithholdingType', async (_, id) => dbOps.deleteWithholdingType(id));


ipcMain.handle('db:getInvoices', async () => dbOps.getInvoices());
ipcMain.handle('db:addInvoice', async (_, { invoice, taxLines }) => dbOps.addInvoice(invoice, taxLines));
ipcMain.handle('db:updateInvoice', async (_, { invoice, taxLines }) => dbOps.updateInvoice(invoice, taxLines));
ipcMain.handle('db:deleteInvoice', async (_, id) => dbOps.deleteInvoice(id));

ipcMain.handle('fs:saveFile', async (_, { fileName, buffer }) => dbOps.saveFile(fileName, buffer));
ipcMain.handle('fs:openFile', async (_, filePath) => dbOps.openFile(filePath));
ipcMain.handle('fs:readFile', async (_, filePath) => dbOps.readFile(filePath));
ipcMain.handle('db:getCCDocuments', async () => dbOps.getCCDocuments());
ipcMain.handle('db:addCCDocument', async (_, doc) => dbOps.addCCDocument(doc));
ipcMain.handle('db:updateCCDocument', async (_, doc) => dbOps.updateCCDocument(doc));
ipcMain.handle('db:deleteCCDocument', async (_, id) => dbOps.deleteCCDocument(id));



ipcMain.handle('auth:login', async (_, { email, password }) => dbOps.login(email, password));


app.whenReady().then(() => {
    initDb();
    createWindow();

    if (app.isPackaged) {
        autoUpdater.checkForUpdatesAndNotify();
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

