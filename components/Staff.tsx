
import React, { useState, useEffect, useRef } from 'react';
import { Staff, Province, Municipality, StaffAttachment, Department, JobFunction } from '../types';
import { StaffList } from './staff/StaffList';
import { StaffForm } from './staff/StaffForm';

interface StaffProps {
    staff: Staff[];
    setStaff: React.Dispatch<React.SetStateAction<Staff[]>>;
    departments: Department[];
    jobFunctions: JobFunction[];
}

type SubView = 'list' | 'create' | 'edit';

const StaffComponent: React.FC<StaffProps> = ({ staff, setStaff, departments, jobFunctions }) => {
    const [currentSubView, setCurrentSubView] = useState<SubView>('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
    const [attachmentTitle, setAttachmentTitle] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const photoInputRef = useRef<HTMLInputElement>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<Staff>>({
        name: '',
        identityDocument: '',
        nif: '',
        socialSecurityNumber: '',
        department: '',
        jobFunction: '',
        provinceId: '',
        municipalityId: '',
        type: 'Nacional',
        notSubjectToSS: false,
        irtExempt: false,
        isRetired: false,
        ssContributionRate: 3,
        photoPath: '',
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
            identityDocument: '',
            nif: '',
            socialSecurityNumber: '',
            department: '',
            jobFunction: '',
            provinceId: '',
            municipalityId: '',
            type: 'Nacional',
            notSubjectToSS: false,
            irtExempt: false,
            isRetired: false,
            ssContributionRate: 3,
            photoPath: '',
            attachments: []
        });
        setError(null);
        setSelectedId(null);
        setAttachmentTitle('');
        setSelectedFile(null);
        setSelectedPhoto(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (photoInputRef.current) photoInputRef.current.value = '';
    };

    const handleEdit = (s: Staff) => {
        setFormData(s);
        setSelectedId(s.id);
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

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedPhoto(e.target.files[0]);
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

            const newAttachment: StaffAttachment = {
                id: crypto.randomUUID(),
                staffId: selectedId || '',
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
            let photoPath = formData.photoPath;
            if (selectedPhoto) {
                const buffer = await selectedPhoto.arrayBuffer();
                photoPath = await window.electron.fs.saveFile(`photo_${Date.now()}_${selectedPhoto.name}`, buffer);
            }

            const staffToSave = {
                ...formData,
                id: selectedId || crypto.randomUUID(),
                photoPath
            };

            if (currentSubView === 'create') {
                await window.electron.db.addStaff(staffToSave);
                if (formData.attachments) {
                    for (const att of formData.attachments) {
                        await window.electron.db.addStaffAttachment({ ...att, staffId: staffToSave.id });
                    }
                }
                setStaff([...staff, staffToSave as Staff]);
            } else if (currentSubView === 'edit' && selectedId) {
                await window.electron.db.updateStaff(staffToSave);
                const existingAttachments = await window.electron.db.getStaffAttachments(selectedId);
                const newAttachments = formData.attachments?.filter(a => !existingAttachments.some(ea => ea.id === a.id)) || [];
                for (const att of newAttachments) {
                    await window.electron.db.addStaffAttachment({ ...att, staffId: selectedId });
                }
                const deletedAttachments = existingAttachments.filter(ea => !formData.attachments?.some(a => a.id === ea.id));
                for (const att of deletedAttachments) {
                    await window.electron.db.deleteStaffAttachment(att.id);
                }
                setStaff(staff.map(s => s.id === selectedId ? staffToSave as Staff : s));
            }

            setCurrentSubView('list');
            resetForm();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const removeStaff = async (id: string) => {
        if (!confirm('Deseja realmente remover este funcionário?')) return;

        setDeletingId(id);
        setError(null);

        try {
            await window.electron.db.deleteStaff(id);
            setStaff(prev => prev.filter(s => s.id !== id));
        } catch (err: any) {
            alert(`Erro ao remover funcionário: ${err.message}`);
        } finally {
            setDeletingId(null);
        }
    };

    const filteredStaff = staff.filter(s => {
        const name = (s.name || "").toLowerCase();
        const nif = (s.nif || "").toLowerCase();
        const term = searchTerm.toLowerCase();
        return name.includes(term) || nif.includes(term);
    });

    if (currentSubView === 'create' || currentSubView === 'edit') {
        return (
            <StaffForm
                mode={currentSubView}
                formData={formData}
                onBack={handleBack}
                onSubmit={handleSubmit}
                onChange={setFormData}
                error={error}
                isSubmitting={isSubmitting}
                departments={departments}
                jobFunctions={jobFunctions}
                provinces={provinces}
                municipalities={municipalities}
                selectedPhoto={selectedPhoto}
                photoInputRef={photoInputRef}
                onPhotoChange={handlePhotoChange}
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
        <StaffList
            staff={filteredStaff}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onAddStaff={() => setCurrentSubView('create')}
            onEditStaff={handleEdit}
            onDeleteStaff={removeStaff}
            deletingId={deletingId}
        />
    );
};

export default StaffComponent;
