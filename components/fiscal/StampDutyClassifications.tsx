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
    Hash,
    Type,
    FileText
} from 'lucide-react';
import { StampDutyClassification } from '../../types';

interface StampDutyClassificationsProps {
    stampDutyClassifications: StampDutyClassification[];
    setStampDutyClassifications: React.Dispatch<React.SetStateAction<StampDutyClassification[]>>;
}

type SubView = 'list' | 'create' | 'edit';

const StampDutyClassifications: React.FC<StampDutyClassificationsProps> = ({ stampDutyClassifications, setStampDutyClassifications }) => {
    const [currentSubView, setCurrentSubView] = useState<SubView>('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<StampDutyClassification>>({
        code: '',
        description: ''
    });
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const filteredClassifications = (stampDutyClassifications || []).filter(c => {
        const code = (c.code || "").toLowerCase();
        const description = (c.description || "").toLowerCase();
        const term = searchTerm.toLowerCase();
        return code.includes(term) || description.includes(term);
    });

    const resetForm = () => {
        setFormData({ code: '', description: '' });
        setError(null);
        setSelectedId(null);
    };

    const handleEdit = (classification: StampDutyClassification) => {
        setFormData(classification);
        setSelectedId(classification.id);
        setCurrentSubView('edit');
    };

    const handleBack = () => {
        setCurrentSubView('list');
        resetForm();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            // Check for duplicate code
            const isDuplicate = stampDutyClassifications.some(c => c.code === formData.code && c.id !== selectedId);
            if (isDuplicate) {
                setError(`O código "${formData.code}" já está em uso.`);
                setIsSubmitting(false);
                return;
            }

            if (currentSubView === 'create') {
                const newClassification = {
                    ...formData,
                    id: crypto.randomUUID()
                };
                await window.electron.db.addStampDutyClassification(newClassification);
                setStampDutyClassifications([...stampDutyClassifications, newClassification as StampDutyClassification]);
            } else if (currentSubView === 'edit' && selectedId) {
                const updatedClassification = {
                    ...formData,
                    id: selectedId
                };
                await window.electron.db.updateStampDutyClassification(updatedClassification);
                setStampDutyClassifications(stampDutyClassifications.map(c => c.id === selectedId ? updatedClassification as StampDutyClassification : c));
            }

            setCurrentSubView('list');
            resetForm();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const removeClassification = async (id: string) => {
        if (!confirm('Deseja realmente eliminar esta classificação?')) return;

        setDeletingId(id);
        setError(null);

        try {
            await window.electron.db.deleteStampDutyClassification(id);
            setStampDutyClassifications(prev => prev.filter(c => c.id !== id));
        } catch (err: any) {
            alert(`Erro ao remover classificação: ${err.message}`);
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
                        {currentSubView === 'create' ? 'Nova Classificação Imposto de Selo' : 'Editar Classificação Imposto de Selo'}
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
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Hash size={12} className="text-blue-600" />
                                        Código
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Ex: 1"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 transition-all"
                                    />
                                </div>

                                <div className="md:col-span-3 space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Type size={12} className="text-blue-600" />
                                        Descrição
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Ex: Descrição da classificação..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 transition-all"
                                    />
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
                                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> {currentSubView === 'create' ? 'Criar Classificação' : 'Salvar Alterações'}</>}
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
                        placeholder="Pesquisar por Código ou Descrição..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm font-medium"
                    />
                </div>
                <button
                    onClick={() => setCurrentSubView('create')}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-3.5 rounded-2xl font-black transition-all shadow-xl shadow-slate-900/10 active:scale-95"
                >
                    <Plus size={20} />
                    <span>Nova Classificação</span>
                </button>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Código</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acções</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredClassifications.map((c) => (
                                <tr key={c.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="px-8 py-5">
                                        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-black font-mono">
                                            {c.code}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <p className="font-bold text-slate-800 text-base">{c.description}</p>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(c)}
                                                disabled={deletingId === c.id}
                                                className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => removeClassification(c.id)}
                                                disabled={deletingId === c.id}
                                                className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
                                            >
                                                {deletingId === c.id ? <Loader2 size={18} className="animate-spin text-red-600" /> : <Trash2 size={18} />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredClassifications.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <div className="p-6 bg-slate-50 rounded-full mb-4">
                                                <FileText size={64} className="opacity-10" />
                                            </div>
                                            <p className="text-lg font-bold text-slate-500">Nenhuma classificação encontrada</p>
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

export default StampDutyClassifications;
