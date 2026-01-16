import React from 'react';
import { X, Search, Receipt, FileText, Link } from 'lucide-react';

interface ArchiveLinkModalProps {
    show: boolean;
    searching: boolean;
    searchQuery: string;
    searchDocType: string;
    searchEntityType: string;
    searchResults: any[];
    onClose: () => void;
    onSearchQueryChange: (query: string) => void;
    onDocTypeChange: (type: string) => void;
    onEntityTypeChange: (type: string) => void;
    onSearch: () => void;
    onLink: (docType: string, docId: string) => void;
}

export const ArchiveLinkModal: React.FC<ArchiveLinkModalProps> = ({
    show,
    searching,
    searchQuery,
    searchDocType,
    searchEntityType,
    searchResults,
    onClose,
    onSearchQueryChange,
    onDocTypeChange,
    onEntityTypeChange,
    onSearch,
    onLink
}) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-800">Vincular Documentos</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                        <X size={20} className="text-slate-50" />
                    </button>
                </div>

                <div className="p-6 space-y-4 flex-1 overflow-hidden flex flex-col">
                    <div className="space-y-3">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Pesquisar por número, descrição ou entidade..."
                                    value={searchQuery}
                                    onChange={e => onSearchQueryChange(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && onSearch()}
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>
                            <button
                                onClick={onSearch}
                                disabled={searching}
                                className="px-6 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-bold disabled:opacity-50"
                            >
                                {searching ? '...' : 'Pesquisar'}
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 px-1">Tipo de Documento</label>
                                <select
                                    value={searchDocType}
                                    onChange={e => onDocTypeChange(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                                >
                                    <option value="all">Todos os Tipos</option>
                                    <option value="general">Documentos Gerais</option>
                                    <option value="invoice">Documentos Comerciais (FT, FR, etc.)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 px-1">Entidade Relacionada</label>
                                <select
                                    value={searchEntityType}
                                    onChange={e => onEntityTypeChange(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                                >
                                    <option value="all">Todas as Entidades</option>
                                    <option value="supplier">Fornecedores</option>
                                    <option value="client">Clientes</option>
                                    <option value="staff">Funcionários</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                        {searchResults.map(result => (
                            <div key={result.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 group hover:border-blue-300 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${result.doc_type === 'invoice' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {result.doc_type === 'invoice' ? <Receipt size={18} /> : <FileText size={18} />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800 leading-tight">
                                            {result.doc_type === 'invoice' ? `${result.document_type_code} ${result.document_number}` : result.description}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {result.entity_name && <span className="font-bold text-slate-700">{result.entity_name} • </span>}
                                            {result.date || result.issue_date} • {result.doc_type === 'invoice' ? 'Comercial' : 'Geral'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onLink(result.doc_type, result.id)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-white text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-xs font-bold"
                                >
                                    <Link size={14} />
                                    Vincular
                                </button>
                            </div>
                        ))}
                        {searchResults.length === 0 && !searching && (
                            <div className="text-center py-12 text-slate-400">
                                <Search size={48} className="mx-auto mb-4 opacity-10" />
                                <p className="text-sm">Nenhum documento encontrado com os filtros atuais</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
