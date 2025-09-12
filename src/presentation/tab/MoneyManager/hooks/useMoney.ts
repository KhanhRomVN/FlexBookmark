// src/presentation/tab/MoneyManager/hooks/useMoney.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { MoneyServer } from '../services/moneyService';
import {
    Transaction,
    Account,
    Category,
    Budget,
    SavingsGoal,
    Debt,
    TransactionFormData,
} from '../types/types';
import { useAuth } from '../../../../contexts/AuthContext';
import {
    cacheTransactions,
    getCachedTransactions,
    cacheAccounts,
    getCachedAccounts,
    cacheCategories,
    getCachedCategories,
    cacheBudgets,
    getCachedBudgets,
    cacheSavingsGoals,
    getCachedSavingsGoals,
    cacheDebts,
    getCachedDebts,
    clearMoneyCache
} from '../utils/cacheUtils';

export const useMoney = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
    const [debts, setDebts] = useState<Debt[]>([]);
    const [error, setError] = useState<string>('');
    const [sheetId, setSheetId] = useState<string>('');
    const [hasDriveAccess, setHasDriveAccess] = useState(false);
    const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);
    const [hasInitialData, setHasInitialData] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'loading' | 'error'>('loading');
    const lastSyncRef = useRef<number>(0);
    const SYNC_COOLDOWN = 30000; // 30 seconds cooldown

    const { authState, getFreshToken } = useAuth();

    // Check Drive access when auth state changes
    useEffect(() => {
        const checkDriveAccess = async () => {
            if (authState.isAuthenticated && authState.user) {
                setHasDriveAccess(true);
            } else {
                setHasDriveAccess(false);
            }
        };

        checkDriveAccess();
    }, [authState.isAuthenticated, authState.user]);

    // Load cached data on mount
    useEffect(() => {
        const loadCachedData = async () => {
            try {
                const [
                    cachedTransactions,
                    cachedAccounts,
                    cachedCategories,
                    cachedBudgets,
                    cachedSavingsGoals,
                    cachedDebts
                ] = await Promise.all([
                    getCachedTransactions(),
                    getCachedAccounts(),
                    getCachedCategories(),
                    getCachedBudgets(),
                    getCachedSavingsGoals(),
                    getCachedDebts()
                ]);

                // Update state with cached data if available
                if (cachedTransactions) setTransactions(cachedTransactions);
                if (cachedAccounts) setAccounts(cachedAccounts);
                if (cachedCategories) setCategories(cachedCategories);
                if (cachedBudgets) setBudgets(cachedBudgets);
                if (cachedSavingsGoals) setSavingsGoals(cachedSavingsGoals);
                if (cachedDebts) setDebts(cachedDebts);

                // Mark that we have initial data to show if any cached data exists
                // Even if cached data is empty, we should still set hasInitialData to true
                // to avoid showing the initial loading screen
                setHasInitialData(true);
                setConnectionStatus('connected');

            } catch (cacheError) {
                console.error('Error loading from cache:', cacheError);
                // Even if cache loading fails, set hasInitialData to true
                // to avoid being stuck on loading screen
                setHasInitialData(true);
            }
        };

        loadCachedData();
    }, []);

    // Modified loadMoneyData function with background sync priority
    const loadMoneyData = useCallback(async (isBackground: boolean = false) => {
        if (isBackground) {
            const now = Date.now();
            if (now - lastSyncRef.current < SYNC_COOLDOWN) {
                return;
            }
        }

        if (!authState.isAuthenticated) {
            setConnectionStatus('error');
            return;
        }

        if (!hasDriveAccess) {
            setConnectionStatus('error');
            return;
        }

        try {
            if (!isBackground) {
                setConnectionStatus('loading');
            } else {
                setIsBackgroundLoading(true);
            }

            const token = await getFreshToken();
            if (!token) {
                console.error('Failed to get fresh token');
                setConnectionStatus('error');
                return;
            }

            const moneyService = new MoneyServer(token);
            let currentSheetId = sheetId;

            if (!currentSheetId) {
                try {
                    const id = await moneyService.setupDrive();
                    setSheetId(id);
                    currentSheetId = id;
                } catch (setupError) {
                    console.log('Drive setup failed, using cached data');
                    setConnectionStatus('error');
                    return;
                }
            }

            if (currentSheetId) {
                const [
                    transactionsData,
                    accountsData,
                    categoriesData,
                    budgetsData,
                    savingsGoalsData,
                    debtsData
                ] = await Promise.all([
                    moneyService.fetchTransactions(),
                    moneyService.fetchAccounts(),
                    moneyService.fetchCategories(),
                    moneyService.fetchBudgets(),
                    moneyService.fetchSavingsGoals(),
                    moneyService.fetchDebts()
                ]);

                // Update state with new data
                setTransactions(transactionsData);
                setAccounts(accountsData);
                setCategories(categoriesData);
                setBudgets(budgetsData);
                setSavingsGoals(savingsGoalsData);
                setDebts(debtsData);

                // Cache the new data
                await Promise.all([
                    cacheTransactions(transactionsData),
                    cacheAccounts(accountsData),
                    cacheCategories(categoriesData),
                    cacheBudgets(budgetsData),
                    cacheSavingsGoals(savingsGoalsData),
                    cacheDebts(debtsData)
                ]);

                setHasInitialData(true);
                lastSyncRef.current = Date.now();
                setConnectionStatus('connected');
            }
        } catch (err) {
            console.error('Error loading money data:', err);
            setError((err as Error).message);
            setConnectionStatus('error');
            // Even if there's an error, we should set hasInitialData to true
            // to avoid being stuck on loading screen
            setHasInitialData(true);
        } finally {
            setIsBackgroundLoading(false);
        }
    }, [sheetId, authState.isAuthenticated, hasDriveAccess, getFreshToken]);

    // Function to add a new transaction
    const addTransaction = useCallback(async (formData: TransactionFormData) => {
        if (!authState.isAuthenticated || !hasDriveAccess) {
            throw new Error('Not authenticated or missing Drive access');
        }

        try {
            const token = await getFreshToken();
            if (!token) {
                throw new Error('Failed to get fresh token');
            }

            const moneyService = new MoneyServer(token);
            await moneyService.createTransaction(formData);

            // Reload transactions to get the latest data
            await loadMoneyData(true);
        } catch (err) {
            setError((err as Error).message);
            throw err;
        }
    }, [authState.isAuthenticated, hasDriveAccess, getFreshToken, loadMoneyData]);

    // Background sync when authenticated and has drive access
    useEffect(() => {
        if (authState.isAuthenticated && hasDriveAccess) {
            // Start background sync after cached data is loaded
            loadMoneyData(hasInitialData);
        }
    }, [authState.isAuthenticated, hasDriveAccess, loadMoneyData, hasInitialData]);

    return {
        transactions,
        accounts,
        categories,
        budgets,
        savingsGoals,
        debts,
        error,
        addTransaction,
        reloadMoneyData: loadMoneyData,
        isAuthenticated: authState.isAuthenticated,
        hasDriveAccess,
        isBackgroundLoading,
        connectionStatus,
        hasInitialData
    };
};