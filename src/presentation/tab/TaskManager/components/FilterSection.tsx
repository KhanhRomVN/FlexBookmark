import React from "react";
import {
  Filter,
  X,
  Flag,
  Tag,
  FolderOpen,
  MapPin,
  Clock,
  Calendar,
} from "lucide-react";
import CustomCombobox from "../../../components/common/CustomCombobox";
import ModernDateTimePicker from "../../../components/common/ModernDateTimePicker";

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
  dateFilterMode?: "any" | "start" | "due" | "actual" | "created";
  setDateFilterMode?: (
    mode: "any" | "start" | "due" | "actual" | "created"
  ) => void;
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
  dateFilterMode = "any",
  setDateFilterMode,
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

  // Date filter mode options
  const dateFilterModeOptions = [
    { value: "any", label: "🗓️ Any Date", description: "All task dates" },
    {
      value: "start",
      label: "🟢 Start Dates",
      description: "Start/actual start dates",
    },
    { value: "due", label: "🔴 Due Dates", description: "Due dates only" },
    {
      value: "actual",
      label: "✅ Actual Dates",
      description: "Completion dates",
    },
    {
      value: "created",
      label: "📅 Created Dates",
      description: "Creation/update dates",
    },
  ];

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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

        {/* Second Row - Location */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
        </div>

        {/* Third Row - Date/Time Range Filtering */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-200/60 dark:border-gray-700/60">
            <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
              Date Range Filter
            </h4>
          </div>

          {/* Date Filter Mode Selection */}
          {setDateFilterMode && (
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                <Calendar className="w-3 h-3" />
                Date Type
              </label>
              <CustomCombobox
                label=""
                value={dateFilterMode}
                options={dateFilterModeOptions}
                onChange={(value) => {
                  setDateFilterMode(
                    Array.isArray(value)
                      ? (value[0] as
                          | "any"
                          | "start"
                          | "due"
                          | "actual"
                          | "created") || "any"
                      : (value as
                          | "any"
                          | "start"
                          | "due"
                          | "actual"
                          | "created") || "any"
                  );
                }}
                placeholder="Select date type to filter..."
                className="text-xs"
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {
                  dateFilterModeOptions.find(
                    (opt) => opt.value === dateFilterMode
                  )?.description
                }
              </div>
            </div>
          )}

          {/* Date Range Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  onValidation={(startDate, endDate, onSuccess) => {
                    // Custom validation considering the end filter time
                    if (
                      startDate &&
                      filterEndTime &&
                      startDate >= filterEndTime
                    ) {
                      alert("Start time must be before end time");
                      return false;
                    }
                    onSuccess();
                    return true;
                  }}
                  label="Filter From"
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
                  onValidation={(startDate, endDate, onSuccess) => {
                    // Custom validation considering the start filter time
                    if (
                      endDate &&
                      filterStartTime &&
                      endDate <= filterStartTime
                    ) {
                      alert("End time must be after start time");
                      return false;
                    }
                    onSuccess();
                    return true;
                  }}
                  label="Filter To"
                  color="red"
                  placeholder="Select end time..."
                />
              </div>
            )}
          </div>

          {/* Date Range Summary */}
          {(filterStartTime || filterEndTime) && (
            <div className="p-3 bg-blue-50/80 dark:bg-blue-900/20 border border-blue-200/60 dark:border-blue-700/60 rounded-lg">
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <div className="font-medium mb-1">
                    Active Date Range Filter
                  </div>
                  <div className="space-y-1">
                    <div>
                      <span className="font-medium">Type:</span>{" "}
                      {
                        dateFilterModeOptions.find(
                          (opt) => opt.value === dateFilterMode
                        )?.label
                      }
                    </div>
                    {filterStartTime && (
                      <div>
                        <span className="font-medium">From:</span>{" "}
                        {filterStartTime.toLocaleString()}
                      </div>
                    )}
                    {filterEndTime && (
                      <div>
                        <span className="font-medium">To:</span>{" "}
                        {filterEndTime.toLocaleString()}
                      </div>
                    )}
                    {filterStartTime && filterEndTime && (
                      <div className="text-xs opacity-75">
                        Duration:{" "}
                        {Math.round(
                          (filterEndTime.getTime() -
                            filterStartTime.getTime()) /
                            (1000 * 60 * 60 * 24)
                        )}{" "}
                        days
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterSection;
