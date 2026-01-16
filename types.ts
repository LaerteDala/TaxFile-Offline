
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
  subjectToIVA: boolean;
  subjectToStampDuty: boolean;
  subjectToIndustrialTax: boolean;
}

export interface IVAClassification {
  id: string;
  code: string;
  description: string;
  taxableBaseLine?: string;
  taxpayerTaxLine?: string;
  stateTaxLine?: string;
}

export interface StampDutyClassification {
  id: string;
  code: string;
  description: string;
}

export interface IndustrialTaxClassification {
  id: string;
  code: string;
  description: string;
}

export interface WithholdingType {
  id: string;
  name: string;
  rate: number;
}

export interface Department {
  id: string;
  name: string;
}

export interface JobFunction {
  id: string;
  name: string;
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
  ivaClassificationId?: string;
  stampDutyClassificationId?: string;
  industrialTaxClassificationId?: string;
}

export interface Invoice {
  id: string;
  type: 'PURCHASE' | 'SALE';
  orderNumber: number;
  supplierId?: string;
  clientId?: string;
  documentTypeId: string;
  date: string;
  dueDate?: string;
  documentNumber: string;
  notes: string;
  hasPdf: boolean;
  pdfPath?: string;
  archiveIds?: string[];
  archives?: Archive[];
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

export interface Staff {
  id: string;
  name: string;
  identityDocument: string;
  nif: string;
  socialSecurityNumber: string;
  department: string;
  jobFunction: string;
  provinceId: string;
  municipalityId: string;
  type: 'Nacional' | 'Estrangeiro';
  notSubjectToSS: boolean;
  irtExempt: boolean;
  isRetired: boolean;
  ssContributionRate: 0 | 3 | 8;
  photoPath?: string;
  attachments: StaffAttachment[];
}

export interface StaffAttachment {
  id: string;
  staffId: string;
  title: string;
  filePath: string;
}

export interface IRTScale {
  id: string;
  escalao: number;
  valor_inicial: number;
  valor_final: number | null;
  parcela_fixa: number;
  taxa: number;
  excesso: number;
}

export interface Subsidy {
  id: string;
  name: string;
  subject_to_inss: number; // 0 or 1
  inss_limit_type: 'none' | 'fixed' | 'percentage';
  inss_limit_value: number;
  subject_to_irt: number; // 0 or 1
  irt_limit_type: 'none' | 'fixed' | 'percentage';
  irt_limit_value: number;
}

export interface RemunerationMap {
  id: string;
  map_number: number;
  period: string; // YYYY-MM
  status: 'draft' | 'approved';
  created_at?: string;
  updated_at?: string;
  lines?: RemunerationLine[];
}

export interface RemunerationLine {
  id: string;
  map_id: string;
  staff_id: string;
  staff_name?: string;
  staff_nif?: string;
  social_security_number?: string;
  job_title?: string;

  base_salary: number;
  overtime_value: number;
  deductions_value: number;

  manual_excess_bool: number; // 0 or 1
  manual_excess_value: number;

  total_non_subject_subsidies: number;
  total_subject_subsidies: number;

  gross_salary: number;

  inss_base: number;
  inss_value: number;

  irt_base: number;
  irt_scale_id: string | null;
  irt_value: number;

  net_salary: number;

  subsidies?: RemunerationLineSubsidy[];
}

export interface RemunerationLineSubsidy {
  id: string;
  line_id: string;
  subsidy_id: string;
  subsidy_name?: string;
  amount: number;
}

export interface Archive {
  id: string;
  code?: string;
  description: string;
  period?: string;
  date?: string;
  notes?: string;
  parent_id?: string;
  created_at?: string;
}

export interface GeneralDocument {
  id: string;
  description: string;
  issue_date?: string;
  expiry_date?: string;
  related_entity_type?: string;
  related_entity_id?: string;
  archiveIds?: string[];
  archives?: Archive[];
  archive_description?: string;
  created_at?: string;
}

export interface GeneralDocumentAttachment {
  id: string;
  document_id: string;
  title: string;
  file_path: string;
  created_at?: string;
}

export interface DeadlineConfig {
  id: string;
  document_type: string;
  document_type_name?: string;
  days_before: number;
  created_at?: string;
  updated_at?: string;
}

export interface DeadlineItem {
  id: string;
  description: string;
  expiry_date: string;
  doc_type: 'invoice' | 'contract' | 'general';
  entity_name: string;
  days_before_config: number;
}

export interface DeadlineSummary {
  expired: number;
  upcoming: number;
  total: number;
}

export interface AppNotification {
  id: string;
  type: 'deadline' | 'system' | 'info';
  title: string;
  message: string;
  is_read: number;
  link?: string;
  created_at: string;
}

export type View = 'dashboard' | 'inquiry' | 'reports' | 'suppliers' | 'clients' | 'staff' | 'invoices' | 'contracts' | 'cc_statement' | 'cc_operations' | 'cc_reports' | 'tax_ii' | 'tax_is' | 'tax_irt' | 'tax_iva' | 'tax_ip' | 'tax_ivm' | 'tax_iac' | 'settings' | 'fiscal_parameters' | 'irt_table' | 'subsidies' | 'irt_withholding_map' | 'irt_remuneration_map' | 'irt_reports' | 'ii_withholding_map' | 'ii_reports' | 'ip_withholding_map' | 'ip_reports' | 'provinces' | 'municipalities' | 'sales' | 'purchases' | 'commercial_cc' | 'company_settings' | 'ii_withheld_values' | 'irt_withheld_values' | 'ip_withheld_values' | 'departments' | 'job_functions' | 'social_security_remunerations' | 'social_security_reports' | 'documents_general' | 'documents_archive' | 'documents_deadlines';

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
        getStaff: () => Promise<Staff[]>;
        addStaff: (staff: any) => Promise<any>;
        updateStaff: (staff: any) => Promise<any>;
        deleteStaff: (id: string) => Promise<any>;
        getStaffAttachments: (staffId: string) => Promise<StaffAttachment[]>;
        addStaffAttachment: (attachment: any) => Promise<any>;
        deleteStaffAttachment: (id: string) => Promise<any>;
        getDepartments: () => Promise<Department[]>;
        addDepartment: (dept: any) => Promise<any>;
        updateDepartment: (dept: any) => Promise<any>;
        deleteDepartment: (id: string) => Promise<any>;
        getJobFunctions: () => Promise<JobFunction[]>;
        addJobFunction: (jf: any) => Promise<any>;
        updateJobFunction: (jf: any) => Promise<any>;
        deleteJobFunction: (id: string) => Promise<any>;
        getIRTScales: () => Promise<IRTScale[]>;
        addIRTScale: (scale: any) => Promise<any>;
        updateIRTScale: (scale: any) => Promise<any>;
        deleteIRTScale: (id: string) => Promise<any>;
        getSubsidies: () => Promise<Subsidy[]>;
        addSubsidy: (subsidy: any) => Promise<any>;
        updateSubsidy: (subsidy: any) => Promise<any>;
        deleteSubsidy: (id: string) => Promise<any>;

