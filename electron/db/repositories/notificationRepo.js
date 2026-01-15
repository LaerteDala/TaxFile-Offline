import db from '../database.js';

export const notificationRepo = {
    getNotifications: () => {
        return db.prepare("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50").all();
    },

    markAsRead: (id) => {
        return db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ?").run(id);
    },

    markAllAsRead: () => {
        return db.prepare("UPDATE notifications SET is_read = 1").run();
    },

    addNotification: (data) => {
        const { id, type, title, message, link } = data;
        return db.prepare(`
            INSERT INTO notifications (id, type, title, message, link)
            VALUES (?, ?, ?, ?, ?)
        `).run(id, type, title, message, link);
    },

    deleteNotification: (id) => {
        return db.prepare("DELETE FROM notifications WHERE id = ?").run(id);
    },

    clearOldNotifications: (days = 30) => {
        return db.prepare("DELETE FROM notifications WHERE created_at < date('now', ?)")
            .run(`-${days} days`);
    }
};
