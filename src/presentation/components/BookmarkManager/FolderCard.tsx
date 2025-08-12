import React, { useEffect, useMemo, useRef, useState } from "react";
import type { UniqueIdentifier } from "@dnd-kit/core";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import BookmarkCard from "./BookmarkCard";
import type { BookmarkItem } from "./BookmarkCard";
import { EllipsisVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Drop zone between bookmarks for insert hints
interface GapDropZoneProps {
  folderId: string;
  folderIndex?: number;
  columnIndex?: number;
  index: number;
  onFolderInsertHint?: (insertAt: number) => void;
}
export const GapDropZone: React.FC<GapDropZoneProps> = ({
  folderId,
  folderIndex = 0,
  columnIndex = 0,
  index,
  onFolderInsertHint,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `gap-${folderId}-${index}`,
    data: {
      zone: "gap",
      folderId,
      folderIndex,
      column: columnIndex,
      index,
    },
  });
  useEffect(() => {
    if (isOver && onFolderInsertHint) {
      onFolderInsertHint(index);
    }
  }, [isOver, index, onFolderInsertHint]);
  return (
    <div
      ref={setNodeRef}
      className={`h-2 ${isOver ? "border-t-2 border-blue-500" : ""}`}
    />
  );
};

interface BookmarkNode {
  id: string;
  title: string;
  url?: string;
  children?: BookmarkNode[];
}

interface FolderCardProps {
  folder: {
    id: string;
    title: string;
    bookmarks: BookmarkNode[];
    parentId?: string;
  };
  columnIndex?: number;
  folderIndex?: number; // global index
  isHighlighted?: boolean;
  activeId?: UniqueIdentifier | null;
  activeType?: string | null;
  onBookmarkMoveRequested?: (bookmarkId: string, fromParentId: string) => void;
  onFolderInsertHint?: (insertAt: number) => void;
  hideWhenDragging?: boolean;
  onBookmarkEdit?: (item: BookmarkItem & { parentId: string }) => void;
}

