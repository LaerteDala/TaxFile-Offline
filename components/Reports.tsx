
import React, { useState, useMemo } from 'react';
import {
  Download,
  Search,
  Eye,
  FileSpreadsheet,
  ChevronLeft,
  Calendar,
  Filter,
  ArrowUpRight,
  Printer
} from 'lucide-react';
import { Invoice, Supplier, DocumentType } from '../types';

interface ReportsProps {
  invoices: Invoice[];
  suppliers: Supplier[];
  documentTypes: DocumentType[];
}

const Reports: React.FC<ReportsProps> = ({ invoices, suppliers, documentTypes }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');

  // Filtering Logic
  const filteredData = useMemo(() => {
    return invoices.filter(inv => {
      const supplier = suppliers.find(s => s.id === inv.supplierId);
      const docNum = (inv.documentNumber || "").toLowerCase();
      const supName = (supplier?.name || "").toLowerCase();
      const term = searchTerm.toLowerCase();

      const matchesSearch = docNum.includes(term) || supName.includes(term);

      const matchesDate =
        (!startDate || inv.date >= startDate) &&
        (!endDate || inv.date <= endDate);

      const matchesSupplier = !filterSupplier || inv.supplierId === filterSupplier;

      return matchesSearch && matchesDate && matchesSupplier;
    }).map(inv => {
      const supplier = suppliers.find(s => s.id === inv.supplierId);
      const docType = documentTypes.find(dt => dt.id === inv.documentTypeId);
      return {
        ...inv,
        supplierName: supplier?.name || 'N/A',
        nif: supplier?.nif || 'N/A',
        documentTypeCode: docType?.code || '---'
      };
    });
  }, [invoices, suppliers, documentTypes, searchTerm, startDate, endDate, filterSupplier]);

  // Totals for the filtered set
  const filteredTotals = useMemo(() => {
    return filteredData.reduce((acc, row) => ({
      taxable: acc.taxable + row.totalTaxable,
      supported: acc.supported + row.totalSupported,
      deductible: acc.deductible + row.totalDeductible,
      withholding: acc.withholding + row.totalWithholding,
      total: acc.total + row.totalDocument
    }), { taxable: 0, supported: 0, deductible: 0, withholding: 0, total: 0 });
  }, [filteredData]);

  // Function to export data to CSV (Excel compatible)
  const exportToExcel = () => {
    if (filteredData.length === 0) return;

    const headers = ["Nº Ordem", "Tipo", "Fornecedor", "NIF", "Data", "Doc#", "Total Documento", "Total Tributável", "Total Suportado", "Total Dedutível", "Retenção", "Notas"];

    const rows = filteredData.map(row => [
      row.orderNumber,
      `"${row.documentTypeCode}"`,
      `"${row.supplierName}"`,
      `"${row.nif}"`,
      row.date,
      `"${row.documentNumber}"`,
      row.totalDocument.toFixed(2).replace('.', ','),
      row.totalTaxable.toFixed(2).replace('.', ','),
      row.totalSupported.toFixed(2).replace('.', ','),
      row.totalDeductible.toFixed(2).replace('.', ','),
      row.totalWithholding.toFixed(2).replace('.', ','),
      `"${(row.notes || "").replace(/\n/g, ' ')}"`
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map(e => e.join(";"))
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Consolidacao_IVA_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (showPreview) {
    return (
      <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
        {/* Preview Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowPreview(false)}
              className="p-2 hover:bg-white rounded-xl text-slate-500 border border-transparent hover:border-slate-200 transition-all shadow-sm"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h2 className="text-2xl font-black text-slate-800">Consolidação de IVA</h2>
              <p className="text-sm text-slate-500 font-medium">Visualização interactiva dos dados filtrados</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all shadow-sm"
            >
              <Printer size={18} />
              Imprimir
            </button>
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
            >
              <Download size={18} />
              Exportar Excel
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[280px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Pesquisar por Doc# ou Fornecedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all text-slate-900"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                />
              </div>
              <span className="text-slate-400 font-bold">até</span>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                />
              </div>
            </div>

            <select
              value={filterSupplier}
              onChange={(e) => setFilterSupplier(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
            >
              <option value="">Todos Fornecedores</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl shadow-slate-900/10 border border-slate-800">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Base Tributável</p>
            <p className="text-xl font-bold">{filteredTotals.taxable.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">IVA Suportado</p>
            <p className="text-xl font-bold text-slate-800">{filteredTotals.supported.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">IVA Dedutível</p>
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold text-emerald-600">{filteredTotals.deductible.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA</p>
              <ArrowUpRight size={16} className="text-emerald-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Retenção</p>
            <p className="text-xl font-bold text-amber-600">{filteredTotals.withholding.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA</p>
          </div>
          <div className="bg-blue-600 p-6 rounded-3xl text-white shadow-xl shadow-blue-600/20">
            <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">Total Consolidado</p>
            <p className="text-xl font-black">{filteredTotals.total.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA</p>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ord</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fornecedor</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Data</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Documento</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Dedutível</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Retenção</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-slate-400 group-hover:text-blue-500 transition-colors">#{row.orderNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[10px] font-black font-mono">{row.documentTypeCode}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-800">{row.supplierName}</p>
                      <p className="text-[10px] font-medium text-slate-500">NIF: {row.nif}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-xs font-semibold text-slate-600">{row.date}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-mono font-black text-slate-500">{row.documentNumber}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-emerald-600">{row.totalDeductible.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-amber-600">{row.totalWithholding.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-black text-slate-900">{row.totalDocument.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}</span>
                    </td>
                  </tr>
                ))}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <Filter size={64} className="mb-4 opacity-10" />
                        <p className="text-lg font-medium">Nenhum dado com os filtros aplicados</p>
                        <p className="text-sm">Tente ajustar os filtros de pesquisa ou data.</p>
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
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="bg-white p-16 rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-200/20 flex flex-col items-center text-center max-w-3xl mx-auto">
        <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mb-10 shadow-inner">
          <FileSpreadsheet size={48} />
        </div>
        <h2 className="text-4xl font-black text-slate-800 mb-6 tracking-tight">Exportação e Relatórios</h2>
        <p className="text-slate-500 mb-12 leading-relaxed text-lg max-w-xl">
          Gere um relatório detalhado de todas as facturas registadas.
          Poderá filtrar os dados antes da exportação para garantir a precisão da submissão.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full">
          <button
            onClick={() => setShowPreview(true)}
            className="group flex flex-col items-center justify-center gap-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black p-8 rounded-[2rem] transition-all border-2 border-transparent hover:border-slate-300"
          >
            <div className="p-3 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
              <Eye size={24} className="text-slate-600" />
            </div>
            <span>Visualizar Dados</span>
          </button>
          <button
            onClick={exportToExcel}
            className="group flex flex-col items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-black p-8 rounded-[2rem] transition-all shadow-2xl shadow-blue-600/30 active:scale-95"
          >
            <div className="p-3 bg-blue-500 rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
              <Download size={24} />
            </div>
            <span>Exportar Excel</span>
          </button>
        </div>

        <div className="mt-12 flex items-center gap-6 py-4 px-8 bg-slate-50 rounded-full border border-slate-100">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Total de Registos</span>
            <span className="text-sm font-bold text-slate-700">{invoices.length} Facturas</span>
          </div>
          <div className="w-px h-8 bg-slate-200"></div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">IVA Total Dedutível</span>
            <span className="text-sm font-bold text-emerald-600">
              {invoices.reduce((acc, inv) => acc + inv.totalDeductible, 0).toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
