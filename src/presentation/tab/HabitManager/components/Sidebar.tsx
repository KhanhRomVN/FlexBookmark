// src/presentation/tab/HabitManager/components/Sidebar.tsx
import React, { useState } from "react";

interface SidebarProps {
  onNewHabit: () => void;
  onDateChange: (date: Date) => void;
  onTimeFilterChange: (filter: string) => void;
  onCollectionChange: (collection: string) => void;
  selectedDate: Date;
}

const Sidebar: React.FC<SidebarProps> = ({
  onNewHabit,
  onDateChange,
  onTimeFilterChange,
  onCollectionChange,
  selectedDate,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [timeFilter, setTimeFilter] = useState("All habit");
  const [collection, setCollection] = useState("Default");

  const handleDateChange = (date: Date) => {
    onDateChange(date);
    setShowDatePicker(false);
  };

  const handleTimeFilterChange = (filter: string) => {
    setTimeFilter(filter);
    onTimeFilterChange(filter);
  };

  const handleCollectionChange = (newCollection: string) => {
    setCollection(newCollection);
    onCollectionChange(newCollection);
  };

  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString("vi-VN", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="w-64 bg-sidebar-background border-r border-border-default p-4 h-full overflow-y-auto">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold  text-transparent">FlexBookmark</h1>
      </div>

      {/* New Habit Button */}
      <div className="mb-6">
        <button
          onClick={onNewHabit}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          New Habit
        </button>
      </div>

      {/* Custom Date Picker */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Select Date
        </label>
        <div className="relative">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <span className="text-slate-900">
              {formatDisplayDate(selectedDate)}
            </span>
            <svg
              className={`w-4 h-4 text-slate-500 transition-transform ${
                showDatePicker ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {showDatePicker && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg p-4">
              <div className="space-y-3">
                {/* Quick Date Options */}
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => handleDateChange(new Date())}
                    className="px-3 py-2 text-sm bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors"
                  >
                    Hôm nay
                  </button>
                  <button
                    onClick={() => {
                      const yesterday = new Date();
                      yesterday.setDate(yesterday.getDate() - 1);
                      handleDateChange(yesterday);
                    }}
                    className="px-3 py-2 text-sm bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors"
                  >
                    Hôm qua
                  </button>
                  <button
                    onClick={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      handleDateChange(tomorrow);
                    }}
                    className="px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                  >
                    Ngày mai
                  </button>
                </div>

                {/* Native Date Input */}
                <div className="border-t pt-3">
                  <input
                    type="date"
                    value={selectedDate.toISOString().split("T")[0]}
                    onChange={(e) => handleDateChange(new Date(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Time in Day Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Time in day
        </label>
        <select
          value={timeFilter}
          onChange={(e) => handleTimeFilterChange(e.target.value)}
          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="All habit">All habit</option>
          <option value="Morning">Morning (6:00 - 12:00)</option>
          <option value="Afternoon">Afternoon (12:00 - 18:00)</option>
          <option value="Evening">Evening (18:00 - 24:00)</option>
        </select>
      </div>

      {/* Collection Management */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Collection
        </label>
        <select
          value={collection}
          onChange={(e) => handleCollectionChange(e.target.value)}
          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent mb-3"
        >
          <option value="Default">Default</option>
          <option value="Health & Fitness">Health & Fitness</option>
          <option value="Productivity">Productivity</option>
          <option value="Learning">Learning</option>
          <option value="Personal Growth">Personal Growth</option>
        </select>

        <div className="space-y-2">
          <button className="w-full text-left px-3 py-2 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 text-purple-700 rounded-lg transition-colors">
            New Collection
          </button>
          <button className="w-full text-left px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors">
            Manage Collections
          </button>
        </div>
      </div>

      {/* Other Options */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Other
        </label>
        <div className="space-y-2">
          <button className="w-full text-left px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Manager
          </button>

          <button className="w-full text-left px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            Relax Time
          </button>

          <button className="w-full text-left px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4 4 4 0 004-4V5z"
              />
            </svg>
            Theme
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
