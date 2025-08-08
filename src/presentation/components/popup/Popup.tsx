import React, { useState, useEffect } from "react";
import PopupForm from "./PopupForm";
import FolderTree from "./FolderTree";
import { getBookmarks } from "../../utils/api";

const Popup: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  useEffect(() => {
    const loadBookmarks = async () => {
      const tree = await getBookmarks();
      setBookmarks(tree[0]?.children || []);
    };
    loadBookmarks();
  }, []);

  return (
    <div className="popup-container w-[300px] p-4 bg-white dark:bg-gray-800 text-gray-800 dark:text-white">
      <h1 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span className="text-blue-500">✏️</span>
        Add Bookmark
      </h1>

      <PopupForm folders={bookmarks} selectedFolder={selectedFolder} />

      <div className="mt-4">
        <h2 className="text-sm font-semibold mb-2 flex items-center gap-2">
          <span className="text-blue-500">📁</span>
          Select Folder
        </h2>
        <FolderTree folders={bookmarks} onSelectFolder={setSelectedFolder} />
      </div>
    </div>
  );
};

export default Popup;
