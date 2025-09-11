import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Transaction, Category } from "../../../types/types";

interface CategoryPieChartProps {
  transactions: Transaction[];
  categories: Category[];
  type: "income" | "expense";
}

const CategoryPieChart: React.FC<CategoryPieChartProps> = ({
  transactions,
  categories,
  type,
}) => {
  const getCategoryData = () => {
    const categoryMap = new Map<string, number>();

    transactions.forEach((transaction) => {
      if (transaction.type === type && transaction.categoryId) {
        const current = categoryMap.get(transaction.categoryId) || 0;
        categoryMap.set(transaction.categoryId, current + transaction.amount);
      }
    });

    return Array.from(categoryMap.entries()).map(([categoryId, amount]) => {
      const category = categories.find((c) => c.id === categoryId);
      return {
        name: category?.name || "Unknown",
        value: amount,
        color: category?.color || "#8884d8",
      };
    });
  };

  const data = getCategoryData();

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">
          {type === "income" ? "Income" : "Expense"} by Category
        </h3>
        <div className="text-center text-gray-500 py-8">
          No {type} data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">
        {type === "income" ? "Income" : "Expense"} by Category
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [value.toLocaleString(), "Amount"]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CategoryPieChart;
