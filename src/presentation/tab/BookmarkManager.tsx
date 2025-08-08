import React, { useEffect, useState } from "react";
import Sidebar from "../components/common/Sidebar";
import BookmarkGrid from "../components/BookmarkManager/BookmarkGrid";
import Header from "../components/common/Header";
import { getBookmarks } from "../../utils/api";

const BookmarkManagerPage: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    const loadBookmarks = async () => {
      try {
        const tree = await getBookmarks();
        console.debug("[BookmarkManager] fetched tree:", tree);
        const rootChildren = tree[0]?.children || [];
        console.debug("[BookmarkManager] rootChildren:", rootChildren);
        setBookmarks(rootChildren);

        const getStorage = async (): Promise<string | null> => {
          if (typeof chrome !== "undefined" && chrome.storage?.local) {
            return new Promise((resolve) => {
              chrome.storage.local.get("lastFolderId", (data) => {
                resolve(data.lastFolderId || null);
              });
            });
          } else {
            return localStorage.getItem("lastFolderId");
          }
        };

        const lastFolderId = await getStorage();
        console.debug(
          "[BookmarkManager] lastFolderId from storage:",
          lastFolderId
        );
        const initial = lastFolderId || rootChildren[0]?.id || null;
        console.debug("[BookmarkManager] initial selected folder:", initial);
        setSelectedFolder(initial);
      } catch (error) {
        console.error("Error fetching bookmarks:", error);
      } finally {
        setLoading(false);
      }
    };

    // Initial load and background-sync listener
    loadBookmarks();
    const runtime = typeof chrome !== "undefined" ? chrome.runtime : undefined;
    const messageHandler = (msg: any) => {
      if (msg?.action === "bookmarksUpdated") {
        loadBookmarks();
      }
    };
    if (runtime) {
      runtime.onMessage.addListener(messageHandler);
    }
    return () => {
      if (runtime) {
        runtime.onMessage.removeListener(messageHandler);
      }
    };
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
