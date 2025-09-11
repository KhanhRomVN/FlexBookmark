import React, { useState } from "react";
import { Habit } from "../../types/types";
import { TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";

interface CategoryDistributionProps {
  habits: Habit[];
}

const CategoryDistribution: React.FC<CategoryDistributionProps> = ({
  habits,
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 8; // Show 8 categories per page

  const activeHabits = habits.filter((habit) => !habit.isArchived);

  // Group habits by category with their completion status and colors
  const categoryData = activeHabits.reduce((acc, habit) => {
    if (!acc[habit.category]) {
      acc[habit.category] = {
        habits: [],
        total: 0,
        completed: 0,
      };
    }

    acc[habit.category].habits.push({
      id: habit.id,
      name: habit.name,
      completed: habit.completedToday,
      colorCode: habit.colorCode || "#6366f1",
    });

    acc[habit.category].total++;
    if (habit.completedToday) {
      acc[habit.category].completed++;
    }

    return acc;
  }, {} as Record<string, { habits: Array<{ id: string; name: string; completed: boolean; colorCode: string }>; total: number; completed: number }>);

  // Sort categories by total count (descending)
  const sortedCategories = Object.entries(categoryData).sort(
    (a, b) => b[1].total - a[1].total
  );

  // Calculate pagination
  const totalPages = Math.ceil(sortedCategories.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCategories = sortedCategories.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  return (
    <div className="bg-card-background rounded-xl p-6 border border-border-default">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">
              Category Distribution
            </h3>
            <p className="text-sm text-text-secondary">
              {sortedCategories.length} categories • Page {currentPage + 1} of{" "}
              {totalPages}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">
            {activeHabits.length}
          </div>
          <div className="text-xs text-text-secondary">Total Habits</div>
        </div>
      </div>

      {/* Category List */}
      <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
        {currentCategories.map(([category, data]) => {
          const completionRate =
            data.total > 0 ? (data.completed / data.total) * 100 : 0;

          return (
            <div
              key={category}
              className="bg-background/50 rounded-lg p-4 border border-border-default hover:shadow-sm transition-all duration-200"
            >
              {/* Category Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h4 className="text-base font-medium text-text-primary capitalize">
                    {category}
                  </h4>
                  <span className="text-sm text-text-secondary">
                    ({data.completed}/{data.total})
                  </span>
                </div>
                <div className="text-sm font-medium text-primary">
                  {Math.round(completionRate)}%
                </div>
              </div>

              {/* Progress Bar with Color Segments */}
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 mb-2 overflow-hidden">
                <div className="flex h-full">
                  {data.habits.map((habit) => {
                    const segmentWidth = (1 / data.total) * 100;

                    return (
                      <div
                        key={habit.id}
                        className="transition-all duration-300"
                        style={{
                          width: `${segmentWidth}%`,
                          backgroundColor: habit.completed
                            ? habit.colorCode
                            : "rgba(156, 163, 175, 0.3)",
                        }}
                        title={`${habit.name}: ${
                          habit.completed ? "Completed" : "Not completed"
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Habit Details */}
              <div className="grid grid-cols-2 gap-2">
                {data.habits.map((habit) => (
                  <div
                    key={habit.id}
                    className="flex items-center gap-2 text-xs"
                  >
                    <div
                      className="w-3 h-3 rounded-full border border-white/20"
                      style={{ backgroundColor: habit.colorCode }}
                    />
                    <span
                      className={`truncate ${
                        habit.completed
                          ? "text-text-primary font-medium"
                          : "text-text-secondary"
                      }`}
                      title={habit.name}
                    >
                      {habit.name}
                    </span>
                    {habit.completed && (
                      <span className="text-green-600 text-xs">✓</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 0}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 ${
              currentPage === 0
                ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm">Previous</span>
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-all duration-200 ${
                  i === currentPage
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages - 1}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 ${
              currentPage === totalPages - 1
                ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
            }`}
          >
            <span className="text-sm">Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Summary Stats */}
      <div className="flex items-center justify-between pt-4 border-t border-border-default">
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <TrendingUp className="w-4 h-4" />
          <span>
            Showing {startIndex + 1}-
            {Math.min(endIndex, sortedCategories.length)} of{" "}
            {sortedCategories.length} categories
          </span>
        </div>
        <div className="text-sm text-text-secondary">
          Top: {sortedCategories[0]?.[0]} ({sortedCategories[0]?.[1].total}{" "}
          habits)
        </div>
      </div>
    </div>
  );
};

export default CategoryDistribution;
