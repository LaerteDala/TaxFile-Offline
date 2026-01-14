import db from '../database.js';
import crypto from 'crypto';

export const documentRepo = {
    // Archives
    getArchives: () => {
        return db.prepare('SELECT * FROM archives ORDER BY created_at DESC').all();
    },

    addArchive: (archive) => {
        const id = crypto.randomUUID();
        const stmt = db.prepare(`
            INSERT INTO archives (id, code, description, period, date, notes, parent_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(id, archive.code, archive.description, archive.period, archive.date, archive.notes, archive.parent_id);
        return { id, ...archive };
    },

    updateArchive: (archive) => {
        const stmt = db.prepare(`
            UPDATE archives
            SET code = ?, description = ?, period = ?, date = ?, notes = ?, parent_id = ?
            WHERE id = ?
        `);
        stmt.run(archive.code, archive.description, archive.period, archive.date, archive.notes, archive.parent_id, archive.id);
        return archive;
    },

    deleteArchive: (id) => {
        const stmt = db.prepare('DELETE FROM archives WHERE id = ?');
        stmt.run(id);
        return { id };
    },

    // General Documents
    getGeneralDocuments: () => {
        return db.prepare(`
            SELECT gd.*, a.description as archive_description 
            FROM general_documents gd
            LEFT JOIN archives a ON gd.archive_id = a.id
            ORDER BY gd.created_at DESC
        `).all();
    },

    addGeneralDocument: (doc) => {
        const id = crypto.randomUUID();
        const stmt = db.prepare(`
            INSERT INTO general_documents (id, description, issue_date, expiry_date, related_entity_type, related_entity_id, archive_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
            id,
            doc.description,
            doc.issue_date,
            doc.expiry_date,
            doc.related_entity_type || null,
            doc.related_entity_id || null,
            doc.archive_id || null
        );
        return { id, ...doc };
    },

    updateGeneralDocument: (doc) => {
        const stmt = db.prepare(`
            UPDATE general_documents
            SET description = ?, issue_date = ?, expiry_date = ?, related_entity_type = ?, related_entity_id = ?, archive_id = ?
            WHERE id = ?
        `);
        stmt.run(
            doc.description,
            doc.issue_date,
            doc.expiry_date,
            doc.related_entity_type || null,
            doc.related_entity_id || null,
            doc.archive_id || null,
            doc.id
        );
        return doc;
    },

    deleteGeneralDocument: (id) => {
        const stmt = db.prepare('DELETE FROM general_documents WHERE id = ?');
        stmt.run(id);
        return { id };
    },

    // General Document Attachments
    getGeneralDocumentAttachments: (documentId) => {
        return db.prepare('SELECT * FROM general_document_attachments WHERE document_id = ?').all(documentId);
    },

    addGeneralDocumentAttachment: (attachment) => {
        const id = crypto.randomUUID();
        const stmt = db.prepare(`
            INSERT INTO general_document_attachments (id, document_id, title, file_path)
            VALUES (?, ?, ?, ?)
        `);
        stmt.run(id, attachment.documentId, attachment.title, attachment.filePath);
        return { id, ...attachment };
    },

    deleteGeneralDocumentAttachment: (id) => {
        const stmt = db.prepare('DELETE FROM general_document_attachments WHERE id = ?');
        stmt.run(id);
        return { id };
    },

    // Document Linking & Search
    getDocumentsInArchive: (archiveId) => {
        const genDocs = db.prepare(`
            SELECT 'general' as doc_type, gd.*, a.description as archive_description,
            CASE 
                WHEN gd.related_entity_type = 'supplier' THEN s.name
                WHEN gd.related_entity_type = 'client' THEN c.name
                WHEN gd.related_entity_type = 'staff' THEN st.name
                ELSE NULL
            END as entity_name
            FROM general_documents gd
            LEFT JOIN archives a ON gd.archive_id = a.id
            LEFT JOIN suppliers s ON gd.related_entity_id = s.id AND gd.related_entity_type = 'supplier'
            LEFT JOIN clients c ON gd.related_entity_id = c.id AND gd.related_entity_type = 'client'
            LEFT JOIN staff st ON gd.related_entity_id = st.id AND gd.related_entity_type = 'staff'
            WHERE gd.archive_id = ?
        `).all(archiveId);

        // Fetch attachments for each general document
        const genDocsWithAttachments = genDocs.map(doc => {
            const attachments = db.prepare('SELECT * FROM general_document_attachments WHERE document_id = ?').all(doc.id);
            return { ...doc, attachments };
        });

        const invoices = db.prepare(`
            SELECT 'invoice' as doc_type, i.*, dt.code as document_type_code, dt.name as document_type_name,
            CASE 
                WHEN i.supplier_id IS NOT NULL THEN s.name
                WHEN i.client_id IS NOT NULL THEN c.name
                ELSE NULL
            END as entity_name
            FROM invoices i
            LEFT JOIN document_types dt ON i.document_type_id = dt.id
            LEFT JOIN suppliers s ON i.supplier_id = s.id
            LEFT JOIN clients c ON i.client_id = c.id
            WHERE i.archive_id = ?
        `).all(archiveId);

        return [...genDocsWithAttachments, ...invoices];
    },

    searchLinkableDocuments: (filters) => {
        const { query = '', docType = 'all', entityType = 'all' } = filters;
        const q = `%${query}%`;
        let results = [];

        // 1. General Documents
        if (docType === 'all' || docType === 'general') {
            let sql = `
                SELECT 'general' as doc_type, gd.*,
                CASE 
                    WHEN gd.related_entity_type = 'supplier' THEN s.name
                    WHEN gd.related_entity_type = 'client' THEN c.name
                    WHEN gd.related_entity_type = 'staff' THEN st.name
                    ELSE NULL
                END as entity_name
                FROM general_documents gd
                LEFT JOIN suppliers s ON gd.related_entity_id = s.id AND gd.related_entity_type = 'supplier'
                LEFT JOIN clients c ON gd.related_entity_id = c.id AND gd.related_entity_type = 'client'
                LEFT JOIN staff st ON gd.related_entity_id = st.id AND gd.related_entity_type = 'staff'
                WHERE gd.archive_id IS NULL
            `;

            const params = [];
            if (query) {
                sql += ` AND (gd.description LIKE ? OR s.name LIKE ? OR c.name LIKE ? OR st.name LIKE ?)`;
                params.push(q, q, q, q);
            }
            if (entityType !== 'all') {
                sql += ` AND gd.related_entity_type = ?`;
                params.push(entityType);
            }

            sql += ` ORDER BY gd.created_at DESC LIMIT 50`;
            results = [...results, ...db.prepare(sql).all(...params)];
        }

        // 2. Invoices
        if (docType === 'all' || docType === 'invoice') {
            let sql = `
                SELECT 'invoice' as doc_type, i.*, dt.code as document_type_code,
                CASE 
                    WHEN i.supplier_id IS NOT NULL THEN s.name
                    WHEN i.client_id IS NOT NULL THEN c.name
                    ELSE NULL
                END as entity_name
                FROM invoices i
                LEFT JOIN document_types dt ON i.document_type_id = dt.id
                LEFT JOIN suppliers s ON i.supplier_id = s.id
                LEFT JOIN clients c ON i.client_id = c.id
                WHERE i.archive_id IS NULL
            `;

            const params = [];
            if (query) {
                sql += ` AND (i.document_number LIKE ? OR s.name LIKE ? OR c.name LIKE ? OR i.notes LIKE ?)`;
                params.push(q, q, q, q);
            }
            if (entityType === 'supplier') {
                sql += ` AND i.supplier_id IS NOT NULL`;
            } else if (entityType === 'client') {
                sql += ` AND i.client_id IS NOT NULL`;
            } else if (entityType === 'staff') {
                sql += ` AND 1=0`; // Invoices don't have staff
            }

            sql += ` ORDER BY i.created_at DESC LIMIT 50`;
            results = [...results, ...db.prepare(sql).all(...params)];
        }

        return results;
    },

    linkDocumentToArchive: (docType, docId, archiveId) => {
        if (docType === 'general') {
            return db.prepare('UPDATE general_documents SET archive_id = ? WHERE id = ?').run(archiveId, docId);
        } else if (docType === 'invoice') {
            return db.prepare('UPDATE invoices SET archive_id = ? WHERE id = ?').run(archiveId, docId);
        }
    },

    unlinkDocumentFromArchive: (docType, docId) => {
        if (docType === 'general') {
            return db.prepare('UPDATE general_documents SET archive_id = NULL WHERE id = ?').run(docId);
        } else if (docType === 'invoice') {
            return db.prepare('UPDATE invoices SET archive_id = NULL WHERE id = ?').run(docId);
        }
    }
};
