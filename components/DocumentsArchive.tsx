import React, { useState, useEffect } from 'react';
import {
    Folder,
    FolderPlus,
    Search,
    ArrowLeft,
    MoreVertical,
    FileText,
    ChevronRight,
    Home,
    Plus,
    X,
    Link,
    Unlink,
    File,
    Receipt,
    Paperclip,
    Eye,
    Download,
    ExternalLink,
    Calendar,
    User,
    Tag,
    Info,
    Edit
} from 'lucide-react';
import { Archive, Supplier, Client, Staff } from '../types';

const DocumentsArchive: React.FC = () => {
    const [archives, setArchives] = useState<Archive[]>([]);
    const [linkedDocuments, setLinkedDocuments] = useState<any[]>([]);
    const [currentParentId, setCurrentParentId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [editingArchive, setEditingArchive] = useState<Archive | null>(null);
    const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
    const [folderSearchTerm, setFolderSearchTerm] = useState('');

    // Search/Link state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchDocType, setSearchDocType] = useState('all');
    const [searchEntityType, setSearchEntityType] = useState('all');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        code: '',
        description: '',
        period: '',
        date: '',
        notes: ''
    });

    useEffect(() => {
        loadArchives();
    }, []);

    useEffect(() => {
        if (currentParentId) {
            loadLinkedDocuments();
        } else {
            setLinkedDocuments([]);
        }
    }, [currentParentId]);

    const loadArchives = async () => {
        setLoading(true);
        try {
            const data = await window.electron.db.getArchives();
            setArchives(data);
        } catch (error) {
            console.error('Error loading archives:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadLinkedDocuments = async () => {
        if (!currentParentId) return;
        try {
            const docs = await window.electron.db.getDocumentsInArchive(currentParentId);
            setLinkedDocuments(docs);
        } catch (error) {
            console.error('Error loading linked documents:', error);
        }
    };

    const handleSearchDocuments = async () => {
        setSearching(true);
        try {
            const results = await window.electron.db.searchLinkableDocuments({
                query: searchQuery,
                docType: searchDocType,
                entityType: searchEntityType
            });
            setSearchResults(results);
        } catch (error) {
            console.error('Error searching documents:', error);
        } finally {
            setSearching(false);
        }
    };

    const handleLinkDocument = async (docType: string, docId: string) => {
        if (!currentParentId) return;
        try {
            await window.electron.db.linkDocumentToArchive(docType, docId, currentParentId);
            loadLinkedDocuments();
            setSearchResults(searchResults.filter(r => r.id !== docId));
        } catch (error) {
            console.error('Error linking document:', error);
        }
    };

    const handleUnlinkDocument = async (docType: string, docId: string) => {
        try {
            if (confirm('Remover este documento do arquivo?')) {
                await window.electron.db.unlinkDocumentFromArchive(docType, docId, currentParentId!);
                loadLinkedDocuments();
                if (selectedDoc?.id === docId) setSelectedDoc(null);
            }
        } catch (error) {
            console.error('Error unlinking document:', error);
        }
    };

    const handleDownload = async (filePath: string, fileName: string) => {
        try {
            const result = await window.electron.fs.downloadFile(filePath, fileName);
            if (result) {
                alert(`Arquivo salvo com sucesso em: ${result}`);
            }
        } catch (error) {
            console.error('Error downloading file:', error);
            alert('Erro ao baixar o arquivo.');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const dataToSave = {
                ...formData,
                parent_id: currentParentId
            };

            if (editingArchive) {
                await window.electron.db.updateArchive({ ...dataToSave, id: editingArchive.id });
            } else {
                await window.electron.db.addArchive(dataToSave);
            }
            setShowModal(false);
            setEditingArchive(null);
            setFormData({ code: '', description: '', period: '', date: '', notes: '' });
            loadArchives();
        } catch (error) {
            console.error('Error saving archive:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja eliminar este arquivo?')) {
            try {
                await window.electron.db.deleteArchive(id);
                loadArchives();
            } catch (error) {
                console.error('Error deleting archive:', error);
            }
        }
    };

    const openModal = (archive?: Archive) => {
        if (archive) {
            setEditingArchive(archive);
            setFormData({
                code: archive.code || '',
                description: archive.description,
                period: archive.period || '',
                date: archive.date || '',
                notes: archive.notes || ''
            });
        } else {
            setEditingArchive(null);
            setFormData({ code: '', description: '', period: '', date: '', notes: '' });
        }
        setShowModal(true);
    };

    // Navigation logic
    const currentArchives = archives.filter(a => a.parent_id === currentParentId);
    const filteredArchives = currentArchives.filter(a =>
        a.description.toLowerCase().includes(folderSearchTerm.toLowerCase()) ||
        (a.code && a.code.toLowerCase().includes(folderSearchTerm.toLowerCase()))
    );

    const getBreadcrumbs = () => {
        const crumbs = [];
        let current = currentParentId;
        while (current) {
            const parent = archives.find(a => a.id === current);
            if (parent) {
                crumbs.unshift(parent);
                current = parent.parent_id || null;
            } else {
                break;
            }
        }
        return crumbs;
    };

    const breadcrumbs = getBreadcrumbs();

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h2 className="text-2xl font-black text-slate-800">Arquivo Digital</h2>
                    <p className="text-slate-500 font-medium">Gestão de Dossiers e Arquivos</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-bold shadow-lg shadow-slate-900/20"
                >
                    <FolderPlus size={20} />
                    Novo Arquivo
                </button>
            </div>

            {/* Breadcrumbs & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-white p-4 rounded-xl border border-slate-200 shadow-sm overflow-x-auto flex-1">
                    <button
                        onClick={() => setCurrentParentId(null)}
                        className={`flex items-center gap-1 hover:text-blue-600 transition-colors ${!currentParentId ? 'text-blue-600 font-bold' : ''}`}
                    >
                        <Home size={16} />
                        Início
                    </button>
                    {breadcrumbs.map((crumb, index) => (
                        <React.Fragment key={crumb.id}>
                            <ChevronRight size={16} className="text-slate-400" />
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentParentId(crumb.id)}
                                    className={`hover:text-blue-600 transition-colors ${index === breadcrumbs.length - 1 ? 'text-blue-600 font-bold' : ''}`}
                                >
                                    {crumb.description}
                                </button>
                                {index === breadcrumbs.length - 1 && (
                                    <button
                                        onClick={() => openModal(crumb)}
                                        className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600 transition-all"
                                        title="Editar este arquivo"
                                    >
                                        <Edit size={14} />
                                    </button>
                                )}
                            </div>
                        </React.Fragment>
                    ))}
                </div>

                {currentParentId && (
                    <button
                        onClick={() => {
                            setShowLinkModal(true);
                            setSearchQuery('');
                            setSearchDocType('all');
                            setSearchEntityType('all');
                            // Trigger initial search to show recent docs
                            setTimeout(() => handleSearchDocuments(), 100);
                        }}
                        className="flex items-center gap-2 px-4 py-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors font-bold border border-blue-100"
                    >
                        <Plus size={18} />
                        Vincular Documentos
                    </button>
                )}
            </div>

            {/* Content Section */}
            <div className="space-y-6">
                {/* Folders Section */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pastas / Dossiers</h4>
                            <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                                {filteredArchives.length} {filteredArchives.length === 1 ? 'Pasta' : 'Pastas'}
                            </span>
                        </div>

                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                type="text"
                                placeholder="Pesquisar pastas..."
                                value={folderSearchTerm}
                                onChange={e => setFolderSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-12"></th>
                                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Descrição</th>
                                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Código</th>
                                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Período</th>
                                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredArchives.map(archive => (
                                    <tr
                                        key={archive.id}
                                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                                        onClick={() => {
                                            setCurrentParentId(archive.id);
                                            setFolderSearchTerm('');
                                        }}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="p-2 bg-amber-50 text-amber-500 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                                <Folder size={18} fill="currentColor" className="opacity-80" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-800 text-sm">{archive.description}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            {archive.code ? (
                                                <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-slate-600 uppercase">
                                                    {archive.code}
                                                </span>
                                            ) : (
                                                <span className="text-slate-300 text-xs">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {archive.period || archive.date || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => openModal(archive)}
                                                    className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-all"
                                                    title="Editar"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(archive.id)}
                                                    className="p-2 hover:bg-red-50 rounded-xl text-red-500 transition-all"
                                                    title="Eliminar"
                                                >
                                                    <MoreVertical size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredArchives.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                            <Folder size={40} className="mx-auto mb-3 opacity-10" />
                                            <p className="text-sm font-medium">
                                                {folderSearchTerm ? 'Nenhuma pasta encontrada para esta pesquisa' : 'Nenhuma subpasta'}
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Documents List */}
                {currentParentId && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Documentos Vinculados</h4>
                            <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                                {linkedDocuments.length} {linkedDocuments.length === 1 ? 'Documento' : 'Documentos'}
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tipo</th>
                                        <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Descrição / Número</th>
                                        <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Entidade</th>
                                        <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data</th>
                                        <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {linkedDocuments.map(doc => (
                                        <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className={`p-2 w-fit rounded-lg ${doc.doc_type === 'invoice' ? 'bg-emerald-50 text-emerald-500' : 'bg-blue-50 text-blue-500'}`}>
                                                    {doc.doc_type === 'invoice' ? <Receipt size={16} /> : <FileText size={16} />}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-slate-800 text-sm">
                                                    {doc.doc_type === 'invoice' ? `${doc.document_type_code} ${doc.document_number}` : doc.description}
                                                </p>
                                                <p className="text-[10px] text-slate-400 font-medium">
                                                    {doc.doc_type === 'invoice' ? 'Comercial' : 'Geral'}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-medium text-slate-600">
                                                    {doc.entity_name || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500">
                                                {doc.date || doc.issue_date || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => setSelectedDoc(doc)}
                                                        className="p-2 hover:bg-blue-50 rounded-xl text-blue-600 transition-all"
                                                        title="Visualizar Detalhes"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleUnlinkDocument(doc.doc_type, doc.id)}
                                                        className="p-2 hover:bg-red-50 rounded-xl text-red-500 transition-all"
                                                        title="Desvincular"
                                                    >
                                                        <Unlink size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {linkedDocuments.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                                <File size={40} className="mx-auto mb-3 opacity-10" />
                                                <p className="text-sm font-medium">Nenhum documento vinculado a este arquivo</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Search & Link Modal */}
            {showLinkModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-800">Vincular Documentos</h3>
                            <button onClick={() => setShowLinkModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                <X size={20} className="text-slate-500" />
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
                                            onChange={e => setSearchQuery(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleSearchDocuments()}
                                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        />
                                    </div>
                                    <button
                                        onClick={handleSearchDocuments}
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
                                            onChange={e => setSearchDocType(e.target.value)}
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
                                            onChange={e => setSearchEntityType(e.target.value)}
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
                                            onClick={() => handleLinkDocument(result.doc_type, result.id)}
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
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="text-xl font-bold text-slate-800">
                                {editingArchive ? 'Editar Arquivo' : 'Novo Arquivo'}
                            </h3>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    placeholder="Ex: Documentos 2024"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Código</label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        placeholder="Ex: DOC-001"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Período</label>
                                    <input
                                        type="text"
                                        value={formData.period}
                                        onChange={e => setFormData({ ...formData, period: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        placeholder="MM-AAAA ou 00-AAAA"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Data (opcional)</label>
                                <input
                                    type="text"
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    placeholder="DD-MM-AAAA"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 h-24 resize-none"
                                    placeholder="Observações adicionais..."
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold shadow-lg shadow-blue-600/20"
                                >
                                    Salvar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Document Detail Modal */}
            {selectedDoc && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-2xl ${selectedDoc.doc_type === 'invoice' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {selectedDoc.doc_type === 'invoice' ? <Receipt size={28} /> : <FileText size={28} />}
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800">
                                        {selectedDoc.doc_type === 'invoice' ? `${selectedDoc.document_type_code} ${selectedDoc.document_number}` : 'Documento Geral'}
                                    </h3>
                                    <p className="text-sm text-slate-500 font-medium">Visualização de Detalhes</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedDoc(null)} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm border border-slate-200">
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-8 overflow-y-auto space-y-8">
                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        <Info size={12} />
                                        Descrição
                                    </div>
                                    <p className="text-slate-800 font-bold">{selectedDoc.description || '-'}</p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        <User size={12} />
                                        Entidade Relacionada
                                    </div>
                                    <p className="text-slate-800 font-bold">{selectedDoc.entity_name || 'Nenhuma'}</p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        <Calendar size={12} />
                                        Data de Emissão
                                    </div>
                                    <p className="text-slate-800 font-bold">{selectedDoc.date || selectedDoc.issue_date || '-'}</p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        <Tag size={12} />
                                        Tipo de Documento
                                    </div>
                                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${selectedDoc.doc_type === 'invoice' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {selectedDoc.doc_type === 'invoice' ? 'Comercial' : 'Geral'}
                                    </span>
                                </div>
                            </div>

                            {/* Attachments Section */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                    <Paperclip size={14} className="text-blue-500" />
                                    Anexos e Ficheiros
                                </h4>

                                <div className="space-y-2">
                                    {/* Invoice PDF */}
                                    {selectedDoc.doc_type === 'invoice' && selectedDoc.pdf_path && (
                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200 group hover:border-blue-300 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white rounded-xl text-red-500 shadow-sm border border-slate-100">
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">Documento PDF</p>
                                                    <p className="text-[10px] text-slate-500">Ficheiro da Fatura</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => window.electron.fs.openFile(selectedDoc.pdf_path)}
                                                    className="p-2 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-colors shadow-sm border border-slate-200"
                                                    title="Visualizar"
                                                >
                                                    <ExternalLink size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDownload(selectedDoc.pdf_path, `Fatura_${selectedDoc.document_number}.pdf`)}
                                                    className="p-2 bg-white text-emerald-600 rounded-xl hover:bg-emerald-50 transition-colors shadow-sm border border-slate-200"
                                                    title="Baixar"
                                                >
                                                    <Download size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* General Doc Attachments */}
                                    {selectedDoc.doc_type === 'general' && selectedDoc.attachments?.map((att: any) => (
                                        <div key={att.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200 group hover:border-blue-300 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white rounded-xl text-blue-500 shadow-sm border border-slate-100">
                                                    <Paperclip size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">{att.title}</p>
                                                    <p className="text-[10px] text-slate-500">Anexo do Documento</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => window.electron.fs.openFile(att.file_path)}
                                                    className="p-2 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-colors shadow-sm border border-slate-200"
                                                    title="Visualizar"
                                                >
                                                    <ExternalLink size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDownload(att.file_path, att.title)}
                                                    className="p-2 bg-white text-emerald-600 rounded-xl hover:bg-emerald-50 transition-colors shadow-sm border border-slate-200"
                                                    title="Baixar"
                                                >
                                                    <Download size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {((selectedDoc.doc_type === 'invoice' && !selectedDoc.pdf_path) ||
                                        (selectedDoc.doc_type === 'general' && (!selectedDoc.attachments || selectedDoc.attachments.length === 0))) && (
                                            <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                                <p className="text-sm text-slate-400 font-medium">Nenhum ficheiro anexado</p>
                                            </div>
                                        )}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                            <button
                                onClick={() => setSelectedDoc(null)}
                                className="px-6 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-bold shadow-lg shadow-slate-900/20"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentsArchive;
