
import React from 'react';
import { PieChart, BarChart, FileText, Download } from 'lucide-react';

const CCReports: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400 animate-in fade-in duration-500">
            <div className="w-24 h-24 bg-slate-100 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner">
                <PieChart size={48} className="text-slate-300" />
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">Relatórios de Conta Corrente</h2>
            <p className="font-medium text-slate-500 max-w-md text-center">
                Estamos a preparar análises detalhadas da sua dívida fiscal, incluindo gráficos de evolução e resumos por imposto.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 w-full max-w-2xl">
                <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm flex flex-col items-center gap-3 opacity-50">
                    <BarChart size={24} />
                    <span className="text-xs font-black uppercase tracking-widest">Evolução Mensal</span>
                </div>
                <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm flex flex-col items-center gap-3 opacity-50">
                    <PieChart size={24} />
                    <span className="text-xs font-black uppercase tracking-widest">Peso por Imposto</span>
                </div>
                <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm flex flex-col items-center gap-3 opacity-50">
                    <FileText size={24} />
                    <span className="text-xs font-black uppercase tracking-widest">Resumo Anual</span>
                </div>
            </div>
        </div>
    );
};

export default CCReports;
