import React, { useMemo, useRef, useEffect, useState } from "react";
import { useTheme } from "../../providers/theme-provider";
import { Circle, FolderPlus, EllipsisVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface FolderNode {
  id: string;
  title: string;
  url?: string;
  children?: FolderNode[];
}

interface SidebarProps {
  folders: FolderNode[];
  onSelectFolder: (id: string) => void;
  /** Called to create a folder; should return a Promise<void> */
  onAddFolder: (title: string) => Promise<void>;
  /** Optional callback invoked after successful creation */
  onAddFolderComplete?: () => void;
}

interface SortableFolderItemProps {
  folder: FolderNode;
  getRandomColor: (id: string) => string;
  onSelectFolder: (id: string) => void;
}

const SortableFolderItem: React.FC<SortableFolderItemProps> = ({
  folder,
  getRandomColor,
  onSelectFolder,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: folder.id });
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const colorClass = getRandomColor(folder.id);
  const count = folder.children?.length || 0;

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className="group flex items-center justify-between rounded-lg mb-2 cursor-pointer px-2 py-1 hover:bg-sidebar-hover hover:shadow-sm transition"
      onClick={() => onSelectFolder(folder.id)}
    >
      <div className="flex items-center gap-2">
        <div className={`p-1 rounded bg-primary/10 ${colorClass}`}>
          <Circle className="w-3 h-3" />1
        </div>
        <span className="truncate font-medium text-base">{folder.title}</span>
      </div>
      <div ref={menuRef} className="relative w-6 h-6">
        {/* badge: folder count */}
        {!showMenu && (
          <span className="absolute inset-0 flex items-center justify-center bg-background-tertiary text-xs font-semibold rounded-sm border border-border-default transition-opacity duration-200 opacity-100 group-hover:opacity-0">
            {count}
          </span>
        )}
        {/* ellipsis button */}
        <button
          className="absolute inset-0 flex items-center justify-center p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-opacity duration-200 opacity-0 group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(true);
          }}
        >
          <EllipsisVertical size={16} />
        </button>
        {showMenu && (
          <div className="menu-dropdown absolute right-0 top-full mt-1 w-32 rounded-md shadow z-10 bg-dropdown-background border border-border-default">
            <button
              className="w-full px-3 py-2 text-left hover:bg-dropdown-itemHover focus:bg-dropdown-itemFocus transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                const newTitle = window.prompt(
                  "Enter new folder name",
                  folder.title
                );
                if (newTitle) {
                  chrome.bookmarks.update(folder.id, { title: newTitle });
                }
                setShowMenu(false);
              }}
            >
              Rename
            </button>
            <button
              className="w-full px-3 py-2 text-left hover:bg-dropdown-itemHover focus:bg-dropdown-itemFocus text-red-500 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete folder "${folder.title}"?`)) {
                  chrome.bookmarks.removeTree(folder.id);
                }
                setShowMenu(false);
              }}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({
  folders,
  onSelectFolder,
  onAddFolder,
  onAddFolderComplete,
}) => {
  const { theme } = useTheme();

  const iconColors = [
    "text-blue-500",
    "text-green-500",
    "text-purple-500",
    "text-pink-500",
    "text-yellow-500",
    "text-indigo-500",
    "text-teal-500",
  ];

  const getRandomColor = (id: string) => {
    const hash = id.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return iconColors[hash % iconColors.length];
  };

  const groups = useMemo((): FolderNode[] => {
    const result: FolderNode[] = [];
    const bar = folders.find((f) =>
      f.title.toLowerCase().includes("bookmarks bar")
    );
    if (bar) result.push(bar);
    const other = folders.find((f) =>
      f.title.toLowerCase().includes("other bookmarks")
    );
    if (other?.children) {
      other.children
        .filter((child) => !child.url)
        .forEach((child) => result.push(child));
    }
    return result;
  }, [folders]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const otherFolder = folders.find((f) =>
    f.title.toLowerCase().includes("other bookmarks")
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = groups.findIndex((g) => g.id === active.id);
    const newIndex = groups.findIndex((g) => g.id === over.id);
    if (otherFolder) {
      // account for Bookmarks Bar at index 0
      const offset = groups[0]?.id === otherFolder.id ? 0 : 1;
      const toIndex = newIndex - offset;
      try {
        await new Promise((res, rej) =>
          chrome.bookmarks.move(
            String(active.id),
            { parentId: otherFolder.id, index: toIndex },
            (node) => {
              if (chrome.runtime.lastError) rej(chrome.runtime.lastError);
              else res(node);
            }
          )
        );
        window.location.reload();
      } catch (err) {
        console.warn("[Sidebar] reorder error", err);
      }
    }
  };

  return (
    <div
      className={`w-72 bg-sidebar-background ${
        theme === "image" ? "backdrop-blur-sm" : ""
      } border-r border-border-default text-text-primary h-full flex flex-col transition-all duration-300`}
    >
      <div className="sidebar-header h-12 flex items-center px-4 border-b border-border-default bg-gradient-to-r from-primary/10 to-transparent">
        <h1 className="text-2xl font-bold text-primary">FlexBookmark</h1>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={groups.map((g) => g.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="groups-list flex-1 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-gray-400 hover:scrollbar-thumb-gray-500">
            {groups.map((folder) => (
              <SortableFolderItem
                key={folder.id}
                folder={folder}
                getRandomColor={getRandomColor}
                onSelectFolder={onSelectFolder}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <footer className="p-4 border-t border-border-default">
        <button
          className="flex items-center justify-center gap-2 w-full py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition"
          onClick={async () => {
            const title = window.prompt("Enter new folder title");
            if (title?.trim()) {
              await onAddFolder(title.trim());
              onAddFolderComplete?.();
            }
          }}
        >
          <FolderPlus className="w-5 h-5" />
          New Folder
        </button>
      </footer>
    </div>
  );
};

export default Sidebar;
