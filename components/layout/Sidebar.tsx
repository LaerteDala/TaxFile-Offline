import React from 'react';
import {
    FileText,
    ChevronDown,
    ChevronRight,
    LogOut
} from 'lucide-react';
import { View } from '../../types';
import { NavItem, navigation, settingsMenu } from '../../config/navigation';

interface SidebarProps {
    isSidebarOpen: boolean;
    currentView: View;
    expandedMenus: string[];
    onViewChange: (view: View) => void;
    onToggleMenu: (menuId: string) => void;
    onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    isSidebarOpen,
    currentView,
    expandedMenus,
    onViewChange,
    onToggleMenu,
    onLogout
}) => {
    const renderNavItem = (item: NavItem) => {
        if (item.subItems) {
            const isExpanded = expandedMenus.includes(item.id!);
            const isChildActive = item.subItems.some(sub => sub.view === currentView);

            return (
                <div key={item.id} className="space-y-1">
                    <button
                        onClick={() => onToggleMenu(item.id!)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${isChildActive ? 'text-white bg-slate-800/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                    >
                        <div className="flex items-center gap-4">
                            <item.icon size={20} />
                            {isSidebarOpen && <span className="font-bold text-sm">{item.name}</span>}
                        </div>
                        {isSidebarOpen && (isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
                    </button>

                    {isExpanded && isSidebarOpen && (
                        <div className="ml-4 pl-4 border-l border-slate-800 space-y-1 animate-in slide-in-from-left-2 duration-200">
                            {item.subItems.map((sub) => (
                                <button
                                    key={sub.view}
                                    onClick={() => onViewChange(sub.view)}
                                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-bold transition-all ${currentView === sub.view
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                            : 'text-slate-500 hover:text-white hover:bg-slate-800'
                                        }`}
                                >
                                    <sub.icon size={16} />
                                    <span>{sub.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <button
                key={item.name}
                onClick={() => onViewChange(item.view!)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${currentView === item.view
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
            >
                <item.icon size={20} />
                {isSidebarOpen && <span className="font-bold text-sm">{item.name}</span>}
            </button>
        );
    };

    return (
        <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 transition-all duration-300 flex flex-col z-50`}>
            <div className="p-6 flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                    <FileText className="text-white" size={20} />
                </div>
                {isSidebarOpen && <span className="font-bold text-xl text-white tracking-tight">TaxFile<span className="text-blue-500">ERP</span></span>}
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
                {navigation.map(renderNavItem)}
            </nav>

            <div className="p-4 border-t border-slate-800 space-y-2">
                {renderNavItem(settingsMenu)}

                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-4 px-4 py-3 text-slate-400 hover:text-white rounded-xl transition-colors"
                >
                    <LogOut size={20} />
                    {isSidebarOpen && <span className="font-medium">Sair</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
