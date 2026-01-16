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
ipcMain.handle('db:addInvoice', async (_, data) => dbOps.addInvoice(data));
ipcMain.handle('db:updateInvoice', async (_, data) => dbOps.updateInvoice(data));
ipcMain.handle('db:deleteInvoice', async (_, id) => dbOps.deleteInvoice(id));

ipcMain.handle('fs:saveFile', async (_, { fileName, buffer }) => dbOps.saveFile(fileName, buffer));
ipcMain.handle('fs:openFile', async (_, filePath) => dbOps.openFile(filePath));
ipcMain.handle('fs:readFile', async (_, filePath) => dbOps.readFile(filePath));
ipcMain.handle('fs:downloadFile', async (_, data) => dbOps.downloadFile(data));
ipcMain.handle('db:getCCDocuments', async () => dbOps.getCCDocuments());
ipcMain.handle('db:addCCDocument', async (_, doc) => dbOps.addCCDocument(doc));
ipcMain.handle('db:updateCCDocument', async (_, doc) => dbOps.updateCCDocument(doc));
ipcMain.handle('db:deleteCCDocument', async (_, id) => dbOps.deleteCCDocument(id));

ipcMain.handle('db:getProvinces', async () => dbOps.getProvinces());
ipcMain.handle('db:addProvince', async (_, province) => dbOps.addProvince(province));
ipcMain.handle('db:updateProvince', async (_, province) => dbOps.updateProvince(province));
ipcMain.handle('db:deleteProvince', async (_, id) => dbOps.deleteProvince(id));

ipcMain.handle('db:getMunicipalities', async () => dbOps.getMunicipalities());
ipcMain.handle('db:addMunicipality', async (_, municipality) => dbOps.addMunicipality(municipality));
ipcMain.handle('db:updateMunicipality', async (_, municipality) => dbOps.updateMunicipality(municipality));
ipcMain.handle('db:deleteMunicipality', async (_, id) => dbOps.deleteMunicipality(id));

ipcMain.handle('db:getSupplierAttachments', async (_, supplierId) => dbOps.getSupplierAttachments(supplierId));
ipcMain.handle('db:addSupplierAttachment', async (_, attachment) => dbOps.addSupplierAttachment(attachment));
ipcMain.handle('db:deleteSupplierAttachment', async (_, id) => dbOps.deleteSupplierAttachment(id));

ipcMain.handle('db:getClients', async () => dbOps.getClients());
ipcMain.handle('db:addClient', async (_, client) => dbOps.addClient(client));
ipcMain.handle('db:updateClient', async (_, client) => dbOps.updateClient(client));
ipcMain.handle('db:deleteClient', async (_, id) => dbOps.deleteClient(id));

ipcMain.handle('db:getClientAttachments', async (_, clientId) => dbOps.getClientAttachments(clientId));
ipcMain.handle('db:addClientAttachment', async (_, attachment) => dbOps.addClientAttachment(attachment));
ipcMain.handle('db:deleteClientAttachment', async (_, id) => dbOps.deleteClientAttachment(id));

ipcMain.handle('db:getCompanyInfo', async () => dbOps.getCompanyInfo());
ipcMain.handle('db:updateCompanyInfo', async (_, company) => dbOps.updateCompanyInfo(company));
ipcMain.handle('db:getCompanyAttachments', async (_, companyId) => dbOps.getCompanyAttachments(companyId));
ipcMain.handle('db:addCompanyAttachment', async (_, attachment) => dbOps.addCompanyAttachment(attachment));
ipcMain.handle('db:deleteCompanyAttachment', async (_, id) => dbOps.deleteCompanyAttachment(id));

