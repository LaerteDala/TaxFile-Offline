import React, { useState, useEffect } from 'react';
import {
    Table,
    Plus,
    Search,
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

    const [searchTerm, setSearchTerm] = useState('');

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

    const filteredSubsidies = subsidies.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
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
                    className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 font-black active:scale-95"
                >
                    <Plus size={20} />
                    Novo Subsídio
                </button>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-100">
                    <div className="relative max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Pesquisar subsídio ou abono..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-bold text-slate-600 transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Subsídio / Abono</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Incidência INSS</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Incidência IRT</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acções</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredSubsidies.map((subsidy) => (
                                <tr key={subsidy.id} className="hover:bg-emerald-50/30 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                                <Coins size={20} />
                                            </div>
                                            <p className="font-bold text-slate-800 text-base">{subsidy.name}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="space-y-1">
                                            {subsidy.subject_to_inss ? (
                                                <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-sm">
                                                    <Check size={16} />
                                                    <span>Sujeito</span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 font-medium text-sm">Não Sujeito</span>
                                            )}
                                            {subsidy.subject_to_inss === 1 && (
                                                <p className="text-[10px] text-slate-500 font-medium">
                                                    {subsidy.inss_limit_type === 'none' && 'Sem limite de isenção'}
                                                    {subsidy.inss_limit_type === 'fixed' && `Isento até ${formatCurrency(subsidy.inss_limit_value)}`}
                                                    {subsidy.inss_limit_type === 'percentage' && `Isento até ${subsidy.inss_limit_value}%`}
                                                </p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="space-y-1">
                                            {subsidy.subject_to_irt ? (
                                                <div className="flex items-center gap-1.5 text-rose-600 font-bold text-sm">
                                                    <Check size={16} />
                                                    <span>Sujeito</span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 font-medium text-sm">Não Sujeito</span>
                                            )}
                                            {subsidy.subject_to_irt === 1 && (
                                                <p className="text-[10px] text-slate-500 font-medium">
                                                    {subsidy.irt_limit_type === 'none' && 'Sem limite de isenção'}
                                                    {subsidy.irt_limit_type === 'fixed' && `Isento até ${formatCurrency(subsidy.irt_limit_value)}`}
                                                    {subsidy.irt_limit_type === 'percentage' && `Isento até ${subsidy.irt_limit_value}%`}
                                                </p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(subsidy)}
                                                className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 rounded-xl transition-all shadow-sm active:scale-95"
                                                title="Editar"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(subsidy.id)}
                                                className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 rounded-xl transition-all shadow-sm active:scale-95"
                                                title="Remover"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredSubsidies.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <div className="p-6 bg-slate-50 rounded-full mb-4">
                                                <Coins size={64} className="opacity-10" />
                                            </div>
                                            <p className="text-lg font-bold text-slate-500">Nenhum subsídio encontrado</p>
                                            <p className="text-sm">Tente ajustar a sua pesquisa ou crie um novo.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
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
