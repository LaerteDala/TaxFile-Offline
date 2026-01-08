import React from 'react';
import { View, Supplier, Client, Invoice, DocumentType, WithholdingType, CCDocument } from '../types';
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
import Provinces from './Provinces';
import Municipalities from './Municipalities';
import { FileText } from 'lucide-react';
import { navigation } from '../config/navigation';

interface AppRouterProps {
    currentView: View;
    setCurrentView: (view: View) => void;
    suppliers: Supplier[];
    setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
    clients: Client[];
    setClients: React.Dispatch<React.SetStateAction<Client[]>>;
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
    fetchData: (isSilent?: boolean) => Promise<void>;
}

const AppRouter: React.FC<AppRouterProps> = ({
    currentView,
    setCurrentView,
    suppliers,
    setSuppliers,
    clients,
    setClients,
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
            {currentView === 'settings' && (
                <Settings
                    documentTypes={documentTypes}
                    setDocumentTypes={setDocumentTypes}
                    withholdingTypes={withholdingTypes}
                    setWithholdingTypes={setWithholdingTypes}
                />
            )}
            {currentView === 'tax_iva' && (
                <TaxIVA
                    invoices={invoices}
                    suppliers={suppliers}
                    clients={clients}
                    documentTypes={documentTypes}
                    withholdingTypes={withholdingTypes}
                />
            )}
            {['tax_is', 'tax_ivm', 'tax_iac', 'clients', 'staff', 'contracts'].includes(currentView) && (
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
        </div>
    );
};

export default AppRouter;
