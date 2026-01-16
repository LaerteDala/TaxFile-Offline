import { useState, useEffect } from 'react';

export const useAuth = (onLogin?: () => void, onLogout?: () => void) => {
    const [session, setSession] = useState<any>(null);

    useEffect(() => {
        const savedUser = localStorage.getItem('taxfile_user');
        if (savedUser) {
            const user = JSON.parse(savedUser);
            setSession({ user });
            if (onLogin) onLogin();
        }

        const handleLoginEvent = (e: any) => {
            const user = e.detail;
            setSession({ user });
            localStorage.setItem('taxfile_user', JSON.stringify(user));
            if (onLogin) onLogin();
        };

        window.addEventListener('app:login', handleLoginEvent);
        return () => window.removeEventListener('app:login', handleLoginEvent);
    }, []);

    const handleLogout = async () => {
        if (confirm('Deseja realmente sair do sistema?')) {
            setSession(null);
            localStorage.removeItem('taxfile_user');
            if (onLogout) onLogout();
        }
    };

    return {
        session,
        setSession,
        handleLogout
    };
};
