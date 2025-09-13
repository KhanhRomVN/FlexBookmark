import React, { useState } from "react";
import { Account } from "../../../types/types";
import { formatCurrency } from "../../../utils/moneyUtils";
import { EmojiPicker } from "../../common/EmojiPicker";

interface AccountDialogProps {
  account: Account;
  onEdit: () => void;
  onUpdate: (account: Account) => void;
  isEditing?: boolean;
}

const AccountDialog: React.FC<AccountDialogProps> = ({
  account,
  onEdit,
  onUpdate,
  isEditing = false,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [tempAccount, setTempAccount] = useState(account);

  const handleSave = () => {
    onUpdate(tempAccount);
    onEdit();
  };

  const handleCancel = () => {
    setTempAccount(account);
    onEdit();
  };

  const getAccountIcon = (type: string) => {
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
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {isEditing ? (
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                style={{ backgroundColor: tempAccount.color }}
              >
                {tempAccount.icon}
              </button>
              {showEmojiPicker && (
                <div className="absolute z-10 mt-2">
                  <EmojiPicker
                    selectedEmoji={tempAccount.icon}
                    onEmojiSelect={(emoji) => {
                      setTempAccount({ ...tempAccount, icon: emoji });
                      setShowEmojiPicker(false);
                    }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
              style={{ backgroundColor: account.color }}
            >
              {getAccountIcon(account.type)}
            </div>
          )}
          {isEditing ? (
            <div>
              <input
                type="text"
                value={tempAccount.name}
                onChange={(e) =>
                  setTempAccount({ ...tempAccount, name: e.target.value })
                }
                className="font-medium text-gray-900 dark:text-white bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500"
                placeholder="Account name"
              />
              <select
                value={tempAccount.type}
                onChange={(e) =>
                  setTempAccount({
                    ...tempAccount,
                    type: e.target.value as any,
                  })
                }
                className="text-sm text-gray-500 dark:text-gray-400 bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500 capitalize mt-2"
              >
                <option value="cash">Cash</option>
                <option value="bank">Bank</option>
                <option value="ewallet">E-Wallet</option>
                <option value="credit_card">Credit Card</option>
                <option value="investment">Investment</option>
              </select>
              <input
                type="number"
                value={tempAccount.balance}
                onChange={(e) =>
                  setTempAccount({
                    ...tempAccount,
                    balance: parseFloat(e.target.value) || 0,
                  })
                }
                className="text-sm text-gray-500 dark:text-gray-400 bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500 mt-2"
                placeholder="Initial balance"
              />
              <input
                type="color"
                value={tempAccount.color}
                onChange={(e) =>
                  setTempAccount({ ...tempAccount, color: e.target.value })
                }
                className="mt-2"
              />
            </div>
          ) : (
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                {account.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                {account.type.replace("_", " ")}
              </p>
            </div>
          )}
        </div>
        {isEditing ? (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </button>
            <button
              onClick={handleCancel}
              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ) : (
          <button
            onClick={onEdit}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
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
        )}
      </div>

      <div className="mb-4">
        {isEditing ? (
          <input
            type="number"
            value={tempAccount.balance}
            onChange={(e) =>
              setTempAccount({
                ...tempAccount,
                balance: parseFloat(e.target.value) || 0,
              })
            }
            className="text-2xl font-bold text-gray-900 dark:text-white bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500 w-full"
          />
        ) : (
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(account.balance, account.currency)}
          </div>
        )}
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {account.currency}
        </div>
      </div>

      {account.isArchived && (
        <div className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded text-xs text-center">
          Archived
        </div>
      )}
    </div>
  );
};

export default AccountDialog;
