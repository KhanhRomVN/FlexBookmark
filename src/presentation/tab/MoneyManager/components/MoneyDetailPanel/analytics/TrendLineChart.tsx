import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Transaction } from "../../../types/types";

interface TrendLineChartProps {
  transactions: Transaction[];
}

const TrendLineChart: React.FC<TrendLineChartProps> = ({ transactions }) => {
  const getTrendData = () => {
    const dailyData: {
      [key: string]: { income: number; expense: number; net: number };
    } = {};

    transactions.forEach((transaction) => {
      const date = new Date(transaction.date);
      const dateString = date.toISOString().split("T")[0];

      if (!dailyData[dateString]) {
        dailyData[dateString] = { income: 0, expense: 0, net: 0 };
      }

      if (transaction.type === "income") {
        dailyData[dateString].income += transaction.amount;
        dailyData[dateString].net += transaction.amount;
      } else if (transaction.type === "expense") {
        dailyData[dateString].expense += transaction.amount;
        dailyData[dateString].net -= transaction.amount;
      }
    });

    return Object.entries(dailyData)
      .map(([date, data]) => ({
        date,
        income: data.income,
        expense: data.expense,
        net: data.net,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  const data = getTrendData();

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Trend Analysis</h3>
        <div className="text-center text-gray-500 py-8">
          No transaction data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Trend Analysis</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip formatter={(value: number) => value.toLocaleString()} />
          <Line
            type="monotone"
            dataKey="income"
            stroke="#4ade80"
            name="Income"
          />
          <Line
            type="monotone"
            dataKey="expense"
            stroke="#f87171"
            name="Expense"
          />
          <Line type="monotone" dataKey="net" stroke="#60a5fa" name="Net" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TrendLineChart;
