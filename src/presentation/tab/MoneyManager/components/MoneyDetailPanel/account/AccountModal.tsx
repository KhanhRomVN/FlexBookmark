// src/presentation/tab/MoneyManager/components/MoneyDetailPanel/account/AccountModal.tsx
import React, { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { Account, AccountFormData } from "../../../types/types";
import CustomModal from "../../../../../components/common/CustomModal";
import CustomCombobox from "../../../../../components/common/CustomCombobox";
import CustomInput from "../../../../../components/common/CustomInput";
import CustomTextArea from "../../../../../components/common/CustomTextArea";
import ColorPicker from "../../../../../components/common/ColorPicker";
import EmojiPicker from "../../../../../components/common/EmojiPicker";

interface AccountModalProps {
  account?: Account;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (accountData: AccountFormData | Account) => void;
  isCreating?: boolean;
  isEditing?: boolean;
}

// Account type options
const accountTypeOptions = [
  { value: "cash", label: "💵 Cash" },
  { value: "bank", label: "🏦 Bank Account" },
  { value: "ewallet", label: "📱 E-Wallet" },
  { value: "credit_card", label: "💳 Credit Card" },
  { value: "investment", label: "📈 Investment" },
];

// Currency options
const currencyOptions = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "JPY", label: "JPY - Japanese Yen" },
  { value: "VND", label: "VND - Vietnamese Dong" },
  { value: "CNY", label: "CNY - Chinese Yuan" },
  { value: "KRW", label: "KRW - Korean Won" },
  { value: "SGD", label: "SGD - Singapore Dollar" },
  { value: "THB", label: "THB - Thai Baht" },
  { value: "MYR", label: "MYR - Malaysian Ringgit" },
];

type AccountType = "cash" | "bank" | "ewallet" | "credit_card" | "investment";

