import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2, ExternalLink, X, Clock, AlertTriangle, Info } from 'lucide-react';
import { AppNotification, View } from '../../types';

interface NotificationCenterProps {
    notifications: AppNotification[];
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
    onDelete: (id: string) => void;
    onNavigate: (view: View) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
    notifications,
    onMarkAsRead,
    onMarkAllAsRead,
    onDelete,
    onNavigate
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const unreadCount = notifications.filter(n => !n.is_read).length;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case 'deadline': return <Clock size={16} className="text-amber-500" />;
            case 'system': return <AlertTriangle size={16} className="text-red-500" />;
            default: return <Info size={16} className="text-blue-500" />;
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return 'Agora mesmo';
        if (minutes < 60) return `Há ${minutes} min`;
        if (hours < 24) return `Há ${hours} h`;
        return `Há ${days} dias`;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2.5 rounded-xl transition-all relative ${isOpen ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                        <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Notificações</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={onMarkAllAsRead}
                                className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest"
                            >
                                Ler todas
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-10 text-center space-y-3">
                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto">
                                    <Bell size={24} className="text-slate-200" />
                                </div>
                                <p className="text-xs font-bold text-slate-400">Sem notificações no momento</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        className={`p-4 transition-colors hover:bg-slate-50 group relative ${!n.is_read ? 'bg-blue-50/30' : ''}`}
                                    >
                                        <div className="flex gap-3">
                                            <div className="mt-1 shrink-0">
                                                {getIcon(n.type)}
                                            </div>
                                            <div className="flex-1 min-w-0 space-y-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className={`text-xs font-black truncate ${!n.is_read ? 'text-slate-900' : 'text-slate-600'}`}>
                                                        {n.title}
                                                    </p>
                                                    <span className="text-[10px] text-slate-400 font-medium shrink-0">
                                                        {formatTime(n.created_at)}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2 font-medium">
                                                    {n.message}
                                                </p>
                                                {n.link && (
                                                    <button
                                                        onClick={() => {
                                                            onNavigate(n.link as View);
                                                            onMarkAsRead(n.id);
                                                            setIsOpen(false);
                                                        }}
                                                        className="flex items-center gap-1 text-[10px] font-black text-blue-600 hover:underline pt-1 uppercase tracking-widest"
                                                    >
                                                        Ver detalhes
                                                        <ExternalLink size={10} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="absolute right-2 bottom-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {!n.is_read && (
                                                <button
                                                    onClick={() => onMarkAsRead(n.id)}
                                                    className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-white rounded-lg shadow-sm transition-all"
                                                    title="Marcar como lida"
                                                >
                                                    <Check size={14} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => onDelete(n.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg shadow-sm transition-all"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="p-3 bg-slate-50/50 border-t border-slate-50 text-center">
                            <p className="text-[10px] font-bold text-slate-400">
                                Mostrando as últimas {notifications.length} notificações
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;
