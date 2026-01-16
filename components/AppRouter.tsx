import React from 'react';
import { View, Supplier, Client, Staff as StaffType, Invoice, DocumentType, WithholdingType, CCDocument, Department, JobFunction, GeneralDocument, IVAClassification, StampDutyClassification, IndustrialTaxClassification } from '../types';
import Dashboard from './Dashboard';
import Suppliers from './Suppliers';
import Clients from './Clients';
import Sales from './Sales';
import Purchases from './Purchases';
import CommercialCC from './CommercialCC';
import CompanySettings from './CompanySettings';
import Invoices from './Invoices';
import Reports from './Reports';
import Inquiry from './Inquiry';
import Settings from './Settings';
import CCOperations from './CC_Operations';
import CCStatement from './CC_Statement';
import CCReports from './CC_Reports';
import IRTWithholdingMap from './IRT_WithholdingMap';
import IRTWithheldValues from './IRT_WithheldValues';
import IRTReports from './IRT_Reports';
import IIWithholdingMap from './II_WithholdingMap';
import IIWithheldValues from './II_WithheldValues';
import IIReports from './II_Reports';
import IPWithholdingMap from './IP_WithholdingMap';
import IPWithheldValues from './IP_WithheldValues';
import IPReports from './IP_Reports';
import TaxIVA from './TaxIVA';
import Staff from './Staff';
import Provinces from './Provinces';
import Municipalities from './Municipalities';
import Departments from './Departments';
import JobFunctions from './JobFunctions';
import FiscalParameters from './FiscalParameters';
import IRTTable from './IRTTable';
import Subsidies from './Subsidies';
import RemunerationMap from './RemunerationMap';
import SocialSecurityRemunerations from './SocialSecurityRemunerations';
import SocialSecurityReports from './SocialSecurityReports';
import DocumentsArchive from './DocumentsArchive';
import DocumentsGeneral from './DocumentsGeneral';
import DocumentsDeadlines from './DocumentsDeadlines';
import { FileText } from 'lucide-react';
import { navigation } from '../config/navigation';

interface AppRouterProps {
    currentView: View;
    setCurrentView: (view: View) => void;
    suppliers: Supplier[];
    setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
    clients: Client[];
    setClients: React.Dispatch<React.SetStateAction<Client[]>>;
    staff: StaffType[];
    setStaff: React.Dispatch<React.SetStateAction<StaffType[]>>;
    departments: Department[];
    setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
    jobFunctions: JobFunction[];
    setJobFunctions: React.Dispatch<React.SetStateAction<JobFunction[]>>;
    invoices: Invoice[];
    setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
    documentTypes: DocumentType[];
    setDocumentTypes: React.Dispatch<React.SetStateAction<DocumentType[]>>;
    withholdingTypes: WithholdingType[];
    setWithholdingTypes: React.Dispatch<React.SetStateAction<WithholdingType[]>>;
    ccDocuments: CCDocument[];
    selectedCCDocument: CCDocument | null;
    setSelectedCCDocument: (doc: CCDocument | null) => void;
    ccInitialIsViewing: boolean;
    setCcInitialIsViewing: (val: boolean) => void;
    selectedInvoice: Invoice | null;
    setSelectedInvoice: (inv: Invoice | null) => void;
    selectedGeneralDocument: GeneralDocument | null;
    setSelectedGeneralDocument: (doc: GeneralDocument | null) => void;
    ivaClassifications: IVAClassification[];
    setIvaClassifications: React.Dispatch<React.SetStateAction<IVAClassification[]>>;
    stampDutyClassifications: StampDutyClassification[];
    setStampDutyClassifications: React.Dispatch<React.SetStateAction<StampDutyClassification[]>>;
    industrialTaxClassifications: IndustrialTaxClassification[];
    setIndustrialTaxClassifications: React.Dispatch<React.SetStateAction<IndustrialTaxClassification[]>>;
    fetchData: (isSilent?: boolean) => Promise<void>;
}

