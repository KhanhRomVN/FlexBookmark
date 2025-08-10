import React, { useState, useEffect } from "react";
import { EllipsisVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useDraggable,
  useDroppable,
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import BookmarkCard from "./BookmarkCard";
import { CSS } from "@dnd-kit/utilities";

interface FolderCardProps {
  folder: any;
  depth: number;
  disableNesting?: boolean;
  isDragging?: boolean;
  onBookmarkMoved?: (
    bookmarkId: string,
    fromParentId: string,
    toParentId: string
  ) => void;
  // (removed duplicate onDrop)
  onDrop?: (item: any) => void;
}

const FolderCard: React.FC<FolderCardProps> = ({
  folder,
  depth,
  disableNesting = false,
  isDragging = false,
  onBookmarkMoved,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [children, setChildren] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isOver, setIsOver] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const { setNodeRef, attributes, listeners, transform } = useDraggable({
    id: folder.id,
    data: { type: "folder", folder },
  });

  const { setNodeRef: setDropRef } = useDroppable({
    id: `folder-drop-${folder.id}`,
    data: { accepts: ["bookmark", "folder"] },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 1,
  };

  // Load children
  useEffect(() => {
    const loadChildren = async () => {
      try {
        if (folder.children) {
          setChildren(folder.children);
          return;
        }

        const folderChildren = await new Promise<any[]>((resolve) =>
          chrome.bookmarks.getChildren(folder.id, resolve)
        );

        setChildren(folderChildren || []);
      } catch (error) {
        console.error("Error loading folder children:", error);
      }
    };

    loadChildren();
  }, [folder]);

  // Handle drop on folder
  const handleDrop = async (item: any) => {
    if (!item || !onBookmarkMoved) return;

    try {
      // Prevent invalid moves
      if (item.id === folder.id || isDescendant(folder, item.id)) return;

      // Move bookmark
      await chrome.bookmarks.move(item.id, {
        parentId: folder.id,
        index: 0,
      });

      // Update UI
      setChildren((prev) => [item, ...prev]);

      // Notify parent
      onBookmarkMoved(item.id, item.parentId, folder.id);
    } catch (error) {
      console.error("Error dropping on folder:", error);
    }
  };

  // Handle drag end inside folder
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    // Prevent moves when indexes are invalid
    const oldIndex = children.findIndex((child) => child.id === active.id);
    const newIndex = over
      ? children.findIndex((child) => child.id === over.id)
      : -1;
    if (oldIndex < 0 || newIndex < 0) {
      setActiveId(null);
      return;
    }

    if (over && active.id !== over.id) {
      const oldIndex = children.findIndex((child) => child.id === active.id);
      const newIndex = children.findIndex((child) => child.id === over.id);

      if (oldIndex !== newIndex) {
        const newChildren = arrayMove(children, oldIndex, newIndex);
        setChildren(newChildren);

        // Update order in Chrome
        chrome.bookmarks.move(active.id as string, {
          parentId: folder.id,
          index: newIndex,
        });
      }
    }

    setActiveId(null);
  };

  // Check if target is descendant
  const isDescendant = (parent: any, targetId: string): boolean => {
    if (!parent.children) return false;
    if (parent.children.some((child: any) => child.id === targetId))
      return true;
    return parent.children.some(
      (child: any) => child.children && isDescendant(child, targetId)
    );
  };

  // Toggle folder open/closed
  const toggleFolder = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group relative bg-card-background w-full rounded-md transition-all border ${
        isOver
          ? "border-border-hover"
          : "border-border-default hover:border-border-hover"
      } ${isDragging ? "shadow-lg" : ""}`}
    >
      <div
        className="folder-header flex items-center justify-between p-3 cursor-pointer bg-card-header border-b border-border-default"
        onClick={toggleFolder}
      >
        <div className="flex items-center">
          <div className="folder-icon mr-2">{isOpen ? "📂" : "📁"}</div>
          <div className="folder-title font-medium text-lg">{folder.title}</div>
        </div>
        <div className="flex items-center">
          {!isOpen && children.length > 0 ? (
            <div className="border border-border-default text-text-secondary text-xs font-semibold px-2 py-0.5 rounded-sm">
              {children.length}
            </div>
          ) : (
            <button
              className="folder-menu-btn p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 invisible group-hover:visible"
              onClick={(e) => e.stopPropagation()}
            >
              <EllipsisVertical size={16} />
            </button>
          )}
        </div>
      </div>

      <motion.div layout className="folder-body p-2 relative overflow-hidden">
        {children.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No bookmarks</div>
        ) : (
          <AnimatePresence initial={false}>
            <motion.div
              layout
              className={`${depth > 0 ? "p-0" : ""}`}
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={(event) => setActiveId(event.active.id as string)}
                onDragEnd={handleDragEnd}
              >
                <div
                  ref={setDropRef}
                  onMouseEnter={() => setIsOver(true)}
                  onMouseLeave={() => setIsOver(false)}
                  className={`min-h-12 ${
                    isOver ? "bg-blue-50 dark:bg-blue-900/20" : ""
                  }`}
                  onClickCapture={(e) => e.stopPropagation()}
                >
                  <SortableContext
                    items={children.map((child) => child.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {(isOpen ? children : children.slice(0, 5)).map((item) =>
                      item.url ? (
                        <BookmarkCard
                          key={item.id}
                          item={item}
                          parentId={folder.id}
                          depth={depth + 1}
                          onBookmarkMoved={onBookmarkMoved}
                          onDrop={handleDrop}
                        />
                      ) : (
                        <FolderCard
                          key={item.id}
                          folder={item}
                          depth={depth + 1}
                          onBookmarkMoved={onBookmarkMoved}
                          onDrop={handleDrop}
                        />
                      )
                    )}
                  </SortableContext>
                </div>

                <DragOverlay>
                  {activeId ? (
                    children.find((child) => child.id === activeId)?.url ? (
                      <BookmarkCard
                        item={children.find((child) => child.id === activeId)!}
                        parentId={folder.id}
                        depth={depth + 1}
                        isDragging
                      />
                    ) : (
                      <FolderCard
                        folder={
                          children.find((child) => child.id === activeId)!
                        }
                        depth={depth + 1}
                        isDragging
                      />
                    )
                  ) : null}
                </DragOverlay>
              </DndContext>
            </motion.div>
          </AnimatePresence>
        )}
        {!isOpen && children.length > 5 && (
          <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-card-header to-transparent pointer-events-none"></div>
        )}
      </motion.div>
    </div>
  );
};

export default FolderCard;
