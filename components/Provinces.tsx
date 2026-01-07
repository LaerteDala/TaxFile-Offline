
import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Edit3,
    Trash2,
    X,
    Check,
    MapPin,
    AlertCircle
} from 'lucide-react';
import { Province } from '../types';

const Provinces: React.FC = () => {
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreator, setShowCreator] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadProvinces();
    }, []);

    const loadProvinces = async () => {
        const data = await window.electron.db.getProvinces();
        setProvinces(data);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError('O nome da província é obrigatório.');
            return;
        }

        try {
            const isDuplicate = provinces.some(p => p.name.toLowerCase() === name.trim().toLowerCase() && p.id !== editingId);
            if (isDuplicate) {
                setError('Esta província já existe.');
                return;
            }

            if (editingId) {
                await window.electron.db.updateProvince({ id: editingId, name: name.trim() });
            } else {
                await window.electron.db.addProvince({ id: crypto.randomUUID(), name: name.trim() });
            }
            setName('');
            setEditingId(null);
            setShowCreator(false);
            loadProvinces();
        } catch (err: any) {
            setError(err.message.includes('UNIQUE') ? 'Esta província já existe.' : err.message);
        }
    };

    const handleEdit = (province: Province) => {
        setEditingId(province.id);
        setName(province.name);
        setShowCreator(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Tem a certeza que deseja eliminar esta província?')) {
            await window.electron.db.deleteProvince(id);
            loadProvinces();
        }
    };

    const filteredProvinces = provinces.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-slate-800">Províncias</h2>
                    <p className="text-sm text-slate-500 font-medium">Gestão de províncias de Angola</p>
                </div>
                <button
                    onClick={() => { setShowCreator(true); setEditingId(null); setName(''); setError(null); }}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                >
                    <Plus size={20} />
                    Nova Província
                </button>
            </div>

            {showCreator && (
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm animate-in slide-in-from-top-4 duration-300">
                    <form onSubmit={handleSubmit} className="flex flex-col md:flex-row items-end gap-6">
                        <div className="flex-1 space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Província</label>
                            <input
                                autoFocus
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700 transition-all"
                                placeholder="Ex: Luanda"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowCreator(false)}
                                className="px-6 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-8 py-3.5 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                            >
                                {editingId ? 'Actualizar' : 'Guardar'}
                            </button>
                        </div>
                    </form>
                    {error && (
                        <div className="mt-4 flex items-center gap-2 text-red-600 text-sm font-bold animate-in shake duration-300">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}
                </div>
            )}

            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-100">
                    <div className="relative max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Pesquisar província..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-slate-600 transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acções</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredProvinces.map((p) => (
                                <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                <MapPin size={16} />
                                            </div>
                                            <p className="font-bold text-slate-800">{p.name}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(p)}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl transition-all shadow-sm"
                                            >
                                                <Edit3 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(p.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-xl transition-all shadow-sm"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredProvinces.length === 0 && (
                                <tr>
                                    <td colSpan={2} className="px-8 py-20 text-center text-slate-400 italic">Nenhuma província encontrada.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Provinces;
