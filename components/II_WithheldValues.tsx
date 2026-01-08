import React, { useState, useMemo } from 'react';
import { Coins, Search, FileText, Calendar, Filter, ArrowUpRight } from 'lucide-react';
import { Invoice, Client, WithholdingType } from '../types';

interface IIWithheldValuesProps {
    invoices: Invoice[];
    clients: Client[];
    withholdingTypes: WithholdingType[];
}

const IIWithheldValues: React.FC<IIWithheldValuesProps> = ({ invoices, clients, withholdingTypes }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const iiType = withholdingTypes.find(wt => wt.name === 'Imposto Industrial');

    const filteredData = useMemo(() => {
        return invoices.filter(inv => {
            if (inv.type !== 'SALE') return false;
            if (!iiType) return false;

            const hasIIWithholding = inv.lines.some(l => l.withholdingTypeId === iiType.id);
            if (!hasIIWithholding) return false;

            const client = clients.find(c => c.id === inv.clientId);
            const docNum = (inv.documentNumber || "").toLowerCase();
            const clientName = (client?.name || "").toLowerCase();
            const term = searchTerm.toLowerCase();

            const matchesSearch = docNum.includes(term) || clientName.includes(term);
            const matchesDate = (!startDate || inv.date >= startDate) && (!endDate || inv.date <= endDate);

            return matchesSearch && matchesDate;
        }).map(inv => {
            const client = clients.find(c => c.id === inv.clientId);
            const iiWithholding = inv.lines
                .filter(l => l.withholdingTypeId === iiType?.id)
                .reduce((sum, l) => sum + l.withholdingAmount, 0);

            return {
                ...inv,
                clientName: client?.name || 'N/A',
                nif: client?.nif || '---',
                iiAmount: iiWithholding
            };
        });
    }, [invoices, clients, searchTerm, startDate, endDate, iiType]);

    const totalWithheld = useMemo(() => {
        return filteredData.reduce((sum, item) => sum + item.iiAmount, 0);
    }, [filteredData]);

    return (
        <div className="animate-in fade-in duration-500 space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-800">Valores Retidos - Imposto Industrial</h2>
                    <p className="text-sm text-slate-500 font-medium">Consulta de valores de II retidos na fonte por clientes</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 px-6 py-3 rounded-2xl shadow-lg shadow-blue-600/20">
                        <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest">Total Retido (II)</p>
                        <p className="text-xl font-black text-white">{totalWithheld.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-2 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center px-6">
                    <Search className="text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Pesquisar por cliente ou documento..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-4 bg-transparent border-none focus:ring-0 font-bold text-slate-700 placeholder:text-slate-400"
                    />
                </div>
                <div className="bg-white p-2 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center px-6 gap-4">
                    <Calendar className="text-blue-600" size={20} />
                    <div className="flex items-center gap-2 flex-1">
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent border-none focus:ring-0 font-bold text-slate-700 text-xs flex-1" />
                        <span className="text-slate-300 font-black">/</span>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent border-none focus:ring-0 font-bold text-slate-700 text-xs flex-1" />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Data</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Documento</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valor Retido</th>
                                <th className="px-8 py-5 w-20"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredData.map((row) => (
                                <tr key={row.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="px-8 py-5">
                                        <p className="font-bold text-slate-800">{row.clientName}</p>
                                        <p className="text-[10px] font-medium text-slate-500">NIF: {row.nif}</p>
                                    </td>
                                    <td className="px-8 py-5 text-center text-xs font-bold text-slate-600">{row.date}</td>
                                    <td className="px-8 py-5 text-center">
                                        <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-mono font-black text-slate-500 uppercase">{row.documentNumber}</span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <span className="text-sm font-black text-blue-600">{row.iiAmount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}</span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button className="p-2 text-slate-300 hover:text-blue-600 transition-colors">
                                            <ArrowUpRight size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredData.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-20">
                                            <FileText size={48} />
                                            <p className="font-black uppercase tracking-widest text-xs">Nenhum valor retido encontrado</p>
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

export default IIWithheldValues;
