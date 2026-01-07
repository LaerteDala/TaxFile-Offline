
import Database from 'better-sqlite3';
import path from 'path';
import { app, shell } from 'electron';
import fs from 'fs';
import crypto from 'crypto';

const isDev = !app.isPackaged;
const dbPath = isDev
    ? path.join(process.cwd(), 'database.sqlite')
    : path.join(app.getPath('userData'), 'database.sqlite');

const db = new Database(dbPath);

// Initialize database schema
export function initDb() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS suppliers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            nif TEXT,
            address TEXT,
            email TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS document_types (
            id TEXT PRIMARY KEY,
            code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS invoices (
            id TEXT PRIMARY KEY,
            order_number INTEGER,
            supplier_id TEXT,
            document_type_id TEXT,
            date TEXT,
            document_number TEXT,
            notes TEXT,
            has_pdf INTEGER DEFAULT 0,
            pdf_path TEXT,
            total_taxable REAL DEFAULT 0,
            total_supported REAL DEFAULT 0,
            total_deductible REAL DEFAULT 0,
            total_withholding REAL DEFAULT 0,
            total_document REAL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
            FOREIGN KEY (document_type_id) REFERENCES document_types(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS tax_lines (
            id TEXT PRIMARY KEY,
            invoice_id TEXT,
            taxable_value REAL DEFAULT 0,
            rate REAL DEFAULT 0,
            supported_vat REAL DEFAULT 0,
            deductible_vat REAL DEFAULT 0,
            is_service INTEGER DEFAULT 0,
            withholding_amount REAL DEFAULT 0,
            FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS withholding_types (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            rate REAL NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE,
            password TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS cc_documents (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            nature TEXT NOT NULL,
            reference_number TEXT,
            year INTEGER,
            period TEXT,
            tax_type TEXT,
            related_tax TEXT,
            description TEXT,
            taxable_value REAL DEFAULT 0,
            rate REAL DEFAULT 0,
            amount_to_pay REAL DEFAULT 0,
            interest REAL DEFAULT 0,
            fines REAL DEFAULT 0,
            total_amount REAL DEFAULT 0,
            issue_date TEXT,
            due_date TEXT,
            receipt_date TEXT,
            attachment_path TEXT,
            has_attachment INTEGER DEFAULT 0,
            related_document_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (related_document_id) REFERENCES cc_documents(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS provinces (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS municipalities (
            id TEXT PRIMARY KEY,
            province_id TEXT,
            name TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (province_id) REFERENCES provinces(id) ON DELETE CASCADE,
            UNIQUE(province_id, name)
        );

        CREATE TABLE IF NOT EXISTS supplier_attachments (
            id TEXT PRIMARY KEY,
            supplier_id TEXT,
            title TEXT NOT NULL,
            file_path TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS clients (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            nif TEXT,
            address TEXT,
            email TEXT,
            in_angola INTEGER DEFAULT 1,
            iva_regime TEXT DEFAULT 'Geral',
            province_id TEXT,
            municipality_id TEXT,
            conformity_declaration_number TEXT,
            type TEXT DEFAULT 'Normal',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS client_attachments (
            id TEXT PRIMARY KEY,
            client_id TEXT,
            title TEXT NOT NULL,
            file_path TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
        );
    `);

    // Migrations: Add columns if they don't exist
    const tableInfoSuppliers = db.prepare("PRAGMA table_info(suppliers)").all();
    const hasInAngola = tableInfoSuppliers.some(col => col.name === 'in_angola');
    const hasIvaRegime = tableInfoSuppliers.some(col => col.name === 'iva_regime');
    const hasProvinceId = tableInfoSuppliers.some(col => col.name === 'province_id');
    const hasMunicipalityId = tableInfoSuppliers.some(col => col.name === 'municipality_id');
    const hasConformityNumber = tableInfoSuppliers.some(col => col.name === 'conformity_declaration_number');

    if (!hasInAngola) db.exec("ALTER TABLE suppliers ADD COLUMN in_angola INTEGER DEFAULT 1;");
    if (!hasIvaRegime) db.exec("ALTER TABLE suppliers ADD COLUMN iva_regime TEXT DEFAULT 'Geral';");
    if (!hasProvinceId) db.exec("ALTER TABLE suppliers ADD COLUMN province_id TEXT;");
    if (!hasMunicipalityId) db.exec("ALTER TABLE suppliers ADD COLUMN municipality_id TEXT;");
    if (!hasConformityNumber) db.exec("ALTER TABLE suppliers ADD COLUMN conformity_declaration_number TEXT;");

    const tableInfoClients = db.prepare("PRAGMA table_info(clients)").all();
    const hasClientType = tableInfoClients.some(col => col.name === 'type');
    if (!hasClientType) db.exec("ALTER TABLE clients ADD COLUMN type TEXT DEFAULT 'Normal';");

    const tableInfoInvoices = db.prepare("PRAGMA table_info(invoices)").all();
    const hasDocTypeId = tableInfoInvoices.some(col => col.name === 'document_type_id');
    const hasTotalWithholding = tableInfoInvoices.some(col => col.name === 'total_withholding');

    if (!hasDocTypeId) {
        db.exec("ALTER TABLE invoices ADD COLUMN document_type_id TEXT;");
    }
    if (!hasTotalWithholding) {
        db.exec("ALTER TABLE invoices ADD COLUMN total_withholding REAL DEFAULT 0;");
    }

    const tableInfoTaxLines = db.prepare("PRAGMA table_info(tax_lines)").all();
    const hasIsService = tableInfoTaxLines.some(col => col.name === 'is_service');
    const hasWithholdingAmount = tableInfoTaxLines.some(col => col.name === 'withholding_amount');
    const hasWithholdingTypeId = tableInfoTaxLines.some(col => col.name === 'withholding_type_id');

    if (!hasIsService) {
        db.exec("ALTER TABLE tax_lines ADD COLUMN is_service INTEGER DEFAULT 0;");
    }
    if (!hasWithholdingAmount) {
        db.exec("ALTER TABLE tax_lines ADD COLUMN withholding_amount REAL DEFAULT 0;");
    }
    if (!hasWithholdingTypeId) {
        db.exec("ALTER TABLE tax_lines ADD COLUMN withholding_type_id TEXT;");
    }

    // Add default document types if none exist
    const docTypeCount = db.prepare('SELECT count(*) as count FROM document_types').get().count;
    if (docTypeCount === 0) {
        const insertDocType = db.prepare('INSERT INTO document_types (id, code, name) VALUES (?, ?, ?)');
        insertDocType.run(crypto.randomUUID(), 'FT', 'Factura');
        insertDocType.run(crypto.randomUUID(), 'FR', 'Factura Recibo');
        insertDocType.run(crypto.randomUUID(), 'RC', 'Recibo');
    }

    // Add default withholding types if none exist
    const withholdingTypeCount = db.prepare('SELECT count(*) as count FROM withholding_types').get().count;
    if (withholdingTypeCount === 0) {
        const insertWithholdingType = db.prepare('INSERT INTO withholding_types (id, name, rate) VALUES (?, ?, ?)');
        insertWithholdingType.run(crypto.randomUUID(), 'Imposto Industrial', 6.5);
        insertWithholdingType.run(crypto.randomUUID(), 'IRT Grupo B', 6.5);
        insertWithholdingType.run(crypto.randomUUID(), 'Imposto Predial', 15.0);
    }

    // Add a default user if none exists (for local login)
    const userCount = db.prepare('SELECT count(*) as count FROM users').get().count;
    if (userCount === 0) {
        db.prepare('INSERT INTO users (id, email, password) VALUES (?, ?, ?)').run(
            crypto.randomUUID(),
            'admin@taxfile.com',
            'admin'
        );
    }
}

export const dbOps = {
    // Suppliers
    getSuppliers: () => {
        const suppliers = db.prepare('SELECT * FROM suppliers ORDER BY name').all();
        return suppliers.map(s => {
            const attachments = db.prepare('SELECT * FROM supplier_attachments WHERE supplier_id = ?').all(s.id);
            return {
                ...s,
                inAngola: !!s.in_angola,
                ivaRegime: s.iva_regime,
                provinceId: s.province_id,
                municipalityId: s.municipality_id,
                conformityDeclarationNumber: s.conformity_declaration_number,
                attachments: attachments.map(a => ({
                    id: a.id,
                    supplierId: a.supplier_id,
                    title: a.title,
                    filePath: a.file_path
                }))
            };
        });
    },
    addSupplier: (supplier) => {
        const stmt = db.prepare(`
            INSERT INTO suppliers (
                id, name, nif, address, email, in_angola, iva_regime, 
                province_id, municipality_id, conformity_declaration_number
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(
            supplier.id, supplier.name, supplier.nif, supplier.address, supplier.email,
            supplier.inAngola ? 1 : 0, supplier.ivaRegime,
            supplier.provinceId, supplier.municipalityId, supplier.conformityDeclarationNumber
        );
    },
    updateSupplier: (supplier) => {
        const stmt = db.prepare(`
            UPDATE suppliers SET 
                name = ?, nif = ?, address = ?, email = ?, in_angola = ?, 
                iva_regime = ?, province_id = ?, municipality_id = ?, 
                conformity_declaration_number = ? 
            WHERE id = ?
        `);
        return stmt.run(
            supplier.name, supplier.nif, supplier.address, supplier.email,
            supplier.inAngola ? 1 : 0, supplier.ivaRegime,
            supplier.provinceId, supplier.municipalityId, supplier.conformityDeclarationNumber,
            supplier.id
        );
    },
    deleteSupplier: (id) => db.prepare('DELETE FROM suppliers WHERE id = ?').run(id),

    // Document Types
    getDocumentTypes: () => db.prepare('SELECT * FROM document_types ORDER BY code').all(),
    addDocumentType: (docType) => {
        const stmt = db.prepare('INSERT INTO document_types (id, code, name) VALUES (?, ?, ?)');
        return stmt.run(docType.id, docType.code, docType.name);
    },
    updateDocumentType: (docType) => {
        const stmt = db.prepare('UPDATE document_types SET code = ?, name = ? WHERE id = ?');
        return stmt.run(docType.code, docType.name, docType.id);
    },
    deleteDocumentType: (id) => db.prepare('DELETE FROM document_types WHERE id = ?').run(id),

    // Withholding Types
    getWithholdingTypes: () => db.prepare('SELECT * FROM withholding_types ORDER BY name').all(),
    addWithholdingType: (wt) => {
        const stmt = db.prepare('INSERT INTO withholding_types (id, name, rate) VALUES (?, ?, ?)');
        return stmt.run(wt.id, wt.name, wt.rate);
    },
    updateWithholdingType: (wt) => {
        const stmt = db.prepare('UPDATE withholding_types SET name = ?, rate = ? WHERE id = ?');
        return stmt.run(wt.name, wt.rate, wt.id);
    },
    deleteWithholdingType: (id) => db.prepare('DELETE FROM withholding_types WHERE id = ?').run(id),

    // Invoices
    getInvoices: () => {
        const invoices = db.prepare(`
            SELECT i.*, dt.code as document_type_code, dt.name as document_type_name
            FROM invoices i
            LEFT JOIN document_types dt ON i.document_type_id = dt.id
            ORDER BY i.created_at DESC
        `).all();
        return invoices.map(inv => {
            const lines = db.prepare('SELECT * FROM tax_lines WHERE invoice_id = ?').all(inv.id);
            return {
                ...inv,
                order_number: inv.order_number,
                supplier_id: inv.supplier_id,
                document_type_id: inv.document_type_id,
                has_pdf: !!inv.has_pdf,
                tax_lines: lines.map(l => ({
                    ...l,
                    is_service: !!l.is_service,
                    withholding_type_id: l.withholding_type_id
                }))
            };
        });
    },
    addInvoice: (invoice, taxLines) => {
        const insertInvoice = db.prepare(`
            INSERT INTO invoices (
                id, order_number, supplier_id, document_type_id, date, document_number, notes, 
                has_pdf, pdf_path, total_taxable, total_supported, 
                total_deductible, total_withholding, total_document
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const insertTaxLine = db.prepare(`
            INSERT INTO tax_lines (id, invoice_id, taxable_value, rate, supported_vat, deductible_vat, is_service, withholding_amount, withholding_type_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const transaction = db.transaction((inv, lines) => {
            insertInvoice.run(
                inv.id, inv.orderNumber, inv.supplierId, inv.documentTypeId, inv.date, inv.documentNumber, inv.notes,
                inv.hasPdf ? 1 : 0, inv.pdfPath, inv.totalTaxable, inv.totalSupported,
                inv.totalDeductible, inv.totalWithholding, inv.totalDocument
            );
            for (const line of lines) {
                insertTaxLine.run(
                    crypto.randomUUID(),
                    inv.id,
                    line.taxableValue,
                    line.rate,
                    line.supportedVat,
                    line.deductibleVat,
                    line.isService ? 1 : 0,
                    line.withholdingAmount,
                    line.withholdingTypeId
                );
            }
        });

        return transaction(invoice, taxLines);
    },
    updateInvoice: (invoice, taxLines) => {
        const updateInvoice = db.prepare(`
            UPDATE invoices SET 
                supplier_id = ?, document_type_id = ?, date = ?, document_number = ?, notes = ?, 
                has_pdf = ?, pdf_path = ?, total_taxable = ?, total_supported = ?, 
                total_deductible = ?, total_withholding = ?, total_document = ?
            WHERE id = ?
        `);

        const deleteTaxLines = db.prepare('DELETE FROM tax_lines WHERE invoice_id = ?');
        const insertTaxLine = db.prepare(`
            INSERT INTO tax_lines (id, invoice_id, taxable_value, rate, supported_vat, deductible_vat, is_service, withholding_amount, withholding_type_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const transaction = db.transaction((inv, lines) => {
            updateInvoice.run(
                inv.supplierId, inv.documentTypeId, inv.date, inv.documentNumber, inv.notes,
                inv.hasPdf ? 1 : 0, inv.pdfPath, inv.totalTaxable, inv.totalSupported,
                inv.totalDeductible, inv.totalWithholding, inv.totalDocument, inv.id
            );
            deleteTaxLines.run(inv.id);
            for (const line of lines) {
                insertTaxLine.run(
                    crypto.randomUUID(),
                    inv.id,
                    line.taxableValue,
                    line.rate,
                    line.supportedVat,
                    line.deductibleVat,
                    line.isService ? 1 : 0,
                    line.withholdingAmount,
                    line.withholdingTypeId
                );
            }
        });

        return transaction(invoice, taxLines);
    },
    deleteInvoice: (id) => db.prepare('DELETE FROM invoices WHERE id = ?').run(id),

    // Auth
    login: (email, password) => {
        const user = db.prepare('SELECT * FROM users WHERE email = ? AND password = ?').get(email, password);
        return user;
    },

    // File handling
    saveFile: async (filePath, buffer) => {
        const fileName = path.basename(filePath);
        const destDir = path.join(app.getPath('userData'), 'attachments');
        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
        const destPath = path.join(destDir, fileName);
        fs.writeFileSync(destPath, Buffer.from(buffer));
        return destPath;
    },
    openFile: (filePath) => {
        if (filePath && fs.existsSync(filePath)) {
            shell.openPath(filePath);
        }
    },
    readFile: (filePath) => {
        if (filePath && fs.existsSync(filePath)) {
            return fs.readFileSync(filePath);
        }
        return null;
    },

    // Current Account (Conta Corrente)
    getCCDocuments: () => {
        return db.prepare('SELECT * FROM cc_documents ORDER BY created_at DESC').all().map(doc => ({
            id: doc.id,
            type: doc.type,
            nature: doc.nature,
            referenceNumber: doc.reference_number,
            year: doc.year,
            period: doc.period,
            taxType: doc.tax_type,
            relatedTax: doc.related_tax,
            description: doc.description,
            taxableValue: doc.taxable_value,
            rate: doc.rate,
            amountToPay: doc.amount_to_pay,
            interest: doc.interest,
            fines: doc.fines,
            totalAmount: doc.total_amount,
            issueDate: doc.issue_date,
            dueDate: doc.due_date,
            receiptDate: doc.receipt_date,
            attachmentPath: doc.attachment_path,
            hasAttachment: !!doc.has_attachment,
            relatedDocumentId: doc.related_document_id
        }));
    },
    addCCDocument: (doc) => {
        const stmt = db.prepare(`
            INSERT INTO cc_documents (
                id, type, nature, reference_number, year, period, tax_type, related_tax, 
                description, taxable_value, rate, amount_to_pay, interest, fines, 
                total_amount, issue_date, due_date, receipt_date, attachment_path, 
                has_attachment, related_document_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(
            doc.id, doc.type, doc.nature, doc.referenceNumber, doc.year, doc.period, doc.taxType, doc.relatedTax,
            doc.description, doc.taxableValue, doc.rate, doc.amountToPay, doc.interest, doc.fines,
            doc.totalAmount, doc.issueDate, doc.dueDate, doc.receiptDate, doc.attachmentPath,
            doc.hasAttachment ? 1 : 0, doc.relatedDocumentId
        );
    },
    updateCCDocument: (doc) => {
        const stmt = db.prepare(`
            UPDATE cc_documents SET 
                type = ?, nature = ?, reference_number = ?, year = ?, period = ?, 
                tax_type = ?, related_tax = ?, description = ?, taxable_value = ?, 
                rate = ?, amount_to_pay = ?, interest = ?, fines = ?, 
                total_amount = ?, issue_date = ?, due_date = ?, receipt_date = ?, 
                attachment_path = ?, has_attachment = ?, related_document_id = ?
            WHERE id = ?
        `);
        return stmt.run(
            doc.type, doc.nature, doc.referenceNumber, doc.year, doc.period,
            doc.taxType, doc.relatedTax, doc.description, doc.taxableValue,
            doc.rate, doc.amountToPay, doc.interest, doc.fines,
            doc.totalAmount, doc.issueDate, doc.dueDate, doc.receiptDate,
            doc.attachmentPath, doc.hasAttachment ? 1 : 0, doc.relatedDocumentId, doc.id
        );
    },
    deleteCCDocument: (id) => db.prepare('DELETE FROM cc_documents WHERE id = ?').run(id),

    // Provinces
    getProvinces: () => db.prepare('SELECT * FROM provinces ORDER BY name').all(),
    addProvince: (province) => {
        const stmt = db.prepare('INSERT INTO provinces (id, name) VALUES (?, ?)');
        return stmt.run(province.id, province.name);
    },
    updateProvince: (province) => {
        const stmt = db.prepare('UPDATE provinces SET name = ? WHERE id = ?');
        return stmt.run(province.name, province.id);
    },
    deleteProvince: (id) => db.prepare('DELETE FROM provinces WHERE id = ?').run(id),

    // Municipalities
    getMunicipalities: () => db.prepare('SELECT * FROM municipalities ORDER BY name').all(),
    addMunicipality: (municipality) => {
        const stmt = db.prepare('INSERT INTO municipalities (id, province_id, name) VALUES (?, ?, ?)');
        return stmt.run(municipality.id, municipality.province_id, municipality.name);
    },
    updateMunicipality: (municipality) => {
        const stmt = db.prepare('UPDATE municipalities SET province_id = ?, name = ? WHERE id = ?');
        return stmt.run(municipality.province_id, municipality.name, municipality.id);
    },
    deleteMunicipality: (id) => db.prepare('DELETE FROM municipalities WHERE id = ?').run(id),

    // Supplier Attachments
    getSupplierAttachments: (supplierId) => {
        return db.prepare('SELECT * FROM supplier_attachments WHERE supplier_id = ?').all(supplierId).map(a => ({
            id: a.id,
            supplierId: a.supplier_id,
            title: a.title,
            filePath: a.file_path
        }));
    },
    addSupplierAttachment: (attachment) => {
        const stmt = db.prepare('INSERT INTO supplier_attachments (id, supplier_id, title, file_path) VALUES (?, ?, ?, ?)');
        return stmt.run(attachment.id, attachment.supplierId, attachment.title, attachment.filePath);
    },
    deleteSupplierAttachment: (id) => db.prepare('DELETE FROM supplier_attachments WHERE id = ?').run(id),

    // Clients
    getClients: () => {
        const clients = db.prepare('SELECT * FROM clients ORDER BY name').all();
        return clients.map(c => {
            const attachments = db.prepare('SELECT * FROM client_attachments WHERE client_id = ?').all(c.id);
            return {
                ...c,
                inAngola: !!c.in_angola,
                ivaRegime: c.iva_regime,
                provinceId: c.province_id,
                municipalityId: c.municipality_id,
                conformityDeclarationNumber: c.conformity_declaration_number,
                type: c.type || 'Normal',
                attachments: attachments.map(a => ({
                    id: a.id,
                    clientId: a.client_id,
                    title: a.title,
                    filePath: a.file_path
                }))
            };
        });
    },
    addClient: (client) => {
        const stmt = db.prepare(`
            INSERT INTO clients (
                id, name, nif, address, email, in_angola, iva_regime, 
                province_id, municipality_id, conformity_declaration_number, type
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(
            client.id, client.name, client.nif, client.address, client.email,
            client.inAngola ? 1 : 0, client.ivaRegime,
            client.provinceId, client.municipalityId, client.conformityDeclarationNumber,
            client.type || 'Normal'
        );
    },
    updateClient: (client) => {
        const stmt = db.prepare(`
            UPDATE clients SET 
                name = ?, nif = ?, address = ?, email = ?, in_angola = ?, 
                iva_regime = ?, province_id = ?, municipality_id = ?, 
                conformity_declaration_number = ?, type = ? 
            WHERE id = ?
        `);
        return stmt.run(
            client.name, client.nif, client.address, client.email,
            client.inAngola ? 1 : 0, client.ivaRegime,
            client.provinceId, client.municipalityId, client.conformityDeclarationNumber,
            client.type || 'Normal',
            client.id
        );
    },
    deleteClient: (id) => db.prepare('DELETE FROM clients WHERE id = ?').run(id),

    // Client Attachments
    getClientAttachments: (clientId) => {
        return db.prepare('SELECT * FROM client_attachments WHERE client_id = ?').all(clientId).map(a => ({
            id: a.id,
            clientId: a.client_id,
            title: a.title,
            filePath: a.file_path
        }));
    },
    addClientAttachment: (attachment) => {
        const stmt = db.prepare('INSERT INTO client_attachments (id, client_id, title, file_path) VALUES (?, ?, ?, ?)');
        return stmt.run(attachment.id, attachment.clientId, attachment.title, attachment.filePath);
    },
    deleteClientAttachment: (id) => db.prepare('DELETE FROM client_attachments WHERE id = ?').run(id)
};
