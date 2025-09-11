import React, { useState } from "react";
import { Filter, Calendar, Search, X, Save } from "lucide-react";
import { Account, Category } from "../../types/types";

interface FilterPanelProps {
  accounts: Account[];
  categories: Category[];
  onFilterChange: (filters: any) => void;
  onSaveFilter: (filterName: string, filters: any) => void;
  savedFilters: Array<{ name: string; filters: any }>;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  accounts,
  categories,
  onFilterChange,
  onSaveFilter,
  savedFilters,
}) => {
  const [filters, setFilters] = useState({
    type: "",
    accountId: "",
    categoryId: "",
    minAmount: "",
    maxAmount: "",
    startDate: "",
    endDate: "",
    description: "",
    tags: [] as string[],
  });

  const [newTag, setNewTag] = useState("");
  const [filterName, setFilterName] = useState("");

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !filters.tags.includes(newTag.trim())) {
      const newTags = [...filters.tags, newTag.trim()];
      handleFilterChange("tags", newTags);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = filters.tags.filter((tag) => tag !== tagToRemove);
    handleFilterChange("tags", newTags);
  };

  const clearFilters = () => {
    const emptyFilters = {
      type: "",
      accountId: "",
      categoryId: "",
      minAmount: "",
      maxAmount: "",
      startDate: "",
      endDate: "",
      description: "",
      tags: [],
    };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const applySavedFilter = (savedFilter: any) => {
    setFilters(savedFilter);
    onFilterChange(savedFilter);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filters
        </h2>
        <button
          onClick={clearFilters}
          className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
        >
          <X className="w-4 h-4" />
          Clear All
        </button>
      </div>

      {/* Transaction Type */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Transaction Type
        </label>
        <select
          value={filters.type}
          onChange={(e) => handleFilterChange("type", e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
          <option value="transfer">Transfer</option>
        </select>
      </div>

      {/* Account */}
      <div>
        <label className="block text-sm font-medium mb-1">Account</label>
        <select
          value={filters.accountId}
          onChange={(e) => handleFilterChange("accountId", e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Accounts</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name} ({account.currency})
            </option>
          ))}
        </select>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium mb-1">Category</label>
        <select
          value={filters.categoryId}
          onChange={(e) => handleFilterChange("categoryId", e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          {categories
            .filter((cat) => !cat.isArchived)
            .map((category) => (
              <option key={category.id} value={category.id}>
                {category.name} ({category.type})
              </option>
            ))}
        </select>
      </div>

      {/* Amount Range */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium mb-1">Min Amount</label>
          <input
            type="number"
            step="0.01"
            value={filters.minAmount}
            onChange={(e) => handleFilterChange("minAmount", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Min"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Max Amount</label>
          <input
            type="number"
            step="0.01"
            value={filters.maxAmount}
            onChange={(e) => handleFilterChange("maxAmount", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Max"
          />
        </div>
      </div>

      {/* Date Range */}
      <div>
        <label className="text-sm font-medium mb-1 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Date Range
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange("startDate", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange("endDate", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Description Search */}
      <div>
        <label className="text-sm font-medium mb-1 flex items-center gap-2">
          <Search className="w-4 h-4" />
          Description
        </label>
        <input
          type="text"
          value={filters.description}
          onChange={(e) => handleFilterChange("description", e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Search descriptions..."
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium mb-1">Tags</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
            className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Add tag..."
          />
          <button
            onClick={handleAddTag}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-blue-600"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Save Filter */}
      <div className="pt-4 border-t">
        <label className="text-sm font-medium mb-1 flex items-center gap-2">
          <Save className="w-4 h-4" />
          Save Current Filter
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Filter name..."
          />
          <button
            onClick={() => {
              if (filterName.trim()) {
                onSaveFilter(filterName.trim(), filters);
                setFilterName("");
              }
            }}
            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            disabled={!filterName.trim()}
          >
            Save
          </button>
        </div>
      </div>

      {/* Saved Filters */}
      {savedFilters.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Saved Filters</h3>
          <div className="space-y-1">
            {savedFilters.map((savedFilter, index) => (
              <button
                key={index}
                onClick={() => applySavedFilter(savedFilter.filters)}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg text-sm"
              >
                {savedFilter.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
