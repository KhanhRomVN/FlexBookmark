import React, { useState, useRef, useEffect } from "react";
import { useDrag, useDrop } from "react-dnd";
import type { DragSourceMonitor, DropTargetMonitor } from "react-dnd";
import { EllipsisVertical as LucideMenu } from "lucide-react";

const ItemTypes = {
  BOOKMARK: "bookmark",
};

interface BookmarkCardProps {
  item: any;
  parentId: string; // add parent folder ID
  index: number;
  depth: number;
  isDropTarget: boolean;
  onDropTargetChange: (id: string | null) => void;
  onReorder: (dragIndex: number, hoverIndex: number) => void;
}

const BookmarkCard: React.FC<BookmarkCardProps> = ({
  item,
  parentId,
  index,
  depth,
  isDropTarget,
  onDropTargetChange,
  onReorder,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, dragRef] = useDrag(
    () => ({
      type: ItemTypes.BOOKMARK,
      item: (monitor: DragSourceMonitor) => {
        const initial = monitor.getInitialClientOffset();
        console.log(
          "[Drag Begin] BookmarkCard id=",
          item.id,
          "parent=",
          parentId,
          "index=",
          index,
          "initialOffset=",
          initial
        );
        intervalRef.current = window.setInterval(() => {
          const offset = monitor.getClientOffset();
          console.log(
            "[Dragging] BookmarkCard id=",
            item.id,
            "parent=",
            parentId,
            "currentOffset=",
            offset
          );
        }, 1000);
        // include parentId, url, title for drop handlers
        return { ...item, parentId, index };
      },
      collect: (monitor: DragSourceMonitor) => ({
        isDragging: monitor.isDragging(),
      }),
      end: (_dragged, monitor: DragSourceMonitor) => {
        const didDrop = monitor.didDrop();
        const final = monitor.getClientOffset();
        console.log(
          "[Drag End] BookmarkCard id=",
          item.id,
          "parent=",
          parentId,
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
    [item.id, parentId, index]
  );

  const [{ isOver }, dropRef] = useDrop(
    () => ({
      accept: ItemTypes.BOOKMARK,
      collect: (monitor: DropTargetMonitor) => ({
        isOver: monitor.isOver({ shallow: true }),
      }),
      hover: (
        dragged: { id: string; index: number },
        monitor: DropTargetMonitor
      ) => {
        if (!ref.current) return;
        const dragIndex = dragged.index;
        const hoverIndex = index;
        if (dragIndex === hoverIndex) return;
        onReorder(dragIndex, hoverIndex);
        dragged.index = hoverIndex;
      },
      drop: (
        dragged: { id: string; index: number },
        monitor: DropTargetMonitor
      ) => {
        console.log(
          "[Drop] BookmarkCard id=",
          item.id,
          "received dragged id=",
          dragged.id,
          "dropOffset=",
          monitor.getClientOffset()
        );
      },
    }),
    [index, onReorder]
  );

  // attach both drag and drop refs to the node
  dragRef(dropRef(ref));

  // notify parent layout of drop-target changes
  useEffect(() => {
    onDropTargetChange(isOver ? item.id : null);
  }, [isOver, item.id, onDropTargetChange]);

  const handleClick = () => {
    chrome.tabs.create({ url: item.url });
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  return (
    <div
      ref={(node) => dragRef(dropRef(node))}
      style={{ opacity: isDragging ? 0.5 : 1, cursor: "move" }}
      className={`bookmark-card group flex items-center p-2 rounded-md transition-all
        ${depth > 1 ? "ml-4" : ""}
        ${
          isDropTarget
            ? "bg-blue-100 dark:bg-blue-900 border border-primary"
            : ""
        }
      `}
      onClick={handleClick}
    >
      <img
        src={`https://www.google.com/s2/favicons?sz=64&domain_url=${item.url}`}
        alt="Favicon"
        className="w-5 h-5 mr-3"
      />

      <div className="flex-1 min-w-0">
        <div className="bookmark-title truncate text-sm font-medium">
          {item.title}
        </div>
      </div>

      <div className="relative">
        <button
          className="bookmark-menu-btn p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 invisible group-hover:visible"
          onClick={handleMenuClick}
        >
          <LucideMenu size={16} />
        </button>

        {showMenu && (
          <div className="menu-dropdown absolute right-0 top-full mt-1 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700">
            <button className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">
              ✏️ Edit
            </button>
            <button className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500">
              🗑️ Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookmarkCard;
