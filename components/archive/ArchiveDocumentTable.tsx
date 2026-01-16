import React from 'react';
import { FileText, Receipt, Eye, Unlink, File } from 'lucide-react';

interface ArchiveDocumentTableProps {
    documents: any[];
    onViewDetails: (doc: any) => void;
    onUnlink: (docType: string, docId: string) => void;
}

export const ArchiveDocumentTable: React.FC<ArchiveDocumentTableProps> = ({
    documents,
    onViewDetails,
    onUnlink
}) => {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Documentos Vinculados</h4>
                <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                    {documents.length} {documents.length === 1 ? 'Documento' : 'Documentos'}
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
                        {documents.map(doc => (
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
                                            onClick={() => onViewDetails(doc)}
                                            className="p-2 hover:bg-blue-50 rounded-xl text-blue-600 transition-all"
                                            title="Visualizar Detalhes"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <button
                                            onClick={() => onUnlink(doc.doc_type, doc.id)}
                                            className="p-2 hover:bg-red-50 rounded-xl text-red-500 transition-all"
                                            title="Desvincular"
                                        >
                                            <Unlink size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {documents.length === 0 && (
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
    );
};
