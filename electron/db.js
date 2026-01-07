
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

        CREATE TABLE IF NOT EXISTS invoices (
            id TEXT PRIMARY KEY,
            order_number INTEGER,
            supplier_id TEXT,
            date TEXT,
            document_number TEXT,
            notes TEXT,
            has_pdf INTEGER DEFAULT 0,
            pdf_path TEXT,
            total_taxable REAL DEFAULT 0,
            total_supported REAL DEFAULT 0,
            total_deductible REAL DEFAULT 0,
            total_document REAL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS tax_lines (
            id TEXT PRIMARY KEY,
            invoice_id TEXT,
            taxable_value REAL DEFAULT 0,
            rate REAL DEFAULT 0,
            supported_vat REAL DEFAULT 0,
            deductible_vat REAL DEFAULT 0,
            FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE,
            password TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

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

    // Invoices
    getInvoices: () => {
        const invoices = db.prepare('SELECT * FROM invoices ORDER BY created_at DESC').all();
        return invoices.map(inv => {
            const lines = db.prepare('SELECT * FROM tax_lines WHERE invoice_id = ?').all(inv.id);
            return {
                ...inv,
                order_number: inv.order_number,
                supplier_id: inv.supplier_id,
                has_pdf: !!inv.has_pdf,
                tax_lines: lines
            };
        });
    },
    addInvoice: (invoice, taxLines) => {
        const insertInvoice = db.prepare(`
            INSERT INTO invoices (
                id, order_number, supplier_id, date, document_number, notes, 
                has_pdf, pdf_path, total_taxable, total_supported, 
                total_deductible, total_document
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const insertTaxLine = db.prepare(`
            INSERT INTO tax_lines (id, invoice_id, taxable_value, rate, supported_vat, deductible_vat)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        const transaction = db.transaction((inv, lines) => {
            insertInvoice.run(
                inv.id, inv.orderNumber, inv.supplierId, inv.date, inv.documentNumber, inv.notes,
                inv.hasPdf ? 1 : 0, inv.pdfPath, inv.totalTaxable, inv.totalSupported,
                inv.totalDeductible, inv.totalDocument
            );
            for (const line of lines) {
                insertTaxLine.run(line.id || crypto.randomUUID(), inv.id, line.taxableValue, line.rate, line.supportedVat, line.deductibleVat);
            }
        });

        return transaction(invoice, taxLines);
    },
    updateInvoice: (invoice, taxLines) => {
        const updateInvoice = db.prepare(`
            UPDATE invoices SET 
                supplier_id = ?, date = ?, document_number = ?, notes = ?, 
                has_pdf = ?, pdf_path = ?, total_taxable = ?, total_supported = ?, 
                total_deductible = ?, total_document = ?
            WHERE id = ?
        `);

        const deleteTaxLines = db.prepare('DELETE FROM tax_lines WHERE invoice_id = ?');
        const insertTaxLine = db.prepare(`
            INSERT INTO tax_lines (id, invoice_id, taxable_value, rate, supported_vat, deductible_vat)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        const transaction = db.transaction((inv, lines) => {
            updateInvoice.run(
                inv.supplierId, inv.date, inv.documentNumber, inv.notes,
                inv.hasPdf ? 1 : 0, inv.pdfPath, inv.totalTaxable, inv.totalSupported,
                inv.totalDeductible, inv.totalDocument, inv.id
            );
            deleteTaxLines.run(inv.id);
            for (const line of lines) {
                insertTaxLine.run(line.id || crypto.randomUUID(), inv.id, line.taxableValue, line.rate, line.supportedVat, line.deductibleVat);
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
