import React from "react";
import { Account } from "../../types/types";
import { formatCurrency } from "../../utils/moneyUtils";

interface AccountBalanceCardProps {
  account: Account;
  onEdit: (account: Account) => void;
  onViewTransactions: (accountId: string) => void;
  isSelected?: boolean;
}

const AccountBalanceCard: React.FC<AccountBalanceCardProps> = ({
  account,
  onEdit,
  onViewTransactions,
  isSelected = false,
}) => {
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

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case "cash":
        return "Cash";
      case "bank":
        return "Bank Account";
      case "ewallet":
        return "E-Wallet";
      case "credit_card":
        return "Credit Card";
      case "investment":
        return "Investment";
      default:
        return "Account";
    }
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl p-4 border-2 transition-all duration-200 ${
        isSelected
          ? "border-blue-500 shadow-lg"
          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
            style={{ backgroundColor: account.color }}
          >
            {getAccountTypeIcon(account.type)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {account.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {getAccountTypeLabel(account.type)}
            </p>
          </div>
        </div>
        <button
          onClick={() => onEdit(account)}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>
      </div>

      <div className="mb-4">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {formatCurrency(account.balance, account.currency)}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {account.currency}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onViewTransactions(account.id)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
        >
          View Transactions
        </button>
      </div>

      {account.isArchived && (
        <div className="mt-3 p-2 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-lg text-xs text-center">
          Archived
        </div>
      )}
    </div>
  );
};

export default AccountBalanceCard;
