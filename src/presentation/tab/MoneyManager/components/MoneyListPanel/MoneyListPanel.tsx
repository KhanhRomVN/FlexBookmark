// src/presentation/tab/MoneyManager/components/MoneyListPanel/MoneyListPanel.tsx
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
  connectionStatus?: "connected" | "loading" | "error";
  isBackgroundLoading?: boolean;
  hasInitialData: boolean;
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
  connectionStatus = "connected",
  isBackgroundLoading = false,
  hasInitialData,
  onEditTransaction,
  onDeleteTransaction,
  onEditAccount,
  onViewAccountTransactions,
  onSetSearchQuery,
}) => {
  const [activeTab] = useState<"transactions" | "accounts">("transactions");

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

  // Connection status indicator
  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case "loading":
        return (
          <div className="flex items-center text-yellow-500 text-sm">
            <svg
              className="animate-spin h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Syncing...
          </div>
        );
      case "error":
        return (
          <div className="flex items-center text-red-500 text-sm">
            <svg
              className="h-4 w-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Offline
          </div>
        );
      case "connected":
      default:
        return isBackgroundLoading ? (
          <div className="flex items-center text-blue-500 text-sm">
            <svg
              className="animate-spin h-3 w-3 mr-1"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Background sync
          </div>
        ) : (
          <div className="flex items-center text-green-500 text-sm">
            <svg
              className="h-4 w-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Connected
          </div>
        );
    }
  };

  // Show initial loading spinner only when no cached data is available
  if (!hasInitialData) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Money Manager
            </h2>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Loading your data...
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              This may take a moment on first load
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Money Manager
            </h2>
            {getConnectionStatusIcon()}
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {formatCurrency(totalBalance, "VND")}
          </div>
        </div>

        {/* Background Sync Indicator */}
        {isBackgroundLoading && (
          <div className="absolute top-2 right-2 flex items-center text-blue-500 text-sm">
            <svg
              className="animate-spin h-3 w-3 mr-1"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Syncing...
          </div>
        )}

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
                  {searchQuery || selectedAccountId || selectedCategoryId
                    ? "Try changing your filters or search query"
                    : "Add your first transaction to get started"}
                </p>
              </div>
            ) : (
              <>
                {/* Show transaction count and loading indicator */}
                <div className="flex items-center justify-between mb-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>
                    {filteredTransactions.length} transaction
                    {filteredTransactions.length !== 1 ? "s" : ""}
                  </span>
                  {isBackgroundLoading && (
                    <span className="flex items-center gap-1">
                      <svg
                        className="animate-spin h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Updating...
                    </span>
                  )}
                </div>

                {filteredTransactions.map((transaction) => (
                  <TransactionCard
                    key={transaction.id}
                    transaction={transaction}
                    accounts={accounts}
                    categories={categories}
                    onEdit={onEditTransaction}
                    onDelete={onDeleteTransaction}
                  />
                ))}
              </>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {accounts.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
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
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
                <p>No accounts found</p>
                <p className="text-sm">
                  Create your first account to manage your money
                </p>
              </div>
            ) : (
              accounts.map((account) => (
                <AccountBalanceCard
                  key={account.id}
                  account={account}
                  onEdit={onEditAccount}
                  onViewTransactions={onViewAccountTransactions}
                  isSelected={selectedAccountId === account.id}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MoneyListPanel;
