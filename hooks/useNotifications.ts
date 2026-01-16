import { useState, useRef } from 'react';
import { AppNotification, DeadlineSummary } from '../types';

export const useNotifications = () => {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [deadlineSummary, setDeadlineSummary] = useState<DeadlineSummary>({ expired: 0, upcoming: 0, total: 0 });
    const isCheckingDeadlines = useRef(false);

    const checkDeadlinesAndNotify = async () => {
        if (isCheckingDeadlines.current) return;
        isCheckingDeadlines.current = true;
        try {
            const upcoming = await window.electron.db.getUpcomingDeadlines();
            const currentNotifications = await window.electron.db.getNotifications();
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            for (const item of upcoming) {
                const expiry = new Date(item.expiry_date);
                expiry.setHours(0, 0, 0, 0);
                const diffTime = expiry.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                let type: 'deadline' | 'system' = 'deadline';
                let title = '';
                let message = '';

                if (diffDays < 0) {
                    title = `Documento Vencido: ${item.description}`;
                    message = `O documento da entidade ${item.entity_name} venceu em ${new Date(item.expiry_date).toLocaleDateString()}.`;
                } else if (diffDays <= item.days_before_config) {
                    title = `Vencimento Próximo: ${item.description}`;
                    message = `O documento da entidade ${item.entity_name} vence em ${diffDays} dias (${new Date(item.expiry_date).toLocaleDateString()}).`;
                }

                if (title) {
                    const exists = currentNotifications.some(n =>
                        n.title === title &&
                        (new Date(n.created_at).toDateString() === today.toDateString() || n.is_read === 0)
                    );

                    if (!exists) {
                        await window.electron.db.addNotification({
                            id: crypto.randomUUID(),
                            type,
                            title,
                            message,
                            link: 'documents_deadlines'
                        });
                    }
                }
            }

            const updatedNotifications = await window.electron.db.getNotifications();
            setNotifications(updatedNotifications);
        } catch (error) {
            console.error('Error checking deadlines:', error);
        } finally {
            isCheckingDeadlines.current = false;
        }
    };

    const markNotificationAsRead = async (id: string) => {
        await window.electron.db.markAsRead(id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    };

    const markAllNotificationsAsRead = async () => {
        await window.electron.db.markAllAsRead();
        setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    };

    const deleteNotification = async (id: string) => {
        await window.electron.db.deleteNotification(id);
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return {
        notifications,
        setNotifications,
        deadlineSummary,
        setDeadlineSummary,
        checkDeadlinesAndNotify,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification
    };
};
