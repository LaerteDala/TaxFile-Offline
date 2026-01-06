
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
  Loader2
} from 'lucide-react';
import { View, Supplier, Invoice } from './types';
import Dashboard from './components/Dashboard';
import Suppliers from './components/Suppliers';
import Invoices from './components/Invoices';
import Reports from './components/Reports';
import Inquiry from './components/Inquiry';
import Login from './components/Login';
import { supabase } from './lib/supabase';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  
  // Ref para evitar múltiplas chamadas iniciais e controlar o estado de "primeira carga"
  const hasLoadedInitialData = useRef(false);

  // Função de busca optimizada
  const fetchData = async (isSilent = false) => {
    // Só mostramos o loader global se for a primeira vez ou se não for um refresh silencioso
    if (!isSilent) setIsLoading(true);
    
    try {
      const { data: sups, error: supErr } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');
      
      if (supErr) throw supErr;
      setSuppliers(sups || []);

      const { data: invs, error: invErr } = await supabase
        .from('invoices')
        .select(`
          *,
          tax_lines (*)
        `)
        .order('created_at', { ascending: false });

      if (invErr) throw invErr;

      const formattedInvoices: Invoice[] = (invs || []).map(i => ({
        id: i.id,
        orderNumber: i.order_number,
        supplierId: i.supplier_id,
        date: i.date,
        documentNumber: i.document_number,
        notes: i.notes,
        hasPdf: i.has_pdf,
        pdfPath: i.pdf_path,
        lines: (i.tax_lines || []).map((l: any) => ({
          id: l.id,
          taxableValue: l.taxable_value,
          rate: l.rate,
          supportedVat: l.supported_vat,
          deductibleVat: l.deductible_vat
        })),
        totalTaxable: i.total_taxable,
        totalSupported: i.total_supported,
        totalDeductible: i.total_deductible,
        totalDocument: i.total_document
      }));

      setInvoices(formattedInvoices);
      hasLoadedInitialData.current = true;
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Monitorar Autenticação
  useEffect(() => {
    // Obter sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session && !hasLoadedInitialData.current) {
        fetchData();
      } else if (!session) {
        setIsLoading(false);
      }
    });

    // Escutar mudanças de estado sem disparar fetchData em todo "foco" de janela
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      
      if (event === 'SIGNED_IN' && !hasLoadedInitialData.current) {
        fetchData();
      } else if (event === 'SIGNED_OUT') {
        setSuppliers([]);
        setInvoices([]);
        hasLoadedInitialData.current = false;
        setIsLoading(false);
      }
      // Ignoramos o evento 'TOKEN_REFRESHED' para evitar o reload da UI que limpa os campos
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    if (confirm('Deseja realmente sair do sistema?')) {
      await supabase.auth.signOut();
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const navigation = [
    { name: 'Dashboard', icon: LayoutDashboard, view: 'dashboard' as View },
    { name: 'Fornecedores', icon: Users, view: 'suppliers' as View },
    { name: 'Facturas', icon: FileText, view: 'invoices' as View },
    { name: 'Consulta', icon: SearchCode, view: 'inquiry' as View },
    { name: 'Relatórios', icon: BarChart3, view: 'reports' as View },
  ];

  if (!session && !isLoading) {
    return <Login />;
  }

  // Loader inicial apenas para quando não há sessão ou os dados base ainda não chegaram
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

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => (
            <button
              key={item.name}
              onClick={() => setCurrentView(item.view)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                currentView === item.view 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              {isSidebarOpen && <span className="font-medium">{item.name}</span>}
            </button>
          ))}
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
            {/* O botão manual de refresh continua disponível, mas agora é silencioso por padrão para não atrapalhar */}
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
            {/* Removido o loader que cobria a tela toda durante sincronizações silenciosas */}
            {currentView === 'dashboard' && (
              <Dashboard 
                invoices={invoices} 
                suppliers={suppliers} 
                onViewInquiry={() => setCurrentView('inquiry')} 
              />
            )}
            {currentView === 'suppliers' && <Suppliers suppliers={suppliers} setSuppliers={setSuppliers} setInvoices={setInvoices} />}
            {currentView === 'invoices' && <Invoices invoices={invoices} setInvoices={setInvoices} suppliers={suppliers} />}
            {currentView === 'inquiry' && <Inquiry invoices={invoices} setInvoices={setInvoices} suppliers={suppliers} />}
            {currentView === 'reports' && <Reports invoices={invoices} suppliers={suppliers} />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
