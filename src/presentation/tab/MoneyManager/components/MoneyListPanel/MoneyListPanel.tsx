import React, { useState, useMemo } from "react";
import { Transaction, Account, Category } from "../../types/types";
import TransactionCard from "./TransactionCard";
import AccountBalanceCard from "./AccountBalanceCard";
import { formatCurrency } from "../../utils/moneyUtils";

interface MoneyListPanelProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  selectedAccountId?: string;
  selectedCategoryId?: string;
  timeFilter: "day" | "week" | "month" | "year" | "all";
  searchQuery: string;
  loading: boolean;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (transactionId: string) => void;
  onEditAccount: (account: Account) => void;
  onViewAccountTransactions: (accountId: string) => void;
  onSelectAccount: (accountId?: string) => void;
  onSelectCategory: (categoryId?: string) => void;
  onSetTimeFilter: (filter: "day" | "week" | "month" | "year" | "all") => void;
  onSetSearchQuery: (query: string) => void;
}

const MoneyListPanel: React.FC<MoneyListPanelProps> = ({
  transactions,
  accounts,
  categories,
  selectedAccountId,
  selectedCategoryId,
  timeFilter,
  searchQuery,
  loading,
  onEditTransaction,
  onDeleteTransaction,
  onEditAccount,
  onViewAccountTransactions,
  onSelectAccount,
  onSelectCategory,
  onSetTimeFilter,
  onSetSearchQuery,
}) => {
  const [activeTab, setActiveTab] = useState<"transactions" | "accounts">(
    "transactions"
  );

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Filter by account
    if (selectedAccountId) {
      filtered = filtered.filter(
        (t) =>
          t.accountId === selectedAccountId ||
          t.toAccountId === selectedAccountId
      );
    }

    // Filter by category
    if (selectedCategoryId) {
      filtered = filtered.filter((t) => t.categoryId === selectedCategoryId);
    }

    // Filter by time
    const now = new Date();
    let startDate: Date;

    switch (timeFilter) {
      case "day":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        startDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - now.getDay()
        );
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        return filtered;
    }

    filtered = filtered.filter((t) => new Date(t.date) >= startDate);

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.description.toLowerCase().includes(query) ||
          t.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          t.amount.toString().includes(query)
      );
    }

    return filtered.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [
    transactions,
    selectedAccountId,
    selectedCategoryId,
    timeFilter,
    searchQuery,
  ]);

  const totalBalance = useMemo(() => {
    return accounts.reduce((total, account) => total + account.balance, 0);
  }, [accounts]);

  const timeFilterOptions = [
    { value: "day", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "year", label: "This Year" },
    { value: "all", label: "All Time" },
  ];

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Money Manager
          </h2>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {formatCurrency(totalBalance, "VND")}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
          <button
            onClick={() => setActiveTab("transactions")}
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === "transactions"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Transactions
          </button>
          <button
            onClick={() => setActiveTab("accounts")}
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === "accounts"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Accounts
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <select
            value={timeFilter}
            onChange={(e) => onSetTimeFilter(e.target.value as any)}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
          >
            {timeFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={selectedAccountId || ""}
            onChange={(e) => onSelectAccount(e.target.value || undefined)}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
          >
            <option value="">All Accounts</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>

          <select
            value={selectedCategoryId || ""}
            onChange={(e) => onSelectCategory(e.target.value || undefined)}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => onSetSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <svg
            className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "transactions" ? (
          <div className="space-y-3">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <svg
                  className="w-12 h-12 mx-auto mb-4 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <p>No transactions found</p>
                <p className="text-sm">
                  Try changing your filters or search query
                </p>
              </div>
            ) : (
              filteredTransactions.map((transaction) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  accounts={accounts}
                  categories={categories}
                  onEdit={onEditTransaction}
                  onDelete={onDeleteTransaction}
                />
              ))
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {accounts.map((account) => (
              <AccountBalanceCard
                key={account.id}
                account={account}
                onEdit={onEditAccount}
                onViewTransactions={onViewAccountTransactions}
                isSelected={selectedAccountId === account.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MoneyListPanel;
