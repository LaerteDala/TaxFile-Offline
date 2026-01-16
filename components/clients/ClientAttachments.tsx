import React from 'react';
import { Upload, FileText, Eye, X } from 'lucide-react';
import { ClientAttachment } from '../../types';

interface ClientAttachmentsProps {
    attachments: ClientAttachment[];
    attachmentTitle: string;
    selectedFile: File | null;
    fileInputRef: React.RefObject<HTMLInputElement>;
    onAttachmentTitleChange: (value: string) => void;
    onAttachmentFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onAddAttachment: () => void;
    onOpenAttachment: (path: string) => void;
    onRemoveAttachment: (id: string) => void;
}

export const ClientAttachments: React.FC<ClientAttachmentsProps> = ({
    attachments,
    attachmentTitle,
    selectedFile,
    fileInputRef,
    onAttachmentTitleChange,
    onAttachmentFileChange,
    onAddAttachment,
    onOpenAttachment,
    onRemoveAttachment
}) => {
    return (
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
                        onChange={(e) => onAttachmentTitleChange(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ficheiro</label>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={onAttachmentFileChange}
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
                    onClick={onAddAttachment}
                    className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all active:scale-95"
                >
                    Adicionar Anexo
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {attachments.map((att) => (
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
                                onClick={() => onOpenAttachment(att.filePath)}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            >
                                <Eye size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => onRemoveAttachment(att.id)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
