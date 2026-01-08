import React from 'react';
import { Loader2 } from 'lucide-react';
import Login from './components/Login';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import AppRouter from './components/AppRouter';
import { useAppData } from './hooks/useAppData';

const App: React.FC = () => {
  const {
    currentView, setCurrentView,
    isSidebarOpen, toggleSidebar,
    expandedMenus, toggleMenu,
    isLoading, hasLoadedInitialData,
    session,
    suppliers, setSuppliers,
    clients, setClients,
    invoices, setInvoices,
    documentTypes, setDocumentTypes,
    withholdingTypes, setWithholdingTypes,
    ccDocuments,
    selectedCCDocument, setSelectedCCDocument,
    ccInitialIsViewing, setCcInitialIsViewing,
    selectedInvoice, setSelectedInvoice,
    fetchData, handleLogout
  } = useAppData();

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
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        currentView={currentView}
        expandedMenus={expandedMenus}
        onViewChange={setCurrentView}
        onToggleMenu={toggleMenu}
        onLogout={handleLogout}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header
          currentView={currentView}
          session={session}
          onToggleSidebar={toggleSidebar}
          onRefresh={() => fetchData(true)}
        />

        <div className="flex-1 overflow-y-auto p-8">
          <AppRouter
            currentView={currentView}
            setCurrentView={setCurrentView}
            suppliers={suppliers}
            setSuppliers={setSuppliers}
            clients={clients}
            setClients={setClients}
            invoices={invoices}
            setInvoices={setInvoices}
            documentTypes={documentTypes}
            setDocumentTypes={setDocumentTypes}
            withholdingTypes={withholdingTypes}
            setWithholdingTypes={setWithholdingTypes}
            ccDocuments={ccDocuments}
            selectedCCDocument={selectedCCDocument}
            setSelectedCCDocument={setSelectedCCDocument}
            ccInitialIsViewing={ccInitialIsViewing}
            setCcInitialIsViewing={setCcInitialIsViewing}
            selectedInvoice={selectedInvoice}
            setSelectedInvoice={setSelectedInvoice}
            fetchData={fetchData}
          />
        </div>
      </main>
    </div>
  );
};

export default App;
