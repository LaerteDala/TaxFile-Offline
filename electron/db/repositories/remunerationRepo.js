import db from '../database.js';

export const remunerationRepo = {
    // Maps
    getRemunerationMaps: () => {
        return db.prepare('SELECT * FROM remuneration_maps ORDER BY period DESC').all();
    },

    getRemunerationMap: (id) => {
        const map = db.prepare('SELECT * FROM remuneration_maps WHERE id = ?').get(id);
        if (!map) return null;

        const lines = db.prepare(`
            SELECT rl.*, s.name as staff_name, s.nif as staff_nif, s.social_security_number, s.job_function as job_title
            FROM remuneration_lines rl
            JOIN staff s ON rl.staff_id = s.id
            WHERE rl.map_id = ?
        `).all(id);

        const linesWithSubsidies = lines.map(line => {
            const subsidies = db.prepare(`
                SELECT rls.*, s.name as subsidy_name
                FROM remuneration_line_subsidies rls
                JOIN subsidies s ON rls.subsidy_id = s.id
                WHERE rls.line_id = ?
            `).all(line.id);
            return { ...line, subsidies };
        });

        return { ...map, lines: linesWithSubsidies };
    },

    addRemunerationMap: (map) => {
        const stmt = db.prepare('INSERT INTO remuneration_maps (id, map_number, period, status) VALUES (?, ?, ?, ?)');
        return stmt.run(map.id, map.map_number, map.period, map.status);
    },

    updateRemunerationMapStatus: (id, status) => {
        return db.prepare('UPDATE remuneration_maps SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
    },

    deleteRemunerationMap: (id) => {
        return db.prepare('DELETE FROM remuneration_maps WHERE id = ?').run(id);
    },

    // Lines
    addRemunerationLine: (line) => {
        const stmt = db.prepare(`
            INSERT INTO remuneration_lines (
                id, map_id, staff_id, base_salary, overtime_value, deductions_value,
                manual_excess_bool, manual_excess_value,
                total_non_subject_subsidies, total_subject_subsidies,
                gross_salary, inss_base, inss_value,
                irt_base, irt_scale_id, irt_value, net_salary
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(
            line.id, line.map_id, line.staff_id, line.base_salary, line.overtime_value, line.deductions_value,
            line.manual_excess_bool ? 1 : 0, line.manual_excess_value,
            line.total_non_subject_subsidies, line.total_subject_subsidies,
            line.gross_salary, line.inss_base, line.inss_value,
            line.irt_base, line.irt_scale_id, line.irt_value, line.net_salary
        );
    },

    updateRemunerationLine: (line) => {
        const stmt = db.prepare(`
            UPDATE remuneration_lines SET
                base_salary = ?, overtime_value = ?, deductions_value = ?,
                manual_excess_bool = ?, manual_excess_value = ?,
                total_non_subject_subsidies = ?, total_subject_subsidies = ?,
                gross_salary = ?, inss_base = ?, inss_value = ?,
                irt_base = ?, irt_scale_id = ?, irt_value = ?, net_salary = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `);
        return stmt.run(
            line.base_salary, line.overtime_value, line.deductions_value,
            line.manual_excess_bool ? 1 : 0, line.manual_excess_value,
            line.total_non_subject_subsidies, line.total_subject_subsidies,
            line.gross_salary, line.inss_base, line.inss_value,
            line.irt_base, line.irt_scale_id, line.irt_value, line.net_salary,
            line.id
        );
    },

    deleteRemunerationLine: (id) => {
        return db.prepare('DELETE FROM remuneration_lines WHERE id = ?').run(id);
    },

    // Line Subsidies
    addRemunerationLineSubsidy: (subsidy) => {
        const stmt = db.prepare('INSERT INTO remuneration_line_subsidies (id, line_id, subsidy_id, amount) VALUES (?, ?, ?, ?)');
        return stmt.run(subsidy.id, subsidy.line_id, subsidy.subsidy_id, subsidy.amount);
    },

    deleteRemunerationLineSubsidies: (lineId) => {
        return db.prepare('DELETE FROM remuneration_line_subsidies WHERE line_id = ?').run(lineId);
    }
};
