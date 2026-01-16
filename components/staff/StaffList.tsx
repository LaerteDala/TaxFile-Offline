import React from 'react';
import { Search, Plus, Edit2, Trash2, Loader2, User } from 'lucide-react';
import { Staff } from '../../types';

interface StaffListProps {
    staff: Staff[];
    searchTerm: string;
    onSearchChange: (term: string) => void;
    onAddStaff: () => void;
    onEditStaff: (staff: Staff) => void;
    onDeleteStaff: (id: string) => void;
    deletingId: string | null;
}

export const StaffList: React.FC<StaffListProps> = ({
    staff,
    searchTerm,
    onSearchChange,
    onAddStaff,
    onEditStaff,
    onDeleteStaff,
    deletingId
}) => {
    return (
        <div className="animate-in fade-in duration-500 space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Pesquisar por Nome ou NIF..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm font-medium"
                    />
                </div>
                <button
                    onClick={onAddStaff}
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
                            {staff.map((s) => (
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
                                                onClick={() => onEditStaff(s)}
                                                disabled={deletingId === s.id}
                                                className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
                                                title="Editar"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => onDeleteStaff(s.id)}
                                                disabled={deletingId === s.id}
                                                className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
                                                title="Remover"
                                            >
                                                {deletingId === s.id ? <Loader2 size={18} className="animate-spin text-red-600" /> : <Trash2 size={18} />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {staff.length === 0 && (
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
