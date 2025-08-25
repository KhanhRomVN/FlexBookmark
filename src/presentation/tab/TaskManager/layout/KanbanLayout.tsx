// src/presentation/tab/TaskManager/layout/KanbanLayout.tsx
import React, { Dispatch, SetStateAction } from "react";
import type { Status } from "../../../types/task";
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
  onStatusTransition?: (
    taskId: string,
    fromStatus: Status,
    toStatus: Status
  ) => void;
}

const KanbanLayout: React.FC<KanbanLayoutProps> = ({
  filteredLists,
  onTaskClick,
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
    <div className="flex-1 p-6 overflow-hidden flex flex-col h-full">
      <div className="flex gap-6 flex-1 min-h-0 w-full overflow-x-auto">
        {filteredLists.map((list) => (
          <div key={list.id} className="flex-shrink-0 w-80 h-full">
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
          </div>
        ))}
      </div>
    </div>
  );
};

export default KanbanLayout;
