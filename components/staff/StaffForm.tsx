import React from 'react';
import { ChevronLeft, AlertCircle, User, Fingerprint, ShieldCheck, Globe, Building2, Briefcase, MapPin, Percent, Loader2, Save } from 'lucide-react';
import { Staff, Province, Municipality, Department, JobFunction } from '../../types';
import { StaffPhotoUpload } from './StaffPhotoUpload';
import { StaffAttachments } from './StaffAttachments';

interface StaffFormProps {
    mode: 'create' | 'edit';
    formData: Partial<Staff>;
    onBack: () => void;
    onSubmit: (e: React.FormEvent) => void;
    onChange: (data: Partial<Staff>) => void;
    error: string | null;
    isSubmitting: boolean;
    departments: Department[];
    jobFunctions: JobFunction[];
    provinces: Province[];
    municipalities: Municipality[];
    selectedPhoto: File | null;
    photoInputRef: React.RefObject<HTMLInputElement>;
    onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    attachmentTitle: string;
    selectedFile: File | null;
    fileInputRef: React.RefObject<HTMLInputElement>;
    onAttachmentTitleChange: (title: string) => void;
    onAttachmentFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onAddAttachment: () => void;
    onOpenAttachment: (path: string) => void;
    onRemoveAttachment: (id: string) => void;
}

export const StaffForm: React.FC<StaffFormProps> = ({
    mode,
    formData,
    onBack,
    onSubmit,
    onChange,
    error,
    isSubmitting,
    departments,
    jobFunctions,
    provinces,
    municipalities,
    selectedPhoto,
    photoInputRef,
    onPhotoChange,
    attachmentTitle,
    selectedFile,
    fileInputRef,
    onAttachmentTitleChange,
    onAttachmentFileChange,
    onAddAttachment,
    onOpenAttachment,
    onRemoveAttachment
}) => {
    return (
        <div className="animate-in slide-in-from-right-8 duration-500 max-w-4xl mx-auto pb-12">
            <div className="flex items-center justify-between mb-8">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-semibold transition-colors group"
                >
                    <div className="p-2 bg-white border border-slate-200 rounded-xl group-hover:border-slate-300 shadow-sm">
                        <ChevronLeft size={20} />
                    </div>
                    Voltar à Lista
                </button>
                <h2 className="text-2xl font-black text-slate-800">
                    {mode === 'create' ? 'Novo Funcionário' : 'Editar Funcionário'}
                </h2>
                <div className="w-24"></div>
            </div>

            <form onSubmit={onSubmit} className="space-y-6">
                {error && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold animate-in shake duration-300">
                        <AlertCircle size={20} />
                        {error}
                    </div>
                )}

                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-8 md:p-12">
                        <div className="flex flex-col md:flex-row gap-12 mb-12">
                            <StaffPhotoUpload
                                selectedPhoto={selectedPhoto}
                                photoPath={formData.photoPath}
                                onPhotoClick={() => photoInputRef.current?.click()}
                                photoInputRef={photoInputRef}
                                onPhotoChange={onPhotoChange}
                            />

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
                                        onChange={(e) => onChange({ ...formData, name: e.target.value })}
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
                                        onChange={(e) => onChange({ ...formData, identityDocument: e.target.value })}
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
                                        onChange={(e) => onChange({ ...formData, nif: e.target.value })}
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
                                    onChange={(e) => onChange({ ...formData, socialSecurityNumber: e.target.value })}
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
                                        onClick={() => onChange({ ...formData, type: 'Nacional' })}
                                        className={`flex-1 py-3.5 rounded-2xl font-bold transition-all ${formData.type === 'Nacional' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}
                                    >
                                        Nacional
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onChange({ ...formData, type: 'Estrangeiro' })}
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
                                    onChange={(e) => onChange({ ...formData, department: e.target.value })}
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
                                    onChange={(e) => onChange({ ...formData, jobFunction: e.target.value })}
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
                                    onChange={(e) => onChange({ ...formData, provinceId: e.target.value, municipalityId: '' })}
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
                                    onChange={(e) => onChange({ ...formData, municipalityId: e.target.value })}
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
                                        onClick={() => onChange({ ...formData, notSubjectToSS: true })}
                                        className={`flex-1 py-3.5 rounded-2xl font-bold transition-all ${formData.notSubjectToSS ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}
                                    >
                                        Sim
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onChange({ ...formData, notSubjectToSS: false })}
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
                                        onClick={() => onChange({ ...formData, isRetired: true, ssContributionRate: 0 })}
                                        className={`flex-1 py-3.5 rounded-2xl font-bold transition-all ${formData.isRetired ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}
                                    >
                                        Sim
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onChange({ ...formData, isRetired: false, ssContributionRate: 3 })}
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
                                    onChange={(e) => onChange({ ...formData, ssContributionRate: Number(e.target.value) })}
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
                                        onClick={() => onChange({ ...formData, irtExempt: true })}
                                        className={`flex-1 py-3.5 rounded-2xl font-bold transition-all ${formData.irtExempt ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}
                                    >
                                        Sim
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onChange({ ...formData, irtExempt: false })}
                                        className={`flex-1 py-3.5 rounded-2xl font-bold transition-all ${!formData.irtExempt ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}
                                    >
                                        Não
                                    </button>
                                </div>
                            </div>
                        </div>

                        <StaffAttachments
                            attachments={formData.attachments || []}
                            attachmentTitle={attachmentTitle}
                            selectedFile={selectedFile}
                            onTitleChange={onAttachmentTitleChange}
                            onFileClick={() => fileInputRef.current?.click()}
                            fileInputRef={fileInputRef}
                            onFileChange={onAttachmentFileChange}
                            onAddAttachment={onAddAttachment}
                            onOpenAttachment={onOpenAttachment}
                            onRemoveAttachment={onRemoveAttachment}
                        />
                    </div>

                    <div className="bg-slate-50 p-8 border-t border-slate-200 flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={onBack}
                            className="px-8 py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all active:scale-95"
                        >
                            Descartar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-12 py-4 bg-blue-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> {mode === 'create' ? 'Criar Funcionário' : 'Salvar Alterações'}</>}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};
