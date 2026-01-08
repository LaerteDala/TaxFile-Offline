import { useState, useEffect, useRef } from 'react';
import { View, Supplier, Client, Invoice, DocumentType, WithholdingType, CCDocument } from '../types';

export const useAppData = () => {
    const [currentView, setCurrentView] = useState<View>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [session, setSession] = useState<any>(null);

    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
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

            const cls = await window.electron.db.getClients();
            setClients(cls || []);

            const docs = await window.electron.db.getDocumentTypes();
            setDocumentTypes(docs || []);

            const wts = await window.electron.db.getWithholdingTypes();
            setWithholdingTypes(wts || []);

            const invs = await window.electron.db.getInvoices();
            setInvoices(invs || []);

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

    return {
        currentView, setCurrentView,
        isSidebarOpen, toggleSidebar,
        expandedMenus, toggleMenu,
        isLoading, hasLoadedInitialData,
        session, setSession,
        suppliers, setSuppliers,
        clients, setClients,
        invoices, setInvoices,
        documentTypes, setDocumentTypes,
        withholdingTypes, setWithholdingTypes,
        ccDocuments, setCcDocuments,
        selectedCCDocument, setSelectedCCDocument,
        ccInitialIsViewing, setCcInitialIsViewing,
        selectedInvoice, setSelectedInvoice,
        fetchData, handleLogout
    };
};
