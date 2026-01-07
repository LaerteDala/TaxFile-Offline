
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

export interface TaxLine {
  id: string;
  taxableValue: number;
  rate: number;
  supportedVat: number;
  deductibleVat: number;
  isService: boolean;
  withholdingAmount: number;
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

export type View = 'dashboard' | 'suppliers' | 'invoices' | 'reports' | 'inquiry' | 'document_types';

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
