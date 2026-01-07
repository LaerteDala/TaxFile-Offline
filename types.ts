
export interface Supplier {
  id: string;
  name: string;
  nif: string;
  address: string;
  email: string;
}

export interface DocumentType {
  id: string;
  code: string;
  name: string;
}

export interface WithholdingType {
  id: string;
  name: string;
  rate: number;
}

export interface TaxLine {
  id: string;
  taxableValue: number;
  rate: number;
  supportedVat: number;
  deductibleVat: number;
  isService: boolean;
  withholdingAmount: number;
  withholdingTypeId?: string;
}

export interface Invoice {
  id: string;
  orderNumber: number;
  supplierId: string;
  documentTypeId: string;
  date: string;
  documentNumber: string;
  notes: string;
  hasPdf: boolean;
  pdfPath?: string;
  lines: TaxLine[];
  totalTaxable: number;
  totalSupported: number;
  totalDeductible: number;
  totalWithholding: number;
  totalDocument: number;
}

export type CCDocumentType = 'LIQUIDACAO' | 'PAGAMENTO' | 'RECIBO';
export type CCNature = 'PENDENTE' | 'LIQUIDACAO' | 'NENHUMA';

export interface CCDocument {
  id: string;
  type: CCDocumentType;
  nature: CCNature;
  referenceNumber: string;
  year: number;
  period: string;
  taxType: string;
  relatedTax: string;
  description: string;
  taxableValue: number;
  rate: number;
  amountToPay: number;
  interest: number;
  fines: number;
  totalAmount: number;
  issueDate: string;
  dueDate?: string;
  receiptDate?: string;
  attachmentPath?: string;
  hasAttachment: boolean;
  relatedDocumentId?: string;
}

export type View = 'dashboard' | 'inquiry' | 'reports' | 'suppliers' | 'clients' | 'staff' | 'invoices' | 'contracts' | 'cc_statement' | 'cc_operations' | 'cc_reports' | 'tax_ii' | 'tax_is' | 'tax_irt' | 'tax_iva' | 'tax_ip' | 'tax_ivm' | 'tax_iac' | 'settings';

declare global {
  interface Window {
    electron: {
      db: {
        getSuppliers: () => Promise<any[]>;
        addSupplier: (supplier: any) => Promise<any>;
        updateSupplier: (supplier: any) => Promise<any>;
        deleteSupplier: (id: string) => Promise<any>;
        getInvoices: () => Promise<any[]>;
        addInvoice: (invoice: any, taxLines: any[]) => Promise<any>;
        updateInvoice: (invoice: any, taxLines: any[]) => Promise<any>;
        deleteInvoice: (id: string) => Promise<any>;
        getDocumentTypes: () => Promise<any[]>;
        addDocumentType: (docType: any) => Promise<any>;
        updateDocumentType: (docType: any) => Promise<any>;
        deleteDocumentType: (id: string) => Promise<any>;
        getWithholdingTypes: () => Promise<WithholdingType[]>;
        addWithholdingType: (wt: any) => Promise<any>;
        updateWithholdingType: (wt: any) => Promise<any>;
        deleteWithholdingType: (id: string) => Promise<any>;
        getCCDocuments: () => Promise<CCDocument[]>;
        addCCDocument: (doc: any) => Promise<any>;
        updateCCDocument: (doc: any) => Promise<any>;
        deleteCCDocument: (id: string) => Promise<any>;
      };
      fs: {
        saveFile: (fileName: string, buffer: ArrayBuffer) => Promise<string>;
        openFile: (filePath: string) => Promise<void>;
        readFile: (filePath: string) => Promise<Uint8Array | null>;
      };
      auth: {
        login: (email: string, password: string) => Promise<any>;
      };
    };
  }
}
