
import React, { useState, useMemo, useRef } from 'react';
import {
  Plus, Search, Trash2, FilePlus2, Upload, ChevronLeft, AlertCircle,
  FileCheck2, Calendar, Layers, Loader2, X, Building2, Hash, FileText,
  Eye, Edit3, Save, Download, FileX2
} from 'lucide-react';
import { Invoice, Supplier, TaxLine } from '../types';

interface InvoicesProps {
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  suppliers: Supplier[];
}

const Invoices: React.FC<InvoicesProps> = ({ invoices, setInvoices, suppliers }) => {
  const [showCreator, setShowCreator] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [supplierId, setSupplierId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [docNumber, setDocNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [taxLines, setTaxLines] = useState<TaxLine[]>([
    { id: '1', taxableValue: 0, rate: 14, supportedVat: 0, deductibleVat: 0 }
  ]);
  const [formError, setFormError] = useState<string | null>(null);

  const totals = useMemo(() => {
    return taxLines.reduce((acc, line) => ({
      taxable: acc.taxable + line.taxableValue,
      supported: acc.supported + line.supportedVat,
      deductible: acc.deductible + line.deductibleVat,
      document: acc.document + line.taxableValue + line.supportedVat
    }), { taxable: 0, supported: 0, deductible: 0, document: 0 });
  }, [taxLines]);

  const addLine = () => {
    setTaxLines([...taxLines, { id: Math.random().toString(), taxableValue: 0, rate: 14, supportedVat: 0, deductibleVat: 0 }]);
  };

  const updateLine = (id: string, field: keyof TaxLine, value: number) => {
    setTaxLines(taxLines.map(line => {
      if (line.id === id) {
        const updated = { ...line, [field]: value };
        if (field === 'taxableValue' || field === 'rate') {
          updated.supportedVat = Number((updated.taxableValue * (updated.rate / 100)).toFixed(2));
          updated.deductibleVat = updated.supportedVat;
        }
        return updated;
      }
      return line;
    }));
  };

  const handleEdit = (inv: Invoice) => {
    setEditingInvoice(inv);
    setSupplierId(inv.supplierId);
    setDate(inv.date);
    setDocNumber(inv.documentNumber);
    setNotes(inv.notes || '');
    setTaxLines(inv.lines);
    setSelectedFile(null);
    setShowCreator(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const removeInvoice = async (invoice: Invoice) => {
    if (!confirm(`Deseja realmente eliminar permanentemente a factura #${invoice.documentNumber}? Esta acção não pode ser desfeita.`)) return;

    setDeletingId(invoice.id);
    try {
      await window.electron.db.deleteInvoice(invoice.id);
      setInvoices(prev => prev.filter(i => i.id !== invoice.id));
    } catch (err: any) {
      alert(`Erro ao eliminar factura: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      let storagePath = editingInvoice?.pdfPath || null;

      if (selectedFile) {
        const buffer = await selectedFile.arrayBuffer();
        const fileExt = selectedFile.name.split('.').pop();
        const cleanDocNum = docNumber.replace(/[/\\?%*:|"<>]/g, '_');
        const fileName = `inv_${cleanDocNum}_${Date.now()}.${fileExt}`;

        storagePath = await window.electron.fs.saveFile(fileName, buffer);
      }

      const invoiceData = {
        id: editingInvoice?.id || crypto.randomUUID(),
        supplierId,
        date,
        documentNumber: docNumber,
        notes,
        hasPdf: !!storagePath,
        pdfPath: storagePath,
        totalTaxable: totals.taxable,
        totalSupported: totals.supported,
        totalDeductible: totals.deductible,
        totalDocument: totals.document
      };

      if (editingInvoice) {
        await window.electron.db.updateInvoice(invoiceData, taxLines);
      } else {
        await window.electron.db.addInvoice(invoiceData, taxLines);
      }

      const finalInvoice: Invoice = {
        ...invoiceData,
        orderNumber: editingInvoice?.orderNumber || (invoices.length > 0 ? Math.max(...invoices.map(i => i.orderNumber)) + 1 : 1),
        lines: taxLines
      };

      if (editingInvoice) {
        setInvoices(invoices.map(i => i.id === editingInvoice.id ? finalInvoice : i));
      } else {
        setInvoices([finalInvoice, ...invoices]);
      }

      setShowCreator(false);
      resetForm();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };


  const resetForm = () => {
    setEditingInvoice(null);
    setSupplierId('');
    setDocNumber('');
    setNotes('');
    setSelectedFile(null);
    setTaxLines([{ id: '1', taxableValue: 0, rate: 14, supportedVat: 0, deductibleVat: 0 }]);
  };

  const handleDownload = async (invoice: Invoice) => {
    if (!invoice.pdfPath) return;
    try {
      await window.electron.fs.openFile(invoice.pdfPath);
    } catch (err: any) {
      alert(`Erro ao abrir ficheiro: ${err.message}`);
    }
  };


  if (showCreator) {
    return (
      <div className="space-y-6 animate-in slide-in-from-right-8 duration-500 pb-20">
        <div className="flex items-center justify-between">
          <button
            onClick={() => { setShowCreator(false); resetForm(); }}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold transition-colors group"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            Voltar
          </button>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            {editingInvoice ? `Editando Factura #${editingInvoice.orderNumber}` : 'Criar Nova Factura'}
          </h2>
          <div className="w-20"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {formError && (
            <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 border border-red-100 font-bold animate-in shake duration-300">
              <AlertCircle size={20} />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Building2 size={12} className="text-blue-600" /> FORNECEDOR
                </label>
                <select
                  required
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 transition-all appearance-none"
                >
                  <option value="">Seleccionar Empresa...</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.nif})</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Calendar size={12} className="text-blue-600" /> DATA DA FACTURA
                </label>
                <input
                  required
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 transition-all"
                />
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Hash size={12} className="text-blue-600" /> Nº DO DOCUMENTO
                </label>
                <input
                  required
                  type="text"
                  placeholder="Ex: FA01"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <FileText size={12} className="text-blue-600" /> ANEXO PDF
                </label>
                <input type="file" accept="application/pdf" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full h-[52px] flex items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-all font-bold text-sm ${selectedFile ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-blue-200 text-blue-400 hover:bg-blue-50/50'}`}
                  >
                    {selectedFile ? <FileCheck2 size={18} /> : <Upload size={18} />}
                    <span className="truncate max-w-[180px]">{selectedFile ? selectedFile.name : (editingInvoice?.hasPdf ? 'Substituir PDF Atual' : 'Anexar PDF')}</span>
                  </button>
                  {editingInvoice?.hasPdf && !selectedFile && (
                    <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      <FileCheck2 size={12} /> Já existe um anexo vinculado a esta factura.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-full">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">NOTAS ADICIONAIS</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações importantes sobre este documento..."
                className="w-full flex-1 min-h-[120px] p-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none resize-none font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all text-sm"
              />
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 px-8 border-b flex justify-between items-center">
              <span className="font-black text-slate-800 flex items-center gap-3 uppercase text-xs tracking-widest">
                <Layers className="text-blue-600" size={18} /> Detalhamento de Impostos
              </span>
              <button type="button" onClick={addLine} className="text-blue-600 font-black text-sm hover:underline flex items-center gap-2">
                + Adicionar Linha
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b">
                  <tr>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Tributável</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Taxa (%)</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">IVA Suportado</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">IVA Dedutível</th>
                    <th className="px-8 py-4 w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {taxLines.map(l => (
                    <tr key={l.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-4">
                        <div className="relative">
                          <input
                            type="number" step="0.01" value={l.taxableValue || ''}
                            onChange={(e) => updateLine(l.id, 'taxableValue', parseFloat(e.target.value) || 0)}
                            className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 placeholder:text-slate-400"
                            placeholder="0,00"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 pointer-events-none">AOA</span>
                        </div>
                      </td>
                      <td className="px-8 py-4 w-40">
                        <select
                          value={l.rate} onChange={(e) => updateLine(l.id, 'rate', parseFloat(e.target.value))}
                          className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 outline-none appearance-none text-center text-slate-900"
                        >
                          <option value="14">14%</option>
                          <option value="7">7%</option>
                          <option value="5">5%</option>
                          <option value="2">2%</option>
                        </select>
                      </td>
                      <td className="px-8 py-4"><div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 font-black text-slate-800 text-center">{l.supportedVat.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA</div></td>
                      <td className="px-8 py-4"><input type="number" step="0.01" value={l.deductibleVat} onChange={(e) => updateLine(l.id, 'deductibleVat', parseFloat(e.target.value) || 0)} className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-emerald-500 outline-none text-emerald-600 placeholder:text-slate-400" /></td>
                      <td className="px-8 py-4 text-right"><button type="button" onClick={() => setTaxLines(taxLines.filter(x => x.id !== l.id))} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-[#0f172a] p-10 px-12 grid grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="space-y-1"><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">TOTAL TRIBUTÁVEL</p><p className="text-xl font-black text-white">{totals.taxable.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA</p></div>
              <div className="space-y-1"><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">TOTAL IVA SUPORTADO</p><p className="text-xl font-black text-white">{totals.supported.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA</p></div>
              <div className="space-y-1"><p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">TOTAL IVA DEDUTÍVEL</p><p className="text-xl font-black text-emerald-400">{totals.deductible.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA</p></div>
              <div className="space-y-1 border-l border-slate-800 pl-8"><p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">TOTAL DO DOCUMENTO</p><p className="text-2xl font-black text-blue-500">{totals.document.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA</p></div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit" disabled={isSubmitting}
              className="px-16 py-5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-3xl flex items-center gap-4 shadow-2xl shadow-blue-600/30 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : <>{editingInvoice ? <Save size={24} /> : <FilePlus2 size={24} />} {editingInvoice ? 'Guardar Alterações' : 'Guardar Factura'}</>}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text" placeholder="Pesquisar por Fornecedor ou Doc#..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm font-medium text-slate-800"
          />
        </div>
        <button
          onClick={() => { resetForm(); setShowCreator(true); }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-3.5 rounded-2xl font-black transition-all shadow-xl shadow-slate-900/10 active:scale-95"
        >
          <Plus size={20} />
          <span>Lançar Factura</span>
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">ORD</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fornecedor</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Data</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Doc#</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valor Total</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-24">Acções</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.filter(i => {
                const s = suppliers.find(sup => sup.id === i.supplierId);
                const term = searchTerm.toLowerCase();
                return (i.documentNumber || "").toLowerCase().includes(term) || (s?.name || "").toLowerCase().includes(term);
              }).map(i => (
                <tr key={i.id} className="hover:bg-blue-50/30 transition-colors group cursor-default">
                  <td className="px-8 py-5"><span className="text-xs font-black text-slate-300 group-hover:text-blue-500 transition-colors">#{i.orderNumber}</span></td>
                  <td className="px-8 py-5">
                    <p className="font-bold text-slate-800 text-base">{suppliers.find(s => s.id === i.supplierId)?.name || 'N/A'}</p>
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-tighter">NIF: {suppliers.find(s => s.id === i.supplierId)?.nif || '---'}</p>
                  </td>
                  <td className="px-8 py-5 text-center"><span className="text-sm font-semibold text-slate-600">{i.date}</span></td>
                  <td className="px-8 py-5 text-center"><span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-mono font-black border border-slate-200 group-hover:bg-white transition-colors">{i.documentNumber}</span></td>
                  <td className="px-8 py-5 text-right font-black text-slate-900 text-base">{i.totalDocument.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA</td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(i)} className="p-2 text-blue-600 hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-blue-100 transition-all" title="Ver/Editar Detalhes">
                        <Edit3 size={18} />
                      </button>
                      {i.hasPdf && (
                        <button onClick={() => handleDownload(i)} className="p-2 text-emerald-600 hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-emerald-100 transition-all" title="Baixar PDF">
                          <Download size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => removeInvoice(i)}
                        disabled={deletingId === i.id}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-red-100 transition-all"
                        title="Eliminar Factura"
                      >
                        {deletingId === i.id ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                      </button>
                    </div>
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

export default Invoices;
