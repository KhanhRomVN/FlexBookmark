import React, { useState } from "react";
import { Plus, Edit3, Archive, X } from "lucide-react";
import { Account } from "../../types/types";
import { useAccounts } from "../../hooks/useAccounts";
import { formatCurrency } from "../../utils/moneyUtils";
import { CURRENCIES, ACCOUNT_TYPES } from "../../constants/constants";

interface AccountManagerProps {
  onSelectAccount?: (account: Account) => void;
  selectedAccountId?: string;
}

const AccountManager: React.FC<AccountManagerProps> = ({
  onSelectAccount,
  selectedAccountId,
}) => {
  const { accounts, loading, addAccount, updateAccount } = useAccounts();
  const [isAdding, setIsAdding] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "cash" as const,
    initialBalance: 0,
    currency: "VND",
    color: "#3B82F6",
    icon: "💰",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAccount) {
        await updateAccount({ ...editingAccount, ...formData });
        setEditingAccount(null);
      } else {
        await addAccount(formData);
      }
      setFormData({
        name: "",
        type: "cash",
        initialBalance: 0,
        currency: "VND",
        color: "#3B82F6",
        icon: "💰",
      });
      setIsAdding(false);
    } catch (error) {
      console.error("Error saving account:", error);
    }
  };

  const handleArchive = async (account: Account, archive: boolean) => {
    await updateAccount({ ...account, isArchived: archive });
  };

  const filteredAccounts = accounts.filter((account) =>
    showArchived ? true : !account.isArchived
  );

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-12 bg-gray-200 dark:bg-gray-700 rounded"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Accounts
        </h3>
        <button
          onClick={() => setIsAdding(true)}
          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {(isAdding || editingAccount) && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Account Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as any })
                }
                className="w-full p-2 border rounded"
              >
                {Object.entries(ACCOUNT_TYPES).map(([key, value]) => (
                  <option key={key} value={value}>
                    {key}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Initial Balance
              </label>
              <input
                type="number"
                value={formData.initialBalance}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    initialBalance: Number(e.target.value),
                  })
                }
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Currency</label>
              <select
                value={formData.currency}
                onChange={(e) =>
                  setFormData({ ...formData, currency: e.target.value })
                }
                className="w-full p-2 border rounded"
              >
                {Object.values(CURRENCIES).map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                {editingAccount ? "Update" : "Add"} Account
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setEditingAccount(null);
                }}
                className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mb-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="mr-2"
          />
          Show Archived Accounts
        </label>
      </div>

      <div className="space-y-2">
        {filteredAccounts.map((account) => (
          <div
            key={account.id}
            className={`p-3 border rounded-lg cursor-pointer transition-all ${
              selectedAccountId === account.id
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            } ${account.isArchived ? "opacity-60" : ""}`}
            onClick={() => onSelectAccount?.(account)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: account.color }}
                >
                  {account.icon}
                </div>
                <div>
                  <div className="font-medium">{account.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {formatCurrency(account.balance, account.currency)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {!account.isArchived && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingAccount(account);
                      setFormData({
                        name: account.name,
                        type: account.type,
                        initialBalance: account.balance,
                        currency: account.currency,
                        color: account.color,
                        icon: account.icon,
                      });
                    }}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleArchive(account, !account.isArchived);
                  }}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                >
                  {account.isArchived ? (
                    <X className="w-4 h-4" />
                  ) : (
                    <Archive className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAccounts.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {showArchived ? "No archived accounts" : "No accounts yet"}
        </div>
      )}
    </div>
  );
};

export default AccountManager;
