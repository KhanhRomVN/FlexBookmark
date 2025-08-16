// src/presentation/tab/TaskManager.tsx - Fixed version

import React, { useState, useEffect, useMemo } from "react";
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
  deleteGoogleTask,
  verifyTokenScopes,
} from "../../utils/GGTask";
import ChromeAuthManager from "../../utils/chromeAuth";
import type { AuthState } from "../../utils/chromeAuth";
import TaskDialog from "../components/TaskManager/TaskDialog";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Priority, Status, Task } from "../types/task";

const folders = [
  { id: "backlog", title: "Backlog", emoji: "📥" },
  { id: "todo", title: "To Do", emoji: "📋" },
  { id: "in-progress", title: "In Progress", emoji: "🚧" },
  { id: "done", title: "Done", emoji: "✅" },
  { id: "archive", title: "Archive", emoji: "🗄️" },
];

interface TaskList {
  id: string;
  title: string;
  emoji: string;
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [quickAddStatus, setQuickAddStatus] = useState<Status | null>(null);
  const [quickAddTitle, setQuickAddTitle] = useState("");

  const authManager = ChromeAuthManager.getInstance();

  // Helper function to get fresh token
  const getFreshToken = async (): Promise<string> => {
    try {
      // Clear any cached tokens first
      if (authState.user?.accessToken) {
        await new Promise<void>((resolve) =>
          chrome.identity.removeCachedAuthToken(
            { token: authState.user!.accessToken },
            () => resolve()
          )
        );
      }

      // Get new token with proper scopes
      const user = await authManager.login();
      return user.accessToken;
    } catch (error) {
      console.error("Failed to get fresh token:", error);
      throw error;
    }
  };

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

