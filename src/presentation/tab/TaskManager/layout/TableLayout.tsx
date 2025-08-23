// src/presentation/tab/TaskManager/layout/TableLayout.tsx
import React, { useState } from "react";
import { Task } from "../../../types/task";
import Table from "../../../components/TaskManager/TableStyle/Table";

interface TableLayoutProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onEditTask?: (task: Task) => void;
  onArchiveTask?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onToggleComplete?: (taskId: string) => void;
}

const TableLayout: React.FC<TableLayoutProps> = ({
  tasks,
  onTaskClick,
  onEditTask,
  onArchiveTask,
  onDeleteTask,
  onToggleComplete,
}) => {
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [globalSearch] = useState(""); // Removed search from TableLayout as requested
  const [groupStates, setGroupStates] = useState<Record<string, boolean>>({
    todo: true,
    "in-progress": true,
    done: true,
  });

  const handleSelectTask = (taskId: string) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleSelectAll = (groupTasks: Task[]) => {
    const groupTaskIds = groupTasks.map((task) => task.id);
    const allSelected = groupTaskIds.every((id) => selectedTasks.includes(id));

    if (allSelected) {
      setSelectedTasks((prev) =>
        prev.filter((id) => !groupTaskIds.includes(id))
      );
    } else {
      setSelectedTasks((prev) => [...new Set([...prev, ...groupTaskIds])]);
    }
  };

  const handleToggleGroup = (status: string) => {
    setGroupStates((prev) => ({
      ...prev,
      [status]: !prev[status],
    }));
  };

  const handleArchiveSelected = () => {
    selectedTasks.forEach((taskId) => onArchiveTask?.(taskId));
    setSelectedTasks([]);
  };

  const handleDeleteSelected = () => {
    selectedTasks.forEach((taskId) => onDeleteTask?.(taskId));
    setSelectedTasks([]);
  };

  return (
    <div className="flex-1 p-6 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-6">
          <Table
            tasks={tasks}
            selectedTasks={selectedTasks}
            globalSearch={globalSearch}
            groupStates={groupStates}
            onGlobalSearchChange={() => {}}
            onSelectTask={handleSelectTask}
            onSelectAll={handleSelectAll}
            onToggleGroup={handleToggleGroup}
            onTaskClick={onTaskClick}
            onEditTask={onEditTask}
            onArchiveTask={onArchiveTask}
            onDeleteTask={onDeleteTask}
            onToggleComplete={onToggleComplete}
            onArchiveSelected={handleArchiveSelected}
            onDeleteSelected={handleDeleteSelected}
          />
        </div>
      </div>
    </div>
  );
};

export default TableLayout;
