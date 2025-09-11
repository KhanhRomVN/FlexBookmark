import React, { useState } from "react";
import { SavingsGoal, SavingsGoalFormData } from "../../../types/types";
import GoalProgress from "./GoalProgress";

interface SavingsGoalProps {
  goals: SavingsGoal[];
  onAddGoal: (formData: SavingsGoalFormData) => Promise<void>;
  onEditGoal: (goal: SavingsGoal) => void;
  onDeleteGoal: (goalId: string) => void;
}

const SavingsGoal: React.FC<SavingsGoalProps> = ({
  goals,
  onAddGoal,
  onEditGoal,
  onDeleteGoal,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newGoal, setNewGoal] = useState({
    name: "",
    targetAmount: 0,
    currentAmount: 0,
    currency: "VND",
    color: "#3b82f6",
    icon: "💰",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddGoal(newGoal);
    setIsAdding(false);
    setNewGoal({
      name: "",
      targetAmount: 0,
      currentAmount: 0,
      currency: "VND",
      color: "#3b82f6",
      icon: "💰",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Savings Goals
        </h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          {isAdding ? "Cancel" : "Add Goal"}
        </button>
      </div>

      {isAdding && (
        <form
          onSubmit={handleSubmit}
          className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <input
              type="text"
              placeholder="Goal name"
              value={newGoal.name}
              onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
              required
            />
            <select
              value={newGoal.currency}
              onChange={(e) =>
                setNewGoal({ ...newGoal, currency: e.target.value })
              }
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
            >
              <option value="VND">VND</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
            <input
              type="number"
              placeholder="Target amount"
              value={newGoal.targetAmount || ""}
              onChange={(e) =>
                setNewGoal({ ...newGoal, targetAmount: Number(e.target.value) })
              }
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
              required
              min="0"
            />
            <input
              type="number"
              placeholder="Current amount"
              value={newGoal.currentAmount || ""}
              onChange={(e) =>
                setNewGoal({
                  ...newGoal,
                  currentAmount: Number(e.target.value),
                })
              }
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
              required
              min="0"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
          >
            Create Goal
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((goal) => (
          <div key={goal.id} className="relative group">
            <GoalProgress goal={goal} />
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEditGoal(goal)}
                className="p-1 bg-blue-600 text-white rounded mr-1"
              >
                Edit
              </button>
              <button
                onClick={() => onDeleteGoal(goal.id)}
                className="p-1 bg-red-600 text-white rounded"
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {goals.length === 0 && !isAdding && (
          <div className="col-span-2 text-center py-8 text-gray-500 dark:text-gray-400">
            No savings goals yet. Create your first goal to start tracking!
          </div>
        )}
      </div>
    </div>
  );
};

export default SavingsGoal;
