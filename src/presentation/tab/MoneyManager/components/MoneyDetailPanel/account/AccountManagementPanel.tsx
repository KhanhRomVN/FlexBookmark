import React, { useState } from "react";
import { Account } from "../../../types/types";
import { formatCurrency } from "../../../utils/moneyUtils";
import AccountModal from "./AccountModal";
import AccountCard from "./AccountCard";
import { useAccounts } from "../../../hooks/useAccounts";
import CustomButton from "../../../../../components/common/CustomButton";
import { Plus, Wallet, TrendingUp, Users, AlertCircle } from "lucide-react";

interface AccountManagementPanelProps {
  accounts: Account[];
  onEditAccount: (account: Account) => void;
  onAddAccount: () => void;
}

const AccountManagementPanel: React.FC<AccountManagementPanelProps> = ({
  accounts,
  onAddAccount,
}) => {
  const { updateAccount } = useAccounts();
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);

  const totalBalance = accounts.reduce(
    (total, account) => total + account.balance,
    0
  );

  const positiveAccounts = accounts.filter((account) => account.balance >= 0);
  const negativeAccounts = accounts.filter((account) => account.balance < 0);

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
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header - Same height as sidebar header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-text-primary">
                Account Management
              </h1>
            </div>
          </div>
          <CustomButton
            variant="primary"
            onClick={onAddAccount}
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add New Account
          </CustomButton>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {accounts.length > 0 ? (
          <div className="p-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total Accounts
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {accounts.length}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Positive Balance
                    </p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {positiveAccounts.length}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Need Attention
                    </p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {negativeAccounts.length}
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Accounts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {accounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  onEdit={() => setEditingAccountId(account.id)}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Empty State - Improved Design */
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md mx-auto">
              {/* Animated Icon */}
              <div className="relative mb-8">
                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center">
                  <Wallet className="w-16 h-16 text-blue-500 dark:text-blue-400" />
                </div>
                <div className="absolute top-0 right-0 w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center transform translate-x-2 -translate-y-2">
                  <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
                </div>
              </div>

              {/* Content */}
              <div className="space-y-4 mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  No Accounts Yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                  Start managing your finances by creating your first account.
                  You can add bank accounts, credit cards, cash, or any other
                  financial accounts.
                </p>

                {/* Features List */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 text-left">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                    What you can do with accounts:
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      Track balances across multiple accounts
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      Monitor income and expenses
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                      Categorize transactions automatically
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                      Generate financial reports
                    </li>
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <CustomButton variant="primary" onClick={onAddAccount} size="sm">
                <Plus className="w-6 h-6" />
                Create Your First Account
              </CustomButton>

              {/* Additional Help */}
              <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
                Need help? Check our
                <button className="text-blue-600 dark:text-blue-400 hover:underline ml-1">
                  getting started guide
                </button>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingAccountId && (
        <AccountModal
          account={accounts.find((acc) => acc.id === editingAccountId)!}
          onEdit={() => {}}
          onUpdate={handleUpdateAccount}
          isEditing={true}
        />
      )}
    </div>
  );
};

export default AccountManagementPanel;
