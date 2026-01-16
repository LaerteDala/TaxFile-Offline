
import React, { useState, useMemo } from 'react';
import {
    Download,
    Search,
    FileSpreadsheet,
    Calendar,
    Filter,
    ArrowUpRight,
    Printer,
    Building2,
    TrendingUp,
    TrendingDown,
    PieChart,
    BarChart3,
    ArrowDownRight
} from 'lucide-react';
import { Invoice, Supplier, Client, DocumentType, WithholdingType, IVAClassification } from '../types';

interface TaxIVAProps {
    invoices: Invoice[];
    suppliers: Supplier[];
    clients: Client[];
    documentTypes: DocumentType[];
    withholdingTypes: WithholdingType[];
    ivaClassifications: IVAClassification[];
}

const TaxIVA: React.FC<TaxIVAProps> = ({ invoices, suppliers, clients, documentTypes, withholdingTypes, ivaClassifications }) => {
    const [activeTab, setActiveTab] = useState<'sales' | 'purchases'>('sales');
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [filterEntity, setFilterEntity] = useState('');

    // Filter Data based on Tab and Search
    const filteredData = useMemo(() => {
        return invoices.filter(inv => {
            // Tab Filter
            if (activeTab === 'sales' && inv.type !== 'SALE') return false;
            if (activeTab === 'purchases' && inv.type !== 'PURCHASE') return false;

            const supplier = suppliers.find(s => s.id === inv.supplierId);
            const client = clients.find(c => c.id === inv.clientId);
            const docNum = (inv.documentNumber || "").toLowerCase();
            const entityName = inv.type === 'PURCHASE' ? (supplier?.name || "").toLowerCase() : (client?.name || "").toLowerCase();
            const term = searchTerm.toLowerCase();

            const matchesSearch = docNum.includes(term) || entityName.includes(term);

            const matchesDate =
                (!startDate || inv.date >= startDate) &&
                (!endDate || inv.date <= endDate);

            const matchesEntity = !filterEntity || inv.supplierId === filterEntity || inv.clientId === filterEntity;

            return matchesSearch && matchesDate && matchesEntity;
        }).map(inv => {
            const supplier = suppliers.find(s => s.id === inv.supplierId);
            const client = clients.find(c => c.id === inv.clientId);
            const docType = documentTypes.find(dt => dt.id === inv.documentTypeId);
            return {
                ...inv,
                entityName: inv.type === 'PURCHASE' ? (supplier?.name || 'N/A') : (client?.name || 'N/A'),
                nif: inv.type === 'PURCHASE' ? (supplier?.nif || '---') : (client?.nif || '---'),
                docTypeCode: docType?.code || '---'
            };
        });
    }, [invoices, suppliers, clients, searchTerm, startDate, endDate, filterEntity, documentTypes, activeTab]);

    // Group by Classification
    const classificationMap = useMemo(() => {
        const map = new Map<string, {
            code: string;
            description: string;
            taxable: number;
            tax: number;
            count: number;
        }>();

        filteredData.forEach(inv => {
            inv.lines.forEach(line => {
                // If line has no classification, group as "Sem Classificação"
                const classId = line.ivaClassificationId || 'uncategorized';
                const classification = ivaClassifications.find(c => c.id === classId);

                // For Purchases: Tax is Supported (or Deductible? Usually we analyze Deductible for recovery)
                // Let's show Supported for now as "Input VAT"
                const taxValue = activeTab === 'purchases' ? line.supportedVat : line.liquidatedVat;

                if (!map.has(classId)) {
                    map.set(classId, {
                        code: classification?.code || 'S/C',
                        description: classification?.description || 'Sem Classificação',
                        taxable: 0,
                        tax: 0,
                        count: 0
                    });
                }

                const entry = map.get(classId)!;
                entry.taxable += line.taxableValue;
                entry.tax += taxValue;
                entry.count += 1;
            });
        });

        return Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code));
    }, [filteredData, ivaClassifications, activeTab]);

    // Totals
    const totals = useMemo(() => {
        return filteredData.reduce((acc, row) => ({
            taxable: acc.taxable + row.totalTaxable,
            supported: acc.supported + row.totalSupported,
            deductible: acc.deductible + row.totalDeductible,
            liquidated: acc.liquidated + row.totalLiquidated,
            cative: acc.cative + row.totalCative,
            total: acc.total + row.totalDocument
        }), { taxable: 0, supported: 0, deductible: 0, liquidated: 0, cative: 0, total: 0 });
    }, [filteredData]);

    const exportToExcel = () => {
        if (filteredData.length === 0) return;

        const headers = ["Nº Ordem", "Tipo", "Entidade", "NIF", "Data", "Doc#", "Total Documento", "Total Tributável", "IVA Liquidado", "IVA Suportado", "IVA Dedutível", "IVA Cativo"];
        const rows = filteredData.map(row => [
            row.orderNumber,
            `"${row.docTypeCode}"`,
            `"${row.entityName}"`,
            `"${row.nif}"`,
            row.date,
            `"${row.documentNumber}"`,
            row.totalDocument.toFixed(2).replace('.', ','),
            row.totalTaxable.toFixed(2).replace('.', ','),
            row.totalLiquidated.toFixed(2).replace('.', ','),
            row.totalSupported.toFixed(2).replace('.', ','),
            row.totalDeductible.toFixed(2).replace('.', ','),
            row.totalCative.toFixed(2).replace('.', ',')
        ]);

        const csvContent = [
            headers.join(";"),
            ...rows.map(e => e.join(";"))
        ].join("\n");

        const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Consolidacao_IVA_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-800">Análise de IVA</h2>
                    <p className="text-sm text-slate-500 font-medium">Painel de consolidação e apuramento fiscal</p>
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

            {/* Tabs */}
            <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
                <button
                    onClick={() => setActiveTab('sales')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'sales' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <TrendingUp size={18} />
                    Vendas (Saída)
                </button>
                <button
                    onClick={() => setActiveTab('purchases')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'purchases' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <TrendingDown size={18} />
                    Compras (Entrada)
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[280px] relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Pesquisar por Doc# ou Entidade..."
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
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl shadow-slate-900/10 border border-slate-800">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Base Tributável</p>
                    <p className="text-2xl font-bold">{totals.taxable.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA</p>
                </div>

                {activeTab === 'sales' ? (
                    <>
                        <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 shadow-sm">
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">IVA Liquidado</p>
                            <p className="text-2xl font-bold text-blue-700">{totals.liquidated.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA</p>
                        </div>
                        <div className="bg-purple-50 p-6 rounded-3xl border border-purple-100 shadow-sm">
                            <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">IVA Cativo (Pelo Cliente)</p>
                            <p className="text-2xl font-bold text-purple-700">{totals.cative.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA</p>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 shadow-sm">
                            <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">IVA Suportado</p>
                            <p className="text-2xl font-bold text-amber-700">{totals.supported.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA</p>
                        </div>
                        <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 shadow-sm">
                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">IVA Dedutível</p>
                            <p className="text-2xl font-bold text-emerald-700">{totals.deductible.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA</p>
                        </div>
                    </>
                )}

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Documentos</p>
                    <p className="text-2xl font-bold text-slate-800">{totals.total.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Classification Map */}
                <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <FileSpreadsheet size={20} className="text-blue-600" />
                            Mapa de Apuramento por Classificação
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">Resumo agrupado pelos códigos do IVA para preenchimento do Modelo 7</p>
                    </div>
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-20">Código</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Base Tributável</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Imposto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {classificationMap.map((item) => (
                                    <tr key={item.code} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-black font-mono border border-slate-200">{item.code}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs font-bold text-slate-700">{item.description}</p>
                                            <p className="text-[10px] text-slate-400">{item.count} linhas</p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-sm font-bold text-slate-800">{item.taxable.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`text-sm font-bold ${activeTab === 'sales' ? 'text-blue-600' : 'text-emerald-600'}`}>
                                                {item.tax.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {classificationMap.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm">
                                            Nenhuma classificação encontrada neste período.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mini Charts / Visuals */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm h-full">
                        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <PieChart size={20} className="text-purple-600" />
                            Distribuição
                        </h3>
                        <div className="space-y-4">
                            {classificationMap.slice(0, 5).map((item, index) => {
                                const percentage = totals.taxable > 0 ? (item.taxable / totals.taxable) * 100 : 0;
                                return (
                                    <div key={item.code} className="space-y-1">
                                        <div className="flex justify-between text-xs font-bold text-slate-600">
                                            <span>{item.code}</span>
                                            <span>{percentage.toFixed(1)}%</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'][index % 5]}`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed List */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <BarChart3 size={20} className="text-slate-600" />
                        Detalhamento de Documentos
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ord</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Entidade</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Data</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Doc#</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Tributável</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">IVA</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredData.map((row) => (
                                <tr key={row.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-bold text-slate-400 group-hover:text-blue-500 transition-colors">#{row.orderNumber}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[10px] font-black font-mono">{row.docTypeCode}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-bold text-slate-800">{row.entityName}</p>
                                        <p className="text-[10px] font-medium text-slate-500">NIF: {row.nif}</p>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-xs font-semibold text-slate-600">{row.date}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-mono font-black text-slate-500">{row.documentNumber}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-sm font-bold text-slate-900">{row.totalTaxable.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`text-sm font-bold ${activeTab === 'sales' ? 'text-blue-600' : 'text-emerald-600'}`}>
                                            {(activeTab === 'sales' ? row.totalLiquidated : row.totalSupported).toLocaleString('pt-AO', { minimumFractionDigits: 2 })}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TaxIVA;
