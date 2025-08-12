import React, { useEffect, useState } from "react";
import { getBookmarks } from "../../utils/api";
import MainLayout from "../components/layout/MainLayout";
import BookmarkLayout from "../components/BookmarkManager/BookmarkLayout";
import BookmarkSearchLayout from "../components/BookmarkManager/BookmarkSearchLayout";
import { useSearchStore } from "../store/searchStore";

interface BookmarkNode {
  parentId: string;
  id: string;
  title: string;
  url?: string;
  children?: BookmarkNode[];
}

const BookmarkManagerPage: React.FC = () => {
  const [folders, setFolders] = useState<BookmarkNode[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const searchQuery = useSearchStore((state) => state.searchQuery);
  const [editBookmark, setEditBookmark] = useState<BookmarkNode | null>(null);

  // Convert chrome.bookmarks.BookmarkTreeNode to our BookmarkNode
  const convertNode = (
    node: chrome.bookmarks.BookmarkTreeNode,
    parentId: string
  ): BookmarkNode => ({
    parentId,
    id: node.id,
    title: node.title,
    url: node.url,
    children: node.children
      ? node.children.map((child) => convertNode(child, node.id))
      : [],
  });

  useEffect(() => {
    const loadBookmarks = async () => {
      setLoading(true);
      try {
        const tree = await getBookmarks();
        const root = tree[0];
        const firstLevel = root.children || [];
        // Build only top-level folders for Sidebar
        const mapped = firstLevel.map((node) => convertNode(node, root.id));
        setFolders(mapped);

        // Restore last selected folder or default to first
        const lastFolderId =
          typeof chrome !== "undefined" && chrome.storage?.local
            ? await new Promise<string | null>((res) =>
                chrome.storage.local.get("lastFolderId", (data) =>
                  res(data.lastFolderId || null)
                )
              )
            : localStorage.getItem("lastFolderId");
        setSelectedFolder(lastFolderId || mapped[0]?.id || null);
      } catch (error) {
        console.error("Error fetching bookmarks:", error);
      } finally {
        setLoading(false);
      }
    };

    loadBookmarks();
    const runtime = typeof chrome !== "undefined" ? chrome.runtime : undefined;
    const handler = (msg: any) => {
      if (msg?.action === "bookmarksUpdated") {
        loadBookmarks();
      }
    };
    runtime?.onMessage.addListener(handler);
    return () => {
      runtime?.onMessage.removeListener(handler);
    };
  }, []);

  const handleSelectFolder = (id: string) => {
    setSelectedFolder(id);
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.set({ lastFolderId: id });
    } else {
      localStorage.setItem("lastFolderId", id);
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
    <MainLayout folders={folders} onSelectFolder={handleSelectFolder}>
      {searchQuery ? (
        <BookmarkSearchLayout
          searchQuery={searchQuery}
          folders={folders}
          onSelectFolder={handleSelectFolder}
          onBookmarkEdit={(item: BookmarkNode) => setEditBookmark(item)}
        />
      ) : (
        <BookmarkLayout folderId={selectedFolder} folders={folders} />
      )}
    </MainLayout>
  );
};

export default BookmarkManagerPage;
