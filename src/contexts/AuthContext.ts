// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import ChromeAuthManager from '../utils/chromeAuth';
import { AuthState } from '../utils/chromeAuth';

interface AuthContextType {
    authState: AuthState;
    login: () => Promise<boolean>;
    logout: () => Promise<void>;
    initialize: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [authState, setAuthState] = useState<AuthState>({
        isAuthenticated: false,
        user: null,
        loading: true,
        error: null
    });

    useEffect(() => {
        initialize();
    }, []);

    const initialize = async () => {
        const authManager = ChromeAuthManager.getInstance();
        const unsubscribe = authManager.subscribe(setAuthState);
        await authManager.initialize();
        return unsubscribe;
    };

    const login = async () => {
        const authManager = ChromeAuthManager.getInstance();
        return await authManager.login();
    };

    const logout = async () => {
        const authManager = ChromeAuthManager.getInstance();
        await authManager.logout();
    };

    return (
        <AuthContext.Provider value= {{ authState, login, logout, initialize }
}>
    { children }
    </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};