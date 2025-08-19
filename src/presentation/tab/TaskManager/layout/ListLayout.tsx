import React from "react";
import { DndContext, closestCorners } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ListTaskCard } from "../../../components/TaskManager/ListStyle/ListTaskCard";
import type { Task } from "../../../types/task";

interface ListLayoutProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onDragEnd: (event: any) => void;
  onEditTask?: (task: Task) => void;
  onArchiveTask?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onToggleComplete?: (taskId: string) => void;
}

const ListLayout: React.FC<ListLayoutProps> = ({
  tasks,
  onTaskClick,
  onDragEnd,
  onEditTask,
  onArchiveTask,
  onDeleteTask,
  onToggleComplete,
}) => {
  return (
    <div className="flex-1 p-6">
      <DndContext collisionDetection={closestCorners} onDragEnd={onDragEnd}>
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              All Tasks
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {tasks.length} {tasks.length === 1 ? "task" : "tasks"} total
            </p>
          </div>

          {/* Task List */}
          <SortableContext
            items={tasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <ListTaskCard
                    key={task.id}
                    task={task}
                    onClick={() => onTaskClick(task)}
                    onEditTask={onEditTask}
                    onArchiveTask={onArchiveTask}
                    onDeleteTask={onDeleteTask}
                    onToggleComplete={onToggleComplete}
                  />
                ))
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-xl font-semibold mb-2">No tasks found</h3>
                  <p className="text-sm">
                    Create a new task or adjust your filters to see tasks here.
                  </p>
                </div>
              )}
            </div>
          </SortableContext>
        </div>
      </DndContext>
    </div>
  );
};

export default ListLayout;
