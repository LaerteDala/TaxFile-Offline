
import React from 'react';
import { TrendingUp, Wallet, Receipt, CreditCard, FileText, ShieldCheck } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Invoice, Supplier } from '../types';

interface DashboardProps {
  invoices: Invoice[];
  suppliers: Supplier[];
  onViewInquiry: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ invoices, suppliers, onViewInquiry }) => {
  const totalExpenses = invoices.reduce((acc, inv) => acc + inv.totalDocument, 0);
  const totalVATSupported = invoices.reduce((acc, inv) => acc + inv.totalSupported, 0);
  const totalVATDeductible = invoices.reduce((acc, inv) => acc + inv.totalDeductible, 0);
  const totalWithholding = invoices.reduce((acc, inv) => acc + (inv.totalWithholding || 0), 0);

  const stats = [
    { title: 'Total Despesas', value: `${totalExpenses.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA`, icon: Wallet, color: 'blue' },
    { title: 'IVA Dedutível', value: `${totalVATDeductible.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA`, icon: TrendingUp, color: 'emerald' },
    { title: 'Retenção Fonte', value: `${totalWithholding.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA`, icon: ShieldCheck, color: 'amber' },
    { title: 'Fornecedores', value: suppliers.length.toString(), icon: CreditCard, color: 'slate' },
  ];

  const chartData = [
    { name: 'Jan', value: 4000 },
    { name: 'Fev', value: 3000 },
    { name: 'Mar', value: 2000 },
    { name: 'Abr', value: 2780 },
    { name: 'Mai', value: 1890 },
    { name: 'Jun', value: 2390 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.title} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-xl ${stat.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                  stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                    stat.color === 'amber' ? 'bg-amber-50 text-amber-600' :
                      'bg-slate-50 text-slate-600'
                }`}>
                <stat.icon size={24} />
              </div>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+12%</span>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.title}</p>
              <h3 className="text-xl font-black text-slate-800 mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Activity Chart */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm min-h-[400px]">
          <h3 className="text-lg font-semibold mb-6">Volume de Despesas Mensais</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  cursor={{ stroke: '#2563eb', strokeWidth: 2 }}
                  formatter={(value: any) => [`${value.toLocaleString('pt-AO')} AOA`, 'Valor']}
                />
                <Area type="monotone" dataKey="value" stroke="#2563eb" fillOpacity={1} fill="url(#colorValue)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Últimas Facturas</h3>
            <button
              onClick={onViewInquiry}
              className="text-blue-600 text-sm font-medium hover:underline px-4 py-2 bg-blue-50/50 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100"
            >
              Ver todas
            </button>
          </div>
          <div className="space-y-4">
            {invoices.length > 0 ? (
              invoices.slice(0, 5).map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <FileText size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">#{invoice.documentNumber}</p>
                      <p className="text-xs text-slate-500">Ord. {invoice.orderNumber} • {invoice.date}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-slate-800">{invoice.totalDocument.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA</p>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Receipt size={48} className="mb-4 opacity-20" />
                <p>Nenhuma factura registada ainda.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
