import db from '../database.js';
import crypto from 'crypto';

export const deadlineRepo = {
    getDeadlineConfigs: () => {
        return db.prepare(`
            SELECT dc.*, dt.name as document_type_name
            FROM deadline_configs dc
            LEFT JOIN document_types dt ON dc.document_type = dt.id
        `).all();
    },

    updateDeadlineConfig: (config) => {
        const stmt = db.prepare(`
            UPDATE deadline_configs
            SET days_before = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `);
        stmt.run(config.days_before, config.id);
        return config;
    },

    getUpcomingDeadlines: () => {
        // Fetch configs
        const configs = db.prepare('SELECT * FROM deadline_configs').all();
        const configMap = configs.reduce((acc, c) => {
            acc[c.document_type] = c.days_before;
            return acc;
        }, {});

        const results = [];

        // 1. General Documents
        const genDocs = db.prepare(`
            SELECT gd.*, 'general' as doc_type, a.description as archive_description
            FROM general_documents gd
            LEFT JOIN archives a ON gd.archive_id = a.id
            WHERE gd.expiry_date IS NOT NULL
        `).all();

        genDocs.forEach(doc => {
            results.push({
                id: doc.id,
                description: doc.description,
                expiry_date: doc.expiry_date,
                doc_type: 'general',
                entity_name: doc.archive_description || 'N/A',
                days_before_config: configMap['general'] || 7
            });
        });

        // 2. Invoices
        const invoices = db.prepare(`
            SELECT i.*, 'invoice' as doc_type, s.name as supplier_name, c.name as client_name, dt.code as doc_code
            FROM invoices i
            LEFT JOIN suppliers s ON i.supplier_id = s.id
            LEFT JOIN clients c ON i.client_id = c.id
            LEFT JOIN document_types dt ON i.document_type_id = dt.id
            WHERE i.due_date IS NOT NULL
        `).all();

        invoices.forEach(inv => {
            results.push({
                id: inv.id,
                description: `${inv.doc_code || 'Fatura'}: ${inv.document_number}`,
                expiry_date: inv.due_date,
                doc_type: 'invoice',
                document_type_id: inv.document_type_id,
                entity_name: inv.supplier_name || inv.client_name || 'N/A',
                days_before_config: configMap[inv.document_type_id] || configMap['invoice'] || 15
            });
        });

        return results;
    },

    getDeadlineSummary: () => {
        const deadlines = deadlineRepo.getUpcomingDeadlines();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let expired = 0;
        let upcoming = 0;

        deadlines.forEach(item => {
            const expiry = new Date(item.expiry_date);
            expiry.setHours(0, 0, 0, 0);
            const diffTime = expiry.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < 0) {
                expired++;
            } else if (diffDays <= item.days_before_config) {
                upcoming++;
            }
        });

        return { expired, upcoming, total: expired + upcoming };
    }
};
