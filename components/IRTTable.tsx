import React, { useState, useEffect } from 'react';
import {
    Table,
    Edit2,
    Save,
    X,
    ArrowLeft,
    Calculator,
    AlertCircle
} from 'lucide-react';
import { IRTScale } from '../types';

interface IRTTableProps {
    onBack: () => void;
}

const IRTTable: React.FC<IRTTableProps> = ({ onBack }) => {
    const [scales, setScales] = useState<IRTScale[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<Partial<IRTScale>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadScales();
    }, []);

    const loadScales = async () => {
        try {
            const data = await window.electron.db.getIRTScales();
            setScales(data);
        } catch (error) {
            console.error('Error loading IRT scales:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (scale: IRTScale) => {
        setEditingId(scale.id);
        setEditValues(scale);
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditValues({});
    };

    const handleSave = async () => {
        if (!editingId) return;
        try {
            await window.electron.db.updateIRTScale(editValues as IRTScale);
            await loadScales();
            setEditingId(null);
        } catch (error) {
            console.error('Error updating IRT scale:', error);
        }
    };

    const formatCurrency = (value: number | null) => {
        if (value === null) return '---';
        return new Intl.NumberFormat('pt-AO', {
            style: 'currency',
            currency: 'AOA'
        }).format(value);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-rose-600 rounded-xl text-white shadow-lg shadow-rose-600/20">
                            <Calculator size={24} />
                        </div>
                        Tabela de IRT
                    </h2>
                    <p className="text-sm text-slate-500 font-medium">Configuração de escalões, taxas e parcelas fixas do IRT</p>
                </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-4 text-amber-800">
                <AlertCircle className="shrink-0" size={24} />
                <div className="text-sm font-medium">
                    <p className="font-bold">Atenção:</p>
                    <p>As alterações nesta tabela afectam directamente o cálculo de salários em todos os módulos do sistema. Certifique-se de que os valores estão correctos de acordo com a legislação em vigor.</p>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Escalão</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Valor Inicial</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Valor Final</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Parcela Fixa</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Taxa (%)</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Excesso</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Acções</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {scales.map((scale) => (
                            <tr key={scale.id} className="group hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-700">{scale.escalao}</td>
                                <td className="px-6 py-4">
                                    {editingId === scale.id ? (
                                        <input
                                            type="number"
                                            value={editValues.valor_inicial}
                                            onChange={(e) => setEditValues({ ...editValues, valor_inicial: Number(e.target.value) })}
                                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none font-medium"
                                        />
                                    ) : (
                                        <span className="font-medium text-slate-600">{formatCurrency(scale.valor_inicial)}</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {editingId === scale.id ? (
                                        <input
                                            type="number"
                                            value={editValues.valor_final || ''}
                                            onChange={(e) => setEditValues({ ...editValues, valor_final: e.target.value ? Number(e.target.value) : null })}
                                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none font-medium"
                                            placeholder="Sem limite"
                                        />
                                    ) : (
                                        <span className="font-medium text-slate-600">{formatCurrency(scale.valor_final)}</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {editingId === scale.id ? (
                                        <input
                                            type="number"
                                            value={editValues.parcela_fixa}
                                            onChange={(e) => setEditValues({ ...editValues, parcela_fixa: Number(e.target.value) })}
                                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none font-medium"
                                        />
                                    ) : (
                                        <span className="font-medium text-slate-600">{formatCurrency(scale.parcela_fixa)}</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {editingId === scale.id ? (
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={editValues.taxa}
                                            onChange={(e) => setEditValues({ ...editValues, taxa: Number(e.target.value) })}
                                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none font-medium"
                                        />
                                    ) : (
                                        <span className="font-bold text-rose-600">{scale.taxa}%</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {editingId === scale.id ? (
                                        <input
                                            type="number"
                                            value={editValues.excesso}
                                            onChange={(e) => setEditValues({ ...editValues, excesso: Number(e.target.value) })}
                                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none font-medium"
                                        />
                                    ) : (
                                        <span className="font-medium text-slate-600">{formatCurrency(scale.excesso)}</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {editingId === scale.id ? (
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={handleSave}
                                                className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
                                            >
                                                <Save size={18} />
                                            </button>
                                            <button
                                                onClick={handleCancel}
                                                className="p-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleEdit(scale)}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {loading && (
                    <div className="p-12 text-center text-slate-500 font-medium">
                        Carregando tabela de IRT...
                    </div>
                )}
            </div>
        </div>
    );
};

export default IRTTable;
