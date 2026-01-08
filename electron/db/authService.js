import db from './database.js';

export const authService = {
    login: (email, password) => {
        return db.prepare('SELECT * FROM users WHERE email = ? AND password = ?').get(email, password);
    },
};
