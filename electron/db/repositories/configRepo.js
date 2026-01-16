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
    getMunicipalities: () => {
        const municipalities = db.prepare('SELECT * FROM municipalities ORDER BY name').all();
        return municipalities.map(m => ({
            ...m,
            provinceId: m.province_id
        }));
    },
    addMunicipality: (municipality) => {
        const stmt = db.prepare('INSERT INTO municipalities (id, province_id, name) VALUES (?, ?, ?)');
        return stmt.run(municipality.id, municipality.provinceId || municipality.province_id, municipality.name);
    },
    updateMunicipality: (municipality) => {
        const stmt = db.prepare('UPDATE municipalities SET province_id = ?, name = ? WHERE id = ?');
        return stmt.run(municipality.provinceId || municipality.province_id, municipality.name, municipality.id);
    },
    deleteMunicipality: (id) => db.prepare('DELETE FROM municipalities WHERE id = ?').run(id),

    // Departments
    getDepartments: () => db.prepare('SELECT * FROM departments ORDER BY name').all(),
    addDepartment: (dept) => {
        const stmt = db.prepare('INSERT INTO departments (id, name) VALUES (?, ?)');
        return stmt.run(dept.id, dept.name);
    },
    updateDepartment: (dept) => {
        const stmt = db.prepare('UPDATE departments SET name = ? WHERE id = ?');
        return stmt.run(dept.name, dept.id);
    },
    deleteDepartment: (id) => db.prepare('DELETE FROM departments WHERE id = ?').run(id),

    // Job Functions
    getJobFunctions: () => db.prepare('SELECT * FROM job_functions ORDER BY name').all(),
    addJobFunction: (jf) => {
        const stmt = db.prepare('INSERT INTO job_functions (id, name) VALUES (?, ?)');
        return stmt.run(jf.id, jf.name);
    },
    updateJobFunction: (jf) => {
        const stmt = db.prepare('UPDATE job_functions SET name = ? WHERE id = ?');
        return stmt.run(jf.name, jf.id);
    },
    deleteJobFunction: (id) => db.prepare('DELETE FROM job_functions WHERE id = ?').run(id),

    // IRT Scales
    getIRTScales: () => db.prepare('SELECT * FROM irt_scales ORDER BY escalao').all(),
    addIRTScale: (scale) => {
        const stmt = db.prepare('INSERT INTO irt_scales (id, escalao, valor_inicial, valor_final, parcela_fixa, taxa, excesso) VALUES (?, ?, ?, ?, ?, ?, ?)');
        return stmt.run(scale.id, scale.escalao, scale.valor_inicial, scale.valor_final, scale.parcela_fixa, scale.taxa, scale.excesso);
    },
    updateIRTScale: (scale) => {
        const stmt = db.prepare('UPDATE irt_scales SET escalao = ?, valor_inicial = ?, valor_final = ?, parcela_fixa = ?, taxa = ?, excesso = ? WHERE id = ?');
        return stmt.run(scale.escalao, scale.valor_inicial, scale.valor_final, scale.parcela_fixa, scale.taxa, scale.excesso, scale.id);
    },
    deleteIRTScale: (id) => db.prepare('DELETE FROM irt_scales WHERE id = ?').run(id),

    // Subsidies
    getSubsidies: () => db.prepare('SELECT * FROM subsidies ORDER BY name').all(),
    addSubsidy: (subsidy) => {
        const stmt = db.prepare('INSERT INTO subsidies (id, name, subject_to_inss, inss_limit_type, inss_limit_value, subject_to_irt, irt_limit_type, irt_limit_value) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        return stmt.run(subsidy.id, subsidy.name, subsidy.subject_to_inss, subsidy.inss_limit_type, subsidy.inss_limit_value, subsidy.subject_to_irt, subsidy.irt_limit_type, subsidy.irt_limit_value);
    },
    updateSubsidy: (subsidy) => {
        const stmt = db.prepare('UPDATE subsidies SET name = ?, subject_to_inss = ?, inss_limit_type = ?, inss_limit_value = ?, subject_to_irt = ?, irt_limit_type = ?, irt_limit_value = ? WHERE id = ?');
        return stmt.run(subsidy.name, subsidy.subject_to_inss, subsidy.inss_limit_type, subsidy.inss_limit_value, subsidy.subject_to_irt, subsidy.irt_limit_type, subsidy.irt_limit_value, subsidy.id);
    },
    deleteSubsidy: (id) => db.prepare('DELETE FROM subsidies WHERE id = ?').run(id),
};
