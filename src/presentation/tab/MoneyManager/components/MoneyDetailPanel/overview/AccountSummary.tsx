import React from "react";
import { Account, Transaction } from "../../../types/types";
import {
  formatCurrency,
  calculateAccountBalance,
} from "../../../utils/moneyUtils";

interface AccountSummaryProps {
  accounts: Account[];
  transactions: Transaction[];
}

const AccountSummary: React.FC<AccountSummaryProps> = ({
  accounts,
  transactions,
}) => {
  const totalBalance = accounts.reduce((total, account) => {
    return total + calculateAccountBalance(account, transactions);
  }, 0);

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case "cash":
        return "💵";
      case "bank":
        return "🏦";
      case "ewallet":
        return "📱";
      case "credit_card":
        return "💳";
      case "investment":
        return "📈";
      default:
        return "💰";
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Account Summary
      </h2>

      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">
          Total Balance
        </div>
        <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
          {formatCurrency(totalBalance, "VND")}
        </div>
      </div>

      <div className="space-y-3">
        {accounts.map((account) => {
          const balance = calculateAccountBalance(account, transactions);
          return (
            <div
              key={account.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg">
                  {getAccountTypeIcon(account.type)}
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {account.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {account.type.replace("_", " ").toUpperCase()}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`font-medium ${
                    balance >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {formatCurrency(balance, account.currency)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {account.currency}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {accounts.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No accounts added yet. Add your first account to start tracking!
        </div>
      )}
    </div>
  );
};

export default AccountSummary;
