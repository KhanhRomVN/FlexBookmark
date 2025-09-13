import React, { useState } from "react";
import { TransactionFormData, AccountFormData } from "../../types/types";
import { MoneyDialogType } from "./MoneyDialog";
import { CURRENCIES, ACCOUNT_TYPES } from "../../constants/constants";
import {
  validateTransaction,
  validateAccount,
} from "../../utils/validationUtils";
import { EmojiPicker } from "../common/EmojiPicker";

interface MoneyDialogFormProps {
  type: MoneyDialogType;
  formData: any;
  onChange: (data: any) => void;
  accounts: any[];
  categories: any[];
}

const MoneyDialogForm: React.FC<MoneyDialogFormProps> = ({
  type,
  formData,
  onChange,
  accounts,
  categories,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const updateField = (field: string, value: any) => {
    onChange({ ...formData, [field]: value });
  };

  const renderTransactionForm = () => {
    const data = formData as TransactionFormData;
    const errors = validateTransaction(data);

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type
            </label>
            <select
              value={data.type}
              onChange={(e) => updateField("type", e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 dark:text-white"
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount
            </label>
            <input
              type="number"
              value={data.amount}
              onChange={(e) =>
                updateField("amount", parseFloat(e.target.value))
              }
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 dark:text-white"
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Currency
            </label>
            <select
              value={data.currency}
              onChange={(e) => updateField("currency", e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 dark:text-white"
            >
              {Object.entries(CURRENCIES).map(([key, value]) => (
                <option key={key} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Account
            </label>
            <select
              value={data.accountId}
              onChange={(e) => updateField("accountId", e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 dark:text-white"
            >
              <option value="">Select Account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {data.type === "transfer" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              To Account
            </label>
            <select
              value={data.toAccountId || ""}
              onChange={(e) => updateField("toAccountId", e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 dark:text-white"
            >
              <option value="">Select Destination Account</option>
              {accounts
                .filter((acc) => acc.id !== data.accountId)
                .map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
            </select>
          </div>
        )}

        {(data.type === "income" || data.type === "expense") && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <select
              value={data.categoryId || ""}
              onChange={(e) => updateField("categoryId", e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 dark:text-white"
            >
              <option value="">Select Category</option>
              {categories
                .filter((cat) => cat.type === data.type)
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Date
          </label>
          <input
            type="datetime-local"
            value={data.date.toISOString().slice(0, 16)}
            onChange={(e) => updateField("date", new Date(e.target.value))}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            value={data.description}
            onChange={(e) => updateField("description", e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 dark:text-white"
            placeholder="Enter description..."
            rows={3}
          />
        </div>

        {errors.length > 0 && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            {errors.map((error, index) => (
              <p key={index} className="text-sm text-red-600 dark:text-red-400">
                • {error}
              </p>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderAccountForm = () => {
    const data = formData as AccountFormData;
    const errors = validateAccount(data);

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Account Name
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => updateField("name", e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 dark:text-white"
            placeholder="e.g., Cash Wallet, Bank Account..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Icon
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-left"
            >
              {data.icon}
            </button>
            {showEmojiPicker && (
              <div className="absolute z-10 mt-1">
                <EmojiPicker
                  selectedEmoji={data.icon}
                  onEmojiSelect={(emoji) => {
                    updateField("icon", emoji);
                    setShowEmojiPicker(false);
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type
            </label>
            <select
              value={data.type}
              onChange={(e) => updateField("type", e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 dark:text-white"
            >
              {Object.entries(ACCOUNT_TYPES).map(([key, value]) => (
                <option key={key} value={value}>
                  {value.replace("_", " ").toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Initial Balance
            </label>
            <input
              type="number"
              value={data.initialBalance}
              onChange={(e) =>
                updateField("initialBalance", parseFloat(e.target.value))
              }
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 dark:text-white"
              placeholder="0.00"
              step="0.01"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Currency
            </label>
            <select
              value={data.currency}
              onChange={(e) => updateField("currency", e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 dark:text-white"
            >
              {Object.entries(CURRENCIES).map(([key, value]) => (
                <option key={key} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color
            </label>
            <input
              type="color"
              value={data.color}
              onChange={(e) => updateField("color", e.target.value)}
              className="w-full h-10 px-1 py-1 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
            />
          </div>
        </div>

        {errors.length > 0 && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            {errors.map((error, index) => (
              <p key={index} className="text-sm text-red-600 dark:text-red-400">
                • {error}
              </p>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Similar forms for category, budget, savings, and debt would go here...

  switch (type) {
    case "transaction":
      return renderTransactionForm();
    case "account":
      return renderAccountForm();
    case "category":
      return <div>Category Form (to be implemented)</div>;
    case "budget":
      return <div>Budget Form (to be implemented)</div>;
    case "savings":
      return <div>Savings Goal Form (to be implemented)</div>;
    case "debt":
      return <div>Debt Form (to be implemented)</div>;
    default:
      return <div>Unknown form type</div>;
  }
};

export default MoneyDialogForm;
