// src/presentation/components/TaskManager/FilterSection.tsx
// Enhanced filter section with multi-select support and ModernDateTimePicker

import React from "react";
import { Filter, X, Flag, Tag, FolderOpen, MapPin, Clock } from "lucide-react";
import CustomCombobox from "../common/CustomCombobox";
import ModernDateTimePicker from "../common/ModernDateTimePicker";

interface FilterSectionProps {
  showAdvancedFilters: boolean;
  searchTerm: string;
  filterPriority: string[];
  setFilterPriority: (priority: string[]) => void;
  filterTags: string[];
  setFilterTags: (tags: string[]) => void;
  filterCollection: string[];
  setFilterCollection: (collections: string[]) => void;
  filterLocation: string;
  setFilterLocation: (location: string) => void;
  filterStartTime?: Date | null;
  setFilterStartTime?: (time: Date | null) => void;
  filterEndTime?: Date | null;
  setFilterEndTime?: (time: Date | null) => void;
  lists?: any[];
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  showAdvancedFilters,
  searchTerm,
  filterPriority,
  setFilterPriority,
  filterTags,
  setFilterTags,
  filterCollection,
  setFilterCollection,
  filterLocation,
  setFilterLocation,
  filterStartTime,
  setFilterStartTime,
  filterEndTime,
  setFilterEndTime,
  lists = [],
  hasActiveFilters,
  onClearFilters,
}) => {
  // Extract unique options from tasks
  const extractOptionsFromTasks = () => {
    const allTasks = lists.flatMap((list) => list.tasks || []);

    // Extract unique priorities
    const priorities = Array.from(
      new Set(allTasks.map((task) => task.priority).filter(Boolean))
    ).map((priority) => ({
      value: priority,
      label: priority.charAt(0).toUpperCase() + priority.slice(1),
    }));

    // Extract unique collections
    const collections = Array.from(
      new Set(allTasks.map((task) => task.collection).filter(Boolean))
    ).map((collection) => ({
      value: collection,
      label: collection,
    }));

    // Extract unique location names
    const locations = Array.from(
      new Set(allTasks.map((task) => task.locationName).filter(Boolean))
    ).map((location) => ({
      value: location,
      label: location,
    }));

    // Extract unique tags
    const tags = Array.from(
      new Set(allTasks.flatMap((task) => task.tags || []).filter(Boolean))
    ).map((tag) => ({
      value: tag,
      label: tag,
    }));

    return { priorities, collections, locations, tags };
  };

  const { priorities, collections, locations, tags } =
    extractOptionsFromTasks();

  // Date/Time validation for start and end time
  const validateDateTimeSelection = (
    finalStartDate: Date | null,
    finalDueDate: Date | null,
    onSuccess: () => void
  ): boolean => {
    // If both dates are selected, ensure start is before end
    if (finalStartDate && finalDueDate && finalStartDate >= finalDueDate) {
      alert("Start time must be before end time");
      return false;
    }
    return true;
  };

  if (!showAdvancedFilters) return null;

  return (
    <div className="px-4 pb-4">
      <div className="p-4 bg-gradient-to-br from-gray-50/80 to-white/80 dark:from-gray-800/50 dark:to-gray-800/80 backdrop-blur-sm rounded-lg border border-gray-200/60 dark:border-gray-700/60 shadow-sm animate-in slide-in-from-top duration-200">
        {/* Filter Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
              Advanced Filters
            </h3>
          </div>
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
            >
              <X className="w-3 h-3" />
              Clear All
            </button>
          )}
        </div>

        {/* First Row - Priority, Collection, Tags */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Priority Filter - Multi-select */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
              <Flag className="w-3 h-3" />
              Priority
            </label>
            <CustomCombobox
              label=""
              value={filterPriority}
              options={[
                { value: "low", label: "🌱 Low" },
                { value: "medium", label: "📋 Medium" },
                { value: "high", label: "⚡ High" },
                { value: "urgent", label: "🔥 Urgent" },
                ...priorities.filter(
                  (p) => !["low", "medium", "high", "urgent"].includes(p.value)
                ),
              ]}
              onChange={(value) => {
                if (Array.isArray(value)) {
                  setFilterPriority(value);
                } else {
                  setFilterPriority(value ? [value] : []);
                }
              }}
              placeholder="Select priorities..."
              multiple={true}
              className="text-xs"
            />
          </div>

          {/* Collection Filter - Multi-select */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
              <FolderOpen className="w-3 h-3" />
              Collection
            </label>
            <CustomCombobox
              label=""
              value={filterCollection}
              options={collections}
              onChange={(value) => {
                if (Array.isArray(value)) {
                  setFilterCollection(value);
                } else {
                  setFilterCollection(value ? [value] : []);
                }
              }}
              placeholder="Select collections..."
              multiple={true}
              creatable={true}
              className="text-xs"
            />
          </div>

          {/* Tags Filter - Multi-select with creation */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
              <Tag className="w-3 h-3" />
              Tags
            </label>
            <CustomCombobox
              label=""
              value={filterTags}
              options={tags}
              onChange={(value) => {
                if (Array.isArray(value)) {
                  setFilterTags(value);
                } else {
                  setFilterTags(value ? [value] : []);
                }
              }}
              placeholder="Select tags..."
              multiple={true}
              creatable={true}
              className="text-xs"
            />
          </div>
        </div>

        {/* Second Row - Location and Time Range */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Location Filter - Searchable */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
              <MapPin className="w-3 h-3" />
              Location
            </label>
            <CustomCombobox
              label=""
              value={filterLocation}
              options={locations}
              onChange={(value) => {
                setFilterLocation(
                  Array.isArray(value) ? value[0] || "" : value || ""
                );
              }}
              placeholder="Search locations..."
              searchable={true}
              className="text-xs"
            />
          </div>

          {/* Start Time Filter */}
          {setFilterStartTime && (
            <div className="space-y-1.5">
              <ModernDateTimePicker
                selectedDate={filterStartTime}
                selectedTime={filterStartTime}
                onDateChange={(date) => {
                  if (date && filterStartTime) {
                    // Preserve time when changing date
                    const newDateTime = new Date(date);
                    newDateTime.setHours(
                      filterStartTime.getHours(),
                      filterStartTime.getMinutes(),
                      0,
                      0
                    );
                    setFilterStartTime(newDateTime);
                  } else {
                    setFilterStartTime(date);
                  }
                }}
                onTimeChange={(time) => {
                  if (time && filterStartTime) {
                    // Preserve date when changing time
                    const newDateTime = new Date(filterStartTime);
                    newDateTime.setHours(
                      time.getHours(),
                      time.getMinutes(),
                      0,
                      0
                    );
                    setFilterStartTime(newDateTime);
                  } else if (time) {
                    // If no date is set, use today with the selected time
                    const today = new Date();
                    today.setHours(time.getHours(), time.getMinutes(), 0, 0);
                    setFilterStartTime(today);
                  }
                }}
                onValidation={validateDateTimeSelection}
                label="Start Time"
                color="green"
                placeholder="Select start time..."
              />
            </div>
          )}

          {/* End Time Filter */}
          {setFilterEndTime && (
            <div className="space-y-1.5">
              <ModernDateTimePicker
                selectedDate={filterEndTime}
                selectedTime={filterEndTime}
                onDateChange={(date) => {
                  if (date && filterEndTime) {
                    // Preserve time when changing date
                    const newDateTime = new Date(date);
                    newDateTime.setHours(
                      filterEndTime.getHours(),
                      filterEndTime.getMinutes(),
                      0,
                      0
                    );
                    setFilterEndTime(newDateTime);
                  } else {
                    setFilterEndTime(date);
                  }
                }}
                onTimeChange={(time) => {
                  if (time && filterEndTime) {
                    // Preserve date when changing time
                    const newDateTime = new Date(filterEndTime);
                    newDateTime.setHours(
                      time.getHours(),
                      time.getMinutes(),
                      0,
                      0
                    );
                    setFilterEndTime(newDateTime);
                  } else if (time) {
                    // If no date is set, use today with the selected time
                    const today = new Date();
                    today.setHours(time.getHours(), time.getMinutes(), 0, 0);
                    setFilterEndTime(today);
                  }
                }}
                onValidation={validateDateTimeSelection}
                label="End Time"
                color="red"
                placeholder="Select end time..."
              />
            </div>
          )}
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200/60 dark:border-gray-700/60">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-medium">
              Active Filters:
            </div>
            <div className="flex flex-wrap gap-2">
              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded-md">
                  Search: "{searchTerm}"
                </span>
              )}
              {Array.isArray(filterPriority) && filterPriority.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 text-xs rounded-md">
                  Priority: {filterPriority.join(", ")}
                </span>
              )}
              {Array.isArray(filterCollection) &&
                filterCollection.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 text-xs rounded-md">
                    Collection: {filterCollection.join(", ")}
                  </span>
                )}
              {Array.isArray(filterTags) && filterTags.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs rounded-md">
                  Tags: {filterTags.join(", ")}
                </span>
              )}
              {filterLocation && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 text-xs rounded-md">
                  Location: {filterLocation}
                </span>
              )}
              {filterStartTime && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200 text-xs rounded-md">
                  Start: {filterStartTime.toLocaleDateString()}{" "}
                  {filterStartTime.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
              {filterEndTime && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-200 text-xs rounded-md">
                  End: {filterEndTime.toLocaleDateString()}{" "}
                  {filterEndTime.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterSection;
