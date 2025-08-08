import React, { useEffect, useState } from "react";
import Sidebar from "../../components/common/Sidebar";
import BookmarkGrid from "./components/BookmarkGrid";
import Header from "../../components/common/Header";
import { getBookmarks } from "../../../utils/api";

const BookmarkManagerPage: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        const tree = await getBookmarks();
        setBookmarks(tree[0]?.children || []);
      } catch (error) {
        console.error("Error fetching bookmarks:", error);
      }

      // Load last selected folder
      if (window.chrome?.storage?.local?.get) {
        window.chrome.storage.local.get("lastFolderId", (result) => {
          if (result?.lastFolderId) {
            setSelectedFolder(result.lastFolderId);
          }
          setLoading(false);
        });
      } else {
        const last = window.localStorage.getItem("lastFolderId");
        if (last) {
          setSelectedFolder(last);
        }
        setLoading(false);
      }
    };

    loadBookmarks();
  }, []);

  const handleSelectFolder = (id: string) => {
    setSelectedFolder(id);
    window.localStorage.setItem("lastFolderId", id);
    if (window.chrome?.storage?.local?.set) {
      window.chrome.storage.local.set({ lastFolderId: id });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar folders={bookmarks} onSelectFolder={handleSelectFolder} />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-4">
          <BookmarkGrid folderId={selectedFolder} folders={bookmarks} />
        </main>
      </div>
    </div>
  );
};

export default BookmarkManagerPage;
