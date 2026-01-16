import db from '../database.js';

export const fiscalRepo = {
    // IVA Classifications
    getIVAClassifications: () => {
        return db.prepare(`
            SELECT 
                id, 
                code, 
                description, 
                taxable_base_line as taxableBaseLine, 
                taxpayer_tax_line as taxpayerTaxLine, 
                state_tax_line as stateTaxLine 
            FROM iva_classifications 
            ORDER BY code ASC
        `).all();
    },
    addIVAClassification: (iva) => {
        const stmt = db.prepare('INSERT INTO iva_classifications (id, code, description, taxable_base_line, taxpayer_tax_line, state_tax_line) VALUES (?, ?, ?, ?, ?, ?)');
        return stmt.run(iva.id, iva.code, iva.description, iva.taxableBaseLine, iva.taxpayerTaxLine, iva.stateTaxLine);
    },
    updateIVAClassification: (iva) => {
        const stmt = db.prepare('UPDATE iva_classifications SET code = ?, description = ?, taxable_base_line = ?, taxpayer_tax_line = ?, state_tax_line = ? WHERE id = ?');
        return stmt.run(iva.code, iva.description, iva.taxableBaseLine, iva.taxpayerTaxLine, iva.stateTaxLine, iva.id);
    },
    deleteIVAClassification: (id) => {
        return db.prepare('DELETE FROM iva_classifications WHERE id = ?').run(id);
    },
    seedDefaultIVA: () => {
        const defaultIVA = [
            { code: '1', description: 'Transmissão de bens e prestação de serviços em que liquidou imposto', base: '1', taxpayer: null, state: '2' },
            { code: '1.1', description: 'Transmissões de bens efectuadas na Província de Cabinda em que liquidou o imposto à taxa reduzida', base: '1.1', taxpayer: null, state: '2.1' },
            { code: '1.2', description: 'Transmissões de bens e prestações de serviços em que liquidou imposto à taxa reduzida de 5%', base: '1.2', taxpayer: null, state: '2.2' },
            { code: '1.3', description: 'Transmissões de bens e prestações de serviços em que liquidou imposto à taxa reduzida de 7%', base: '1.3', taxpayer: null, state: '2.3' },
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

        const run = db.transaction(() => {
            defaultIVA.forEach(iva => {
                const existing = checkIVA.get(iva.code);
                if (existing) {
                    updateIVA.run(iva.description, iva.base, iva.taxpayer, iva.state, iva.code);
                } else {
                    insertIVA.run(crypto.randomUUID(), iva.code, iva.description, iva.base, iva.taxpayer, iva.state);
                }
            });
        });

        run();
        return { success: true };
    },

    // Stamp Duty Classifications
    getStampDutyClassifications: () => {
        return db.prepare('SELECT * FROM stamp_duty_classifications ORDER BY code ASC').all();
    },
    addStampDutyClassification: (sd) => {
        const stmt = db.prepare('INSERT INTO stamp_duty_classifications (id, code, description) VALUES (?, ?, ?)');
        return stmt.run(sd.id, sd.code, sd.description);
    },
    updateStampDutyClassification: (sd) => {
        const stmt = db.prepare('UPDATE stamp_duty_classifications SET code = ?, description = ? WHERE id = ?');
        return stmt.run(sd.code, sd.description, sd.id);
    },
    deleteStampDutyClassification: (id) => {
        return db.prepare('DELETE FROM stamp_duty_classifications WHERE id = ?').run(id);
    },

    // Industrial Tax Classifications
    getIndustrialTaxClassifications: () => {
        return db.prepare('SELECT * FROM industrial_tax_classifications ORDER BY code ASC').all();
    },
    addIndustrialTaxClassification: (it) => {
        const stmt = db.prepare('INSERT INTO industrial_tax_classifications (id, code, description) VALUES (?, ?, ?)');
        return stmt.run(it.id, it.code, it.description);
    },
    updateIndustrialTaxClassification: (it) => {
        const stmt = db.prepare('UPDATE industrial_tax_classifications SET code = ?, description = ? WHERE id = ?');
        return stmt.run(it.code, it.description, it.id);
    },
    deleteIndustrialTaxClassification: (id) => {
        return db.prepare('DELETE FROM industrial_tax_classifications WHERE id = ?').run(id);
    }
};
