
import React, { useState } from 'react';
import {
    FileText,
    ShieldCheck,
    Settings as SettingsIcon
} from 'lucide-react';
import DocumentTypes from './DocumentTypes';
import WithholdingTypes from './WithholdingTypes';
import { DocumentType, WithholdingType } from '../types';

interface SettingsProps {
    documentTypes: DocumentType[];
    setDocumentTypes: React.Dispatch<React.SetStateAction<DocumentType[]>>;
    withholdingTypes: WithholdingType[];
    setWithholdingTypes: React.Dispatch<React.SetStateAction<WithholdingType[]>>;
}

const Settings: React.FC<SettingsProps> = ({
    documentTypes,
    setDocumentTypes,
    withholdingTypes,
    setWithholdingTypes
}) => {
    const [activeTab, setActiveTab] = useState<'documents' | 'withholding'>('documents');

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-600/20">
                            <SettingsIcon size={24} />
                        </div>
                        Configurações do Sistema
                    </h2>
                    <p className="text-sm text-slate-500 font-medium ml-12">Gerir parâmetros globais, tabelas de apoio e taxas de imposto</p>
                </div>
            </div>

            <div className="flex items-center gap-2 p-1.5 bg-slate-100/80 backdrop-blur-sm rounded-2xl w-fit border border-slate-200/50 shadow-inner">
                <button
                    onClick={() => setActiveTab('documents')}
                    className={`flex items-center gap-3 px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 ${activeTab === 'documents'
                            ? 'bg-white text-blue-600 shadow-md shadow-slate-200'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                        }`}
                >
                    <FileText size={16} />
                    Tipos de Documento
                </button>
                <button
                    onClick={() => setActiveTab('withholding')}
                    className={`flex items-center gap-3 px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 ${activeTab === 'withholding'
                            ? 'bg-white text-blue-600 shadow-md shadow-slate-200'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                        }`}
                >
                    <ShieldCheck size={16} />
                    Retenção na Fonte
                </button>
            </div>

            <div className="bg-white/50 backdrop-blur-sm rounded-[2.5rem] border border-slate-200/60 p-2 min-h-[600px]">
                <div className="bg-white rounded-[2.2rem] p-8 shadow-sm h-full">
                    {activeTab === 'documents' && (
                        <DocumentTypes
                            documentTypes={documentTypes}
                            setDocumentTypes={setDocumentTypes}
                        />
                    )}
                    {activeTab === 'withholding' && (
                        <WithholdingTypes
                            withholdingTypes={withholdingTypes}
                            setWithholdingTypes={setWithholdingTypes}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
