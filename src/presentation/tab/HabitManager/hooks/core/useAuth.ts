import { useState, useEffect, useCallback } from 'react';
import ChromeAuthManager, { AuthState } from '../../../../../utils/chromeAuth';

export const useAuth = () => {
    const authManager = ChromeAuthManager.getInstance();
    const [authState, setAuthState] = useState<AuthState>({
        isAuthenticated: false,
        user: null,
        loading: true,
        error: null,
    });

    useEffect(() => {
        const unsubscribe = authManager.subscribe(setAuthState);
        authManager.initialize();
        return unsubscribe;
    }, [authManager]);

    const handleLogin = useCallback(async () => {
        try {
            await authManager.login();
        } catch (err) {
            console.error("Login error:", err);
            throw new Error("Login failed. Please try again.");
        }
    }, [authManager]);

    const handleLogout = useCallback(async () => {
        try {
            await authManager.logout();
        } catch (err) {
            console.error("Logout error:", err);
        }
    }, [authManager]);

    const handleForceReauth = useCallback(async () => {
        try {
            await authManager.forceReauth();
        } catch (err) {
            console.error("Force reauth error:", err);
            throw new Error("Permission grant failed. Please try again.");
        }
    }, [authManager]);

    return {
        authState,
        authManager,
        handleLogin,
        handleLogout,
        handleForceReauth
    };
};