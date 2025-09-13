import React, { useState } from "react";
import { Account } from "../../../types/types";
import { formatCurrency } from "../../../utils/moneyUtils";
import AccountDialog from "./AccountDialog";
import { useAccounts } from "../../../hooks/useAccounts";

interface AccountManagementPanelProps {
  accounts: Account[];
  onEditAccount: (account: Account) => void;
  onAddAccount: () => void;
}

const AccountManagementPanel: React.FC<AccountManagementPanelProps> = ({
  accounts,
  onEditAccount,
  onAddAccount,
}) => {
  const { updateAccount } = useAccounts();
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);

  const totalBalance = accounts.reduce(
    (total, account) => total + account.balance,
    0
  );

  const handleUpdateAccount = async (updatedAccount: Account) => {
    try {
      await updateAccount(updatedAccount);
      setEditingAccountId(null);
    } catch (error) {
      console.error("Failed to update account:", error);
      // Optionally show error message to user
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Account Management
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Total Balance: {formatCurrency(totalBalance, "VND")}
          </p>
        </div>
        <button
          onClick={onAddAccount}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Account
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((account) => (
          <AccountDialog
            key={account.id}
            account={account}
            onEdit={() => setEditingAccountId(account.id)}
            onUpdate={handleUpdateAccount}
            isEditing={editingAccountId === account.id}
          />
        ))}
      </div>

      {accounts.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto text-gray-300 mb-4">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No accounts yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Get started by creating your first account
          </p>
          <button
            onClick={onAddAccount}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Account
          </button>
        </div>
      )}
    </div>
  );
};

export default AccountManagementPanel;
