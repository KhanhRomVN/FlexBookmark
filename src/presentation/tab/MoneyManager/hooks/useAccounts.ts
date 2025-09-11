import { useState, useEffect, useCallback } from 'react';
import { Account, AccountFormData } from '../types/types';
import { useAuth } from '../../../../contexts/AuthContext';
import { MoneyServer } from '../services/moneyService';
import { cacheAccounts, getCachedAccounts } from '../utils/cacheUtils';

export const useAccounts = () => {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const { authState, getFreshToken } = useAuth();

    const loadAccounts = useCallback(async () => {
        if (!authState.isAuthenticated) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            // Try to load from cache first
            const cachedAccounts = await getCachedAccounts();
            if (cachedAccounts) {
                setAccounts(cachedAccounts);
            }

            // Load from server
            const token = await getFreshToken();
            if (token) {
                const moneyService = new MoneyServer(token);
                const accountsData = await moneyService.fetchAccounts();
                setAccounts(accountsData);
                await cacheAccounts(accountsData);
            }
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, [authState.isAuthenticated, getFreshToken]);

    const addAccount = useCallback(async (formData: AccountFormData) => {
        if (!authState.isAuthenticated) {
            throw new Error('Not authenticated');
        }

        try {
            const token = await getFreshToken();
            if (!token) {
                throw new Error('Failed to get token');
            }

            const moneyService = new MoneyServer(token);
            await moneyService.createAccount(formData);

            // Reload accounts to get the latest data
            await loadAccounts();
        } catch (err) {
            setError((err as Error).message);
            throw err;
        }
    }, [authState.isAuthenticated, getFreshToken, loadAccounts]);

    const updateAccount = useCallback(async (account: Account) => {
        if (!authState.isAuthenticated) {
            throw new Error('Not authenticated');
        }

        try {
            const token = await getFreshToken();
            if (!token) {
                throw new Error('Failed to get token');
            }

            const moneyService = new MoneyServer(token);
            await moneyService.updateAccount(account);

            // Update local state
            setAccounts(prev => prev.map(a => a.id === account.id ? account : a));
            await cacheAccounts(accounts.map(a => a.id === account.id ? account : a));
        } catch (err) {
            setError((err as Error).message);
            throw err;
        }
    }, [authState.isAuthenticated, getFreshToken, accounts]);

    useEffect(() => {
        loadAccounts();
    }, [loadAccounts]);

    return {
        accounts,
        loading,
        error,
        addAccount,
        updateAccount,
        reloadAccounts: loadAccounts
    };
};