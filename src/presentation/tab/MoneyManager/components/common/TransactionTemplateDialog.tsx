import React, { useState } from "react";
import { X } from "lucide-react";
import { TransactionFormData } from "../../types/types";
import { CurrencySelector } from "./CurrencySelector";
import { validateTransaction } from "../../utils/validationUtils";

interface TransactionTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (template: {
    formData: TransactionFormData;
    frequency: "daily" | "weekly" | "monthly" | "yearly";
    endDate?: Date;
  }) => void;
  accounts: any[];
  categories: any[];
}

export const TransactionTemplateDialog: React.FC<
  TransactionTemplateDialogProps
> = ({ isOpen, onClose, onSubmit, accounts, categories }) => {
  const [formData, setFormData] = useState<TransactionFormData>({
    type: "expense",
    amount: 0,
    currency: "VND",
    accountId: "",
    date: new Date(),
    description: "",
    tags: [],
  });
  const [frequency, setFrequency] = useState<
    "daily" | "weekly" | "monthly" | "yearly"
  >("monthly");
  const [endDate, setEndDate] = useState<Date | undefined>();

  if (!isOpen) return null;

  const handleSubmit = () => {
    const errors = validateTransaction(formData);
    if (errors.length > 0) {
      alert(errors.join("\n"));
      return;
    }

    onSubmit({ formData, frequency, endDate });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Create Transaction Template</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value as any })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Amount</label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: parseFloat(e.target.value) })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Currency</label>
            <CurrencySelector
              selectedCurrency={formData.currency}
              onCurrencyChange={(currency) =>
                setFormData({ ...formData, currency })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Account</label>
            <select
              value={formData.accountId}
              onChange={(e) =>
                setFormData({ ...formData, accountId: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">Select account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          {formData.type !== "transfer" && (
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={formData.categoryId || ""}
                onChange={(e) =>
                  setFormData({ ...formData, categoryId: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Frequency</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as any)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              End Date (Optional)
            </label>
            <input
              type="date"
              value={endDate?.toISOString().split("T")[0] || ""}
              onChange={(e) =>
                setEndDate(
                  e.target.value ? new Date(e.target.value) : undefined
                )
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Template
          </button>
        </div>
      </div>
    </div>
  );
};
