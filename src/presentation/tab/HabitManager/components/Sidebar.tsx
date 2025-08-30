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

  // Icon Components for better maintainability
  const PlusIcon = () => (
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
  );

  const ChevronDownIcon = ({ isOpen }: { isOpen: boolean }) => (
    <svg
      className={`w-4 h-4 text-text-secondary transition-transform duration-200 ${
        isOpen ? "rotate-180" : ""
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
  );

  const SettingsIcon = () => (
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
  );

  const SunIcon = () => (
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
  );

  const BookIcon = () => (
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
  );

  return (
    <div className="w-64 bg-sidebar-background border-r border-border-default h-full overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-text-primary">FlexBookmark</h1>
        </div>

        {/* New Habit Button */}
        <button
          onClick={onNewHabit}
          className="w-full flex items-center justify-center gap-2 bg-button-bg hover:bg-button-bgHover text-button-bgText px-4 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <PlusIcon />
          New Habit
        </button>

        {/* Date Picker Section */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Select Date
          </label>
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="w-full px-3 py-2 bg-input-background border border-border-default rounded-lg hover:border-border-hover focus:ring-2 focus:ring-primary focus:border-border-focus text-left flex items-center justify-between transition-all duration-200"
            >
              <span className="text-text-primary">
                {formatDisplayDate(selectedDate)}
              </span>
              <ChevronDownIcon isOpen={showDatePicker} />
            </button>

            {showDatePicker && (
              <div className="absolute z-10 mt-1 w-full bg-dropdown-background border border-border-default rounded-lg shadow-lg p-4 backdrop-blur-sm">
                <div className="space-y-3">
                  {/* Quick Date Options */}
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      {
                        label: "Hôm nay",
                        offset: 0,
                        style: "bg-green-50 hover:bg-green-100 text-green-700",
                      },
                      {
                        label: "Hôm qua",
                        offset: -1,
                        style: "bg-slate-50 hover:bg-slate-100 text-slate-700",
                      },
                      {
                        label: "Ngày mai",
                        offset: 1,
                        style: "bg-blue-50 hover:bg-blue-100 text-blue-700",
                      },
                    ].map(({ label, offset, style }) => (
                      <button
                        key={label}
                        onClick={() => {
                          const date = new Date();
                          date.setDate(date.getDate() + offset);
                          handleDateChange(date);
                        }}
                        className={`px-3 py-2 text-sm rounded-lg transition-colors ${style}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Native Date Input */}
                  <div className="border-t border-border-default pt-3">
                    <input
                      type="date"
                      value={selectedDate.toISOString().split("T")[0]}
                      onChange={(e) =>
                        handleDateChange(new Date(e.target.value))
                      }
                      className="w-full px-3 py-2 bg-input-background border border-border-default rounded-lg focus:ring-2 focus:ring-primary focus:border-border-focus transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Time Filter Section */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Time in day
          </label>
          <select
            value={timeFilter}
            onChange={(e) => handleTimeFilterChange(e.target.value)}
            className="w-full px-3 py-2 bg-input-background border border-border-default rounded-lg focus:ring-2 focus:ring-primary focus:border-border-focus text-text-primary transition-colors"
          >
            <option value="All habit">All habit</option>
            <option value="Morning">Morning (6:00 - 12:00)</option>
            <option value="Afternoon">Afternoon (12:00 - 18:00)</option>
            <option value="Evening">Evening (18:00 - 24:00)</option>
          </select>
        </div>

        {/* Collection Management */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Collection
          </label>
          <select
            value={collection}
            onChange={(e) => handleCollectionChange(e.target.value)}
            className="w-full px-3 py-2 bg-input-background border border-border-default rounded-lg focus:ring-2 focus:ring-primary focus:border-border-focus text-text-primary mb-3 transition-colors"
          >
            <option value="Default">Default</option>
            <option value="Health & Fitness">Health & Fitness</option>
            <option value="Productivity">Productivity</option>
            <option value="Learning">Learning</option>
            <option value="Personal Growth">Personal Growth</option>
          </select>

          <div className="space-y-2">
            <button className="w-full text-left px-3 py-2 bg-button-secondBg hover:bg-button-secondBgHover text-text-primary rounded-lg transition-all duration-200 hover:translate-x-1">
              New Collection
            </button>
            <button className="w-full text-left px-3 py-2 bg-sidebar-itemHover hover:bg-sidebar-itemFocus text-text-primary rounded-lg transition-all duration-200 hover:translate-x-1">
              Manage Collections
            </button>
          </div>
        </div>

        {/* Other Options */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Other
          </label>
          <div className="space-y-2">
            {[
              { label: "Manager", icon: <SettingsIcon /> },
              { label: "Relax Time", icon: <SunIcon /> },
              { label: "Theme", icon: <BookIcon /> },
            ].map(({ label, icon }) => (
              <button
                key={label}
                className="w-full text-left px-3 py-2 bg-sidebar-itemHover hover:bg-sidebar-itemFocus text-text-primary rounded-lg transition-all duration-200 flex items-center gap-2 hover:translate-x-1 group"
              >
                <span className="text-text-secondary group-hover:text-text-primary transition-colors">
                  {icon}
                </span>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
