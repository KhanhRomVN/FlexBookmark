import { useState, useEffect, useCallback } from "react";
import { BookmarkService } from "../services/BookmarkService";
import { BookmarkNode } from "../types";
import { useSearchStore } from "../../../store/searchStore";

export const useBookmark = () => {
    const [folders, setFolders] = useState<BookmarkNode[]>([]);
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const searchQuery = useSearchStore((state) => state.searchQuery);
    const [editBookmark, setEditBookmark] = useState<BookmarkNode | null>(null);

    const convertNode = useCallback(
        (node: chrome.bookmarks.BookmarkTreeNode, parentId: string): BookmarkNode => ({
            parentId,
            id: node.id,
            title: node.title,
            url: node.url,
            children: node.children
                ? node.children.map((child) => convertNode(child, node.id))
                : [],
        }),
        []
    );

    const loadBookmarks = useCallback(async () => {
        setLoading(true);
        try {
            const tree = await BookmarkService.getBookmarks();
            const root = tree[0];
            const firstLevel = root.children || [];
            const mapped = firstLevel.map((node) => convertNode(node, root.id));
            setFolders(mapped);

            const lastFolderId =
                typeof chrome !== "undefined" && chrome.storage?.local
                    ? await new Promise<string | null>((res) =>
                        chrome.storage.local.get("lastFolderId", (data) =>
                            res(data.lastFolderId || null)
                        )
                    )
                    : (localStorage.getItem("lastFolderId") as string | null);
            setSelectedFolder(lastFolderId || mapped[0]?.id || null);
        } catch (error) {
            console.error("Error fetching bookmarks:", error);
        } finally {
            setLoading(false);
        }
    }, [convertNode]);

    const handleSelectFolder = useCallback((id: string) => {
        setSelectedFolder(id);
        if (typeof chrome !== "undefined" && chrome.storage?.local) {
            chrome.storage.local.set({ lastFolderId: id });
        } else {
            localStorage.setItem("lastFolderId", id);
        }
    }, []);

    const handleAddFolder = useCallback(
        async (title: string) => {
            const other = folders.find((f) =>
                f.title.toLowerCase().includes("other bookmarks")
            );
            if (!other) {
                alert("Could not find 'Other Bookmarks' folder to add to.");
                return;
            }
            try {
                await BookmarkService.createFolder({ parentId: other.id, title });
                await loadBookmarks();
            } catch (error) {
                console.error("Error creating folder:", error);
                alert("Failed to create folder");
            }
        },
        [folders, loadBookmarks]
    );

    useEffect(() => {
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
    }, [loadBookmarks]);

    return {
        folders,
        selectedFolder,
        loading,
        searchQuery,
        editBookmark,
        onSelectFolder: handleSelectFolder,
        onAddFolder: handleAddFolder,
        onBookmarkEdit: setEditBookmark,
    };
};