const FolderCard: React.FC<FolderCardProps> = ({
  folder,
  columnIndex = 0,
  folderIndex = 0,
  isHighlighted = false,
  activeId,
  activeType,
  hideWhenDragging = false,
  onBookmarkMoveRequested,
  onFolderInsertHint,
  onBookmarkEdit,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localHover, setLocalHover] = useState(false);

  // droppable for entire folder (both head and body)
  const { setNodeRef: setFolderRef, isOver: folderIsOver } = useDroppable({
    id: `folder-${folder.id}`,
    data: {
      zone: "folder-full",
      folderId: folder.id,
      folderIndex,
      column: columnIndex,
    },
  });

  // droppable for head (folder drag / folder swap)
  const { setNodeRef: setHeadRef, isOver: headIsOver } = useDroppable({
    id: `folder-head-${folder.id}`,
    data: {
      zone: "folder-head",
      folderId: folder.id,
      folderIndex,
      column: columnIndex,
    },
  });

  // droppable for body (bookmark drop)
  const { setNodeRef: setBodyRef, isOver: bodyIsOver } = useDroppable({
    id: `folder-body-${folder.id}`,
    data: {
      zone: "folder-body",
      folderId: folder.id,
      folderIndex,
      column: columnIndex,
    },
  });

  const rootRef = useRef<HTMLDivElement | null>(null);

  // draggable for folder reordering
  const {
    attributes: dragAttributes,
    listeners: dragListeners,
    setNodeRef: setDragRef,
    transform: dragTransform,
    isDragging: isFolderDragging,
  } = useDraggable({
    id: folder.id,
    disabled: folder.id === "temp",
    data: {
      type: "folder",
      payload: folder,
      column: columnIndex,
      folderIndex,
    },
  });
  const disableLayout = isFolderDragging;

  // displayed bookmarks: collapsed to 5 by default, expand on hover or open
  const shownBookmarks = useMemo(() => {
    if (isOpen || localHover || headIsOver || bodyIsOver)
      return folder.bookmarks;
    return folder.bookmarks.slice(0, 5);
  }, [folder.bookmarks, isOpen, localHover, headIsOver, bodyIsOver]);

  useEffect(() => {
    if (bodyIsOver && onFolderInsertHint) {
      // show some hint; using 0 (insert at top) as placeholder
      onFolderInsertHint(0);
    }
  }, [bodyIsOver, onFolderInsertHint]);

  useEffect(() => {
    if (headIsOver && onFolderInsertHint) {
      onFolderInsertHint(0);
    }
  }, [headIsOver, onFolderInsertHint]);

  const toggleOpen = () => setIsOpen((v) => !v);

  // native HTML drop fallback for bookmarks
  const handleNativeDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const data = e.dataTransfer.getData("application/json");
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed?.type === "bookmark") {
          onBookmarkMoveRequested?.(
            parsed.payload.id,
            parsed.payload.parentId || ""
          );
        }
      }
    } catch (err) {
      console.warn("[FolderCard] native drop parse fail", err);
    }
  };

  return (
    <div
      ref={(n) => {
        rootRef.current = n;
        setFolderRef(n);
      }}
      style={{
        transform: CSS.Translate.toString(dragTransform),
        opacity: isFolderDragging ? 0.6 : 1,
        zIndex: isFolderDragging ? 1000 : undefined,
      }}
      className={`group relative bg-card-background w-full rounded-md border-2 ${
        isHighlighted || headIsOver || bodyIsOver || folderIsOver
          ? "border-blue-400 ring-2 ring-blue-400/30"
          : "border-gray-200 dark:border-gray-700"
      } ${hideWhenDragging ? "invisible" : ""}`}
      onMouseEnter={() => setLocalHover(true)}
      onMouseLeave={() => setLocalHover(false)}
    >
      {/* HEAD */}
      <div
        ref={(n) => {
          setHeadRef(n);
          setDragRef(n);
        }}
        {...dragAttributes}
        {...dragListeners}
        className="folder-header flex items-center justify-between p-3 cursor-pointer bg-card-header border-b border-border-default"
        onClick={toggleOpen}
      >
        <div className="flex items-center">
          <div className="folder-icon mr-2">{isOpen ? "📂" : "📁"}</div>
          <div className="folder-title font-medium text-lg truncate">
            {folder.title}
          </div>
        </div>
        <div className="relative w-6 h-6">
          {!isOpen && folder.bookmarks.length > 0 && (
            <span className="absolute inset-0 flex items-center justify-center border border-border-default text-text-secondary text-xs font-semibold rounded-sm transition-opacity duration-200 opacity-100 group-hover:opacity-0">
              {folder.bookmarks.length}
            </span>
          )}
          <button
            className="absolute inset-0 flex items-center justify-center p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-opacity duration-200 opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              /* open folder menu */
            }}
          >
            <EllipsisVertical size={16} />
          </button>
        </div>
      </div>

      {/* BODY: droppable zone for bookmark drops */}
      <div
        ref={(n) => {
          setBodyRef(n);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleNativeDrop}
      >
        <motion.div
          layout={!disableLayout}
          className="folder-body p-2 relative overflow-visible"
        >
          {folder.bookmarks.length === 0 ? (
            <div className="text-center py-4 text-gray-500 min-h-[50px]">
              {bodyIsOver ? "Drop here" : "No bookmarks"}
            </div>
          ) : (
            <AnimatePresence initial={false}>
              <motion.div
                layout={!disableLayout}
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                transition={{ duration: 0.16 }}
              >
                {shownBookmarks.map((b, i) => (
                  <React.Fragment key={b.id}>
                    <GapDropZone
                      folderId={folder.id}
                      folderIndex={folderIndex}
                      columnIndex={columnIndex}
                      index={i}
                      onFolderInsertHint={onFolderInsertHint}
                    />
                    <BookmarkCard
                      item={b}
                      parentId={folder.id}
                      depth={1}
                      hideWhenDragging={
                        activeType === "bookmark" && activeId === b.id
                      }
                      onEdit={(it) => onBookmarkEdit?.(it)}
                    />
                  </React.Fragment>
                ))}
                <GapDropZone
                  folderId={folder.id}
                  folderIndex={folderIndex}
                  columnIndex={columnIndex}
                  index={shownBookmarks.length}
                  onFolderInsertHint={onFolderInsertHint}
                />

                {!isOpen && !localHover && folder.bookmarks.length > 5 && (
                  <div className="text-xs text-gray-400 pt-2">
                    Hover to expand
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}

          {/* overlay highlight */}
          {(isHighlighted || headIsOver || bodyIsOver) && (
            <div className="absolute inset-0 pointer-events-none rounded border-2 border-dashed border-blue-300/40" />
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default React.memo(FolderCard);
