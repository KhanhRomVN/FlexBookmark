import React from "react";
import { Account } from "../../../types/types";
import { formatCurrency } from "../../../utils/moneyUtils";
import { Edit3, Wallet, TrendingUp, TrendingDown } from "lucide-react";
import CustomButton from "../../../../../components/common/CustomButton";

interface AccountCardProps {
  account: Account;
  onEdit: () => void;
}

const AccountCard: React.FC<AccountCardProps> = ({ account, onEdit }) => {
  const isPositive = account.balance >= 0;

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 overflow-hidden">
      {/* Header with account type indicator */}
      <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-600"></div>

      <div className="p-5">
        {/* Account Name and Edit Button */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <Wallet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                {account.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                {account.type || "General Account"}
              </p>
            </div>
          </div>

          <CustomButton
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 !p-2 !w-auto hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Edit3 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </CustomButton>
        </div>

        {/* Balance */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Current Balance
            </span>
          </div>
          <p
            className={`text-2xl font-bold ${
              isPositive
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {formatCurrency(account.balance, "VND")}
          </p>
        </div>

        {/* Account Details */}
        {account.description && (
          <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {account.description}
            </p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <CustomButton
            variant="ghost"
            size="sm"
            className="flex-1 !text-xs !py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400"
          >
            View Details
          </CustomButton>
          <CustomButton
            variant="ghost"
            size="sm"
            className="flex-1 !text-xs !py-1.5 hover:bg-green-50 dark:hover:bg-green-900/30 hover:text-green-600 dark:hover:text-green-400"
          >
            Add Transaction
          </CustomButton>
        </div>
      </div>
    </div>
  );
};

export default AccountCard;
