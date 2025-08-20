import React, { Dispatch, SetStateAction } from "react";
import type { Status } from "../../../types/task";
import { DndContext, closestCorners } from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import FolderCard from "../../../components/TaskManager/KanbanStyle/FolderCard";

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
}) => {
  return (
    <div className="flex-1 p-6">
      <DndContext collisionDetection={closestCorners} onDragEnd={onDragEnd}>
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
              />
            </SortableContext>
          ))}
        </div>
      </DndContext>
    </div>
  );
};

export default KanbanLayout;
