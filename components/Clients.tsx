
import React, { useState, useEffect, useRef } from 'react';
import { Client, Province, Municipality, ClientAttachment } from '../types';
import { ClientList } from './clients/ClientList';
import { ClientForm } from './clients/ClientForm';

interface ClientsProps {
    clients: Client[];
    setClients: React.Dispatch<React.SetStateAction<Client[]>>;
}

type SubView = 'list' | 'create' | 'edit';

const Clients: React.FC<ClientsProps> = ({ clients, setClients }) => {
    const [currentSubView, setCurrentSubView] = useState<SubView>('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
    const [attachmentTitle, setAttachmentTitle] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<Client>>({
        name: '',
        nif: '',
        address: '',
        email: '',
        inAngola: true,
        ivaRegime: 'Geral',
        type: 'Normal',
        provinceId: '',
        municipalityId: '',
        conformityDeclarationNumber: '',
        cativeVatRate: 0,
        attachments: []
    });
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        loadLocations();
    }, []);

    const loadLocations = async () => {
        try {
            const [provData, muniData] = await Promise.all([
                window.electron.db.getProvinces(),
                window.electron.db.getMunicipalities()
            ]);
            setProvinces(provData);
            setMunicipalities(muniData);
        } catch (err) {
            console.error('Error loading locations:', err);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            nif: '',
            address: '',
            email: '',
            inAngola: true,
            ivaRegime: 'Geral',
            type: 'Normal',
            provinceId: '',
            municipalityId: '',
            conformityDeclarationNumber: '',
            cativeVatRate: 0,
            attachments: []
        });
        setError(null);
        setSelectedId(null);
        setAttachmentTitle('');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleEdit = (client: Client) => {
        setFormData(client);
        setSelectedId(client.id);
        setCurrentSubView('edit');
    };

    const handleBack = () => {
        setCurrentSubView('list');
        resetForm();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const addAttachment = async () => {
        if (!attachmentTitle.trim() || !selectedFile) {
            alert('Por favor, preencha o título e seleccione um ficheiro.');
            return;
        }

        try {
            const buffer = await selectedFile.arrayBuffer();
            const filePath = await window.electron.fs.saveFile(selectedFile.name, buffer);

            const newAttachment: ClientAttachment = {
                id: crypto.randomUUID(),
                clientId: selectedId || '',
                title: attachmentTitle.trim(),
                filePath: filePath
            };

            setFormData(prev => ({
                ...prev,
                attachments: [...(prev.attachments || []), newAttachment]
            }));

            setAttachmentTitle('');
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err: any) {
            alert(`Erro ao guardar anexo: ${err.message}`);
        }
    };

    const removeAttachment = (id: string) => {
        setFormData(prev => ({
            ...prev,
            attachments: prev.attachments?.filter(a => a.id !== id) || []
        }));
    };

    const openAttachment = async (path: string) => {
        try {
            await window.electron.fs.openFile(path);
        } catch (err: any) {
            alert(`Erro ao abrir ficheiro: ${err.message}`);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const clientToSave = {
                ...formData,
                id: selectedId || crypto.randomUUID()
            };

            if (currentSubView === 'create') {
                await window.electron.db.addClient(clientToSave);
                if (formData.attachments) {
                    for (const att of formData.attachments) {
                        await window.electron.db.addClientAttachment({ ...att, clientId: clientToSave.id });
                    }
                }
                setClients([...clients, clientToSave as Client]);
            } else if (currentSubView === 'edit' && selectedId) {
                await window.electron.db.updateClient(clientToSave);
                const existingAttachments = await window.electron.db.getClientAttachments(selectedId);
                const newAttachments = formData.attachments?.filter(a => !existingAttachments.some(ea => ea.id === a.id)) || [];
                for (const att of newAttachments) {
                    await window.electron.db.addClientAttachment({ ...att, clientId: selectedId });
                }
                const deletedAttachments = existingAttachments.filter(ea => !formData.attachments?.some(a => a.id === ea.id));
                for (const att of deletedAttachments) {
                    await window.electron.db.deleteClientAttachment(att.id);
                }
                setClients(clients.map(c => c.id === selectedId ? clientToSave as Client : c));
            }

            setCurrentSubView('list');
            resetForm();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const removeClient = async (id: string) => {
        if (!confirm('Deseja remover este cliente permanentemente?')) return;

        setDeletingId(id);
        setError(null);

        try {
            await window.electron.db.deleteClient(id);
            setClients(prev => prev.filter(c => c.id !== id));
        } catch (err: any) {
            alert(`Erro ao remover cliente: ${err.message}`);
        } finally {
            setDeletingId(null);
        }
    };

    const filteredClients = clients.filter(c => {
        const name = (c.name || "").toLowerCase();
        const nif = (c.nif || "").toLowerCase();
        const term = searchTerm.toLowerCase();
        return name.includes(term) || nif.includes(term);
    });

    if (currentSubView === 'create' || currentSubView === 'edit') {
        return (
            <ClientForm
                mode={currentSubView}
                formData={formData}
                onBack={handleBack}
                onSubmit={handleSubmit}
                onChange={setFormData}
                error={error}
                isSubmitting={isSubmitting}
                provinces={provinces}
                municipalities={municipalities}
                attachmentTitle={attachmentTitle}
                selectedFile={selectedFile}
                fileInputRef={fileInputRef}
                onAttachmentTitleChange={setAttachmentTitle}
                onAttachmentFileChange={handleFileChange}
                onAddAttachment={addAttachment}
                onOpenAttachment={openAttachment}
                onRemoveAttachment={removeAttachment}
            />
        );
    }

    return (
        <ClientList
            clients={filteredClients}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onAddClient={() => setCurrentSubView('create')}
            onEditClient={handleEdit}
            onDeleteClient={removeClient}
            deletingId={deletingId}
            provinces={provinces}
            municipalities={municipalities}
        />
    );
};

export default Clients;
