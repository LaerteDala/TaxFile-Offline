
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

        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE,
            password TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Migrations: Add columns if they don't exist
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

    if (!hasIsService) {
        db.exec("ALTER TABLE tax_lines ADD COLUMN is_service INTEGER DEFAULT 0;");
    }
    if (!hasWithholdingAmount) {
        db.exec("ALTER TABLE tax_lines ADD COLUMN withholding_amount REAL DEFAULT 0;");
    }

    // Add default document types if none exist
    const docTypeCount = db.prepare('SELECT count(*) as count FROM document_types').get().count;
    if (docTypeCount === 0) {
        const insertDocType = db.prepare('INSERT INTO document_types (id, code, name) VALUES (?, ?, ?)');
        insertDocType.run(crypto.randomUUID(), 'FT', 'Factura');
        insertDocType.run(crypto.randomUUID(), 'FR', 'Factura Recibo');
        insertDocType.run(crypto.randomUUID(), 'RC', 'Recibo');
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
    getSuppliers: () => db.prepare('SELECT * FROM suppliers ORDER BY name').all(),
    addSupplier: (supplier) => {
        const stmt = db.prepare('INSERT INTO suppliers (id, name, nif, address, email) VALUES (?, ?, ?, ?, ?)');
        return stmt.run(supplier.id, supplier.name, supplier.nif, supplier.address, supplier.email);
    },
    updateSupplier: (supplier) => {
        const stmt = db.prepare('UPDATE suppliers SET name = ?, nif = ?, address = ?, email = ? WHERE id = ?');
        return stmt.run(supplier.name, supplier.nif, supplier.address, supplier.email, supplier.id);
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
                    is_service: !!l.is_service
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
            INSERT INTO tax_lines (id, invoice_id, taxable_value, rate, supported_vat, deductible_vat, is_service, withholding_amount)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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
                    line.withholdingAmount
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
            INSERT INTO tax_lines (id, invoice_id, taxable_value, rate, supported_vat, deductible_vat, is_service, withholding_amount)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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
                    line.withholdingAmount
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
    }
};
