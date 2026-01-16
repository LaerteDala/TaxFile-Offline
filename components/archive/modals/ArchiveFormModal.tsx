import React from 'react';
import { Archive } from '../../../types';

interface ArchiveFormModalProps {
    show: boolean;
    editingArchive: Archive | null;
    formData: {
        code: string;
        description: string;
        period: string;
        date: string;
        notes: string;
    };
    onClose: () => void;
    onChange: (data: any) => void;
    onSave: (e: React.FormEvent) => void;
}

export const ArchiveFormModal: React.FC<ArchiveFormModalProps> = ({
    show,
    editingArchive,
    formData,
    onClose,
    onChange,
    onSave
}) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="text-xl font-bold text-slate-800">
                        {editingArchive ? 'Editar Arquivo' : 'Novo Arquivo'}
                    </h3>
                </div>
                <form onSubmit={onSave} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                        <input
                            type="text"
                            required
                            value={formData.description}
                            onChange={e => onChange({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            placeholder="Ex: Documentos 2024"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Código</label>
                            <input
                                type="text"
                                value={formData.code}
                                onChange={e => onChange({ ...formData, code: e.target.value })}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                placeholder="Ex: DOC-001"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Período</label>
                            <input
                                type="text"
                                value={formData.period}
                                onChange={e => onChange({ ...formData, period: e.target.value })}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                placeholder="MM-AAAA ou 00-AAAA"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Data (opcional)</label>
                        <input
                            type="text"
                            value={formData.date}
                            onChange={e => onChange({ ...formData, date: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            placeholder="DD-MM-AAAA"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
                        <textarea
                            value={formData.notes}
                            onChange={e => onChange({ ...formData, notes: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 h-24 resize-none"
                            placeholder="Observações adicionais..."
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold shadow-lg shadow-blue-600/20"
                        >
                            Salvar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
