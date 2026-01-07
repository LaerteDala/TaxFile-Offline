
import React, { useState, useMemo, useRef } from 'react';
import {
  Search,
  Calendar,
  Filter,
  ArrowUpRight,
  FileCheck2,
  FileX2,
  Eye,
  ArrowDownWideNarrow,
  Download,
  X,
  Printer,
  FileText,
  Layers,
  ChevronLeft,
  Trash2,
  Save,
  Edit3,
  AlertCircle,
  Loader2,
  Upload,
  FileSpreadsheet,
  FolderArchive
} from 'lucide-react';
import { Invoice, Supplier, TaxLine, DocumentType } from '../types';
import JSZip from 'jszip';

interface InquiryProps {
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  suppliers: Supplier[];
  documentTypes: DocumentType[];
}

const Inquiry: React.FC<InquiryProps> = ({ invoices, setInvoices, suppliers, documentTypes }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // View states
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Detail/Edit Form State
  const [editDocNumber, setEditDocNumber] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editDocumentTypeId, setEditDocumentTypeId] = useState('');
  const [newFile, setNewFile] = useState<File | null>(null);

  const filteredData = useMemo(() => {
    return invoices.filter(inv => {
      const supplier = suppliers.find(s => s.id === inv.supplierId);
      const term = searchTerm.toLowerCase();
      const docNum = (inv.documentNumber || "").toLowerCase();
      const supName = (supplier?.name || "").toLowerCase();

      const matchesSearch = docNum.includes(term) || supName.includes(term);
      const matchesDate = (!startDate || inv.date >= startDate) && (!endDate || inv.date <= endDate);
      const matchesSupplier = !filterSupplier || inv.supplierId === filterSupplier;

      return matchesSearch && matchesDate && matchesSupplier;
    });
  }, [invoices, suppliers, searchTerm, startDate, endDate, filterSupplier]);

  const totals = useMemo(() => {
    return filteredData.reduce((acc, row) => ({
      taxable: acc.taxable + row.totalTaxable,
      supported: acc.supported + row.totalSupported,
      deductible: acc.deductible + row.totalDeductible,
      withholding: acc.withholding + row.totalWithholding,
      total: acc.total + row.totalDocument
    }), { taxable: 0, supported: 0, deductible: 0, withholding: 0, total: 0 });
  }, [filteredData]);

  const selectedInvoice = useMemo(() => {
    if (!selectedInvoiceId) return null;
    const inv = invoices.find(i => i.id === selectedInvoiceId);
    if (!inv) return null;
    const supplier = suppliers.find(s => s.id === inv.supplierId);
    const docType = documentTypes.find(dt => dt.id === inv.documentTypeId);
    return {
      ...inv,
      supplierName: supplier?.name || 'N/A',
      nif: supplier?.nif || 'N/A',
      supplierEmail: supplier?.email || 'N/A',
      supplierAddress: supplier?.address || 'N/A',
      documentTypeCode: docType?.code || '---',
      documentTypeName: docType?.name || '---'
    };
  }, [selectedInvoiceId, invoices, suppliers, documentTypes]);

  const removeInvoice = async (invoice: Invoice) => {
    if (!confirm(`Deseja realmente eliminar permanentemente a factura #${invoice.documentNumber}? Esta acção é irreversível.`)) return;

    const idToRemove = invoice.id;
    setDeletingId(idToRemove);

    try {
      await window.electron.db.deleteInvoice(idToRemove);
      setInvoices(prev => prev.filter(i => i.id !== idToRemove));

      if (selectedInvoiceId === idToRemove) {
        setSelectedInvoiceId(null);
      }
    } catch (err: any) {
      alert(`Erro ao eliminar factura: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const exportToExcel = () => {
    if (filteredData.length === 0) return;

    const headers = ["Nº Ordem", "Tipo", "Fornecedor", "NIF", "Data", "Doc#", "Total Documento", "Total Tributável", "Total Suportado", "Total Dedutível", "Retenção", "Notas"];

    const rows = filteredData.map(row => {
      const supplier = suppliers.find(s => s.id === row.supplierId);
      const docType = documentTypes.find(dt => dt.id === row.documentTypeId);
      return [
        row.orderNumber,
        `"${docType?.code || '---'}"`,
        `"${supplier?.name || 'N/A'}"`,
        `"${supplier?.nif || 'N/A'}"`,
        row.date,
        `"${row.documentNumber}"`,
        row.totalDocument.toFixed(2).replace('.', ','),
        row.totalTaxable.toFixed(2).replace('.', ','),
        row.totalSupported.toFixed(2).replace('.', ','),
        row.totalDeductible.toFixed(2).replace('.', ','),
        row.totalWithholding.toFixed(2).replace('.', ','),
        `"${(row.notes || "").replace(/\n/g, ' ')}"`
      ];
    });

    const csvContent = [
      headers.join(";"),
      ...rows.map(e => e.join(";"))
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Consulta_Facturas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAttachmentsZip = async () => {
    const invoicesWithPdf = filteredData.filter(i => i.hasPdf && i.pdfPath);

    if (invoicesWithPdf.length === 0) {
      alert("Nenhuma das facturas filtradas possui anexo PDF para exportar.");
      return;
    }

    setIsZipping(true);
    const zip = new JSZip();

    try {
      for (const inv of invoicesWithPdf) {
        const supplier = suppliers.find(s => s.id === inv.supplierId);
        const folderName = supplier?.name.replace(/[/\\?%*:|"<>]/g, '_') || "Sem Fornecedor";
        const fileName = `Factura_${inv.documentNumber.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`;

        const buffer = await window.electron.fs.readFile(inv.pdfPath!);
        if (buffer) {
          zip.folder(folderName)?.file(fileName, buffer);
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Anexos_Facturas_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Erro ao gerar ZIP:", err);
      alert("Ocorreu um erro ao processar os anexos.");
    } finally {
      setIsZipping(false);
    }
  };

  const handleDownload = async (invoice: Invoice) => {
    if (!invoice.hasPdf || !invoice.pdfPath) return;
    setIsDownloading(invoice.id);
    try {
      await window.electron.fs.openFile(invoice.pdfPath);
    } catch (err: any) {
      alert(`Erro ao abrir PDF: ${err.message}`);
    } finally {
      setIsDownloading(null);
    }
  };

  const handleOpenDetails = (inv: Invoice) => {
    setSelectedInvoiceId(inv.id);
    setEditDocNumber(inv.documentNumber);
    setEditNotes(inv.notes || '');
    setEditDate(inv.date);
    setEditDocumentTypeId(inv.documentTypeId || '');
    setNewFile(null);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!selectedInvoiceId || !selectedInvoice) return;
    setIsSaving(true);

    try {
      let storagePath = selectedInvoice.pdfPath || null;

      if (newFile) {
        const buffer = await newFile.arrayBuffer();
        const fileExt = newFile.name.split('.').pop();
        const fileName = `inv_${editDocNumber}_${Date.now()}.${fileExt}`;
        storagePath = await window.electron.fs.saveFile(fileName, buffer);
      }

      const updatedData = {
        ...selectedInvoice,
        documentNumber: editDocNumber,
        notes: editNotes,
        date: editDate,
        documentTypeId: editDocumentTypeId,
        pdfPath: storagePath,
        hasPdf: !!storagePath
      };

      await window.electron.db.updateInvoice(updatedData, selectedInvoice.lines);

      setInvoices(prev => prev.map(inv => {
        if (inv.id === selectedInvoiceId) {
          return { ...inv, documentNumber: editDocNumber, notes: editNotes, date: editDate, documentTypeId: editDocumentTypeId, pdfPath: storagePath || undefined, hasPdf: !!storagePath };
        }
        return inv;
      }));
      setIsEditing(false);
    } catch (err: any) {
      alert(`Erro ao salvar: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (selectedInvoice) {
    return (
      <div className="space-y-6 animate-in slide-in-from-right-8 duration-500 pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setSelectedInvoiceId(null)} className="p-2 hover:bg-white rounded-xl text-slate-500 border border-transparent hover:border-slate-200 transition-all shadow-sm"><ChevronLeft size={24} /></button>
            <div>
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded-md text-[10px] font-black uppercase tracking-widest">#{selectedInvoice.orderNumber}</span>
                <h2 className="text-2xl font-black text-slate-800">{isEditing ? 'Editando Documento' : `${selectedInvoice.documentTypeCode} ${selectedInvoice.documentNumber}`}</h2>
              </div>
              <p className="text-sm text-slate-500 font-medium">Visualização detalhada do lançamento</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isEditing ? (
              <>
                <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-all"><Edit3 size={18} /> Editar</button>
                <button
                  onClick={() => removeInvoice(selectedInvoice)}
                  disabled={deletingId === selectedInvoice.id}
                  className="flex items-center gap-2 px-6 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-sm transition-all border border-red-200 disabled:opacity-50"
                >
                  {deletingId === selectedInvoice.id ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />} Eliminar
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-all">Cancelar</button>
                <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50">
                  {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Salvar Alterações
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><div className="w-1 h-1 bg-blue-600 rounded-full"></div> Informações do Fornecedor</h3>
                  <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100/50">
                    <p className="text-xl font-black text-slate-800">{selectedInvoice.supplierName}</p>
                    <p className="text-sm font-bold text-blue-600 mb-4">{selectedInvoice.nif}</p>
                    <div className="space-y-2 text-xs">
                      <div className="flex gap-2"><span className="text-slate-400 font-bold w-16">Email:</span><span className="text-slate-600 font-medium">{selectedInvoice.supplierEmail}</span></div>
                      <div className="flex gap-2"><span className="text-slate-400 font-bold w-16">Morada:</span><span className="text-slate-600 font-medium">{selectedInvoice.supplierAddress}</span></div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><div className="w-1 h-1 bg-blue-600 rounded-full"></div> Dados do Documento</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Tipo de Documento</label>
                      {isEditing ? (
                        <select value={editDocumentTypeId} onChange={(e) => setEditDocumentTypeId(e.target.value)} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none">
                          <option value="">Seleccionar...</option>
                          {documentTypes.map(dt => <option key={dt.id} value={dt.id}>{dt.code} - {dt.name}</option>)}
                        </select>
                      ) : <p className="text-lg font-bold text-slate-800">{selectedInvoice.documentTypeName} ({selectedInvoice.documentTypeCode})</p>}
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Nº Documento</label>
                      {isEditing ? <input type="text" value={editDocNumber} onChange={(e) => setEditDocNumber(e.target.value)} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none" /> : <p className="text-lg font-bold text-slate-800">{selectedInvoice.documentNumber}</p>}
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Data de Lançamento</label>
                      {isEditing ? <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none" /> : <p className="text-lg font-bold text-slate-800">{selectedInvoice.date}</p>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 pt-4 border-t border-slate-100"><Layers size={14} className="text-blue-600" /> Detalhamento de Impostos</h3>
                <div className="overflow-hidden border border-slate-100 rounded-2xl">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <tr>
                        <th className="px-6 py-3">Base Tributável</th>
                        <th className="px-6 py-3 text-center">IVA (%)</th>
                        <th className="px-6 py-3 text-right">IVA Suportado</th>
                        <th className="px-6 py-3 text-right">Retenção (6.5%)</th>
                        <th className="px-6 py-3 text-right">IVA Dedutível</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {selectedInvoice.lines.map((line) => (
                        <tr key={line.id}>
                          <td className="px-6 py-4 font-bold text-slate-700">{line.taxableValue.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA</td>
                          <td className="px-6 py-4 text-center"><span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full">{line.rate}%</span></td>
                          <td className="px-6 py-4 text-right font-bold text-slate-600">{line.supportedVat.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}</td>
                          <td className="px-6 py-4 text-right font-bold text-amber-600">{line.withholdingAmount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}</td>
                          <td className="px-6 py-4 text-right font-black text-emerald-600">{line.deductibleVat.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-900 text-white font-black">
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-sm uppercase tracking-widest">TOTAL DO DOCUMENTO</td>
                        <td className="px-6 py-4 text-right text-lg">{selectedInvoice.totalDocument.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Notas e Observações</h3>
              {isEditing ? <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} className="w-full h-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none font-medium text-slate-700" placeholder="Observações..." /> : <p className="text-sm text-slate-600 font-medium italic leading-relaxed">{selectedInvoice.notes ? `"${selectedInvoice.notes}"` : 'Sem notas.'}</p>}
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Anexo e Documentação</h3>
              {isEditing ? (
                <div className="space-y-4">
                  <input type="file" accept="application/pdf" ref={fileInputRef} onChange={(e) => e.target.files && setNewFile(e.target.files[0])} className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className={`w-full h-14 flex items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-all font-bold text-sm ${newFile ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-blue-100 text-slate-400'}`}>
                    {newFile ? <FileCheck2 size={20} /> : <Upload size={20} />}
                    <span className="truncate">{newFile ? newFile.name : (selectedInvoice.hasPdf ? 'Substituir PDF Atual' : 'Anexar PDF')}</span>
                  </button>
                  {selectedInvoice.hasPdf && !newFile && <p className="text-[10px] font-bold text-slate-400">Pode carregar um novo ficheiro para substituir o actual.</p>}
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedInvoice.hasPdf ? (
                    <button onClick={() => handleDownload(selectedInvoice)} disabled={isDownloading === selectedInvoice.id} className="w-full flex items-center justify-between p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50">
                      <div className="flex items-center gap-3">{isDownloading === selectedInvoice.id ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}<span className="text-sm font-bold">Baixar Ficheiro PDF</span></div>
                      <FileCheck2 size={18} className="opacity-50" />
                    </button>
                  ) : (
                    <div className="w-full flex items-center gap-3 p-4 bg-slate-50 text-slate-400 rounded-2xl cursor-not-allowed font-bold text-sm"><FileX2 size={20} /> Sem PDF anexado</div>
                  )}
                  <button onClick={() => window.print()} className="w-full flex items-center gap-3 p-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl transition-all shadow-lg active:scale-95"><Printer size={20} /> <span className="text-sm font-bold">Imprimir Resumo</span></button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col xl:flex-row items-center justify-between gap-4">
        <div className="bg-white p-4 px-6 rounded-3xl border border-slate-200 shadow-sm flex-1 w-full">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[250px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text" placeholder="Pesquisar por Fornecedor ou Documento..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 font-medium"
              />
            </div>
            <div className="flex items-center gap-2">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" />
              <span className="text-slate-300 font-black">/</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" />
            </div>
            <select value={filterSupplier} onChange={(e) => setFilterSupplier(e.target.value)} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold">
              <option value="">Todos os Fornecedores</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full xl:w-auto">
          <button
            onClick={() => window.print()}
            className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <Printer size={18} />
            Imprimir
          </button>
          <button
            onClick={exportToExcel}
            className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <FileSpreadsheet size={18} className="text-emerald-600" />
            Exportar Excel
          </button>
          <button
            onClick={exportAttachmentsZip}
            disabled={isZipping}
            className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm transition-all shadow-xl shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
          >
            {isZipping ? <Loader2 className="animate-spin" size={18} /> : <FolderArchive size={18} />}
            {isZipping ? 'A Gerar ZIP...' : 'Exportar Anexos (ZIP)'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ORD</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fornecedor</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Data</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Doc#</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">IVA Dedutível</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Retenção</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                <th className="px-6 py-4 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((row) => {
                const supplier = suppliers.find(s => s.id === row.supplierId);
                const docType = documentTypes.find(dt => dt.id === row.documentTypeId);
                return (
                  <tr key={row.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4"><span className="text-xs font-black text-slate-400 group-hover:text-blue-600 transition-colors">#{row.orderNumber}</span></td>
                    <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[10px] font-black font-mono">{docType?.code || '---'}</span></td>
                    <td className="px-6 py-4"><p className="text-sm font-bold text-slate-800">{supplier?.name || 'N/A'}</p><p className="text-[10px] font-medium text-slate-500">{supplier?.nif || 'N/A'}</p></td>
                    <td className="px-6 py-4 text-center text-xs font-bold text-slate-600">{row.date}</td>
                    <td className="px-6 py-4 text-center"><span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-mono font-black text-slate-500 uppercase">{row.documentNumber}</span></td>
                    <td className="px-6 py-4 text-right"><span className="text-sm font-black text-emerald-600">{row.totalDeductible.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}</span></td>
                    <td className="px-6 py-4 text-right"><span className="text-sm font-black text-amber-600">{row.totalWithholding.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}</span></td>
                    <td className="px-6 py-4 text-right font-black text-slate-900">{row.totalDocument.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenDetails(row)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl transition-all shadow-sm active:scale-95"><Eye size={18} /></button>
                        <button
                          onClick={() => removeInvoice(row)}
                          disabled={deletingId === row.id}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
                        >
                          {deletingId === row.id ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-24 text-center text-slate-400 font-medium italic">Nenhum dado encontrado para os filtros seleccionados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Inquiry;
