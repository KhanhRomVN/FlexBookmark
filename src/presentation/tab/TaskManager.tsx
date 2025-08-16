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
} from "../../utils/GGTask";
import ChromeAuthManager from "../../utils/chromeAuth";
import type { AuthState } from "../../utils/chromeAuth";
import TaskDialog from "../components/TaskManager/TaskDialog"; // Changed from TaskDrawer to TaskDialog
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Button } from "../components/ui/button";
import { Plus } from "lucide-react";
import { Priority, Status, Task } from "../types/task";

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
  const [isDialogOpen, setIsDialogOpen] = useState(false); // Changed from isDrawerOpen to isDialogOpen
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

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
        tasks: tasks.filter((task: Task) => task.status === list.id),
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
    const token = authState.user!.accessToken;

    try {
      await updateGoogleTask(token, task.id, task, activeGroup);
    } catch (err) {
      console.error("Failed to save task:", err);
      setError("Failed to save task changes");
    }
  };

  const handleAddTask = (status: Status) => {
    setSelectedTask({
      id: "",
      title: "New Task",
      description: "",
      status,
      priority: "medium",
      startTime: null,
      endTime: null,
      dueDate: null,
      assignee: "",
      completed: false,
      subtasks: [],
      attachments: [],
      tags: [],
      activityLog: [],
      prevTaskId: null,
      nextTaskId: null,
    });
    setIsDialogOpen(true);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDialogOpen(true);
  };

  const handleCreateGroup = async () => {
    // Implement group creation logic here
    console.log("Create new group");
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!authState.user || !activeGroup) return;
    const token = authState.user.accessToken;
    try {
      await deleteGoogleTask(token, taskId, activeGroup);
      // Remove the task from state
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
      setError("Failed to delete task");
    }
  };

  const handleDuplicateTask = async (task: Task) => {
    if (!authState.user || !activeGroup) return;
    const token = authState.user.accessToken;

    try {
      // Create a new task with the same data but a new ID
      const newTask = {
        ...task,
        id: "",
        title: task.title + " (Copy)",
        activityLog: [],
      };
      const createdTask = await createGoogleTask(token, newTask, activeGroup);
      // Add the new task to the same folder
      const listIndex = lists.findIndex((list) => list.id === task.status);
      if (listIndex !== -1) {
        const newLists = [...lists];
        newLists[listIndex].tasks = [...newLists[listIndex].tasks, createdTask];
        setLists(newLists);
      }
    } catch (err) {
      console.error("Failed to duplicate task:", err);
      setError("Failed to duplicate task");
    }
  };

  const handleSaveTaskDetail = async (task: Task) => {
    if (!authState.user || !activeGroup) return;
    const token = authState.user.accessToken;

    try {
      if (task.id) {
        // Update existing task
        await updateGoogleTask(token, task.id, task, activeGroup);
        // Update state
        const newLists = lists.map((list) => ({
          ...list,
          tasks: list.tasks.map((t) => (t.id === task.id ? task : t)),
        }));
        setLists(newLists);
      } else {
        // Create new task
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
      setError("Failed to save task");
    }
  };

  // Filter tasks based on search term and filters
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
          <Button onClick={() => handleAddTask("backlog")}>
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
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
                  tasks={list.tasks}
                  onTaskClick={handleTaskClick}
                  onAddTask={() => handleAddTask(list.id as Status)}
                />
              </SortableContext>
            ))}
          </div>
        </DndContext>
      </div>

      {/* Replaced TaskDrawer with TaskDialog */}
      <TaskDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        onSave={handleSaveTaskDetail}
        onDelete={handleDeleteTask}
        onDuplicate={handleDuplicateTask}
      />
    </div>
  );
};

export default TaskManager;
