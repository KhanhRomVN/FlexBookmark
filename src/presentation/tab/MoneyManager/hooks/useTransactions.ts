import { useState, useEffect, useCallback } from 'react';
import { Transaction, TransactionFormData } from '../types/types';
import { useAuth } from '../../../../contexts/AuthContext';
import { MoneyServer } from '../services/moneyService';
import { cacheTransactions, getCachedTransactions } from '../utils/cacheUtils';

export const useTransactions = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const { authState, getFreshToken } = useAuth();

    const loadTransactions = useCallback(async () => {
        if (!authState.isAuthenticated) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            // Try to load from cache first
            const cachedTransactions = await getCachedTransactions();
            if (cachedTransactions) {
                setTransactions(cachedTransactions);
            }

            // Load from server
            const token = await getFreshToken();
            if (token) {
                const moneyService = new MoneyServer(token);
                const transactionsData = await moneyService.fetchTransactions();
                setTransactions(transactionsData);
                await cacheTransactions(transactionsData);
            }
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, [authState.isAuthenticated, getFreshToken]);

    const addTransaction = useCallback(async (formData: TransactionFormData) => {
        if (!authState.isAuthenticated) {
            throw new Error('Not authenticated');
        }

        try {
            const token = await getFreshToken();
            if (!token) {
                throw new Error('Failed to get token');
            }

            const moneyService = new MoneyServer(token);
            await moneyService.createTransaction(formData);

            // Reload transactions to get the latest data
            await loadTransactions();
        } catch (err) {
            setError((err as Error).message);
            throw err;
        }
    }, [authState.isAuthenticated, getFreshToken, loadTransactions]);

    const updateTransaction = useCallback(async (transaction: Transaction) => {
        if (!authState.isAuthenticated) {
            throw new Error('Not authenticated');
        }

        try {
            const token = await getFreshToken();
            if (!token) {
                throw new Error('Failed to get token');
            }

            const moneyService = new MoneyServer(token);
            await moneyService.updateTransaction(transaction);

            // Update local state
            setTransactions(prev => prev.map(t => t.id === transaction.id ? transaction : t));
            await cacheTransactions(transactions.map(t => t.id === transaction.id ? transaction : t));
        } catch (err) {
            setError((err as Error).message);
            throw err;
        }
    }, [authState.isAuthenticated, getFreshToken, transactions]);

    const deleteTransaction = useCallback(async (transactionId: string) => {
        if (!authState.isAuthenticated) {
            throw new Error('Not authenticated');
        }

        try {
            const token = await getFreshToken();
            if (!token) {
                throw new Error('Failed to get token');
            }

            const moneyService = new MoneyServer(token);
            await moneyService.deleteTransaction(transactionId);

            // Update local state
            setTransactions(prev => prev.filter(t => t.id !== transactionId));
            await cacheTransactions(transactions.filter(t => t.id !== transactionId));
        } catch (err) {
            setError((err as Error).message);
            throw err;
        }
    }, [authState.isAuthenticated, getFreshToken, transactions]);

    useEffect(() => {
        loadTransactions();
    }, [loadTransactions]);

    return {
        transactions,
        loading,
        error,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        reloadTransactions: loadTransactions
    };
};