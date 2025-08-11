import React, { useMemo } from "react";
import {
  Folder,
  Bookmark,
  FolderPlus,
  BookOpen,
  FolderHeart,
  FolderKey,
  FolderGit2,
  FolderSearch2,
  FolderOutput,
  FolderInput,
  FolderClock,
  FolderMinus,
  FolderCheck,
} from "lucide-react";

interface FolderNode {
  id: string;
  title: string;
  url?: string;
  children?: FolderNode[];
}

interface SidebarProps {
  folders: FolderNode[];
  onSelectFolder: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ folders, onSelectFolder }) => {
  const folderIcons = [
    Folder,
    Bookmark,
    FolderPlus,
    BookOpen,
    FolderHeart,
    FolderKey,
    FolderGit2,
    FolderSearch2,
    FolderOutput,
    FolderInput,
    FolderClock,
    FolderMinus,
    FolderCheck,
  ];

  const iconColors = [
    "text-blue-500",
    "text-green-500",
    "text-purple-500",
    "text-pink-500",
    "text-yellow-500",
    "text-indigo-500",
    "text-teal-500",
  ];

  const getRandomIcon = (id: string) => {
    const hash = id.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const Icon = folderIcons[hash % folderIcons.length];
    return Icon;
  };

  const getRandomColor = (id: string) => {
    const hash = id.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return iconColors[hash % iconColors.length];
  };

  const groups = useMemo((): FolderNode[] => {
    const result: FolderNode[] = [];
    // Add Bookmarks Bar
    const bar = folders.find((f) =>
      f.title.toLowerCase().includes("bookmarks bar")
    );
    if (bar) {
      result.push(bar);
    }
    // Add first-level folders under Other Bookmarks
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

  return (
    <div className="w-72 bg-sidebar-background border-r border-sidebar-border text-text-primary h-full flex flex-col transition-all duration-300">
      <div className="sidebar-header p-4 border-b border-sidebar-border bg-gradient-to-r from-primary/10 to-transparent">
        <h1 className="text-2xl font-bold text-primary">FlexBookmark</h1>
      </div>
      <div className="groups-list flex-1 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-gray-400 hover:scrollbar-thumb-gray-500">
        {groups.map((folder) => {
          const Icon = getRandomIcon(folder.id);
          const colorClass = getRandomColor(folder.id);
          return (
            <div
              key={folder.id}
              className="group-item flex items-center justify-between rounded-lg mb-2 cursor-pointer px-2 py-1 hover:bg-sidebar-hover hover:shadow-sm transition"
              onClick={() => onSelectFolder(folder.id)}
            >
              <div className="flex items-center gap-2">
                <div className={`p-1 rounded bg-primary/10 ${colorClass}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="truncate font-medium">{folder.title}</span>
              </div>
              <span className="text-xs bg-background-tertiary rounded-full px-2">
                {folder.children?.length || 0}
              </span>
            </div>
          );
        })}
      </div>
      <footer className="p-4 border-t border-sidebar-border">
        <button
          className="flex items-center justify-center gap-2 w-full py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition"
          onClick={() => onSelectFolder("")}
        >
          <FolderPlus className="w-5 h-5" />
          New Folder
        </button>
      </footer>
    </div>
  );
};

export default Sidebar;
