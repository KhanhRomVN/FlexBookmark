// src/presentation/components/TaskManager/TableStyle/Table.tsx
import React from "react";
import { Task, Priority } from "../../../types/task";
import {
  ChevronDown,
  ChevronRight,
  Paperclip,
  CheckSquare,
  Tags,
  MoreHorizontal,
  Clock,
  Star,
} from "lucide-react";
import { Button } from "../../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";

interface TaskGroup {
  status: string;
  label: string;
  emoji: string;
  tasks: Task[];
  isExpanded: boolean;
}

interface TableProps {
  tasks: Task[];
  selectedTasks: string[];
  globalSearch: string;
  groupStates: Record<string, boolean>;
  onGlobalSearchChange: (value: string) => void;
  onSelectTask: (taskId: string) => void;
  onSelectAll: (groupTasks: Task[]) => void;
  onToggleGroup: (status: string) => void;
  onTaskClick: (task: Task) => void;
  onEditTask?: (task: Task) => void;
  onArchiveTask?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onToggleComplete?: (taskId: string) => void;
  onArchiveSelected: () => void;
  onDeleteSelected: () => void;
}

// Priority Emoji Component
const getPriorityEmoji = (priority: Priority): string => {
  const priorityEmojis = {
    low: "🔵",
    medium: "🟡",
    high: "🟠",
    urgent: "🔴",
  };
  return priorityEmojis[priority] || "🔵";
};

// Priority Badge Component
const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
  const priorityConfig = {
    low: {
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
      label: "Low",
    },
    medium: {
      color:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
      label: "Medium",
    },
    high: {
      color:
        "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
      label: "High",
    },
    urgent: {
      color: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
      label: "Urgent",
    },
  };

  const config = priorityConfig[priority] || priorityConfig.medium;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}
    >
      {config.label}
    </span>
  );
};

// Collection Badge Component
const CollectionBadge: React.FC<{ collection: string }> = ({ collection }) => {
  const collectionConfig: Record<string, { color: string; label: string }> = {
    dashboard: {
      color:
        "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
      label: "Dashboard",
    },
    "mobile-app": {
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
      label: "Mobile App",
    },
    feature: {
      color:
        "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400",
      label: "Feature",
    },
    bug: {
      color: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
      label: "Bug",
    },
    enhancement: {
      color:
        "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
      label: "Enhancement",
    },
  };

  const config = collectionConfig[collection] || collectionConfig.dashboard;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}
    >
      {config.label}
    </span>
  );
};

