import { useState } from 'react';
import {
    Supplier, Client, Staff, Invoice, DocumentType, WithholdingType,
    CCDocument, CompanyInfo, Province, Municipality, Department, JobFunction,
    DeadlineSummary, AppNotification, GeneralDocument
} from '../types';

export const useEntityData = () => {
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
    const [selectedGeneralDocument, setSelectedGeneralDocument] = useState<GeneralDocument | null>(null);

    const clearAllData = () => {
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
    };

    return {
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
        selectedGeneralDocument, setSelectedGeneralDocument,
        clearAllData
    };
};
