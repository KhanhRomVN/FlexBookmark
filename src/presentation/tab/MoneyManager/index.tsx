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

  const {
    transactions,
    accounts,
    categories,
    loading,
    addTransaction,
    reloadMoneyData,
  } = useMoney();
  const { deleteTransaction } = useTransactions();
  const { updateAccount } = useAccounts();
  const { updateCategory } = useCategories();

  useEffect(() => {
    // Load initial data
    reloadMoneyData();
  }, []);

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
      reloadMoneyData();
    } catch (error) {
      console.error("Error saving data:", error);
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      await deleteTransaction(transactionId);
      reloadMoneyData();
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
      />

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
            loading={loading}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onEditAccount={handleEditAccount}
            onViewAccountTransactions={setSelectedAccountId}
            onSelectAccount={setSelectedAccountId}
            onSelectCategory={setSelectedCategoryId}
            onSetTimeFilter={setTimeFilter}
            onSetSearchQuery={setSearchQuery}
          />
        </div>

        <div className="w-1/2 overflow-y-auto">{renderDetailPanel()}</div>
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
