import db from '../database.js';

export const supplierRepo = {
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
};
