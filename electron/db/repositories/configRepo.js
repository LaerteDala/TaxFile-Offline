import db from '../database.js';

export const configRepo = {
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

    // Provinces
    getProvinces: () => db.prepare('SELECT * FROM provinces ORDER BY name').all(),
    addProvince: (province) => {
        const stmt = db.prepare('INSERT INTO provinces (id, code, name) VALUES (?, ?, ?)');
        return stmt.run(province.id, province.code, province.name);
    },
    updateProvince: (province) => {
        const stmt = db.prepare('UPDATE provinces SET code = ?, name = ? WHERE id = ?');
        return stmt.run(province.code, province.name, province.id);
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
};