ipcMain.handle('db:getStaff', async () => dbOps.getStaff());
ipcMain.handle('db:addStaff', async (_, staff) => dbOps.addStaff(staff));
ipcMain.handle('db:updateStaff', async (_, staff) => dbOps.updateStaff(staff));
ipcMain.handle('db:deleteStaff', async (_, id) => dbOps.deleteStaff(id));
ipcMain.handle('db:getStaffAttachments', async (_, staffId) => dbOps.getStaffAttachments(staffId));
ipcMain.handle('db:addStaffAttachment', async (_, attachment) => dbOps.addStaffAttachment(attachment));
ipcMain.handle('db:deleteStaffAttachment', async (_, id) => dbOps.deleteStaffAttachment(id));

ipcMain.handle('db:getDepartments', async () => dbOps.getDepartments());
ipcMain.handle('db:addDepartment', async (_, dept) => dbOps.addDepartment(dept));
ipcMain.handle('db:updateDepartment', async (_, dept) => dbOps.updateDepartment(dept));
ipcMain.handle('db:deleteDepartment', async (_, id) => dbOps.deleteDepartment(id));

ipcMain.handle('db:getJobFunctions', async () => dbOps.getJobFunctions());
ipcMain.handle('db:addJobFunction', async (_, jf) => dbOps.addJobFunction(jf));
ipcMain.handle('db:updateJobFunction', async (_, jf) => dbOps.updateJobFunction(jf));
ipcMain.handle('db:deleteJobFunction', async (_, id) => dbOps.deleteJobFunction(id));

ipcMain.handle('db:getIRTScales', async () => dbOps.getIRTScales());
ipcMain.handle('db:addIRTScale', async (_, scale) => dbOps.addIRTScale(scale));
ipcMain.handle('db:updateIRTScale', async (_, scale) => dbOps.updateIRTScale(scale));
ipcMain.handle('db:deleteIRTScale', async (_, id) => dbOps.deleteIRTScale(id));

ipcMain.handle('db:getSubsidies', async () => dbOps.getSubsidies());
ipcMain.handle('db:addSubsidy', async (_, subsidy) => dbOps.addSubsidy(subsidy));
ipcMain.handle('db:updateSubsidy', async (_, subsidy) => dbOps.updateSubsidy(subsidy));
ipcMain.handle('db:deleteSubsidy', async (_, id) => dbOps.deleteSubsidy(id));
ipcMain.handle('db:getRemunerationMaps', async () => dbOps.getRemunerationMaps());
ipcMain.handle('db:getRemunerationMap', async (_, id) => dbOps.getRemunerationMap(id));
ipcMain.handle('db:addRemunerationMap', async (_, map) => dbOps.addRemunerationMap(map));
ipcMain.handle('db:updateRemunerationMapStatus', async (_, { id, status }) => dbOps.updateRemunerationMapStatus(id, status));
ipcMain.handle('db:deleteRemunerationMap', async (_, id) => dbOps.deleteRemunerationMap(id));

ipcMain.handle('db:addRemunerationLine', async (_, line) => dbOps.addRemunerationLine(line));
ipcMain.handle('db:updateRemunerationLine', async (_, line) => dbOps.updateRemunerationLine(line));
ipcMain.handle('db:deleteRemunerationLine', async (_, id) => dbOps.deleteRemunerationLine(id));

ipcMain.handle('db:addRemunerationLineSubsidy', async (_, subsidy) => dbOps.addRemunerationLineSubsidy(subsidy));
ipcMain.handle('db:deleteRemunerationLineSubsidies', async (_, lineId) => dbOps.deleteRemunerationLineSubsidies(lineId));

// Fiscal Classifications
ipcMain.handle('db:getIVAClassifications', async () => dbOps.getIVAClassifications());
ipcMain.handle('db:addIVAClassification', async (_, iva) => dbOps.addIVAClassification(iva));
ipcMain.handle('db:updateIVAClassification', async (_, iva) => dbOps.updateIVAClassification(iva));
ipcMain.handle('db:deleteIVAClassification', async (_, id) => dbOps.deleteIVAClassification(id));
ipcMain.handle('db:seedDefaultIVA', async () => dbOps.seedDefaultIVA());

