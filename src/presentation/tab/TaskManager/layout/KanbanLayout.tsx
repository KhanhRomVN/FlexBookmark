import React, { Dispatch, SetStateAction, useState } from "react";
import type { Status } from "../../../types/task";
import type { Task } from "../../../types/task";
import {
  DndContext,
  closestCorners,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import FolderCard from "../../../components/TaskManager/KanbanStyle/FolderCard";
import TaskCard from "../../../components/TaskManager/KanbanStyle/TaskCard";

interface KanbanLayoutProps {
  filteredLists: any[];
  onTaskClick: (task: any) => void;
  onDragEnd: (event: any) => void;
  quickAddStatus: Status | null;
  setQuickAddStatus: Dispatch<SetStateAction<Status | null>>;
  quickAddTitle: string;
  setQuickAddTitle: Dispatch<SetStateAction<string>>;
  handleQuickAddTask: (status: Status) => Promise<void>;
  onArchiveTasks?: (folderId: string) => void;
  onDeleteTasks?: (folderId: string) => void;
  onSortTasks?: (folderId: string, sortType: string) => void;
  // Add new prop for status transitions
  onStatusTransition?: (
    taskId: string,
    fromStatus: Status,
    toStatus: Status
  ) => void;
}

const KanbanLayout: React.FC<KanbanLayoutProps> = ({
  filteredLists,
  onTaskClick,
  onDragEnd,
  quickAddStatus,
  setQuickAddStatus,
  quickAddTitle,
  setQuickAddTitle,
  handleQuickAddTask,
  onArchiveTasks,
  onDeleteTasks,
  onSortTasks,
  onStatusTransition,
}) => {
  // State for drag overlay
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Configure sensors for better drag performance
  const mouseSensor = useSensor(MouseSensor, {
    // Require the mouse to move by 10 pixels before activating
    activationConstraint: {
      distance: 5,
    },
  });

  const touchSensor = useSensor(TouchSensor, {
    // Press delay of 250ms, with tolerance of 5px of movement
    activationConstraint: {
      delay: 150,
      tolerance: 5,
    },
  });

  const keyboardSensor = useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  });

  const sensors = useSensors(mouseSensor, touchSensor, keyboardSensor);

  // Map folder IDs to status values
  const folderToStatusMap: Record<string, Status> = {
    backlog: "backlog",
    todo: "todo",
    "in-progress": "in-progress",
    done: "done",
    overdue: "overdue",
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;

    // Find the active task
    const taskId = active.id as string;
    const task = filteredLists
      .flatMap((list) => list.tasks)
      .find((task) => task.id === taskId);

    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Clear the active task
    setActiveTask(null);

    if (!over) {
      // Call original onDragEnd for normal behavior
      onDragEnd(event);
      return;
    }

    const taskId = active.id as string;
    const targetFolderId = over.id as string;

    // Find the task being dragged to get its current status
    const sourceTask = filteredLists
      .flatMap((list) => list.tasks)
      .find((task) => task.id === taskId);

    if (!sourceTask) {
      onDragEnd(event);
      return;
    }

    const currentStatus = sourceTask.status as Status;
    const targetStatus = folderToStatusMap[targetFolderId];

    // If dropping on a different status folder, trigger status transition
    if (targetStatus && targetStatus !== currentStatus) {
      console.log("Cross-folder drop detected:", {
        taskId,
        fromStatus: currentStatus,
        toStatus: targetStatus,
        targetFolder: targetFolderId,
      });

      if (onStatusTransition) {
        onStatusTransition(taskId, currentStatus, targetStatus);
        return; // Don't call original onDragEnd to avoid double processing
      }
    }

    // Otherwise, use original drag behavior (reordering within same folder)
    onDragEnd(event);
  };

  return (
    <div className="flex-1 p-6">
      <DndContext
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        sensors={sensors}
      >
        <div className="flex gap-6 flex-1 min-h-0 w-full items-start">
          {filteredLists.map((list) => (
            <SortableContext
              key={list.id}
              items={list.tasks.map((t: any) => t.id)}
              strategy={horizontalListSortingStrategy}
            >
              <FolderCard
                id={list.id}
                title={list.title}
                emoji={list.emoji}
                tasks={list.tasks}
                onTaskClick={onTaskClick}
                isAdding={quickAddStatus === list.id}
                newTaskTitle={quickAddStatus === list.id ? quickAddTitle : ""}
                setNewTaskTitle={setQuickAddTitle}
                onAddTask={() => {
                  setQuickAddStatus(list.id);
                  setQuickAddTitle("");
                }}
                onCancelAdd={() => setQuickAddStatus(null)}
                onSubmitAdd={() => handleQuickAddTask(list.id)}
                onArchiveTasks={onArchiveTasks}
                onDeleteTasks={onDeleteTasks}
                onSortTasks={onSortTasks}
                // Add visual feedback for valid drop targets
                acceptsDrops={true}
                targetStatus={folderToStatusMap[list.id]}
              />
            </SortableContext>
          ))}
        </div>

        {/* Drag Overlay - This renders the dragged item globally */}
        <DragOverlay
          style={{
            // Ensure high z-index so it appears above everything
            zIndex: 9999,
          }}
        >
          {activeTask ? (
            <div className="transform rotate-3 scale-105 shadow-2xl">
              <TaskCard
                task={activeTask}
                onClick={() => {}} // Disabled during drag
                // Remove drag handlers from overlay
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default KanbanLayout;
