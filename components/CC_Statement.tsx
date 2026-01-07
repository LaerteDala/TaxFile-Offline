
import React, { useState } from 'react';
import {
    TrendingDown,
    TrendingUp,
    Wallet,
    Filter,
    Download,
    Calendar,
    ArrowUpRight,
    ArrowDownLeft,
    Search,
    FileText,
    Eye
} from 'lucide-react';
import { CCDocument } from '../types';

interface CCStatementProps {
    documents: CCDocument[];
    onViewDocument: (doc: CCDocument, isViewing: boolean) => void;
}

const CCStatement: React.FC<CCStatementProps> = ({ documents, onViewDocument }) => {
    const [filterYear, setFilterYear] = useState<number | 'all'>('all');
    const [filterTax, setFilterTax] = useState<string>('all');
    const [filterPeriod, setFilterPeriod] = useState<string>('all');
    const [filterTaxType, setFilterTaxType] = useState<string>('all');
    const [filterDate, setFilterDate] = useState<string>('');

    // Filter documents for the statement (only Liquidação and Pagamento)
    const statementDocs = documents
        .filter(doc => doc.type !== 'RECIBO')
        .filter(doc => filterYear === 'all' || doc.year === filterYear)
        .filter(doc => filterTax === 'all' || doc.relatedTax === filterTax)
        .filter(doc => filterPeriod === 'all' || doc.period === filterPeriod)
        .filter(doc => filterTaxType === 'all' || doc.taxType === filterTaxType)
        .filter(doc => !filterDate || doc.issueDate === filterDate)
        .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());

    // Calculations
    const totalPendente = documents
        .filter(d => d.nature === 'PENDENTE')
        .reduce((acc: number, curr: CCDocument) => acc + curr.totalAmount, 0);

    const totalLiquidado = documents
        .filter(d => d.nature === 'LIQUIDACAO')
        .reduce((acc: number, curr: CCDocument) => acc + curr.totalAmount, 0);

    const balance = totalPendente - totalLiquidado;

    const years = Array.from(new Set(documents.map(d => d.year))).sort((a: number, b: number) => b - a);
    const taxes = Array.from(new Set(documents.map(d => d.relatedTax))).sort();
    const periods = Array.from(new Set(documents.map(d => d.period))).filter(Boolean).sort();
    const taxTypes = Array.from(new Set(documents.map(d => d.taxType))).filter(Boolean).sort();

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-red-50 text-red-600 rounded-2xl group-hover:scale-110 transition-transform">
                            <TrendingUp size={24} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Pendente</span>
                    </div>
                    <h3 className="text-3xl font-black text-slate-800">{totalPendente.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}</h3>
                    <p className="text-xs text-slate-500 mt-2 font-medium">Dívida fiscal acumulada</p>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
                            <TrendingDown size={24} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Liquidado</span>
                    </div>
                    <h3 className="text-3xl font-black text-slate-800">{totalLiquidado.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}</h3>
                    <p className="text-xs text-slate-500 mt-2 font-medium">Pagamentos efectuados</p>
                </div>

                <div className={`p-8 rounded-[2.5rem] border shadow-lg transition-all group ${balance > 0 ? 'bg-blue-600 border-blue-500 text-white shadow-blue-600/20' : 'bg-emerald-600 border-emerald-500 text-white shadow-emerald-600/20'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 text-white rounded-2xl group-hover:scale-110 transition-transform">
                            <Wallet size={24} />
                        </div>
                        <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Saldo Actual</span>
                    </div>
                    <h3 className="text-3xl font-black">{balance.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}</h3>
                    <p className="text-xs text-white/80 mt-2 font-medium">{balance > 0 ? 'Valor em dívida' : 'Conta regularizada'}</p>
                </div>
            </div>

            {/* Filters & Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex flex-wrap items-center gap-4 w-full">
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
                            <Search size={16} className="text-slate-400" />
                            <select
                                value={filterTax}
                                onChange={(e) => setFilterTax(e.target.value)}
                                className="bg-transparent text-sm font-bold text-slate-600 outline-none"
                            >
                                <option value="all">Todos os Impostos</option>
                                {taxes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200">
                            <Calendar size={16} className="text-slate-400" />
                            <select
                                value={filterPeriod}
                                onChange={(e) => setFilterPeriod(e.target.value)}
                                className="bg-transparent text-sm font-bold text-slate-600 outline-none"
                            >
                                <option value="all">Todos os Períodos</option>
                                {periods.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200">
                            <Filter size={16} className="text-slate-400" />
                            <select
                                value={filterTaxType}
                                onChange={(e) => setFilterTaxType(e.target.value)}
                                className="bg-transparent text-sm font-bold text-slate-600 outline-none"
                            >
                                <option value="all">Todos os Tipos</option>
                                {taxTypes.map(tt => <option key={tt} value={tt}>{tt}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200">
                            <Calendar size={16} className="text-slate-400" />
                            <input
                                type="date"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                className="bg-transparent text-sm font-bold text-slate-600 outline-none"
                            />
                        </div>
                    </div>
                    <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95">
                        <Download size={20} />
                        Exportar Extracto
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Documento</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Débito</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Crédito</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Saldo</th>
                                <th className="px-8 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {statementDocs.map((doc, index) => {
                                // Calculate running balance (simplified for display)
                                const runningBalance = statementDocs
                                    .slice(index)
                                    .reduce((acc: number, d: CCDocument) => acc + (d.nature === 'PENDENTE' ? d.totalAmount : -d.totalAmount), 0);

                                return (
                                    <tr key={doc.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${doc.type === 'LIQUIDACAO' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                    {doc.type === 'LIQUIDACAO' ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">{new Date(doc.issueDate).toLocaleDateString()}</p>
                                                    <p className="text-[10px] text-slate-500 font-medium uppercase">{doc.period}/{doc.year}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-sm font-bold text-slate-700">{doc.referenceNumber}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{doc.type}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-sm font-medium text-slate-600 max-w-xs truncate">{doc.description}</p>
                                            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">{doc.relatedTax}</span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            {doc.nature === 'PENDENTE' ? (
                                                <span className="text-sm font-black text-red-600">{doc.totalAmount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}</span>
                                            ) : '-'}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            {doc.nature === 'LIQUIDACAO' ? (
                                                <span className="text-sm font-black text-emerald-600">{doc.totalAmount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}</span>
                                            ) : '-'}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className="text-sm font-black text-slate-900">{runningBalance.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => onViewDocument(doc, true)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl transition-all shadow-sm"
                                                    title="Visualizar"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    onClick={() => onViewDocument(doc, false)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl transition-all shadow-sm"
                                                    title="Editar"
                                                >
                                                    <FileText size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {statementDocs.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-8 py-20 text-center text-slate-400 italic">Nenhum movimento registado no extracto.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CCStatement;
