import db from '../database.js';

export const invoiceRepo = {
    getInvoices: () => {
        const invoices = db.prepare('SELECT * FROM invoices ORDER BY date DESC, order_number DESC').all();
        return invoices.map(inv => {
            const lines = db.prepare('SELECT * FROM tax_lines WHERE invoice_id = ?').all(inv.id);
            const mappedLines = lines.map(l => ({
                id: l.id,
                taxableValue: l.taxable_value,
                rate: l.rate,
                supportedVat: l.supported_vat,
                deductibleVat: l.deductible_vat,
                liquidatedVat: l.liquidated_vat,
                cativeVat: l.cative_vat,
                isService: !!l.is_service,
                withholdingAmount: l.withholding_amount,
                withholdingTypeId: l.withholding_type_id
            }));

            return {
                id: inv.id,
                type: inv.type,
                orderNumber: inv.order_number,
                supplierId: inv.supplier_id,
                clientId: inv.client_id,
                documentTypeId: inv.document_type_id,
                date: inv.date,
                documentNumber: inv.document_number,
                notes: inv.notes,
                hasPdf: !!inv.has_pdf,
                pdfPath: inv.pdf_path,
                lines: mappedLines,
                totalTaxable: mappedLines.reduce((sum, l) => sum + l.taxableValue, 0),
                totalSupported: mappedLines.reduce((sum, l) => sum + l.supportedVat, 0),
                totalDeductible: mappedLines.reduce((sum, l) => sum + l.deductibleVat, 0),
                totalLiquidated: mappedLines.reduce((sum, l) => sum + l.liquidatedVat, 0),
                totalCative: mappedLines.reduce((sum, l) => sum + l.cativeVat, 0),
                totalWithholding: mappedLines.reduce((sum, l) => sum + l.withholdingAmount, 0),
                totalDocument: mappedLines.reduce((sum, l) => sum + l.taxableValue + (inv.type === 'PURCHASE' ? l.supportedVat : l.liquidatedVat) - l.withholdingAmount, 0)
            };
        });
    },

    addInvoice: ({ invoice, taxLines }) => {
        const insertInvoice = db.prepare(`
            INSERT INTO invoices (id, type, order_number, supplier_id, client_id, document_type_id, date, document_number, notes, has_pdf, pdf_path)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const insertLine = db.prepare(`
            INSERT INTO tax_lines (id, invoice_id, taxable_value, rate, supported_vat, deductible_vat, liquidated_vat, cative_vat, is_service, withholding_amount, withholding_type_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const transaction = db.transaction((inv, lines) => {
            insertInvoice.run(inv.id, inv.type, inv.orderNumber, inv.supplierId, inv.clientId, inv.documentTypeId, inv.date, inv.documentNumber, inv.notes, inv.hasPdf ? 1 : 0, inv.pdfPath);
            for (const line of lines) {
                insertLine.run(line.id, inv.id, line.taxableValue, line.rate, line.supportedVat, line.deductibleVat, line.liquidatedVat, line.cativeVat, line.isService ? 1 : 0, line.withholdingAmount, line.withholdingTypeId);
            }
        });

        return transaction(invoice, taxLines);
    },

    updateInvoice: ({ invoice, taxLines }) => {
        const updateInvoice = db.prepare(`
            UPDATE invoices SET 
                type = ?, order_number = ?, supplier_id = ?, client_id = ?, document_type_id = ?, 
                date = ?, document_number = ?, notes = ?, has_pdf = ?, pdf_path = ?
            WHERE id = ?
        `);
        const deleteLines = db.prepare('DELETE FROM tax_lines WHERE invoice_id = ?');
        const insertLine = db.prepare(`
            INSERT INTO tax_lines (id, invoice_id, taxable_value, rate, supported_vat, deductible_vat, liquidated_vat, cative_vat, is_service, withholding_amount, withholding_type_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const transaction = db.transaction((inv, lines) => {
            updateInvoice.run(inv.type, inv.orderNumber, inv.supplierId, inv.clientId, inv.documentTypeId, inv.date, inv.documentNumber, inv.notes, inv.hasPdf ? 1 : 0, inv.pdfPath, inv.id);
            deleteLines.run(inv.id);
            for (const line of lines) {
                insertLine.run(line.id, inv.id, line.taxableValue, line.rate, line.supportedVat, line.deductibleVat, line.liquidatedVat, line.cativeVat, line.isService ? 1 : 0, line.withholdingAmount, line.withholdingTypeId);
            }
        });

        return transaction(invoice, taxLines);
    },

    deleteInvoice: (id) => db.prepare('DELETE FROM invoices WHERE id = ?').run(id),
};
