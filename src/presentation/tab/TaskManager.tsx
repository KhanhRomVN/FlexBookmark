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
import {
  Search,
  Filter,
  RefreshCw,
  Zap,
  AlertCircle,
  CheckCircle,
  Globe,
} from "lucide-react";

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

    // Set default dates and times
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000); // Add 1 hour

    // Create start and end dates for the same day
    const startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0); // Start of day

    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999); // End of day

    const newTask: Task = {
      id: "",
      title: quickAddTitle,
      description: "",
      status,
      priority: "medium",
      startTime: now, // Current time
      endTime: oneHourLater, // Current time + 1 hour
      startDate: startDate, // Today's start
      endDate: endDate, // Today's end
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

      // do not auto-open dialog after quick-add
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

  // Move task from dialog
  const handleMove = (taskId: string, newStatus: Status) => {
    const taskToMove = lists
      .flatMap((list) => list.tasks)
      .find((t) => t.id === taskId);
    if (!taskToMove) return;
    const updatedTask: Task = { ...taskToMove, status: newStatus };
    // Update UI lists
    const updatedLists = lists.map((list) => ({
      ...list,
      tasks:
        list.id === newStatus
          ? [...list.tasks, updatedTask]
          : list.tasks.filter((t) => t.id !== taskId),
    }));
    setLists(updatedLists);
    // Persist change
    saveTask(updatedTask);
    // Close dialog
    setIsDialogOpen(false);
    setSelectedTask(null);
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

  // Calculate stats
  const totalTasks = lists.reduce((acc, list) => acc + list.tasks.length, 0);
  const completedTasks =
    lists.find((list) => list.id === "done")?.tasks.length || 0;
  const urgentTasks = lists.reduce(
    (acc, list) =>
      acc + list.tasks.filter((task) => task.priority === "urgent").length,
    0
  );

  if (!authState.isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center p-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 max-w-md transform hover:scale-105 transition-all duration-300">
          {/* Animated icon */}
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-600 rounded-full blur-xl opacity-30 animate-pulse"></div>
            <div className="relative p-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-2xl shadow-blue-500/25">
              <Globe
                className="w-12 h-12 text-white animate-spin"
                style={{ animationDuration: "3s" }}
              />
            </div>
          </div>

          <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
            Welcome to TaskFlow
          </h3>
          <p className="mb-8 text-gray-600 dark:text-gray-300 leading-relaxed">
            Connect with Google to sync and manage your tasks across all devices
          </p>
          <button
            onClick={() => authManager.login()}
            className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transform hover:scale-105 active:scale-95 transition-all duration-200 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
          >
            <span className="flex items-center gap-3">
              <Globe className="w-5 h-5 group-hover:rotate-12 transition-transform duration-200" />
              Connect with Google
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full min-h-screen bg-background">
      <TaskGroupSidebar
        groups={groups}
        activeGroup={activeGroup || ""}
        onSelectGroup={setActiveGroup}
        onCreateGroup={handleCreateGroup}
      />

      <div className="flex-1 w-full min-h-screen overflow-auto flex flex-col">
        {/* Enhanced Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border-default shadow-sm">
          <div className="p-6">
            {/* Stats Bar */}
            <div className="flex items-center gap-6 mb-6">
              <div className="flex items-center gap-2 text-sm">
                <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {totalTasks}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  total tasks
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <div className="p-2 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {completedTasks}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  completed
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <div className="p-2 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 rounded-lg">
                  <Zap className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {urgentTasks}
                </span>
                <span className="text-gray-600 dark:text-gray-400">urgent</span>
              </div>

              <div className="ml-auto flex items-center gap-3">
                <button
                  onClick={() => loadTasks()}
                  className="group p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                  disabled={loading}
                >
                  <RefreshCw
                    className={`w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-200 ${
                      loading ? "animate-spin" : ""
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200/60 dark:border-red-700/60 text-red-700 dark:text-red-400 rounded-xl shadow-sm animate-in slide-in-from-top duration-300">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1">{error}</span>
                  <button
                    onClick={() => setError(null)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 transition-colors duration-200"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Enhanced Search and Filter Bar */}
            <div className="flex gap-4 items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/60 dark:border-gray-700/60 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all duration-200"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <Select
                  value={filterPriority}
                  onValueChange={setFilterPriority}
                >
                  <SelectTrigger className="w-[140px] bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/60 dark:border-gray-700/60">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent className="backdrop-blur-sm">
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="low">🌱 Low</SelectItem>
                    <SelectItem value="medium">📋 Medium</SelectItem>
                    <SelectItem value="high">⚡ High</SelectItem>
                    <SelectItem value="urgent">🔥 Urgent</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[140px] bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/60 dark:border-gray-700/60">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="backdrop-blur-sm">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="backlog">📥 Backlog</SelectItem>
                    <SelectItem value="todo">📋 To Do</SelectItem>
                    <SelectItem value="in-progress">🚧 In Progress</SelectItem>
                    <SelectItem value="done">✅ Done</SelectItem>
                    <SelectItem value="archive">🗄️ Archive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <DndContext
            collisionDetection={closestCorners}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-6 flex-1 min-h-0 w-full items-start">
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
                    newTaskTitle={
                      quickAddStatus === list.id ? quickAddTitle : ""
                    }
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
        onMove={handleMove}
      />
    </div>
  );
};

export default TaskManager;
