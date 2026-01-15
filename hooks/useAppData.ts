
import { useState, useEffect, useRef } from 'react';
import {
    View, Supplier, Client, Staff, Invoice, DocumentType, WithholdingType,
    CCDocument, CompanyInfo, Province, Municipality, Department, JobFunction,
    DeadlineSummary, AppNotification, GeneralDocument
} from '../types';

export const useAppData = () => {
    const [currentView, setCurrentView] = useState<View>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [session, setSession] = useState<any>(null);

    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [staff, setStaff] = useState<Staff[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [jobFunctions, setJobFunctions] = useState<JobFunction[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
    const [withholdingTypes, setWithholdingTypes] = useState<WithholdingType[]>([]);
    const [ccDocuments, setCcDocuments] = useState<CCDocument[]>([]);
    const [selectedCCDocument, setSelectedCCDocument] = useState<CCDocument | null>(null);
    const [ccInitialIsViewing, setCcInitialIsViewing] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
    const [deadlineSummary, setDeadlineSummary] = useState<DeadlineSummary>({ expired: 0, upcoming: 0, total: 0 });
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [selectedGeneralDocument, setSelectedGeneralDocument] = useState<GeneralDocument | null>(null);

    const hasLoadedInitialData = useRef(false);

    const fetchData = async (isSilent = false) => {
        if (!isSilent) setIsLoading(true);

        try {
            const [
                suppliersData, clientsData, staffData, invoicesData,
                docTypesData, wtData, ccData, companyData,
                provData, muniData, deptsData, jfsData, deadlineData,
                notificationsData
            ] = await Promise.all([
                window.electron.db.getSuppliers(),
                window.electron.db.getClients(),
                window.electron.db.getStaff(),
                window.electron.db.getInvoices(),
                window.electron.db.getDocumentTypes(),
                window.electron.db.getWithholdingTypes(),
                window.electron.db.getCCDocuments(),
                window.electron.db.getCompanyInfo(),
                window.electron.db.getProvinces(),
                window.electron.db.getMunicipalities(),
                window.electron.db.getDepartments(),
                window.electron.db.getJobFunctions(),
                window.electron.db.getDeadlineSummary(),
                window.electron.db.getNotifications()
            ]);

            setSuppliers(suppliersData || []);
            setClients(clientsData || []);
            setStaff(staffData || []);
            setInvoices(invoicesData || []);
            setDocumentTypes(docTypesData || []);
            setWithholdingTypes(wtData || []);
            setCcDocuments(ccData || []);
            setCompanyInfo(companyData);
            setProvinces(provData || []);
            setMunicipalities(muniData || []);
            setDepartments(deptsData || []);
            setJobFunctions(jfsData || []);
            setDeadlineSummary(deadlineData || { expired: 0, upcoming: 0, total: 0 });
            setNotifications(notificationsData || []);

            if (deadlineData && deadlineData.total > 0) {
                checkDeadlinesAndNotify();
            }

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
            setClients([]);
            setStaff([]);
            setDepartments([]);
            setJobFunctions([]);
            setInvoices([]);
            setDocumentTypes([]);
            setWithholdingTypes([]);
            setCcDocuments([]);
            setCompanyInfo(null);
            setProvinces([]);
            setMunicipalities([]);
            hasLoadedInitialData.current = false;
        }
    };

    const checkDeadlinesAndNotify = async () => {
        try {
            const upcoming = await window.electron.db.getUpcomingDeadlines();
            const currentNotifications = await window.electron.db.getNotifications();
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            for (const item of upcoming) {
                const expiry = new Date(item.expiry_date);
                expiry.setHours(0, 0, 0, 0);
                const diffTime = expiry.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                let type: 'deadline' | 'system' = 'deadline';
                let title = '';
                let message = '';

                if (diffDays < 0) {
                    title = `Documento Vencido: ${item.description}`;
                    message = `O documento da entidade ${item.entity_name} venceu em ${new Date(item.expiry_date).toLocaleDateString()}.`;
                } else if (diffDays <= item.days_before_config) {
                    title = `Vencimento Próximo: ${item.description}`;
                    message = `O documento da entidade ${item.entity_name} vence em ${diffDays} dias (${new Date(item.expiry_date).toLocaleDateString()}).`;
                }

                if (title) {
                    // Check if notification already exists for this document and state
                    const exists = currentNotifications.some(n =>
                        n.title === title &&
                        new Date(n.created_at).toDateString() === today.toDateString()
                    );

                    if (!exists) {
                        await window.electron.db.addNotification({
                            id: crypto.randomUUID(),
                            type,
                            title,
                            message,
                            link: 'documents_deadlines'
                        });
                    }
                }
            }

            // Refresh notifications after check
            const updatedNotifications = await window.electron.db.getNotifications();
            setNotifications(updatedNotifications);
        } catch (error) {
            console.error('Error checking deadlines:', error);
        }
    };

    const markNotificationAsRead = async (id: string) => {
        await window.electron.db.markAsRead(id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    };

    const markAllNotificationsAsRead = async () => {
        await window.electron.db.markAllAsRead();
        setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    };

    const deleteNotification = async (id: string) => {
        await window.electron.db.deleteNotification(id);
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const toggleMenu = (menuName: string) => {
        setExpandedMenus(prev =>
            prev.includes(menuName)
                ? prev.filter(m => m !== menuName)
                : [...prev, menuName]
        );
    };

    return {
        currentView, setCurrentView,
        isSidebarOpen, toggleSidebar,
        expandedMenus, toggleMenu,
        isLoading, hasLoadedInitialData,
        session, setSession,
        suppliers, setSuppliers,
        clients, setClients,
        staff, setStaff,
        departments, setDepartments,
        jobFunctions, setJobFunctions,
        invoices, setInvoices,
        documentTypes, setDocumentTypes,
        withholdingTypes, setWithholdingTypes,
        ccDocuments, setCcDocuments,
        selectedCCDocument, setSelectedCCDocument,
        ccInitialIsViewing, setCcInitialIsViewing,
        selectedInvoice, setSelectedInvoice,
        companyInfo, setCompanyInfo,
        provinces, setProvinces,
        municipalities, setMunicipalities,
        deadlineSummary,
        notifications,
        selectedGeneralDocument,
        setSelectedGeneralDocument,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        fetchData, handleLogout
    };
};
