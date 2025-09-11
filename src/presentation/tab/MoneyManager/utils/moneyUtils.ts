import { Transaction, Account, Budget, SavingsGoal, Debt } from '../types/types';

export const generateId = (): string => {
    return `money_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const formatCurrency = (amount: number, currency: string): string => {
    const formatter = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
    return formatter.format(amount);
};

export const calculateAccountBalance = (
    account: Account,
    transactions: Transaction[]
): number => {
    return transactions.reduce((balance, transaction) => {
        if (transaction.type === 'income' && transaction.accountId === account.id) {
            return balance + transaction.amount;
        } else if (transaction.type === 'expense' && transaction.accountId === account.id) {
            return balance - transaction.amount;
        } else if (transaction.type === 'transfer') {
            if (transaction.accountId === account.id) {
                return balance - transaction.amount;
            } else if (transaction.toAccountId === account.id) {
                return balance + transaction.amount;
            }
        }
        return balance;
    }, account.balance);
};

export const calculateTotalBalance = (accounts: Account[], transactions: Transaction[]): number => {
    return accounts.reduce((total, account) => {
        return total + calculateAccountBalance(account, transactions);
    }, 0);
};

export const calculateCategorySpending = (
    categoryId: string,
    transactions: Transaction[],
    period: 'day' | 'week' | 'month' | 'year' = 'month'
): number => {
    const now = new Date();
    let startDate: Date;

    switch (period) {
        case 'day':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
        case 'week':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        default:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return transactions
        .filter(transaction =>
            transaction.type === 'expense' &&
            transaction.categoryId === categoryId &&
            transaction.date >= startDate &&
            transaction.status === 'completed'
        )
        .reduce((total, transaction) => total + transaction.amount, 0);
};

export const checkBudgetAlerts = (
    budgets: Budget[],
    transactions: Transaction[]
): { budget: Budget; currentSpending: number; percentage: number }[] => {
    const alerts: { budget: Budget; currentSpending: number; percentage: number }[] = [];

    budgets.forEach(budget => {
        if (!budget.alerts.enabled) return;

        let currentSpending = 0;

        if (budget.categoryId) {
            currentSpending = calculateCategorySpending(budget.categoryId, transactions, budget.period);
        } else if (budget.accountId) {
            // Calculate spending from specific account
            currentSpending = transactions
                .filter(transaction =>
                    transaction.type === 'expense' &&
                    transaction.accountId === budget.accountId &&
                    transaction.status === 'completed'
                )
                .reduce((total, transaction) => total + transaction.amount, 0);
        }

        const percentage = (currentSpending / budget.amount) * 100;

        if (percentage >= budget.alerts.threshold) {
            alerts.push({ budget, currentSpending, percentage });
        }
    });

    return alerts;
};

export const calculateSavingsProgress = (goal: SavingsGoal): { percentage: number; remaining: number; daysLeft?: number } => {
    const percentage = (goal.currentAmount / goal.targetAmount) * 100;
    const remaining = goal.targetAmount - goal.currentAmount;

    let daysLeft: number | undefined;
    if (goal.targetDate) {
        const today = new Date();
        const timeDiff = goal.targetDate.getTime() - today.getTime();
        daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
    }

    return { percentage, remaining, daysLeft };
};

export const calculateDebtProgress = (debt: Debt): { percentage: number; remaining: number } => {
    const percentage = ((debt.initialAmount - debt.currentAmount) / debt.initialAmount) * 100;
    const remaining = debt.currentAmount;
    return { percentage, remaining };
};

export const filterTransactionsByDateRange = (
    transactions: Transaction[],
    startDate: Date,
    endDate: Date
): Transaction[] => {
    return transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= startDate && transactionDate <= endDate;
    });
};

export const groupTransactionsByCategory = (transactions: Transaction[]): Map<string, number> => {
    const categoryMap = new Map<string, number>();

    transactions.forEach(transaction => {
        if (transaction.type !== 'expense' || !transaction.categoryId) return;

        const current = categoryMap.get(transaction.categoryId) || 0;
        categoryMap.set(transaction.categoryId, current + transaction.amount);
    });

    return categoryMap;
};

export const groupTransactionsByDate = (transactions: Transaction[]): Map<string, number> => {
    const dateMap = new Map<string, number>();

    transactions.forEach(transaction => {
        const dateKey = transaction.date.toISOString().split('T')[0];
        const current = dateMap.get(dateKey) || 0;

        if (transaction.type === 'income') {
            dateMap.set(dateKey, current + transaction.amount);
        } else if (transaction.type === 'expense') {
            dateMap.set(dateKey, current - transaction.amount);
        }
    });

    return dateMap;
};