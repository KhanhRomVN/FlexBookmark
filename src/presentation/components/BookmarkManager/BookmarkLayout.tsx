import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import FolderCard from "./FolderCard";
import BookmarkCard from "./BookmarkCard";
import EmptyState from "./EmptyState";
import GridHeader from "./GridHeader";
import { restrictToParentElement } from "@dnd-kit/modifiers";

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

const BookmarkLayout: React.FC<BookmarkLayoutProps> = ({
  folderId,
  folders,
}) => {
  const [items, setItems] = useState<BookmarkNode[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [folder, setFolder] = useState<BookmarkNode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [columnCount, setColumnCount] = useState<number>(4);
  const gridRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch children for selected folder
  useEffect(() => {
    if (!folderId) {
      setItems([]);
      setFolder(null);
      return;
    }

    (async () => {
      try {
        const list: chrome.bookmarks.BookmarkTreeNode[] = await new Promise(
          (res) => chrome.bookmarks.getChildren(folderId, res)
        );

        const withSubs = await Promise.all(
          list.map(async (node) => {
            if (!node.url && node.children?.length === 0) {
              const subs: chrome.bookmarks.BookmarkTreeNode[] =
                await new Promise((r) =>
                  chrome.bookmarks.getChildren(node.id, r)
                );
              return { ...node, children: subs };
            }
            return node;
          })
        );

        const sel = folders.find((f) => f.id === folderId);
        setItems(withSubs as BookmarkNode[]);
        setFolder(
          sel || {
            id: folderId,
            title: "",
            children: withSubs as BookmarkNode[],
          }
        );
      } catch (error) {
        console.error("Error loading bookmarks:", error);
      }
    })();
  }, [folderId, folders]);

  // Group bookmarks into temp folder
  const validItems = items.filter((item) => item != null);
  const foldersOnly = validItems.filter((item) => !item.url);
  const bookmarksOnly = validItems.filter((item) => !!item.url);

  const displayItems = [
    ...foldersOnly,
    ...(bookmarksOnly.length > 0
      ? [
          {
            id: "temp",
            title: "Temp",
            children: bookmarksOnly,
          },
        ]
      : []),
  ];

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
  };

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      setActiveId(null);
      return;
    }

    try {
      const oldIndex = displayItems.findIndex((item) => item.id === active.id);
      const newIndex = displayItems.findIndex((item) => item.id === over.id);

      if (oldIndex !== newIndex) {
        // Reorder items in the same parent
        const newItems = arrayMove(displayItems, oldIndex, newIndex);

        // Update in Chrome bookmarks
        await Promise.all(
          newItems.map(async (item, index) => {
            if (item.id === "temp") return; // Skip temp folder
            await chrome.bookmarks.move(item.id, {
              parentId: folderId || "0",
              index,
            });
          })
        );

        // Update UI state, preserving Temp’s new position
        setItems(() => {
          // Flatten newItems, expanding 'temp' node in-place
          return newItems.reduce<BookmarkNode[]>((acc, entry) => {
            if (entry.id === "temp") {
              return acc.concat(entry.children || []);
            }
            return acc.concat(entry);
          }, []);
        });
      }
    } catch (error) {
      console.error("Drag and drop error:", error);
    } finally {
      setActiveId(null);
    }
  };

  // Handle item moved between folders
  const handleBookmarkMoved = async (
    bookmarkId: string,
    fromParentId: string,
    toParentId: string
  ) => {
    try {
      // Update in Chrome bookmarks
      await chrome.bookmarks.move(bookmarkId, {
        parentId: toParentId,
      });

      // Update UI state
      setItems((prev) => {
        // Remove from source folder
        const updatedItems = prev.map((item) => {
          if (item.id === fromParentId) {
            return {
              ...item,
              children:
                item.children?.filter((child) => child.id !== bookmarkId) || [],
            };
          }
          return item;
        });

        // Add to target folder (if in current view)
        if (toParentId === folderId) {
          const movedItem = prev
            .flatMap((item) => item.children || [])
            .find((item) => item.id === bookmarkId);

          if (movedItem) {
            return updatedItems.map((item) => {
              if (item.id === "temp") {
                return {
                  ...item,
                  children: [movedItem, ...(item.children || [])],
                };
              }
              return item;
            });
          }
        }

        return updatedItems;
      });
    } catch (error) {
      console.error("Error moving bookmark:", error);
    }
  };

  // Responsive column count
  useEffect(() => {
    const updateColumnCount = () => {
      const width = gridRef.current?.clientWidth || window.innerWidth;
      if (width < 640) setColumnCount(1);
      else if (width < 768) setColumnCount(2);
      else if (width < 1024) setColumnCount(3);
      else setColumnCount(4);
    };

    updateColumnCount();
    window.addEventListener("resize", updateColumnCount);
    return () => window.removeEventListener("resize", updateColumnCount);
  }, []);

  // Create columns for masonry layout
  const columns: BookmarkNode[][] = Array.from(
    { length: columnCount },
    () => []
  );
  displayItems.forEach((item, index) => {
    columns[index % columnCount].push(item);
  });

  if (!folderId) {
    return (
      <div className="flex items-center justify-center h-full">
        <EmptyState />
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToParentElement]}
    >
      <div
        id="bookmark-grid"
        className="bookmark-grid"
        data-parent-id={folderId}
      >
        <GridHeader folderId={folderId} folder={folder} depth={0} />

        {displayItems.length === 0 ? (
          <EmptyState />
        ) : (
          <div
            ref={gridRef}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4"
          >
            {columns.map((column, colIndex) => (
              <div key={colIndex} className="flex flex-col gap-4">
                <SortableContext
                  items={column.map((item) => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {column.map((item) => (
                    <React.Fragment key={item.id}>
                      {item.url ? (
                        <BookmarkCard
                          item={item}
                          parentId={folderId}
                          depth={0}
                          onBookmarkMoved={handleBookmarkMoved}
                        />
                      ) : (
                        <FolderCard
                          folder={item}
                          depth={0}
                          disableNesting={item.id === "temp"}
                          onBookmarkMoved={handleBookmarkMoved}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </SortableContext>
              </div>
            ))}
          </div>
        )}

        <DragOverlay>
          {activeId ? (
            displayItems.find((item) => item.id === activeId)?.url ? (
              <BookmarkCard
                item={displayItems.find((item) => item.id === activeId)!}
                parentId={folderId}
                depth={0}
                isDragging
              />
            ) : (
              <FolderCard
                folder={displayItems.find((item) => item.id === activeId)!}
                depth={0}
                isDragging
              />
            )
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
};

export default BookmarkLayout;
