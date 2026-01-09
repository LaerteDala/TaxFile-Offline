import db from '../database.js';

export const staffRepo = {
    getStaff: () => {
        const staff = db.prepare('SELECT * FROM staff ORDER BY name').all();
        return staff.map(s => {
            const attachments = db.prepare('SELECT * FROM staff_attachments WHERE staff_id = ?').all(s.id);
            return {
                ...s,
                identityDocument: s.identity_document,
                socialSecurityNumber: s.social_security_number,
                jobFunction: s.job_function,
                provinceId: s.province_id,
                municipalityId: s.municipality_id,
                notSubjectToSS: !!s.not_subject_to_ss,
                irtExempt: !!s.irt_exempt,
                isRetired: !!s.is_retired,
                ssContributionRate: s.ss_contribution_rate,
                photoPath: s.photo_path,
                attachments: attachments.map(a => ({
                    id: a.id,
                    staffId: a.staff_id,
                    title: a.title,
                    filePath: a.file_path
                }))
            };
        });
    },

    addStaff: (staff) => {
        const stmt = db.prepare(`
            INSERT INTO staff (
                id, name, identity_document, nif, social_security_number, 
                department, job_function, province_id, municipality_id, 
                type, not_subject_to_ss, irt_exempt, is_retired, ss_contribution_rate, photo_path
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(
            staff.id, staff.name, staff.identityDocument, staff.nif, staff.socialSecurityNumber,
            staff.department, staff.jobFunction, staff.provinceId, staff.municipalityId,
            staff.type, staff.notSubjectToSS ? 1 : 0, staff.irtExempt ? 1 : 0,
            staff.isRetired ? 1 : 0, staff.ssContributionRate, staff.photoPath
        );
    },

    updateStaff: (staff) => {
        const stmt = db.prepare(`
            UPDATE staff SET 
                name = ?, identity_document = ?, nif = ?, social_security_number = ?, 
                department = ?, job_function = ?, province_id = ?, municipality_id = ?, 
                type = ?, not_subject_to_ss = ?, irt_exempt = ?, is_retired = ?, 
                ss_contribution_rate = ?, photo_path = ? 
            WHERE id = ?
        `);
        return stmt.run(
            staff.name, staff.identityDocument, staff.nif, staff.socialSecurityNumber,
            staff.department, staff.jobFunction, staff.provinceId, staff.municipalityId,
            staff.type, staff.notSubjectToSS ? 1 : 0, staff.irtExempt ? 1 : 0,
            staff.isRetired ? 1 : 0, staff.ssContributionRate, staff.photoPath,
            staff.id
        );
    },

    deleteStaff: (id) => db.prepare('DELETE FROM staff WHERE id = ?').run(id),

    getStaffAttachments: (staffId) => {
        return db.prepare('SELECT * FROM staff_attachments WHERE staff_id = ?').all(staffId).map(a => ({
            id: a.id,
            staffId: a.staff_id,
            title: a.title,
            filePath: a.file_path
        }));
    },

    addStaffAttachment: (attachment) => {
        const stmt = db.prepare('INSERT INTO staff_attachments (id, staff_id, title, file_path) VALUES (?, ?, ?, ?)');
        return stmt.run(attachment.id, attachment.staffId, attachment.title, attachment.filePath);
    },

    deleteStaffAttachment: (id) => db.prepare('DELETE FROM staff_attachments WHERE id = ?').run(id),
};
