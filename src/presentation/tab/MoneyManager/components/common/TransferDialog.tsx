import React, { useState } from "react";
import { X, ArrowRight } from "lucide-react";
import { CurrencySelector } from "./CurrencySelector";
import { validateTransaction } from "../../utils/validationUtils";

interface TransferDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    amount: number;
    currency: string;
    fromAccountId: string;
    toAccountId: string;
    description: string;
    date: Date;
  }) => void;
  accounts: any[];
}

export const TransferDialog: React.FC<TransferDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  accounts,
}) => {
  const [formData, setFormData] = useState({
    amount: 0,
    currency: "VND",
    fromAccountId: "",
    toAccountId: "",
    description: "",
    date: new Date(),
  });

  if (!isOpen) return null;

  const handleSubmit = () => {
    const errors = validateTransaction({
      type: "transfer",
      amount: formData.amount,
      currency: formData.currency,
      accountId: formData.fromAccountId,
      toAccountId: formData.toAccountId,
      date: formData.date,
      description: formData.description,
      tags: [],
    });

    if (errors.length > 0) {
      alert(errors.join("\n"));
      return;
    }

    onSubmit(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Transfer Funds</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
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

          <div className="flex items-center space-x-3">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">
                From Account
              </label>
              <select
                value={formData.fromAccountId}
                onChange={(e) =>
                  setFormData({ ...formData, fromAccountId: e.target.value })
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

            <ArrowRight className="w-5 h-5 mt-5 text-gray-400" />

            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">
                To Account
              </label>
              <select
                value={formData.toAccountId}
                onChange={(e) =>
                  setFormData({ ...formData, toAccountId: e.target.value })
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
          </div>

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
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              value={formData.date.toISOString().split("T")[0]}
              onChange={(e) =>
                setFormData({ ...formData, date: new Date(e.target.value) })
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
            Transfer
          </button>
        </div>
      </div>
    </div>
  );
};
