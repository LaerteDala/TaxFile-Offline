import React, { useState } from 'react';
import {
    FileText,
    ShieldCheck,
    ArrowLeft,
    Tag
} from 'lucide-react';
import DocumentTypes from './DocumentTypes';
import WithholdingTypes from './WithholdingTypes';
import IVAClassifications from './fiscal/IVAClassifications';
import StampDutyClassifications from './fiscal/StampDutyClassifications';
import IndustrialTaxClassifications from './fiscal/IndustrialTaxClassifications';
import { DocumentType, WithholdingType, IVAClassification, StampDutyClassification, IndustrialTaxClassification } from '../types';

interface FiscalParametersProps {
    documentTypes: DocumentType[];
    setDocumentTypes: React.Dispatch<React.SetStateAction<DocumentType[]>>;
    withholdingTypes: WithholdingType[];
    setWithholdingTypes: React.Dispatch<React.SetStateAction<WithholdingType[]>>;
    ivaClassifications: IVAClassification[];
    setIvaClassifications: React.Dispatch<React.SetStateAction<IVAClassification[]>>;
    stampDutyClassifications: StampDutyClassification[];
    setStampDutyClassifications: React.Dispatch<React.SetStateAction<StampDutyClassification[]>>;
    industrialTaxClassifications: IndustrialTaxClassification[];
    setIndustrialTaxClassifications: React.Dispatch<React.SetStateAction<IndustrialTaxClassification[]>>;
    onBack: () => void;
}

const FiscalParameters: React.FC<FiscalParametersProps> = ({
    documentTypes,
    setDocumentTypes,
    withholdingTypes,
    setWithholdingTypes,
    ivaClassifications,
    setIvaClassifications,
    stampDutyClassifications,
    setStampDutyClassifications,
    industrialTaxClassifications,
    setIndustrialTaxClassifications,
    onBack
}) => {
    const [activeTab, setActiveTab] = useState<'documents' | 'withholding' | 'classifications'>('documents');
    const [activeSubTab, setActiveSubTab] = useState<'iva' | 'stamp' | 'industrial'>('iva');

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-600/20">
                                <ShieldCheck size={24} />
                            </div>
                            Parâmetros Fiscais
                        </h2>
                        <p className="text-sm text-slate-500 font-medium">Gerir tipos de documento, taxas de retenção e classificações fiscais</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 p-1.5 bg-slate-100/80 backdrop-blur-sm rounded-2xl w-fit border border-slate-200/50 shadow-inner">
                <button
                    onClick={() => setActiveTab('documents')}
                    className={`flex items-center gap-3 px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 ${activeTab === 'documents'
                        ? 'bg-white text-indigo-600 shadow-md shadow-slate-200'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                        }`}
                >
                    <FileText size={16} />
                    Tipos de Documento
                </button>
                <button
                    onClick={() => setActiveTab('withholding')}
                    className={`flex items-center gap-3 px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 ${activeTab === 'withholding'
                        ? 'bg-white text-indigo-600 shadow-md shadow-slate-200'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                        }`}
                >
                    <ShieldCheck size={16} />
                    Retenção na Fonte
                </button>
                <button
                    onClick={() => setActiveTab('classifications')}
                    className={`flex items-center gap-3 px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 ${activeTab === 'classifications'
                        ? 'bg-white text-indigo-600 shadow-md shadow-slate-200'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                        }`}
                >
                    <Tag size={16} />
                    Classificações
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
                    {activeTab === 'classifications' && (
                        <div className="space-y-8">
                            <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                                <button
                                    onClick={() => setActiveSubTab('iva')}
                                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeSubTab === 'iva' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    IVA
                                </button>
                                <button
                                    onClick={() => setActiveSubTab('stamp')}
                                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeSubTab === 'stamp' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    Imposto de Selo
                                </button>
                                <button
                                    onClick={() => setActiveSubTab('industrial')}
                                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeSubTab === 'industrial' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    Imposto Industrial
                                </button>
                            </div>

                            {activeSubTab === 'iva' && (
                                <IVAClassifications
                                    ivaClassifications={ivaClassifications}
                                    setIvaClassifications={setIvaClassifications}
                                />
                            )}
                            {activeSubTab === 'stamp' && (
                                <StampDutyClassifications
                                    stampDutyClassifications={stampDutyClassifications}
                                    setStampDutyClassifications={setStampDutyClassifications}
                                />
                            )}
                            {activeSubTab === 'industrial' && (
                                <IndustrialTaxClassifications
                                    industrialTaxClassifications={industrialTaxClassifications}
                                    setIndustrialTaxClassifications={setIndustrialTaxClassifications}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FiscalParameters;
