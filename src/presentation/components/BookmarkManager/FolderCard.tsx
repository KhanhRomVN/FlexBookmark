import React, { useState, useEffect } from "react";
import { EllipsisVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import BookmarkCard from "./BookmarkCard";

interface FolderCardProps {
  folder: any;
  depth: number;
  isDropTarget: boolean;
  onDropTargetChange: (id: string | null) => void;
}

const FolderCard: React.FC<FolderCardProps> = ({
  folder,
  depth,
  isDropTarget,
  onDropTargetChange,
}) => {
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
    e.preventDefault();
    onDropTargetChange(folder.id);
    e.dataTransfer.dropEffect = "move";
  };
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    onDropTargetChange(null);
    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      // Prevent invalid moves
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
      layout
      initial={false}
      transition={{ layout: { duration: 0.3, ease: "easeInOut" } }}
      className={`group bg-card-background border border-card-border hover:border-primary w-full rounded-md ${
        !isOpen ? "shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]" : ""
      }`}
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
                    depth={depth + 1}
                    isDropTarget={false}
                    onDropTargetChange={() => {}}
                  />
                ) : (
                  <FolderCard
                    key={item.id}
                    folder={item}
                    depth={depth + 1}
                    isDropTarget={false}
                    onDropTargetChange={() => {}}
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
