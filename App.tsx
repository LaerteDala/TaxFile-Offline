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
    staff, setStaff,
    invoices, setInvoices,
    documentTypes, setDocumentTypes,
    withholdingTypes, setWithholdingTypes,
    departments, setDepartments,
    jobFunctions, setJobFunctions,
    ccDocuments,
    selectedCCDocument, setSelectedCCDocument,
    ccInitialIsViewing, setCcInitialIsViewing,
    selectedInvoice, setSelectedInvoice,
    selectedGeneralDocument, setSelectedGeneralDocument,
    deadlineSummary,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    ivaClassifications, setIvaClassifications,
    stampDutyClassifications, setStampDutyClassifications,
    industrialTaxClassifications, setIndustrialTaxClassifications,
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
        deadlineSummary={deadlineSummary}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header
          currentView={currentView}
          session={session}
          onToggleSidebar={toggleSidebar}
          onRefresh={() => fetchData(true)}
          notifications={notifications}
          onMarkAsRead={markNotificationAsRead}
          onMarkAllAsRead={markAllNotificationsAsRead}
          onDeleteNotification={deleteNotification}
          onNavigate={setCurrentView}
        />

        <div className="flex-1 overflow-y-auto p-8">
          <AppRouter
            currentView={currentView}
            setCurrentView={setCurrentView}
            suppliers={suppliers}
            setSuppliers={setSuppliers}
            clients={clients}
            setClients={setClients}
            staff={staff}
            setStaff={setStaff}
            invoices={invoices}
            setInvoices={setInvoices}
            documentTypes={documentTypes}
            setDocumentTypes={setDocumentTypes}
            withholdingTypes={withholdingTypes}
            setWithholdingTypes={setWithholdingTypes}
            departments={departments}
            setDepartments={setDepartments}
            jobFunctions={jobFunctions}
            setJobFunctions={setJobFunctions}
            ccDocuments={ccDocuments}
            selectedCCDocument={selectedCCDocument}
            setSelectedCCDocument={setSelectedCCDocument}
            ccInitialIsViewing={ccInitialIsViewing}
            setCcInitialIsViewing={setCcInitialIsViewing}
            selectedInvoice={selectedInvoice}
            setSelectedInvoice={setSelectedInvoice}
            selectedGeneralDocument={selectedGeneralDocument}
            setSelectedGeneralDocument={setSelectedGeneralDocument}
            ivaClassifications={ivaClassifications}
            setIvaClassifications={setIvaClassifications}
            stampDutyClassifications={stampDutyClassifications}
            setStampDutyClassifications={setStampDutyClassifications}
            industrialTaxClassifications={industrialTaxClassifications}
            setIndustrialTaxClassifications={setIndustrialTaxClassifications}
            fetchData={fetchData}
          />
        </div>
      </main>
    </div>
  );
};

export default App;
