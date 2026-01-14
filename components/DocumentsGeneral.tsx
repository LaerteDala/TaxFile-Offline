import React, { useState, useEffect } from 'react';
import {
    FileText,
    Plus,
    Search,
    Filter,
    Calendar,
    Link as LinkIcon,
    Trash2,
    Download,
    Eye,
    Folder,
    Paperclip,
    X,
    File
} from 'lucide-react';
import { GeneralDocument, Archive, Supplier, Client, Staff, Invoice, GeneralDocumentAttachment } from '../types';

const DocumentsGeneral: React.FC = () => {
    const [documents, setDocuments] = useState<GeneralDocument[]>([]);
    const [archives, setArchives] = useState<Archive[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [staff, setStaff] = useState<Staff[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);

    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [archiveSearch, setArchiveSearch] = useState('');
    const [filterArchive, setFilterArchive] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingDoc, setEditingDoc] = useState<GeneralDocument | null>(null);
    const [attachments, setAttachments] = useState<{ title: string; file?: File; filePath?: string; id?: string }[]>([]);

    // Form state
    const [formData, setFormData] = useState({
        description: '',
        issue_date: '',
        expiry_date: '',
        related_entity_type: '',
        related_entity_id: '',
        archive_id: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [docsData, archivesData, suppliersData, clientsData, staffData, invoicesData] = await Promise.all([
                window.electron.db.getGeneralDocuments(),
                window.electron.db.getArchives(),
                window.electron.db.getSuppliers(),
                window.electron.db.getClients(),
                window.electron.db.getStaff(),
                window.electron.db.getInvoices()
            ]);
            setDocuments(docsData);
            setArchives(archivesData);
            setSuppliers(suppliersData);
            setClients(clientsData);
            setStaff(staffData);
            setInvoices(invoicesData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let docId = editingDoc?.id;
            const dataToSave = {
                ...formData,
                related_entity_id: formData.related_entity_id || null,
                archive_id: formData.archive_id || null
            };

            if (editingDoc) {
                await window.electron.db.updateGeneralDocument({ ...dataToSave, id: editingDoc.id });
            } else {
                const newDoc = await window.electron.db.addGeneralDocument(dataToSave);
                docId = newDoc.id;
            }

            // Handle attachments
            if (docId) {
                for (const att of attachments) {
                    if (att.file) {
                        const buffer = await att.file.arrayBuffer();
                        const filePath = await window.electron.fs.saveFile(att.file.name, buffer);
                        await window.electron.db.addGeneralDocumentAttachment({
                            documentId: docId,
                            title: att.title,
                            filePath: filePath
                        });
                    }
                }
            }

            setShowModal(false);
            setEditingDoc(null);
            setAttachments([]);
            setFormData({
                description: '',
                issue_date: '',
                expiry_date: '',
                related_entity_type: '',
                related_entity_id: '',
                archive_id: ''
            });
            loadData();
        } catch (error) {
            console.error('Error saving document:', error);
        }
    };

    const handleDownload = async (filePath: string, fileName: string) => {
        try {
            await window.electron.fs.downloadFile(filePath, fileName);
        } catch (error) {
            console.error('Error downloading file:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja eliminar este documento?')) {
            try {
                await window.electron.db.deleteGeneralDocument(id);
                loadData();
            } catch (error) {
                console.error('Error deleting document:', error);
            }
        }
    };

    const openModal = async (doc?: GeneralDocument) => {
        if (doc) {
            setEditingDoc(doc);
            setFormData({
                description: doc.description,
                issue_date: doc.issue_date || '',
                expiry_date: doc.expiry_date || '',
                related_entity_type: doc.related_entity_type || '',
                related_entity_id: doc.related_entity_id || '',
                archive_id: doc.archive_id || ''
            });

            // Load existing attachments
            try {
                const existingAtts = await window.electron.db.getGeneralDocumentAttachments(doc.id);
                setAttachments(existingAtts.map(a => ({
                    id: a.id,
                    title: a.title,
                    filePath: a.file_path
                })));
            } catch (error) {
                console.error('Error loading attachments:', error);
            }
        } else {
            setEditingDoc(null);
            setAttachments([]);
            setFormData({
                description: '',
                issue_date: '',
                expiry_date: '',
                related_entity_type: '',
                related_entity_id: '',
                archive_id: ''
            });
        }
        setShowModal(true);
    };

    const getEntityName = (type?: string, id?: string) => {
        if (!type || !id) return '-';
        if (type === 'supplier') return suppliers.find(s => s.id === id)?.name || 'Fornecedor desconhecido';
        if (type === 'client') return clients.find(c => c.id === id)?.name || 'Cliente desconhecido';
        if (type === 'staff') return staff.find(s => s.id === id)?.name || 'Funcionário desconhecido';
        if (type === 'invoice') {
            const inv = invoices.find(i => i.id === id);
            return inv ? `${inv.type} ${inv.documentNumber || ''}` : 'Documento desconhecido';
        }
        return type;
    };

    // Build archive path showing hierarchy
    const getArchivePath = (archiveId: string): string => {
        const archive = archives.find(a => a.id === archiveId);
        if (!archive) return '';

        const path: string[] = [];
        let current: Archive | undefined = archive;

        while (current) {
            const display = current.code ? `[${current.code}] ${current.description}` : current.description;
            path.unshift(display);

            if (current.parent_id) {
                current = archives.find(a => a.id === current!.parent_id);
            } else {
                break;
            }
        }

        return path.join(' > ');
    };

    // Filter archives for dropdown with search
    const filteredArchives = archives.filter(archive => {
        if (!archiveSearch) return true;
        const searchLower = archiveSearch.toLowerCase();
        const codeMatch = archive.code?.toLowerCase().includes(searchLower);
        const descMatch = archive.description.toLowerCase().includes(searchLower);
        const pathMatch = getArchivePath(archive.id).toLowerCase().includes(searchLower);
        return codeMatch || descMatch || pathMatch;
    });

    const filteredDocuments = documents.filter(doc => {
        const matchesSearch = doc.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesArchive = filterArchive ? doc.archive_id === filterArchive : true;
        return matchesSearch && matchesArchive;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h2 className="text-2xl font-black text-slate-800">Documentos Gerais</h2>
                    <p className="text-slate-500 font-medium">Galeria de Documentos e Anexos</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-bold shadow-lg shadow-slate-900/20"
                >
                    <Plus size={20} />
                    Novo Documento
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                    <Search className="text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Pesquisar documentos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent outline-none w-full text-slate-700 placeholder-slate-400"
                    />
                </div>
                <div className="flex items-center gap-2 min-w-[200px] bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                    <Filter className="text-slate-400" size={20} />
                    <select
                        value={filterArchive}
                        onChange={(e) => setFilterArchive(e.target.value)}
                        className="bg-transparent outline-none w-full text-slate-700"
                    >
                        <option value="">Todos os Arquivos</option>
                        {archives.map(a => (
                            <option key={a.id} value={a.id}>{getArchivePath(a.id)}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-bold">
                            <tr>
                                <th className="px-6 py-4">Descrição</th>
                                <th className="px-6 py-4">Arquivo</th>
                                <th className="px-6 py-4">Entidade Relacionada</th>
                                <th className="px-6 py-4">Data Emissão</th>
                                <th className="px-6 py-4">Validade</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredDocuments.map(doc => (
                                <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-800">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                <FileText size={18} />
                                            </div>
                                            {doc.description}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {doc.archive_description ? (
                                            <div className="flex items-center gap-2">
                                                <Folder size={14} className="text-amber-500" />
                                                {doc.archive_description}
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {doc.related_entity_type ? (
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold uppercase text-slate-400">{doc.related_entity_type}</span>
                                                <span>{getEntityName(doc.related_entity_type, doc.related_entity_id)}</span>
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {doc.issue_date ? (
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-slate-400" />
                                                {doc.issue_date}
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {doc.expiry_date ? (
                                            <div className={`flex items-center gap-2 ${new Date(doc.expiry_date) < new Date() ? 'text-red-600 font-bold' : ''}`}>
                                                <Calendar size={14} className={new Date(doc.expiry_date) < new Date() ? 'text-red-600' : 'text-slate-400'} />
                                                {doc.expiry_date}
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openModal(doc)}
                                                className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(doc.id)}
                                                className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredDocuments.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                        Nenhum documento encontrado
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="text-xl font-bold text-slate-800">
                                {editingDoc ? 'Editar Documento' : 'Novo Documento'}
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
                                    placeholder="Ex: Contrato de Prestação de Serviços"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Data de Emissão</label>
                                    <input
                                        type="date"
                                        value={formData.issue_date}
                                        onChange={e => setFormData({ ...formData, issue_date: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Data de Validade</label>
                                    <input
                                        type="date"
                                        value={formData.expiry_date}
                                        onChange={e => setFormData({ ...formData, expiry_date: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Arquivo (Dossier)</label>
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        placeholder="Pesquisar arquivo..."
                                        value={archiveSearch}
                                        onChange={e => setArchiveSearch(e.target.value)}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                    <select
                                        value={formData.archive_id}
                                        onChange={e => setFormData({ ...formData, archive_id: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        size={Math.min(filteredArchives.length + 1, 6)}
                                    >
                                        <option value="">Selecione um arquivo...</option>
                                        {filteredArchives.map(a => (
                                            <option key={a.id} value={a.id}>
                                                {getArchivePath(a.id)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Entidade</label>
                                    <select
                                        value={formData.related_entity_type}
                                        onChange={e => setFormData({ ...formData, related_entity_type: e.target.value, related_entity_id: '' })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    >
                                        <option value="">Nenhuma</option>
                                        <option value="supplier">Fornecedor</option>
                                        <option value="client">Cliente</option>
                                        <option value="staff">Funcionário</option>
                                        <option value="invoice">Documento (FT, NC, FR, etc.)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Entidade / Documento</label>
                                    <select
                                        value={formData.related_entity_id}
                                        onChange={e => setFormData({ ...formData, related_entity_id: e.target.value })}
                                        disabled={!formData.related_entity_type}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50"
                                    >
                                        <option value="">Selecione...</option>
                                        {formData.related_entity_type === 'supplier' && suppliers.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                        {formData.related_entity_type === 'client' && clients.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                        {formData.related_entity_type === 'staff' && staff.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                        {formData.related_entity_type === 'invoice' && invoices.map(i => (
                                            <option key={i.id} value={i.id}>{i.type} {i.documentNumber} ({i.date})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Attachments Section */}
                            <div className="space-y-3 pt-4 border-t border-slate-100">
                                <div className="flex items-center justify-between">
                                    <label className="block text-sm font-bold text-slate-700">Lista de Anexos</label>
                                    <button
                                        type="button"
                                        onClick={() => setAttachments([...attachments, { title: '' }])}
                                        className="text-xs flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-bold"
                                    >
                                        <Plus size={14} />
                                        Adicionar Anexo
                                    </button>
                                </div>

                                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                    {attachments.map((att, index) => (
                                        <div key={index} className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    placeholder="Título do documento..."
                                                    value={att.title}
                                                    onChange={e => {
                                                        const newAtts = [...attachments];
                                                        newAtts[index].title = e.target.value;
                                                        setAttachments(newAtts);
                                                    }}
                                                    className="w-full bg-transparent outline-none text-sm font-medium text-slate-700"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {att.filePath ? (
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => window.electron.fs.openFile(att.filePath!)}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                                            title="Abrir ficheiro"
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDownload(att.filePath!, att.title)}
                                                            className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                                                            title="Baixar ficheiro"
                                                        >
                                                            <Download size={16} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <label className="p-1.5 text-slate-500 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors">
                                                        <Paperclip size={16} />
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            onChange={e => {
                                                                const file = e.target.files?.[0];
                                                                if (file) {
                                                                    const newAtts = [...attachments];
                                                                    newAtts[index].file = file;
                                                                    newAtts[index].title = att.title || file.name;
                                                                    setAttachments(newAtts);
                                                                }
                                                            }}
                                                        />
                                                    </label>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        if (att.id) {
                                                            if (confirm('Eliminar este anexo?')) {
                                                                await window.electron.db.deleteGeneralDocumentAttachment(att.id);
                                                            } else return;
                                                        }
                                                        setAttachments(attachments.filter((_, i) => i !== index));
                                                    }}
                                                    className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {attachments.length === 0 && (
                                        <p className="text-center text-xs text-slate-400 py-4">Nenhum anexo adicionado</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
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
        </div>
    );
};

export default DocumentsGeneral;