const AccountModal: React.FC<AccountModalProps> = ({
  account,
  isOpen,
  onClose,
  onSubmit,
  isCreating = false,
  isEditing = false,
}) => {
  const [tempAccount, setTempAccount] = useState<Partial<Account>>({
    name: "",
    type: "cash",
    balance: 0,
    currency: "USD",
    color: "#3B82F6",
    icon: "💰",
    description: "",
    isArchived: false,
    ...account,
  });

  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    balance?: string;
    description?: string;
  }>({});

  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Reset temp account when editing state changes
  useEffect(() => {
    if (isEditing || isCreating) {
      setTempAccount({
        name: "",
        type: "cash",
        balance: 0,
        currency: "USD",
        color: "#3B82F6",
        icon: "💰",
        description: "",
        isArchived: false,
        ...account,
      });
      setValidationErrors({});
      setShowSuccess(false);
    }
  }, [isEditing, isCreating, account]);

  const validateForm = (): boolean => {
    const errors: { name?: string; balance?: string; description?: string } =
      {};

    if (!tempAccount.name?.trim()) {
      errors.name = "Account name is required";
    } else if (tempAccount.name.length > 50) {
      errors.name = "Name must be 50 characters or less";
    }

    if (
      tempAccount.balance === undefined ||
      tempAccount.balance === null ||
      isNaN(tempAccount.balance)
    ) {
      errors.balance = "Balance is required";
    }

    if (tempAccount.description && tempAccount.description.length > 200) {
      errors.description = "Description must be 200 characters or less";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isFormValid = (): boolean => {
    return (
      tempAccount.name?.trim() !== "" &&
      tempAccount.name !== undefined &&
      tempAccount.name.length <= 50 &&
      tempAccount.balance !== undefined &&
      tempAccount.balance !== null &&
      !isNaN(tempAccount.balance) &&
      (!tempAccount.description || tempAccount.description.length <= 200)
    );
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      onSubmit(tempAccount as AccountFormData | Account);

      setIsLoading(false);
      setShowSuccess(true);

      // Show success for a moment then close
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 1000);
    } catch (error) {
      setIsLoading(false);
      console.error("Error saving account:", error);
    }
  };

  const handleCancel = () => {
    setTempAccount({
      name: "",
      type: "cash",
      balance: 0,
      currency: "USD",
      color: "#3B82F6",
      icon: "💰",
      description: "",
      isArchived: false,
      ...account,
    });
    setValidationErrors({});
    onClose();
  };

  const updateTempAccount = (updates: Partial<Account>) => {
    setTempAccount((prev) => ({ ...prev, ...updates }));

    // Clear related validation errors
    const newErrors = { ...validationErrors };
    if (updates.name !== undefined && validationErrors.name) {
      delete newErrors.name;
    }
    if (updates.balance !== undefined && validationErrors.balance) {
      delete newErrors.balance;
    }
    if (updates.description !== undefined && validationErrors.description) {
      delete newErrors.description;
    }
    setValidationErrors(newErrors);
  };

  // Get modal title based on mode
  const getModalTitle = () => {
    if (isCreating) return "Create Account";
    if (isEditing) return "Edit Account";
    return "Account Details";
  };

  // Get action text based on mode and state
  const getActionText = () => {
    if (showSuccess) return undefined; // Hide action button when showing success
    if (isCreating) return "Create Account";
    return "Save Changes";
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={handleCancel}
      title={getModalTitle()}
      size="lg"
      actionText={getActionText()}
      onAction={handleSave}
      actionDisabled={!isFormValid()}
      actionLoading={isLoading}
      cancelText="Cancel"
      footerActions={
        showSuccess ? (
          <div className="flex items-center gap-2 text-success-text">
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">
              Account saved successfully!
            </span>
          </div>
        ) : undefined
      }
    >
      <div className="p-6 space-y-6">
        {/* Account Name Row with Pickers */}
        <div className="flex items-start gap-4">
          {/* Account Name with Primary Variant */}
          <div className="flex-1">
            <CustomInput
              variant="primary"
              label="Account Name"
              required
              value={tempAccount.name || ""}
              onChange={(value) => updateTempAccount({ name: value })}
              error={validationErrors.name}
              placeholder="Enter account name"
              maxLength={50}
              showCharCount
            />
          </div>

          {/* Icon and Color Pickers */}
          <div className="flex gap-2 pt-6">
            <EmojiPicker
              value={tempAccount.icon || "💰"}
              onChange={(icon) => updateTempAccount({ icon })}
            />
            <ColorPicker
              value={tempAccount.color || "#3B82F6"}
              onChange={(color) => updateTempAccount({ color })}
            />
          </div>
        </div>

        {/* Description Field */}
        <CustomTextArea
          variant="primary"
          label="Description"
          value={tempAccount.description || ""}
          onChange={(value) => updateTempAccount({ description: value })}
          error={validationErrors.description}
          placeholder="Add a description for this account (optional)"
          maxLength={200}
          showCharCount
          minRows={2}
          maxRows={4}
          hint="Optional description to help you remember this account's purpose"
        />

        {/* Account Type and Currency Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CustomCombobox
            label="Account Type"
            value={tempAccount.type || "cash"}
            options={accountTypeOptions}
            onChange={(value) =>
              updateTempAccount({ type: value as AccountType })
            }
            placeholder="Select account type"
            searchable={false}
          />

          <CustomCombobox
            label="Currency"
            value={tempAccount.currency || "USD"}
            options={currencyOptions}
            onChange={(value) =>
              updateTempAccount({ currency: value as string })
            }
            placeholder="Select currency"
            searchable={true}
          />
        </div>

        {/* Initial Balance with Primary Variant */}
        <CustomInput
          variant="primary"
          label="Initial Balance"
          required
          type="number"
          step="0.01"
          value={tempAccount.balance?.toString() || ""}
          onChange={(value) => {
            const numValue = parseFloat(value);
            updateTempAccount({ balance: isNaN(numValue) ? 0 : numValue });
          }}
          error={validationErrors.balance}
          placeholder="0.00"
        />
      </div>
    </CustomModal>
  );
};

export default AccountModal;
