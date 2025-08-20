import React, { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  FilterFn,
} from "@tanstack/react-table";
import { Task, Priority, Status } from "../../../types/task";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Search,
  Filter,
  MoreHorizontal,
  Calendar,
  Clock,
  Paperclip,
  CheckSquare,
  Flag,
  Tag,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";

interface TableLayoutProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onEditTask?: (task: Task) => void;
  onArchiveTask?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onToggleComplete?: (taskId: string) => void;
}

// Custom filter functions
const priorityFilterFn: FilterFn<Task> = (row, columnId, filterValue) => {
  if (!filterValue || filterValue === "all") return true;
  return row.getValue(columnId) === filterValue;
};

const statusFilterFn: FilterFn<Task> = (row, columnId, filterValue) => {
  if (!filterValue || filterValue === "all") return true;
  return row.getValue(columnId) === filterValue;
};

const tagsFilterFn: FilterFn<Task> = (row, columnId, filterValue) => {
  if (!filterValue) return true;
  const tags = row.getValue(columnId) as string[];
  return tags.some((tag) =>
    tag.toLowerCase().includes(filterValue.toLowerCase())
  );
};

const TableLayout: React.FC<TableLayoutProps> = ({
  tasks,
  onTaskClick,
  onEditTask,
  onArchiveTask,
  onDeleteTask,
  onToggleComplete,
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  // Priority badge component
  const PriorityBadge = ({ priority }: { priority: Priority }) => {
    const priorityConfig = {
      low: {
        color: "text-green-600 bg-green-100",
        icon: <Flag className="w-3 h-3" />,
      },
      medium: {
        color: "text-yellow-600 bg-yellow-100",
        icon: <Flag className="w-3 h-3" />,
      },
      high: {
        color: "text-orange-600 bg-orange-100",
        icon: <Flag className="w-3 h-3" />,
      },
      urgent: {
        color: "text-red-600 bg-red-100",
        icon: <Flag className="w-3 h-3" />,
      },
    };

    const config = priorityConfig[priority] || priorityConfig.medium;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium capitalize ${config.color}`}
      >
        {config.icon}
        {priority}
      </span>
    );
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: Status }) => {
    const statusConfig: Record<
      string,
      { label: string; color: string; emoji: string }
    > = {
      backlog: {
        label: "Backlog",
        color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
        emoji: "📥",
      },
      todo: {
        label: "To Do",
        color:
          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
        emoji: "📋",
      },
      "in-progress": {
        label: "In Progress",
        color:
          "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
        emoji: "🚧",
      },
      overdue: {
        label: "Overdue",
        color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
        emoji: "⏰",
      },
      done: {
        label: "Done",
        color:
          "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
        emoji: "✅",
      },
      archive: {
        label: "Archive",
        color:
          "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
        emoji: "🗄️",
      },
    };

    const config = statusConfig[status] || statusConfig.todo;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        <span>{config.emoji}</span>
        {config.label}
      </span>
    );
  };

  // Define columns
  const columns = useMemo<ColumnDef<Task>[]>(
    () => [
      {
        id: "selection",
        header: () => (
          <div className="flex items-center">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              onChange={(e) => {
                // Handle select all
              }}
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={row.getIsSelected()}
              onChange={row.getToggleSelectedHandler()}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
        ),
      },
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <div
            className="font-medium text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            onClick={() => onTaskClick(row.original)}
          >
            {row.getValue("title")}
          </div>
        ),
      },
      {
        accessorKey: "priority",
        header: "Priority",
        cell: ({ row }) => (
          <PriorityBadge priority={row.getValue("priority")} />
        ),
        filterFn: priorityFilterFn,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
        filterFn: statusFilterFn,
      },
      {
        accessorKey: "dueDate",
        header: "Due Date",
        cell: ({ row }) => {
          const dueDate = row.getValue("dueDate") as Date | null;
          const dueTime = row.original.dueTime;

          if (!dueDate) return null;

          return (
            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="w-3 h-3" />
              <span>
                {dueDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
              {dueTime && (
                <>
                  <Clock className="w-3 h-3 ml-1" />
                  <span>
                    {dueTime.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "tags",
        header: "Tags",
        cell: ({ row }) => {
          const tags = row.getValue("tags") as string[];
          if (!tags || tags.length === 0) return null;

          return (
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 2).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-xs"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
              {tags.length > 2 && (
                <span className="text-xs text-gray-500">
                  +{tags.length - 2}
                </span>
              )}
            </div>
          );
        },
        filterFn: tagsFilterFn,
      },
      {
        accessorKey: "subtasks",
        header: "Subtasks",
        cell: ({ row }) => {
          const subtasks = row.original.subtasks || [];
          const completed = subtasks.filter((st) => st.completed).length;
          const total = subtasks.length;

          if (total === 0) return null;

          return (
            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
              <CheckSquare className="w-3 h-3" />
              <span>
                {completed}/{total}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "attachments",
        header: "Attachments",
        cell: ({ row }) => {
          const attachments = row.original.attachments || [];
          if (attachments.length === 0) return null;

          return (
            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
              <Paperclip className="w-3 h-3" />
              <span>{attachments.length}</span>
            </div>
          );
        },
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const task = row.original;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onTaskClick(task)}>
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEditTask?.(task)}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleComplete?.(task.id)}>
                  {task.completed ? "Mark Incomplete" : "Mark Complete"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onArchiveTask?.(task.id)}>
                  Archive
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDeleteTask?.(task.id)}
                  className="text-red-600"
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [onTaskClick, onEditTask, onArchiveTask, onDeleteTask, onToggleComplete]
  );

  // Create table instance
  const table = useReactTable({
    data: tasks,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="w-full p-6">
      {/* Global Search */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search all tasks..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Column Filters */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={
              (table.getColumn("priority")?.getFilterValue() as string) || "all"
            }
            onChange={(e) =>
              table.getColumn("priority")?.setFilterValue(e.target.value)
            }
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>

          <select
            value={
              (table.getColumn("status")?.getFilterValue() as string) || "all"
            }
            onChange={(e) =>
              table.getColumn("status")?.setFilterValue(e.target.value)
            }
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="backlog">Backlog</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="overdue">Overdue</option>
            <option value="done">Done</option>
            <option value="archive">Archive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        {...{
                          className: header.column.getCanSort()
                            ? "cursor-pointer select-none flex items-center gap-1"
                            : "",
                          onClick: header.column.getToggleSortingHandler(),
                        }}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: <ChevronUp className="w-4 h-4" />,
                          desc: <ChevronDown className="w-4 h-4" />,
                        }[header.column.getIsSorted() as string] ??
                          (header.column.getCanSort() && (
                            <ChevronsUpDown className="w-4 h-4" />
                          ))}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Showing {table.getRowModel().rows.length} of {tasks.length} tasks
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>

          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>

          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="px-2 py-1 border rounded-md text-sm"
          >
            {[10, 20, 30, 40, 50].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                Show {pageSize}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default TableLayout;
