
export interface Supplier {
  id: string;
  name: string;
  nif: string;
  address: string;
  email: string;
}

export interface TaxLine {
  id: string;
  taxableValue: number;
  rate: number;
  supportedVat: number;
  deductibleVat: number;
}

export interface Invoice {
  id: string;
  orderNumber: number;
  supplierId: string;
  date: string;
  documentNumber: string;
  notes: string;
  hasPdf: boolean;
  pdfPath?: string; // Caminho no storage
  lines: TaxLine[];
  totalTaxable: number;
  totalSupported: number;
  totalDeductible: number;
  totalDocument: number;
}

export type View = 'dashboard' | 'suppliers' | 'invoices' | 'reports' | 'inquiry';

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

