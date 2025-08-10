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

  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const dragSource = useRef<{
    id: string;
    parentId: string;
    index: number;
  } | null>(null);

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

  // Container drag-and-drop handlers
  const handleContainerDragOver = (e: React.DragEvent) => {
    console.log(
      "[ContainerDragOver] types=",
      e.dataTransfer.types,
      "offset=",
      e.nativeEvent
    );
    e.preventDefault();
    setDropTarget("layout");
    e.dataTransfer.dropEffect = "move";
  };

  const handleContainerDragLeave = () => {
    console.log("[ContainerDragLeave] current dropTarget=", dropTarget);
    if (dropTarget === "layout") {
      setDropTarget(null);
    }
  };

  const handleContainerDrop = async (e: React.DragEvent) => {
    console.log(
      "[ContainerDrop] types=",
      e.dataTransfer.types,
      "rawJSON=",
      e.dataTransfer.getData("application/json")
    );
    e.preventDefault();
    setDropTarget(null);
    let raw = e.dataTransfer.getData("application/json");
    console.log("[ContainerDrop] raw data string=", raw);
    let data;
    try {
      data = JSON.parse(raw);
    } catch (err) {
      console.error("[ContainerDrop] JSON.parse error:", err, "raw=", raw);
      return;
    }
    // Only handle bookmarks at layout level, ignore folders
    if (!data.url) {
      console.log("[ContainerDrop] skipped, no URL in data=", data);
      return;
    }
    if (data.id === folderId) {
      console.log(
        "[ContainerDrop] skipped, dropped into same folder",
        folderId
      );
      return;
    }

    try {
      await chrome.bookmarks.move(data.id, {
        parentId: folderId || "0",
        index: data.index,
      });

      setItems((prev) => {
        const newItems = [...prev];
        if (
          dragSource.current &&
          dragSource.current.parentId === (folderId || "0")
        ) {
          newItems.splice(dragSource.current.index, 1);
        }
        if ((folderId || "0") === data.parentId && dragged) {
          newItems.splice(data.index, 0, dragged);
        }
        return newItems;
      });
    } catch (err) {
      console.error("Error moving item:", err);
    }
    setDragged(null);
  };

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
    const parentId = folderId || "0";
    dragSource.current = { id: item.id, parentId, index };
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ ...item, parentId, index })
    );
    // also set plain text for broader drag support
    e.dataTransfer.setData(
      "text/plain",
      JSON.stringify({ ...item, parentId, index })
    );
    e.dataTransfer.effectAllowed = "move";
    setTimeout(() => setDragged(item), 0);
  };

  const handleDragEnd = () => {
    setDragged(null);
    setDropTarget(null);
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
      className={`bookmark-grid ${
        dropTarget === "layout" ? "ring-2 ring-primary" : ""
      }`}
      data-parent-id={folderId}
      data-depth="0"
      onDragOver={handleContainerDragOver}
      onDragLeave={handleContainerDragLeave}
      onDrop={handleContainerDrop}
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
