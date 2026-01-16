import React from 'react';
import { X, Receipt, FileText, Info, User, Calendar, Tag, Paperclip, ExternalLink, Download } from 'lucide-react';

interface ArchiveDetailModalProps {
    selectedDoc: any | null;
    onClose: () => void;
    onOpenFile: (path: string) => void;
    onDownload: (path: string, name: string) => void;
}

export const ArchiveDetailModal: React.FC<ArchiveDetailModalProps> = ({
    selectedDoc,
    onClose,
    onOpenFile,
    onDownload
}) => {
    if (!selectedDoc) return null;

    return (
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
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm border border-slate-200">
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
                                            onClick={() => onOpenFile(selectedDoc.pdf_path)}
                                            className="p-2 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-colors shadow-sm border border-slate-200"
                                            title="Visualizar"
                                        >
                                            <ExternalLink size={18} />
                                        </button>
                                        <button
                                            onClick={() => onDownload(selectedDoc.pdf_path, `Fatura_${selectedDoc.document_number}.pdf`)}
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
                                            onClick={() => onOpenFile(att.file_path)}
                                            className="p-2 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-colors shadow-sm border border-slate-200"
                                            title="Visualizar"
                                        >
                                            <ExternalLink size={18} />
                                        </button>
                                        <button
                                            onClick={() => onDownload(att.file_path, att.title)}
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
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-bold shadow-lg shadow-slate-900/20"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};
