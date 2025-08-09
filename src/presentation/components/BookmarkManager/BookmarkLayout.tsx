import React, { useEffect, useState, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import FolderCard from "./FolderCard";
import BookmarkCard from "./BookmarkCard";
import EmptyState from "./EmptyState";
import GridHeader from "./GridHeader";

interface BookmarkNode {
  id: string;
  title: string;
  url?: string;
  children?: BookmarkNode[];
}

interface BookmarkLayoutProps {
  folderId: string | null;
  folders: BookmarkNode[];
}

/**
 * React implementation of bookmark grid with dynamic fetching,
 * depth-based layout (masonry at depth 0), and drag-and-drop support.
 */
const BookmarkLayout: React.FC<BookmarkLayoutProps> = ({
  folderId,
  folders,
}) => {
  const [items, setItems] = useState<BookmarkNode[]>([]);
  const [folder, setFolder] = useState<BookmarkNode | null>(null);
  const [dragged, setDragged] = useState<BookmarkNode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch children for selected folder whenever folderId changes
  useEffect(() => {
    if (!folderId) {
      setItems([]);
      setFolder(null);
      return;
    }
    (async () => {
      const list: chrome.bookmarks.BookmarkTreeNode[] = await new Promise(
        (res) => chrome.bookmarks.getChildren(folderId, res)
      );
      // attach grandchildren to folder nodes if any
      const withSubs = await Promise.all(
        list.map(async (node) => {
          if (!node.url) {
            const subs: chrome.bookmarks.BookmarkTreeNode[] = await new Promise(
              (r) => chrome.bookmarks.getChildren(node.id, r)
            );
            node.children = subs;
          }
          return node;
        })
      );
      const sel = folders.find((f) => f.id === folderId);
      setItems(withSubs as BookmarkNode[]);
      setFolder(
        sel
          ? { ...sel, children: withSubs as BookmarkNode[] }
          : { id: folderId, title: "", children: withSubs as BookmarkNode[] }
      );
    })();
  }, [folderId, folders]);

  // Setup drag-and-drop on grid container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
      container.classList.add("drop-target-highlight");
    };
    const onDragLeave = () => {
      container.classList.remove("drop-target-highlight");
    };
    const onDrop = async (e: DragEvent) => {
      e.preventDefault();
      container.classList.remove("drop-target-highlight");
      if (!dragged) return;
      const parentId = folderId || "0";
      try {
        await chrome.bookmarks.move(dragged.id, { parentId });
      } catch (err) {
        console.error("Error moving bookmark/folder:", err);
      }
      // refresh view
      const children: chrome.bookmarks.BookmarkTreeNode[] = await new Promise(
        (res) => chrome.bookmarks.getChildren(parentId, res)
      );
      setItems(children as BookmarkNode[]);
      setDragged(null);
    };

    container.addEventListener("dragover", onDragOver);
    container.addEventListener("dragleave", onDragLeave);
    container.addEventListener("drop", onDrop);
    return () => {
      container.removeEventListener("dragover", onDragOver);
      container.removeEventListener("dragleave", onDragLeave);
      container.removeEventListener("drop", onDrop);
    };
  }, [dragged, folderId]);

  // Handlers for individual item drag start/end
  const handleDragStart = (item: BookmarkNode) => {
    setDragged(item);
  };
  const handleDragEnd = () => {
    setDragged(null);
  };

  // If no folder selected show empty state
  if (!folderId) {
    return (
      <div className="flex items-center justify-center h-full">
        <EmptyState />
      </div>
    );
  }

  // group direct bookmarks under a temp "Bookmarks" folder at depth 0
  const foldersOnly = items.filter((i) => !i.url);
  const bookmarksOnly = items.filter((i) => !!i.url);
  const displayItems = [
    ...foldersOnly,
    ...(bookmarksOnly.length
      ? [
          {
            id: "temp",
            title: "Temp",
            children: bookmarksOnly,
          } as BookmarkNode,
        ]
      : []),
  ];
  const [columnCount, setColumnCount] = useState<number>(4);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateColumnCount = () => {
      const width = gridRef.current?.clientWidth || window.innerWidth;
      let count = 4;
      if (width < 640) count = 1;
      else if (width < 768) count = 2;
      else if (width < 1024) count = 3;
      setColumnCount(count);
    };
    updateColumnCount();
    window.addEventListener("resize", updateColumnCount);
    return () => window.removeEventListener("resize", updateColumnCount);
  }, []);

  const columns = useMemo<BookmarkNode[][]>(() => {
    const result: BookmarkNode[][] = Array.from(
      { length: columnCount },
      () => []
    );
    displayItems.forEach((item, index) => {
      result[index % columnCount].push(item);
    });
    return result;
  }, [displayItems, columnCount]);

  return (
    <div
      ref={containerRef}
      id="bookmark-grid"
      className="bookmark-grid drop-target"
      data-parent-id={folderId}
      data-depth="0"
    >
      <GridHeader folderId={folderId} folder={folder} depth={0} />

      {displayItems.length === 0 ? (
        <EmptyState />
      ) : (
        <div
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4"
        >
          {columns.map((column: BookmarkNode[], colIndex: number) => (
            <div key={colIndex} className="flex flex-col gap-4">
              {column.map((item: BookmarkNode) => (
                <motion.div
                  layout
                  key={item.id}
                  draggable
                  onDragStart={() => handleDragStart(item)}
                  onDragEnd={handleDragEnd}
                  className={`${dragged?.id === item.id ? "opacity-50" : ""}`}
                >
                  {item.url ? (
                    <BookmarkCard key={item.id} item={item} depth={0} />
                  ) : (
                    <FolderCard folder={item} depth={0} />
                  )}
                </motion.div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookmarkLayout;
