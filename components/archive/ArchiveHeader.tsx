import React from 'react';
import { FolderPlus } from 'lucide-react';

interface ArchiveHeaderProps {
    onNewArchive: () => void;
}

export const ArchiveHeader: React.FC<ArchiveHeaderProps> = ({ onNewArchive }) => {
    return (
        <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div>
                <h2 className="text-2xl font-black text-slate-800">Arquivo Digital</h2>
                <p className="text-slate-500 font-medium">Gestão de Dossiers e Arquivos</p>
            </div>
            <button
                onClick={onNewArchive}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-bold shadow-lg shadow-slate-900/20"
            >
                <FolderPlus size={20} />
                Novo Arquivo
            </button>
        </div>
    );
};
