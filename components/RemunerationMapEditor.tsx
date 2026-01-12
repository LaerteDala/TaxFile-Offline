import React, { useState, useEffect, useMemo } from 'react';
import {
    ArrowLeft,
    Plus,
    Save,
    Trash2,
    Edit2,
    Calculator,
    Check,
    X,
    Search,
    AlertCircle,
    Coins
} from 'lucide-react';
import { RemunerationMap, RemunerationLine, Subsidy, Staff, IRTScale } from '../types';
import { calculatePayroll, PayrollInput } from '../utils/payrollCalculator';

interface RemunerationMapEditorProps {
    mapId: string;
    onBack: () => void;
}

const RemunerationMapEditor: React.FC<RemunerationMapEditorProps> = ({ mapId, onBack }) => {
    const [mapData, setMapData] = useState<RemunerationMap | null>(null);
    const [loading, setLoading] = useState(true);
    const [allStaff, setAllStaff] = useState<Staff[]>([]);
    const [allSubsidies, setAllSubsidies] = useState<Subsidy[]>([]);
    const [irtScales, setIrtScales] = useState<IRTScale[]>([]);

    // Modal States
    const [showAddStaffModal, setShowAddStaffModal] = useState(false);
    const [showEditLineModal, setShowEditLineModal] = useState(false);
    const [selectedStaffId, setSelectedStaffId] = useState('');
    const [editingLine, setEditingLine] = useState<RemunerationLine | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Edit Form State
    const [formData, setFormData] = useState<PayrollInput>({
        baseSalary: 0,
        overtime: 0,
        deductions: 0,
        subsidies: [],
        manualExcessBool: false,
        manualExcessValue: 0
    });

    useEffect(() => {
        loadData();
    }, [mapId]);

    const loadData = async () => {
        try {
            const [map, staff, subsidies, scales] = await Promise.all([
                window.electron.db.getRemunerationMap(mapId),
                window.electron.db.getStaff(),
                window.electron.db.getSubsidies(),
                window.electron.db.getIRTScales()
            ]);
            setMapData(map);
            setAllStaff(staff);
            setAllSubsidies(subsidies);
            setIrtScales(scales);
        } catch (error) {
            console.error('Error loading map data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddStaff = async () => {
        if (!selectedStaffId || !mapData) return;

        const staffMember = allStaff.find(s => s.id === selectedStaffId);
        if (!staffMember) return;

        try {
            const newLine = {
                id: crypto.randomUUID(),
                map_id: mapId,
                staff_id: selectedStaffId,
                base_salary: staffMember.base_salary || 0,
                overtime_value: 0,
                deductions_value: 0,
                manual_excess_bool: 0,
                manual_excess_value: 0,
                total_non_subject_subsidies: 0,
                total_subject_subsidies: 0,
                gross_salary: 0,
                inss_base: 0,
                inss_value: 0,
                irt_base: 0,
                irt_scale_id: null,
                irt_value: 0,
                net_salary: 0
            };

            // Calculate initial values
            const input: PayrollInput = {
                baseSalary: newLine.base_salary,
                overtime: 0,
                deductions: 0,
                subsidies: [],
                manualExcessBool: false,
                manualExcessValue: 0
            };

            const isSubjectToINSS = !staffMember.notSubjectToSS || staffMember.isRetired;
            const result = calculatePayroll(input, allSubsidies, irtScales, isSubjectToINSS, !staffMember.irtExempt, staffMember.isRetired);

            await window.electron.db.addRemunerationLine({
                ...newLine,
                ...result,
                manual_excess_bool: 0
            });

            await loadData();
            setShowAddStaffModal(false);
            setSelectedStaffId('');
        } catch (error) {
            console.error('Error adding staff:', error);
        }
    };

    const handleEditLine = (line: RemunerationLine) => {
        setEditingLine(line);
        setFormData({
            baseSalary: line.base_salary,
            overtime: line.overtime_value,
            deductions: line.deductions_value,
            subsidies: line.subsidies?.map(s => ({ subsidyId: s.subsidy_id, amount: s.amount })) || [],
            manualExcessBool: line.manual_excess_bool === 1,
            manualExcessValue: line.manual_excess_value
        });
        setShowEditLineModal(true);
    };

    const handleSaveLine = async () => {
        if (!editingLine || !mapData) return;

        const staffMember = allStaff.find(s => s.id === editingLine.staff_id);
        const isSubjectToINSS = staffMember ? (!staffMember.notSubjectToSS || staffMember.isRetired) : true;

        const isSubjectToIRT = staffMember ? !staffMember.irtExempt : true;

        const result = calculatePayroll(formData, allSubsidies, irtScales, isSubjectToINSS, isSubjectToIRT, staffMember?.isRetired);

        try {
            // Update Line
            await window.electron.db.updateRemunerationLine({
                id: editingLine.id,
                base_salary: formData.baseSalary,
                overtime_value: formData.overtime,
                deductions_value: formData.deductions,
                manual_excess_bool: formData.manualExcessBool ? 1 : 0,
                manual_excess_value: formData.manualExcessValue,

                total_non_subject_subsidies: result.totalNonSubjectSubsidies,
                total_subject_subsidies: result.totalSubjectSubsidies,

                gross_salary: result.grossSalary,
                inss_base: result.inssBase,
                inss_value: result.inssValue,

                irt_base: result.irtBase,
                irt_scale_id: result.irtScaleId,
                irt_value: result.irtValue,

                net_salary: result.netSalary
            });

            // Update Subsidies
            await window.electron.db.deleteRemunerationLineSubsidies(editingLine.id);
            for (const sub of formData.subsidies) {
                await window.electron.db.addRemunerationLineSubsidy({
                    id: crypto.randomUUID(),
                    line_id: editingLine.id,
                    subsidy_id: sub.subsidyId,
                    amount: sub.amount
                });
            }

            await loadData();
            setShowEditLineModal(false);
            setEditingLine(null);
        } catch (error) {
            console.error('Error saving line:', error);
        }
    };

    const handleDeleteLine = async (id: string) => {
        if (confirm('Remover este funcionário do mapa?')) {
            try {
                await window.electron.db.deleteRemunerationLine(id);
                await loadData();
            } catch (error) {
                console.error('Error deleting line:', error);
            }
        }
    };

    // Real-time calculation for preview
    const previewResult = useMemo(() => {
        if (!editingLine) return null;
        const staffMember = allStaff.find(s => s.id === editingLine.staff_id);
        const isSubjectToINSS = staffMember ? (!staffMember.notSubjectToSS || staffMember.isRetired) : true;
        const isSubjectToIRT = staffMember ? !staffMember.irtExempt : true;
        return calculatePayroll(formData, allSubsidies, irtScales, isSubjectToINSS, isSubjectToIRT, staffMember?.isRetired);
    }, [formData, editingLine, allSubsidies, irtScales, allStaff]);

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(val);

    if (loading) return <div className="p-8 text-center">Carregando mapa...</div>;
    if (!mapData) return <div className="p-8 text-center">Mapa não encontrado.</div>;

    const filteredLines = mapData.lines?.filter(line =>
        line.staff_name?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const totals = filteredLines.reduce((acc, line) => ({
        base_salary: acc.base_salary + line.base_salary,
        subsidies: acc.subsidies + (line.total_subject_subsidies || 0) + (line.total_non_subject_subsidies || 0),
        gross_salary: acc.gross_salary + line.gross_salary,
        inss_value: acc.inss_value + line.inss_value,
        irt_value: acc.irt_value + line.irt_value,
        net_salary: acc.net_salary + line.net_salary
    }), {
        base_salary: 0,
        subsidies: 0,
        gross_salary: 0,
        inss_value: 0,
        irt_value: 0,
        net_salary: 0
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800">Mapa de Remunerações #{String(mapData.map_number).padStart(4, '0')}</h2>
                        <p className="text-slate-500 font-medium">Período: {mapData.period}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowAddStaffModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold"
                    >
                        <Plus size={20} />
                        Adicionar Funcionário
                    </button>
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
                                <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase">Nome</th>
                                <th className="px-6 py-4 text-right font-bold text-slate-500 uppercase">Salário Base</th>
                                <th className="px-6 py-4 text-right font-bold text-slate-500 uppercase">Subsídios</th>
                                <th className="px-6 py-4 text-right font-bold text-slate-500 uppercase">Ilíquido</th>
                                <th className="px-6 py-4 text-right font-bold text-slate-500 uppercase">INSS (3%)</th>
                                <th className="px-6 py-4 text-right font-bold text-slate-500 uppercase">IRT</th>
                                <th className="px-6 py-4 text-right font-bold text-slate-500 uppercase">Líquido</th>
                                <th className="px-6 py-4 text-right font-bold text-slate-500 uppercase">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredLines.map((line) => (
                                <tr key={line.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-800">{line.staff_name}</td>
                                    <td className="px-6 py-4 text-right text-slate-600">{formatCurrency(line.base_salary)}</td>
                                    <td className="px-6 py-4 text-right text-slate-600">
                                        {formatCurrency((line.total_subject_subsidies || 0) + (line.total_non_subject_subsidies || 0))}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-700">{formatCurrency(line.gross_salary)}</td>
                                    <td className="px-6 py-4 text-right text-slate-600">{formatCurrency(line.inss_value)}</td>
                                    <td className="px-6 py-4 text-right text-slate-600">{formatCurrency(line.irt_value)}</td>
                                    <td className="px-6 py-4 text-right font-black text-emerald-600">{formatCurrency(line.net_salary)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleEditLine(line)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDeleteLine(line.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                            <tr>
                                <td className="px-6 py-4 text-slate-800">TOTAIS</td>
                                <td className="px-6 py-4 text-right text-slate-800">{formatCurrency(totals.base_salary)}</td>
                                <td className="px-6 py-4 text-right text-slate-800">{formatCurrency(totals.subsidies)}</td>
                                <td className="px-6 py-4 text-right text-slate-800">{formatCurrency(totals.gross_salary)}</td>
                                <td className="px-6 py-4 text-right text-slate-800">{formatCurrency(totals.inss_value)}</td>
                                <td className="px-6 py-4 text-right text-slate-800">{formatCurrency(totals.irt_value)}</td>
                                <td className="px-6 py-4 text-right text-emerald-600">{formatCurrency(totals.net_salary)}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Add Staff Modal */}
            {showAddStaffModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Adicionar Funcionário</h3>
                        <select
                            value={selectedStaffId}
                            onChange={(e) => setSelectedStaffId(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl mb-6"
                        >
                            <option value="">Selecione um funcionário...</option>
                            {allStaff
                                .filter(s => !mapData.lines?.find(l => l.staff_id === s.id))
                                .map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.nif})</option>
                                ))
                            }
                        </select>
                        <div className="flex gap-3">
                            <button onClick={() => setShowAddStaffModal(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold">Cancelar</button>
                            <button onClick={handleAddStaff} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">Adicionar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Line Modal */}
            {showEditLineModal && editingLine && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl my-8 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">{editingLine.staff_name}</h3>
                                <p className="text-sm text-slate-500">Editar processamento salarial</p>
                            </div>
                            <button onClick={() => setShowEditLineModal(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Inputs */}
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                        <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                                        Remuneração Base
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase">Salário Base</label>
                                            <input
                                                type="number"
                                                value={formData.baseSalary}
                                                onChange={(e) => setFormData({ ...formData, baseSalary: Number(e.target.value) })}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase">Horas Extras</label>
                                            <input
                                                type="number"
                                                value={formData.overtime}
                                                onChange={(e) => setFormData({ ...formData, overtime: Number(e.target.value) })}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase">Descontos/Faltas</label>
                                            <input
                                                type="number"
                                                value={formData.deductions}
                                                onChange={(e) => setFormData({ ...formData, deductions: Number(e.target.value) })}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                            <div className="w-1 h-6 bg-emerald-600 rounded-full"></div>
                                            Subsídios
                                        </h4>
                                        <button
                                            onClick={() => {
                                                const subId = allSubsidies[0]?.id;
                                                if (subId) setFormData({ ...formData, subsidies: [...formData.subsidies, { subsidyId: subId, amount: 0 }] });
                                            }}
                                            className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg"
                                        >
                                            + Adicionar
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {formData.subsidies.map((sub, idx) => (
                                            <div key={idx} className="flex gap-2 items-end">
                                                <div className="flex-1">
                                                    <label className="text-xs font-bold text-slate-500 uppercase">Tipo</label>
                                                    <select
                                                        value={sub.subsidyId}
                                                        onChange={(e) => {
                                                            const newSubs = [...formData.subsidies];
                                                            newSubs[idx].subsidyId = e.target.value;
                                                            setFormData({ ...formData, subsidies: newSubs });
                                                        }}
                                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                                    >
                                                        {allSubsidies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                    </select>
                                                </div>
                                                <div className="w-32">
                                                    <label className="text-xs font-bold text-slate-500 uppercase">Valor</label>
                                                    <input
                                                        type="number"
                                                        value={sub.amount}
                                                        onChange={(e) => {
                                                            const newSubs = [...formData.subsidies];
                                                            newSubs[idx].amount = Number(e.target.value);
                                                            setFormData({ ...formData, subsidies: newSubs });
                                                        }}
                                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const newSubs = formData.subsidies.filter((_, i) => i !== idx);
                                                        setFormData({ ...formData, subsidies: newSubs });
                                                    }}
                                                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg mb-0.5"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.manualExcessBool}
                                            onChange={(e) => setFormData({ ...formData, manualExcessBool: e.target.checked })}
                                            className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                                        />
                                        <span className="font-bold text-slate-700">Cálculo Manual de Excesso de Subsídio?</span>
                                    </label>

                                    {formData.manualExcessBool ? (
                                        <div className="pl-8 animate-in slide-in-from-top-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Valor do Excesso (Não Sujeito)</label>
                                            <input
                                                type="number"
                                                value={formData.manualExcessValue}
                                                onChange={(e) => setFormData({ ...formData, manualExcessValue: Number(e.target.value) })}
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    ) : (
                                        <div className="pl-8 text-sm text-slate-400 italic">
                                            O excesso será calculado automaticamente com base nas regras dos subsídios.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Preview */}
                            <div className="bg-slate-50 rounded-2xl p-6 space-y-6 h-fit sticky top-0">
                                <h4 className="font-bold text-slate-800 flex items-center gap-2 pb-4 border-b border-slate-200">
                                    <Calculator size={20} className="text-blue-600" />
                                    Simulação em Tempo Real
                                </h4>

                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Subsídios Não Sujeitos (IRT)</span>
                                        <span className="font-medium">{formatCurrency(previewResult?.totalNonSubjectSubsidies || 0)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Subsídios Sujeitos (IRT)</span>
                                        <span className="font-medium">{formatCurrency(previewResult?.totalSubjectSubsidies || 0)}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-200">
                                        <span className="text-slate-700">Salário Ilíquido</span>
                                        <span className="text-slate-900">{formatCurrency(previewResult?.grossSalary || 0)}</span>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4 border-t border-slate-200">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Base Tributável INSS</span>
                                        <span className="font-medium">{formatCurrency(previewResult?.inssBase || 0)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-rose-600 font-bold">
                                        <span>Valor INSS (3%)</span>
                                        <span>- {formatCurrency(previewResult?.inssValue || 0)}</span>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4 border-t border-slate-200">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Base Tributável IRT</span>
                                        <span className="font-medium">{formatCurrency(previewResult?.irtBase || 0)}</span>
                                    </div>
                                    {previewResult?.irtScaleId && (
                                        <div className="text-xs text-slate-400 text-right">
                                            Escalão: {previewResult.irtTaxa}% | Parc. Fixa: {formatCurrency(previewResult.irtParcelaFixa)} | Excesso: {formatCurrency(previewResult.irtExcesso)}
                                        </div>
                                    )}
                                    <div className="flex justify-between text-sm text-rose-600 font-bold">
                                        <span>Valor IRT</span>
                                        <span>- {formatCurrency(previewResult?.irtValue || 0)}</span>
                                    </div>
                                </div>

                                <div className="pt-6 border-t-2 border-slate-200">
                                    <div className="flex justify-between items-end">
                                        <span className="text-slate-500 font-bold uppercase text-xs">Líquido a Receber</span>
                                        <span className="text-3xl font-black text-emerald-600">{formatCurrency(previewResult?.netSalary || 0)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                            <button onClick={() => setShowEditLineModal(false)} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">
                                Cancelar
                            </button>
                            <button onClick={handleSaveLine} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 flex items-center gap-2">
                                <Save size={20} />
                                Salvar Alterações
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RemunerationMapEditor;
