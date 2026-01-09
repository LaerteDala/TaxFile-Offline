import React, { useState, useEffect } from 'react';
import {
    Table,
    Plus,
    Edit2,
    Trash2,
    X,
    Save,
    ArrowLeft,
    Coins,
    AlertCircle,
    Check,
    HelpCircle
} from 'lucide-react';
import { Subsidy } from '../types';

interface SubsidiesProps {
    onBack: () => void;
}

const Subsidies: React.FC<SubsidiesProps> = ({ onBack }) => {
    const [subsidies, setSubsidies] = useState<Subsidy[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Subsidy>>({
        name: '',
        subject_to_inss: 0,
        inss_limit_type: 'none',
        inss_limit_value: 0,
        subject_to_irt: 0,
        irt_limit_type: 'none',
        irt_limit_value: 0
    });

    useEffect(() => {
        loadSubsidies();
    }, []);

    const loadSubsidies = async () => {
        try {
            const data = await window.electron.db.getSubsidies();
            setSubsidies(data);
        } catch (error) {
            console.error('Error loading subsidies:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await window.electron.db.updateSubsidy({ ...formData, id: editingId });
            } else {
                await window.electron.db.addSubsidy({ ...formData, id: crypto.randomUUID() });
            }
            await loadSubsidies();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving subsidy:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Tem a certeza que deseja eliminar este subsídio?')) {
            try {
                await window.electron.db.deleteSubsidy(id);
                await loadSubsidies();
            } catch (error) {
                console.error('Error deleting subsidy:', error);
            }
        }
    };

    const handleEdit = (subsidy: Subsidy) => {
        setFormData(subsidy);
        setEditingId(subsidy.id);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingId(null);
        setFormData({
            name: '',
            subject_to_inss: 0,
            inss_limit_type: 'none',
            inss_limit_value: 0,
            subject_to_irt: 0,
            irt_limit_type: 'none',
            irt_limit_value: 0
        });
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-AO', {
            style: 'currency',
            currency: 'AOA'
        }).format(value);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-emerald-600 rounded-xl text-white shadow-lg shadow-emerald-600/20">
                                <Coins size={24} />
                            </div>
                            Subsídios e Abonos
                        </h2>
                        <p className="text-sm text-slate-500 font-medium">Gestão de subsídios e regras de incidência fiscal</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 font-medium"
                >
                    <Plus size={20} />
                    Novo Subsídio
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subsidies.map((subsidy) => (
                    <div key={subsidy.id} className="group bg-white rounded-2xl p-6 border border-slate-200 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                <Coins size={24} />
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleEdit(subsidy)}
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(subsidy.id)}
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-slate-800 mb-4">{subsidy.name}</h3>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-sm">
                                <span className="text-slate-500 font-medium">Sujeito a INSS</span>
                                {subsidy.subject_to_inss ? (
                                    <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                                        <Check size={16} />
                                        <span>Sim</span>
                                    </div>
                                ) : (
                                    <span className="text-slate-400 font-medium">Não</span>
                                )}
                            </div>
                            {subsidy.subject_to_inss === 1 && (
                                <div className="px-3 text-xs text-slate-500">
                                    {subsidy.inss_limit_type === 'none' && 'Sem limite de isenção'}
                                    {subsidy.inss_limit_type === 'fixed' && `Isento até ${formatCurrency(subsidy.inss_limit_value)}`}
                                    {subsidy.inss_limit_type === 'percentage' && `Isento até ${subsidy.inss_limit_value}% do Salário Base`}
                                </div>
                            )}

                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-sm">
                                <span className="text-slate-500 font-medium">Sujeito a IRT</span>
                                {subsidy.subject_to_irt ? (
                                    <div className="flex items-center gap-1.5 text-rose-600 font-bold">
                                        <Check size={16} />
                                        <span>Sim</span>
                                    </div>
                                ) : (
                                    <span className="text-slate-400 font-medium">Não</span>
                                )}
                            </div>
                            {subsidy.subject_to_irt === 1 && (
                                <div className="px-3 text-xs text-slate-500">
                                    {subsidy.irt_limit_type === 'none' && 'Sem limite de isenção'}
                                    {subsidy.irt_limit_type === 'fixed' && `Isento até ${formatCurrency(subsidy.irt_limit_value)}`}
                                    {subsidy.irt_limit_type === 'percentage' && `Isento até ${subsidy.irt_limit_value}% do Salário Base`}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-xl font-bold text-slate-800">
                                {editingId ? 'Editar Subsídio' : 'Novo Subsídio'}
                            </h3>
                            <button onClick={handleCloseModal} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Nome do Subsídio</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium transition-all"
                                    placeholder="Ex: Subsídio de Alimentação"
                                />
                            </div>

                            <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.subject_to_inss === 1}
                                            onChange={(e) => setFormData({ ...formData, subject_to_inss: e.target.checked ? 1 : 0 })}
                                            className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
                                        />
                                        <span className="font-bold text-slate-700">Sujeito a INSS?</span>
                                    </label>
                                </div>

                                {formData.subject_to_inss === 1 && (
                                    <div className="pl-8 space-y-3 animate-in slide-in-from-top-2 duration-200">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Limite de Isenção</label>
                                            <select
                                                value={formData.inss_limit_type}
                                                onChange={(e) => setFormData({ ...formData, inss_limit_type: e.target.value as any })}
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                                            >
                                                <option value="none">Sem limite (Totalmente tributável)</option>
                                                <option value="fixed">Valor Fixo</option>
                                                <option value="percentage">Percentagem do Salário Base</option>
                                            </select>
                                        </div>
                                        {formData.inss_limit_type !== 'none' && (
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                    {formData.inss_limit_type === 'fixed' ? 'Valor do Limite (Kz)' : 'Percentagem (%)'}
                                                </label>
                                                <input
                                                    type="number"
                                                    value={formData.inss_limit_value}
                                                    onChange={(e) => setFormData({ ...formData, inss_limit_value: Number(e.target.value) })}
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.subject_to_irt === 1}
                                            onChange={(e) => setFormData({ ...formData, subject_to_irt: e.target.checked ? 1 : 0 })}
                                            className="w-5 h-5 rounded text-rose-600 focus:ring-rose-500 border-gray-300"
                                        />
                                        <span className="font-bold text-slate-700">Sujeito a IRT?</span>
                                    </label>
                                </div>

                                {formData.subject_to_irt === 1 && (
                                    <div className="pl-8 space-y-3 animate-in slide-in-from-top-2 duration-200">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Limite de Isenção</label>
                                            <select
                                                value={formData.irt_limit_type}
                                                onChange={(e) => setFormData({ ...formData, irt_limit_type: e.target.value as any })}
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-rose-500 outline-none"
                                            >
                                                <option value="none">Sem limite (Totalmente tributável)</option>
                                                <option value="fixed">Valor Fixo</option>
                                                <option value="percentage">Percentagem do Salário Base</option>
                                            </select>
                                        </div>
                                        {formData.irt_limit_type !== 'none' && (
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                    {formData.irt_limit_type === 'fixed' ? 'Valor do Limite (Kz)' : 'Percentagem (%)'}
                                                </label>
                                                <input
                                                    type="number"
                                                    value={formData.irt_limit_value}
                                                    onChange={(e) => setFormData({ ...formData, irt_limit_value: Number(e.target.value) })}
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-rose-500 outline-none"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 px-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2"
                                >
                                    <Save size={20} />
                                    Salvar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Subsidies;