// Group Header Component
const GroupHeader: React.FC<{
  group: TaskGroup;
  isExpanded: boolean;
  onToggle: () => void;
  selectedTasks: string[];
  onSelectAll: (tasks: Task[]) => void;
}> = ({ group, isExpanded, onToggle, selectedTasks, onSelectAll }) => {
  const allSelected =
    group.tasks.length > 0 &&
    group.tasks.every((task) => selectedTasks.includes(task.id));
  const someSelected = group.tasks.some((task) =>
    selectedTasks.includes(task.id)
  );

  return (
    <div className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      {/* Status Label - Full clickable area */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
            <span className="text-xl">{group.emoji}</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {group.label}
            </span>
            <span className="text-sm text-gray-500 bg-white dark:bg-gray-600 px-2 py-0.5 rounded-full">
              {group.tasks.length}
            </span>
          </div>
        </div>
      </button>

      {/* Table Headers - Always show when expanded */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <div className="col-span-1 flex items-center">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected && !allSelected;
                }}
                onChange={() => onSelectAll(group.tasks)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            <div className="col-span-3 flex items-center">Title</div>
            <div className="col-span-2 flex items-center">Description</div>
            <div className="col-span-2 flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1" />
              Estimation
            </div>
            <div className="col-span-2 flex items-center">Collection</div>
            <div className="col-span-1 flex items-center">
              <Star className="w-3.5 h-3.5 mr-1" />
              Priority
            </div>
            <div className="col-span-1 flex items-center justify-center">
              Other
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Table Row Component
const TableRow: React.FC<{
  task: Task;
  isSelected: boolean;
  onSelect: () => void;
  onTaskClick: (task: Task) => void;
  onEditTask?: (task: Task) => void;
  onArchiveTask?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onToggleComplete?: (taskId: string) => void;
}> = ({
  task,
  isSelected,
  onSelect,
  onTaskClick,
  onEditTask,
  onArchiveTask,
  onDeleteTask,
  onToggleComplete,
}) => {
  const formatDateRange = () => {
    const now = new Date();
    const currentYear = now.getFullYear();

    if (task.startDate && task.dueDate) {
      const start = new Date(task.startDate);
      const end = new Date(task.dueDate);

      const startFormat: Intl.DateTimeFormatOptions =
        start.getFullYear() !== currentYear
          ? {
              day: "numeric" as const,
              month: "numeric" as const,
              year: "numeric" as const,
            }
          : { day: "numeric" as const, month: "numeric" as const };

      const endFormat: Intl.DateTimeFormatOptions =
        end.getFullYear() !== currentYear
          ? {
              day: "numeric" as const,
              month: "numeric" as const,
              year: "numeric" as const,
            }
          : { day: "numeric" as const, month: "numeric" as const };

      const startTime = task.startTime
        ? new Date(task.startTime).toLocaleTimeString("en-US", {
            hour: "2-digit" as const,
            minute: "2-digit" as const,
          })
        : "";
      const startStr = startTime
        ? `${startTime} ${start.toLocaleDateString("en-US", startFormat)}`
        : start.toLocaleDateString("en-US", startFormat);

      return `${startStr} - ${end.toLocaleDateString("en-US", endFormat)}`;
    } else if (task.dueDate) {
      const due = new Date(task.dueDate);
      const dueFormat: Intl.DateTimeFormatOptions =
        due.getFullYear() !== currentYear
          ? {
              day: "numeric" as const,
              month: "numeric" as const,
              year: "numeric" as const,
            }
          : { day: "numeric" as const, month: "numeric" as const };

      const dueTime = task.dueTime
        ? new Date(task.dueTime).toLocaleTimeString("en-US", {
            hour: "2-digit" as const,
            minute: "2-digit" as const,
          })
        : "";

      return dueTime
        ? `${dueTime} ${due.toLocaleDateString("en-US", dueFormat)}`
        : due.toLocaleDateString("en-US", dueFormat);
    }
    return "null";
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "..";
  };

  const subtaskCount = task.subtasks?.length || 0;
  const attachmentCount = task.attachments?.length || 0;
  const tagCount = task.tags?.length || 0;

  return (
    <div className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 transition-colors">
      <div className="col-span-1 flex items-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </div>

      <div className="col-span-3 flex items-center">
        <button
          onClick={() => onTaskClick(task)}
          className="text-left flex items-center gap-2 font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
        >
          <span className="text-sm">{getPriorityEmoji(task.priority)}</span>
          <span className="truncate">{task.title}</span>
        </button>
      </div>

      <div className="col-span-2 flex items-center">
        <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
          {task.description ? truncateText(task.description, 50) : "-"}
        </span>
      </div>

      <div className="col-span-2 flex items-center">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {formatDateRange()}
        </span>
      </div>

      <div className="col-span-2 flex items-center">
        <CollectionBadge collection={task.collection || "dashboard"} />
      </div>

      <div className="col-span-1 flex items-center">
        <PriorityBadge priority={task.priority} />
      </div>

      <div className="col-span-1 flex items-center justify-center">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {subtaskCount > 0 && (
            <div className="flex items-center gap-1">
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{subtaskCount}</span>
            </div>
          )}
          {attachmentCount > 0 && (
            <div className="flex items-center gap-1">
              <Paperclip className="w-3.5 h-3.5" />
              <span>{attachmentCount}</span>
            </div>
          )}
          {tagCount > 0 && (
            <div className="flex items-center gap-1">
              <Tags className="w-3.5 h-3.5" />
              <span>{tagCount}</span>
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onTaskClick(task)}>
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEditTask?.(task)}>
                Edit Task
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleComplete?.(task.id)}>
                {task.completed ? "Mark Incomplete" : "Mark Complete"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onArchiveTask?.(task.id)}>
                Archive
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDeleteTask?.(task.id)}
                className="text-red-600 dark:text-red-400"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

// Empty State Component
const EmptyState: React.FC<{ group: TaskGroup }> = ({ group }) => (
  <div className="px-6 py-12 text-center">
    <div className="text-4xl mb-3 opacity-50">{group.emoji}</div>
    <div className="text-sm text-gray-500 dark:text-gray-400">
      No tasks in {group.label}
    </div>
  </div>
);

// Main Table Component
const Table: React.FC<TableProps> = ({
  tasks,
  selectedTasks,
  globalSearch,
  groupStates,
  onSelectTask,
  onSelectAll,
  onToggleGroup,
  onTaskClick,
  onEditTask,
  onArchiveTask,
  onDeleteTask,
  onToggleComplete,
}) => {
  // Group tasks by status
  const taskGroups: TaskGroup[] = [
    {
      status: "backlog",
      label: "Backlog",
      emoji: "📋",
      tasks: tasks.filter((task) => task.status === "backlog"),
      isExpanded: groupStates["backlog"] ?? true,
    },
    {
      status: "todo",
      label: "To Do",
      emoji: "📝",
      tasks: tasks.filter((task) => task.status === "todo"),
      isExpanded: groupStates["todo"] ?? true,
    },
    {
      status: "in-progress",
      label: "In Progress",
      emoji: "🚧",
      tasks: tasks.filter((task) => task.status === "in-progress"),
      isExpanded: groupStates["in-progress"] ?? true,
    },
    {
      status: "done",
      label: "Done",
      emoji: "✅",
      tasks: tasks.filter((task) => task.status === "done"),
      isExpanded: groupStates["done"] ?? true,
    },
    {
      status: "overdue",
      label: "Overdue",
      emoji: "⏰",
      tasks: tasks.filter((task) => task.status === "overdue"),
      isExpanded: groupStates["overdue"] ?? true,
    },
  ];

  // Filter tasks based on global search
  const filteredGroups = taskGroups.map((group) => ({
    ...group,
    tasks: group.tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(globalSearch.toLowerCase()) ||
        task.description?.toLowerCase().includes(globalSearch.toLowerCase()) ||
        task.tags?.some((tag) =>
          tag.toLowerCase().includes(globalSearch.toLowerCase())
        )
    ),
  }));

  return (
    <div className="w-full">
      <div className="space-y-6">
        {filteredGroups.map((group) => (
          <div
            key={group.status}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden"
          >
            <GroupHeader
              group={group}
              isExpanded={group.isExpanded}
              onToggle={() => onToggleGroup(group.status)}
              selectedTasks={selectedTasks}
              onSelectAll={onSelectAll}
            />

            {/* Task Rows or Empty State */}
            {group.isExpanded && (
              <div>
                {group.tasks.length > 0 ? (
                  group.tasks.map((task) => (
                    <TableRow
                      key={task.id}
                      task={task}
                      isSelected={selectedTasks.includes(task.id)}
                      onSelect={() => onSelectTask(task.id)}
                      onTaskClick={onTaskClick}
                      onEditTask={onEditTask}
                      onArchiveTask={onArchiveTask}
                      onDeleteTask={onDeleteTask}
                      onToggleComplete={onToggleComplete}
                    />
                  ))
                ) : (
                  <EmptyState group={group} />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Table;
