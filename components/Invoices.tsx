
import React, { useState, useMemo, useRef } from 'react';
import {
  Plus, Search, Trash2, FilePlus2, Upload, ChevronLeft, AlertCircle,
  FileCheck2, Calendar, Layers, Loader2, X, Building2, Hash, FileText,
  Eye, Edit3, Save, Download, FileX2, CheckSquare, Square, Folder
} from 'lucide-react';
import { Invoice, Supplier, Client, TaxLine, DocumentType, WithholdingType, CompanyInfo, Archive, IVAClassification, StampDutyClassification, IndustrialTaxClassification } from '../types';

interface InvoicesProps {
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  suppliers: Supplier[];
  clients: Client[];
  documentTypes: DocumentType[];
  withholdingTypes: WithholdingType[];
  initialInvoice?: Invoice | null;
  onClose?: () => void;
  ivaClassifications: IVAClassification[];
  stampDutyClassifications: StampDutyClassification[];
  industrialTaxClassifications: IndustrialTaxClassification[];
}

const Invoices: React.FC<InvoicesProps> = ({
  invoices, setInvoices, suppliers, clients, documentTypes, withholdingTypes,
  initialInvoice, onClose,
  ivaClassifications, stampDutyClassifications, industrialTaxClassifications
}) => {
  const [showCreator, setShowCreator] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [invoiceType, setInvoiceType] = useState<'PURCHASE' | 'SALE'>('PURCHASE');
  const [supplierId, setSupplierId] = useState('');
  const [clientId, setClientId] = useState('');
  const [documentTypeId, setDocumentTypeId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [taxLines, setTaxLines] = useState<TaxLine[]>([
    { id: crypto.randomUUID(), taxableValue: 0, rate: 14, supportedVat: 0, deductibleVat: 0, liquidatedVat: 0, cativeVat: 0, isService: false, withholdingAmount: 0 }
  ]);
  const [archiveIds, setArchiveIds] = useState<string[]>([]);
  const [archives, setArchives] = useState<Archive[]>([]);
  const [archiveSearch, setArchiveSearch] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);

  React.useEffect(() => {
    window.electron.db.getCompanyInfo().then(setCompanyInfo);
    window.electron.db.getArchives().then(setArchives);
  }, []);

  React.useEffect(() => {
    if (initialInvoice) {
      handleEdit(initialInvoice);
    }
  }, [initialInvoice]);

  // Recalculate cative VAT for all lines when client or invoice type changes
  React.useEffect(() => {
    if (invoiceType === 'SALE' && clientId) {
      const client = clients.find(c => c.id === clientId);
      const cativeRate = client?.cativeVatRate ?? 0;
      setTaxLines(prev => prev.map(line => ({
        ...line,
        cativeVat: Number((line.liquidatedVat * (cativeRate / 100)).toFixed(2))
      })));
    } else if (invoiceType === 'PURCHASE') {
      setTaxLines(prev => prev.map(line => ({
        ...line,
        liquidatedVat: 0,
        cativeVat: 0,
        supportedVat: Number((line.taxableValue * (line.rate / 100)).toFixed(2)),
        deductibleVat: Number((line.taxableValue * (line.rate / 100)).toFixed(2))
      })));
    }
  }, [clientId, invoiceType, clients]);

  const totals = useMemo(() => {
    return taxLines.reduce((acc, line) => ({
      taxable: acc.taxable + line.taxableValue,
      supported: acc.supported + line.supportedVat,
      deductible: acc.deductible + line.deductibleVat,
      liquidated: acc.liquidated + line.liquidatedVat,
      cative: acc.cative + line.cativeVat,
      withholding: acc.withholding + line.withholdingAmount,
      document: acc.document + line.taxableValue + (invoiceType === 'PURCHASE' ? line.supportedVat : line.liquidatedVat) - line.withholdingAmount
    }), { taxable: 0, supported: 0, deductible: 0, liquidated: 0, cative: 0, withholding: 0, document: 0 });
  }, [taxLines, invoiceType]);

  const addLine = () => {
    setTaxLines([...taxLines, { id: crypto.randomUUID(), taxableValue: 0, rate: 14, supportedVat: 0, deductibleVat: 0, liquidatedVat: 0, cativeVat: 0, isService: false, withholdingAmount: 0 }]);
  };

  const updateLine = (id: string, field: keyof TaxLine, value: any) => {
    setTaxLines(taxLines.map(line => {
      if (line.id === id) {
        const updated = { ...line, [field]: value };

        // Recalculate VAT
        if (field === 'taxableValue' || field === 'rate') {
          const vat = Number((updated.taxableValue * (updated.rate / 100)).toFixed(2));
          if (invoiceType === 'PURCHASE') {
            updated.supportedVat = vat;
            updated.deductibleVat = vat;
            updated.liquidatedVat = 0;
            updated.cativeVat = 0;
          } else {
            updated.liquidatedVat = vat;

            // Calculate Cative VAT based on client's rate
            const client = clients.find(c => c.id === clientId);
            const cativeRate = client?.cativeVatRate ?? 0;
            updated.cativeVat = Number((vat * (cativeRate / 100)).toFixed(2));

            updated.supportedVat = 0;
            updated.deductibleVat = 0;
          }
        }

        // Recalculate Withholding
        if (field === 'taxableValue' || field === 'withholdingTypeId' || field === 'isService') {
          if (updated.isService) {
            let wtRate = 6.5; // Default for II, IRT B, IRT C

            if (updated.withholdingTypeId) {
              const wt = withholdingTypes.find(t => t.id === updated.withholdingTypeId);
              if (wt) {
                wtRate = wt.rate;
              }
            } else if (invoiceType === 'SALE') {
              // For Sales, if no specific type selected, use default 6.5% or 15% for Rent
              // We'll assume the user selects the type if it's Rent
            }

            updated.withholdingAmount = Number((updated.taxableValue * (wtRate / 100)).toFixed(2));
          } else {
            updated.withholdingAmount = 0;
            updated.withholdingTypeId = undefined;
          }
        }

        return updated;
      }
      return line;
    }));
  };

  const handleEdit = (inv: Invoice) => {
    setEditingInvoice(inv);
    setInvoiceType(inv.type);
    setSupplierId(inv.supplierId || '');
    setClientId(inv.clientId || '');
    setDocumentTypeId(inv.documentTypeId || '');
    setDate(inv.date);
    setDueDate(inv.dueDate || '');
    setDocNumber(inv.documentNumber);
    setNotes(inv.notes || '');
    setTaxLines(inv.lines);
    setArchiveIds(inv.archiveIds || []);
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
        type: invoiceType,
        orderNumber: editingInvoice?.orderNumber || (invoices.length > 0 ? Math.max(...invoices.map(i => i.orderNumber)) + 1 : 1),
        supplierId: invoiceType === 'PURCHASE' ? supplierId : undefined,
        clientId: invoiceType === 'SALE' ? clientId : undefined,
        documentTypeId,
        date,
        dueDate: dueDate || null,
        documentNumber: docNumber,
        notes,
        archiveIds,
        hasPdf: !!storagePath,
        pdfPath: storagePath,
        totalTaxable: totals.taxable,
        totalSupported: totals.supported,
        totalDeductible: totals.deductible,
        totalLiquidated: totals.liquidated,
        totalCative: totals.cative,
        totalWithholding: totals.withholding,
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
        lines: taxLines,
        totalLiquidated: totals.liquidated,
        totalCative: totals.cative
      };

      if (editingInvoice) {
        setInvoices(invoices.map(i => i.id === editingInvoice.id ? finalInvoice : i));
      } else {
        setInvoices([finalInvoice, ...invoices]);
      }

      setShowCreator(false);
      resetForm();
      if (onClose) onClose();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEditingInvoice(null);
    setInvoiceType('PURCHASE');
    setSupplierId('');
    setClientId('');
    setDocumentTypeId('');
    setDocNumber('');
    setDueDate('');
    setNotes('');
    setArchiveIds([]);
    setSelectedFile(null);
    setTaxLines([{ id: crypto.randomUUID(), taxableValue: 0, rate: 14, supportedVat: 0, deductibleVat: 0, liquidatedVat: 0, cativeVat: 0, isService: false, withholdingAmount: 0 }]);
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
      <div className="animate-in slide-in-from-right-8 duration-500 pb-20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => { setShowCreator(false); resetForm(); if (onClose) onClose(); }}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                {editingInvoice ? `Editando Factura #${editingInvoice.orderNumber}` : 'Nova Factura'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">Preencha os dados abaixo para lançar o documento</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setInvoiceType('PURCHASE')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${invoiceType === 'PURCHASE' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Compra
              </button>
              <button
                type="button"
                onClick={() => setInvoiceType('SALE')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${invoiceType === 'SALE' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Venda
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {formError && (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-3 border border-red-100 font-bold text-sm animate-in shake duration-300">
              <AlertCircle size={18} />
              <span>{formError}</span>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="p-6 grid grid-cols-12 gap-6">

              {/* Row 1: Entity & Document Info */}
              <div className="col-span-12 md:col-span-4 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {invoiceType === 'PURCHASE' ? 'Fornecedor' : 'Cliente'} <span className="text-red-500">*</span>
                </label>
                <select
                  value={invoiceType === 'PURCHASE' ? supplierId : clientId}
                  onChange={(e) => invoiceType === 'PURCHASE' ? setSupplierId(e.target.value) : setClientId(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-medium text-slate-700 transition-all"
                  required
                >
                  <option value="">Seleccione...</option>
                  {invoiceType === 'PURCHASE'
                    ? suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                    : clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                  }
                </select>
              </div>

              <div className="col-span-12 md:col-span-3 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Tipo de Documento <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={documentTypeId}
                  onChange={(e) => setDocumentTypeId(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-medium text-slate-700 transition-all"
                >
                  <option value="">Seleccione...</option>
                  {documentTypes.map(dt => <option key={dt.id} value={dt.id}>{dt.code} - {dt.name}</option>)}
                </select>
              </div>

              <div className="col-span-12 md:col-span-3 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Nº do Documento <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="Ex: FA 2024/001"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-medium text-slate-700 transition-all"
                />
              </div>

              <div className="col-span-12 md:col-span-2 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Data Emissão <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-medium text-slate-700 transition-all"
                />
              </div>

              {/* Row 2: Secondary Info */}
              <div className="col-span-12 md:col-span-2 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Vencimento
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-medium text-slate-700 transition-all"
                />
              </div>

              <div className="col-span-12 md:col-span-5 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Anexo Digital (PDF)
                </label>
                <input type="file" accept="application/pdf" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex-1 h-10 flex items-center justify-center gap-2 rounded-md border border-dashed transition-all font-medium text-xs ${selectedFile ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-slate-50 border-slate-300 text-slate-500 hover:bg-slate-100'}`}
                  >
                    {selectedFile ? <FileCheck2 size={14} /> : <Upload size={14} />}
                    <span className="truncate max-w-[200px]">{selectedFile ? selectedFile.name : (editingInvoice?.hasPdf ? 'Substituir PDF' : 'Carregar PDF')}</span>
                  </button>
                  {editingInvoice?.hasPdf && !selectedFile && (
                    <button type="button" onClick={() => handleDownload(editingInvoice)} className="h-10 px-3 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-md hover:bg-emerald-100 transition-colors" title="Ver PDF Atual">
                      <Eye size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div className="col-span-12 md:col-span-5 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Arquivos (Dossiers)
                </label>
                <div className="relative">
                  <div className="flex flex-wrap gap-1 absolute top-1.5 left-2 right-8 pointer-events-none">
                    {archiveIds.map(id => {
                      const archive = archives.find(a => a.id === id);
                      if (!archive) return null;
                      return (
                        <span key={id} className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold flex items-center gap-1 shadow-sm">
                          {archive.description}
                        </span>
                      );
                    })}
                  </div>
                  <select
                    onChange={(e) => {
                      if (e.target.value && !archiveIds.includes(e.target.value)) {
                        setArchiveIds([...archiveIds, e.target.value]);
                      }
                      e.target.value = '';
                    }}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-medium text-slate-700 transition-all"
                  >
                    <option value="">+ Adicionar a Arquivo...</option>
                    {archives.map(a => <option key={a.id} value={a.id}>{a.code} - {a.description}</option>)}
                  </select>
                  {archiveIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setArchiveIds([])}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"
                      title="Limpar Arquivos"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                <Layers size={16} className="text-blue-600" /> Detalhes do Documento
              </h3>
              <button type="button" onClick={addLine} className="text-blue-600 font-bold text-xs hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-md border border-blue-100 transition-colors">
                <Plus size={14} /> Adicionar Linha
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-16 text-center">Serviço</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-40">Valor (AOA)</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-24 text-center">Taxa</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-32 text-right">{invoiceType === 'PURCHASE' ? 'Sup.' : 'Liq.'}</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-32 text-right">{invoiceType === 'PURCHASE' ? 'Ded.' : 'Cat.'}</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-40">Retenção</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-28 text-right">V. Retido</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Classificação</th>
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {taxLines.map(l => (
                    <tr key={l.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-4 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={l.isService}
                          onChange={() => updateLine(l.id, 'isService', !l.isService)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number" step="0.01" value={l.taxableValue || ''}
                          onChange={(e) => updateLine(l.id, 'taxableValue', parseFloat(e.target.value) || 0)}
                          className="w-full h-8 px-2 bg-white border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 outline-none text-xs font-medium text-slate-900 text-right"
                          placeholder="0,00"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={l.rate} onChange={(e) => updateLine(l.id, 'rate', parseFloat(e.target.value))}
                          className="w-full h-8 px-1 bg-white border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 outline-none text-xs font-medium text-slate-900 text-center"
                        >
                          <option value="14">14%</option>
                          <option value="7">7%</option>
                          <option value="5">5%</option>
                          <option value="2">2%</option>
                          <option value="0">0%</option>
                        </select>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <span className="text-xs font-medium text-slate-600">
                          {(invoiceType === 'PURCHASE' ? l.supportedVat : l.liquidatedVat).toLocaleString('pt-AO', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <span className="text-xs font-medium text-slate-600">
                          {(invoiceType === 'PURCHASE' ? l.deductibleVat : l.cativeVat).toLocaleString('pt-AO', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <select
                          disabled={!l.isService}
                          value={l.withholdingTypeId || ''}
                          onChange={(e) => updateLine(l.id, 'withholdingTypeId', e.target.value)}
                          className={`w-full h-8 px-2 border rounded focus:ring-1 focus:ring-blue-500 outline-none text-[11px] ${!l.isService ? 'bg-slate-50 border-slate-100 text-slate-300' : 'bg-white border-slate-200 text-slate-900'}`}
                        >
                          <option value="">-</option>
                          {withholdingTypes
                            .filter(wt => {
                              if (invoiceType === 'PURCHASE') return true;
                              return wt.name === companyInfo?.serviceRegime || wt.name === 'Imposto Predial';
                            })
                            .map(wt => <option key={wt.id} value={wt.id}>{wt.name} ({wt.rate}%)</option>)
                          }
                        </select>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <span className={`text-xs font-medium ${l.withholdingAmount > 0 ? 'text-amber-600' : 'text-slate-300'}`}>
                          {l.withholdingAmount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex flex-col gap-1">
                          {!!documentTypes.find(dt => dt.id === documentTypeId)?.subjectToIVA && (
                            <select
                              value={l.ivaClassificationId || ''}
                              onChange={(e) => updateLine(l.id, 'ivaClassificationId', e.target.value)}
                              className="w-full h-7 px-1 bg-white border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 outline-none text-[10px] text-slate-700"
                            >
                              <option value="">IVA...</option>
                              {ivaClassifications.map(c => <option key={c.id} value={c.id}>{c.code} - {c.description.substring(0, 30)}...</option>)}
                            </select>
                          )}
                          {!!documentTypes.find(dt => dt.id === documentTypeId)?.subjectToStampDuty && (
                            <select
                              value={l.stampDutyClassificationId || ''}
                              onChange={(e) => updateLine(l.id, 'stampDutyClassificationId', e.target.value)}
                              className="w-full h-7 px-1 bg-white border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 outline-none text-[10px] text-slate-700"
                            >
                              <option value="">IS...</option>
                              {stampDutyClassifications.map(c => <option key={c.id} value={c.id}>{c.code} - {c.description.substring(0, 30)}...</option>)}
                            </select>
                          )}
                          {!!documentTypes.find(dt => dt.id === documentTypeId)?.subjectToIndustrialTax && (
                            <select
                              value={l.industrialTaxClassificationId || ''}
                              onChange={(e) => updateLine(l.id, 'industrialTaxClassificationId', e.target.value)}
                              className="w-full h-7 px-1 bg-white border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 outline-none text-[10px] text-slate-700"
                            >
                              <option value="">II...</option>
                              {industrialTaxClassifications.map(c => <option key={c.id} value={c.id}>{c.code} - {c.description.substring(0, 30)}...</option>)}
                            </select>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button type="button" onClick={() => setTaxLines(taxLines.filter(x => x.id !== l.id))} className="text-slate-300 hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer / Totals */}
            <div className="bg-slate-50 border-t border-slate-200 p-6 grid grid-cols-12 gap-8">
              <div className="col-span-12 md:col-span-6">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                  Notas Internas
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observações..."
                  className="w-full h-24 p-3 bg-white border border-slate-200 rounded-md outline-none resize-none text-sm text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <div className="col-span-12 md:col-span-6 flex flex-col gap-3 justify-center">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Total Tributável</span>
                  <span className="font-bold text-slate-800">{totals.taxable.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">{invoiceType === 'PURCHASE' ? 'IVA Suportado' : 'IVA Liquidado'}</span>
                  <span className="font-bold text-slate-800">{(invoiceType === 'PURCHASE' ? totals.supported : totals.liquidated).toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">{invoiceType === 'PURCHASE' ? 'IVA Dedutível' : 'IVA Cativo'}</span>
                  <span className="font-bold text-emerald-600">{(invoiceType === 'PURCHASE' ? totals.deductible : totals.cative).toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Total Retenção</span>
                  <span className="font-bold text-amber-600">{totals.withholding.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA</span>
                </div>
                <div className="h-px bg-slate-200 my-1"></div>
                <div className="flex justify-between items-center text-lg">
                  <span className="text-slate-800 font-black">Total Documento</span>
                  <span className="font-black text-blue-600">{totals.document.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => { setShowCreator(false); resetForm(); if (onClose) onClose(); }}
              className="px-6 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit" disabled={isSubmitting}
              className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50 text-sm"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <>{editingInvoice ? <Save size={18} /> : <FilePlus2 size={18} />} {editingInvoice ? 'Guardar Alterações' : 'Lançar Documento'}</>}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text" placeholder="Pesquisar facturas..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-700"
          />
        </div>
        <button
          onClick={() => { resetForm(); setShowCreator(true); }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-bold transition-all shadow-sm active:scale-95 text-sm"
        >
          <Plus size={18} />
          <span>Lançar Factura</span>
        </button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-20">ORD</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-24">Tipo</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Entidade</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center w-32">Data</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center w-32">Doc#</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center w-28">Estado</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right w-40">Valor Total</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right w-28">Acções</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.filter(i => {
                const s = suppliers.find(sup => sup.id === i.supplierId);
                const c = clients.find(cl => cl.id === i.clientId);
                const term = searchTerm.toLowerCase();
                return (i.documentNumber || "").toLowerCase().includes(term) ||
                  (s?.name || "").toLowerCase().includes(term) ||
                  (c?.name || "").toLowerCase().includes(term);
              }).map(i => {
                const docType = documentTypes.find(dt => dt.id === i.documentTypeId);
                const docCode = docType?.code || i.documentTypeId || '?';

                return (
                  <tr key={i.id} className="hover:bg-slate-50 transition-colors group cursor-default">
                    <td className="px-4 py-3"><span className="text-xs font-bold text-slate-400 group-hover:text-blue-600 transition-colors">#{i.orderNumber}</span></td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${docCode === 'FT' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        docCode === 'FR' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          docCode === 'NC' ? 'bg-red-50 text-red-700 border-red-100' :
                            'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                        {docCode}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700 text-sm truncate max-w-[250px]">
                          {i.type === 'PURCHASE'
                            ? (suppliers.find(s => s.id === i.supplierId)?.name || 'N/A')
                            : (clients.find(c => c.id === i.clientId)?.name || 'N/A')
                          }
                        </span>
                        {i.archives && i.archives.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {i.archives.map(a => (
                              <span key={a.id} className="text-[9px] text-blue-600 flex items-center gap-0.5">
                                <Folder size={8} /> {a.description}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center"><span className="text-xs font-medium text-slate-600">{i.date}</span></td>
                    <td className="px-4 py-3 text-center"><span className="text-xs font-medium text-slate-600 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{i.documentNumber}</span></td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[10px] font-bold flex items-center justify-center gap-1 w-fit mx-auto">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Emitida
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800 text-sm">{i.totalDocument.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(i)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Editar">
                          <Edit3 size={16} />
                        </button>
                        {i.hasPdf && (
                          <button onClick={() => handleDownload(i)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="PDF">
                            <Download size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => removeInvoice(i)}
                          disabled={deletingId === i.id}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Eliminar"
                        >
                          {deletingId === i.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400 text-sm">
                    Nenhuma factura encontrada. Clique em "Lançar Factura" para começar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Invoices;
