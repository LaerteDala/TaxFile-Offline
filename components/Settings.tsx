import React from 'react';
import {
    Settings as SettingsIcon,
    Building2,
    MapPin,
    Users,
    LayoutGrid,
    Briefcase,
    ShieldCheck,
    ChevronRight
} from 'lucide-react';
import { View } from '../types';

interface SettingsProps {
    setCurrentView: (view: View) => void;
}

const Settings: React.FC<SettingsProps> = ({ setCurrentView }) => {
    const categories = [
        {
            title: 'Geral',
            description: 'Configurações fundamentais da entidade e tabelas de apoio do sistema.',
            items: [
                {
                    name: 'Entidade',
                    description: 'Dados da empresa, logótipo e regime fiscal',
                    icon: Building2,
                    view: 'company_settings' as View,
                    color: 'text-blue-600',
                    bgColor: 'bg-blue-50'
                },
                {
                    name: 'Parâmetros Fiscais',
                    description: 'Tipos de documento e taxas de retenção na fonte',
                    icon: ShieldCheck,
                    view: 'fiscal_parameters' as View,
                    color: 'text-indigo-600',
                    bgColor: 'bg-indigo-50'
                },
                {
                    name: 'Províncias',
                    description: 'Gestão da lista de províncias de Angola',
                    icon: MapPin,
                    view: 'provinces' as View,
                    color: 'text-emerald-600',
                    bgColor: 'bg-emerald-50'
                },
                {
                    name: 'Municípios',
                    description: 'Gestão de municípios por província',
                    icon: Building2,
                    view: 'municipalities' as View,
                    color: 'text-purple-600',
                    bgColor: 'bg-purple-50'
                }
            ]
        },
        {
            title: 'Gestão do Pessoal',
            description: 'Configurações relacionadas com a gestão de recursos humanos.',
            items: [
                {
                    name: 'Departamentos',
                    description: 'Estrutura orgânica da empresa',
                    icon: LayoutGrid,
                    view: 'departments' as View,
                    color: 'text-orange-600',
                    bgColor: 'bg-orange-50'
                },
                {
                    name: 'Funções',
                    description: 'Cargos e funções profissionais',
                    icon: Briefcase,
                    view: 'job_functions' as View,
                    color: 'text-cyan-600',
                    bgColor: 'bg-cyan-50'
                }
            ]
        }
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <h2 className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-4">
                        <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-600/20">
                            <SettingsIcon size={32} />
                        </div>
                        Gestão de Configurações
                    </h2>
                    <p className="text-lg text-slate-500 font-medium max-w-2xl">
                        Central de controlo do sistema. Configure os parâmetros base, tabelas de apoio e estrutura organizacional.
                    </p>
                </div>
            </div>

            <div className="space-y-12">
                {categories.map((category) => (
                    <div key={category.title} className="space-y-4">
                        <div className="flex items-center gap-3 px-2">
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-wider">
                                {category.title}
                            </h3>
                            <div className="h-px flex-1 bg-slate-200"></div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
                            <div className="divide-y divide-slate-100">
                                {category.items.map((item) => (
                                    <button
                                        key={item.name}
                                        onClick={() => setCurrentView(item.view)}
                                        className="w-full group flex items-center justify-between p-6 hover:bg-slate-50 transition-all duration-300 text-left"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className={`w-12 h-12 ${item.bgColor} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}>
                                                <item.icon size={24} className={item.color} />
                                            </div>

                                            <div className="space-y-1">
                                                <h4 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                                                    {item.name}
                                                </h4>
                                                <p className="text-sm text-slate-500 font-medium">
                                                    {item.description}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-blue-600 font-bold text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-[-10px] group-hover:translate-x-0">
                                                Configurar
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                                <ChevronRight size={18} />
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Settings;
