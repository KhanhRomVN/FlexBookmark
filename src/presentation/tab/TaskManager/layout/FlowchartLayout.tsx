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
import type { Task, Status } from "../../../types/task";
import CustomNode from "../../../components/TaskManager/FlowchartStyle/CustomNode";
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
}

// Node types for React Flow
const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

const FlowchartLayout: React.FC<FlowchartLayoutProps> = ({
  filteredLists,
  onTaskClick,
}) => {
  const [viewMode, setViewMode] = useState<"hierarchical" | "network">(
    "hierarchical"
  );

  // Transform tasks to nodes and edges for React Flow
  const { nodes, edges } = useMemo(() => {
    const allTasks = filteredLists.flatMap((list) => list.tasks);

    // Create nodes from tasks
    const taskNodes: Node[] = allTasks.map((task, index) => ({
      id: task.id,
      type: "custom",
      position: {
        x:
          viewMode === "hierarchical"
            ? (folders.findIndex((f) => f.id === task.status) + 1) * 250
            : Math.random() * 800,
        y:
          viewMode === "hierarchical"
            ? (index % 10) * 100 + 50
            : Math.random() * 600,
      },
      data: {
        ...task,
        onClick: () => onTaskClick(task),
      },
    }));

    // Create edges based on task relationships (simplified - in a real app, you'd use actual relationships)
    const taskEdges: Edge[] = [];

    // Create connections between tasks in sequence (for demo purposes)
    for (let i = 0; i < allTasks.length - 1; i++) {
      // Only connect some tasks to avoid clutter
      if (Math.random() > 0.7) continue;

      taskEdges.push({
        id: `e${allTasks[i].id}-${allTasks[i + 1].id}`,
        source: allTasks[i].id,
        target: allTasks[i + 1].id,
        type: "smoothstep",
      });
    }

    // Add connections from backlog to other tasks
    const backlogTasks = allTasks.filter((t) => t.status === "backlog");
    const otherTasks = allTasks.filter((t) => t.status !== "backlog");

    if (backlogTasks.length > 0 && otherTasks.length > 0) {
      // Connect some backlog tasks to other tasks
      backlogTasks.slice(0, 3).forEach((backlogTask) => {
        otherTasks.slice(0, 2).forEach((otherTask) => {
          if (Math.random() > 0.5) {
            taskEdges.push({
              id: `e${backlogTask.id}-${otherTask.id}`,
              source: backlogTask.id,
              target: otherTask.id,
              type: "smoothstep",
            });
          }
        });
      });
    }

    return { nodes: taskNodes, edges: taskEdges };
  }, [filteredLists, onTaskClick, viewMode]);

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

// Folder definitions for layout
const folders = [
  { id: "backlog", title: "Backlog", emoji: "📥", priority: 1 },
  { id: "todo", title: "To Do", emoji: "📋", priority: 2 },
  { id: "in-progress", title: "In Progress", emoji: "🚧", priority: 3 },
  { id: "overdue", title: "Overdue", emoji: "⏰", priority: 4 },
  { id: "done", title: "Done", emoji: "✅", priority: 0 },
  { id: "archive", title: "Archive", emoji: "🗄️", priority: -1 },
];

export default FlowchartLayout;
