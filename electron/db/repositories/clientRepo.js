import db from '../database.js';

export const clientRepo = {
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
};
