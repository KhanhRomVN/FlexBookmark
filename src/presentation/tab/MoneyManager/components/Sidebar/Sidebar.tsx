import React, { useState } from "react";
import {
  Home,
  TrendingUp,
  PiggyBank,
  CreditCard,
  Filter,
  Settings,
  BarChart3,
  Calendar,
  Download,
  Plus,
  Wallet,
  Tag,
} from "lucide-react";
import { Account, Category } from "../../types/types";

interface SidebarProps {
  accounts: Account[];
  categories: Category[];
  selectedView: string;
  onViewChange: (view: string) => void;
  onFilterChange: (filters: any) => void;
  onSaveFilter: (name: string, filters: any) => void;
  onAddTransaction: () => void;
  onAddAccount: () => void;
  onExportData: (format: "csv" | "pdf") => void;
  savedFilters: Array<{ name: string; filters: any }>;
}

const Sidebar: React.FC<SidebarProps> = ({
  accounts,
  categories,
  selectedView,
  onViewChange,
  onFilterChange,
  onSaveFilter,
  onAddTransaction,
  onAddAccount,
  onExportData,
  savedFilters,
}) => {
  const [, setActiveSection] = useState("overview");
  const [showFilters, setShowFilters] = useState(false);

  const navigationItems = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "transactions", label: "Transactions", icon: BarChart3 },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
    { id: "budgets", label: "Budgets", icon: Filter },
    { id: "goals", label: "Savings Goals", icon: PiggyBank },
    { id: "debts", label: "Debts & Loans", icon: CreditCard },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "categories", label: "Categories", icon: Tag },
    { id: "accounts", label: "Accounts", icon: Wallet },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const totalBalance = accounts.reduce(
    (total, account) => total + account.balance,
    0
  );

  return (
    <div className="w-80 bg-white border-r border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Money Manager</h1>
        <p className="text-sm text-gray-600">Total Balance</p>
        <p className="text-2xl font-semibold text-green-600">
          ${totalBalance.toLocaleString()}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-gray-200 space-y-2">
        <button
          onClick={onAddTransaction}
          className="w-full flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Transaction
        </button>
        <button
          onClick={onAddAccount}
          className="w-full flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Wallet className="w-4 h-4" />
          Add Account
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        <nav className="p-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onViewChange(item.id);
                  setActiveSection(item.id);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  selectedView === item.id
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Quick Filters */}
        <div className="p-3 border-t border-gray-200">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <Filter className="w-5 h-5" />
            <span className="font-medium">Filters</span>
          </button>

          {showFilters && (
            <div className="mt-2 p-3 bg-gray-50 rounded-lg">
              <FilterPanel
                accounts={accounts}
                categories={categories}
                onFilterChange={onFilterChange}
                onSaveFilter={onSaveFilter}
                savedFilters={savedFilters}
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer - Export Options */}
      <div className="p-4 border-t border-gray-200">
        <h3 className="text-sm font-medium mb-2">Export Data</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onExportData("csv")}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button
            onClick={() => onExportData("pdf")}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      {/* Account Summary */}
      <div className="p-4 border-t border-gray-200">
        <h3 className="text-sm font-medium mb-2">Accounts Summary</h3>
        <div className="space-y-2">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: account.color }}
                />
                <span>{account.name}</span>
              </div>
              <span
                className={
                  account.balance >= 0 ? "text-green-600" : "text-red-600"
                }
              >
                {account.currency} {account.balance.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
