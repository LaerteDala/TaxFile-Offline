
import React, { useState, useEffect, useRef } from 'react';
import {
    Plus,
    Search,
    FileText,
    Trash2,
    Eye,
    Download,
    Upload,
    FileCheck2,
    FileX2,
    Loader2,
    Calendar,
    AlertCircle,
    CheckCircle2,
    ArrowRightLeft,
    X
} from 'lucide-react';
import { CCDocument, CCDocumentType, CCNature } from '../types';

const MONTHS = [
    "01-Janeiro", "02-Fevereiro", "03-Março", "04-Abril",
    "05-Maio", "06-Junho", "07-Julho", "08-Agosto",
    "09-Setembro", "10-Outubro", "11-Novembro", "12-Dezembro"
];

interface CCOperationsProps {
    documents: CCDocument[];
    onRefresh: () => void;
    initialDocument?: CCDocument | null;
    initialIsViewing?: boolean;
    onClose?: () => void;
}

const CCOperations: React.FC<CCOperationsProps> = ({ documents, onRefresh, initialDocument, initialIsViewing, onClose }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDoc, setSelectedDoc] = useState<CCDocument | null>(null);
    const [isViewing, setIsViewing] = useState(false);

    // Form State
    const [type, setType] = useState<CCDocumentType>('LIQUIDACAO');
    const [referenceNumber, setReferenceNumber] = useState('');
    const [year, setYear] = useState(new Date().getFullYear());
    const [period, setPeriod] = useState('');
    const [taxType, setTaxType] = useState('Retenção na fonte');
    const [relatedTax, setRelatedTax] = useState('IVA');
    const [description, setDescription] = useState('');
    const [taxableValue, setTaxableValue] = useState(0);
    const [rate, setRate] = useState(0);
    const [amountToPay, setAmountToPay] = useState(0);
    const [interest, setInterest] = useState(0);
    const [fines, setFines] = useState(0);
    const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState('');
    const [receiptDate, setReceiptDate] = useState('');
    const [relatedDocumentId, setRelatedDocumentId] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Calculate Total
    const totalAmount = amountToPay + interest + fines;

    useEffect(() => {
        if (initialDocument) {
            handleEdit(initialDocument);
            if (initialIsViewing) {
                setIsViewing(true);
            }
        }
    }, [initialDocument, initialIsViewing]);

    useEffect(() => {
        if (rate > 0) {
            setAmountToPay((taxableValue * rate) / 100);
        } else if (rate === 0 && taxableValue > 0) {
            setAmountToPay(taxableValue);
        }
    }, [rate, taxableValue]);

    const resetForm = () => {
        setType('LIQUIDACAO');
        setReferenceNumber('');
        setYear(new Date().getFullYear());
        setPeriod('');
        setTaxType('Retenção na fonte');
        setRelatedTax('IVA');
        setDescription('');
        setTaxableValue(0);
        setRate(0);
        setAmountToPay(0);
        setInterest(0);
        setFines(0);
        setIssueDate(new Date().toISOString().split('T')[0]);
        setDueDate('');
        setReceiptDate('');
        setRelatedDocumentId('');
        setAttachment(null);
        setSelectedDoc(null);
        setIsViewing(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            let attachmentPath = selectedDoc?.attachmentPath;
            if (attachment) {
                const buffer = await attachment.arrayBuffer();
                attachmentPath = await window.electron.fs.saveFile(attachment.name, buffer);
            }

            const nature: CCNature = type === 'LIQUIDACAO' ? 'PENDENTE' : (type === 'PAGAMENTO' ? 'LIQUIDACAO' : 'NENHUMA');

            const docData = {
                id: selectedDoc?.id || (window.crypto?.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).substring(2, 11)),
                type,
                nature,
                referenceNumber,
                year,
                period,
                taxType,
                relatedTax,
                description,
                taxableValue,
                rate,
                amountToPay,
                interest,
                fines,
                totalAmount,
                issueDate,
                dueDate: type === 'LIQUIDACAO' ? dueDate : null,
                receiptDate: type === 'RECIBO' ? receiptDate : null,
                attachmentPath: attachmentPath || null,
                hasAttachment: !!attachmentPath,
                relatedDocumentId: (type === 'PAGAMENTO' || type === 'RECIBO') ? (relatedDocumentId || null) : null
            };

            if (selectedDoc) {
                await window.electron.db.updateCCDocument(docData);
            } else {
                await window.electron.db.addCCDocument(docData);
            }

            onRefresh();
            setIsFormOpen(false);
            resetForm();
            if (onClose) onClose();
        } catch (error: any) {
            console.error('Erro ao salvar documento:', error);
            alert(`Erro ao salvar documento: ${error.message || 'Verifique os dados e tente novamente.'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (doc: CCDocument) => {
        setSelectedDoc(doc);
        setType(doc.type);
        setReferenceNumber(doc.referenceNumber);
        setYear(doc.year);
        setPeriod(doc.period);
        setTaxType(doc.taxType);
        setRelatedTax(doc.relatedTax);
        setDescription(doc.description);
        setTaxableValue(doc.taxableValue);
        setRate(doc.rate);
        setAmountToPay(doc.amountToPay);
        setInterest(doc.interest);
        setFines(doc.fines);
        setIssueDate(doc.issueDate);
        setDueDate(doc.dueDate || '');
        setReceiptDate(doc.receiptDate || '');
        setRelatedDocumentId(doc.relatedDocumentId || '');
        setIsFormOpen(true);
        setIsViewing(false);
    };

    const handleView = (doc: CCDocument) => {
        handleEdit(doc);
        setIsViewing(true);
    };

    const handleDelete = async (id: string) => {
        const hasRelated = documents.some(d => d.relatedDocumentId === id);
        if (hasRelated) {
            alert('Não é possível excluir este documento pois existem registos relacionados. Exclua os registos relacionados primeiro.');
            return;
        }
        if (confirm('Tem certeza que deseja excluir este registro?')) {
            await window.electron.db.deleteCCDocument(id);
            onRefresh();
        }
    };

    const filteredDocs = documents.filter(doc =>
        doc.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.relatedTax.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const relatedOptions = documents.filter(d =>
        (type === 'PAGAMENTO' && d.type === 'LIQUIDACAO') ||
        (type === 'RECIBO' && d.type === 'PAGAMENTO')
    );

    const childDoc = documents.find(d => d.relatedDocumentId === selectedDoc?.id);
    const parentDoc = documents.find(d => d.id === selectedDoc?.relatedDocumentId);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {!isFormOpen ? (
                <>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex-1 w-full relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Pesquisar por referência, descrição ou imposto..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-all"
                            />
                        </div>
                        <button
                            onClick={() => { resetForm(); setIsFormOpen(true); }}
                            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                        >
                            <Plus size={20} />
                            Novo Documento
                        </button>
                    </div>

                    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Referência</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Imposto</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Período</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                                        <th className="px-6 py-4 text-center"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredDocs.map((doc) => (
                                        <tr key={doc.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${doc.type === 'LIQUIDACAO' ? 'bg-amber-50 text-amber-600' :
                                                    doc.type === 'PAGAMENTO' ? 'bg-emerald-50 text-emerald-600' :
                                                        'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {doc.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-slate-800">{doc.referenceNumber}</p>
                                                <p className="text-[10px] text-slate-500">{doc.description}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-bold text-slate-600">{doc.relatedTax}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-medium text-slate-600">{doc.period}/{doc.year}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-sm font-black text-slate-900">{doc.totalAmount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${doc.nature === 'PENDENTE' ? 'bg-red-50 text-red-600' :
                                                    doc.nature === 'LIQUIDACAO' ? 'bg-emerald-50 text-emerald-600' :
                                                        'bg-slate-50 text-slate-400'
                                                    }`}>
                                                    {doc.nature === 'PENDENTE' ? <AlertCircle size={12} /> : <CheckCircle2 size={12} />}
                                                    {doc.nature}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleView(doc)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl transition-all shadow-sm"><Eye size={18} /></button>
                                                    <button onClick={() => handleEdit(doc)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl transition-all shadow-sm"><FileText size={18} /></button>
                                                    <button onClick={() => handleDelete(doc.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-xl transition-all shadow-sm"><Trash2 size={18} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredDocs.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-20 text-center text-slate-400 italic">Nenhum documento encontrado.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-right duration-500">
                    <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
                        <div className="flex items-center gap-4">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800">{selectedDoc ? (isViewing ? 'Visualizar Documento' : 'Editar Documento') : 'Novo Documento'}</h2>
                                <p className="text-sm text-slate-500 font-medium">Preencha os dados da operação de conta corrente</p>
                            </div>
                            {isViewing && parentDoc && (
                                <button
                                    type="button"
                                    onClick={() => handleView(parentDoc)}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all"
                                >
                                    <ArrowRightLeft size={14} />
                                    Ver {parentDoc.type === 'LIQUIDACAO' ? 'Liquidação' : 'Pagamento'}
                                </button>
                            )}
                            {isViewing && childDoc && (
                                <button
                                    type="button"
                                    onClick={() => handleView(childDoc)}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs hover:bg-blue-100 transition-all"
                                >
                                    <ArrowRightLeft size={14} />
                                    Ver {childDoc.type === 'PAGAMENTO' ? 'Pagamento' : 'Recibo'}
                                </button>
                            )}
                        </div>
                        <button onClick={() => { setIsFormOpen(false); if (onClose) onClose(); }} className="p-3 hover:bg-slate-100 rounded-2xl transition-colors"><X size={24} /></button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Documento</label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value as CCDocumentType)}
                                    disabled={isViewing}
                                    className={`w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm ${isViewing ? 'bg-slate-50' : 'bg-white'}`}
                                >
                                    <option value="LIQUIDACAO">Nota de Liquidação (Pendente)</option>
                                    <option value="PAGAMENTO">Nota de Pagamento (Liquidação)</option>
                                    <option value="RECIBO">Recibo de Pagamento (Anexo)</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nº de Referência</label>
                                <input
                                    type="text" required value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)}
                                    disabled={isViewing}
                                    className={`w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm ${isViewing ? 'bg-slate-50' : 'bg-white'}`}
                                />
                            </div>

                            {(type === 'PAGAMENTO' || type === 'RECIBO') && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nota de Liquidação Relacionada</label>
                                    <select
                                        value={relatedDocumentId}
                                        onChange={(e) => {
                                            setRelatedDocumentId(e.target.value);
                                            const related = documents.find(d => d.id === e.target.value);
                                            if (related) {
                                                setYear(related.year);
                                                setPeriod(related.period);
                                                setTaxType(related.taxType);
                                                setRelatedTax(related.relatedTax);
                                                setDescription(related.description);
                                                setTaxableValue(related.taxableValue);
                                                setRate(related.rate);
                                                setAmountToPay(related.amountToPay);
                                                setInterest(related.interest);
                                                setFines(related.fines);
                                                if (type === 'RECIBO') {
                                                    setIssueDate(related.issueDate);
                                                }
                                            }
                                        }}
                                        disabled={isViewing}
                                        className={`w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm ${(isViewing || type !== 'LIQUIDACAO') ? 'bg-slate-50' : 'bg-white'}`}
                                    >
                                        <option value="">Seleccione a nota...</option>
                                        {relatedOptions.map(d => (
                                            <option key={d.id} value={d.id}>{d.referenceNumber} - {d.relatedTax} ({d.totalAmount.toLocaleString()} AOA)</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ano</label>
                                <input
                                    type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}
                                    disabled={isViewing || type !== 'LIQUIDACAO'}
                                    className={`w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm ${(isViewing || type !== 'LIQUIDACAO') ? 'bg-slate-50' : 'bg-white'}`}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Período</label>
                                <select
                                    value={period} onChange={(e) => setPeriod(e.target.value)}
                                    disabled={isViewing || type !== 'LIQUIDACAO'}
                                    className={`w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm ${(isViewing || type !== 'LIQUIDACAO') ? 'bg-slate-50' : 'bg-white'}`}
                                >
                                    <option value="">Seleccione o período...</option>
                                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Imposto</label>
                                <select
                                    value={taxType} onChange={(e) => setTaxType(e.target.value)}
                                    disabled={isViewing || type !== 'LIQUIDACAO'}
                                    className={`w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm ${(isViewing || type !== 'LIQUIDACAO') ? 'bg-slate-50' : 'bg-white'}`}
                                >
                                    <option value="Retenção na fonte">Retenção na fonte</option>
                                    <option value="Multa">Multa</option>
                                    <option value="Juros">Juros</option>
                                    <option value="Auto-Liquidação">Auto-Liquidação</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Imposto Relacionado</label>
                                <select
                                    value={relatedTax} onChange={(e) => setRelatedTax(e.target.value)}
                                    disabled={isViewing || type !== 'LIQUIDACAO'}
                                    className={`w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm ${(isViewing || type !== 'LIQUIDACAO') ? 'bg-slate-50' : 'bg-white'}`}
                                >
                                    <option value="IVA">IVA</option>
                                    <option value="II">II (Industrial)</option>
                                    <option value="IRT">IRT</option>
                                    <option value="IS">IS (Selo)</option>
                                    <option value="IP">IP (Predial)</option>
                                    <option value="IVM">IVM</option>
                                    <option value="IAC">IAC</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição / Notas</label>
                            <textarea
                                value={description} onChange={(e) => setDescription(e.target.value)}
                                disabled={isViewing}
                                className={`w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm ${isViewing ? 'bg-slate-50' : 'bg-white'} min-h-[100px]`}
                            />
                        </div>

                        <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200 space-y-6">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-4">Valores da Operação</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Base Tributável</label>
                                    <input
                                        type="number" value={taxableValue} onChange={(e) => setTaxableValue(parseFloat(e.target.value) || 0)}
                                        disabled={isViewing || type !== 'LIQUIDACAO'}
                                        className={`w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm ${(isViewing || type !== 'LIQUIDACAO') ? 'bg-slate-50' : 'bg-white'}`}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Taxa (%)</label>
                                    <input
                                        type="number" value={rate} onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                                        disabled={isViewing || type !== 'LIQUIDACAO'}
                                        className={`w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm ${(isViewing || type !== 'LIQUIDACAO') ? 'bg-slate-50' : 'bg-white'}`}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor a Pagar</label>
                                    <input
                                        type="number" value={amountToPay} onChange={(e) => setAmountToPay(parseFloat(e.target.value) || 0)}
                                        disabled={isViewing || (type !== 'LIQUIDACAO' && type !== 'PAGAMENTO')}
                                        className={`w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm ${(isViewing || (type !== 'LIQUIDACAO' && type !== 'PAGAMENTO')) ? 'bg-slate-50' : 'bg-white'}`}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Juros / Multas</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number" placeholder="Juros" value={interest} onChange={(e) => setInterest(parseFloat(e.target.value) || 0)}
                                            disabled={isViewing || type !== 'LIQUIDACAO'}
                                            className={`w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm ${(isViewing || type !== 'LIQUIDACAO') ? 'bg-slate-50' : 'bg-white'}`}
                                        />
                                        <input
                                            type="number" placeholder="Multas" value={fines} onChange={(e) => setFines(parseFloat(e.target.value) || 0)}
                                            disabled={isViewing || type !== 'LIQUIDACAO'}
                                            className={`w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm ${(isViewing || type !== 'LIQUIDACAO') ? 'bg-slate-50' : 'bg-white'}`}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end pt-4 border-t border-slate-200">
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total do Documento</p>
                                    <p className="text-3xl font-black text-blue-600">{totalAmount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data de Emissão</label>
                                <input
                                    type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)}
                                    disabled={isViewing}
                                    className={`w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm ${isViewing ? 'bg-slate-50' : 'bg-white'}`}
                                />
                            </div>
                            {type === 'LIQUIDACAO' && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data Limite de Pagamento</label>
                                    <input
                                        type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                                        disabled={isViewing}
                                        className={`w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm ${isViewing ? 'bg-slate-50' : 'bg-white'}`}
                                    />
                                </div>
                            )}
                            {type === 'RECIBO' && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data do Recibo</label>
                                    <input
                                        type="date" value={receiptDate} onChange={(e) => setReceiptDate(e.target.value)}
                                        disabled={isViewing}
                                        className={`w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm ${isViewing ? 'bg-slate-50' : 'bg-white'}`}
                                    />
                                </div>
                            )}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Anexo (PDF)</label>
                                <input type="file" accept="application/pdf" ref={fileInputRef} onChange={(e) => e.target.files && setAttachment(e.target.files[0])} className="hidden" />
                                <button
                                    type="button"
                                    onClick={() => !isViewing && fileInputRef.current?.click()}
                                    className={`w-full h-14 flex items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-all font-bold text-sm ${attachment || selectedDoc?.hasAttachment ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-slate-200 text-slate-400'}`}
                                >
                                    {attachment || selectedDoc?.hasAttachment ? <FileCheck2 size={20} /> : <Upload size={20} />}
                                    <span className="truncate">{attachment ? attachment.name : (selectedDoc?.hasAttachment ? 'Ver Anexo Atual' : 'Anexar Documento')}</span>
                                </button>
                            </div>
                        </div>

                        {!isViewing && (
                            <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
                                <button
                                    type="button" onClick={() => { setIsFormOpen(false); if (onClose) onClose(); }}
                                    className="px-8 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit" disabled={isSubmitting}
                                    className="px-12 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 flex items-center gap-2"
                                >
                                    {isSubmitting && <Loader2 className="animate-spin" size={20} />}
                                    {selectedDoc ? 'Actualizar Documento' : 'Salvar Documento'}
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            )}
        </div>
    );
};

export default CCOperations;
