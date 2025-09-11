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
    AccountFormData,
    CategoryFormData,
    BudgetFormData,
    SavingsGoalFormData,
    DebtFormData
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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [sheetId, setSheetId] = useState<string>('');
    const [hasDriveAccess, setHasDriveAccess] = useState(false);
    const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
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

    // Load data from cache first
    useEffect(() => {
        const loadFromCache = async () => {
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

                if (cachedTransactions) {
                    setTransactions(cachedTransactions);
                }
                if (cachedAccounts) {
                    setAccounts(cachedAccounts);
                }
                if (cachedCategories) {
                    setCategories(cachedCategories);
                }
                if (cachedBudgets) {
                    setBudgets(cachedBudgets);
                }
                if (cachedSavingsGoals) {
                    setSavingsGoals(cachedSavingsGoals);
                }
                if (cachedDebts) {
                    setDebts(cachedDebts);
                }

                setLoading(false);
            } catch (cacheError) {
                console.error('Error loading from cache:', cacheError);
                setLoading(true);
            }
        };
        loadFromCache();
    }, []);

    const loadMoneyData = useCallback(async (isBackground: boolean = false) => {
        if (isBackground) {
            const now = Date.now();
            if (now - lastSyncRef.current < SYNC_COOLDOWN) {
                console.log('Sync skipped - in cooldown period');
                return;
            }
        }

        if (!authState.isAuthenticated) {
            console.warn('Cannot load money data: missing auth');
            setLoading(false);
            return;
        }

        if (!hasDriveAccess) {
            console.log('No drive access');
            setLoading(false);
            return;
        }

        try {
            if (!isBackground) {
                setLoading(true);
            } else {
                setIsBackgroundLoading(true);
            }

            const token = await getFreshToken();
            if (!token) {
                console.error('Failed to get fresh token');
                setLoading(false);
                return;
            }

            const moneyService = new MoneyServer(token);
            let currentSheetId = sheetId;

            if (!currentSheetId) {
                try {
                    console.log('Setting up Drive...');
                    const id = await moneyService.setupDrive();
                    setSheetId(id);
                    currentSheetId = id;
                    console.log('Drive setup complete, sheet ID:', id);
                } catch (setupError) {
                    console.log('Drive setup failed, using empty data');
                    setTransactions([]);
                    setAccounts([]);
                    setCategories([]);
                    setBudgets([]);
                    setSavingsGoals([]);
                    setDebts([]);
                    await clearMoneyCache();
                    return;
                }
            }

            if (currentSheetId) {
                console.log('Fetching money data from server...');
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

                setTransactions(transactionsData);
                setAccounts(accountsData);
                setCategories(categoriesData);
                setBudgets(budgetsData);
                setSavingsGoals(savingsGoalsData);
                setDebts(debtsData);

                // Cache the data
                await Promise.all([
                    cacheTransactions(transactionsData),
                    cacheAccounts(accountsData),
                    cacheCategories(categoriesData),
                    cacheBudgets(budgetsData),
                    cacheSavingsGoals(savingsGoalsData),
                    cacheDebts(debtsData)
                ]);

                lastSyncRef.current = Date.now();

                if (isBackground) {
                    console.log('Background sync completed');
                }
            }
        } catch (err) {
            console.error('Error loading money data:', err);
            setError((err as Error).message);
        } finally {
            setLoading(false);
            setIsBackgroundLoading(false);
        }
    }, [sheetId, authState.isAuthenticated, hasDriveAccess, getFreshToken]);

    // Background sync function for individual entities
    const updateEntityInBackground = useCallback(async (
        entityType: 'transaction' | 'account' | 'category' | 'budget' | 'savingsGoal' | 'debt',
        entity: any
    ) => {
        try {
            const token = await getFreshToken();
            if (!token) {
                throw new Error('Failed to get fresh token');
            }

            const moneyService = new MoneyServer(token);
            switch (entityType) {
                case 'transaction':
                    await moneyService.updateTransaction(entity);
                    break;
                case 'account':
                    await moneyService.updateAccount(entity);
                    break;
                case 'category':
                    await moneyService.updateCategory(entity);
                    break;
                case 'budget':
                    // Note: Budget update might not be implemented in moneyService yet
                    console.warn('Budget update not implemented');
                    break;
                case 'savingsGoal':
                    // Note: SavingsGoal update might not be implemented in moneyService yet
                    console.warn('SavingsGoal update not implemented');
                    break;
                case 'debt':
                    // Note: Debt update might not be implemented in moneyService yet
                    console.warn('Debt update not implemented');
                    break;
            }
            console.log('Background sync successful for', entityType, entity.id);
        } catch (error) {
            console.error('Background sync error:', error);
            throw error;
        }
    }, [getFreshToken]);

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

    // Similar functions for other entities (addAccount, addCategory, etc.) can be implemented here

    useEffect(() => {
        if (authState.isAuthenticated && hasDriveAccess) {
            if (isInitialLoad) {
                loadMoneyData(false);
                setIsInitialLoad(false);
            } else if (transactions.length > 0 || accounts.length > 0) {
                // Only sync in background if we have cached data and not in cooldown
                const now = Date.now();
                if (now - lastSyncRef.current >= SYNC_COOLDOWN) {
                    console.log('Starting background sync...');
                    loadMoneyData(true);
                }
            }
        }
    }, [authState.isAuthenticated, hasDriveAccess, loadMoneyData, isInitialLoad, transactions.length, accounts.length]);

    return {
        transactions,
        accounts,
        categories,
        budgets,
        savingsGoals,
        debts,
        loading,
        error,
        addTransaction,
        // Add other functions for updating and deleting entities
        reloadMoneyData: loadMoneyData,
        isAuthenticated: authState.isAuthenticated,
        hasDriveAccess,
        isBackgroundLoading
    };
};