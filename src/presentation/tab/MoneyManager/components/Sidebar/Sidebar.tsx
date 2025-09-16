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
  Wallet,
  Tag,
} from "lucide-react";
import { Account, Category } from "../../types/types";
import FilterPanel from "./FilterPanel.tsx";
import CustomButton from "../../../../components/common/CustomButton";

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
  savedFilters,
}) => {
  const [, setActiveSection] = useState("overview");
  const [showFilters, setShowFilters] = useState(false);

  const navigationItems = [
    {
      id: "overview",
      label: "Overview",
      icon: Home,
      color: "text-blue-500 hover:text-blue-600",
    },
    {
      id: "transactions",
      label: "Transactions",
      icon: BarChart3,
      color: "text-green-500 hover:text-green-600",
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: TrendingUp,
      color: "text-purple-500 hover:text-purple-600",
    },
    {
      id: "budgets",
      label: "Budgets",
      icon: Filter,
      color: "text-orange-500 hover:text-orange-600",
    },
    {
      id: "goals",
      label: "Savings Goals",
      icon: PiggyBank,
      color: "text-pink-500 hover:text-pink-600",
    },
    {
      id: "debts",
      label: "Debts & Loans",
      icon: CreditCard,
      color: "text-red-500 hover:text-red-600",
    },
    {
      id: "calendar",
      label: "Calendar",
      icon: Calendar,
      color: "text-indigo-500 hover:text-indigo-600",
    },
    {
      id: "categories",
      label: "Categories",
      icon: Tag,
      color: "text-teal-500 hover:text-teal-600",
    },
    {
      id: "accounts",
      label: "Accounts",
      icon: Wallet,
      color: "text-amber-500 hover:text-amber-600",
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      color: "text-gray-500 hover:text-gray-600",
    },
  ];

  return (
    <div className="w-80 bg-sidebar-background border-r border-border-default h-full flex flex-col">
      {/* Header - Only Title */}
      <div className="py-3 px-6 border-b border-border-default">
        <h1 className="text-xl font-bold text-text-primary tracking-tight">
          Money Manager
        </h1>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        <nav className="p-4">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isSelected = selectedView === item.id;

            return (
              <CustomButton
                key={item.id}
                variant="ghost"
                align="left"
                onClick={() => {
                  onViewChange(item.id);
                  setActiveSection(item.id);
                }}
                className={`
                  group transition-all duration-200
                  ${isSelected ? "!bg-button-bg !text-button-bgText" : ""}
                `}
              >
                <Icon
                  className={`
                    w-5 h-5 transition-colors duration-200
                    ${
                      isSelected
                        ? "text-button-bgText"
                        : `${item.color} group-hover:scale-110`
                    }
                  `}
                />
                <span className="transition-colors duration-200">
                  {item.label}
                </span>
              </CustomButton>
            );
          })}
        </nav>

        {/* Quick Filters */}
        <div className="p-3 border-t border-border-default">
          <CustomButton
            variant="ghost"
            align="left"
            onClick={() => setShowFilters(!showFilters)}
            className="group"
          >
            <Filter className="w-5 h-5 text-cyan-500 hover:text-cyan-600 group-hover:scale-110 transition-all duration-200" />
            <span>Filters</span>
          </CustomButton>

          {showFilters && (
            <div className="mt-2 p-3 bg-gray-50 rounded-lg animate-in slide-in-from-top-2 duration-200">
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
    </div>
  );
};

export default Sidebar;
