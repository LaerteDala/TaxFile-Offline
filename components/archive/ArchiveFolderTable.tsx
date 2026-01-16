import React from 'react';
import { Folder, Search, Edit, MoreVertical } from 'lucide-react';
import { Archive } from '../../types';

interface ArchiveFolderTableProps {
    archives: Archive[];
    folderSearchTerm: string;
    onSearchChange: (term: string) => void;
    onFolderClick: (id: string) => void;
    onEdit: (archive: Archive) => void;
    onDelete: (id: string) => void;
}

export const ArchiveFolderTable: React.FC<ArchiveFolderTableProps> = ({
    archives,
    folderSearchTerm,
    onSearchChange,
    onFolderClick,
    onEdit,
    onDelete
}) => {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pastas / Dossiers</h4>
                    <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                        {archives.length} {archives.length === 1 ? 'Pasta' : 'Pastas'}
                    </span>
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                        type="text"
                        placeholder="Pesquisar pastas..."
                        value={folderSearchTerm}
                        onChange={e => onSearchChange(e.target.value)}
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
                        {archives.map(archive => (
                            <tr
                                key={archive.id}
                                className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                                onClick={() => onFolderClick(archive.id)}
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
                                            onClick={() => onEdit(archive)}
                                            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-all"
                                            title="Editar"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => onDelete(archive.id)}
                                            className="p-2 hover:bg-red-50 rounded-xl text-red-500 transition-all"
                                            title="Eliminar"
                                        >
                                            <MoreVertical size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {archives.length === 0 && (
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
    );
};
