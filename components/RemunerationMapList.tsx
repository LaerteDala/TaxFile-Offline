import React, { useState, useEffect } from 'react';
import {
    Table,
    Plus,
    FileText,
    Calendar,
    Search,
    Trash2,
    Edit2,
    CheckCircle,
    Clock,
    ArrowRight
} from 'lucide-react';
import { RemunerationMap } from '../types';

interface RemunerationMapListProps {
    onSelectMap: (mapId: string) => void;
    onCreate: () => void;
}

const RemunerationMapList: React.FC<RemunerationMapListProps> = ({ onSelectMap, onCreate }) => {
    const [maps, setMaps] = useState<RemunerationMap[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMaps();
    }, []);

    const loadMaps = async () => {
        try {
            const data = await window.electron.db.getRemunerationMaps();
            setMaps(data);
        } catch (error) {
            console.error('Error loading maps:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteMap = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Tem a certeza que deseja eliminar este mapa?')) {
            try {
                await window.electron.db.deleteRemunerationMap(id);
                await loadMaps();
            } catch (error) {
                console.error('Error deleting map:', error);
            }
        }
    };

    const getStatusColor = (status: string) => {
        return status === 'approved'
            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
            : 'bg-amber-100 text-amber-700 border-amber-200';
    };

    const getStatusLabel = (status: string) => {
        return status === 'approved' ? 'Aprovado' : 'Rascunho';
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-600/20">
                            <FileText size={24} />
                        </div>
                        Mapas de Remunerações
                    </h2>
                    <p className="text-sm text-slate-500 font-medium">Histórico de processamento salarial</p>
                </div>
                <button
                    onClick={onCreate}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 font-medium"
                >
                    <Plus size={20} />
                    Novo Mapa
                </button>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-8 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Período</th>
                                <th className="px-8 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Nº Mapa</th>
                                <th className="px-8 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                                <th className="px-8 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Data Criação</th>
                                <th className="px-8 py-5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {maps.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="p-4 bg-slate-50 rounded-full">
                                                <FileText size={32} className="text-slate-300" />
                                            </div>
                                            <p>Nenhum mapa de remunerações encontrado.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                maps.map((map) => (
                                    <tr
                                        key={map.id}
                                        onClick={() => onSelectMap(map.id)}
                                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                    <Calendar size={20} />
                                                </div>
                                                <span className="font-bold text-slate-700 text-lg">{map.period}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="font-mono text-slate-500">#{String(map.map_number).padStart(4, '0')}</span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(map.status)}`}>
                                                {map.status === 'approved' ? <CheckCircle size={12} /> : <Clock size={12} />}
                                                {getStatusLabel(map.status)}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-slate-500 text-sm">
                                            {new Date(map.created_at!).toLocaleDateString('pt-PT')}
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={(e) => handleDeleteMap(map.id, e)}
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                                <div className="p-2 text-slate-300 group-hover:text-blue-600 transition-colors">
                                                    <ArrowRight size={20} />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default RemunerationMapList;
