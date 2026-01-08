
export interface Supplier {
  id: string;
  name: string;
  nif: string;
  address: string;
  email: string;
  inAngola: boolean;
  ivaRegime: 'Geral' | 'Simplificado' | 'Exclusão';
  provinceId?: string;
  municipalityId?: string;
  conformityDeclarationNumber?: string;
  attachments: SupplierAttachment[];
}

export interface Province {
  id: string;
  code?: string;
  name: string;
}

export interface Municipality {
  id: string;
  provinceId: string;
  name: string;
}

export interface SupplierAttachment {
  id: string;
  supplierId: string;
  title: string;
  filePath: string;
}

export interface Client {
  id: string;
  name: string;
  nif: string;
  address: string;
  email: string;
  inAngola: boolean;
  ivaRegime: 'Geral' | 'Simplificado' | 'Exclusão';
  type: 'Normal' | 'Estado' | 'Instituição Financeira';
  provinceId?: string;
  municipalityId?: string;
  conformityDeclarationNumber?: string;
  cativeVatRate: number;
  attachments: ClientAttachment[];
}

export interface ClientAttachment {
  id: string;
  clientId: string;
  title: string;
  filePath: string;
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
  liquidatedVat: number;
  cativeVat: number;
  isService: boolean;
  withholdingAmount: number;
  withholdingTypeId?: string;
}

export interface Invoice {
  id: string;
  type: 'PURCHASE' | 'SALE';
  orderNumber: number;
  supplierId?: string;
  clientId?: string;
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
  totalLiquidated: number;
  totalCative: number;
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

export interface CompanyInfo {
  id: string;
  name: string;
  nif: string;
  address: string;
  location: string;
  provinceId: string;
  municipalityId: string;
  email: string;
  website: string;
  turnover: number;
  ivaRegime: 'Geral' | 'Simplificado' | 'Exclusão';
  serviceRegime: 'Imposto Industrial' | 'IRT Grupo B' | 'IRT Grupo C';
  hasStampDuty: boolean;
  stampDutyRate: number;
  logoPath?: string;
  attachments: CompanyAttachment[];
}

export interface CompanyAttachment {
  id: string;
  companyId: string;
  title: string;
  filePath: string;
}

export type View = 'dashboard' | 'inquiry' | 'reports' | 'suppliers' | 'clients' | 'staff' | 'invoices' | 'contracts' | 'cc_statement' | 'cc_operations' | 'cc_reports' | 'tax_ii' | 'tax_is' | 'tax_irt' | 'tax_iva' | 'tax_ip' | 'tax_ivm' | 'tax_iac' | 'settings' | 'irt_withholding_map' | 'irt_reports' | 'ii_withholding_map' | 'ii_reports' | 'ip_withholding_map' | 'ip_reports' | 'provinces' | 'municipalities' | 'sales' | 'purchases' | 'commercial_cc' | 'company_settings' | 'ii_withheld_values' | 'irt_withheld_values' | 'ip_withheld_values';

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
        getProvinces: () => Promise<Province[]>;
        addProvince: (province: any) => Promise<any>;
        updateProvince: (province: any) => Promise<any>;
        deleteProvince: (id: string) => Promise<any>;
        getMunicipalities: () => Promise<Municipality[]>;
        addMunicipality: (municipality: any) => Promise<any>;
        updateMunicipality: (municipality: any) => Promise<any>;
        deleteMunicipality: (id: string) => Promise<any>;
        getSupplierAttachments: (supplierId: string) => Promise<SupplierAttachment[]>;
        addSupplierAttachment: (attachment: any) => Promise<any>;
        deleteSupplierAttachment: (id: string) => Promise<any>;
        getClients: () => Promise<Client[]>;
        addClient: (client: any) => Promise<any>;
        updateClient: (client: any) => Promise<any>;
        deleteClient: (id: string) => Promise<any>;
        getClientAttachments: (clientId: string) => Promise<ClientAttachment[]>;
        addClientAttachment: (attachment: any) => Promise<any>;
        deleteClientAttachment: (id: string) => Promise<any>;
        getCompanyInfo: () => Promise<CompanyInfo | null>;
        updateCompanyInfo: (company: Partial<CompanyInfo>) => Promise<any>;
        getCompanyAttachments: (companyId: string) => Promise<CompanyAttachment[]>;
        addCompanyAttachment: (attachment: CompanyAttachment) => Promise<any>;
        deleteCompanyAttachment: (id: string) => Promise<any>;
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
