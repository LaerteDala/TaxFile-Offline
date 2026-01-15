import React from 'react';
import { Menu } from 'lucide-react';
import { View, AppNotification } from '../../types';
import { navigation, settingsMenu } from '../../config/navigation';
import NotificationCenter from './NotificationCenter';

interface HeaderProps {
    currentView: View;
    session: any;
    onToggleSidebar: () => void;
    onRefresh: () => void;
    notifications: AppNotification[];
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
    onDeleteNotification: (id: string) => void;
    onNavigate: (view: View) => void;
}

const Header: React.FC<HeaderProps> = ({
    currentView,
    session,
    onToggleSidebar,
    onRefresh,
    notifications,
    onMarkAsRead,
    onMarkAllAsRead,
    onDeleteNotification,
    onNavigate
}) => {
    const getTitle = () => {
        const allItems = [...navigation, settingsMenu];
        for (const item of allItems) {
            if ('view' in item && item.view === currentView) return item.name;
            if (item.subItems) {
                const sub = item.subItems.find(s => s.view === currentView);
                if (sub) return sub.name;
            }
        }
        return '';
    };

    return (
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40">
            <div className="flex items-center gap-4">
                <button onClick={onToggleSidebar} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                    <Menu size={20} />
                </button>
                <h1 className="text-xl font-semibold capitalize text-slate-800">
                    {getTitle()}
                </h1>
            </div>

            <div className="flex items-center gap-6">
                <button
                    onClick={onRefresh}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-2 text-xs font-bold transition-all"
                >
                    Actualizar Dados
                </button>

                <NotificationCenter
                    notifications={notifications}
                    onMarkAsRead={onMarkAsRead}
                    onMarkAllAsRead={onMarkAllAsRead}
                    onDelete={onDeleteNotification}
                    onNavigate={onNavigate}
                />

                <div className="flex items-center gap-3 border-l pl-6 border-slate-200">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-slate-800 truncate max-w-[150px]">
                            {session?.user?.email?.split('@')[0] || 'Utilizador'}
                        </p>
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Acesso Total</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-bold">
                        {session?.user?.email?.charAt(0).toUpperCase()}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