const AppRouter: React.FC<AppRouterProps> = ({
    currentView,
    setCurrentView,
    suppliers,
    setSuppliers,
    clients,
    setClients,
    staff,
    setStaff,
    departments,
    setDepartments,
    jobFunctions,
    setJobFunctions,
    invoices,
    setInvoices,
    documentTypes,
    setDocumentTypes,
    withholdingTypes,
    setWithholdingTypes,
    ccDocuments,
    selectedCCDocument,
    setSelectedCCDocument,
    ccInitialIsViewing,
    setCcInitialIsViewing,
    selectedInvoice,
    setSelectedInvoice,
    selectedGeneralDocument,
    setSelectedGeneralDocument,
    ivaClassifications,
    setIvaClassifications,
    stampDutyClassifications,
    setStampDutyClassifications,
    industrialTaxClassifications,
    setIndustrialTaxClassifications,
    fetchData
}) => {
    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {currentView === 'dashboard' && (
                <Dashboard
                    invoices={invoices}
                    suppliers={suppliers}
                    onViewInquiry={() => setCurrentView('inquiry')}
                />
            )}
            {currentView === 'suppliers' && <Suppliers suppliers={suppliers} setSuppliers={setSuppliers} setInvoices={setInvoices} />}
            {currentView === 'clients' && <Clients clients={clients} setClients={setClients} />}
            {currentView === 'staff' && (
                <Staff
                    staff={staff}
                    setStaff={setStaff}
                    departments={departments}
                    jobFunctions={jobFunctions}
                />
            )}
            {currentView === 'sales' && <Sales />}
            {currentView === 'purchases' && <Purchases />}
            {currentView === 'commercial_cc' && <CommercialCC />}
            {currentView === 'company_settings' && <CompanySettings />}
            {currentView === 'invoices' && (
                <Invoices
                    invoices={invoices}
                    setInvoices={setInvoices}
                    suppliers={suppliers}
                    clients={clients}
                    documentTypes={documentTypes}
                    withholdingTypes={withholdingTypes}
                    initialInvoice={selectedInvoice}
                    onClose={() => setSelectedInvoice(null)}
                    ivaClassifications={ivaClassifications}
                    stampDutyClassifications={stampDutyClassifications}
                    industrialTaxClassifications={industrialTaxClassifications}
                />
            )}
            {currentView === 'inquiry' && <Inquiry invoices={invoices} setInvoices={setInvoices} suppliers={suppliers} clients={clients} documentTypes={documentTypes} withholdingTypes={withholdingTypes} />}
            {currentView === 'reports' && <Reports invoices={invoices} suppliers={suppliers} clients={clients} documentTypes={documentTypes} withholdingTypes={withholdingTypes} />}
            {currentView === 'cc_operations' && (
                <CCOperations
                    documents={ccDocuments}
                    onRefresh={() => fetchData(true)}
                    initialDocument={selectedCCDocument}
                    initialIsViewing={ccInitialIsViewing}
                    onClose={() => setSelectedCCDocument(null)}
                />
            )}
            {currentView === 'cc_statement' && (
                <CCStatement
                    documents={ccDocuments}
                    onViewDocument={(doc, isViewing) => {
                        setSelectedCCDocument(doc);
                        setCcInitialIsViewing(isViewing);
                        setCurrentView('cc_operations');
                    }}
                />
            )}
            {currentView === 'cc_reports' && <CCReports />}
            {currentView === 'irt_withholding_map' && (
                <IRTWithholdingMap
                    invoices={invoices}
                    suppliers={suppliers}
                    withholdingTypes={withholdingTypes}
                    onViewInvoice={(inv) => {
                        setSelectedInvoice(inv);
                        setCurrentView('invoices');
                    }}
                />
            )}
            {currentView === 'irt_reports' && <IRTReports invoices={invoices} withholdingTypes={withholdingTypes} />}
            {currentView === 'ii_withholding_map' && (
                <IIWithholdingMap
                    invoices={invoices}
                    suppliers={suppliers}
                    withholdingTypes={withholdingTypes}
                    onViewInvoice={(inv) => {
                        setSelectedInvoice(inv);
                        setCurrentView('invoices');
                    }}
                />
            )}
            {currentView === 'ii_reports' && <IIReports invoices={invoices} withholdingTypes={withholdingTypes} />}
            {currentView === 'ip_withholding_map' && (
                <IPWithholdingMap
                    invoices={invoices}
                    suppliers={suppliers}
                    withholdingTypes={withholdingTypes}
                    onViewInvoice={(inv) => {
                        setSelectedInvoice(inv);
                        setCurrentView('invoices');
                    }}
                />
            )}
            {currentView === 'ii_withheld_values' && <IIWithheldValues invoices={invoices} clients={clients} withholdingTypes={withholdingTypes} />}
            {currentView === 'irt_withheld_values' && <IRTWithheldValues invoices={invoices} clients={clients} withholdingTypes={withholdingTypes} />}
            {currentView === 'ip_withheld_values' && <IPWithheldValues invoices={invoices} clients={clients} withholdingTypes={withholdingTypes} />}
            {currentView === 'ip_reports' && <IPReports invoices={invoices} withholdingTypes={withholdingTypes} />}
            {currentView === 'provinces' && <Provinces />}
            {currentView === 'municipalities' && <Municipalities />}
            {currentView === 'departments' && <Departments departments={departments} setDepartments={setDepartments} />}
            {currentView === 'job_functions' && <JobFunctions jobFunctions={jobFunctions} setJobFunctions={setJobFunctions} />}
            {currentView === 'settings' && (
                <Settings
                    setCurrentView={setCurrentView}
                />
            )}
            {currentView === 'fiscal_parameters' && (
                <FiscalParameters
                    documentTypes={documentTypes}
                    setDocumentTypes={setDocumentTypes}
                    withholdingTypes={withholdingTypes}
                    setWithholdingTypes={setWithholdingTypes}
                    ivaClassifications={ivaClassifications}
                    setIvaClassifications={setIvaClassifications}
                    stampDutyClassifications={stampDutyClassifications}
                    setStampDutyClassifications={setStampDutyClassifications}
                    industrialTaxClassifications={industrialTaxClassifications}
                    setIndustrialTaxClassifications={setIndustrialTaxClassifications}
                    onBack={() => setCurrentView('settings')}
                />
            )}
            {currentView === 'irt_table' && (
                <IRTTable
                    onBack={() => setCurrentView('settings')}
                />
            )}
            {currentView === 'subsidies' && (
                <Subsidies
                    onBack={() => setCurrentView('settings')}
                />
            )}
            {currentView === 'irt_remuneration_map' && (
                <RemunerationMap />
            )}
            {currentView === 'social_security_remunerations' && (
                <SocialSecurityRemunerations />
            )}
            {currentView === 'social_security_reports' && (
                <SocialSecurityReports />
            )}
            {currentView === 'documents_archive' && <DocumentsArchive />}
            {currentView === 'documents_general' && (
                <DocumentsGeneral
                    initialDocument={selectedGeneralDocument}
                    onClose={() => setSelectedGeneralDocument(null)}
                />
            )}
            {currentView === 'documents_deadlines' && (
                <DocumentsDeadlines
                    onNavigate={async (view, id) => {
                        if (view === 'invoices') {
                            const inv = invoices.find(i => i.id === id);
                            if (inv) {
                                setSelectedInvoice(inv);
                                setCurrentView('invoices');
                            }
                        } else if (view === 'documents_general') {
                            const docs = await window.electron.db.getGeneralDocuments();
                            const doc = docs.find(d => d.id === id);
                            if (doc) {
                                setSelectedGeneralDocument(doc);
                                setCurrentView('documents_general');
                            }
                        }
                    }}
                />
            )}
            {currentView === 'tax_iva' && (
                <TaxIVA
                    invoices={invoices}
                    suppliers={suppliers}
                    clients={clients}
                    documentTypes={documentTypes}
                    withholdingTypes={withholdingTypes}
                    ivaClassifications={ivaClassifications}
                />
            )}
            {['tax_is', 'tax_ivm', 'tax_iac', 'contracts'].includes(currentView) && (
                <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
                    <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-6">
                        {React.createElement(
                            navigation.find(n => n.view === currentView)?.icon ||
                            navigation.flatMap(n => n.subItems || []).find(s => s.view === currentView)?.icon ||
                            FileText,
                            { size: 40 }
                        )}
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 mb-2">
                        Módulo {
                            navigation.find(n => n.view === currentView)?.name ||
                            navigation.flatMap(n => n.subItems || []).find(s => s.view === currentView)?.name
                        }
                    </h2>
                    <p className="font-medium">Funcionalidades em breve...</p>
                </div>
            )}
        </div >
    );
};

export default AppRouter;
