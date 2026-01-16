import React from 'react';
import { Home, ChevronRight, Edit } from 'lucide-react';
import { Archive } from '../../types';

interface ArchiveBreadcrumbsProps {
    currentParentId: string | null;
    breadcrumbs: Archive[];
    onNavigate: (id: string | null) => void;
    onEdit: (archive: Archive) => void;
}

export const ArchiveBreadcrumbs: React.FC<ArchiveBreadcrumbsProps> = ({
    currentParentId,
    breadcrumbs,
    onNavigate,
    onEdit
}) => {
    return (
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-white p-4 rounded-xl border border-slate-200 shadow-sm overflow-x-auto flex-1">
            <button
                onClick={() => onNavigate(null)}
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
                            onClick={() => onNavigate(crumb.id)}
                            className={`hover:text-blue-600 transition-colors ${index === breadcrumbs.length - 1 ? 'text-blue-600 font-bold' : ''}`}
                        >
                            {crumb.description}
                        </button>
                        {index === breadcrumbs.length - 1 && (
                            <button
                                onClick={() => onEdit(crumb)}
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
    );
};