ipcMain.handle('db:getStampDutyClassifications', async () => dbOps.getStampDutyClassifications());
ipcMain.handle('db:addStampDutyClassification', async (_, sd) => dbOps.addStampDutyClassification(sd));
ipcMain.handle('db:updateStampDutyClassification', async (_, sd) => dbOps.updateStampDutyClassification(sd));
ipcMain.handle('db:deleteStampDutyClassification', async (_, id) => dbOps.deleteStampDutyClassification(id));

ipcMain.handle('db:getIndustrialTaxClassifications', async () => dbOps.getIndustrialTaxClassifications());
ipcMain.handle('db:addIndustrialTaxClassification', async (_, it) => dbOps.addIndustrialTaxClassification(it));
ipcMain.handle('db:updateIndustrialTaxClassification', async (_, it) => dbOps.updateIndustrialTaxClassification(it));
ipcMain.handle('db:deleteIndustrialTaxClassification', async (_, id) => dbOps.deleteIndustrialTaxClassification(id));

// Archives
ipcMain.handle('db:getArchives', async () => dbOps.getArchives());
ipcMain.handle('db:addArchive', async (_, archive) => dbOps.addArchive(archive));
ipcMain.handle('db:updateArchive', async (_, archive) => dbOps.updateArchive(archive));
ipcMain.handle('db:deleteArchive', async (_, id) => dbOps.deleteArchive(id));

// General Documents
ipcMain.handle('db:getGeneralDocuments', async () => dbOps.getGeneralDocuments());
ipcMain.handle('db:addGeneralDocument', async (_, doc) => dbOps.addGeneralDocument(doc));
ipcMain.handle('db:updateGeneralDocument', async (_, doc) => dbOps.updateGeneralDocument(doc));
ipcMain.handle('db:deleteGeneralDocument', async (_, id) => dbOps.deleteGeneralDocument(id));

ipcMain.handle('db:getGeneralDocumentAttachments', async (_, docId) => dbOps.getGeneralDocumentAttachments(docId));
ipcMain.handle('db:addGeneralDocumentAttachment', async (_, attachment) => dbOps.addGeneralDocumentAttachment(attachment));
ipcMain.handle('db:deleteGeneralDocumentAttachment', async (_, id) => dbOps.deleteGeneralDocumentAttachment(id));

ipcMain.handle('db:getDocumentsInArchive', async (_, archiveId) => dbOps.getDocumentsInArchive(archiveId));
ipcMain.handle('db:searchLinkableDocuments', async (_, filters) => dbOps.searchLinkableDocuments(filters));
ipcMain.handle('db:linkDocumentToArchive', async (_, { docType, docId, archiveId }) => dbOps.linkDocumentToArchive(docType, docId, archiveId));
ipcMain.handle('db:unlinkDocumentFromArchive', async (_, { docType, docId, archiveId }) => dbOps.unlinkDocumentFromArchive(docType, docId, archiveId));
ipcMain.handle('db:getDeadlineConfigs', async () => dbOps.getDeadlineConfigs());
ipcMain.handle('db:updateDeadlineConfig', async (_, config) => dbOps.updateDeadlineConfig(config));
ipcMain.handle('db:getUpcomingDeadlines', async () => dbOps.getUpcomingDeadlines());
ipcMain.handle('db:getDeadlineSummary', async () => dbOps.getDeadlineSummary());

ipcMain.handle('db:getNotifications', async () => dbOps.getNotifications());
ipcMain.handle('db:markAsRead', async (_, id) => dbOps.markAsRead(id));
ipcMain.handle('db:markAllAsRead', async () => dbOps.markAllAsRead());
ipcMain.handle('db:addNotification', async (_, data) => dbOps.addNotification(data));
ipcMain.handle('db:deleteNotification', async (_, id) => dbOps.deleteNotification(id));

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

