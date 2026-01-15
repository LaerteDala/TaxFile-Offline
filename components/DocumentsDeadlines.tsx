import React, { useState, useEffect } from 'react';
import {
    Clock,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Settings2,
    Search,
    Calendar,
    FileText,
    ChevronRight,
    ArrowUpRight
} from 'lucide-react';
import { DeadlineItem, View } from '../types';
import DeadlineConfigModal from './DeadlineConfigModal';

interface DocumentsDeadlinesProps {
    onNavigate: (view: View, id: string) => void;
}

const DocumentsDeadlines: React.FC<DocumentsDeadlinesProps> = ({
    onNavigate
}) => {
    const [deadlines, setDeadlines] = useState<DeadlineItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchDeadlines();
    }, []);

    const fetchDeadlines = async () => {
        setIsLoading(true);
        try {
            const data = await window.electron.db.getUpcomingDeadlines();
            setDeadlines(data);
        } catch (error) {
            console.error('Error fetching deadlines:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatus = (expiryDate: string, configDays: number) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = new Date(expiryDate);
        expiry.setHours(0, 0, 0, 0);

        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return 'expired';
        if (diffDays <= configDays) return 'upcoming';
        return 'ok';
    };

    const filteredDeadlines = deadlines.filter(d =>
        d.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.entity_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stats = {
        expired: deadlines.filter(d => getStatus(d.expiry_date, d.days_before_config) === 'expired').length,
        upcoming: deadlines.filter(d => getStatus(d.expiry_date, d.days_before_config) === 'upcoming').length,
        ok: deadlines.filter(d => getStatus(d.expiry_date, d.days_before_config) === 'ok').length
    };

    const getDocTypeLabel = (type: string) => {
        switch (type) {
            case 'invoice': return 'Factura (Geral)';
            case 'contract': return 'Contrato';
            case 'general': return 'Geral';
            default: return type;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Controlo de Prazos</h1>
                    <p className="text-slate-500 font-medium">Monitorização de vencimentos e validades</p>
                </div>
                <button
                    onClick={() => setIsConfigOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
                >
                    <Settings2 size={20} className="text-slate-400" />
                    Configurar Alertas
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6">
                    <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center shrink-0">
                        <XCircle className="text-red-500" size={28} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Vencidos</p>
                        <h3 className="text-3xl font-black text-slate-800">{stats.expired}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6">
                    <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center shrink-0">
                        <AlertTriangle className="text-amber-500" size={28} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Próximos</p>
                        <h3 className="text-3xl font-black text-slate-800">{stats.upcoming}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6">
                    <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0">
                        <CheckCircle2 className="text-emerald-500" size={28} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Em Dia</p>
                        <h3 className="text-3xl font-black text-slate-800">{stats.ok}</h3>
                    </div>
                </div>
            </div>

            {/* List Section */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Pesquisar documentos ou entidades..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Documento</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Entidade / Arquivo</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Tipo</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Vencimento</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-6 py-4">
                                            <div className="h-12 bg-slate-100 rounded-xl w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredDeadlines.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3 text-slate-400">
                                            <Clock size={48} className="opacity-20" />
                                            <p className="font-bold">Nenhum documento encontrado</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredDeadlines.map((item) => {
                                    const status = getStatus(item.expiry_date, item.days_before_config);
                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                                                        <FileText size={20} className="text-slate-400" />
                                                    </div>
                                                    <span className="font-bold text-slate-700">{item.description}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-bold text-slate-500">{item.entity_name}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-black uppercase tracking-wider">
                                                    {getDocTypeLabel(item.doc_type)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-slate-600 font-bold">
                                                    <Calendar size={16} className="text-slate-400" />
                                                    {new Date(item.expiry_date).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {status === 'expired' && (
                                                    <div className="flex items-center gap-1.5 text-red-600 font-black text-xs uppercase tracking-wider">
                                                        <XCircle size={14} />
                                                        Vencido
                                                    </div>
                                                )}
                                                {status === 'upcoming' && (
                                                    <div className="flex items-center gap-1.5 text-amber-600 font-black text-xs uppercase tracking-wider">
                                                        <AlertTriangle size={14} />
                                                        Próximo
                                                    </div>
                                                )}
                                                {status === 'ok' && (
                                                    <div className="flex items-center gap-1.5 text-emerald-600 font-black text-xs uppercase tracking-wider">
                                                        <CheckCircle2 size={14} />
                                                        Em Dia
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => onNavigate(item.doc_type === 'invoice' ? 'invoices' : 'documents_general', item.id)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <ArrowUpRight size={20} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <DeadlineConfigModal
                isOpen={isConfigOpen}
                onClose={() => setIsConfigOpen(false)}
                onSave={fetchDeadlines}
            />
        </div>
    );
};

export default DocumentsDeadlines;
