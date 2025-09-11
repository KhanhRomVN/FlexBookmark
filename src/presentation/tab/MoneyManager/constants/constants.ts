export const TRANSACTION_TYPES = {
    INCOME: 'income',
    EXPENSE: 'expense',
    TRANSFER: 'transfer'
} as const;

export const CURRENCIES = {
    VND: 'VND',
    USD: 'USD',
    EUR: 'EUR',
    JPY: 'JPY',
    GBP: 'GBP',
    CNY: 'CNY',
    KRW: 'KRW',
    SGD: 'SGD',
    AUD: 'AUD',
    CAD: 'CAD'
} as const;

export const DEFAULT_CATEGORIES = {
    INCOME: [
        { id: 'salary', name: 'Lương', icon: '💼', color: '#10B981' },
        { id: 'bonus', name: 'Thưởng', icon: '🎁', color: '#F59E0B' },
        { id: 'investment', name: 'Đầu tư', icon: '📈', color: '#6366F1' },
        { id: 'gift', name: 'Quà tặng', icon: '🎀', color: '#EC4899' },
        { id: 'other_income', name: 'Thu nhập khác', icon: '💰', color: '#84CC16' }
    ],
    EXPENSE: [
        { id: 'food', name: 'Ăn uống', icon: '🍔', color: '#EF4444' },
        { id: 'shopping', name: 'Mua sắm', icon: '🛒', color: '#8B5CF6' },
        { id: 'transport', name: 'Đi lại', icon: '🚗', color: '#3B82F6' },
        { id: 'entertainment', name: 'Giải trí', icon: '🎬', color: '#F97316' },
        { id: 'health', name: 'Sức khỏe', icon: '🏥', color: '#06B6D4' },
        { id: 'education', name: 'Giáo dục', icon: '📚', color: '#6366F1' },
        { id: 'bills', name: 'Hóa đơn', icon: '🧾', color: '#F59E0B' },
        { id: 'other_expense', name: 'Chi tiêu khác', icon: '💸', color: '#64748B' }
    ]
} as const;

export const ACCOUNT_TYPES = {
    CASH: 'cash',
    BANK: 'bank',
    EWALLET: 'ewallet',
    CREDIT_CARD: 'credit_card',
    INVESTMENT: 'investment'
} as const;

export const BUDGET_PERIODS = {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    YEARLY: 'yearly'
} as const;