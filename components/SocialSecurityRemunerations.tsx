import React, { useState, useEffect, useMemo } from 'react';
import {
    ArrowLeft,
    FileText,
    Printer,
    ShieldCheck,
    Search
} from 'lucide-react';
import { RemunerationMap, RemunerationLine, Staff } from '../types';
import RemunerationMapList from './RemunerationMapList';

const SocialSecurityRemunerations: React.FC = () => {
    const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
    const [mapData, setMapData] = useState<RemunerationMap | null>(null);
    const [lines, setLines] = useState<RemunerationLine[]>([]);
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (selectedMapId) {
            loadMapData(selectedMapId);
        }
    }, [selectedMapId]);

    const loadMapData = async (id: string) => {
        setLoading(true);
        try {
            const [map, staff] = await Promise.all([
                window.electron.db.getRemunerationMap(id),
                window.electron.db.getStaff()
            ]);
            setMapData(map);
            setLines(map.lines || []);
            setStaffList(staff);
        } catch (error) {
            console.error('Error loading map data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(val);

    const getStaffDetails = (staffId: string) => {
        return staffList.find(s => s.id === staffId);
    };

    const calculateINSSValues = (line: RemunerationLine) => {
        const staff = getStaffDetails(line.staff_id);

        let inss3 = line.inss_value; // Default to the calculated value stored in line
        let inss8 = line.inss_base * 0.08;

        if (staff) {
            // Reformado: Não paga 3%, mas paga 8% (entidade empregadora)
            if (staff.isRetired) {
                inss3 = 0;
            }

            // Isento ou Estrangeiro (se marcado como não sujeito a SS)
            if (staff.notSubjectToSS && !staff.isRetired) {
                inss3 = 0;
                inss8 = 0;
            }
        }

        return { inss3, inss8 };
    };

    const filteredLines = useMemo(() => {
        return lines.filter(line =>
            line.staff_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [lines, searchTerm]);

    const totals = useMemo(() => {
        return filteredLines.reduce((acc, line) => {
            const { inss3, inss8 } = calculateINSSValues(line);
            return {
                gross: acc.gross + line.gross_salary,
                inssBase: acc.inssBase + line.inss_base,
                inss3: acc.inss3 + inss3,
                inss8: acc.inss8 + inss8,
                net: acc.net + line.net_salary
            };
        }, { gross: 0, inssBase: 0, inss3: 0, inss8: 0, net: 0 });
    }, [filteredLines, staffList]); // Added staffList dependency as calculateINSSValues depends on it

    if (!selectedMapId) {
        return (
            <div className="space-y-6">
                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex items-center gap-4">
                    <div className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/20">
                        <ShieldCheck size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800">Segurança Social</h2>
                        <p className="text-slate-600 font-medium">Selecione um mapa de remunerações para visualizar a folha de segurança social.</p>
                    </div>
                </div>
                <RemunerationMapList
                    onSelectMap={setSelectedMapId}
                    onCreate={() => { }} // Hide create button or handle if needed, but here we just want to view
                />
            </div>
        );
    }

    if (loading) {
        return <div className="p-12 text-center text-slate-500 font-medium">Carregando dados...</div>;
    }

    if (!mapData) {
        return <div className="p-12 text-center text-red-500 font-medium">Mapa não encontrado.</div>;
    }

    // Calculate grand totals for the summary cards (unfiltered)
    const grandTotalINSS3 = lines.reduce((acc, line) => acc + calculateINSSValues(line).inss3, 0);
    const grandTotalINSS8 = lines.reduce((acc, line) => acc + calculateINSSValues(line).inss8, 0);
    const grandTotalINSS = grandTotalINSS3 + grandTotalINSS8;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setSelectedMapId(null)}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800">Folha de Segurança Social</h2>
                        <p className="text-slate-500 font-medium">Referente ao Mapa #{String(mapData.map_number).padStart(4, '0')} ({mapData.period})</p>
                    </div>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-bold shadow-lg shadow-slate-900/20">
                    <Printer size={20} />
                    Imprimir / Exportar
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Total INSS (3%) - Trabalhador</p>
                    <p className="text-2xl font-black text-slate-800">{formatCurrency(grandTotalINSS3)}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Total INSS (8%) - Empresa</p>
                    <p className="text-2xl font-black text-slate-800">{formatCurrency(grandTotalINSS8)}</p>
                </div>
                <div className="bg-blue-600 p-6 rounded-2xl shadow-lg shadow-blue-600/20 text-white">
                    <p className="text-xs font-bold text-blue-100 uppercase mb-1">Total a Pagar</p>
                    <p className="text-2xl font-black">{formatCurrency(grandTotalINSS)}</p>
                </div>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <Search className="text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Pesquisar funcionário..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-slate-700 placeholder-slate-400"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase">Nome do Funcionário</th>
                                <th className="px-6 py-4 text-right font-bold text-slate-500 uppercase">Salário Ilíquido</th>
                                <th className="px-6 py-4 text-right font-bold text-slate-500 uppercase">Valor Tributável INSS</th>
                                <th className="px-6 py-4 text-right font-bold text-slate-500 uppercase">Valor INSS (3%)</th>
                                <th className="px-6 py-4 text-right font-bold text-slate-500 uppercase">Valor INSS (8%)</th>
                                <th className="px-6 py-4 text-right font-bold text-slate-500 uppercase">Líquido a Receber</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredLines.map((line) => {
                                const { inss3, inss8 } = calculateINSSValues(line);
                                return (
                                    <tr key={line.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-800">
                                            {line.staff_name}
                                            {getStaffDetails(line.staff_id)?.isRetired && (
                                                <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">Reformado</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-600">{formatCurrency(line.gross_salary)}</td>
                                        <td className="px-6 py-4 text-right text-slate-600">{formatCurrency(line.inss_base)}</td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-700">{formatCurrency(inss3)}</td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-700">{formatCurrency(inss8)}</td>
                                        <td className="px-6 py-4 text-right font-black text-emerald-600">{formatCurrency(line.net_salary)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                            <tr>
                                <td className="px-6 py-4 text-slate-800">TOTAIS</td>
                                <td className="px-6 py-4 text-right text-slate-800">{formatCurrency(totals.gross)}</td>
                                <td className="px-6 py-4 text-right text-slate-800">{formatCurrency(totals.inssBase)}</td>
                                <td className="px-6 py-4 text-right text-slate-800">{formatCurrency(totals.inss3)}</td>
                                <td className="px-6 py-4 text-right text-slate-800">{formatCurrency(totals.inss8)}</td>
                                <td className="px-6 py-4 text-right text-emerald-600">{formatCurrency(totals.net)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SocialSecurityRemunerations;
