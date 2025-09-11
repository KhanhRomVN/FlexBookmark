import React from "react";
import { Transaction, Account, Category } from "../../types/types";
import { formatCurrency } from "../../utils/moneyUtils";

interface TransactionCardProps {
  transaction: Transaction;
  accounts: Account[];
  categories: Category[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transactionId: string) => void;
}

const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  accounts,
  categories,
  onEdit,
  onDelete,
}) => {
  const getAccount = (accountId: string) => {
    return accounts.find((a) => a.id === accountId);
  };

  const getCategory = (categoryId?: string) => {
    if (!categoryId) return null;
    return categories.find((c) => c.id === categoryId);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "income":
        return "💰";
      case "expense":
        return "💸";
      case "transfer":
        return "🔄";
      default:
        return "📝";
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const account = getAccount(transaction.accountId);
  const toAccount = transaction.toAccountId
    ? getAccount(transaction.toAccountId)
    : null;
  const category = getCategory(transaction.categoryId);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
              transaction.type === "income"
                ? "bg-green-100 text-green-600"
                : transaction.type === "expense"
                ? "bg-red-100 text-red-600"
                : "bg-blue-100 text-blue-600"
            }`}
          >
            {getTransactionIcon(transaction.type)}
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">
              {transaction.description}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(transaction.date)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(transaction)}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
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
          <button
            onClick={() => onDelete(transaction.id)}
            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {category && (
            <span
              className="px-2 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: `${category.color}20`,
                color: category.color,
              }}
            >
              {category.name}
            </span>
          )}
          {transaction.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs"
            >
              #{tag}
            </span>
          ))}
        </div>

        <div
          className={`text-lg font-semibold ${
            transaction.type === "income"
              ? "text-green-600"
              : transaction.type === "expense"
              ? "text-red-600"
              : "text-blue-600"
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

      <div className="text-sm text-gray-500 dark:text-gray-400">
        {transaction.type === "transfer" ? (
          <div className="flex items-center gap-2">
            <span className="font-medium" style={{ color: account?.color }}>
              {account?.name}
            </span>
            <span>→</span>
            <span className="font-medium" style={{ color: toAccount?.color }}>
              {toAccount?.name}
            </span>
          </div>
        ) : (
          <div className="font-medium" style={{ color: account?.color }}>
            {account?.name}
          </div>
        )}
      </div>

      {transaction.status !== "completed" && (
        <div className="mt-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              transaction.status === "pending"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {transaction.status.charAt(0).toUpperCase() +
              transaction.status.slice(1)}
          </span>
        </div>
      )}
    </div>
  );
};

export default TransactionCard;
