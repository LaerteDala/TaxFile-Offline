
import React from 'react';
import {
    BarChart3,
    PieChart,
    TrendingUp,
    Calendar,
    ArrowUpRight,
    FileText
} from 'lucide-react';
import { Invoice, WithholdingType } from '../types';

interface IRTReportsProps {
    invoices: Invoice[];
    withholdingTypes: WithholdingType[];
}

const IRTReports: React.FC<IRTReportsProps> = ({ invoices, withholdingTypes }) => {
    const irtGrupoBType = withholdingTypes.find(wt => wt.name === 'IRT Grupo B');

    // Simple summary by month for the current year
    const currentYear = new Date().getFullYear();
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
        const month = (i + 1).toString().padStart(2, '0');
        const monthInvoices = invoices.filter(inv => {
            const date = new Date(inv.date);
            return date.getFullYear() === currentYear && (date.getMonth() + 1).toString().padStart(2, '0') === month;
        });

        const totalIRT = monthInvoices.reduce((acc, inv) => {
            const irtLines = inv.lines.filter(l => l.withholdingTypeId === irtGrupoBType?.id);
            return acc + irtLines.reduce((sum, l) => sum + l.withholdingAmount, 0);
        }, 0);

        return { month, totalIRT };
    });

    const totalYearIRT = monthlyData.reduce((acc, d) => acc + d.totalIRT, 0);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-slate-800">Relatórios de IRT</h2>
                    <p className="text-sm text-slate-500 font-medium">Análise detalhada das retenções de IR. Trabalho</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <Calendar size={18} className="text-blue-600" />
                    <span className="text-sm font-bold text-slate-700">Ano Fiscal: {currentYear}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Monthly Summary Card */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                            <BarChart3 className="text-blue-600" size={20} />
                            Resumo Mensal ({currentYear})
                        </h3>
                    </div>
                    <div className="space-y-4">
                        {monthlyData.map((data, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <span className="text-[10px] font-black text-slate-400 uppercase w-12">
                                    {new Date(2000, i).toLocaleString('pt-AO', { month: 'short' })}
                                </span>
                                <div className="flex-1 h-2 bg-slate-50 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                                        style={{ width: `${totalYearIRT > 0 ? (data.totalIRT / totalYearIRT) * 100 : 0}%` }}
                                    />
                                </div>
                                <span className="text-xs font-bold text-slate-700 w-24 text-right">
                                    {data.totalIRT.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="space-y-6">
                    <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-blue-600/20">
                        <div className="flex items-center justify-between mb-4">
                            <TrendingUp size={24} className="text-white/60" />
                            <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Total Anual</span>
                        </div>
                        <h3 className="text-4xl font-black">{totalYearIRT.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}</h3>
                        <p className="text-sm text-white/80 mt-2 font-medium">Retenções IRT Grupo B em {currentYear}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Média Mensal</p>
                            <p className="text-xl font-black text-slate-800">{(totalYearIRT / 12).toLocaleString('pt-AO', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Maior Retenção</p>
                            <p className="text-xl font-black text-slate-800">{Math.max(...monthlyData.map(d => d.totalIRT)).toLocaleString('pt-AO', { minimumFractionDigits: 2 })}</p>
                        </div>
                    </div>

                    <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-white/10 rounded-2xl">
                                <PieChart size={24} className="text-blue-400" />
                            </div>
                            <div>
                                <h4 className="font-black">Distribuição de IRT</h4>
                                <p className="text-xs text-slate-400 font-medium">Análise por categoria</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                                <span className="text-sm font-bold">Grupo B (Serviços)</span>
                                <span className="text-sm font-black text-blue-400">100%</span>
                            </div>
                            <p className="text-[10px] text-slate-500 italic text-center">Outros grupos de IRT serão adicionados em breve.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IRTReports;
