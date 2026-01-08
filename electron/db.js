import { initDb } from './db/schema.js';
import { supplierRepo } from './db/repositories/supplierRepo.js';
import { clientRepo } from './db/repositories/clientRepo.js';
import { invoiceRepo } from './db/repositories/invoiceRepo.js';
import { configRepo } from './db/repositories/configRepo.js';
import { companyRepo } from './db/repositories/companyRepo.js';
import { ccRepo } from './db/repositories/ccRepo.js';
import { authService } from './db/authService.js';
import { fileService } from './db/fileService.js';

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
    ...authService,
    ...fileService
};
