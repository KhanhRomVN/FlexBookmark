import React, { useState } from "react";
import {
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Category } from "../../types/types";
import { DEFAULT_CATEGORIES } from "../../constants/constants";
import { CategoryIconPicker } from "../common/CategoryIconPicker";
import { validateCategory } from "../../utils/validationUtils";

interface CategoryManagerProps {
  categories: Category[];
  onAddCategory: (categoryData: any) => Promise<void>;
  onUpdateCategory: (category: Category) => Promise<void>;
  onDeleteCategory: (categoryId: string) => Promise<void>;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const [formData, setFormData] = useState({
    name: "",
    type: "expense" as "income" | "expense",
    parentId: "",
    color: "#3B82F6",
    icon: "💰",
    budget: "",
    budgetPeriod: "",
  });

  const toggleExpand = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const categoryData = {
      ...formData,
      budget: formData.budget ? parseFloat(formData.budget) : undefined,
      budgetPeriod: formData.budgetPeriod || undefined,
    };

    const errors = validateCategory(categoryData);
    if (errors.length > 0) {
      alert(errors.join("\n"));
      return;
    }

    try {
      if (editingCategory) {
        await onUpdateCategory({
          ...editingCategory,
          ...categoryData,
        });
        setEditingCategory(null);
      } else {
        await onAddCategory(categoryData);
      }
      setFormData({
        name: "",
        type: "expense",
        parentId: "",
        color: "#3B82F6",
        icon: "💰",
        budget: "",
        budgetPeriod: "",
      });
      setIsAdding(false);
    } catch (error) {
      console.error("Error saving category:", error);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      parentId: category.parentId || "",
      color: category.color,
      icon: category.icon,
      budget: category.budget?.toString() || "",
      budgetPeriod: category.budgetPeriod || "",
    });
  };

  const renderCategoryTree = (parentId?: string, level = 0) => {
    const childCategories = categories.filter(
      (cat) => cat.parentId === parentId
    );

    return childCategories.map((category) => {
      const hasChildren = categories.some(
        (cat) => cat.parentId === category.id
      );
      const isExpanded = expandedCategories.has(category.id);

      return (
        <div key={category.id} className="ml-4">
          <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
            <div className="flex items-center gap-2 flex-1">
              {hasChildren && (
                <button
                  onClick={() => toggleExpand(category.id)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              )}
              {!hasChildren && <div className="w-6" />}

              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <span className="text-lg">{category.icon}</span>
              <span className="font-medium">{category.name}</span>
              <span className="text-sm text-gray-500 capitalize">
                ({category.type})
              </span>
              {category.isArchived && (
                <span className="text-xs text-gray-400">(Archived)</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleEdit(category)}
                className="p-1 hover:bg-blue-100 rounded text-blue-600"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDeleteCategory(category.id)}
                className="p-1 hover:bg-red-100 rounded text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() =>
                  onUpdateCategory({
                    ...category,
                    isArchived: !category.isArchived,
                  })
                }
                className="p-1 hover:bg-gray-100 rounded text-gray-600"
              >
                {category.isArchived ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {isExpanded && hasChildren && (
            <div className="ml-4">
              {renderCategoryTree(category.id, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Category Manager</h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {(isAdding || editingCategory) && (
        <form
          onSubmit={handleSubmit}
          className="p-4 bg-gray-50 rounded-lg space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Category name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as "income" | "expense",
                  })
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Parent Category
            </label>
            <select
              value={formData.parentId}
              onChange={(e) =>
                setFormData({ ...formData, parentId: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">None (Top Level)</option>
              {categories
                .filter((cat) => cat.type === formData.type)
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Color</label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
                className="w-full h-10 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Icon</label>
              <CategoryIconPicker
                value={formData.icon}
                onChange={(icon) => setFormData({ ...formData, icon })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Budget Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.budget}
                onChange={(e) =>
                  setFormData({ ...formData, budget: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Budget Period
              </label>
              <select
                value={formData.budgetPeriod}
                onChange={(e) =>
                  setFormData({ ...formData, budgetPeriod: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={!formData.budget}
              >
                <option value="">Select period</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {editingCategory ? "Update" : "Add"} Category
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setEditingCategory(null);
                setFormData({
                  name: "",
                  type: "expense",
                  parentId: "",
                  color: "#3B82F6",
                  icon: "💰",
                  budget: "",
                  budgetPeriod: "",
                });
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        <h3 className="font-medium">Default Categories</h3>
        <div className="grid grid-cols-2 gap-2">
          {DEFAULT_CATEGORIES.INCOME.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-2 p-2 bg-gray-50 rounded"
            >
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              <span className="text-lg">{cat.icon}</span>
              <span>{cat.name}</span>
            </div>
          ))}
          {DEFAULT_CATEGORIES.EXPENSE.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-2 p-2 bg-gray-50 rounded"
            >
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              <span className="text-lg">{cat.icon}</span>
              <span>{cat.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-medium">Custom Categories</h3>
        {renderCategoryTree()}
      </div>
    </div>
  );
};

export default CategoryManager;
