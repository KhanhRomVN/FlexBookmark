// src/presentation/tab/TaskManager/layout/FlowchartLayout.tsx

import React, { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  NodeTypes,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { Task, Status } from "../types/task";
import TaskNode from "../components/FlowchartStyle/TaskNode";
import CollectionNode from "../components/FlowchartStyle/CollectionNode";
import type { TaskNodeData, CollectionNodeData } from "../types/nodeTypes";
import { FolderTree, Workflow } from "lucide-react";

interface FlowchartLayoutProps {
  filteredLists: any[];
  onTaskClick: (task: any) => void;
  onDragEnd: (event: any) => void;
  quickAddStatus: Status | null;
  setQuickAddStatus: React.Dispatch<React.SetStateAction<Status | null>>;
  quickAddTitle: string;
  setQuickAddTitle: React.Dispatch<React.SetStateAction<string>>;
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

// Create properly typed node types with explicit type casting
const nodeTypes: NodeTypes = {
  task: TaskNode as React.ComponentType<any>,
  collection: CollectionNode as React.ComponentType<any>,
};

// Helper function to convert string/number/Date to Date
const toDate = (
  value: string | number | Date | null | undefined
): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  return new Date(value);
};

const FlowchartLayout: React.FC<FlowchartLayoutProps> = ({
  filteredLists,
  onTaskClick,
}) => {
  const [viewMode, setViewMode] = useState<"hierarchical" | "network">(
    "hierarchical"
  );

  // Helper function to get node ID for a task (either individual task node or collection node)
  const getNodeIdForTask = useCallback(
    (task: Task, tasksByCollection: Record<string, Task[]>): string | null => {
      // Check if task is in a collection with 2+ tasks
      if (
        task.collection &&
        tasksByCollection[task.collection] &&
        tasksByCollection[task.collection].length >= 2
      ) {
        return `collection-${task.collection}`;
      }
      // Otherwise it's an individual task node
      return task.id;
    },
    []
  );

  // Transform tasks to nodes and edges for React Flow
  const { nodes, edges } = useMemo(() => {
    const allTasks = filteredLists.flatMap((list) => list.tasks);

    // Group tasks by collection
    const tasksByCollection: Record<string, Task[]> = {};
    const tasksWithoutCollection: Task[] = [];

    allTasks.forEach((task) => {
      if (task.collection && task.collection.trim()) {
        if (!tasksByCollection[task.collection]) {
          tasksByCollection[task.collection] = [];
        }
        tasksByCollection[task.collection].push(task);
      } else {
        tasksWithoutCollection.push(task);
      }
    });

    const taskNodes: Node<TaskNodeData | CollectionNodeData>[] = [];
    const taskEdges: Edge[] = [];

    let nodeYPosition = 50;
    let nodeXPosition = 100;

    // Create collection nodes for collections with 2 or more tasks
    Object.entries(tasksByCollection).forEach(([collection, tasks]) => {
      if (tasks.length >= 2) {
        // Create collection node
        const collectionNodeId = `collection-${collection}`;
        const collectionNodeData: CollectionNodeData = {
          collection,
          tasks,
          onClick: onTaskClick,
        };

        taskNodes.push({
          id: collectionNodeId,
          type: "collection",
          position: {
            x:
              viewMode === "hierarchical" ? nodeXPosition : Math.random() * 800,
            y:
              viewMode === "hierarchical" ? nodeYPosition : Math.random() * 600,
          },
          data: collectionNodeData,
        });

        if (viewMode === "hierarchical") {
          nodeYPosition += 200; // Space between collection nodes
          if (nodeYPosition > 800) {
            nodeYPosition = 50;
            nodeXPosition += 450;
          }
        }
      } else {
        // If collection has only 1 task, treat it as individual task
        tasksWithoutCollection.push(...tasks);
      }
    });

    // Create individual task nodes for tasks without collection or in collections with < 2 tasks
    tasksWithoutCollection.forEach((task, taskIndex) => {
      const taskNodeData: TaskNodeData = {
        id: task.id,
        title: task.title,
        status: task.status,
        collection: task.collection,
        priority: task.priority,
        dueDate: toDate(task.dueDate),
        dueTime: toDate(task.dueTime),
        subtasks: task.subtasks,
        attachments: task.attachments,
        description: task.description,
        tags: task.tags,
        createdAt: toDate(task.createdAt),
        updatedAt: toDate(task.updatedAt),
        onClick: () => onTaskClick(task),
      };

      taskNodes.push({
        id: task.id,
        type: "task",
        position: {
          x:
            viewMode === "hierarchical"
              ? nodeXPosition + (taskIndex % 3) * 280 // Arrange in grid
              : Math.random() * 800,
          y:
            viewMode === "hierarchical"
              ? nodeYPosition + Math.floor(taskIndex / 3) * 150
              : Math.random() * 600,
        },
        data: taskNodeData,
      });
    });

    // Create edges based on actual linkedTaskId relationships
    allTasks.forEach((task) => {
      if (task.subtasks) {
        task.subtasks.forEach((subtask: { linkedTaskId: any; title: any }) => {
          if (subtask.linkedTaskId) {
            const linkedTask = allTasks.find(
              (t) => t.id === subtask.linkedTaskId
            );
            if (linkedTask) {
              // Find if tasks are in collection nodes or individual nodes
              const sourceNodeId = getNodeIdForTask(task, tasksByCollection);
              const targetNodeId = getNodeIdForTask(
                linkedTask,
                tasksByCollection
              );

              if (
                sourceNodeId &&
                targetNodeId &&
                sourceNodeId !== targetNodeId
              ) {
                taskEdges.push({
                  id: `e${task.id}-${linkedTask.id}`,
                  source: sourceNodeId,
                  target: targetNodeId,
                  type: "smoothstep",
                  label: subtask.title,
                  style: { stroke: "#3b82f6", strokeWidth: 2 },
                  labelStyle: {
                    fontSize: 10,
                    backgroundColor: "rgba(255, 255, 255, 0.8)",
                    padding: "2px 4px",
                    borderRadius: "4px",
                  },
                });
              }
            }
          }
        });
      }
    });

    return { nodes: taskNodes, edges: taskEdges };
  }, [filteredLists, onTaskClick, viewMode, getNodeIdForTask]);

  const [reactFlowNodes, setReactFlowNodes, onNodesChange] =
    useNodesState(nodes);
  const [reactFlowEdges, setReactFlowEdges, onEdgesChange] =
    useEdgesState(edges);

  const onConnect = useCallback(
    (params: Connection) => setReactFlowEdges((eds) => addEdge(params, eds)),
    [setReactFlowEdges]
  );

  // Update nodes and edges when the source data changes
  React.useEffect(() => {
    setReactFlowNodes(nodes);
    setReactFlowEdges(edges);
  }, [nodes, edges, setReactFlowNodes, setReactFlowEdges]);

  const handleLayoutChange = () => {
    setViewMode((prev) =>
      prev === "hierarchical" ? "network" : "hierarchical"
    );
  };

  return (
    <div className="flex-1 p-6 h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Workflow className="w-6 h-6" />
          Task Flowchart
        </h2>
        <button
          onClick={handleLayoutChange}
          className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg flex items-center gap-2 hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors"
        >
          <FolderTree className="w-4 h-4" />
          {viewMode === "hierarchical" ? "Network View" : "Hierarchical View"}
        </button>
      </div>

      <div className="h-[calc(100vh-200px)] border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
        <ReactFlow
          nodes={reactFlowNodes}
          edges={reactFlowEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          className="bg-gray-50 dark:bg-gray-900"
        >
          <Background />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              if (node.type === "collection") {
                return "#6366f1"; // Indigo for collection nodes
              }
              switch (node.data.status) {
                case "backlog":
                  return "#6b7280";
                case "todo":
                  return "#3b82f6";
                case "in-progress":
                  return "#f59e0b";
                case "overdue":
                  return "#ef4444";
                case "done":
                  return "#10b981";
                case "archive":
                  return "#8b5cf6";
                default:
                  return "#ccc";
              }
            }}
          />
          <Panel position="top-right" className="flex gap-2">
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-md text-sm">
              <div className="font-medium mb-2">Status Legend</div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                  <span>Collection</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                  <span>Backlog</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span>To Do</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span>In Progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>Overdue</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Done</span>
                </div>
              </div>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
};

export default FlowchartLayout;
