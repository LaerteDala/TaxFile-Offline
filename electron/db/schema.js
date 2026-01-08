import db from './database.js';
import crypto from 'crypto';

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
            code TEXT,
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

    const tableInfoProvinces = db.prepare("PRAGMA table_info(provinces)").all();
    if (!tableInfoProvinces.some(col => col.name === 'code')) db.exec("ALTER TABLE provinces ADD COLUMN code TEXT;");

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
