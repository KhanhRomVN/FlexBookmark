// src/presentation/tab/MoneyManager/types/types.ts
export interface Account {
    id: string;
    name: string;
    type: 'cash' | 'bank' | 'ewallet' | 'credit_card' | 'investment';
    balance: number;
    currency: string;
    color: string;
    icon: string;
    description?: string; // ADDED: Optional description field
    isArchived: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Category {
    id: string;
    name: string;
    type: 'income' | 'expense';
    parentId?: string;
    color: string;
    icon: string;
    isDefault: boolean;
    isArchived: boolean;
    budget?: number;
    budgetPeriod?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface Transaction {
    id: string;
    type: 'income' | 'expense' | 'transfer';
    amount: number;
    currency: string;
    accountId: string;
    toAccountId?: string; // For transfers
    categoryId?: string; // Not needed for transfers
    date: Date;
    description: string;
    tags: string[];
    status: 'completed' | 'pending' | 'cancelled';
    createdAt: Date;
    updatedAt: Date;
    isRecurring?: boolean;
    recurringPattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    recurringEndDate?: Date;
}

export interface Budget {
    id: string;
    categoryId?: string;
    accountId?: string;
    amount: number;
    period: 'daily' | 'weekly' | 'monthly' | 'yearly';
    startDate: Date;
    endDate?: Date;
    alerts: {
        enabled: boolean;
        threshold: number; // Percentage
    };
}

export interface SavingsGoal {
    currency(targetAmount: number, currency: (currentAmount: number, currency: any) => import("react").ReactNode): import("react").ReactNode;
    currency(currentAmount: number, currency: any): import("react").ReactNode;
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    targetDate?: Date;
    color: string;
    icon: string;
    isCompleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Debt {
    id: string;
    name: string;
    initialAmount: number;
    currentAmount: number;
    interestRate?: number;
    dueDate?: Date;
    type: 'borrowed' | 'lent';
    status: 'active' | 'paid';
    createdAt: Date;
    updatedAt: Date;
}

export interface ExchangeRate {
    fromCurrency: string;
    toCurrency: string;
    rate: number;
    lastUpdated: Date;
}

// Form data types
export interface TransactionFormData {
    type: 'income' | 'expense' | 'transfer';
    amount: number;
    currency: string;
    accountId: string;
    toAccountId?: string;
    categoryId?: string;
    date: Date;
    description: string;
    tags: string[];
}

export interface AccountFormData {
    name: string;
    type: 'cash' | 'bank' | 'ewallet' | 'credit_card' | 'investment';
    balance: number; // FIXED: Changed from initialBalance to balance to match AccountModal
    currency: string;
    color: string;
    icon: string;
    description?: string; // ADDED: Optional description field
}

export interface CategoryFormData {
    name: string;
    type: 'income' | 'expense';
    parentId?: string;
    color: string;
    icon: string;
    budget?: number;
    budgetPeriod?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface BudgetFormData {
    categoryId?: string;
    accountId?: string;
    amount: number;
    period: 'daily' | 'weekly' | 'monthly' | 'yearly';
    startDate: Date;
    endDate?: Date;
    alertsEnabled: boolean;
    alertThreshold: number;
}

export interface SavingsGoalFormData {
    name: string;
    targetAmount: number;
    currentAmount: number;
    targetDate?: Date;
    color: string;
    icon: string;
}

export interface DebtFormData {
    name: string;
    initialAmount: number;
    interestRate?: number;
    dueDate?: Date;
    type: 'borrowed' | 'lent';
}