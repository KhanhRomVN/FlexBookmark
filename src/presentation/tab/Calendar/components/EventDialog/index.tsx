// src/presentation/components/Calendar/EventDialog/index.tsx
import React, { useState, useRef, useEffect } from "react";
import { X, Repeat, Bell, Clock } from "lucide-react";
import { CalendarEvent } from "../../types";
import {
  DateTimeSection,
  TagsSection,
  SubtasksSection,
  AttachmentsSection,
} from "./components";
import LocationSection from "./components/LocationSection";
import PrioritySection from "./components/PrioritySection";

interface EventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  onSave: (event: CalendarEvent) => void;
  isCreateMode?: boolean;
  initialDate?: Date;
  initialHour?: number;
  availableTasks?: CalendarEvent[];
  onTaskClick?: (taskId: string) => void;
}

// Recurrence options
const RECURRENCE_OPTIONS = [
  { value: "none", label: "No repeat" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "custom", label: "Custom..." },
];

// Reminder options (in minutes before event)
const REMINDER_OPTIONS = [
  { value: 0, label: "At time of event" },
  { value: 5, label: "5 minutes before" },
  { value: 10, label: "10 minutes before" },
  { value: 15, label: "15 minutes before" },
  { value: 30, label: "30 minutes before" },
  { value: 60, label: "1 hour before" },
  { value: 120, label: "2 hours before" },
  { value: 1440, label: "1 day before" },
  { value: 10080, label: "1 week before" },
];

