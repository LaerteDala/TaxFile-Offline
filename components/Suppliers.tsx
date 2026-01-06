
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
  Fingerprint
} from 'lucide-react';
import { Supplier, Invoice } from '../types';
import { supabase } from '../lib/supabase';

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
  
  // Form State
  const [formData, setFormData] = useState<Partial<Supplier>>({
    name: '',
    nif: '',
    address: '',
    email: ''
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredSuppliers = suppliers.filter(s => {
    const name = (s.name || "").toLowerCase();
    const nif = (s.nif || "").toLowerCase();
    const term = searchTerm.toLowerCase();
    return name.includes(term) || nif.includes(term);
  });

  const resetForm = () => {
    setFormData({ name: '', nif: '', address: '', email: '' });
    setError(null);
    setSelectedId(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (currentSubView === 'create') {
        const { data, error: supError } = await supabase
          .from('suppliers')
          .insert([formData])
          .select();

        if (supError) {
          if (supError.code === '23505') throw new Error('Este NIF já está registado para outro fornecedor.');
          throw supError;
        }
        setSuppliers([...suppliers, data[0]]);
      } else if (currentSubView === 'edit' && selectedId) {
        const { data, error: supError } = await supabase
          .from('suppliers')
          .update(formData)
          .eq('id', selectedId)
          .select();

        if (supError) {
          if (supError.code === '23505') throw new Error('Este NIF já está registado para outro fornecedor.');
          throw supError;
        }
        setSuppliers(suppliers.map(s => s.id === selectedId ? data[0] : s));
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
      // O Supabase irá remover as facturas via CASCADE configurado no banco
      const { error: supError } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);

      if (supError) throw supError;

      // 1. Remover do estado local de fornecedores
      setSuppliers(prev => prev.filter(s => s.id !== id));
      
      // 2. Remover do estado local de facturas (sincronizar UI)
      setInvoices(prev => prev.filter(inv => inv.supplierId !== id));
      
      console.log('Fornecedor removido com sucesso.');
    } catch (err: any) {
      console.error('Erro ao eliminar:', err);
      alert(`Erro ao remover fornecedor: ${err.message || 'Verifique sua conexão ou permissões.'}`);
    } finally {
      setDeletingId(null);
    }
  };

  // Renderização da Vista de Formulário (Criar ou Editar)
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
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
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
                    onChange={(e) => setFormData({...formData, nif: e.target.value})} 
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
                    onChange={(e) => setFormData({...formData, email: e.target.value})} 
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
                    onChange={(e) => setFormData({...formData, address: e.target.value})} 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 transition-all"
                  />
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

  // Renderização da Vista de Listagem
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
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contacto</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acções de Gestão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSuppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-blue-600 flex items-center justify-center font-black text-lg shadow-sm group-hover:border-blue-200 transition-all">
                        {supplier.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-base">{supplier.name}</p>
                        <p className="text-xs text-slate-500 font-medium truncate max-w-[250px]">{supplier.address || 'Sem morada registada'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black font-mono">
                      {supplier.nif}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-sm font-bold text-slate-700">{supplier.email || 'N/A'}</p>
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
              ))}
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
