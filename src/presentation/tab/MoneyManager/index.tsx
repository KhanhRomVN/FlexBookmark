// src/presentation/tab/MoneyManager/index.tsx
import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar/Sidebar";
import MoneyListPanel from "./components/MoneyListPanel/MoneyListPanel";
import FinancialDashboard from "./components/MoneyDetailPanel/overview/FinancialDashboard";
import { useMoney } from "./hooks/useMoney";
import { useTransactions } from "./hooks/useTransactions";
import { useAccounts } from "./hooks/useAccounts";
import { useCategories } from "./hooks/useCategories";
import MoneyDialog, {
  MoneyDialogType,
} from "./components/MoneyDialog/MoneyDialog";
import { Transaction, Account } from "./types/types";

const MoneyManager: React.FC = () => {
  const [selectedView, setSelectedView] = useState("overview");
  const [selectedAccountId, setSelectedAccountId] = useState<string>();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>();
  const [timeFilter, setTimeFilter] = useState<
    "day" | "week" | "month" | "year" | "all"
  >("month");
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<MoneyDialogType>("transaction");
  const [editingEntity, setEditingEntity] = useState<any>(null);
  const [savedFilters, setSavedFilters] = useState<
    Array<{ name: string; filters: any }>
  >([]);
  const [retryCount, setRetryCount] = useState(0);

  const {
    transactions,
    accounts,
    categories,
    error,
    addTransaction,
    reloadMoneyData,
    connectionStatus,
    isBackgroundLoading,
    hasInitialData,
  } = useMoney();

  const { deleteTransaction } = useTransactions();
  const { updateAccount } = useAccounts();
  const { updateCategory } = useCategories();

  // Handle connection retry
  const handleRetryConnection = async () => {
    setRetryCount((prev) => prev + 1);
    try {
      await reloadMoneyData(false);
    } catch (error) {
      console.error("Retry failed:", error);
    }
  };

  useEffect(() => {
    // Load initial data - this will use cached data first, then sync in background
    const initializeData = async () => {
      try {
        await reloadMoneyData(hasInitialData); // Use background sync if we have cached data
      } catch (error) {
        console.error("Initial data load failed:", error);
      }
    };

    initializeData();
  }, [hasInitialData]);

  // Auto-retry on error with exponential backoff
  useEffect(() => {
    if (connectionStatus === "error" && retryCount < 3) {
      const retryDelay = Math.pow(2, retryCount) * 2000; // 2s, 4s, 8s
      const timer = setTimeout(() => {
        console.log(`Auto-retry ${retryCount + 1}/3 after ${retryDelay}ms`);
        handleRetryConnection();
      }, retryDelay);

      return () => clearTimeout(timer);
    }
  }, [connectionStatus, retryCount]);

  // Reset retry count on successful connection
  useEffect(() => {
    if (connectionStatus === "connected") {
      setRetryCount(0);
    }
  }, [connectionStatus]);

  const handleAddTransaction = () => {
    setDialogType("transaction");
    setEditingEntity(null);
    setDialogOpen(true);
  };

  const handleAddAccount = () => {
    setDialogType("account");
    setEditingEntity(null);
    setDialogOpen(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setDialogType("transaction");
    setEditingEntity(transaction);
    setDialogOpen(true);
  };

  const handleEditAccount = (account: Account) => {
    setDialogType("account");
    setEditingEntity(account);
    setDialogOpen(true);
  };

  const handleDialogSubmit = async (data: any) => {
    try {
      switch (dialogType) {
        case "transaction":
          if (editingEntity) {
            // Update existing transaction
            // This would need to be implemented in useTransactions
          } else {
            await addTransaction(data);
          }
          break;
        case "account":
          if (editingEntity) {
            await updateAccount({ ...editingEntity, ...data });
          }
          break;
        case "category":
          if (editingEntity) {
            await updateCategory({ ...editingEntity, ...data });
          }
          break;
        // Other cases for budget, savings, debt
      }
      setDialogOpen(false);
      // Trigger a background reload to refresh data
      await reloadMoneyData(true);
    } catch (error) {
      console.error("Error saving data:", error);
      // You might want to show an error message to the user here
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      try {
        await deleteTransaction(transactionId);
        // Trigger a background reload to refresh data
        await reloadMoneyData(true);
      } catch (error) {
        console.error("Error deleting transaction:", error);
        // You might want to show an error message to the user here
      }
    }
  };

  const handleExportData = (format: "csv" | "pdf") => {
    // Implement export functionality
    console.log(`Exporting data as ${format}`);
  };

  const handleSaveFilter = (name: string, filters: any) => {
    setSavedFilters([...savedFilters, { name, filters }]);
  };

  const renderDetailPanel = () => {
    switch (selectedView) {
      case "overview":
        return (
          <FinancialDashboard
            transactions={transactions}
            accounts={accounts}
            categories={categories}
          />
        );
      case "transactions":
        // Would render transaction-specific view
        return <div>Transactions View</div>;
      case "analytics":
        // Would render analytics view
        return <div>Analytics View</div>;
      // Other cases for different views
      default:
        return <div>Select a view</div>;
    }
  };

  return (
    <div className="h-screen flex bg-gray-100 dark:bg-gray-900">
      <Sidebar
        accounts={accounts}
        categories={categories}
        selectedView={selectedView}
        onViewChange={setSelectedView}
        onFilterChange={() => {}} // Implement filter logic
        onSaveFilter={handleSaveFilter}
        onAddTransaction={handleAddTransaction}
        onAddAccount={handleAddAccount}
        onExportData={handleExportData}
        savedFilters={savedFilters}
        hasInitialData={hasInitialData}
      />

      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex">
          <div className="w-1/2 border-r border-gray-200 dark:border-gray-700">
            <MoneyListPanel
              transactions={transactions}
              accounts={accounts}
              categories={categories}
              selectedAccountId={selectedAccountId}
              selectedCategoryId={selectedCategoryId}
              timeFilter={timeFilter}
              searchQuery={searchQuery}
              connectionStatus={connectionStatus}
              isBackgroundLoading={isBackgroundLoading}
              onEditTransaction={handleEditTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onEditAccount={handleEditAccount}
              onViewAccountTransactions={setSelectedAccountId}
              onSelectAccount={setSelectedAccountId}
              onSelectCategory={setSelectedCategoryId}
              onSetTimeFilter={setTimeFilter}
              onSetSearchQuery={setSearchQuery}
              hasInitialData={hasInitialData}
            />
          </div>

          <div className="w-1/2 overflow-y-auto">
            {hasInitialData ? (
              renderDetailPanel()
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      <MoneyDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        type={dialogType}
        editingEntity={editingEntity}
        onSubmit={handleDialogSubmit}
        accounts={accounts}
        categories={categories}
      />
    </div>
  );
};

export default MoneyManager;
