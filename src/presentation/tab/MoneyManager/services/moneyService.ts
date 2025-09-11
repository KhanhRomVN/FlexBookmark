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
import { SheetService } from './sheetService';
import { generateId } from '../utils/moneyUtils';

export class MoneyServer {
    private sheetService: SheetService;

    constructor(accessToken: string) {
        this.sheetService = new SheetService(accessToken);
    }

    async setupDrive(): Promise<string> {
        return await this.sheetService.setupDrive();
    }

    // Transaction methods
    async fetchTransactions(): Promise<Transaction[]> {
        const rows = await this.sheetService.fetchRowsFromSheet('transactions');
        return rows.map(row => this.rowToTransaction(row));
    }

    async createTransaction(data: TransactionFormData): Promise<void> {
        const transaction: Transaction = {
            id: generateId(),
            ...data,
            status: 'completed',
            tags: data.tags || [],
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const row = this.transactionToRow(transaction);
        await this.sheetService.appendRow('transactions', row);
    }

    async updateTransaction(transaction: Transaction): Promise<void> {
        const row = this.transactionToRow(transaction);
        const rowIndex = await this.sheetService.findRowIndex('transactions', 'A', transaction.id);
        await this.sheetService.updateRow('transactions', rowIndex, row);
    }

    async deleteTransaction(transactionId: string): Promise<void> {
        const rowIndex = await this.sheetService.findRowIndex('transactions', 'A', transactionId);
        await this.sheetService.deleteRow('transactions', rowIndex);
    }

    // Account methods
    async fetchAccounts(): Promise<Account[]> {
        const rows = await this.sheetService.fetchRowsFromSheet('accounts');
        return rows.map(row => this.rowToAccount(row));
    }

    async createAccount(data: AccountFormData): Promise<void> {
        const account: Account = {
            id: generateId(),
            ...data,
            balance: data.initialBalance,
            isArchived: false,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const row = this.accountToRow(account);
        await this.sheetService.appendRow('accounts', row);
    }

    async updateAccount(account: Account): Promise<void> {
        const row = this.accountToRow(account);
        const rowIndex = await this.sheetService.findRowIndex('accounts', 'A', account.id);
        await this.sheetService.updateRow('accounts', rowIndex, row);
    }

    // Category methods
    async fetchCategories(): Promise<Category[]> {
        const rows = await this.sheetService.fetchRowsFromSheet('categories');
        return rows.map(row => this.rowToCategory(row));
    }

    async createCategory(data: CategoryFormData): Promise<void> {
        const category: Category = {
            id: generateId(),
            ...data,
            isDefault: false,
            isArchived: false,
        };
        const row = this.categoryToRow(category);
        await this.sheetService.appendRow('categories', row);
    }

    async updateCategory(category: Category): Promise<void> {
        const row = this.categoryToRow(category);
        const rowIndex = await this.sheetService.findRowIndex('categories', 'A', category.id);
        await this.sheetService.updateRow('categories', rowIndex, row);
    }

    // Budget methods
    async fetchBudgets(): Promise<Budget[]> {
        const rows = await this.sheetService.fetchRowsFromSheet('budgets');
        return rows.map(row => this.rowToBudget(row));
    }

    async createBudget(data: BudgetFormData): Promise<void> {
        const budget: Budget = {
            id: generateId(),
            categoryId: data.categoryId,
            accountId: data.accountId,
            amount: data.amount,
            period: data.period,
            startDate: data.startDate,
            endDate: data.endDate,
            alerts: {
                enabled: data.alertsEnabled,
                threshold: data.alertThreshold
            }
        };
        const row = this.budgetToRow(budget);
        await this.sheetService.appendRow('budgets', row);
    }

    // Savings Goal methods
    async fetchSavingsGoals(): Promise<SavingsGoal[]> {
        const rows = await this.sheetService.fetchRowsFromSheet('savings_goals');
        return rows.map(row => this.rowToSavingsGoal(row));
    }

    async createSavingsGoal(data: SavingsGoalFormData): Promise<void> {
        const goal: SavingsGoal = {
            id: generateId(),
            ...data,
            isCompleted: data.currentAmount >= data.targetAmount,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const row = this.savingsGoalToRow(goal);
        await this.sheetService.appendRow('savings_goals', row);
    }

    // Debt methods
    async fetchDebts(): Promise<Debt[]> {
        const rows = await this.sheetService.fetchRowsFromSheet('debts');
        return rows.map(row => this.rowToDebt(row));
    }

    async createDebt(data: DebtFormData): Promise<void> {
        const debt: Debt = {
            id: generateId(),
            ...data,
            currentAmount: data.initialAmount,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const row = this.debtToRow(debt);
        await this.sheetService.appendRow('debts', row);
    }

    // Conversion methods between rows and objects
    private rowToTransaction(row: any[]): Transaction {
        return {
            id: row[0],
            type: row[1] as 'income' | 'expense' | 'transfer',
            amount: parseFloat(row[2]),
            currency: row[3],
            accountId: row[4],
            toAccountId: row[5],
            categoryId: row[6],
            date: new Date(row[7]),
            description: row[8],
            tags: row[9] ? row[9].split(',') : [],
            status: row[10] as 'completed' | 'pending' | 'cancelled',
            createdAt: new Date(row[11]),
            updatedAt: new Date(row[12]),
            isRecurring: row[13] === 'TRUE',
            recurringPattern: row[14] as 'daily' | 'weekly' | 'monthly' | 'yearly',
            recurringEndDate: row[15] ? new Date(row[15]) : undefined
        };
    }

    private transactionToRow(transaction: Transaction): any[] {
        return [
            transaction.id,
            transaction.type,
            transaction.amount,
            transaction.currency,
            transaction.accountId,
            transaction.toAccountId || '',
            transaction.categoryId || '',
            transaction.date.toISOString(),
            transaction.description,
            transaction.tags.join(','),
            transaction.status,
            transaction.createdAt.toISOString(),
            transaction.updatedAt.toISOString(),
            transaction.isRecurring ? 'TRUE' : 'FALSE',
            transaction.recurringPattern || '',
            transaction.recurringEndDate ? transaction.recurringEndDate.toISOString() : ''
        ];
    }

    private rowToAccount(row: any[]): Account {
        return {
            id: row[0],
            name: row[1],
            type: row[2] as 'cash' | 'bank' | 'ewallet' | 'credit_card' | 'investment',
            balance: parseFloat(row[3]),
            currency: row[4],
            color: row[5],
            icon: row[6],
            isArchived: row[7] === 'TRUE',
            createdAt: new Date(row[8]),
            updatedAt: new Date(row[9])
        };
    }

    private accountToRow(account: Account): any[] {
        return [
            account.id,
            account.name,
            account.type,
            account.balance,
            account.currency,
            account.color,
            account.icon,
            account.isArchived ? 'TRUE' : 'FALSE',
            account.createdAt.toISOString(),
            account.updatedAt.toISOString()
        ];
    }

    private rowToCategory(row: any[]): Category {
        return {
            id: row[0],
            name: row[1],
            type: row[2] as 'income' | 'expense',
            parentId: row[3] || undefined,
            color: row[4],
            icon: row[5],
            isDefault: row[6] === 'TRUE',
            isArchived: row[7] === 'TRUE',
            budget: row[8] ? parseFloat(row[8]) : undefined,
            budgetPeriod: row[9] as 'daily' | 'weekly' | 'monthly' | 'yearly' || undefined
        };
    }

    private categoryToRow(category: Category): any[] {
        return [
            category.id,
            category.name,
            category.type,
            category.parentId || '',
            category.color,
            category.icon,
            category.isDefault ? 'TRUE' : 'FALSE',
            category.isArchived ? 'TRUE' : 'FALSE',
            category.budget || '',
            category.budgetPeriod || ''
        ];
    }

    private rowToBudget(row: any[]): Budget {
        return {
            id: row[0],
            categoryId: row[1] || undefined,
            accountId: row[2] || undefined,
            amount: parseFloat(row[3]),
            period: row[4] as 'daily' | 'weekly' | 'monthly' | 'yearly',
            startDate: new Date(row[5]),
            endDate: row[6] ? new Date(row[6]) : undefined,
            alerts: {
                enabled: row[7] === 'TRUE',
                threshold: parseInt(row[8])
            }
        };
    }

    private budgetToRow(budget: Budget): any[] {
        return [
            budget.id,
            budget.categoryId || '',
            budget.accountId || '',
            budget.amount,
            budget.period,
            budget.startDate.toISOString(),
            budget.endDate ? budget.endDate.toISOString() : '',
            budget.alerts.enabled ? 'TRUE' : 'FALSE',
            budget.alerts.threshold
        ];
    }

    private rowToSavingsGoal(row: any[]): SavingsGoal {
        return {
            id: row[0],
            name: row[1],
            targetAmount: parseFloat(row[2]),
            currentAmount: parseFloat(row[3]),
            targetDate: row[4] ? new Date(row[4]) : undefined,
            color: row[5],
            icon: row[6],
            isCompleted: row[7] === 'TRUE',
            createdAt: new Date(row[8]),
            updatedAt: new Date(row[9])
        };
    }

    private savingsGoalToRow(goal: SavingsGoal): any[] {
        return [
            goal.id,
            goal.name,
            goal.targetAmount,
            goal.currentAmount,
            goal.targetDate ? goal.targetDate.toISOString() : '',
            goal.color,
            goal.icon,
            goal.isCompleted ? 'TRUE' : 'FALSE',
            goal.createdAt.toISOString(),
            goal.updatedAt.toISOString()
        ];
    }

    private rowToDebt(row: any[]): Debt {
        return {
            id: row[0],
            name: row[1],
            initialAmount: parseFloat(row[2]),
            currentAmount: parseFloat(row[3]),
            interestRate: row[4] ? parseFloat(row[4]) : undefined,
            dueDate: row[5] ? new Date(row[5]) : undefined,
            type: row[6] as 'borrowed' | 'lent',
            status: row[7] as 'active' | 'paid',
            createdAt: new Date(row[8]),
            updatedAt: new Date(row[9])
        };
    }

    private debtToRow(debt: Debt): any[] {
        return [
            debt.id,
            debt.name,
            debt.initialAmount,
            debt.currentAmount,
            debt.interestRate || '',
            debt.dueDate ? debt.dueDate.toISOString() : '',
            debt.type,
            debt.status,
            debt.createdAt.toISOString(),
            debt.updatedAt.toISOString()
        ];
    }
}