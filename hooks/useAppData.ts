
import { useState, useEffect, useRef } from 'react';
import {
    View, Supplier, Client, Staff, Invoice, DocumentType, WithholdingType,
    CCDocument, CompanyInfo, Province, Municipality, Department, JobFunction
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

    const hasLoadedInitialData = useRef(false);

    const fetchData = async (isSilent = false) => {
        if (!isSilent) setIsLoading(true);

        try {
            const [
                suppliersData, clientsData, staffData, invoicesData,
                docTypesData, wtData, ccData, companyData,
                provData, muniData, deptsData, jfsData
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
                window.electron.db.getJobFunctions()
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
        fetchData, handleLogout
    };
};
