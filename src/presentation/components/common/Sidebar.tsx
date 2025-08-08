import React from "react";

interface SidebarProps {
  folders: any[];
  onSelectFolder: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ folders, onSelectFolder }) => {
  return (
    <div className="sidebar w-64 bg-gray-800 text-white h-full flex flex-col">
      <div className="sidebar-header p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">FlexBookmark</h1>
      </div>

      <div className="groups-list flex-1 overflow-y-auto p-2">
        {folders
          .filter((folder) => !folder.url)
          .map((folder) => (
            <div
              key={folder.id}
              className="group-item flex items-center justify-between p-3 rounded mb-1 cursor-pointer hover:bg-gray-700"
              onClick={() => onSelectFolder(folder.id)}
            >
              <div className="group-name truncate">{folder.title}</div>
              <span className="group-count bg-gray-700 rounded-full px-2 py-1 text-xs">
                {folder.children?.length || 0}
              </span>
            </div>
          ))}
      </div>

      <footer className="sidebar-footer p-4 border-t border-gray-700">
        <button className="add-group-btn w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-md">
          + New Group
        </button>
      </footer>
    </div>
  );
};

export default Sidebar;
