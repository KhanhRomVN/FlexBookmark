import React, { useState } from "react";
import { Plus, Archive, Calendar, Palette } from "lucide-react";
import CustomCombobox from "../../../components/common/CustomCombobox";

interface SidebarProps {
  onNewHabit: () => void;
  onDateChange: (date: Date) => void;
  onCategoryFilter: (categories: string[]) => void;
  onTagFilter: (tags: string[]) => void;
  onArchiveFilter: (showArchived: boolean) => void;
  onTimeOfDayFilter: (timeOfDay: string[]) => void;
  onOpenTheme?: () => void;
  selectedDate: Date;
}

const Sidebar: React.FC<SidebarProps> = ({
  onNewHabit,
  onDateChange,
  onCategoryFilter,
  onTagFilter,
  onArchiveFilter,
  onTimeOfDayFilter,
  onOpenTheme,
  selectedDate,
}) => {
  const [showArchived, setShowArchived] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<string[]>([]);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  const habitCategories = [
    { value: "health", label: "Health" },
    { value: "fitness", label: "Fitness" },
    { value: "productivity", label: "Productivity" },
    { value: "mindfulness", label: "Mindfulness" },
    { value: "learning", label: "Learning" },
    { value: "social", label: "Social" },
    { value: "finance", label: "Finance" },
    { value: "creativity", label: "Creativity" },
    { value: "other", label: "Other" },
  ];

  const timeOfDayOptions = [
    { id: "morning", label: "Morning (6AM-12PM)", emoji: "🌅" },
    { id: "afternoon", label: "Afternoon (12PM-6PM)", emoji: "☀️" },
    { id: "evening", label: "Evening (6PM-12AM)", emoji: "🌙" },
    { id: "night", label: "Night (12AM-6AM)", emoji: "🌌" },
  ];

  const handleCategoryChange = (values: string[]) => {
    setSelectedCategories(values);
    onCategoryFilter(values);
  };

  const handleTagChange = (values: string[]) => {
    setSelectedTags(values);
    onTagFilter(values);
  };

  const handleTimeOfDayChange = (timeId: string) => {
    const newSelection = selectedTimeOfDay.includes(timeId)
      ? selectedTimeOfDay.filter((id) => id !== timeId)
      : [...selectedTimeOfDay, timeId];

    setSelectedTimeOfDay(newSelection);
    onTimeOfDayFilter(newSelection);
  };

  const handleArchiveToggle = () => {
    const newValue = !showArchived;
    setShowArchived(newValue);
    onArchiveFilter(newValue);
  };

  const handleDateChange = (date: Date) => {
    onDateChange(date);
  };

  const handleCustomDateClick = () => {
    setShowCustomDatePicker(!showCustomDatePicker);
  };

  const handleCustomDateChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedDate = new Date(event.target.value);
    handleDateChange(selectedDate);
    setShowCustomDatePicker(false);
  };

  const formatSelectedDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isSameDay = (date1: Date, date2: Date) =>
      date1.toDateString() === date2.toDateString();

    if (isSameDay(date, today)) return "Today";
    if (isSameDay(date, yesterday)) return "Yesterday";
    if (isSameDay(date, tomorrow)) return "Tomorrow";

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  return (
    <div className="w-72 bg-sidebar-background border-r border-border-default h-full overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-text-primary">FlexBookmark</h1>
        </div>

        {/* New Habit Button */}
        <button
          onClick={onNewHabit}
          className="w-full flex items-center justify-center gap-2 bg-button-bg hover:bg-button-bgHover text-button-bgText px-4 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          New Habit
        </button>

        {/* Filters Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-text-primary">Filters</h3>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Category
            </label>
            <CustomCombobox
              value={selectedCategories}
              options={habitCategories}
              onChange={handleCategoryChange}
              placeholder="Select categories..."
              multiple
            />
          </div>

          {/* Tags Filter */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Tags
            </label>
            <CustomCombobox
              value={selectedTags}
              options={[]} // Will be populated from habits data
              onChange={handleTagChange}
              placeholder="Select tags..."
              multiple
              creatable
            />
          </div>

          {/* Time of Day Filter */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Time of Day
            </label>
            <div className="space-y-2">
              {timeOfDayOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleTimeOfDayChange(option.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                    selectedTimeOfDay.includes(option.id)
                      ? "bg-blue-500 text-white hover:bg-blue-600"
                      : "bg-input-background hover:bg-sidebar-itemHover text-text-primary"
                  }`}
                >
                  <span className="text-lg">{option.emoji}</span>
                  <span className="flex-1 text-left">{option.label}</span>
                  {selectedTimeOfDay.includes(option.id) && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Archive Filter */}
          <div>
            <button
              onClick={handleArchiveToggle}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors w-full ${
                showArchived
                  ? "bg-blue-500 text-white"
                  : "bg-input-background hover:bg-sidebar-itemHover"
              }`}
            >
              <Archive className="w-4 h-4" />
              {showArchived ? "Hide Archived" : "Show Archived"}
            </button>
          </div>

          {/* Theme Option */}
          {onOpenTheme && (
            <div>
              <button
                onClick={onOpenTheme}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors w-full bg-input-background hover:bg-sidebar-itemHover text-text-primary"
              >
                <Palette className="w-4 h-4" />
                Theme
              </button>
            </div>
          )}
        </div>

        {/* Quick Date Selection */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-text-primary">
            Quick Select
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Today", offset: 0 },
              { label: "Yesterday", offset: -1 },
              { label: "Tomorrow", offset: 1 },
            ].map(({ label, offset }) => (
              <button
                key={label}
                onClick={() => {
                  const date = new Date();
                  date.setDate(date.getDate() + offset);
                  handleDateChange(date);
                }}
                className="px-3 py-2 bg-input-background hover:bg-sidebar-itemHover rounded-lg text-sm transition-colors"
              >
                {label}
              </button>
            ))}

            {/* Custom Date Button */}
            <button
              onClick={handleCustomDateClick}
              className={`px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-1 ${
                showCustomDatePicker
                  ? "bg-purple-500 hover:bg-purple-600 text-white"
                  : "bg-input-background hover:bg-sidebar-itemHover text-text-primary"
              }`}
            >
              <Calendar className="w-4 h-4" />
              Custom Date
            </button>
          </div>

          {/* Custom Date Picker */}
          {showCustomDatePicker && (
            <div className="mt-3 p-3 bg-input-background rounded-lg border border-border-default">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Select Date
              </label>
              <input
                type="date"
                value={formatDateForInput(selectedDate)}
                onChange={handleCustomDateChange}
                className="w-full px-3 py-2 bg-white border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => setShowCustomDatePicker(false)}
                className="mt-2 w-full px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm text-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
