import React, { useEffect, useState, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { useDrop } from "react-dnd";
import type { DropTargetMonitor } from "react-dnd";
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
  // React-DnD drop on layout container
  const ItemTypes = { BOOKMARK: "bookmark" };
  const [{ isOver: isOverLayout }, dropRef] = useDrop<
    BookmarkNode,
    void,
    { isOver: boolean }
  >(
    () => ({
      accept: ItemTypes.BOOKMARK,
      collect: (monitor: DropTargetMonitor) => ({
        isOver: monitor.isOver(),
      }),
      drop: (data: any) => {
        chrome.bookmarks
          .move(data.id, {
            parentId: folderId || "0",
            index: items.length,
          })
          .then(() =>
            setItems((prev) => [
              ...prev,
              prev.find((item) => item.id === data.id)!,
            ])
          )
          .catch((err) => console.error(err));
        setDragged(null);
      },
    }),
    [folderId, items]
  );

  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const dragSource = useRef<{
    id: string;
    parentId: string;
    index: number;
  } | null>(null);

  // Callback when a bookmark is moved between folders
  const handleBookmarkMoved = (
    bookmarkId: string,
    fromParentId: string,
    toParentId: string
  ) => {
    // Remove bookmark from this folder's items if it was moved out
    if (fromParentId === folderId) {
      setItems((prev) => prev.filter((item) => item.id !== bookmarkId));
    }
  };

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

  // Handler to reorder items within the same container
  const handleItemDrop = async (
    targetId: string,
    position: "above" | "below"
  ) => {
    console.log(
      "[handleItemDrop] targetId=",
      targetId,
      "position=",
      position,
      "draggedId=",
      dragged?.id
    );
    if (!dragged) return;

    try {
      const targetIndex = items.findIndex((item) => item.id === targetId);
      if (targetIndex === -1) return;
      const newIndex = position === "above" ? targetIndex : targetIndex + 1;

      // Move via Chrome bookmarks API
      await chrome.bookmarks.move(dragged.id, {
        parentId: folderId || "0",
        index: newIndex,
      });

      // Optimistic UI update
      setItems((prev) => {
        const filtered = prev.filter((item) => item.id !== dragged.id);
        const newArr = [
          ...filtered.slice(0, newIndex),
          dragged,
          ...filtered.slice(newIndex),
        ];
        console.log(
          "[handleItemDrop] new items order:",
          newArr.map((i) => i.id)
        );
        return newArr;
      });
    } catch (err) {
      console.error("Reorder error:", err);
    }
  };

  // Handlers for individual item drag start/end
  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    item: BookmarkNode,
    index: number
  ) => {
    console.log(
      "Bookmark dragStart:",
      item.id,
      "at index",
      index,
      "types:",
      e.dataTransfer.types
    );
    // Determine actual parentId (support temp folder)
    let parentId = folderId || "0";
    if (item.id === "temp" || item.url) {
      parentId = "temp";
    }
    dragSource.current = { id: item.id, parentId, index };
    const payload = { ...item, parentId, index };
    e.dataTransfer.setData("application/json", JSON.stringify(payload));
    // also set plain text for broader drag support
    e.dataTransfer.setData("text/plain", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "move";
    setTimeout(() => setDragged(item), 0);
  };

  const handleDragEnd = () => {
    setDragged(null);
    setDropTarget(null);
  };

  // Callback when bookmark is moved between folders
  const onBookmarkMoved = (
    bookmarkId: string,
    fromParentId: string,
    toParentId: string
  ) => {
    setItems((prev) => {
      // recursively remove bookmark from matching folder node
      const removeFromFolder = (node: BookmarkNode): BookmarkNode => ({
        ...node,
        children: node.children
          ?.filter((child) => child.id !== bookmarkId)
          .map((child) => (child.children ? removeFromFolder(child) : child)),
      });

      return prev.map((node) =>
        node.id === fromParentId ? removeFromFolder(node) : node
      );
    });
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
      ref={dropRef}
      id="bookmark-grid"
      className="bookmark-grid"
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
              {column.map((item: BookmarkNode, index: number) => (
                <motion.div
                  layout
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e as any, item, index)}
                  onDragEnd={handleDragEnd}
                  className={`${
                    dragged?.id === item.id ? "opacity-50 scale-95" : ""
                  } transition-all duration-200`}
                >
                  {item.url ? (
                    <BookmarkCard
                      item={item}
                      parentId={folderId || "0"}
                      index={index}
                      depth={0}
                      isDropTarget={dropTarget === item.id}
                      onDropTargetChange={(id) => setDropTarget(id)}
                      onReorder={(dragIndex, hoverIndex) => {
                        void handleItemDrop(
                          item.id,
                          dragIndex < hoverIndex ? "below" : "above"
                        );
                      }}
                    />
                  ) : (
                    <FolderCard
                      folder={item}
                      index={index}
                      depth={0}
                      disableNesting
                      isDropTarget={dropTarget === item.id}
                      onDropTargetChange={(id) => setDropTarget(id)}
                      onReorder={(dragIndex, hoverIndex) =>
                        handleItemDrop(
                          item.id,
                          dragIndex < hoverIndex ? "below" : "above"
                        )
                      }
                      onBookmarkMoved={onBookmarkMoved}
                    />
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
