import React, { useState, useEffect, useRef } from "react";
import { EllipsisVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDrag, useDrop } from "react-dnd";
import type { DragSourceMonitor, DropTargetMonitor } from "react-dnd";
import BookmarkCard from "./BookmarkCard";

const ItemTypes = {
  BOOKMARK: "bookmark",
};

interface FolderCardProps {
  folder: any;
  index: number;
  depth: number;
  isDropTarget: boolean;
  onDropTargetChange: (id: string | null) => void;
  disableNesting?: boolean;
  onReorder: (dragIndex: number, hoverIndex: number) => void;
}

const FolderCard: React.FC<FolderCardProps> = ({
  folder,
  index,
  depth,
  isDropTarget,
  onDropTargetChange,
  disableNesting = false,
  onReorder,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number | null>(null);

  const [{ isDragging }, dragRef] = useDrag(
    () => ({
      type: ItemTypes.BOOKMARK,
      item: (monitor: DragSourceMonitor) => {
        const initial = monitor.getInitialClientOffset();
        console.log(
          "[Drag Begin] FolderCard id=",
          folder.id,
          "index=",
          index,
          "initialOffset=",
          initial
        );
        intervalRef.current = window.setInterval(() => {
          const offset = monitor.getClientOffset();
          console.log(
            "[Dragging] FolderCard id=",
            folder.id,
            "currentOffset=",
            offset
          );
        }, 1000);
        return { id: folder.id, index };
      },
      collect: (monitor: DragSourceMonitor) => ({
        isDragging: monitor.isDragging(),
      }),
      end: (_item, monitor: DragSourceMonitor) => {
        const didDrop = monitor.didDrop();
        const final = monitor.getClientOffset();
        console.log(
          "[Drag End] FolderCard id=",
          folder.id,
          "didDrop=",
          didDrop,
          "finalOffset=",
          final
        );
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      },
    }),
    [folder.id, index]
  );

  const [, dropRef] = useDrop(
    () => ({
      accept: ItemTypes.BOOKMARK,
      hover: (
        dragged: { id: string; index: number },
        monitor: DropTargetMonitor
      ) => {
        if (!ref.current) return;
        const dragIndex = dragged.index;
        const hoverIndex = index;
        console.log(
          "[Hover] FolderCard id=",
          folder.id,
          "dragIndex=",
          dragIndex,
          "hoverIndex=",
          hoverIndex,
          "offset=",
          monitor.getClientOffset()
        );
        if (dragIndex === hoverIndex) return;
        onReorder(dragIndex, hoverIndex);
        dragged.index = hoverIndex;
      },
      drop: (
        dragged: { id: string; index: number },
        monitor: DropTargetMonitor
      ) => {
        console.log(
          "[Drop] FolderCard id=",
          folder.id,
          "received dragged id=",
          dragged.id,
          "dropOffset=",
          monitor.getClientOffset()
        );
      },
    }),
    [index, onReorder]
  );

  dragRef(dropRef(ref));
  const [isOpen, setIsOpen] = useState(false);
  const [children, setChildren] = useState<any[]>([]);

  const loadChildren = async () => {
    if (folder.children) {
      setChildren(folder.children);
      return;
    }
    const folderChildren = await new Promise<any[]>((resolve) =>
      chrome.bookmarks.getChildren(folder.id, resolve)
    );
    setChildren(folderChildren || []);
  };

  const toggleFolder = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    loadChildren();
  }, []);
  // Drag-and-drop handlers for folders
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    onDropTargetChange(folder.id);
    e.dataTransfer.dropEffect = "move";
  };
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    onDropTargetChange(null);
    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      // Only handle bookmarks (items with a URL). Ignore folder drops to prevent depth > 2.
      if (!data.url) return;
      // Prevent invalid moves (self or circular)
      if (data.id === folder.id || isDescendant(folder, data.id)) return;
      await chrome.bookmarks.move(data.id, {
        parentId: folder.id,
        index: 0, // Add to top
      });
      // Optimistically update UI
      setChildren((prev) => [{ ...data }, ...prev]);
    } catch (err) {
      console.error("Folder drop error:", err);
    }
  };
  // Utility to prevent circular moves
  const isDescendant = (parent: any, targetId: string): boolean => {
    if (!parent.children) return false;
    if (parent.children.some((child: any) => child.id === targetId))
      return true;
    return parent.children.some(
      (child: any) => child.children && isDescendant(child, targetId)
    );
  };

  return (
    <motion.div
      ref={ref}
      initial={false}
      transition={{ layout: { duration: 0.3, ease: "easeInOut" } }}
      className={`group bg-card-background border border-card-border hover:border-primary w-full rounded-md ${
        isDropTarget ? "ring-2 ring-primary" : ""
      } ${isDragging ? "opacity-50" : ""}`}
      style={{ cursor: "move" }}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <div
        className="folder-header flex items-center justify-between p-3 cursor-pointer bg-card-header"
        onClick={toggleFolder}
      >
        <div className="flex items-center">
          <div className="folder-icon mr-2">{isOpen ? "📂" : "📁"}</div>
          <div className="folder-title font-medium">{folder.title}</div>
        </div>
        <div className="flex items-center">
          <button
            className="folder-menu-btn p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 invisible group-hover:visible"
            onClick={(e) => e.stopPropagation()}
          >
            <EllipsisVertical size={16} />
          </button>
        </div>
      </div>

      <motion.div
        layout
        initial={false}
        transition={{ layout: { duration: 0.3, ease: "easeInOut" } }}
        className="folder-body p-2 relative overflow-hidden"
      >
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
              {(isOpen ? children : children.slice(0, 5)).map((item) =>
                item.url ? (
                  <BookmarkCard
                    key={item.id}
                    item={item}
                    index={index}
                    depth={depth + 1}
                    isDropTarget={false}
                    onDropTargetChange={() => {}}
                    onReorder={onReorder}
                  />
                ) : (
                  <FolderCard
                    key={item.id}
                    folder={item}
                    index={index}
                    depth={depth + 1}
                    isDropTarget={false}
                    onDropTargetChange={() => {}}
                    onReorder={onReorder}
                  />
                )
              )}
            </motion.div>
          </AnimatePresence>
        )}
        {!isOpen && children.length > 5 && (
          <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-card-header to-transparent pointer-events-none"></div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default FolderCard;
