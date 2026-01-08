
import React from 'react';
import { ShoppingCart, Plus, Search } from 'lucide-react';

const Purchases: React.FC = () => {
    return (
        <div className="animate-in fade-in duration-500 space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-800">Compras</h2>
                    <p className="text-sm text-slate-500 font-medium">Gestão de compras e despesas a fornecedores</p>
                </div>
                <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-3.5 rounded-2xl font-black transition-all shadow-xl shadow-slate-900/10 active:scale-95">
                    <Plus size={20} />
                    <span>Nova Compra</span>
                </button>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="p-6 bg-slate-50 rounded-full">
                    <ShoppingCart size={48} className="text-slate-400 opacity-20" />
                </div>
                <h3 className="text-xl font-black text-slate-800">Módulo de Compras</h3>
                <p className="text-slate-500 max-w-md mx-auto">
                    Este módulo está em desenvolvimento. Em breve poderá gerir todas as suas compras e despesas aqui.
                </p>
            </div>
        </div>
    );
};

export default Purchases;
