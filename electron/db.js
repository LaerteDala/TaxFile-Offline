import { initDb } from './db/schema.js';
import { supplierRepo } from './db/repositories/supplierRepo.js';
import { clientRepo } from './db/repositories/clientRepo.js';
import { invoiceRepo } from './db/repositories/invoiceRepo.js';
import { configRepo } from './db/repositories/configRepo.js';
import { companyRepo } from './db/repositories/companyRepo.js';
import { ccRepo } from './db/repositories/ccRepo.js';
import { staffRepo } from './db/repositories/staffRepo.js';
import { authService } from './db/authService.js';
import { fileService } from './db/fileService.js';
import { remunerationRepo } from './db/repositories/remunerationRepo.js';
import { documentRepo } from './db/repositories/documentRepo.js';
import { deadlineRepo } from './db/repositories/deadlineRepo.js';
import { notificationRepo } from './db/repositories/notificationRepo.js';
import { fiscalRepo } from './db/repositories/fiscalRepo.js';

// Initialize database schema
initDb();

export { initDb };

export const dbOps = {
    ...supplierRepo,
    ...clientRepo,
    ...invoiceRepo,
    ...configRepo,
    ...companyRepo,
    ...ccRepo,
    ...staffRepo,
    ...authService,
    ...fileService,
    ...remunerationRepo,
    ...documentRepo,
    ...deadlineRepo,
    ...notificationRepo,
    ...fiscalRepo
};
