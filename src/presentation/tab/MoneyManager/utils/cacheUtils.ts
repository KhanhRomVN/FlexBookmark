import { Transaction, Account, Category, Budget, SavingsGoal, Debt } from '../types/types';

const CACHE_KEYS = {
    TRANSACTIONS: 'money_transactions_cache',
    ACCOUNTS: 'money_accounts_cache',
    CATEGORIES: 'money_categories_cache',
    BUDGETS: 'money_budgets_cache',
    GOALS: 'money_goals_cache',
    DEBTS: 'money_debts_cache'
} as const;

const CACHE_EXPIRY = 60 * 60 * 1000; // 1 hour

const cacheData = async (key: string, data: any): Promise<void> => {
    const cacheData = {
        data,
        timestamp: Date.now()
    };

    return new Promise((resolve) => {
        chrome.storage.local.set({
            [key]: cacheData
        }, () => resolve());
    });
};

const getCachedData = async (key: string): Promise<any> => {
    return new Promise((resolve) => {
        chrome.storage.local.get([key], (result) => {
            if (!result[key] || !result[key].data) {
                resolve(null);
                return;
            }

            const { data, timestamp } = result[key];
            const isExpired = Date.now() - timestamp > CACHE_EXPIRY;

            if (isExpired) {
                resolve(null);
            } else {
                // Convert string dates back to Date objects
                const processedData = data.map((item: any) => ({
                    ...item,
                    createdAt: new Date(item.createdAt),
                    updatedAt: new Date(item.updatedAt),
                    date: item.date ? new Date(item.date) : undefined,
                    targetDate: item.targetDate ? new Date(item.targetDate) : undefined,
                    dueDate: item.dueDate ? new Date(item.dueDate) : undefined,
                    startDate: item.startDate ? new Date(item.startDate) : undefined,
                    endDate: item.endDate ? new Date(item.endDate) : undefined,
                    recurringEndDate: item.recurringEndDate ? new Date(item.recurringEndDate) : undefined
                }));
                resolve(processedData);
            }
        });
    });
};

// Transaction cache functions
export const cacheTransactions = async (transactions: Transaction[]): Promise<void> => {
    return cacheData(CACHE_KEYS.TRANSACTIONS, transactions);
};

export const getCachedTransactions = async (): Promise<Transaction[] | null> => {
    return getCachedData(CACHE_KEYS.TRANSACTIONS);
};

// Account cache functions
export const cacheAccounts = async (accounts: Account[]): Promise<void> => {
    return cacheData(CACHE_KEYS.ACCOUNTS, accounts);
};

export const getCachedAccounts = async (): Promise<Account[] | null> => {
    return getCachedData(CACHE_KEYS.ACCOUNTS);
};

// Category cache functions
export const cacheCategories = async (categories: Category[]): Promise<void> => {
    return cacheData(CACHE_KEYS.CATEGORIES, categories);
};

export const getCachedCategories = async (): Promise<Category[] | null> => {
    return getCachedData(CACHE_KEYS.CATEGORIES);
};

// Budget cache functions
export const cacheBudgets = async (budgets: Budget[]): Promise<void> => {
    return cacheData(CACHE_KEYS.BUDGETS, budgets);
};

export const getCachedBudgets = async (): Promise<Budget[] | null> => {
    return getCachedData(CACHE_KEYS.BUDGETS);
};

// Savings goal cache functions
export const cacheSavingsGoals = async (goals: SavingsGoal[]): Promise<void> => {
    return cacheData(CACHE_KEYS.GOALS, goals);
};

export const getCachedSavingsGoals = async (): Promise<SavingsGoal[] | null> => {
    return getCachedData(CACHE_KEYS.GOALS);
};

// Debt cache functions
export const cacheDebts = async (debts: Debt[]): Promise<void> => {
    return cacheData(CACHE_KEYS.DEBTS, debts);
};

export const getCachedDebts = async (): Promise<Debt[] | null> => {
    return getCachedData(CACHE_KEYS.DEBTS);
};

// Clear all cache
export const clearMoneyCache = async (): Promise<void> => {
    return new Promise((resolve) => {
        chrome.storage.local.remove([
            CACHE_KEYS.TRANSACTIONS,
            CACHE_KEYS.ACCOUNTS,
            CACHE_KEYS.CATEGORIES,
            CACHE_KEYS.BUDGETS,
            CACHE_KEYS.GOALS,
            CACHE_KEYS.DEBTS
        ], () => resolve());
    });
};