
import React from 'react';
import { ShoppingBag, Plus, Search } from 'lucide-react';

const Sales: React.FC = () => {
    return (
        <div className="animate-in fade-in duration-500 space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-800">Vendas</h2>
                    <p className="text-sm text-slate-500 font-medium">Gestão de facturação e vendas a clientes</p>
                </div>
                <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-black transition-all shadow-xl shadow-blue-600/20 active:scale-95">
                    <Plus size={20} />
                    <span>Nova Venda</span>
                </button>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="p-6 bg-blue-50 rounded-full">
                    <ShoppingBag size={48} className="text-blue-600 opacity-20" />
                </div>
                <h3 className="text-xl font-black text-slate-800">Módulo de Vendas</h3>
                <p className="text-slate-500 max-w-md mx-auto">
                    Este módulo está em desenvolvimento. Em breve poderá gerir todas as suas vendas e facturação aqui.
                </p>
            </div>
        </div>
    );
};

export default Sales;
