
import React, { useState, useMemo } from 'react';
import {
    Plus,
    Search,
    Edit3,
    Trash2,
    Save,
    X,
    Loader2,
    Percent,
    ShieldCheck,
    Lock
} from 'lucide-react';
import { WithholdingType } from '../types';

interface WithholdingTypesProps {
    withholdingTypes: WithholdingType[];
    setWithholdingTypes: React.Dispatch<React.SetStateAction<WithholdingType[]>>;
}

const WithholdingTypes: React.FC<WithholdingTypesProps> = ({ withholdingTypes, setWithholdingTypes }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Form states
    const [name, setName] = useState('');
    const [rate, setRate] = useState<number>(0);

    const filteredTypes = useMemo(() => {
        return withholdingTypes.filter(wt =>
            wt.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [withholdingTypes, searchTerm]);

    const resetForm = () => {
        setName('');
        setRate(0);
        setIsAdding(false);
        setEditingId(null);
    };

    const handleAdd = async () => {
        if (!name || rate < 0) return;
        setIsLoading(true);
        try {
            const isDuplicate = withholdingTypes.some(wt => wt.name.toLowerCase() === name.toLowerCase());
            if (isDuplicate) {
                alert(`O imposto "${name}" já existe.`);
                setIsLoading(false);
                return;
            }
            const newWT = { id: crypto.randomUUID(), name, rate };
            await window.electron.db.addWithholdingType(newWT);
            setWithholdingTypes(prev => [...prev, newWT]);
            resetForm();
        } catch (err: any) {
            alert(`Erro ao adicionar: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!editingId || !name || rate < 0) return;
        setIsLoading(true);
        try {
            const isDuplicate = withholdingTypes.some(wt => wt.name.toLowerCase() === name.toLowerCase() && wt.id !== editingId);
            if (isDuplicate) {
                alert(`O imposto "${name}" já existe.`);
                setIsLoading(false);
                return;
            }
            const updatedWT = { id: editingId, name, rate };
            await window.electron.db.updateWithholdingType(updatedWT);
            setWithholdingTypes(prev => prev.map(wt => wt.id === editingId ? updatedWT : wt));
            resetForm();
        } catch (err: any) {
            alert(`Erro ao atualizar: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja realmente eliminar este tipo de retenção?')) return;
        setIsLoading(true);
        try {
            await window.electron.db.deleteWithholdingType(id);
            setWithholdingTypes(prev => prev.filter(wt => wt.id !== id));
        } catch (err: any) {
            alert(`Erro ao eliminar: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const startEdit = (wt: WithholdingType) => {
        setEditingId(wt.id);
        setName(wt.name);
        setRate(wt.rate);
        setIsAdding(false);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Pesquisar por nome do imposto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 font-medium shadow-sm"
                    />
                </div>
                <button
                    onClick={() => { setIsAdding(true); setEditingId(null); resetForm(); }}
                    className="flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                >
                    <Plus size={18} /> Novo Tipo de Retenção
                </button>
            </div>


            {(isAdding || editingId) && (
                <div className="bg-white p-8 rounded-[2rem] border-2 border-blue-100 shadow-xl animate-in zoom-in-95 duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                            <ShieldCheck className="text-blue-600" size={20} />
                            {editingId ? 'Editar Tipo de Retenção' : 'Novo Tipo de Retenção'}
                        </h3>
                        <button onClick={resetForm} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Imposto</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={editingId !== null && ['IRT Grupo B', 'Imposto Industrial', 'Imposto Predial'].includes(withholdingTypes.find(wt => wt.id === editingId)?.name || '')}
                                className={`w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700 ${editingId !== null && ['IRT Grupo B', 'Imposto Industrial', 'Imposto Predial'].includes(withholdingTypes.find(wt => wt.id === editingId)?.name || '') ? 'bg-slate-100 cursor-not-allowed' : 'bg-slate-50'}`}
                                placeholder="Ex: Imposto Industrial"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Taxa de Retenção (%)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.1"
                                    value={rate}
                                    onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                                    placeholder="6.5"
                                />
                                <Percent className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-8">
                        <button
                            onClick={resetForm}
                            className="px-6 py-2.5 text-slate-500 font-bold text-sm hover:bg-slate-100 rounded-xl transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={editingId ? handleUpdate : handleAdd}
                            disabled={isLoading || !name}
                            className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            {editingId ? 'Actualizar' : 'Gravar'}
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome do Imposto</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Taxa Aplicável</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acções</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredTypes.map((wt) => (
                            <tr key={wt.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-slate-800">{wt.name}</p>
                                        {['IRT Grupo B', 'Imposto Industrial', 'Imposto Predial'].includes(wt.name) && <Lock size={14} className="text-amber-500" title="Protegido" />}
                                    </div>
                                </td>
                                <td className="px-8 py-5 text-center">
                                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-black">
                                        {wt.rate}%
                                    </span>
                                </td>
                                <td className="px-8 py-5">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => startEdit(wt)}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl transition-all shadow-sm"
                                        >
                                            <Edit3 size={18} />
                                        </button>
                                        <button
                                            onClick={() => !['IRT Grupo B', 'Imposto Industrial', 'Imposto Predial'].includes(wt.name) ? handleDelete(wt.id) : alert('Este tipo de retenção é obrigatório e não pode ser eliminado.')}
                                            className={`p-2 rounded-xl transition-all shadow-sm ${['IRT Grupo B', 'Imposto Industrial', 'Imposto Predial'].includes(wt.name) ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-red-600 hover:bg-white'}`}
                                            disabled={['IRT Grupo B', 'Imposto Industrial', 'Imposto Predial'].includes(wt.name)}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredTypes.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-8 py-12 text-center text-slate-400 font-medium italic">
                                    Nenhum tipo de retenção configurado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default WithholdingTypes;
