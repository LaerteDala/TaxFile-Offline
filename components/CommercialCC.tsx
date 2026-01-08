
import React from 'react';
import { CreditCard, Search, FileText } from 'lucide-react';

const CommercialCC: React.FC = () => {
    return (
        <div className="animate-in fade-in duration-500 space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-800">Conta Corrente Comercial</h2>
                    <p className="text-sm text-slate-500 font-medium">Controlo de saldos de clientes e fornecedores</p>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="p-6 bg-emerald-50 rounded-full">
                    <CreditCard size={48} className="text-emerald-600 opacity-20" />
                </div>
                <h3 className="text-xl font-black text-slate-800">Conta Corrente Comercial</h3>
                <p className="text-slate-500 max-w-md mx-auto">
                    Este módulo está em desenvolvimento. Aqui poderá acompanhar os saldos pendentes e liquidações comerciais.
                </p>
            </div>
        </div>
    );
};

export default CommercialCC;