    try {
      let token = authState.user.accessToken;

      // Verify token has correct scopes
      const tokenInfo = await verifyTokenScopes(token);
      if (!tokenInfo || !tokenInfo.scope?.includes("tasks")) {
        console.log("Token missing tasks scope, getting fresh token...");
        token = await getFreshToken();
      }

      const groups = await fetchGoogleTaskGroups(token);
      setGroups(groups);
      if (groups.length > 0) {
        setActiveGroup(groups[0].id);
      }
    } catch (err) {
      console.error("Failed to load task groups:", err);
      setError("Failed to load task groups. Please try logging in again.");
    }
  };

  useEffect(() => {
    if (activeGroup && authState.user?.accessToken) {
      loadTasks();
    }
  }, [activeGroup]);

  const loadTasks = async () => {
    if (!authState.user || !activeGroup) return;

    setLoading(true);
    setError(null);

    try {
      let token = authState.user.accessToken;

      // Verify token before using
      const tokenInfo = await verifyTokenScopes(token);
      if (!tokenInfo || !tokenInfo.scope?.includes("tasks")) {
        token = await getFreshToken();
      }

      const tasks = await fetchGoogleTasks(token, activeGroup);

      const updatedLists = [...lists].map((list) => ({
        ...list,
        tasks: tasks.filter((task: Task) => task.status === list.id),
      }));

      setLists(updatedLists);
    } catch (err) {
      setError("Failed to load tasks. Please try logging in again.");
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
        const newTasks = arrayMove(activeList.tasks, activeIndex, activeIndex);
        const newLists = [...lists];
        newLists[activeListIndex].tasks = newTasks;
        setLists(newLists);
      } else {
        const movedTask = activeList.tasks[activeIndex];
        movedTask.status = overList.id as Status;

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

    try {
      let token = authState.user.accessToken;

      // Verify token before using
      const tokenInfo = await verifyTokenScopes(token);
      if (!tokenInfo || !tokenInfo.scope?.includes("tasks")) {
        token = await getFreshToken();
      }

      await updateGoogleTask(token, task.id, task, activeGroup);
    } catch (err) {
      console.error("Failed to save task:", err);
      setError("Failed to save task changes. Please try again.");
      // Reload tasks to revert UI changes
      loadTasks();
    }
  };

  const handleQuickAddTask = async (status: Status) => {
    if (!quickAddTitle.trim() || !authState.user || !activeGroup) return;

    const newTask: Task = {
      id: "",
      title: quickAddTitle,
      description: "",
      status,
      priority: "medium",
      startTime: null,
      endTime: null,
      completed: false,
      subtasks: [],
      attachments: [],
      tags: [],
      activityLog: [],
      prevTaskId: null,
      nextTaskId: null,
    };

    try {
      let token = authState.user.accessToken;

      // Always get fresh token for create operations to ensure proper scopes
      token = await getFreshToken();

      const createdTask = await createGoogleTask(token, newTask, activeGroup);

      const listIndex = lists.findIndex((list) => list.id === status);
      if (listIndex !== -1) {
        const newLists = [...lists];
        newLists[listIndex].tasks = [...newLists[listIndex].tasks, createdTask];
        setLists(newLists);
      }

      setSelectedTask(createdTask);
      setIsDialogOpen(true);
    } catch (err) {
      console.error("Failed to create task:", err);
      setError(
        "Failed to create task. Please check your permissions and try again."
      );
    } finally {
      setQuickAddTitle("");
      setQuickAddStatus(null);
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDialogOpen(true);
  };

  const handleCreateGroup = async () => {
    console.log("Create new group");
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!authState.user || !activeGroup) return;

    try {
      let token = authState.user.accessToken;

      // Verify token before using
      const tokenInfo = await verifyTokenScopes(token);
      if (!tokenInfo || !tokenInfo.scope?.includes("tasks")) {
        token = await getFreshToken();
      }

      await deleteGoogleTask(token, taskId, activeGroup);

      const newLists = lists.map((list) => ({
        ...list,
        tasks: list.tasks.filter((t) => t.id !== taskId),
      }));
      setLists(newLists);

      if (selectedTask && selectedTask.id === taskId) {
        setIsDialogOpen(false);
        setSelectedTask(null);
      }
    } catch (err) {
      console.error("Failed to delete task:", err);
      setError("Failed to delete task. Please try again.");
    }
  };

  const handleDuplicateTask = async (task: Task) => {
    if (!authState.user || !activeGroup) return;

    try {
      let token = authState.user.accessToken;

      // Verify token before using
      const tokenInfo = await verifyTokenScopes(token);
      if (!tokenInfo || !tokenInfo.scope?.includes("tasks")) {
        token = await getFreshToken();
      }

      const newTask = {
        ...task,
        id: "",
        title: task.title + " (Copy)",
        activityLog: [],
      };

      const createdTask = await createGoogleTask(token, newTask, activeGroup);

      const listIndex = lists.findIndex((list) => list.id === task.status);
      if (listIndex !== -1) {
        const newLists = [...lists];
        newLists[listIndex].tasks = [...newLists[listIndex].tasks, createdTask];
        setLists(newLists);
      }
    } catch (err) {
      console.error("Failed to duplicate task:", err);
      setError("Failed to duplicate task. Please try again.");
    }
  };

  const handleSaveTaskDetail = async (task: Task) => {
    if (!authState.user || !activeGroup) return;

    try {
      let token = authState.user.accessToken;

      // Verify token before using
      const tokenInfo = await verifyTokenScopes(token);
      if (!tokenInfo || !tokenInfo.scope?.includes("tasks")) {
        token = await getFreshToken();
      }

      if (task.id) {
        await updateGoogleTask(token, task.id, task, activeGroup);
        const newLists = lists.map((list) => ({
          ...list,
          tasks: list.tasks.map((t) => (t.id === task.id ? task : t)),
        }));
        setLists(newLists);
      } else {
        const createdTask = await createGoogleTask(token, task, activeGroup);
        const listIndex = lists.findIndex((list) => list.id === task.status);
        if (listIndex !== -1) {
          const newLists = [...lists];
          newLists[listIndex].tasks = [
            ...newLists[listIndex].tasks,
            createdTask,
          ];
          setLists(newLists);
        }
      }
      setIsDialogOpen(false);
      setSelectedTask(null);
    } catch (err) {
      console.error("Failed to save task:", err);
      setError("Failed to save task. Please try again.");
    }
  };

  const filteredLists = useMemo(() => {
    return lists.map((list) => ({
      ...list,
      tasks: list.tasks.filter((task) => {
        const matchesSearch =
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (task.description &&
            task.description.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesPriority =
          filterPriority === "all" || task.priority === filterPriority;
        const matchesStatus =
          filterStatus === "all" || task.status === filterStatus;
        return matchesSearch && matchesPriority && matchesStatus;
      }),
    }));
  }, [lists, searchTerm, filterPriority, filterStatus]);

  if (!authState.isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
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
    <div className="flex w-full min-h-screen bg-gray-100 dark:bg-gray-900">
      <TaskGroupSidebar
        groups={groups}
        activeGroup={activeGroup || ""}
        onSelectGroup={setActiveGroup}
        onCreateGroup={handleCreateGroup}
      />

      <div className="flex-1 w-full min-h-screen overflow-auto p-4 flex flex-col">
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-900 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className="mb-4 flex gap-4">
          <Input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-1/3"
          />
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="backlog">Backlog</SelectItem>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="done">Done</SelectItem>
              <SelectItem value="archive">Archive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DndContext
          collisionDetection={closestCorners}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 flex-1 min-h-0 w-full items-start">
            {filteredLists.map((list) => (
              <SortableContext
                key={list.id}
                items={list.tasks.map((t) => t.id)}
                strategy={horizontalListSortingStrategy}
              >
                <FolderCard
                  id={list.id}
                  title={list.title}
                  emoji={list.emoji}
                  tasks={list.tasks}
                  onTaskClick={handleTaskClick}
                  isAdding={quickAddStatus === list.id}
                  newTaskTitle={quickAddStatus === list.id ? quickAddTitle : ""}
                  setNewTaskTitle={setQuickAddTitle}
                  onAddTask={() => {
                    setQuickAddStatus(list.id as Status);
                    setQuickAddTitle("");
                  }}
                  onCancelAdd={() => setQuickAddStatus(null)}
                  onSubmitAdd={() => handleQuickAddTask(list.id as Status)}
                />
              </SortableContext>
            ))}
          </div>
        </DndContext>
      </div>

      <TaskDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        folders={folders}
        onSave={handleSaveTaskDetail}
        onDelete={handleDeleteTask}
        onDuplicate={handleDuplicateTask}
      />
    </div>
  );
};

export default TaskManager;
