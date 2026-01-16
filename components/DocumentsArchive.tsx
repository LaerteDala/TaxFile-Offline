import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Archive } from '../types';
import { ArchiveHeader } from './archive/ArchiveHeader';
import { ArchiveBreadcrumbs } from './archive/ArchiveBreadcrumbs';
import { ArchiveFolderTable } from './archive/ArchiveFolderTable';
import { ArchiveDocumentTable } from './archive/ArchiveDocumentTable';
import { ArchiveFormModal } from './archive/modals/ArchiveFormModal';
import { ArchiveLinkModal } from './archive/modals/ArchiveLinkModal';
import { ArchiveDetailModal } from './archive/modals/ArchiveDetailModal';

const DocumentsArchive: React.FC = () => {
    const [archives, setArchives] = useState<Archive[]>([]);
    const [linkedDocuments, setLinkedDocuments] = useState<any[]>([]);
    const [currentParentId, setCurrentParentId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
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
            <ArchiveHeader onNewArchive={() => openModal()} />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <ArchiveBreadcrumbs
                    currentParentId={currentParentId}
                    breadcrumbs={breadcrumbs}
                    onNavigate={setCurrentParentId}
                    onEdit={openModal}
                />

                {currentParentId && (
                    <button
                        onClick={() => {
                            setShowLinkModal(true);
                            setSearchQuery('');
                            setSearchDocType('all');
                            setSearchEntityType('all');
                            setTimeout(() => handleSearchDocuments(), 100);
                        }}
                        className="flex items-center gap-2 px-4 py-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors font-bold border border-blue-100"
                    >
                        <Plus size={18} />
                        Vincular Documentos
                    </button>
                )}
            </div>

            <div className="space-y-6">
                <ArchiveFolderTable
                    archives={filteredArchives}
                    folderSearchTerm={folderSearchTerm}
                    onSearchChange={setFolderSearchTerm}
                    onFolderClick={setCurrentParentId}
                    onEdit={openModal}
                    onDelete={handleDelete}
                />

                {currentParentId && (
                    <ArchiveDocumentTable
                        documents={linkedDocuments}
                        onViewDetails={setSelectedDoc}
                        onUnlink={handleUnlinkDocument}
                    />
                )}
            </div>

            <ArchiveFormModal
                show={showModal}
                editingArchive={editingArchive}
                formData={formData}
                onClose={() => setShowModal(false)}
                onChange={setFormData}
                onSave={handleSave}
            />

            <ArchiveLinkModal
                show={showLinkModal}
                searching={searching}
                searchQuery={searchQuery}
                searchDocType={searchDocType}
                searchEntityType={searchEntityType}
                searchResults={searchResults}
                onClose={() => setShowLinkModal(false)}
                onSearchQueryChange={setSearchQuery}
                onDocTypeChange={setSearchDocType}
                onEntityTypeChange={setSearchEntityType}
                onSearch={handleSearchDocuments}
                onLink={handleLinkDocument}
            />

            <ArchiveDetailModal
                selectedDoc={selectedDoc}
                onClose={() => setSelectedDoc(null)}
                onOpenFile={(path) => window.electron.fs.openFile(path)}
                onDownload={handleDownload}
            />
        </div>
    );
};

export default DocumentsArchive;
