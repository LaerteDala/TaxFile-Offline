
import React, { useState } from 'react';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    AlertCircle,
    ChevronLeft,
    Save,
    Loader2,
    User,
    Mail,
    MapPin,
    Fingerprint,
    Globe,
    ShieldCheck,
    FileCheck,
    Upload,
    FileText,
    X,
    Eye,
    Camera,
    Briefcase,
    Building2,
    Percent
} from 'lucide-react';
import { Staff, Province, Municipality, StaffAttachment, Department, JobFunction } from '../types';

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
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const photoInputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        loadLocations();
    }, []);

    const loadLocations = async () => {
        const [provData, muniData] = await Promise.all([
            window.electron.db.getProvinces(),
            window.electron.db.getMunicipalities()
        ]);
        setProvinces(provData);
        setMunicipalities(muniData);
    };

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

    const filteredStaff = staff.filter(s => {
        const name = (s.name || "").toLowerCase();
        const nif = (s.nif || "").toLowerCase();
        const term = searchTerm.toLowerCase();
        return name.includes(term) || nif.includes(term);
    });

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

    if (currentSubView === 'create' || currentSubView === 'edit') {
        return (
            <div className="animate-in slide-in-from-right-8 duration-500 max-w-4xl mx-auto pb-12">
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-semibold transition-colors group"
                    >
                        <div className="p-2 bg-white border border-slate-200 rounded-xl group-hover:border-slate-300 shadow-sm">
                            <ChevronLeft size={20} />
                        </div>
                        Voltar à Lista
                    </button>
                    <h2 className="text-2xl font-black text-slate-800">
                        {currentSubView === 'create' ? 'Novo Funcionário' : 'Editar Funcionário'}
                    </h2>
                    <div className="w-24"></div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold animate-in shake duration-300">
                            <AlertCircle size={20} />
                            {error}
                        </div>
                    )}

                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-8 md:p-12">
                            <div className="flex flex-col md:flex-row gap-12 mb-12">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="relative group">
                                        <div className="w-32 h-32 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden group-hover:border-blue-400 transition-all">
                                            {selectedPhoto ? (
                                                <img src={URL.createObjectURL(selectedPhoto)} alt="Preview" className="w-full h-full object-cover" />
                                            ) : formData.photoPath ? (
                                                <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                    <User size={48} />
                                                </div>
                                            ) : (
                                                <Camera size={32} className="text-slate-300 group-hover:text-blue-400 transition-colors" />
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => photoInputRef.current?.click()}
                                            className="absolute -bottom-2 -right-2 p-2 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all active:scale-95"
                                        >
                                            <Plus size={16} />
                                        </button>
                                        <input
                                            type="file"
                                            ref={photoInputRef}
                                            onChange={handlePhotoChange}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fotografia</span>
                                </div>

                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <User size={12} className="text-blue-600" />
                                            Nome Completo
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            placeholder="Nome do funcionário"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 transition-all"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Fingerprint size={12} className="text-blue-600" />
                                            Nº Identidade (BI/Passaporte)
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            placeholder="000000000LA000"
                                            value={formData.identityDocument}
                                            onChange={(e) => setFormData({ ...formData, identityDocument: e.target.value })}
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 transition-all"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Fingerprint size={12} className="text-blue-600" />
                                            NIF
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            placeholder="0000000000"
                                            value={formData.nif}
                                            onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <ShieldCheck size={12} className="text-blue-600" />
                                        Nº Segurança Social
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="0000000000"
                                        value={formData.socialSecurityNumber}
                                        onChange={(e) => setFormData({ ...formData, socialSecurityNumber: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Globe size={12} className="text-blue-600" />
                                        Tipo de Funcionário
                                    </label>
                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, type: 'Nacional' })}
                                            className={`flex-1 py-3.5 rounded-2xl font-bold transition-all ${formData.type === 'Nacional' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}
                                        >
                                            Nacional
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, type: 'Estrangeiro' })}
                                            className={`flex-1 py-3.5 rounded-2xl font-bold transition-all ${formData.type === 'Estrangeiro' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}
                                        >
                                            Estrangeiro
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Building2 size={12} className="text-blue-600" />
                                        Departamento
                                    </label>
                                    <select
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 transition-all appearance-none"
                                    >
                                        <option value="">Seleccionar Departamento...</option>
                                        {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Briefcase size={12} className="text-blue-600" />
                                        Função / Cargo
                                    </label>
                                    <select
                                        value={formData.jobFunction}
                                        onChange={(e) => setFormData({ ...formData, jobFunction: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 transition-all appearance-none"
                                    >
                                        <option value="">Seleccionar Função...</option>
                                        {jobFunctions.map(jf => <option key={jf.id} value={jf.name}>{jf.name}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <MapPin size={12} className="text-blue-600" />
                                        Província
                                    </label>
                                    <select
                                        value={formData.provinceId}
                                        onChange={(e) => setFormData({ ...formData, provinceId: e.target.value, municipalityId: '' })}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 transition-all appearance-none"
                                    >
                                        <option value="">Seleccionar Província...</option>
                                        {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Building2 size={12} className="text-blue-600" />
                                        Município
                                    </label>
                                    <select
                                        value={formData.municipalityId}
                                        onChange={(e) => setFormData({ ...formData, municipalityId: e.target.value })}
                                        disabled={!formData.provinceId}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 transition-all appearance-none disabled:opacity-50"
                                    >
                                        <option value="">Seleccionar Município...</option>
                                        {municipalities.filter(m => m.provinceId === formData.provinceId).map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <ShieldCheck size={12} className="text-blue-600" />
                                        Não Sujeito a Segurança Social?
                                    </label>
                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, notSubjectToSS: true })}
                                            className={`flex-1 py-3.5 rounded-2xl font-bold transition-all ${formData.notSubjectToSS ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}
                                        >
                                            Sim
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, notSubjectToSS: false })}
                                            className={`flex-1 py-3.5 rounded-2xl font-bold transition-all ${!formData.notSubjectToSS ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}
                                        >
                                            Não
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <ShieldCheck size={12} className="text-blue-600" />
                                        Reformado?
                                    </label>
                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, isRetired: true, ssContributionRate: 0 })}
                                            className={`flex-1 py-3.5 rounded-2xl font-bold transition-all ${formData.isRetired ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}
                                        >
                                            Sim
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, isRetired: false, ssContributionRate: 3 })}
                                            className={`flex-1 py-3.5 rounded-2xl font-bold transition-all ${!formData.isRetired ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}
                                        >
                                            Não
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Percent size={12} className="text-blue-600" />
                                        Taxa de Contribuição Social
                                    </label>
                                    <select
                                        value={formData.ssContributionRate}
                                        onChange={(e) => setFormData({ ...formData, ssContributionRate: Number(e.target.value) })}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 transition-all appearance-none"
                                    >
                                        <option value={3}>3% (Normal)</option>
                                        <option value={0}>0% (Isento)</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Percent size={12} className="text-blue-600" />
                                        Isento de IRT?
                                    </label>
                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, irtExempt: true })}
                                            className={`flex-1 py-3.5 rounded-2xl font-bold transition-all ${formData.irtExempt ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}
                                        >
                                            Sim
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, irtExempt: false })}
                                            className={`flex-1 py-3.5 rounded-2xl font-bold transition-all ${!formData.irtExempt ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}
                                        >
                                            Não
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-12 pt-12 border-t border-slate-100 space-y-6">
                                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                    <Upload size={20} className="text-blue-600" />
                                    Anexos e Documentos
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-slate-50 p-6 rounded-3xl border border-slate-200">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Título do Anexo</label>
                                        <input
                                            type="text"
                                            placeholder="Ex: Contrato de Trabalho"
                                            value={attachmentTitle}
                                            onChange={(e) => setAttachmentTitle(e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ficheiro</label>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-xl flex items-center gap-2 font-bold text-sm transition-all ${selectedFile ? 'text-blue-600 border-blue-200 bg-blue-50' : 'text-slate-400'}`}
                                        >
                                            <Upload size={16} />
                                            <span className="truncate">{selectedFile ? selectedFile.name : 'Seleccionar...'}</span>
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addAttachment}
                                        className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all active:scale-95"
                                    >
                                        Adicionar Anexo
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {formData.attachments?.map((att) => (
                                        <div key={att.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl group hover:border-blue-200 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                    <FileText size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-800">{att.title}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]">{att.filePath.split(/[\\/]/).pop()}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openAttachment(att.filePath)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => removeAttachment(att.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-8 border-t border-slate-200 flex justify-end gap-4">
                            <button
                                type="button"
                                onClick={handleBack}
                                className="px-8 py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all active:scale-95"
                            >
                                Descartar
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-12 py-4 bg-blue-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> {currentSubView === 'create' ? 'Criar Funcionário' : 'Salvar Alterações'}</>}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500 space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Pesquisar por Nome ou NIF..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm font-medium"
                    />
                </div>
                <button
                    onClick={() => setCurrentSubView('create')}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-3.5 rounded-2xl font-black transition-all shadow-xl shadow-slate-900/10 active:scale-95"
                >
                    <Plus size={20} />
                    <span>Novo Funcionário</span>
                </button>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Funcionário</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identificação / NIF</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Departamento / Função</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acções</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredStaff.map((s) => {
                                return (
                                    <tr key={s.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 text-blue-600 flex items-center justify-center font-black text-lg shadow-sm group-hover:border-blue-200 transition-all overflow-hidden">
                                                    {s.photoPath ? (
                                                        <img src={`file://${s.photoPath}`} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        s.name?.charAt(0) || '?'
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-base">{s.name}</p>
                                                    <p className="text-xs text-slate-500 font-medium">{s.type}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-bold text-slate-700">BI: {s.identityDocument}</span>
                                                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black font-mono w-fit">
                                                    NIF: {s.nif}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <p className="text-sm font-bold text-slate-700">{s.department || '---'}</p>
                                                <p className="text-xs text-slate-400 font-medium">{s.jobFunction || '---'}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(s)}
                                                    disabled={deletingId === s.id}
                                                    className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => removeStaff(s.id)}
                                                    disabled={deletingId === s.id}
                                                    className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
                                                    title="Remover"
                                                >
                                                    {deletingId === s.id ? <Loader2 size={18} className="animate-spin text-red-600" /> : <Trash2 size={18} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredStaff.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <div className="p-6 bg-slate-50 rounded-full mb-4">
                                                <User size={64} className="opacity-10" />
                                            </div>
                                            <p className="text-lg font-bold text-slate-500">Nenhum funcionário encontrado</p>
                                            <p className="text-sm">Clique em "Novo Funcionário" para começar.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StaffComponent;
