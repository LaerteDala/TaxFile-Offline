import React from 'react';
import { ChevronLeft, AlertCircle, UserPlus, Fingerprint, Mail, MapPin, Globe, ShieldCheck, FileCheck, Loader2, Save } from 'lucide-react';
import { Client, Province, Municipality } from '../../types';
import { ClientAttachments } from './ClientAttachments';

interface ClientFormProps {
    mode: 'create' | 'edit';
    formData: Partial<Client>;
    onBack: () => void;
    onSubmit: (e: React.FormEvent) => void;
    onChange: (data: Partial<Client>) => void;
    error: string | null;
    isSubmitting: boolean;
    provinces: Province[];
    municipalities: Municipality[];
    attachmentTitle: string;
    selectedFile: File | null;
    fileInputRef: React.RefObject<HTMLInputElement>;
    onAttachmentTitleChange: (value: string) => void;
    onAttachmentFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onAddAttachment: () => void;
    onOpenAttachment: (path: string) => void;
    onRemoveAttachment: (id: string) => void;
}

export const ClientForm: React.FC<ClientFormProps> = ({
    mode,
    formData,
    onBack,
    onSubmit,
    onChange,
    error,
    isSubmitting,
    provinces,
    municipalities,
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
                    {mode === 'create' ? 'Novo Cliente' : 'Editar Cliente'}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <UserPlus size={12} className="text-blue-600" />
                                    Nome do Cliente
                                </label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Ex: João Silva"
                                    value={formData.name}
                                    onChange={(e) => onChange({ ...formData, name: e.target.value })}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Fingerprint size={12} className="text-blue-600" />
                                    NIF (Número de Identificação Fiscal)
                                </label>
                                <input
                                    required
                                    type="text"
                                    placeholder="5412345678"
                                    value={formData.nif}
                                    onChange={(e) => onChange({ ...formData, nif: e.target.value })}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Mail size={12} className="text-blue-600" />
                                    Endereço de Email
                                </label>
                                <input
                                    type="email"
                                    placeholder="contacto@cliente.ao"
                                    value={formData.email}
                                    onChange={(e) => onChange({ ...formData, email: e.target.value })}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <MapPin size={12} className="text-blue-600" />
                                    Morada Completa
                                </label>
                                <input
                                    type="text"
                                    placeholder="Rua Direita, Luanda"
                                    value={formData.address}
                                    onChange={(e) => onChange({ ...formData, address: e.target.value })}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Globe size={12} className="text-blue-600" />
                                    Em Angola?
                                </label>
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => onChange({ ...formData, inAngola: true })}
                                        className={`flex-1 py-3.5 rounded-2xl font-bold transition-all ${formData.inAngola ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}
                                    >
                                        Sim
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onChange({ ...formData, inAngola: false })}
                                        className={`flex-1 py-3.5 rounded-2xl font-bold transition-all ${!formData.inAngola ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}
                                    >
                                        Não
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <ShieldCheck size={12} className="text-blue-600" />
                                    Regime do IVA
                                </label>
                                <select
                                    value={formData.ivaRegime}
                                    onChange={(e) => onChange({ ...formData, ivaRegime: e.target.value as any })}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 transition-all appearance-none"
                                >
                                    <option value="Geral">Regime Geral</option>
                                    <option value="Simplificado">Regime Simplificado</option>
                                    <option value="Exclusão">Regime de Exclusão</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <ShieldCheck size={12} className="text-blue-600" />
                                    Tipo de Cliente
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => {
                                        const type = e.target.value as any;
                                        let cativeRate = 0;
                                        if (type === 'Estado') cativeRate = 100;
                                        else if (type === 'Instituição Financeira') cativeRate = 50;
                                        onChange({ ...formData, type, cativeVatRate: cativeRate });
                                    }}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 transition-all appearance-none"
                                >
                                    <option value="Normal">Normal</option>
                                    <option value="Estado">Estado</option>
                                    <option value="Instituição Financeira">Instituição Financeira</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <ShieldCheck size={12} className="text-blue-600" />
                                    Taxa de IVA Cativo (%)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    placeholder="0"
                                    value={formData.cativeVatRate}
                                    onChange={(e) => onChange({ ...formData, cativeVatRate: Number(e.target.value) })}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 transition-all"
                                />
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
                                    <UserPlus size={12} className="text-blue-600" />
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

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <FileCheck size={12} className="text-blue-600" />
                                    Nº da Declaração de Conformidade
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ex: DC-2024-001"
                                    value={formData.conformityDeclarationNumber}
                                    onChange={(e) => onChange({ ...formData, conformityDeclarationNumber: e.target.value })}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 transition-all"
                                />
                            </div>
                        </div>

                        <ClientAttachments
                            attachments={formData.attachments || []}
                            attachmentTitle={attachmentTitle}
                            selectedFile={selectedFile}
                            fileInputRef={fileInputRef}
                            onAttachmentTitleChange={onAttachmentTitleChange}
                            onAttachmentFileChange={onAttachmentFileChange}
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
                            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> {mode === 'create' ? 'Criar Cliente' : 'Salvar Alterações'}</>}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};
