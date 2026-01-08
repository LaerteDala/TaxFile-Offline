import db from '../database.js';
import crypto from 'crypto';

export const companyRepo = {
    // Company Info
    getCompanyInfo: () => {
        const company = db.prepare('SELECT * FROM company_info LIMIT 1').get();
        if (!company) return null;
        const attachments = db.prepare('SELECT * FROM company_attachments WHERE company_id = ?').all(company.id);
        return {
            ...company,
            turnover: company.turnover,
            ivaRegime: company.iva_regime,
            serviceRegime: company.service_regime,
            hasStampDuty: !!company.has_stamp_duty,
            stampDutyRate: company.stamp_duty_rate,
            logoPath: company.logo_path,
            provinceId: company.province_id,
            municipalityId: company.municipality_id,
            attachments: attachments.map(a => ({
                id: a.id,
                companyId: a.company_id,
                title: a.title,
                filePath: a.file_path
            }))
        };
    },

    updateCompanyInfo: (company) => {
        const existing = db.prepare('SELECT id FROM company_info LIMIT 1').get();
        if (!existing) {
            const stmt = db.prepare(`
                INSERT INTO company_info (
                    id, name, nif, address, location, province_id, municipality_id, 
                    email, website, turnover, iva_regime, service_regime, 
                    has_stamp_duty, stamp_duty_rate, logo_path
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            return stmt.run(
                company.id || crypto.randomUUID(), company.name, company.nif, company.address,
                company.location, company.provinceId, company.municipalityId,
                company.email, company.website, company.turnover, company.ivaRegime,
                company.serviceRegime, company.hasStampDuty ? 1 : 0,
                company.stampDutyRate, company.logoPath
            );
        } else {
            const stmt = db.prepare(`
                UPDATE company_info SET 
                    name = ?, nif = ?, address = ?, location = ?, 
                    province_id = ?, municipality_id = ?, email = ?, 
                    website = ?, turnover = ?, iva_regime = ?, 
                    service_regime = ?, has_stamp_duty = ?, 
                    stamp_duty_rate = ?, logo_path = ?
                WHERE id = ?
            `);
            return stmt.run(
                company.name, company.nif, company.address, company.location,
                company.provinceId, company.municipalityId, company.email,
                company.website, company.turnover, company.ivaRegime,
                company.serviceRegime, company.hasStampDuty ? 1 : 0,
                company.stampDutyRate, company.logoPath,
                existing.id
            );
        }
    },

    // Company Attachments
    getCompanyAttachments: (companyId) => {
        return db.prepare('SELECT * FROM company_attachments WHERE company_id = ?').all(companyId).map(a => ({
            id: a.id,
            companyId: a.company_id,
            title: a.title,
            filePath: a.file_path
        }));
    },

    addCompanyAttachment: (attachment) => {
        const stmt = db.prepare('INSERT INTO company_attachments (id, company_id, title, file_path) VALUES (?, ?, ?, ?)');
        return stmt.run(attachment.id, attachment.companyId, attachment.title, attachment.filePath);
    },

    deleteCompanyAttachment: (id) => db.prepare('DELETE FROM company_attachments WHERE id = ?').run(id)
};
