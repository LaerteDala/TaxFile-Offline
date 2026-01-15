import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { DeadlineConfig } from '../types';

interface DeadlineConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
}

const DeadlineConfigModal: React.FC<DeadlineConfigModalProps> = ({ isOpen, onClose, onSave }) => {
    const [configs, setConfigs] = useState<DeadlineConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchConfigs();
        }
    }, [isOpen]);

    const fetchConfigs = async () => {
        setIsLoading(true);
        try {
            const data = await window.electron.db.getDeadlineConfigs();
            setConfigs(data);
        } catch (error) {
            console.error('Error fetching deadline configs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateDays = (id: string, days: number) => {
        setConfigs(prev => prev.map(c => c.id === id ? { ...c, days_before: days } : c));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            for (const config of configs) {
                await window.electron.db.updateDeadlineConfig(config);
            }
            onSave();
            onClose();
        } catch (error) {
            console.error('Error saving deadline configs:', error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    const getDocTypeName = (config: DeadlineConfig) => {
        if (config.document_type_name) return config.document_type_name;
        switch (config.document_type) {
            case 'invoice': return 'Facturas (Geral)';
            case 'contract': return 'Contratos';
            case 'general': return 'Documentos Gerais';
            default: return config.document_type;
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-slate-800">Configurar Alertas</h2>
                        <p className="text-sm text-slate-500 font-medium">Defina a antecedência das notificações</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto flex-1">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {configs.map((config) => (
                                <div key={config.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex-1 pr-4">
                                        <p className="font-bold text-slate-700 leading-tight">{getDocTypeName(config)}</p>
                                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider mt-1">Notificar antes de vencer</p>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <input
                                            type="number"
                                            value={config.days_before}
                                            onChange={(e) => handleUpdateDays(config.id, parseInt(e.target.value) || 0)}
                                            className="w-16 px-2 py-2 bg-white border border-slate-200 rounded-xl text-center font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                            min="0"
                                        />
                                        <span className="text-xs font-bold text-slate-500">dias</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="bg-blue-50 p-4 rounded-2xl flex gap-3 shrink-0">
                        <AlertCircle className="text-blue-500 shrink-0" size={20} />
                        <p className="text-xs text-blue-700 leading-relaxed font-medium">
                            Os documentos serão marcados com um sinal amarelo quando faltarem menos dias do que o configurado, e vermelho se já estiverem vencidos.
                        </p>
                    </div>
                </div>

                <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <Save size={20} />
                                Salvar
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeadlineConfigModal;
