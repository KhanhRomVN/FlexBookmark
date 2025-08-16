import React, { useState, useEffect } from "react";
import { DndContext, DragEndEvent, closestCorners } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import FolderCard from "../components/TaskManager/FolderCard";
import TaskGroupSidebar from "../components/TaskManager/TaskGroupSidebar";
import {
  fetchGoogleTasks,
  updateGoogleTask,
  createGoogleTask,
  fetchGoogleTaskGroups,
} from "../../utils/GGTask";
import ChromeAuthManager from "../../utils/chromeAuth";
import { Task } from "./TaskAndEvent";
import type { AuthState } from "../../utils/chromeAuth";

const folders = [
  { id: "backlog", title: "Backlog" },
  { id: "todo", title: "To Do" },
  { id: "in-progress", title: "In Progress" },
  { id: "done", title: "Done" },
  { id: "archive", title: "Archive" },
];

interface TaskList {
  id: string;
  title: string;
  tasks: Task[];
}

const TaskManager: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null,
  });
  const [groups, setGroups] = useState<any[]>([]);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [lists, setLists] = useState<TaskList[]>(
    folders.map((f) => ({ ...f, tasks: [] }))
  );
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authManager = ChromeAuthManager.getInstance();

  useEffect(() => {
    const unsubscribe = authManager.subscribe((newState: any) => {
      setAuthState(newState);
    });

    authManager.initialize();

    return unsubscribe;
  }, [authManager]);

  useEffect(() => {
    if (authState.isAuthenticated && authState.user?.accessToken) {
      loadTaskGroups();
    }
  }, [authState]);

  const loadTaskGroups = async () => {
    if (!authState.user) return;
    const token = authState.user!.accessToken;
    try {
      const groups = await fetchGoogleTaskGroups(token);
      setGroups(groups);
      if (groups.length > 0) {
        setActiveGroup(groups[0].id);
      }
    } catch (err) {
      console.error("Failed to load task groups:", err);
      setError("Failed to load task groups");
    }
  };

  useEffect(() => {
    if (activeGroup && authState.user?.accessToken) {
      loadTasks();
    }
  }, [activeGroup]);

  const loadTasks = async () => {
    if (!authState.user || !activeGroup) return;
    const token = authState.user!.accessToken;

    setLoading(true);
    setError(null);

    try {
      const tasks = await fetchGoogleTasks(token, activeGroup);

      // Distribute tasks to folders
      const updatedLists = [...lists].map((list) => ({
        ...list,
        tasks: tasks.filter((task) => task.folder === list.id),
      }));

      setLists(updatedLists);
    } catch (err) {
      setError("Failed to load tasks");
      console.error("Task load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const activeListIndex = lists.findIndex((list) =>
        list.tasks.some((t) => t.id === active.id)
      );
      const overListIndex = lists.findIndex(
        (list) =>
          list.tasks.some((t) => t.id === over.id) || list.id === over.id
      );

      if (activeListIndex === -1 || overListIndex === -1) return;

      const activeList = lists[activeListIndex];
      const overList = lists[overListIndex];

      const activeIndex = activeList.tasks.findIndex((t) => t.id === active.id);

      if (activeListIndex === overListIndex) {
        // Same list: reorder within list
        const newTasks = arrayMove(activeList.tasks, activeIndex, activeIndex);
        const newLists = [...lists];
        newLists[activeListIndex].tasks = newTasks;
        setLists(newLists);
      } else {
        // Move task to another list
        const movedTask = activeList.tasks[activeIndex];
        movedTask.folder = overList.id;

        const newLists = [...lists];
        newLists[activeListIndex].tasks = activeList.tasks.filter(
          (t) => t.id !== active.id
        );
        newLists[overListIndex].tasks = [...overList.tasks, movedTask];

        setLists(newLists);
        saveTask(movedTask);
      }
    }
  };

  const saveTask = async (task: Task) => {
    if (!authState.user || !activeGroup) return;
    const token = authState.user!.accessToken;

    try {
      await updateGoogleTask(
        token,
        task.id,
        {
          ...task,
          folder: task.folder,
        },
        activeGroup
      );
    } catch (err) {
      console.error("Failed to save task:", err);
      setError("Failed to save task changes");
    }
  };

  const handleAddTask = async (folderId: string) => {
    if (!authState.user || !activeGroup) return;
    const token = authState.user!.accessToken;

    try {
      const newTask = await createGoogleTask(
        token,
        {
          title: "New Task",
          folder: folderId,
          completed: false,
        },
        activeGroup
      );

      const listIndex = lists.findIndex((list) => list.id === folderId);
      if (listIndex !== -1) {
        const newLists = [...lists];
        newLists[listIndex].tasks = [...newLists[listIndex].tasks, newTask];
        setLists(newLists);
      }
    } catch (err) {
      console.error("Failed to create task:", err);
      setError("Failed to create new task");
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  const handleCreateGroup = async () => {
    // Implement group creation logic here
    console.log("Create new group");
  };

  if (!authState.isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md">
          <h3 className="text-xl font-bold mb-4">Login Required</h3>
          <p className="mb-6">Please login with Google to manage your tasks.</p>
          <button
            onClick={() => authManager.login()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Login with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-100 dark:bg-gray-900">
      <TaskGroupSidebar
        groups={groups}
        activeGroup={activeGroup || ""}
        onSelectGroup={setActiveGroup}
        onCreateGroup={handleCreateGroup}
      />

      <div className="flex-1 overflow-x-auto p-4">
        <DndContext
          collisionDetection={closestCorners}
          onDragEnd={handleDragEnd}
        >
          <div className="flex space-x-4 h-full">
            {lists.map((list) => (
              <SortableContext
                key={list.id}
                items={list.tasks.map((t) => t.id)}
                strategy={horizontalListSortingStrategy}
              >
                <FolderCard
                  id={list.id}
                  title={list.title}
                  tasks={list.tasks}
                  onTaskClick={handleTaskClick}
                  onAddTask={() => handleAddTask(list.id)}
                />
              </SortableContext>
            ))}
          </div>
        </DndContext>
      </div>
    </div>
  );
};

export default TaskManager;
