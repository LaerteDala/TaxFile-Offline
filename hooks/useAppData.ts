import { useRef, useEffect } from 'react';
import { useUIState } from './useUIState';
import { useAuth } from './useAuth';
import { useNotifications } from './useNotifications';
import { useEntityData } from './useEntityData';

export const useAppData = () => {
    const ui = useUIState();
    const entity = useEntityData();
    const notifications = useNotifications();

    const hasLoadedInitialData = useRef(false);

    const fetchData = async (isSilent = false) => {
        if (!isSilent) ui.setIsLoading(true);

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

            entity.setSuppliers(suppliersData || []);
            entity.setClients(clientsData || []);
            entity.setStaff(staffData || []);
            entity.setInvoices(invoicesData || []);
            entity.setDocumentTypes(docTypesData || []);
            entity.setWithholdingTypes(wtData || []);
            entity.setCcDocuments(ccData || []);
            entity.setCompanyInfo(companyData);
            entity.setProvinces(provData || []);
            entity.setMunicipalities(muniData || []);
            entity.setDepartments(deptsData || []);
            entity.setJobFunctions(jfsData || []);
            notifications.setDeadlineSummary(deadlineData || { expired: 0, upcoming: 0, total: 0 });
            notifications.setNotifications(notificationsData || []);

            if (deadlineData && deadlineData.total > 0) {
                notifications.checkDeadlinesAndNotify();
            }

            hasLoadedInitialData.current = true;
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            ui.setIsLoading(false);
        }
    };

    const auth = useAuth(
        () => fetchData(), // onLogin
        () => entity.clearAllData() // onLogout
    );

    return {
        ...ui,
        ...entity,
        ...notifications,
        ...auth,
        hasLoadedInitialData,
        fetchData
    };
};
