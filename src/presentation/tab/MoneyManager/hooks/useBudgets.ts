import { useState, useEffect, useCallback } from 'react';
import { Budget, BudgetFormData } from '../types/types';
import { useAuth } from '../../../../contexts/AuthContext';
import { MoneyServer } from '../services/moneyService';
import { cacheBudgets, getCachedBudgets } from '../utils/cacheUtils';

export const useBudgets = () => {
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const { authState, getFreshToken } = useAuth();

    const loadBudgets = useCallback(async () => {
        if (!authState.isAuthenticated) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            // Try to load from cache first
            const cachedBudgets = await getCachedBudgets();
            if (cachedBudgets) {
                setBudgets(cachedBudgets);
            }

            // Load from server
            const token = await getFreshToken();
            if (token) {
                const moneyService = new MoneyServer(token);
                const budgetsData = await moneyService.fetchBudgets();
                setBudgets(budgetsData);
                await cacheBudgets(budgetsData);
            }
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, [authState.isAuthenticated, getFreshToken]);

    const addBudget = useCallback(async (formData: BudgetFormData) => {
        if (!authState.isAuthenticated) {
            throw new Error('Not authenticated');
        }

        try {
            const token = await getFreshToken();
            if (!token) {
                throw new Error('Failed to get token');
            }

            const moneyService = new MoneyServer(token);
            await moneyService.createBudget(formData);

            // Reload budgets to get the latest data
            await loadBudgets();
        } catch (err) {
            setError((err as Error).message);
            throw err;
        }
    }, [authState.isAuthenticated, getFreshToken, loadBudgets]);

    useEffect(() => {
        loadBudgets();
    }, [loadBudgets]);

    return {
        budgets,
        loading,
        error,
        addBudget,
        reloadBudgets: loadBudgets
    };
};