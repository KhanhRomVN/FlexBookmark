// src/presentation/components/TaskManager/TableStyle/Table.tsx
import React from "react";
import { Task, Priority } from "../../../types/task";
import {
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Calendar,
  Tag,
  Users,
  Star,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import { Button } from "../../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";

// Types
interface User {
  id: string;
  name: string;
  avatar?: string | null;
  initials: string;
}

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

// Priority Badge Component
const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
  const priorityConfig = {
    low: {
      color:
        "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800",
      dot: "bg-emerald-500",
      label: "Low",
    },
    medium: {
      color:
        "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800",
      dot: "bg-amber-500",
      label: "Medium",
    },
    high: {
      color:
        "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-400 dark:border-orange-800",
      dot: "bg-orange-500",
      label: "High",
    },
    urgent: {
      color:
        "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800",
      dot: "bg-red-500",
      label: "Urgent",
    },
  };

  const config = priorityConfig[priority] || priorityConfig.medium;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}
    >
      <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </div>
  );
};

// Collection Badge Component
const CollectionBadge: React.FC<{ collection: string }> = ({ collection }) => {
  const collectionConfig: Record<string, { color: string; label: string }> = {
    dashboard: {
      color:
        "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-400 dark:border-violet-800",
      label: "Dashboard",
    },
    "mobile-app": {
      color:
        "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800",
      label: "Mobile App",
    },
    feature: {
      color:
        "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-400 dark:border-indigo-800",
      label: "Feature",
    },
    bug: {
      color:
        "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800",
      label: "Bug",
    },
    enhancement: {
      color:
        "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/50 dark:text-teal-400 dark:border-teal-800",
      label: "Enhancement",
    },
  };

  const config = collectionConfig[collection] || collectionConfig.dashboard;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}
    >
      {config.label}
    </span>
  );
};

// Status Badge Component
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusConfig: Record<string, { color: string; label: string }> = {
    todo: {
      color:
        "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-950/50 dark:text-slate-400 dark:border-slate-800",
      label: "To Do",
    },
    "in-progress": {
      color:
        "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800",
      label: "In Progress",
    },
    done: {
      color:
        "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-800",
      label: "Done",
    },
    backlog: {
      color:
        "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950/50 dark:text-gray-400 dark:border-gray-800",
      label: "Backlog",
    },
  };

  const config = statusConfig[status] || statusConfig.todo;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}
    >
      {config.label}
    </span>
  );
};

// User Avatar Component
const UserAvatar: React.FC<{ user: User; size?: "sm" | "md" | "lg" }> = ({
  user,
  size = "sm",
}) => {
  const sizeConfig = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
  };

  const sizeClass = sizeConfig[size];

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
      "bg-orange-500",
      "bg-red-500",
    ];

    const hash = name.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);

    return colors[Math.abs(hash) % colors.length];
  };

  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.name}
        className={`${sizeClass} rounded-full border-2 border-white dark:border-gray-800 object-cover shadow-sm`}
        title={user.name}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} ${getAvatarColor(
        user.name
      )} rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center font-medium text-white shadow-sm`}
      title={user.name}
    >
      {user.initials}
    </div>
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
    <div className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggle}
            className="flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg px-2 py-1 transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-500" />
            )}
            <span className="text-xl">{group.emoji}</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {group.label}
            </span>
            <span className="text-sm text-slate-500 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
              {group.tasks.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {group.tasks.length > 0 && (
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected && !allSelected;
                }}
                onChange={() => onSelectAll(group.tasks)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
              />
              Select all
            </label>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Table Headers - Only show when expanded and has tasks */}
      {isExpanded && group.tasks.length > 0 && (
        <div className="bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <div className="col-span-1 flex items-center">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected && !allSelected;
                }}
                onChange={() => onSelectAll(group.tasks)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            <div className="col-span-3 flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5" />
              Task Name
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <Tag className="w-3.5 h-3.5" />
              Collection
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              Dates
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <Star className="w-3.5 h-3.5" />
              Priority
            </div>
            <div className="col-span-1 flex items-center gap-2">
              <Users className="w-3.5 h-3.5" />
              Tags
            </div>
            <div className="col-span-1 flex items-center justify-center">
              <MoreHorizontal className="w-3.5 h-3.5" />
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
  const mockUsers = [
    { id: "1", name: "Alex", avatar: null, initials: "AL" },
    { id: "2", name: "David", avatar: null, initials: "DT" },
  ];

  const formatDateRange = () => {
    if (task.startDate && task.dueDate) {
      const start = new Date(task.startDate);
      const end = new Date(task.dueDate);
      return `${start.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })} - ${end.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`;
    } else if (task.dueDate) {
      const due = new Date(task.dueDate);
      return due.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    return "-";
  };

  return (
    <div className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 transition-colors">
      <div className="col-span-1 flex items-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
      </div>

      <div className="col-span-3 flex items-center">
        <button
          onClick={() => onTaskClick(task)}
          className="text-left font-medium text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
        >
          {task.title}
        </button>
      </div>

      <div className="col-span-2 flex items-center">
        <CollectionBadge collection={task.collection || "dashboard"} />
      </div>

      <div className="col-span-2 flex items-center">
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {formatDateRange()}
        </span>
      </div>

      <div className="col-span-2 flex items-center">
        <PriorityBadge priority={task.priority} />
      </div>

      <div className="col-span-1 flex items-center">
        <div className="flex flex-wrap gap-1">
          {task.tags?.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded"
            >
              {tag}
            </span>
          ))}
          {(task.tags?.length || 0) > 2 && (
            <span className="px-1.5 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
              +{(task.tags?.length || 0) - 2}
            </span>
          )}
        </div>
      </div>

      <div className="col-span-1 flex items-center justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <MoreHorizontal className="h-4 w-4" />
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
  );
};

// Main Table Component
const Table: React.FC<TableProps> = ({
  tasks,
  selectedTasks,
  globalSearch,
  groupStates,
  onGlobalSearchChange,
  onSelectTask,
  onSelectAll,
  onToggleGroup,
  onTaskClick,
  onEditTask,
  onArchiveTask,
  onDeleteTask,
  onToggleComplete,
  onArchiveSelected,
  onDeleteSelected,
}) => {
  // Group tasks by status
  const taskGroups: TaskGroup[] = [
    {
      status: "todo",
      label: "To-do",
      emoji: "📝",
      tasks: tasks.filter((task) => task.status === "todo"),
      isExpanded: groupStates["todo"] ?? true,
    },
    {
      status: "in-progress",
      label: "On Progress",
      emoji: "🚧",
      tasks: tasks.filter((task) => task.status === "in-progress"),
      isExpanded: groupStates["in-progress"] ?? true,
    },
    {
      status: "done",
      label: "In Review",
      emoji: "👁️",
      tasks: tasks.filter((task) => task.status === "done"),
      isExpanded: groupStates["done"] ?? true,
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
    <div className="flex-1 bg-white dark:bg-slate-900">
      <div className="space-y-0">
        {filteredGroups.map((group) => (
          <div
            key={group.status}
            className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden"
          >
            <GroupHeader
              group={group}
              isExpanded={group.isExpanded}
              onToggle={() => onToggleGroup(group.status)}
              selectedTasks={selectedTasks}
              onSelectAll={onSelectAll}
            />

            {/* Task Rows */}
            {group.isExpanded && (
              <div className="bg-white dark:bg-slate-900">
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
                  <div className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="text-4xl mb-2">{group.emoji}</div>
                    <div className="text-sm">No tasks in {group.label}</div>
                  </div>
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
