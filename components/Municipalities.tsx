
import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Edit3,
    Trash2,
    X,
    Check,
    MapPin,
    AlertCircle,
    Building2
} from 'lucide-react';
import { Municipality, Province } from '../types';

const Municipalities: React.FC = () => {
    const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreator, setShowCreator] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [provinceId, setProvinceId] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [muniData, provData] = await Promise.all([
            window.electron.db.getMunicipalities(),
            window.electron.db.getProvinces()
        ]);
        setMunicipalities(muniData);
        setProvinces(provData);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError('O nome do município é obrigatório.');
            return;
        }
        if (!provinceId) {
            setError('A província é obrigatória.');
            return;
        }

        try {
            const isDuplicate = municipalities.some(m =>
                m.name.toLowerCase() === name.trim().toLowerCase() &&
                m.provinceId === provinceId &&
                m.id !== editingId
            );
            if (isDuplicate) {
                setError('Este município já existe nesta província.');
                return;
            }

            if (editingId) {
                await window.electron.db.updateMunicipality({ id: editingId, province_id: provinceId, name: name.trim() });
            } else {
                await window.electron.db.addMunicipality({ id: crypto.randomUUID(), province_id: provinceId, name: name.trim() });
            }
            setName('');
            setProvinceId('');
            setEditingId(null);
            setShowCreator(false);
            loadData();
        } catch (err: any) {
            setError(err.message.includes('UNIQUE') ? 'Este município já existe nesta província.' : err.message);
        }
    };

    const handleEdit = (muni: Municipality) => {
        setEditingId(muni.id);
        setName(muni.name);
        setProvinceId(muni.provinceId);
        setShowCreator(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Tem a certeza que deseja eliminar este município?')) {
            await window.electron.db.deleteMunicipality(id);
            loadData();
        }
    };

    const filteredMunicipalities = municipalities.filter(m => {
        const province = provinces.find(p => p.id === m.provinceId);
        return m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            province?.name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-slate-800">Municípios</h2>
                    <p className="text-sm text-slate-500 font-medium">Gestão de municípios por província</p>
                </div>
                <button
                    onClick={() => { setShowCreator(true); setEditingId(null); setName(''); setProvinceId(''); setError(null); }}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                >
                    <Plus size={20} />
                    Novo Município
                </button>
            </div>

            {showCreator && (
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm animate-in slide-in-from-top-4 duration-300">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Província</label>
                            <select
                                value={provinceId}
                                onChange={(e) => setProvinceId(e.target.value)}
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700 transition-all appearance-none"
                            >
                                <option value="">Seleccionar Província...</option>
                                {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Município</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700 transition-all"
                                placeholder="Ex: Talatona"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowCreator(false)}
                                className="flex-1 px-6 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-8 py-3.5 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
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
                            placeholder="Pesquisar município ou província..."
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
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Município</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Província</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acções</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredMunicipalities.map((m) => {
                                const province = provinces.find(p => p.id === m.provinceId);
                                return (
                                    <tr key={m.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                    <Building2 size={16} />
                                                </div>
                                                <p className="font-bold text-slate-800">{m.name}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <MapPin size={14} />
                                                <span className="text-sm font-bold">{province?.name || '---'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(m)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl transition-all shadow-sm"
                                                >
                                                    <Edit3 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(m.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-xl transition-all shadow-sm"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredMunicipalities.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-8 py-20 text-center text-slate-400 italic">Nenhum município encontrado.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Municipalities;
