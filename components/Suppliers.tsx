
import React, { useState } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  ChevronLeft,
  Save,
  Loader2,
  Building2,
  Mail,
  MapPin,
  Fingerprint,
  Globe,
  ShieldCheck,
  FileCheck,
  Upload,
  FileText,
  X,
  Eye
} from 'lucide-react';
import { Supplier, Invoice, Province, Municipality, SupplierAttachment } from '../types';

interface SuppliersProps {
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
}

type SubView = 'list' | 'create' | 'edit';

const Suppliers: React.FC<SuppliersProps> = ({ suppliers, setSuppliers, setInvoices }) => {
  const [currentSubView, setCurrentSubView] = useState<SubView>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [attachmentTitle, setAttachmentTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    const [provData, muniData] = await Promise.all([
      window.electron.db.getProvinces(),
      window.electron.db.getMunicipalities()
    ]);
    setProvinces(provData);
    setMunicipalities(muniData);
  };

  // Form State
  const [formData, setFormData] = useState<Partial<Supplier>>({
    name: '',
    nif: '',
    address: '',
    email: '',
    inAngola: true,
    ivaRegime: 'Geral',
    provinceId: '',
    municipalityId: '',
    conformityDeclarationNumber: '',
    attachments: []
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredSuppliers = suppliers.filter(s => {
    const name = (s.name || "").toLowerCase();
    const nif = (s.nif || "").toLowerCase();
    const term = searchTerm.toLowerCase();
    return name.includes(term) || nif.includes(term);
  });

  const resetForm = () => {
    setFormData({
      name: '',
      nif: '',
      address: '',
      email: '',
      inAngola: true,
      ivaRegime: 'Geral',
      provinceId: '',
      municipalityId: '',
      conformityDeclarationNumber: '',
      attachments: []
    });
    setError(null);
    setSelectedId(null);
    setAttachmentTitle('');
    setSelectedFile(null);
  };

  const handleEdit = (supplier: Supplier) => {
    setFormData(supplier);
    setSelectedId(supplier.id);
    setCurrentSubView('edit');
  };

  const handleBack = () => {
    setCurrentSubView('list');
    resetForm();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const addAttachment = async () => {
    if (!attachmentTitle.trim() || !selectedFile) {
      alert('Por favor, preencha o título e seleccione um ficheiro.');
      return;
    }

    try {
      const buffer = await selectedFile.arrayBuffer();
      const filePath = await window.electron.fs.saveFile(selectedFile.name, buffer);

      const newAttachment: SupplierAttachment = {
        id: crypto.randomUUID(),
        supplierId: selectedId || '',
        title: attachmentTitle.trim(),
        filePath: filePath
      };

      setFormData(prev => ({
        ...prev,
        attachments: [...(prev.attachments || []), newAttachment]
      }));

      setAttachmentTitle('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      alert(`Erro ao guardar anexo: ${err.message}`);
    }
  };

  const removeAttachment = (id: string) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments?.filter(a => a.id !== id) || []
    }));
  };

  const openAttachment = async (path: string) => {
    try {
      await window.electron.fs.openFile(path);
    } catch (err: any) {
      alert(`Erro ao abrir ficheiro: ${err.message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const supplierToSave = {
        ...formData,
        id: selectedId || crypto.randomUUID()
      };

      if (currentSubView === 'create') {
        await window.electron.db.addSupplier(supplierToSave);
        if (formData.attachments) {
          for (const att of formData.attachments) {
            await window.electron.db.addSupplierAttachment({ ...att, supplierId: supplierToSave.id });
          }
        }
        setSuppliers([...suppliers, supplierToSave as Supplier]);
      } else if (currentSubView === 'edit' && selectedId) {
        await window.electron.db.updateSupplier(supplierToSave);
        const existingAttachments = await window.electron.db.getSupplierAttachments(selectedId);
        const newAttachments = formData.attachments?.filter(a => !existingAttachments.some(ea => ea.id === a.id)) || [];
        for (const att of newAttachments) {
          await window.electron.db.addSupplierAttachment({ ...att, supplierId: selectedId });
        }
        const deletedAttachments = existingAttachments.filter(ea => !formData.attachments?.some(a => a.id === ea.id));
        for (const att of deletedAttachments) {
          await window.electron.db.deleteSupplierAttachment(att.id);
        }
        setSuppliers(suppliers.map(s => s.id === selectedId ? supplierToSave as Supplier : s));
      }

      setCurrentSubView('list');
      resetForm();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeSupplier = async (id: string) => {
    if (!confirm('ATENÇÃO: Ao remover este fornecedor, todas as facturas associadas serão eliminadas permanentemente. Deseja continuar?')) return;

    setDeletingId(id);
    setError(null);

    try {
      await window.electron.db.deleteSupplier(id);
      setSuppliers(prev => prev.filter(s => s.id !== id));
      setInvoices(prev => prev.filter(inv => inv.supplierId !== id));
    } catch (err: any) {
      alert(`Erro ao remover fornecedor: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  if (currentSubView === 'create' || currentSubView === 'edit') {
    return (
      <div className="animate-in slide-in-from-right-8 duration-500 max-w-4xl mx-auto pb-12">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-semibold transition-colors group"
          >
            <div className="p-2 bg-white border border-slate-200 rounded-xl group-hover:border-slate-300 shadow-sm">
              <ChevronLeft size={20} />
            </div>
            Voltar à Lista
          </button>
          <h2 className="text-2xl font-black text-slate-800">
            {currentSubView === 'create' ? 'Novo Fornecedor' : 'Editar Fornecedor'}
          </h2>
          <div className="w-24"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold animate-in shake duration-300">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 md:p-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Building2 size={12} className="text-blue-600" />
                    Nome da Empresa
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Ex: Consultoria Geral, Lda"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Fingerprint size={12} className="text-blue-600" />
                    NIF (Número de Identificação Fiscal)
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="5412345678"
                    value={formData.nif}
                    onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Mail size={12} className="text-blue-600" />
                    Endereço de Email
                  </label>
                  <input
                    type="email"
                    placeholder="contacto@empresa.ao"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <MapPin size={12} className="text-blue-600" />
                    Morada Completa
                  </label>
                  <input
                    type="text"
                    placeholder="Rua Direita, Luanda"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Globe size={12} className="text-blue-600" />
                    Em Angola?
                  </label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, inAngola: true })}
                      className={`flex-1 py-3.5 rounded-2xl font-bold transition-all ${formData.inAngola ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}
                    >
                      Sim
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, inAngola: false })}
                      className={`flex-1 py-3.5 rounded-2xl font-bold transition-all ${!formData.inAngola ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}
                    >
                      Não
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck size={12} className="text-blue-600" />
                    Regime do IVA
                  </label>
                  <select
                    value={formData.ivaRegime}
                    onChange={(e) => setFormData({ ...formData, ivaRegime: e.target.value as any })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 transition-all appearance-none"
                  >
                    <option value="Geral">Regime Geral</option>
                    <option value="Simplificado">Regime Simplificado</option>
                    <option value="Exclusão">Regime de Exclusão</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <MapPin size={12} className="text-blue-600" />
                    Província
                  </label>
                  <select
                    value={formData.provinceId}
                    onChange={(e) => setFormData({ ...formData, provinceId: e.target.value, municipalityId: '' })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 transition-all appearance-none"
                  >
                    <option value="">Seleccionar Província...</option>
                    {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Building2 size={12} className="text-blue-600" />
                    Município
                  </label>
                  <select
                    value={formData.municipalityId}
                    onChange={(e) => setFormData({ ...formData, municipalityId: e.target.value })}
                    disabled={!formData.provinceId}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 transition-all appearance-none disabled:opacity-50"
                  >
                    <option value="">Seleccionar Município...</option>
                    {municipalities.filter(m => m.provinceId === formData.provinceId).map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <FileCheck size={12} className="text-blue-600" />
                    Nº da Declaração de Conformidade
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: DC-2024-001"
                    value={formData.conformityDeclarationNumber}
                    onChange={(e) => setFormData({ ...formData, conformityDeclarationNumber: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 transition-all"
                  />
                </div>
              </div>

              <div className="mt-12 pt-12 border-t border-slate-100 space-y-6">
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <Upload size={20} className="text-blue-600" />
                  Anexos e Documentos
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-slate-50 p-6 rounded-3xl border border-slate-200">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Título do Anexo</label>
                    <input
                      type="text"
                      placeholder="Ex: Contrato"
                      value={attachmentTitle}
                      onChange={(e) => setAttachmentTitle(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ficheiro</label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-xl flex items-center gap-2 font-bold text-sm transition-all ${selectedFile ? 'text-blue-600 border-blue-200 bg-blue-50' : 'text-slate-400'}`}
                    >
                      <Upload size={16} />
                      <span className="truncate">{selectedFile ? selectedFile.name : 'Seleccionar...'}</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={addAttachment}
                    className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all active:scale-95"
                  >
                    Adicionar Anexo
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.attachments?.map((att) => (
                    <div key={att.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl group hover:border-blue-200 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                          <FileText size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800">{att.title}</p>
                          <p className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]">{att.filePath.split(/[\\/]/).pop()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openAttachment(att.filePath)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeAttachment(att.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-8 border-t border-slate-200 flex justify-end gap-4">
              <button
                type="button"
                onClick={handleBack}
                className="px-8 py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all active:scale-95"
              >
                Descartar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-12 py-4 bg-blue-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> {currentSubView === 'create' ? 'Criar Fornecedor' : 'Salvar Alterações'}</>}
              </button>
            </div>
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
            type="text"
            placeholder="Pesquisar por Nome ou NIF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm font-medium"
          />
        </div>
        <button
          onClick={() => setCurrentSubView('create')}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-3.5 rounded-2xl font-black transition-all shadow-xl shadow-slate-900/10 active:scale-95"
        >
          <Plus size={20} />
          <span>Novo Fornecedor</span>
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identificação da Empresa</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">NIF / Contribuinte</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Localização</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acções de Gestão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSuppliers.map((supplier) => {
                const province = provinces.find(p => p.id === supplier.provinceId);
                const municipality = municipalities.find(m => m.id === supplier.municipalityId);
                return (
                  <tr key={supplier.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-blue-600 flex items-center justify-center font-black text-lg shadow-sm group-hover:border-blue-200 transition-all">
                          {supplier.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-base">{supplier.name}</p>
                          <p className="text-xs text-slate-500 font-medium truncate max-w-[250px]">{supplier.email || 'Sem email registado'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col gap-1">
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black font-mono w-fit">
                          {supplier.nif}
                        </span>
                        <span className={`text-[10px] font-bold ${supplier.ivaRegime === 'Geral' ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {supplier.ivaRegime}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <p className="text-sm font-bold text-slate-700">{province?.name || '---'}</p>
                        <p className="text-xs text-slate-400 font-medium">{municipality?.name || '---'}</p>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(supplier)}
                          disabled={deletingId === supplier.id}
                          className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
                          title="Editar Fornecedor"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => removeSupplier(supplier.id)}
                          disabled={deletingId === supplier.id}
                          className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
                          title="Remover permanentemente"
                        >
                          {deletingId === supplier.id ? <Loader2 size={18} className="animate-spin text-red-600" /> : <Trash2 size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredSuppliers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <div className="p-6 bg-slate-50 rounded-full mb-4">
                        <Building2 size={64} className="opacity-10" />
                      </div>
                      <p className="text-lg font-bold text-slate-500">Nenhum fornecedor encontrado</p>
                      <p className="text-sm">Clique em "Novo Fornecedor" para começar o arquivo.</p>
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
};

export default Suppliers;
