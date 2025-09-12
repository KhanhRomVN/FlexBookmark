import React, { useMemo } from "react";
import { Transaction, Account, Category } from "../../../types/types";
import {
  formatCurrency,
  calculateAccountBalance,
  calculateTotalBalance,
} from "../../../utils/moneyUtils";

interface FinancialDashboardProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
}

const FinancialDashboard: React.FC<FinancialDashboardProps> = ({
  transactions,
  accounts,
  categories,
}) => {
  // Calculate key metrics
  const totalBalance = useMemo(() => {
    return calculateTotalBalance(accounts, transactions);
  }, [accounts, transactions]);

  const monthlyIncome = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return transactions
      .filter((t) => t.type === "income" && new Date(t.date) >= startOfMonth)
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const monthlyExpenses = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return transactions
      .filter((t) => t.type === "expense" && new Date(t.date) >= startOfMonth)
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const netWorthChange = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const currentMonthBalance = totalBalance;
    const previousMonthBalance = accounts.reduce((total, account) => {
      const accountTransactions = transactions.filter(
        (t) =>
          (t.accountId === account.id || t.toAccountId === account.id) &&
          new Date(t.date) < startOfMonth
      );
      return total + calculateAccountBalance(account, accountTransactions);
    }, 0);

    return currentMonthBalance - previousMonthBalance;
  }, [accounts, transactions, totalBalance]);

  // Filter recent transactions
  const recentTransactions = useMemo(() => {
    return transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  return (
    <div className="h-full overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
      {/* Header with key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Total Balance
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(totalBalance, "VND")}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Monthly Income
          </div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            +{formatCurrency(monthlyIncome, "VND")}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Monthly Expenses
          </div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            -{formatCurrency(monthlyExpenses, "VND")}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Net Worth Change
          </div>
          <div
            className={`text-2xl font-bold ${
              netWorthChange >= 0
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {netWorthChange >= 0 ? "+" : ""}
            {formatCurrency(netWorthChange, "VND")}
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"></div>

      {/* Recent Transactions */}
      <div className="mt-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Transactions
          </h2>
          <div className="space-y-3">
            {recentTransactions.length === 0 ? (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                No recent transactions
              </div>
            ) : (
              recentTransactions.map((transaction) => {
                const account = accounts.find(
                  (a) => a.id === transaction.accountId
                );
                const category = categories.find(
                  (c) => c.id === transaction.categoryId
                );

                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          transaction.type === "income"
                            ? "bg-green-100 text-green-600"
                            : transaction.type === "expense"
                            ? "bg-red-100 text-red-600"
                            : "bg-blue-100 text-blue-600"
                        }`}
                      >
                        {transaction.type === "income"
                          ? "💰"
                          : transaction.type === "expense"
                          ? "💸"
                          : "🔄"}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {transaction.description}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {category?.name || account?.name}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`font-medium ${
                        transaction.type === "income"
                          ? "text-green-600 dark:text-green-400"
                          : transaction.type === "expense"
                          ? "text-red-600 dark:text-red-400"
                          : "text-blue-600 dark:text-blue-400"
                      }`}
                    >
                      {transaction.type === "income"
                        ? "+"
                        : transaction.type === "expense"
                        ? "-"
                        : ""}
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialDashboard;
