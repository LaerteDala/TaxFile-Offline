
import React, { useState, useEffect } from 'react';
import {
    Building2, Save, Upload, Plus, Trash2, FileText, Globe, Mail,
    MapPin, Landmark, Percent, Coins, Briefcase, FileCheck, ShieldCheck
} from 'lucide-react';
import { CompanyInfo, Province, Municipality, CompanyAttachment } from '../types';

const CompanySettings: React.FC = () => {
    const [formData, setFormData] = useState<CompanyInfo>({
        id: '',
        name: '',
        nif: '',
        address: '',
        location: '',
        provinceId: '',
        municipalityId: '',
        email: '',
        website: '',
        turnover: 0,
        ivaRegime: 'Geral',
        serviceRegime: 'Imposto Industrial',
        hasStampDuty: false,
        stampDutyRate: 0,
        logoPath: '',
        attachments: []
    });

    const [provinces, setProvinces] = useState<Province[]>([]);
    const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [newAttachment, setNewAttachment] = useState({ title: '', file: null as File | null });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [company, provs, muns] = await Promise.all([
                window.electron.db.getCompanyInfo(),
                window.electron.db.getProvinces(),
                window.electron.db.getMunicipalities()
            ]);

            if (company) {
                setFormData(company);
            }
            setProvinces(provs);
            setMunicipalities(muns);
        } catch (error) {
            console.error('Error fetching company data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await window.electron.db.updateCompanyInfo(formData);
            alert('Dados da empresa actualizados com sucesso!');
        } catch (error) {
            console.error('Error saving company data:', error);
            alert('Erro ao guardar os dados.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const buffer = await file.arrayBuffer();
            const path = await window.electron.fs.saveFile(file.name, buffer);
            setFormData({ ...formData, logoPath: path });
        } catch (error) {
            console.error('Error uploading logo:', error);
        }
    };

    const handleAddAttachment = async () => {
        if (!newAttachment.title || !newAttachment.file) {
            alert('Por favor, preencha o título e seleccione um ficheiro.');
            return;
        }

        try {
            const buffer = await newAttachment.file.arrayBuffer();
            const path = await window.electron.fs.saveFile(newAttachment.file.name, buffer);

            const attachment: CompanyAttachment = {
                id: crypto.randomUUID(),
                companyId: formData.id,
                title: newAttachment.title,
                filePath: path
            };

            await window.electron.db.addCompanyAttachment(attachment);
            setFormData({
                ...formData,
                attachments: [...formData.attachments, attachment]
            });
            setNewAttachment({ title: '', file: null });
        } catch (error) {
            console.error('Error adding attachment:', error);
        }
    };

    const handleDeleteAttachment = async (id: string) => {
        if (!confirm('Deseja eliminar este anexo?')) return;
        try {
            await window.electron.db.deleteCompanyAttachment(id);
            setFormData({
                ...formData,
                attachments: formData.attachments.filter(a => a.id !== id)
            });
        } catch (error) {
            console.error('Error deleting attachment:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const filteredMunicipalities = municipalities.filter(m => m.provinceId === formData.provinceId);

    return (
        <div className="animate-in fade-in duration-500 space-y-8 pb-12">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-800">Entidade</h2>
                    <p className="text-sm text-slate-500 font-medium">Configure os dados da sua empresa</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-black transition-all shadow-xl shadow-blue-600/20 active:scale-95 disabled:opacity-50"
                >
                    {isSaving ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <Save size={20} />}
                    <span>Guardar Alterações</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Basic Info */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                <Building2 size={20} />
                            </div>
                            <h3 className="font-black text-slate-800 uppercase tracking-wider text-sm">Informação Geral</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome da Empresa</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NIF</label>
                                <input
                                    type="text"
                                    value={formData.nif}
                                    onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 transition-all"
                                />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Endereço</label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Localidade</label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Província</label>
                                <select
                                    value={formData.provinceId}
                                    onChange={(e) => setFormData({ ...formData, provinceId: e.target.value, municipalityId: '' })}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 transition-all appearance-none"
                                >
                                    <option value="">Seleccione a Província</option>
                                    {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Município</label>
                                <select
                                    value={formData.municipalityId}
                                    onChange={(e) => setFormData({ ...formData, municipalityId: e.target.value })}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 transition-all appearance-none"
                                >
                                    <option value="">Seleccione o Município</option>
                                    {filteredMunicipalities.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Contacts & Finance */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                <Landmark size={20} />
                            </div>
                            <h3 className="font-black text-slate-800 uppercase tracking-wider text-sm">Contactos e Fiscalidade</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Mail size={12} /> Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Globe size={12} /> Website
                                </label>
                                <input
                                    type="text"
                                    value={formData.website}
                                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Volume de Negócios</label>
                                <input
                                    type="number"
                                    value={formData.turnover}
                                    onChange={(e) => setFormData({ ...formData, turnover: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Regime do IVA</label>
                                <select
                                    value={formData.ivaRegime}
                                    onChange={(e) => setFormData({ ...formData, ivaRegime: e.target.value as any })}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 transition-all appearance-none"
                                >
                                    <option value="Geral">Regime Geral</option>
                                    <option value="Simplificado">Regime Simplificado</option>
                                    <option value="Exclusão">Regime de Exclusão</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Regime de Prestação de Serviço</label>
                                <select
                                    value={formData.serviceRegime}
                                    onChange={(e) => setFormData({ ...formData, serviceRegime: e.target.value as any })}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 transition-all appearance-none"
                                >
                                    <option value="Imposto Industrial">Imposto Industrial</option>
                                    <option value="IRT Grupo B">IRT Grupo B</option>
                                    <option value="IRT Grupo C">IRT Grupo C</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Imposto de Selo (Recibos)</label>
                                <div className="flex items-center gap-4 h-[58px]">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={formData.hasStampDuty}
                                            onChange={() => setFormData({ ...formData, hasStampDuty: true })}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <span className="font-bold text-slate-700">Sim</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={!formData.hasStampDuty}
                                            onChange={() => setFormData({ ...formData, hasStampDuty: false, stampDutyRate: 0 })}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <span className="font-bold text-slate-700">Não</span>
                                    </label>
                                </div>
                            </div>
                            {formData.hasStampDuty && (
                                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Taxa de Imposto de Selo (%)</label>
                                    <input
                                        type="number"
                                        value={formData.stampDutyRate}
                                        onChange={(e) => setFormData({ ...formData, stampDutyRate: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 transition-all"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Logo & Attachments */}
                <div className="space-y-8">
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                                <Upload size={20} />
                            </div>
                            <h3 className="font-black text-slate-800 uppercase tracking-wider text-sm">Logo da Empresa</h3>
                        </div>

                        <div className="flex flex-col items-center gap-4">
                            <div className="w-32 h-32 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group">
                                {formData.logoPath ? (
                                    <img src={`file://${formData.logoPath}`} alt="Logo" className="w-full h-full object-contain" />
                                ) : (
                                    <Building2 size={48} className="text-slate-200" />
                                )}
                                <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                    <Upload className="text-white" size={24} />
                                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                                </label>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 text-center">Recomendado: 512x512px (PNG/JPG)</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                <FileText size={20} />
                            </div>
                            <h3 className="font-black text-slate-800 uppercase tracking-wider text-sm">Anexos</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    placeholder="Título do documento"
                                    value={newAttachment.title}
                                    onChange={(e) => setNewAttachment({ ...newAttachment, title: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                                />
                                <div className="flex gap-2">
                                    <label className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 py-3 rounded-xl text-xs font-bold cursor-pointer transition-all">
                                        <Upload size={14} />
                                        <span>{newAttachment.file ? newAttachment.file.name : 'Seleccionar'}</span>
                                        <input
                                            type="file"
                                            onChange={(e) => setNewAttachment({ ...newAttachment, file: e.target.files?.[0] || null })}
                                            className="hidden"
                                        />
                                    </label>
                                    <button
                                        onClick={handleAddAttachment}
                                        className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                                {formData.attachments.map((att) => (
                                    <div key={att.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                                        <div className="flex items-center gap-3">
                                            <FileText size={14} className="text-blue-600" />
                                            <span className="text-[11px] font-bold text-slate-700 truncate max-w-[120px]">{att.title}</span>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteAttachment(att.id)}
                                            className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompanySettings;
