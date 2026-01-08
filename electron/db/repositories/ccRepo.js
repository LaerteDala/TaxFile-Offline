import db from '../database.js';

export const ccRepo = {
    getCCDocuments: () => {
        return db.prepare('SELECT * FROM cc_documents ORDER BY created_at DESC').all().map(doc => ({
            id: doc.id,
            type: doc.type,
            nature: doc.nature,
            referenceNumber: doc.reference_number,
            year: doc.year,
            period: doc.period,
            taxType: doc.tax_type,
            relatedTax: doc.related_tax,
            description: doc.description,
            taxableValue: doc.taxable_value,
            rate: doc.rate,
            amountToPay: doc.amount_to_pay,
            interest: doc.interest,
            fines: doc.fines,
            totalAmount: doc.total_amount,
            issueDate: doc.issue_date,
            dueDate: doc.due_date,
            receiptDate: doc.receipt_date,
            attachmentPath: doc.attachment_path,
            hasAttachment: !!doc.has_attachment,
            relatedDocumentId: doc.related_document_id
        }));
    },

    addCCDocument: (doc) => {
        const stmt = db.prepare(`
            INSERT INTO cc_documents (
                id, type, nature, reference_number, year, period, tax_type, related_tax, 
                description, taxable_value, rate, amount_to_pay, interest, fines, 
                total_amount, issue_date, due_date, receipt_date, attachment_path, 
                has_attachment, related_document_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(
            doc.id, doc.type, doc.nature, doc.referenceNumber, doc.year, doc.period, doc.taxType, doc.relatedTax,
            doc.description, doc.taxableValue, doc.rate, doc.amountToPay, doc.interest, doc.fines,
            doc.totalAmount, doc.issueDate, doc.dueDate, doc.receiptDate, doc.attachmentPath,
            doc.hasAttachment ? 1 : 0, doc.relatedDocumentId
        );
    },

    updateCCDocument: (doc) => {
        const stmt = db.prepare(`
            UPDATE cc_documents SET 
                type = ?, nature = ?, reference_number = ?, year = ?, period = ?, 
                tax_type = ?, related_tax = ?, description = ?, taxable_value = ?, 
                rate = ?, amount_to_pay = ?, interest = ?, fines = ?, 
                total_amount = ?, issue_date = ?, due_date = ?, receipt_date = ?, 
                attachment_path = ?, has_attachment = ?, related_document_id = ?
            WHERE id = ?
        `);
        return stmt.run(
            doc.type, doc.nature, doc.referenceNumber, doc.year, doc.period,
            doc.taxType, doc.relatedTax, doc.description, doc.taxableValue,
            doc.rate, doc.amountToPay, doc.interest, doc.fines,
            doc.totalAmount, doc.issueDate, doc.dueDate, doc.receiptDate,
            doc.attachmentPath, doc.hasAttachment ? 1 : 0, doc.relatedDocumentId, doc.id
        );
    },

    deleteCCDocument: (id) => db.prepare('DELETE FROM cc_documents WHERE id = ?').run(id),
};
