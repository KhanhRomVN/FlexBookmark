import {
    TransactionFormData,
    AccountFormData,
    CategoryFormData,
    BudgetFormData,
    SavingsGoalFormData,
    DebtFormData
} from '../types/types';

export const validateTransaction = (data: TransactionFormData): string[] => {
    const errors: string[] = [];

    if (!data.type) {
        errors.push('Transaction type is required');
    }

    if (!data.amount || data.amount <= 0) {
        errors.push('Amount must be greater than 0');
    }

    if (!data.currency) {
        errors.push('Currency is required');
    }

    if (!data.accountId) {
        errors.push('Account is required');
    }

    if (data.type === 'transfer' && !data.toAccountId) {
        errors.push('Destination account is required for transfers');
    }

    if ((data.type === 'income' || data.type === 'expense') && !data.categoryId) {
        errors.push('Category is required for income/expense transactions');
    }

    if (!data.date) {
        errors.push('Date is required');
    }

    if (!data.description || data.description.trim().length === 0) {
        errors.push('Description is required');
    } else if (data.description.length > 200) {
        errors.push('Description must be 200 characters or less');
    }

    if (data.tags && data.tags.length > 10) {
        errors.push('Maximum 10 tags allowed');
    }

    return errors;
};

export const validateAccount = (data: AccountFormData): string[] => {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length === 0) {
        errors.push('Account name is required');
    } else if (data.name.length > 50) {
        errors.push('Account name must be 50 characters or less');
    }

    if (!data.type) {
        errors.push('Account type is required');
    }

    if (data.initialBalance === undefined || data.initialBalance === null) {
        errors.push('Initial balance is required');
    }

    if (!data.currency) {
        errors.push('Currency is required');
    }

    if (!data.color) {
        errors.push('Color is required');
    }

    if (!data.icon) {
        errors.push('Icon is required');
    }

    return errors;
};

export const validateCategory = (data: CategoryFormData): string[] => {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length === 0) {
        errors.push('Category name is required');
    } else if (data.name.length > 50) {
        errors.push('Category name must be 50 characters or less');
    }

    if (!data.type) {
        errors.push('Category type is required');
    }

    if (!data.color) {
        errors.push('Color is required');
    }

    if (!data.icon) {
        errors.push('Icon is required');
    }

    if (data.budget && data.budget <= 0) {
        errors.push('Budget must be greater than 0');
    }

    if (data.budget && !data.budgetPeriod) {
        errors.push('Budget period is required when setting a budget');
    }

    return errors;
};

export const validateBudget = (data: BudgetFormData): string[] => {
    const errors: string[] = [];

    if (!data.categoryId && !data.accountId) {
        errors.push('Either category or account must be specified');
    }

    if (!data.amount || data.amount <= 0) {
        errors.push('Budget amount must be greater than 0');
    }

    if (!data.period) {
        errors.push('Budget period is required');
    }

    if (!data.startDate) {
        errors.push('Start date is required');
    }

    if (data.endDate && data.endDate <= data.startDate) {
        errors.push('End date must be after start date');
    }

    if (data.alertsEnabled && (data.alertThreshold <= 0 || data.alertThreshold > 100)) {
        errors.push('Alert threshold must be between 1 and 100 percent');
    }

    return errors;
};

export const validateSavingsGoal = (data: SavingsGoalFormData): string[] => {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length === 0) {
        errors.push('Goal name is required');
    } else if (data.name.length > 50) {
        errors.push('Goal name must be 50 characters or less');
    }

    if (!data.targetAmount || data.targetAmount <= 0) {
        errors.push('Target amount must be greater than 0');
    }

    if (data.currentAmount === undefined || data.currentAmount === null) {
        errors.push('Current amount is required');
    }

    if (data.currentAmount < 0) {
        errors.push('Current amount cannot be negative');
    }

    if (data.currentAmount > data.targetAmount) {
        errors.push('Current amount cannot exceed target amount');
    }

    if (data.targetDate && data.targetDate <= new Date()) {
        errors.push('Target date must be in the future');
    }

    if (!data.color) {
        errors.push('Color is required');
    }

    if (!data.icon) {
        errors.push('Icon is required');
    }

    return errors;
};

export const validateDebt = (data: DebtFormData): string[] => {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length === 0) {
        errors.push('Debt name is required');
    } else if (data.name.length > 50) {
        errors.push('Debt name must be 50 characters or less');
    }

    if (!data.initialAmount || data.initialAmount <= 0) {
        errors.push('Initial amount must be greater than 0');
    }

    if (data.interestRate && data.interestRate < 0) {
        errors.push('Interest rate cannot be negative');
    }

    if (data.dueDate && data.dueDate <= new Date()) {
        errors.push('Due date must be in the future');
    }

    if (!data.type) {
        errors.push('Debt type is required');
    }

    return errors;
};