const EventDialog: React.FC<EventDialogProps> = ({
  isOpen,
  onClose,
  event,
  onSave,
  isCreateMode = false,
  initialDate,
  initialHour,
  availableTasks = [],
  onTaskClick,
}) => {
  const [editedEvent, setEditedEvent] = useState<CalendarEvent | null>(event);

  // Toggle states
  const [showRecurrence, setShowRecurrence] = useState(false);
  const [showReminders, setShowReminders] = useState(false);

  // Recurrence state
  const [recurrence, setRecurrence] = useState({
    type: "none",
    interval: 1,
    endDate: null as Date | null,
    endAfterOccurrences: null as number | null,
  });

  // Reminders state
  const [reminders, setReminders] = useState<number[]>([]);

  // Form states for tags, subtasks, attachments
  const [newTag, setNewTag] = useState("");
  const [newSubtask, setNewSubtask] = useState("");
  const [newAttachment, setNewAttachment] = useState({
    title: "",
    url: "",
    type: "file" as "image" | "video" | "audio" | "file" | "other",
  });

  const summaryTextareaRef = useRef<HTMLTextAreaElement>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const autoResizeTextarea = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  };

  useEffect(() => {
    if (isCreateMode && initialDate && initialHour !== undefined && !event) {
      const startDate = new Date(initialDate);
      const actualHour = initialHour === 24 ? 0 : initialHour;

      // If hour is 24 (midnight), move to next day
      if (initialHour === 24) {
        startDate.setDate(startDate.getDate() + 1);
      }

      startDate.setHours(actualHour, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + 1);

      // Create start and end time objects for the new fields
      const startTime = new Date();
      startTime.setHours(actualHour, 0, 0, 0);

      const endTime = new Date();
      endTime.setHours((actualHour + 1) % 24, 0, 0, 0);

      const newEvent: CalendarEvent = {
        id: `temp-${Date.now()}`,
        summary: "",
        description: "",
        // Use new separate fields from calendar.ts
        startDate: new Date(
          startDate.getFullYear(),
          startDate.getMonth(),
          startDate.getDate()
        ),
        startTime: startTime,
        dueDate: new Date(
          endDate.getFullYear(),
          endDate.getMonth(),
          endDate.getDate()
        ),
        dueTime: endTime,
        actualStartDate: null,
        actualStartTime: null,
        actualEndDate: null,
        actualEndTime: null,
        location: "",
        locationName: "",
        locationAddress: "",
        locationCoordinates: "",
        priority: "medium",
        tags: [],
        subtasks: [],
        attachments: [],
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      setEditedEvent(newEvent);
    } else {
      setEditedEvent(event);

      // Initialize existing recurrence and reminders if available
      if (event?.recurrence) {
        setRecurrence(event.recurrence);
        setShowRecurrence(true);
      } else {
        setRecurrence({
          type: "none",
          interval: 1,
          endDate: null,
          endAfterOccurrences: null,
        });
        setShowRecurrence(false);
      }

      if (event?.reminders?.length) {
        setReminders(event.reminders);
        setShowReminders(true);
      } else {
        setReminders([]);
        setShowReminders(false);
      }
    }
  }, [event, isCreateMode, initialDate, initialHour]);

  // Auto-resize when content changes
  useEffect(() => {
    if (summaryTextareaRef.current)
      autoResizeTextarea(summaryTextareaRef.current);
  }, [editedEvent?.summary]);

  useEffect(() => {
    if (descriptionTextareaRef.current)
      autoResizeTextarea(descriptionTextareaRef.current);
  }, [editedEvent?.description]);

  if (!isOpen || !editedEvent) return null;

  const summaryCharCount = editedEvent?.summary?.length || 0;
  const summaryMaxChar = 1023;
  const isSummaryOverLimit = summaryCharCount > summaryMaxChar;

  // Validation checks - updated to use new date fields
  const hasValidSummary = editedEvent.summary?.trim() && !isSummaryOverLimit;
  const hasStartDateTime =
    editedEvent.startDate &&
    editedEvent.startDate instanceof Date &&
    !isNaN(editedEvent.startDate.getTime());

  // Main validation: require both summary and start datetime
  const canSave = hasValidSummary && hasStartDateTime;

  const handleChange = (field: keyof CalendarEvent, value: any) => {
    if (!editedEvent) return;

    // Handle special cases for date fields
    if (
      (field === "startDate" ||
        field === "dueDate" ||
        field === "actualStartDate" ||
        field === "actualEndDate") &&
      value &&
      !(value instanceof Date)
    ) {
      value = new Date(value);
    }

    setEditedEvent({ ...editedEvent, [field]: value });
  };

  // Tag handlers
  const handleAddTag = (tagToAdd?: string) => {
    const tag = tagToAdd || newTag.trim();
    if (tag && editedEvent && !editedEvent.tags?.includes(tag)) {
      const updatedTags = [...(editedEvent.tags || []), tag];
      handleChange("tags", updatedTags);
      if (!tagToAdd) setNewTag("");
    }
  };

  const handleDeleteTag = (tagToDelete: string) => {
    if (editedEvent?.tags) {
      const updatedTags = editedEvent.tags.filter((tag) => tag !== tagToDelete);
      handleChange("tags", updatedTags);
    }
  };

  // Subtask handlers
  const handleSubtaskChange = (id: string, field: string, value: any) => {
    if (editedEvent?.subtasks) {
      const updatedSubtasks = editedEvent.subtasks.map((subtask) =>
        subtask.id === id ? { ...subtask, [field]: value } : subtask
      );
      handleChange("subtasks", updatedSubtasks);
    }
  };

  const handleAddSubtask = (subtaskData?: Partial<any>) => {
    const subtaskTitle = subtaskData?.title || newSubtask.trim();
    if (subtaskTitle && editedEvent) {
      const newSubtaskObj = {
        id: `subtask-${Date.now()}`,
        title: subtaskTitle,
        description: subtaskData?.description || "",
        completed: false,
        linkedTaskId: subtaskData?.linkedTaskId || undefined,
        requiredCompleted: subtaskData?.requiredCompleted || false,
        ...subtaskData,
      };

      const updatedSubtasks = [...(editedEvent.subtasks || []), newSubtaskObj];
      handleChange("subtasks", updatedSubtasks);
      if (!subtaskData) setNewSubtask("");
    }
  };

  const handleDeleteSubtask = (id: string) => {
    if (editedEvent?.subtasks) {
      const updatedSubtasks = editedEvent.subtasks.filter(
        (subtask) => subtask.id !== id
      );
      handleChange("subtasks", updatedSubtasks);
    }
  };

  // Attachment handlers
  const handleAddAttachment = () => {
    if (newAttachment.title.trim() && newAttachment.url.trim() && editedEvent) {
      const attachmentObj = {
        id: `attachment-${Date.now()}`,
        title: newAttachment.title.trim(),
        url: newAttachment.url.trim(),
        type: newAttachment.type,
      };

      const updatedAttachments = [
        ...(editedEvent.attachments || []),
        attachmentObj,
      ];
      handleChange("attachments", updatedAttachments);
      setNewAttachment({ title: "", url: "", type: "file" });
    }
  };

  const handleDeleteAttachment = (id: string) => {
    if (editedEvent?.attachments) {
      const updatedAttachments = editedEvent.attachments.filter(
        (att) => att.id !== id
      );
      handleChange("attachments", updatedAttachments);
    }
  };

  // Reminder handlers
  const handleAddReminder = (minutes: number) => {
    if (!reminders.includes(minutes)) {
      const newReminders = [...reminders, minutes].sort((a, b) => a - b);
      setReminders(newReminders);
    }
  };

  const handleRemoveReminder = (minutes: number) => {
    setReminders(reminders.filter((r) => r !== minutes));
  };

  const handleSave = () => {
    if (!canSave) {
      // Focus on the first invalid field
      if (!editedEvent.summary?.trim()) {
        summaryTextareaRef.current?.focus();
      }
      return;
    }

    if (editedEvent) {
      // Ensure end date is after start date
      let finalEvent = { ...editedEvent };

      // Updated end date handling for new structure
      if (finalEvent.startDate && finalEvent.dueDate) {
        if (finalEvent.dueDate <= finalEvent.startDate) {
          const newEnd = new Date(finalEvent.startDate);
          newEnd.setDate(newEnd.getDate() + 1); // Add one day instead of one hour
          finalEvent.dueDate = newEnd;
        }
      } else if (finalEvent.startDate && !finalEvent.dueDate) {
        // If no due date, create one day after start
        const newEnd = new Date(finalEvent.startDate);
        newEnd.setDate(newEnd.getDate() + 1);
        finalEvent.dueDate = newEnd;
      }

      // Add recurrence and reminders to event
      finalEvent = {
        ...finalEvent,
        recurrence:
          showRecurrence && recurrence.type !== "none" ? recurrence : undefined,
        reminders:
          showReminders && reminders.length > 0 ? reminders : undefined,
      };

      // Ensure required fields are set
      if (!finalEvent.timeZone) {
        finalEvent.timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      }

      onSave(finalEvent);
    }
  };

  const formatTimeForDisplay = (hour: number) => {
    if (hour === 24) return "12:00 AM (next day)";
    const date = new Date();
    date.setHours(hour, 0);
    return date.toLocaleString("en-US", {
      hour: "numeric",
      hour12: true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md">
      <div className="w-full max-w-5xl max-h-[95vh] bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col shadow-xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {isCreateMode ? "Create Event" : "Edit Event"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-8">
          {/* Summary (Title) */}
          <div className="space-y-2">
            <div className="relative">
              <textarea
                ref={summaryTextareaRef}
                value={editedEvent.summary}
                onChange={(e) => handleChange("summary", e.target.value)}
                onInput={(e) => autoResizeTextarea(e.currentTarget)}
                placeholder="Event summary..."
                rows={1}
                className={`w-full text-3xl font-bold bg-transparent border-none focus:ring-0 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 resize-none outline-none ${
                  !hasValidSummary
                    ? "border-b-2 border-red-300 dark:border-red-600"
                    : ""
                }`}
                style={{
                  minHeight: "3.5rem",
                  lineHeight: "1.2",
                  overflow: "hidden",
                }}
                autoFocus={isCreateMode}
              />
              <div className="absolute -bottom-6 right-0 text-xs text-gray-500 dark:text-gray-400">
                <span className={isSummaryOverLimit ? "text-red-500" : ""}>
                  {summaryCharCount}/{summaryMaxChar}
                </span>
              </div>
            </div>
            {!hasValidSummary && (
              <p className="text-xs text-red-500 dark:text-red-400">
                {!editedEvent.summary?.trim()
                  ? "Event title is required"
                  : "Event title is too long"}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
              Description
            </h3>
            <textarea
              ref={descriptionTextareaRef}
              value={editedEvent.description || ""}
              onChange={(e) => handleChange("description", e.target.value)}
              onInput={(e) => autoResizeTextarea(e.currentTarget)}
              rows={4}
              className="w-full text-base bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ minHeight: "6rem", overflow: "hidden" }}
              placeholder="Add details, notes, or context..."
            />
          </div>

          {/* Main Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-8">
              {/* Priority */}
              <PrioritySection
                editedTask={editedEvent}
                handleChange={handleChange}
              />

              {/* Date & Time */}
              <DateTimeSection
                editedTask={editedEvent}
                handleChange={handleChange}
                isCreateMode={isCreateMode}
              />

              {/* Start Date/Time Requirement Notice */}
              {!hasStartDateTime && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-amber-800 dark:text-amber-200 flex items-center gap-2">
                    <Clock size={16} />
                    <strong>Required:</strong> Please set a start date and time
                    for this event.
                  </p>
                </div>
              )}

              {/* Location - FIXED: Changed editedTask to editedEvent */}
              <LocationSection
                editedEvent={editedEvent}
                handleChange={handleChange}
              />
            </div>

            <div className="space-y-8">
              {/* Tags */}
              <TagsSection
                editedEvent={editedEvent}
                handleChange={handleChange}
                newTag={newTag}
                setNewTag={setNewTag}
                handleAddTag={handleAddTag}
                handleDeleteTag={handleDeleteTag}
              />

              {/* Recurrence Toggle */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Repeat
                      size={18}
                      className="text-gray-600 dark:text-gray-400"
                    />
                    <h4 className="font-medium text-gray-800 dark:text-gray-200">
                      Recurrence
                    </h4>
                  </div>
                  <button
                    onClick={() => setShowRecurrence(!showRecurrence)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      showRecurrence
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {showRecurrence ? "Enabled" : "Disabled"}
                  </button>
                </div>

                {showRecurrence && (
                  <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Repeat
                      </label>
                      <select
                        value={recurrence.type}
                        onChange={(e) =>
                          setRecurrence({ ...recurrence, type: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {RECURRENCE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {recurrence.type !== "none" && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Every
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="1"
                              value={recurrence.interval}
                              onChange={(e) =>
                                setRecurrence({
                                  ...recurrence,
                                  interval: parseInt(e.target.value) || 1,
                                })
                              }
                              className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {recurrence.type === "daily"
                                ? "day(s)"
                                : recurrence.type === "weekly"
                                ? "week(s)"
                                : recurrence.type === "monthly"
                                ? "month(s)"
                                : "year(s)"}
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            End Date (optional)
                          </label>
                          <input
                            type="date"
                            value={
                              recurrence.endDate
                                ? recurrence.endDate.toISOString().split("T")[0]
                                : ""
                            }
                            onChange={(e) =>
                              setRecurrence({
                                ...recurrence,
                                endDate: e.target.value
                                  ? new Date(e.target.value)
                                  : null,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Reminders Toggle */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell
                      size={18}
                      className="text-gray-600 dark:text-gray-400"
                    />
                    <h4 className="font-medium text-gray-800 dark:text-gray-200">
                      Reminders
                    </h4>
                  </div>
                  <button
                    onClick={() => setShowReminders(!showReminders)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      showReminders
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {showReminders ? "Enabled" : "Disabled"}
                  </button>
                </div>

                {showReminders && (
                  <div className="space-y-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    {/* Current Reminders */}
                    {reminders.length > 0 && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Active Reminders
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {reminders.map((minutes) => {
                            const option = REMINDER_OPTIONS.find(
                              (opt) => opt.value === minutes
                            );
                            return (
                              <div
                                key={minutes}
                                className="flex items-center gap-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 text-sm"
                              >
                                <Clock size={12} />
                                <span>
                                  {option?.label || `${minutes} min before`}
                                </span>
                                <button
                                  onClick={() => handleRemoveReminder(minutes)}
                                  className="ml-1 text-red-500 hover:text-red-700 transition-colors"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Add New Reminder */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Add Reminder
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {REMINDER_OPTIONS.filter(
                          (opt) => !reminders.includes(opt.value)
                        ).map((option) => (
                          <button
                            key={option.value}
                            onClick={() => handleAddReminder(option.value)}
                            className="text-xs px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-gray-900 dark:text-gray-100"
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Full-width Sections */}
          <div className="space-y-8">
            {/* Subtasks */}
            <SubtasksSection
              editedEvent={editedEvent}
              newSubtask={newSubtask}
              setNewSubtask={setNewSubtask}
              handleSubtaskChange={handleSubtaskChange}
              handleAddSubtask={handleAddSubtask}
              handleDeleteSubtask={handleDeleteSubtask}
              availableTasks={availableTasks}
              onTaskClick={onTaskClick}
            />

            {/* Attachments */}
            <AttachmentsSection
              editedEvent={editedEvent}
              newAttachment={newAttachment}
              setNewAttachment={setNewAttachment}
              handleAddAttachment={handleAddAttachment}
              handleDeleteAttachment={handleDeleteAttachment}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {isCreateMode ? "Creating new event" : "Editing event"}
            {isCreateMode && initialDate && initialHour !== undefined && (
              <span className="ml-2 text-blue-600 dark:text-blue-400">
                • {initialDate.toLocaleDateString()} at{" "}
                {formatTimeForDisplay(initialHour)}
              </span>
            )}
            {/* Validation message */}
            {!canSave && (
              <div className="mt-2 text-red-500 dark:text-red-400">
                {!hasValidSummary && !hasStartDateTime
                  ? "Please enter event title and set start date/time"
                  : !hasValidSummary
                  ? "Please enter a valid event title"
                  : "Please set start date and time"}
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-gray-700 dark:text-gray-300 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                canSave
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg"
                  : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              }`}
            >
              {isCreateMode ? "Create Event" : "Save Event"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDialog;
