
import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Save, X, Building2, Loader2 } from 'lucide-react';
import { Department } from '../types';

interface DepartmentsProps {
    departments: Department[];
    setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
}

const Departments: React.FC<DepartmentsProps> = ({ departments, setDepartments }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const filtered = departments.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleAdd = async () => {
        if (!newName.trim()) return;
        setIsLoading(true);
        try {
            const dept = { id: crypto.randomUUID(), name: newName.trim() };
            await window.electron.db.addDepartment(dept);
            setDepartments([...departments, dept]);
            setNewName('');
            setIsAdding(false);
        } catch (err: any) {
            alert(`Erro ao adicionar departamento: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdate = async (id: string) => {
        if (!editName.trim()) return;
        setIsLoading(true);
        try {
            await window.electron.db.updateDepartment({ id, name: editName.trim() });
            setDepartments(departments.map(d => d.id === id ? { ...d, name: editName.trim() } : d));
            setIsEditing(null);
        } catch (err: any) {
            alert(`Erro ao atualizar departamento: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja realmente remover este departamento?')) return;
        setIsLoading(true);
        try {
            await window.electron.db.deleteDepartment(id);
            setDepartments(departments.filter(d => d.id !== id));
        } catch (err: any) {
            alert(`Erro ao remover departamento: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="animate-in fade-in duration-500 max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Pesquisar departamentos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm font-medium"
                    />
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-3.5 rounded-2xl font-black transition-all shadow-xl shadow-slate-900/10 active:scale-95"
                >
                    <Plus size={20} />
                    <span>Novo Departamento</span>
                </button>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome do Departamento</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acções</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isAdding && (
                                <tr className="bg-blue-50/30">
                                    <td className="px-8 py-4">
                                        <input
                                            autoFocus
                                            type="text"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            placeholder="Nome do novo departamento"
                                            className="w-full px-4 py-2 bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800"
                                        />
                                    </td>
                                    <td className="px-8 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={handleAdd}
                                                disabled={isLoading}
                                                className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                                            >
                                                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                            </button>
                                            <button
                                                onClick={() => setIsAdding(false)}
                                                className="p-2 bg-slate-200 text-slate-600 rounded-xl hover:bg-slate-300 transition-all active:scale-95"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {filtered.map((d) => (
                                <tr key={d.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-8 py-5">
                                        {isEditing === d.id ? (
                                            <input
                                                autoFocus
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="w-full px-4 py-2 bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800"
                                            />
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-slate-100 text-slate-400 rounded-lg">
                                                    <Building2 size={18} />
                                                </div>
                                                <span className="font-bold text-slate-800">{d.name}</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {isEditing === d.id ? (
                                                <>
                                                    <button
                                                        onClick={() => handleUpdate(d.id)}
                                                        disabled={isLoading}
                                                        className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                                                    >
                                                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                                    </button>
                                                    <button
                                                        onClick={() => setIsEditing(null)}
                                                        className="p-2 bg-slate-200 text-slate-600 rounded-xl hover:bg-slate-300 transition-all active:scale-95"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => { setIsEditing(d.id); setEditName(d.name); }}
                                                        className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 rounded-xl transition-all shadow-sm active:scale-95"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(d.id)}
                                                        className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 rounded-xl transition-all shadow-sm active:scale-95"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && !isAdding && (
                                <tr>
                                    <td colSpan={2} className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <div className="p-6 bg-slate-50 rounded-full mb-4">
                                                <Building2 size={64} className="opacity-10" />
                                            </div>
                                            <p className="text-lg font-bold text-slate-500">Nenhum departamento encontrado</p>
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

export default Departments;
