
import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Search,
  Bell,
  LogOut,
  Menu,
  SearchCode,
  Loader2,
  Settings as SettingsIcon,
  Coins,
  Percent,
  Home,
  Car,
  Banknote,
  Landmark,
  FileSpreadsheet,
  ChevronDown,
  ChevronRight,
  Truck,
  UserPlus,
  Contact,
  Folder,
  FileSignature,
  FileCheck,
  Wallet,
  History,
  ArrowLeftRight,
  PieChart
} from 'lucide-react';
import { View, Supplier, Invoice, DocumentType, WithholdingType, CCDocument } from './types';
import Dashboard from './components/Dashboard';
import Suppliers from './components/Suppliers';
import Invoices from './components/Invoices';
import Reports from './components/Reports';
import Inquiry from './components/Inquiry';
import Login from './components/Login';
import Settings from './components/Settings';
import CCOperations from './components/CC_Operations';
import CCStatement from './components/CC_Statement';
import CCReports from './components/CC_Reports';
import IRTWithholdingMap from './components/IRT_WithholdingMap';
import IRTReports from './components/IRT_Reports';
import IIWithholdingMap from './components/II_WithholdingMap';
import IIReports from './components/II_Reports';
import IPWithholdingMap from './components/IP_WithholdingMap';
import IPReports from './components/IP_Reports';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [withholdingTypes, setWithholdingTypes] = useState<WithholdingType[]>([]);
  const [ccDocuments, setCcDocuments] = useState<CCDocument[]>([]);
  const [selectedCCDocument, setSelectedCCDocument] = useState<CCDocument | null>(null);
  const [ccInitialIsViewing, setCcInitialIsViewing] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const hasLoadedInitialData = useRef(false);

  const fetchData = async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);

    try {
      const sups = await window.electron.db.getSuppliers();
      setSuppliers(sups || []);

      const docs = await window.electron.db.getDocumentTypes();
      setDocumentTypes(docs || []);

      const wts = await window.electron.db.getWithholdingTypes();
      setWithholdingTypes(wts || []);

      const invs = await window.electron.db.getInvoices();

      const formattedInvoices: Invoice[] = (invs || []).map(i => ({
        id: i.id,
        orderNumber: i.order_number,
        supplierId: i.supplier_id,
        documentTypeId: i.document_type_id,
        date: i.date,
        documentNumber: i.document_number,
        notes: i.notes,
        hasPdf: !!i.has_pdf,
        pdfPath: i.pdf_path,
        lines: (i.tax_lines || []).map((l: any) => ({
          id: l.id,
          taxableValue: l.taxable_value,
          rate: l.rate,
          supportedVat: l.supported_vat,
          deductibleVat: l.deductible_vat,
          isService: !!l.is_service,
          withholdingAmount: l.withholding_amount || 0,
          withholdingTypeId: l.withholding_type_id
        })),
        totalTaxable: i.total_taxable,
        totalSupported: i.total_supported,
        totalDeductible: i.total_deductible,
        totalWithholding: i.total_withholding || 0,
        totalDocument: i.total_document
      }));

      setInvoices(formattedInvoices);

      const ccs = await window.electron.db.getCCDocuments();
      setCcDocuments(ccs || []);

      hasLoadedInitialData.current = true;
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('taxfile_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setSession({ user });
      fetchData();
    } else {
      setIsLoading(false);
    }

    // Listen for login events (custom event from Login component)
    const handleLoginEvent = (e: any) => {
      const user = e.detail;
      setSession({ user });
      localStorage.setItem('taxfile_user', JSON.stringify(user));
      fetchData();
    };

    window.addEventListener('app:login', handleLoginEvent);
    return () => window.removeEventListener('app:login', handleLoginEvent);
  }, []);

  const handleLogout = async () => {
    if (confirm('Deseja realmente sair do sistema?')) {
      setSession(null);
      localStorage.removeItem('taxfile_user');
      setSuppliers([]);
      setInvoices([]);
      setDocumentTypes([]);
      setWithholdingTypes([]);
      hasLoadedInitialData.current = false;
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuName)
        ? prev.filter(m => m !== menuName)
        : [...prev, menuName]
    );
  };

  const navigation = [
    { name: 'Dashboard', icon: LayoutDashboard, view: 'dashboard' as View },
    { name: 'Consulta', icon: SearchCode, view: 'inquiry' as View },
    { name: 'Relatórios', icon: BarChart3, view: 'reports' as View },
    {
      name: 'Conta corrente',
      icon: Wallet,
      id: 'conta_corrente',
      subItems: [
        { name: 'Extracto', icon: History, view: 'cc_statement' as View },
        { name: 'Operações', icon: ArrowLeftRight, view: 'cc_operations' as View },
        { name: 'Relatórios', icon: PieChart, view: 'cc_reports' as View },
      ]
    },
    {
      name: 'Entidade',
      icon: Users,
      id: 'entidade',
      subItems: [
        { name: 'Fornecedores', icon: Truck, view: 'suppliers' as View },
        { name: 'Clientes', icon: UserPlus, view: 'clients' as View },
        { name: 'Pessoal', icon: Contact, view: 'staff' as View },
      ]
    },
    {
      name: 'Documentos',
      icon: Folder,
      id: 'documentos',
      subItems: [
        { name: 'Facturas', icon: FileText, view: 'invoices' as View },
        { name: 'Contratos', icon: FileSignature, view: 'contracts' as View },
      ]
    },
    {
      name: 'I. Industrial',
      icon: Landmark,
      id: 'tax_ii',
      subItems: [
        { name: 'Mapa de Retenção', icon: FileSpreadsheet, view: 'ii_withholding_map' as View },
        { name: 'Relatórios', icon: BarChart3, view: 'ii_reports' as View },
      ]
    },
    { name: 'I. Selo', icon: Coins, view: 'tax_is' as View },
    {
      name: 'IR. Trabalho',
      icon: Percent,
      id: 'tax_irt',
      subItems: [
        { name: 'Mapa de Retenção', icon: FileSpreadsheet, view: 'irt_withholding_map' as View },
        { name: 'Relatórios', icon: BarChart3, view: 'irt_reports' as View },
      ]
    },
    { name: 'IV. Acrescentado', icon: FileSpreadsheet, view: 'tax_iva' as View },
    {
      name: 'I. Predial',
      icon: Home,
      id: 'tax_ip',
      subItems: [
        { name: 'Mapa de Retenção', icon: FileSpreadsheet, view: 'ip_withholding_map' as View },
        { name: 'Relatórios', icon: BarChart3, view: 'ip_reports' as View },
      ]
    },
    { name: 'IV. Motorizados', icon: Car, view: 'tax_ivm' as View },
    { name: 'IA. Capitais', icon: Banknote, view: 'tax_iac' as View },
    { name: 'Definições', icon: SettingsIcon, view: 'settings' as View },
  ];

  if (!session && !isLoading) {
    return <Login />;
  }

  if (isLoading && !hasLoadedInitialData.current) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-4">
        <Loader2 className="animate-spin text-blue-500" size={48} />
        <p className="font-bold tracking-widest text-xs animate-pulse uppercase">A preparar o seu espaço de trabalho...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 transition-all duration-300 flex flex-col z-50`}>
        <div className="p-6 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <FileText className="text-white" size={20} />
          </div>
          {isSidebarOpen && <span className="font-bold text-xl text-white tracking-tight">TaxFile<span className="text-blue-500">ERP</span></span>}
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          {navigation.map((item) => {
            if (item.subItems) {
              const isExpanded = expandedMenus.includes(item.id!);
              const isChildActive = item.subItems.some(sub => sub.view === currentView);

              return (
                <div key={item.id} className="space-y-1">
                  <button
                    onClick={() => toggleMenu(item.id!)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${isChildActive ? 'text-white bg-slate-800/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <item.icon size={20} />
                      {isSidebarOpen && <span className="font-bold text-sm">{item.name}</span>}
                    </div>
                    {isSidebarOpen && (isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
                  </button>

                  {isExpanded && isSidebarOpen && (
                    <div className="ml-4 pl-4 border-l border-slate-800 space-y-1 animate-in slide-in-from-left-2 duration-200">
                      {item.subItems.map((sub) => (
                        <button
                          key={sub.view}
                          onClick={() => setCurrentView(sub.view)}
                          className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-bold transition-all ${currentView === sub.view
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                            : 'text-slate-500 hover:text-white hover:bg-slate-800'
                            }`}
                        >
                          <sub.icon size={16} />
                          <span>{sub.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                key={item.name}
                onClick={() => setCurrentView(item.view!)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${currentView === item.view
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
              >
                <item.icon size={20} />
                {isSidebarOpen && <span className="font-bold text-sm">{item.name}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 text-slate-400 hover:text-white rounded-xl transition-colors"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="font-medium">Sair</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button onClick={toggleSidebar} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><Menu size={20} /></button>
            <h1 className="text-xl font-semibold capitalize text-slate-800">
              {navigation.find(n => n.view === currentView)?.name}
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => fetchData(true)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-2 text-xs font-bold transition-all">
              Actualizar Dados
            </button>
            <div className="flex items-center gap-3 border-l pl-6 border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-800 truncate max-w-[150px]">
                  {session?.user?.email?.split('@')[0] || 'Utilizador'}
                </p>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Acesso Total</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-bold">
                {session?.user?.email?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {currentView === 'dashboard' && (
              <Dashboard
                invoices={invoices}
                suppliers={suppliers}
                onViewInquiry={() => setCurrentView('inquiry')}
              />
            )}
            {currentView === 'suppliers' && <Suppliers suppliers={suppliers} setSuppliers={setSuppliers} setInvoices={setInvoices} />}
            {currentView === 'invoices' && (
              <Invoices
                invoices={invoices}
                setInvoices={setInvoices}
                suppliers={suppliers}
                documentTypes={documentTypes}
                withholdingTypes={withholdingTypes}
                initialInvoice={selectedInvoice}
                onClose={() => setSelectedInvoice(null)}
              />
            )}
            {currentView === 'inquiry' && <Inquiry invoices={invoices} setInvoices={setInvoices} suppliers={suppliers} documentTypes={documentTypes} withholdingTypes={withholdingTypes} />}
            {currentView === 'reports' && <Reports invoices={invoices} suppliers={suppliers} documentTypes={documentTypes} withholdingTypes={withholdingTypes} />}
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
            {currentView === 'ip_reports' && <IPReports invoices={invoices} withholdingTypes={withholdingTypes} />}
            {currentView === 'settings' && (
              <Settings
                documentTypes={documentTypes}
                setDocumentTypes={setDocumentTypes}
                withholdingTypes={withholdingTypes}
                setWithholdingTypes={setWithholdingTypes}
              />
            )}
            {['tax_is', 'tax_iva', 'tax_ivm', 'tax_iac', 'clients', 'staff', 'contracts'].includes(currentView) && (
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
        </div>
      </main>
    </div>
  );
};

export default App;