        getRemunerationMaps: () => Promise<RemunerationMap[]>;
        getRemunerationMap: (id: string) => Promise<RemunerationMap>;
        addRemunerationMap: (map: any) => Promise<any>;
        updateRemunerationMapStatus: (id: string, status: string) => Promise<any>;
        deleteRemunerationMap: (id: string) => Promise<any>;

        addRemunerationLine: (line: any) => Promise<any>;
        updateRemunerationLine: (line: any) => Promise<any>;
        deleteRemunerationLine: (id: string) => Promise<any>;

        addRemunerationLineSubsidy: (subsidy: any) => Promise<any>;
        deleteRemunerationLineSubsidies: (lineId: string) => Promise<any>;
        getRemunerationLines: (mapId: string) => Promise<RemunerationLine[]>;
        getRemunerationLineSubsidies: (lineId: string) => Promise<RemunerationLineSubsidy[]>;

        getArchives: () => Promise<Archive[]>;
        addArchive: (archive: any) => Promise<any>;
        updateArchive: (archive: any) => Promise<any>;
        deleteArchive: (id: string) => Promise<any>;

        getGeneralDocuments: () => Promise<GeneralDocument[]>;
        addGeneralDocument: (doc: any) => Promise<any>;
        updateGeneralDocument: (doc: any) => Promise<any>;
        deleteGeneralDocument: (id: string) => Promise<any>;

        getGeneralDocumentAttachments: (docId: string) => Promise<GeneralDocumentAttachment[]>;
        addGeneralDocumentAttachment: (attachment: any) => Promise<any>;
        deleteGeneralDocumentAttachment: (id: string) => Promise<any>;

        getDocumentsInArchive: (archiveId: string) => Promise<any[]>;
        searchLinkableDocuments: (filters: { query?: string; docType?: string; entityType?: string }) => Promise<any[]>;
        linkDocumentToArchive: (docType: string, docId: string, archiveId: string) => Promise<any>;
        unlinkDocumentFromArchive: (docType: string, docId: string, archiveId: string) => Promise<any>;
        getDeadlineConfigs: () => Promise<DeadlineConfig[]>;
        updateDeadlineConfig: (config: DeadlineConfig) => Promise<any>;
        getUpcomingDeadlines: () => Promise<DeadlineItem[]>;
        getDeadlineSummary: () => Promise<DeadlineSummary>;
        getNotifications: () => Promise<AppNotification[]>;
        markAsRead: (id: string) => Promise<any>;
        markAllAsRead: () => Promise<any>;
        addNotification: (data: Partial<AppNotification>) => Promise<any>;
        deleteNotification: (id: string) => Promise<any>;

        // Fiscal Classifications
        getIVAClassifications: () => Promise<IVAClassification[]>;
        addIVAClassification: (iva: any) => Promise<any>;
        updateIVAClassification: (iva: any) => Promise<any>;
        deleteIVAClassification: (id: string) => Promise<any>;
        seedDefaultIVA: () => Promise<any>;

        getStampDutyClassifications: () => Promise<StampDutyClassification[]>;
        addStampDutyClassification: (sd: any) => Promise<any>;
        updateStampDutyClassification: (sd: any) => Promise<any>;
        deleteStampDutyClassification: (id: string) => Promise<any>;

        getIndustrialTaxClassifications: () => Promise<IndustrialTaxClassification[]>;
        addIndustrialTaxClassification: (it: any) => Promise<any>;
        updateIndustrialTaxClassification: (it: any) => Promise<any>;
        deleteIndustrialTaxClassification: (id: string) => Promise<any>;
      };
      fs: {
        saveFile: (fileName: string, buffer: ArrayBuffer) => Promise<string>;
        openFile: (filePath: string) => Promise<void>;
        readFile: (filePath: string) => Promise<Uint8Array | null>;
        downloadFile: (filePath: string, fileName: string) => Promise<string | undefined>;
      };
      auth: {
        login: (email: string, password: string) => Promise<any>;
      };
    };
  }
}
