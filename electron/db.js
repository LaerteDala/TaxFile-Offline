
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
            in_angola INTEGER DEFAULT 1,
            iva_regime TEXT DEFAULT 'Geral',
            province_id TEXT,
            municipality_id TEXT,
            conformity_declaration_number TEXT,
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
            type TEXT DEFAULT 'PURCHASE',
            order_number INTEGER,
            supplier_id TEXT,
            client_id TEXT,
            document_type_id TEXT,
            date TEXT,
            document_number TEXT,
            notes TEXT,
            has_pdf INTEGER DEFAULT 0,
            pdf_path TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
            FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
            FOREIGN KEY (document_type_id) REFERENCES document_types(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS tax_lines (
            id TEXT PRIMARY KEY,
            invoice_id TEXT,
            taxable_value REAL DEFAULT 0,
            rate REAL DEFAULT 0,
            supported_vat REAL DEFAULT 0,
            deductible_vat REAL DEFAULT 0,
            liquidated_vat REAL DEFAULT 0,
            cative_vat REAL DEFAULT 0,
            is_service INTEGER DEFAULT 0,
            withholding_amount REAL DEFAULT 0,
            withholding_type_id TEXT,
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
            cative_vat_rate REAL DEFAULT 0,
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

        CREATE TABLE IF NOT EXISTS company_info (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            nif TEXT,
            address TEXT,
            location TEXT,
            province_id TEXT,
            municipality_id TEXT,
            email TEXT,
            website TEXT,
            turnover REAL DEFAULT 0,
            iva_regime TEXT DEFAULT 'Geral',
            service_regime TEXT DEFAULT 'Imposto Industrial',
            has_stamp_duty INTEGER DEFAULT 0,
            stamp_duty_rate REAL DEFAULT 0,
            logo_path TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS company_attachments (
            id TEXT PRIMARY KEY,
            company_id TEXT,
            title TEXT NOT NULL,
            file_path TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (company_id) REFERENCES company_info(id) ON DELETE CASCADE
        );
    `);

    // Migrations: Add columns if they don't exist
    const tableInfoSuppliers = db.prepare("PRAGMA table_info(suppliers)").all();
    if (!tableInfoSuppliers.some(col => col.name === 'in_angola')) db.exec("ALTER TABLE suppliers ADD COLUMN in_angola INTEGER DEFAULT 1;");
    if (!tableInfoSuppliers.some(col => col.name === 'iva_regime')) db.exec("ALTER TABLE suppliers ADD COLUMN iva_regime TEXT DEFAULT 'Geral';");
    if (!tableInfoSuppliers.some(col => col.name === 'province_id')) db.exec("ALTER TABLE suppliers ADD COLUMN province_id TEXT;");
    if (!tableInfoSuppliers.some(col => col.name === 'municipality_id')) db.exec("ALTER TABLE suppliers ADD COLUMN municipality_id TEXT;");
    if (!tableInfoSuppliers.some(col => col.name === 'conformity_declaration_number')) db.exec("ALTER TABLE suppliers ADD COLUMN conformity_declaration_number TEXT;");

    const tableInfoClients = db.prepare("PRAGMA table_info(clients)").all();
    if (!tableInfoClients.some(col => col.name === 'type')) db.exec("ALTER TABLE clients ADD COLUMN type TEXT DEFAULT 'Normal';");
    if (!tableInfoClients.some(col => col.name === 'cative_vat_rate')) db.exec("ALTER TABLE clients ADD COLUMN cative_vat_rate REAL DEFAULT 0;");

    const tableInfoInvoices = db.prepare("PRAGMA table_info(invoices)").all();
    if (!tableInfoInvoices.some(col => col.name === 'type')) db.exec("ALTER TABLE invoices ADD COLUMN type TEXT DEFAULT 'PURCHASE';");
    if (!tableInfoInvoices.some(col => col.name === 'client_id')) db.exec("ALTER TABLE invoices ADD COLUMN client_id TEXT;");

    const tableInfoTaxLines = db.prepare("PRAGMA table_info(tax_lines)").all();
    if (!tableInfoTaxLines.some(col => col.name === 'liquidated_vat')) db.exec("ALTER TABLE tax_lines ADD COLUMN liquidated_vat REAL DEFAULT 0;");
    if (!tableInfoTaxLines.some(col => col.name === 'cative_vat')) db.exec("ALTER TABLE tax_lines ADD COLUMN cative_vat REAL DEFAULT 0;");
    if (!tableInfoTaxLines.some(col => col.name === 'withholding_type_id')) db.exec("ALTER TABLE tax_lines ADD COLUMN withholding_type_id TEXT;");

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

    // Add a default user if none exists
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
        const invoices = db.prepare('SELECT * FROM invoices ORDER BY date DESC, order_number DESC').all();
        return invoices.map(inv => {
            const lines = db.prepare('SELECT * FROM tax_lines WHERE invoice_id = ?').all(inv.id);
            const mappedLines = lines.map(l => ({
                id: l.id,
                taxableValue: l.taxable_value,
                rate: l.rate,
                supportedVat: l.supported_vat,
                deductibleVat: l.deductible_vat,
                liquidatedVat: l.liquidated_vat,
                cativeVat: l.cative_vat,
                isService: !!l.is_service,
                withholdingAmount: l.withholding_amount,
                withholdingTypeId: l.withholding_type_id
            }));

            return {
                id: inv.id,
                type: inv.type,
                orderNumber: inv.order_number,
                supplierId: inv.supplier_id,
                clientId: inv.client_id,
                documentTypeId: inv.document_type_id,
                date: inv.date,
                documentNumber: inv.document_number,
                notes: inv.notes,
                hasPdf: !!inv.has_pdf,
                pdfPath: inv.pdf_path,
                lines: mappedLines,
                totalTaxable: mappedLines.reduce((sum, l) => sum + l.taxableValue, 0),
                totalSupported: mappedLines.reduce((sum, l) => sum + l.supportedVat, 0),
                totalDeductible: mappedLines.reduce((sum, l) => sum + l.deductibleVat, 0),
                totalLiquidated: mappedLines.reduce((sum, l) => sum + l.liquidatedVat, 0),
                totalCative: mappedLines.reduce((sum, l) => sum + l.cativeVat, 0),
                totalWithholding: mappedLines.reduce((sum, l) => sum + l.withholdingAmount, 0),
                totalDocument: mappedLines.reduce((sum, l) => sum + l.taxableValue + (inv.type === 'PURCHASE' ? l.supportedVat : l.liquidatedVat) - l.withholdingAmount, 0)
            };
        });
    },
    addInvoice: ({ invoice, taxLines }) => {
        const insertInvoice = db.prepare(`
            INSERT INTO invoices (id, type, order_number, supplier_id, client_id, document_type_id, date, document_number, notes, has_pdf, pdf_path)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const insertLine = db.prepare(`
            INSERT INTO tax_lines (id, invoice_id, taxable_value, rate, supported_vat, deductible_vat, liquidated_vat, cative_vat, is_service, withholding_amount, withholding_type_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const transaction = db.transaction((inv, lines) => {
            insertInvoice.run(inv.id, inv.type, inv.orderNumber, inv.supplierId, inv.clientId, inv.documentTypeId, inv.date, inv.documentNumber, inv.notes, inv.hasPdf ? 1 : 0, inv.pdfPath);
            for (const line of lines) {
                insertLine.run(line.id, inv.id, line.taxableValue, line.rate, line.supportedVat, line.deductibleVat, line.liquidatedVat, line.cativeVat, line.isService ? 1 : 0, line.withholdingAmount, line.withholdingTypeId);
            }
        });

        return transaction(invoice, taxLines);
    },
    updateInvoice: ({ invoice, taxLines }) => {
        const updateInvoice = db.prepare(`
            UPDATE invoices SET 
                type = ?, order_number = ?, supplier_id = ?, client_id = ?, document_type_id = ?, 
                date = ?, document_number = ?, notes = ?, has_pdf = ?, pdf_path = ?
            WHERE id = ?
        `);
        const deleteLines = db.prepare('DELETE FROM tax_lines WHERE invoice_id = ?');
        const insertLine = db.prepare(`
            INSERT INTO tax_lines (id, invoice_id, taxable_value, rate, supported_vat, deductible_vat, liquidated_vat, cative_vat, is_service, withholding_amount, withholding_type_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const transaction = db.transaction((inv, lines) => {
            updateInvoice.run(inv.type, inv.orderNumber, inv.supplierId, inv.clientId, inv.documentTypeId, inv.date, inv.documentNumber, inv.notes, inv.hasPdf ? 1 : 0, inv.pdfPath, inv.id);
            deleteLines.run(inv.id);
            for (const line of lines) {
                insertLine.run(line.id, inv.id, line.taxableValue, line.rate, line.supportedVat, line.deductibleVat, line.liquidatedVat, line.cativeVat, line.isService ? 1 : 0, line.withholdingAmount, line.withholdingTypeId);
            }
        });

        return transaction(invoice, taxLines);
    },
    deleteInvoice: (id) => db.prepare('DELETE FROM invoices WHERE id = ?').run(id),

    // Auth
    login: (email, password) => {
        return db.prepare('SELECT * FROM users WHERE email = ? AND password = ?').get(email, password);
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
                cativeVatRate: c.cative_vat_rate || 0,
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
                province_id, municipality_id, conformity_declaration_number, type, cative_vat_rate
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(
            client.id, client.name, client.nif, client.address, client.email,
            client.inAngola ? 1 : 0, client.ivaRegime,
            client.provinceId, client.municipalityId, client.conformityDeclarationNumber,
            client.type || 'Normal', client.cativeVatRate || 0
        );
    },
    updateClient: (client) => {
        const stmt = db.prepare(`
            UPDATE clients SET 
                name = ?, nif = ?, address = ?, email = ?, in_angola = ?, 
                iva_regime = ?, province_id = ?, municipality_id = ?, 
                conformity_declaration_number = ?, type = ?, cative_vat_rate = ? 
            WHERE id = ?
        `);
        return stmt.run(
            client.name, client.nif, client.address, client.email,
            client.inAngola ? 1 : 0, client.ivaRegime,
            client.provinceId, client.municipalityId, client.conformityDeclarationNumber,
            client.type || 'Normal', client.cativeVatRate || 0,
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
    deleteClientAttachment: (id) => db.prepare('DELETE FROM client_attachments WHERE id = ?').run(id),

    // Company Info
    getCompanyInfo: () => {
        const company = db.prepare('SELECT * FROM company_info LIMIT 1').get();
        if (!company) return null;
        const attachments = db.prepare('SELECT * FROM company_attachments WHERE company_id = ?').all(company.id);
        return {
            ...company,
            turnover: company.turnover,
            ivaRegime: company.iva_regime,
            serviceRegime: company.service_regime,
            hasStampDuty: !!company.has_stamp_duty,
            stampDutyRate: company.stamp_duty_rate,
            logoPath: company.logo_path,
            provinceId: company.province_id,
            municipalityId: company.municipality_id,
            attachments: attachments.map(a => ({
                id: a.id,
                companyId: a.company_id,
                title: a.title,
                filePath: a.file_path
            }))
        };
    },
    updateCompanyInfo: (company) => {
        const existing = db.prepare('SELECT id FROM company_info LIMIT 1').get();
        if (!existing) {
            const stmt = db.prepare(`
                INSERT INTO company_info (
                    id, name, nif, address, location, province_id, municipality_id, 
                    email, website, turnover, iva_regime, service_regime, 
                    has_stamp_duty, stamp_duty_rate, logo_path
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            return stmt.run(
                company.id || crypto.randomUUID(), company.name, company.nif, company.address,
                company.location, company.provinceId, company.municipalityId,
                company.email, company.website, company.turnover, company.ivaRegime,
                company.serviceRegime, company.hasStampDuty ? 1 : 0,
                company.stampDutyRate, company.logoPath
            );
        } else {
            const stmt = db.prepare(`
                UPDATE company_info SET 
                    name = ?, nif = ?, address = ?, location = ?, 
                    province_id = ?, municipality_id = ?, email = ?, 
                    website = ?, turnover = ?, iva_regime = ?, 
                    service_regime = ?, has_stamp_duty = ?, 
                    stamp_duty_rate = ?, logo_path = ?
                WHERE id = ?
            `);
            return stmt.run(
                company.name, company.nif, company.address, company.location,
                company.provinceId, company.municipalityId, company.email,
                company.website, company.turnover, company.ivaRegime,
                company.serviceRegime, company.hasStampDuty ? 1 : 0,
                company.stampDutyRate, company.logoPath,
                existing.id
            );
        }
    },

    // Company Attachments
    getCompanyAttachments: (companyId) => {
        return db.prepare('SELECT * FROM company_attachments WHERE company_id = ?').all(companyId).map(a => ({
            id: a.id,
            companyId: a.company_id,
            title: a.title,
            filePath: a.file_path
        }));
    },
    addCompanyAttachment: (attachment) => {
        const stmt = db.prepare('INSERT INTO company_attachments (id, company_id, title, file_path) VALUES (?, ?, ?, ?)');
        return stmt.run(attachment.id, attachment.companyId, attachment.title, attachment.filePath);
    },
    deleteCompanyAttachment: (id) => db.prepare('DELETE FROM company_attachments WHERE id = ?').run(id)
};
