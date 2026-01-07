
import React, { useState, useMemo } from 'react';
import {
    Search,
    Filter,
    Download,
    Calendar,
    ArrowUpRight,
    FileText,
    Eye,
    TrendingUp
} from 'lucide-react';
import { Invoice, WithholdingType, Supplier } from '../types';

interface IIWithholdingMapProps {
    invoices: Invoice[];
    suppliers: Supplier[];
    withholdingTypes: WithholdingType[];
    onViewInvoice: (invoice: Invoice) => void;
}

const IIWithholdingMap: React.FC<IIWithholdingMapProps> = ({ invoices, suppliers, withholdingTypes, onViewInvoice }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterYear, setFilterYear] = useState<number | 'all'>('all');
    const [filterMonth, setFilterMonth] = useState<string | 'all'>('all');

    const iiType = withholdingTypes.find(wt => wt.name === 'Imposto Industrial');

    const iiInvoices = useMemo(() => {
        if (!iiType) return [];

        return invoices.filter(inv => {
            const hasII = inv.lines.some(line => line.withholdingTypeId === iiType.id);
            if (!hasII) return false;

            const supplier = suppliers.find(s => s.id === inv.supplierId);
            const matchesSearch =
                inv.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                supplier?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                supplier?.nif.toLowerCase().includes(searchTerm.toLowerCase());

            const invDate = new Date(inv.date);
            const matchesYear = filterYear === 'all' || invDate.getFullYear() === filterYear;
            const matchesMonth = filterMonth === 'all' || (invDate.getMonth() + 1).toString().padStart(2, '0') === filterMonth;

            return matchesSearch && matchesYear && matchesMonth;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [invoices, suppliers, withholdingTypes, searchTerm, filterYear, filterMonth, iiType]);

    const totalWithholding = iiInvoices.reduce((acc: number, inv) => {
        const iiLines = inv.lines.filter(l => l.withholdingTypeId === iiType?.id);
        return acc + iiLines.reduce((sum: number, l) => sum + l.withholdingAmount, 0);
    }, 0);

    const years = Array.from(new Set(invoices.map(inv => new Date(inv.date).getFullYear()))).sort((a: number, b: number) => b - a);
    const months = [
        { value: '01', label: 'Janeiro' },
        { value: '02', label: 'Fevereiro' },
        { value: '03', label: 'Março' },
        { value: '04', label: 'Abril' },
        { value: '05', label: 'Maio' },
        { value: '06', label: 'Junho' },
        { value: '07', label: 'Julho' },
        { value: '08', label: 'Agosto' },
        { value: '09', label: 'Setembro' },
        { value: '10', label: 'Outubro' },
        { value: '11', label: 'Novembro' },
        { value: '12', label: 'Dezembro' }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform">
                            <TrendingUp size={24} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Retido (I. Industrial)</span>
                    </div>
                    <h3 className="text-3xl font-black text-slate-800">{totalWithholding.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}</h3>
                    <p className="text-xs text-slate-500 mt-2 font-medium">Acumulado conforme filtros</p>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-slate-50 text-slate-600 rounded-2xl group-hover:scale-110 transition-transform">
                            <FileText size={24} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Documentos</span>
                    </div>
                    <h3 className="text-3xl font-black text-slate-800">{iiInvoices.length}</h3>
                    <p className="text-xs text-slate-500 mt-2 font-medium">Facturas com retenção I. Industrial</p>
                </div>

                <div className="bg-amber-600 p-8 rounded-[2.5rem] border border-amber-500 text-white shadow-lg shadow-amber-600/20 group transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 text-white rounded-2xl group-hover:scale-110 transition-transform">
                            <Calendar size={24} />
                        </div>
                        <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Taxa Padrão</span>
                    </div>
                    <h3 className="text-3xl font-black">{iiType?.rate || 6.5}%</h3>
                    <p className="text-xs text-white/80 mt-2 font-medium">Imposto Industrial (Serviços)</p>
                </div>
            </div>

            {/* Filters & Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex flex-col lg:flex-row items-center justify-between gap-6">
                    <div className="flex flex-wrap items-center gap-4 w-full">
                        <div className="relative flex-1 min-w-[300px]">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Pesquisar por factura, fornecedor ou NIF..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none text-sm font-bold text-slate-600"
                            />
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200">
                            <Filter size={16} className="text-slate-400" />
                            <select
                                value={filterYear}
                                onChange={(e) => setFilterYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                                className="bg-transparent text-sm font-bold text-slate-600 outline-none"
                            >
                                <option value="all">Todos os Anos</option>
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200">
                            <Calendar size={16} className="text-slate-400" />
                            <select
                                value={filterMonth}
                                onChange={(e) => setFilterMonth(e.target.value)}
                                className="bg-transparent text-sm font-bold text-slate-600 outline-none"
                            >
                                <option value="all">Todos os Meses</option>
                                {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                        </div>
                    </div>
                    <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95 whitespace-nowrap">
                        <Download size={20} />
                        Exportar Mapa
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Factura</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fornecedor</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Base Tributável</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Taxa</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Retenção</th>
                                <th className="px-8 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {iiInvoices.map((inv) => {
                                const supplier = suppliers.find(s => s.id === inv.supplierId);
                                const iiLines = inv.lines.filter(l => l.withholdingTypeId === iiType?.id);
                                const baseValue = iiLines.reduce((sum, l) => sum + l.taxableValue, 0);
                                const withholdingValue = iiLines.reduce((sum, l) => sum + l.withholdingAmount, 0);

                                return (
                                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <p className="text-sm font-bold text-slate-800">{new Date(inv.date).toLocaleDateString()}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-sm font-bold text-slate-700">{inv.documentNumber}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-sm font-bold text-slate-800">{supplier?.name}</p>
                                            <p className="text-[10px] text-slate-500 font-medium">NIF: {supplier?.nif}</p>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className="text-sm font-black text-slate-600">{baseValue.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}</span>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded text-[10px] font-black uppercase">
                                                {iiType?.rate}%
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className="text-sm font-black text-amber-600">{withholdingValue.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => onViewInvoice(inv)}
                                                    className="p-2 text-slate-400 hover:text-amber-600 hover:bg-white rounded-xl transition-all shadow-sm"
                                                    title="Visualizar Factura"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {iiInvoices.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-8 py-20 text-center text-slate-400 italic">Nenhuma retenção de Imposto Industrial encontrada.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default IIWithholdingMap;
