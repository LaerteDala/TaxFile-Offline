
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
