import React, { useState } from "react";
import { X } from "lucide-react";
import {
  TransactionFormData,
  AccountFormData,
  CategoryFormData,
  BudgetFormData,
  SavingsGoalFormData,
  DebtFormData,
} from "../../types/types";
import MoneyDialogForm from "./MoneyDialogForm";

export type MoneyDialogType =
  | "transaction"
  | "account"
  | "category"
  | "budget"
  | "savings"
  | "debt";

interface MoneyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: MoneyDialogType;
  editingEntity: any;
  onSubmit: (data: any) => void;
  loading?: boolean;
  accounts?: any[];
  categories?: any[];
}

const MoneyDialog: React.FC<MoneyDialogProps> = ({
  isOpen,
  onClose,
  type,
  editingEntity,
  onSubmit,
  loading = false,
  accounts = [],
  categories = [],
}) => {
  const [formData, setFormData] = useState<any>(() => {
    // Initialize form data based on type and editing entity
    if (editingEntity) return editingEntity;

    const now = new Date();
    const defaults = {
      transaction: {
        type: "expense",
        amount: 0,
        currency: "VND",
        accountId: "",
        date: now,
        description: "",
        tags: [],
      } as TransactionFormData,
      account: {
        name: "",
        type: "cash",
        initialBalance: 0,
        currency: "VND",
        color: "#3b82f6",
        icon: "💰",
      } as AccountFormData,
      category: {
        name: "",
        type: "expense",
        color: "#3b82f6",
        icon: "📦",
      } as CategoryFormData,
      budget: {
        amount: 0,
        period: "monthly",
        startDate: now,
        alertsEnabled: true,
        alertThreshold: 80,
      } as BudgetFormData,
      savings: {
        name: "",
        targetAmount: 0,
        currentAmount: 0,
        color: "#3b82f6",
        icon: "🎯",
      } as SavingsGoalFormData,
      debt: {
        name: "",
        initialAmount: 0,
        type: "borrowed",
      } as DebtFormData,
    };

    return defaults[type];
  });

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSubmit(formData);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {editingEntity ? "Edit" : "Add New"} {type}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-5">
          <MoneyDialogForm
            type={type}
            formData={formData}
            onChange={setFormData}
            accounts={accounts}
            categories={categories}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 rounded-lg font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:text-gray-500 flex items-center gap-2 min-w-[120px] justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                {editingEntity ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>{editingEntity ? "Update" : "Create"}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoneyDialog;
