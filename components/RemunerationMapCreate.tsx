import React, { useState } from 'react';
import { ArrowLeft, Save, Calendar, FileText } from 'lucide-react';

interface RemunerationMapCreateProps {
    onBack: () => void;
    onSave: (mapId: string) => void;
}

const RemunerationMapCreate: React.FC<RemunerationMapCreateProps> = ({ onBack, onSave }) => {
    const [period, setPeriod] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Fetch existing maps to determine the next map number
            const existingMaps = await window.electron.db.getRemunerationMaps();

            const newMap = {
                id: crypto.randomUUID(),
                map_number: existingMaps.length + 1,
                period: period,
                status: 'draft'
            };

            await window.electron.db.addRemunerationMap(newMap);
            onSave(newMap.id);
        } catch (error) {
            console.error('Error creating map:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in slide-in-from-right duration-500">
            <div className="flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors shadow-sm"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Novo Mapa de Remunerações</h2>
                    <p className="text-sm text-slate-500 font-medium">Criar um novo período de processamento salarial</p>
                </div>
            </div>

            <div className="max-w-2xl">
                <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 p-8 space-y-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-slate-800 border-b border-slate-100 pb-4">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <FileText size={24} />
                            </div>
                            <h3 className="text-lg font-bold">Detalhes do Mapa</h3>
                        </div>

                        <div className="grid gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <Calendar size={16} className="text-slate-400" />
                                    Período (AAAA-MM)
                                </label>
                                <input
                                    type="month"
                                    required
                                    value={period}
                                    onChange={(e) => setPeriod(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium transition-all"
                                />
                                <p className="text-xs text-slate-400 font-medium">
                                    Selecione o mês e ano para este processamento salarial.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onBack}
                            className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save size={20} />
                            {loading ? 'A Criar...' : 'Criar Mapa'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RemunerationMapCreate;
