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
  // Danh sách các icon có thể sử dụng
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

  // Hàm chọn icon ngẫu nhiên dựa trên ID thư mục
  const getRandomIcon = (id: string) => {
    const hash = id
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return folderIcons[hash % folderIcons.length];
  };

  // Màu sắc cho icon
  const iconColors = [
    "text-blue-500",
    "text-green-500",
    "text-purple-500",
    "text-pink-500",
    "text-yellow-500",
    "text-indigo-500",
    "text-teal-500",
  ];

  // Chọn màu ngẫu nhiên dựa trên ID
  const getRandomColor = (id: string) => {
    const hash = id
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return iconColors[hash % iconColors.length];
  };

  // Tạo groups với icon được chỉ định
  const groups = useMemo(() => {
    const result: FolderNode[] = [];
    folders.forEach((node) => {
      if (node.url) return;
      if (node.title === "Other bookmarks" && node.children) {
        node.children
          .filter((child: FolderNode) => !child.url)
          .forEach((child: FolderNode) => result.push(child));
      } else {
        result.push(node);
      }
    });
    return result;
  }, [folders]);

  return (
    <div className="w-72 bg-sidebar-background border-r border-sidebar-border text-text-primary h-full flex flex-col transition-all duration-300">
      <div className="sidebar-header p-4 border-b border-sidebar-border bg-gradient-to-r from-primary/10 to-transparent">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-primary">FlexBookmark</h1>
        </div>
      </div>

      <div className="groups-list flex-1 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent hover:scrollbar-thumb-gray-500">
        {groups.map((folder) => {
          const Icon = getRandomIcon(folder.id);
          const colorClass = getRandomColor(folder.id);

          return (
            <div
              key={folder.id}
              className="group-item flex items-center justify-between rounded-lg mb-2 cursor-pointer transition-all duration-200 hover:bg-sidebar-hover hover:shadow-sm hover:translate-x-1 border border-transparent hover:border-primary/20"
              onClick={() => onSelectFolder(folder.id)}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-primary/10 ${colorClass}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="group-name truncate font-medium">
                  {folder.title}
                </div>
              </div>
              <span className="group-count bg-background-tertiary rounded-full px-2 py-1 text-xs min-w-[28px] text-center font-medium">
                {folder.children?.length || 0}
              </span>
            </div>
          );
        })}
      </div>

      <footer className="sidebar-footer p-4 border-t border-sidebar-border">
        <button className="add-group-btn flex items-center justify-center gap-2 w-full py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-all duration-300 shadow hover:shadow-md">
          <FolderPlus className="w-5 h-5" />
          New Folder
        </button>
      </footer>
    </div>
  );
};

export default Sidebar;
