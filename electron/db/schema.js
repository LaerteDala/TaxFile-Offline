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
            archive_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS tax_lines (
            id TEXT PRIMARY KEY,
            invoice_id TEXT NOT NULL,
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

        CREATE TABLE IF NOT EXISTS staff (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            identity_document TEXT,
            nif TEXT,
            social_security_number TEXT,
            department TEXT,
            job_function TEXT,
            province_id TEXT,
            municipality_id TEXT,
            type TEXT DEFAULT 'Nacional',
            not_subject_to_ss INTEGER DEFAULT 0,
            irt_exempt INTEGER DEFAULT 0,
            is_retired INTEGER DEFAULT 0,
            ss_contribution_rate REAL DEFAULT 3,
            photo_path TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS staff_attachments (
            id TEXT PRIMARY KEY,
            staff_id TEXT,
            title TEXT NOT NULL,
            file_path TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS departments (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS job_functions (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS irt_scales (
            id TEXT PRIMARY KEY,
            escalao INTEGER NOT NULL,
            valor_inicial REAL NOT NULL,
            valor_final REAL,
            parcela_fixa REAL DEFAULT 0,
            taxa REAL DEFAULT 0,
            excesso REAL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS subsidies (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            subject_to_inss INTEGER DEFAULT 0,
            inss_limit_type TEXT DEFAULT 'none',
            inss_limit_value REAL DEFAULT 0,
            subject_to_irt INTEGER DEFAULT 0,
            irt_limit_type TEXT DEFAULT 'none',
            irt_limit_value REAL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS deadline_configs (
            id TEXT PRIMARY KEY,
            document_type TEXT NOT NULL UNIQUE, -- 'general', 'invoice', 'contract'
            days_before INTEGER DEFAULT 15,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS notifications (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            is_read INTEGER DEFAULT 0,
            link TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS document_archives (
            id TEXT PRIMARY KEY,
            document_id TEXT NOT NULL,
            archive_id TEXT NOT NULL,
            document_type TEXT NOT NULL, -- 'invoice' or 'general'
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(document_id, archive_id, document_type)
        );

        CREATE TABLE IF NOT EXISTS iva_classifications (
            id TEXT PRIMARY KEY,
            code TEXT UNIQUE NOT NULL,
            description TEXT NOT NULL,
            taxable_base_line TEXT,
            taxpayer_tax_line TEXT,
            state_tax_line TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS stamp_duty_classifications (
            id TEXT PRIMARY KEY,
            code TEXT UNIQUE NOT NULL,
            description TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS industrial_tax_classifications (
            id TEXT PRIMARY KEY,
            code TEXT UNIQUE NOT NULL,
            description TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Migrations: Add columns if they don't exist
    const tableInfoDocTypes = db.prepare("PRAGMA table_info(document_types)").all();
    if (!tableInfoDocTypes.some(col => col.name === 'subject_to_iva')) db.exec("ALTER TABLE document_types ADD COLUMN subject_to_iva INTEGER DEFAULT 0;");
    if (!tableInfoDocTypes.some(col => col.name === 'subject_to_stamp_duty')) db.exec("ALTER TABLE document_types ADD COLUMN subject_to_stamp_duty INTEGER DEFAULT 0;");
    if (!tableInfoDocTypes.some(col => col.name === 'subject_to_industrial_tax')) db.exec("ALTER TABLE document_types ADD COLUMN subject_to_industrial_tax INTEGER DEFAULT 0;");

    let tableInfoTaxLines = db.prepare("PRAGMA table_info(tax_lines)").all();
    if (!tableInfoTaxLines.some(col => col.name === 'iva_classification_id')) db.exec("ALTER TABLE tax_lines ADD COLUMN iva_classification_id TEXT;");
    if (!tableInfoTaxLines.some(col => col.name === 'stamp_duty_classification_id')) db.exec("ALTER TABLE tax_lines ADD COLUMN stamp_duty_classification_id TEXT;");
    if (!tableInfoTaxLines.some(col => col.name === 'industrial_tax_classification_id')) db.exec("ALTER TABLE tax_lines ADD COLUMN industrial_tax_classification_id TEXT;");
    const tableInfoSuppliers = db.prepare("PRAGMA table_info(suppliers)").all();
    if (!tableInfoSuppliers.some(col => col.name === 'in_angola')) db.exec("ALTER TABLE suppliers ADD COLUMN in_angola INTEGER DEFAULT 1;");
    if (!tableInfoSuppliers.some(col => col.name === 'iva_regime')) db.exec("ALTER TABLE suppliers ADD COLUMN iva_regime TEXT DEFAULT 'Geral';");
    if (!tableInfoSuppliers.some(col => col.name === 'province_id')) db.exec("ALTER TABLE suppliers ADD COLUMN province_id TEXT;");
    if (!tableInfoSuppliers.some(col => col.name === 'municipality_id')) db.exec("ALTER TABLE suppliers ADD COLUMN municipality_id TEXT;");
    if (!tableInfoSuppliers.some(col => col.name === 'conformity_declaration_number')) db.exec("ALTER TABLE suppliers ADD COLUMN conformity_declaration_number TEXT;");

    const tableInfoInvoices = db.prepare("PRAGMA table_info(invoices)").all();
    if (!tableInfoInvoices.some(col => col.name === 'type')) db.exec("ALTER TABLE invoices ADD COLUMN type TEXT DEFAULT 'PURCHASE';");
    if (!tableInfoInvoices.some(col => col.name === 'client_id')) db.exec("ALTER TABLE invoices ADD COLUMN client_id TEXT;");
    if (!tableInfoInvoices.some(col => col.name === 'archive_id')) db.exec("ALTER TABLE invoices ADD COLUMN archive_id TEXT;");
    if (!tableInfoInvoices.some(col => col.name === 'due_date')) db.exec("ALTER TABLE invoices ADD COLUMN due_date TEXT;");

    tableInfoTaxLines = db.prepare("PRAGMA table_info(tax_lines)").all();
    if (!tableInfoTaxLines.some(col => col.name === 'liquidated_vat')) db.exec("ALTER TABLE tax_lines ADD COLUMN liquidated_vat REAL DEFAULT 0;");
    if (!tableInfoTaxLines.some(col => col.name === 'cative_vat')) db.exec("ALTER TABLE tax_lines ADD COLUMN cative_vat REAL DEFAULT 0;");
    if (!tableInfoTaxLines.some(col => col.name === 'withholding_type_id')) db.exec("ALTER TABLE tax_lines ADD COLUMN withholding_type_id TEXT;");

    const tableInfoProvinces = db.prepare("PRAGMA table_info(provinces)").all();
    if (!tableInfoProvinces.some(col => col.name === 'code')) db.exec("ALTER TABLE provinces ADD COLUMN code TEXT;");

    const tableInfoStaff = db.prepare("PRAGMA table_info(staff)").all();
    if (!tableInfoStaff.some(col => col.name === 'is_retired')) db.exec("ALTER TABLE staff ADD COLUMN is_retired INTEGER DEFAULT 0;");
    if (!tableInfoStaff.some(col => col.name === 'ss_contribution_rate')) db.exec("ALTER TABLE staff ADD COLUMN ss_contribution_rate REAL DEFAULT 3;");

    const tableInfoArchives = db.prepare("PRAGMA table_info(archives)").all();
    if (!tableInfoArchives.some(col => col.name === 'date')) db.exec("ALTER TABLE archives ADD COLUMN date TEXT;");

    const tableInfoIVA = db.prepare("PRAGMA table_info(iva_classifications)").all();
    if (!tableInfoIVA.some(col => col.name === 'taxable_base_line')) db.exec("ALTER TABLE iva_classifications ADD COLUMN taxable_base_line TEXT;");
    if (!tableInfoIVA.some(col => col.name === 'taxpayer_tax_line')) db.exec("ALTER TABLE iva_classifications ADD COLUMN taxpayer_tax_line TEXT;");
    if (!tableInfoIVA.some(col => col.name === 'state_tax_line')) db.exec("ALTER TABLE iva_classifications ADD COLUMN state_tax_line TEXT;");

    // Ensure default IVA classifications exist and are up to date
    const defaultIVA = [
        { code: '1', description: 'Transmissão de bens e prestação de serviços em que liquidou imposto', base: '1', taxpayer: null, state: '2' },
        { code: '1.1', description: 'Transmissões de bens efectuadas na Província de Cabinda em que liquidou o imposto à taxa reduzida', base: '1.1', taxpayer: null, state: '2.1' },
        { code: '1.2', description: 'Transmissões de bens e prestações de serviços em que liquidou imposto à taxa reduzida de 5%', base: '1.2', taxpayer: null, state: '2.2' },
        { code: '1.3', description: 'Transmissões de bens e prestações de serviços em que liquidou imposto à taxa reduzida de 7%', base: '1.2', taxpayer: null, state: '2.3' },
        { code: '3', description: 'Transmissões de bens e prestações de serviços abrangidas pelo regime de caixa (art. 66.º do CIVA)', base: '3', taxpayer: null, state: '4' },
        { code: '3.1', description: 'Transmissões de bens e prestações de serviços abrangidas pelo regime de caixa (art. 60.º do CIVA) efectuadas na Província de Cabinda', base: '3.1', taxpayer: null, state: '4.1' },
        { code: '3.2', description: 'Transmissões de bens e prestações de serviços em que liquidou imposto a taxa reduzida de 5% abrangidas pelo regime de caixa (art. 60.º do CIVA)', base: '3.2', taxpayer: null, state: '4.2' },
        { code: '3.3', description: 'Transmissões de bens e prestações de serviços em que liquidou imposto a taxa reduzida de 7% abrangidas pelo regime de caixa (art. 60.º do CIVA)', base: '3.3', taxpayer: null, state: '4.3' },
        { code: '5', description: 'Operações em que o IVA foi cativo pelo declarante (art. 21.º do CIVA)', base: '5', taxpayer: '6', state: '7' },
        { code: '8', description: 'Operações em que o IVA foi cativo pelo cliente (art. 31.º do CIVA)', base: '8', taxpayer: '9', state: null },
        { code: '8.1', description: 'Imposto retido nos Terminais de Pagamento Automático (TPA) do declarante', base: '8.1', taxpayer: '9.1', state: null },
        { code: '10', description: 'Isentas com direito à dedução', base: '10', taxpayer: null, state: null },
        { code: '11', description: 'Isentas sem direito à dedução (art. 12.º excluindo a alínea a) do CIVA)', base: '11', taxpayer: null, state: null },
        { code: '12', description: 'Não tributadas (art. 10.º do CIVA)', base: '12', taxpayer: null, state: null },
        { code: 'SCE', description: 'Serviços Contratados no Estrangeiro', base: '13', taxpayer: '14', state: '15' },
        { code: 'MFI', description: 'Meios Fixos e Investimentos', base: '16', taxpayer: '17', state: null },
        { code: 'INV', description: 'Existências/Inventário', base: '18', taxpayer: '19', state: null },
        { code: 'OBC', description: 'Outros Bens de Consumo', base: '20', taxpayer: '21', state: null },
        { code: 'SERV', description: 'Serviços', base: '22', taxpayer: '23', state: null },
        { code: 'IMPT', description: 'Importação', base: '24', taxpayer: '25', state: null },
        { code: 'REG_CAT', description: 'Regularizações do imposto cativo', base: null, taxpayer: '26', state: '27' },
        { code: 'REG_PRO', description: 'Regularizações do pro rata', base: null, taxpayer: '26.1', state: '27.1' },
        { code: 'REG_MS1', description: 'Regularizações mensais ou anuais, efectuadas pelo sujeito passivo', base: null, taxpayer: '28', state: '29' },
        { code: 'REG_MS2', description: 'Regularizações mensais ou anuais, efectuadas pelo sujeito passivo', base: null, taxpayer: '28.1', state: null }
    ];

    const checkIVA = db.prepare('SELECT id FROM iva_classifications WHERE code = ?');
    const insertIVA = db.prepare('INSERT INTO iva_classifications (id, code, description, taxable_base_line, taxpayer_tax_line, state_tax_line) VALUES (?, ?, ?, ?, ?, ?)');
    const updateIVA = db.prepare('UPDATE iva_classifications SET description = ?, taxable_base_line = ?, taxpayer_tax_line = ?, state_tax_line = ? WHERE code = ?');

    defaultIVA.forEach(iva => {
        const existing = checkIVA.get(iva.code);
        if (existing) {
            updateIVA.run(iva.description, iva.base, iva.taxpayer, iva.state, iva.code);
        } else {
            insertIVA.run(crypto.randomUUID(), iva.code, iva.description, iva.base, iva.taxpayer, iva.state);
        }
    });

    // Migration: Move existing archive_id to document_archives
    const docArchivesCount = db.prepare('SELECT count(*) as count FROM document_archives').get().count;
    if (docArchivesCount === 0) {
        // Migrate Invoices
        const invoicesWithArchive = db.prepare('SELECT id, archive_id FROM invoices WHERE archive_id IS NOT NULL').all();
        const insertDocArchive = db.prepare('INSERT INTO document_archives (id, document_id, archive_id, document_type) VALUES (?, ?, ?, ?)');

        invoicesWithArchive.forEach(inv => {
            insertDocArchive.run(crypto.randomUUID(), inv.id, inv.archive_id, 'invoice');
        });

        // Migrate General Documents
        const genDocsWithArchive = db.prepare('SELECT id, archive_id FROM general_documents WHERE archive_id IS NOT NULL').all();
        genDocsWithArchive.forEach(doc => {
            insertDocArchive.run(crypto.randomUUID(), doc.id, doc.archive_id, 'general');
        });
    }

    // Add default document types if none exist
    const docTypeCount = db.prepare('SELECT count(*) as count FROM document_types').get().count;
    if (docTypeCount === 0) {
        const insertDocType = db.prepare('INSERT INTO document_types (id, code, name) VALUES (?, ?, ?)');
        insertDocType.run(crypto.randomUUID(), 'FT', 'Factura');
        insertDocType.run(crypto.randomUUID(), 'FR', 'Factura Recibo');
        insertDocType.run(crypto.randomUUID(), 'RC', 'Recibo');
        insertDocType.run(crypto.randomUUID(), 'NC', 'Nota de Crédito');
    }

    // Migration: Ensure NC (Nota de Crédito) exists
    const ncExists = db.prepare('SELECT count(*) as count FROM document_types WHERE code = ?').get('NC').count;
    if (ncExists === 0) {
        db.prepare('INSERT INTO document_types (id, code, name) VALUES (?, ?, ?)').run(crypto.randomUUID(), 'NC', 'Nota de Crédito');
    }

    // Add default withholding types if none exist
    const withholdingTypeCount = db.prepare('SELECT count(*) as count FROM withholding_types').get().count;
    if (withholdingTypeCount === 0) {
        const insertWithholdingType = db.prepare('INSERT INTO withholding_types (id, name, rate) VALUES (?, ?, ?)');
        insertWithholdingType.run(crypto.randomUUID(), 'Imposto Industrial', 6.5);
        insertWithholdingType.run(crypto.randomUUID(), 'IRT Grupo B', 6.5);
        insertWithholdingType.run(crypto.randomUUID(), 'Imposto Predial', 15.0);
    }

    // Add default IRT scales if none exist
    const irtScaleCount = db.prepare('SELECT count(*) as count FROM irt_scales').get().count;
    if (irtScaleCount === 0) {
        const insertIRTScale = db.prepare('INSERT INTO irt_scales (id, escalao, valor_inicial, valor_final, parcela_fixa, taxa, excesso) VALUES (?, ?, ?, ?, ?, ?, ?)');
        insertIRTScale.run(crypto.randomUUID(), 1, 0, 150000, 0, 0, 0);
        insertIRTScale.run(crypto.randomUUID(), 2, 150001, 200000, 12500, 16, 150000);
        insertIRTScale.run(crypto.randomUUID(), 3, 200001, 300000, 31250, 18, 200000);
        insertIRTScale.run(crypto.randomUUID(), 4, 300001, 500000, 49250, 19, 300000);
        insertIRTScale.run(crypto.randomUUID(), 5, 500001, 1000000, 87250, 20, 500000);
        insertIRTScale.run(crypto.randomUUID(), 6, 1000001, 1500000, 187250, 21, 1000000);
        insertIRTScale.run(crypto.randomUUID(), 7, 1500001, 2000000, 292250, 22, 1500000);
        insertIRTScale.run(crypto.randomUUID(), 8, 2000001, 2500000, 402250, 23, 2000000);
        insertIRTScale.run(crypto.randomUUID(), 9, 2500001, 5000000, 517250, 24, 2500000);
        insertIRTScale.run(crypto.randomUUID(), 10, 5000001, 10000000, 1117250, 24.5, 5000000);
        insertIRTScale.run(crypto.randomUUID(), 11, 10000001, null, 2342250, 25, 10000000);
    }

    // Add default Subsidies if none exist
    const subsidiesCount = db.prepare('SELECT count(*) as count FROM subsidies').get().count;
    if (subsidiesCount === 0) {
        const insertSubsidy = db.prepare('INSERT INTO subsidies (id, name, subject_to_inss, inss_limit_type, inss_limit_value, subject_to_irt, irt_limit_type, irt_limit_value) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

        // Alimentação: Sujeito a INSS, IRT isento até 30.000
        insertSubsidy.run(crypto.randomUUID(), 'Subsídio de Alimentação', 1, 'none', 0, 1, 'fixed', 30000);

        // Transporte: Sujeito a INSS, IRT isento até 30.000
        insertSubsidy.run(crypto.randomUUID(), 'Subsídio de Transporte', 1, 'none', 0, 1, 'fixed', 30000);

        // Abono de Família: Isento de INSS, IRT isento até 5% do Salário Base
        insertSubsidy.run(crypto.randomUUID(), 'Abono de Família', 0, 'none', 0, 1, 'percentage', 5);

        // Subsídio de Férias: Isento de INSS, Sujeito a IRT (sem limite)
        insertSubsidy.run(crypto.randomUUID(), 'Subsídio de Férias', 0, 'none', 0, 1, 'none', 0);

        // Reembolso de Despesas: Sujeito a INSS, Isento de IRT
        insertSubsidy.run(crypto.randomUUID(), 'Reembolso de Despesas', 1, 'none', 0, 0, 'none', 0);

        // Subsídio de Natal: Sujeito a tudo
        insertSubsidy.run(crypto.randomUUID(), 'Subsídio de Natal', 1, 'none', 0, 1, 'none', 0);

        // Abono para Falhas: Sujeito a tudo
        insertSubsidy.run(crypto.randomUUID(), 'Abono para Falhas', 1, 'none', 0, 1, 'none', 0);

        // Subsídio de Renda de Casa: Sujeito a tudo
        insertSubsidy.run(crypto.randomUUID(), 'Subsídio de Renda de Casa', 1, 'none', 0, 1, 'none', 0);

        // Compensação por Rescisão: Sujeito a tudo
        insertSubsidy.run(crypto.randomUUID(), 'Compensação por Rescisão', 1, 'none', 0, 1, 'none', 0);

        // Subsídio de Atavio: Sujeito a tudo
        insertSubsidy.run(crypto.randomUUID(), 'Subsídio de Atavio', 1, 'none', 0, 1, 'none', 0);

        // Subsídio de Representação: Sujeito a tudo
        insertSubsidy.run(crypto.randomUUID(), 'Subsídio de Representação', 1, 'none', 0, 1, 'none', 0);

        // Prémios: Sujeito a tudo
        insertSubsidy.run(crypto.randomUUID(), 'Prémios', 1, 'none', 0, 1, 'none', 0);

        // Outros Subsídios Sujeitos a IRT
        insertSubsidy.run(crypto.randomUUID(), 'Outros Subsídios Sujeitos a IRT', 1, 'none', 0, 1, 'none', 0);

        // Outros Subsídios Não Sujeitos a IRT
        insertSubsidy.run(crypto.randomUUID(), 'Outros Subsídios Não Sujeitos a IRT', 1, 'none', 0, 0, 'none', 0);
    }

    // Add default deadline configs if none exist
    const deadlineConfigCount = db.prepare('SELECT count(*) as count FROM deadline_configs').get().count;
    if (deadlineConfigCount === 0) {
        const insertDeadlineConfig = db.prepare('INSERT INTO deadline_configs (id, document_type, days_before) VALUES (?, ?, ?)');
        insertDeadlineConfig.run(crypto.randomUUID(), 'invoice', 15);
        insertDeadlineConfig.run(crypto.randomUUID(), 'contract', 30);
        insertDeadlineConfig.run(crypto.randomUUID(), 'general', 7);
    }

    // Ensure all fiscal document types have a deadline config
    const docTypes = db.prepare('SELECT * FROM document_types').all();
    const existingConfigs = db.prepare('SELECT document_type FROM deadline_configs').all().map(c => c.document_type);

    const insertConfig = db.prepare('INSERT INTO deadline_configs (id, document_type, days_before) VALUES (?, ?, ?)');
    docTypes.forEach(dt => {
        if (!existingConfigs.includes(dt.id)) {
            insertConfig.run(crypto.randomUUID(), dt.id, 15);
        }
    });

    // Remuneration Maps
    db.exec(`
        CREATE TABLE IF NOT EXISTS remuneration_maps (
            id TEXT PRIMARY KEY,
            map_number INTEGER NOT NULL,
            period TEXT NOT NULL, -- YYYY-MM
            status TEXT DEFAULT 'draft', -- draft, approved
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS remuneration_lines (
            id TEXT PRIMARY KEY,
            map_id TEXT NOT NULL,
            staff_id TEXT NOT NULL,
            base_salary REAL DEFAULT 0,
            overtime_value REAL DEFAULT 0,
            deductions_value REAL DEFAULT 0,
            
            manual_excess_bool INTEGER DEFAULT 0, -- 0 or 1
            manual_excess_value REAL DEFAULT 0,
            
            total_non_subject_subsidies REAL DEFAULT 0,
            total_subject_subsidies REAL DEFAULT 0,
            
            gross_salary REAL DEFAULT 0,
            
            inss_base REAL DEFAULT 0,
            inss_value REAL DEFAULT 0,
            
            irt_base REAL DEFAULT 0,
            irt_scale_id TEXT,
            irt_value REAL DEFAULT 0,
            
            net_salary REAL DEFAULT 0,
            
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(map_id) REFERENCES remuneration_maps(id) ON DELETE CASCADE,
            FOREIGN KEY(staff_id) REFERENCES staff(id)
        );

        CREATE TABLE IF NOT EXISTS remuneration_line_subsidies (
            id TEXT PRIMARY KEY,
            line_id TEXT NOT NULL,
            subsidy_id TEXT NOT NULL,
            amount REAL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(line_id) REFERENCES remuneration_lines(id) ON DELETE CASCADE,
            FOREIGN KEY(subsidy_id) REFERENCES subsidies(id)
        );

        CREATE TABLE IF NOT EXISTS archives (
            id TEXT PRIMARY KEY,
            code TEXT,
            description TEXT NOT NULL,
            period TEXT, -- MM-YYYY
            date TEXT, -- DD-MM-YYYY
            notes TEXT,
            parent_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (parent_id) REFERENCES archives(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS general_documents (
            id TEXT PRIMARY KEY,
            description TEXT NOT NULL,
            issue_date TEXT,
            expiry_date TEXT,
            related_entity_type TEXT, -- 'supplier', 'client', 'staff', 'invoice', 'liquidation_note', etc.
            related_entity_id TEXT,
            archive_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (archive_id) REFERENCES archives(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS general_document_attachments (
            id TEXT PRIMARY KEY,
            document_id TEXT NOT NULL,
            title TEXT NOT NULL,
            file_path TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (document_id) REFERENCES general_documents(id) ON DELETE CASCADE
        );
    `);

    // Add a default user if none exists

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
