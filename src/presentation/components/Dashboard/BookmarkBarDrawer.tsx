import React, { useState, useEffect, useRef } from "react";
import Drawer from "react-modern-drawer";
import "react-modern-drawer/dist/index.css";
import {
  X,
  FolderCog,
  Bolt,
  ChevronDown,
  ChevronRight,
  Folder,
  Bookmark,
  FolderPlus,
  BookmarkPlus,
  Minimize2,
  Maximize2,
  Trash2,
  Edit,
  Move,
} from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  closestCenter,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

interface BookmarkNode {
  id: string;
  title: string;
  url?: string;
  children?: BookmarkNode[];
  parentId?: string;
}

interface BookmarkBarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TreeItemProps {
  item: BookmarkNode;
  level: number;
  expandedItems: Set<string>;
  onToggleExpanded: (id: string) => void;
  onFolderAction: (action: string, item: BookmarkNode) => void;
  onBookmarkAction: (action: string, item: BookmarkNode) => void;
  activeId?: string | null;
  parentId?: string;
  index?: number;
}

const TreeGapDropZone: React.FC<{
  parentId: string | undefined;
  index: number;
}> = ({ parentId, index }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `tree-gap-${parentId}-${index}`,
    data: {
      type: "gap",
      parentId,
      index,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`h-2 transition-all duration-200 ${
        isOver ? "bg-blue-500/20 rounded" : ""
      }`}
    />
  );
};

const TreeItem: React.FC<TreeItemProps> = ({
  item,
  level,
  expandedItems,
  onToggleExpanded,
  onFolderAction,
  onBookmarkAction,
  activeId,
  parentId,
  index,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isFolder = !item.url;
  const isExpanded = expandedItems.has(item.id);
  const hasChildren = item.children && item.children.length > 0;

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
    isDragging,
  } = useDraggable({
    id: item.id,
    data: {
      type: isFolder ? "folder" : "bookmark",
      item,
      parentId,
      index,
    },
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop-${item.id}`,
    disabled: !isFolder,
    data: {
      type: "folder",
      folderId: item.id,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleOutsideClick);
      return () =>
        document.removeEventListener("mousedown", handleOutsideClick);
    }
  }, [showMenu]);

  const handleMenuAction = (action: string) => {
    if (isFolder) {
      onFolderAction(action, item);
    } else {
      onBookmarkAction(action, item);
    }
    setShowMenu(false);
  };

  return (
    <div
      ref={(node) => {
        setDragRef(node);
        if (isFolder) setDropRef(node);
      }}
      style={style}
      className={`select-none ${isDragging ? "z-50" : ""} ${
        isOver ? "bg-blue-100 dark:bg-blue-900/30" : ""
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`flex items-center py-1 px-2 rounded cursor-pointer hover:bg-sidebar-itemHover transition-colors ${
          isDragging ? "bg-card-background shadow-md" : ""
        }`}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        {...attributes}
        {...listeners}
      >
        {isFolder && (
          <button
            className="mr-1 p-1 rounded hover:bg-button-secondBgHover"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpanded(item.id);
            }}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown size={12} />
              ) : (
                <ChevronRight size={12} />
              )
            ) : (
              <div className="w-3 h-3" />
            )}
          </button>
        )}

        <div className="mr-2 flex items-center">
          {isFolder ? (
            <Folder size={16} className="text-blue-500" />
          ) : item.url ? (
            <img
              src={`https://www.google.com/s2/favicons?sz=16&domain_url=${encodeURIComponent(
                item.url
              )}`}
              alt="favicon"
              className="w-4 h-4"
            />
          ) : (
            <Bookmark size={16} className="text-green-500" />
          )}
        </div>

        <span className="flex-1 text-sm truncate text-text-primary">
          {item.title}
        </span>

        {isHovered && (
          <div ref={menuRef} className="relative">
            <button
              className="ml-2 p-1 rounded hover:bg-button-secondBgHover"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
            >
              {isFolder ? <FolderCog size={14} /> : <Bolt size={14} />}
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-dropdown-background border border-border-default rounded-md shadow-lg z-10 backdrop-blur-sm">
                {isFolder ? (
                  <>
                    <button
                      className="w-full px-3 py-2 text-left hover:bg-dropdown-itemHover flex items-center gap-2 text-sm"
                      onClick={() => handleMenuAction("rename")}
                    >
                      <Edit size={14} /> Rename
                    </button>
                    <button
                      className="w-full px-3 py-2 text-left hover:bg-dropdown-itemHover flex items-center gap-2 text-sm"
                      onClick={() => handleMenuAction("add-bookmark")}
                    >
                      <BookmarkPlus size={14} /> Add Bookmark
                    </button>
                    <button
                      className="w-full px-3 py-2 text-left hover:bg-dropdown-itemHover flex items-center gap-2 text-red-500 text-sm"
                      onClick={() => handleMenuAction("delete")}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                    {hasChildren && (
                      <button
                        className="w-full px-3 py-2 text-left hover:bg-dropdown-itemHover flex items-center gap-2 text-orange-500 text-sm"
                        onClick={() => handleMenuAction("delete-bookmarks")}
                      >
                        <Trash2 size={14} /> Delete Bookmarks
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      className="w-full px-3 py-2 text-left hover:bg-dropdown-itemHover flex items-center gap-2 text-sm"
                      onClick={() => handleMenuAction("edit")}
                    >
                      <Edit size={14} /> Edit
                    </button>
                    <button
                      className="w-full px-3 py-2 text-left hover:bg-dropdown-itemHover flex items-center gap-2 text-red-500 text-sm"
                      onClick={() => handleMenuAction("delete")}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {isFolder && isExpanded && hasChildren && (
        <div>
          <TreeGapDropZone parentId={item.id} index={0} />
          {item.children!.map((child, idx) => (
            <React.Fragment key={child.id}>
              <TreeItem
                item={child}
                level={level + 1}
                expandedItems={expandedItems}
                onToggleExpanded={onToggleExpanded}
                onFolderAction={onFolderAction}
                onBookmarkAction={onBookmarkAction}
                activeId={activeId}
                parentId={item.id}
                index={idx}
              />
              <TreeGapDropZone parentId={item.id} index={idx + 1} />
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

const BookmarkBarDrawer: React.FC<BookmarkBarDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const [bookmarks, setBookmarks] = useState<BookmarkNode[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<BookmarkNode | null>(null);
  const [showBookmarkForm, setShowBookmarkForm] = useState<{
    parentId: string;
    initialData?: { title: string; url: string };
  } | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<{
    item: BookmarkNode;
    type: "folder" | "folder-move" | "bookmark";
  } | null>(null);
  const [bookmarkBarId, setBookmarkBarId] = useState<string>("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  useEffect(() => {
    if (isOpen) {
      loadBookmarks();
    }
  }, [isOpen]);

  const loadBookmarks = async () => {
    try {
      const tree = await new Promise<chrome.bookmarks.BookmarkTreeNode[]>(
        (resolve) => {
          chrome.bookmarks.getTree(resolve);
        }
      );

      const bookmarkBar = tree[0]?.children?.find(
        (child) =>
          child.title.toLowerCase().includes("bookmark bar") ||
          child.title.toLowerCase().includes("bookmarks bar")
      );

      if (bookmarkBar && bookmarkBar.children) {
        setBookmarkBarId(bookmarkBar.id);
        const processChildren = (
          items: chrome.bookmarks.BookmarkTreeNode[],
          parentId?: string
        ): BookmarkNode[] => {
          return items.map((item) => ({
            id: item.id,
            title: item.title,
            url: item.url,
            parentId,
            children: item.children
              ? processChildren(item.children, item.id)
              : undefined,
          }));
        };

        setBookmarks(processChildren(bookmarkBar.children, bookmarkBar.id));
      }
    } catch (error) {
      console.error("Failed to load bookmarks:", error);
    }
  };

  const handleToggleExpanded = (id: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleExpandAll = () => {
    const getAllIds = (items: BookmarkNode[]): string[] => {
      let ids: string[] = [];
      items.forEach((item) => {
        if (!item.url) {
          ids.push(item.id);
          if (item.children) {
            ids.push(...getAllIds(item.children));
          }
        }
      });
      return ids;
    };
    setExpandedItems(new Set(getAllIds(bookmarks)));
  };

  const handleCollapseAll = () => {
    setExpandedItems(new Set());
  };

  const handleFolderAction = async (action: string, item: BookmarkNode) => {
    switch (action) {
      case "rename":
        const newTitle = prompt("Enter new folder name:", item.title);
        if (newTitle && newTitle !== item.title) {
          try {
            await chrome.bookmarks.update(item.id, { title: newTitle });
            loadBookmarks();
          } catch (error) {
            console.error("Failed to rename folder:", error);
          }
        }
        break;
      case "add-bookmark":
        setShowBookmarkForm({ parentId: item.id });
        break;
      case "delete":
        setShowDeleteDialog({ item, type: "folder" });
        break;
      case "delete-bookmarks":
        // Show bookmark selection dialog
        break;
    }
  };

  const handleBookmarkAction = (action: string, item: BookmarkNode) => {
    switch (action) {
      case "edit":
        setShowBookmarkForm({
          parentId: item.parentId || "",
          initialData: { title: item.title, url: item.url || "" },
        });
        break;
      case "delete":
        setShowDeleteDialog({ item, type: "bookmark" });
        break;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!showDeleteDialog) return;

    try {
      const { item, type } = showDeleteDialog;

      if (type === "bookmark") {
        await chrome.bookmarks.remove(item.id);
      } else if (type === "folder") {
        await chrome.bookmarks.removeTree(item.id);
      } else if (type === "folder-move") {
        if (item.children) {
          const parentId = item.parentId;
          for (const child of item.children) {
            if (child.url) {
              await chrome.bookmarks.move(child.id, { parentId });
            }
          }
        }
        await chrome.bookmarks.removeTree(item.id);
      }

      setShowDeleteDialog(null);
      loadBookmarks();
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setDraggedItem(event.active.data.current?.item as BookmarkNode);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      setActiveId(null);
      setDraggedItem(null);
      return;
    }

    const draggedItem = active.data.current?.item as BookmarkNode;
    const targetData = over.data.current;

    // Prevent folder inside folder
    if (
      !draggedItem.url &&
      targetData?.type === "folder" &&
      draggedItem.id !== targetData.folderId
    ) {
      alert("Cannot place folders inside other folders");
      setActiveId(null);
      setDraggedItem(null);
      return;
    }

    if (targetData?.type === "folder") {
      try {
        await chrome.bookmarks.move(draggedItem.id, {
          parentId: targetData.folderId,
        });
        loadBookmarks();
      } catch (error) {
        console.error("Failed to move item:", error);
      }
    } else if (targetData?.type === "gap") {
      try {
        const { parentId, index } = targetData;
        await chrome.bookmarks.move(draggedItem.id, {
          parentId,
          index,
        });
        loadBookmarks();
      } catch (error) {
        console.error("Failed to move item:", error);
      }
    }

    setActiveId(null);
    setDraggedItem(null);
  };

  return (
    <>
      <Drawer
        open={isOpen}
        onClose={onClose}
        direction="right"
        size="400px"
        overlayClassName="z-[1500]"
        overlayOpacity={0.2}
      >
        <div className="h-full flex flex-col bg-drawer-background">
          <div className="flex items-center justify-between p-4 border-b border-border-default">
            <h2 className="text-lg font-semibold text-text-primary">
              Bookmarks Bar Manager
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-button-secondBgHover"
            >
              <X size={20} className="hover:text-red-400 text-text-secondary" />
            </button>
          </div>

          <div className="flex items-center gap-2 p-3 border-b border-border-default">
            <button
              onClick={handleCollapseAll}
              className="p-2 rounded hover:bg-button-secondBgHover"
              title="Collapse All"
            >
              <Minimize2
                size={16}
                className="hover:text-red-400 text-text-secondary"
              />
            </button>
            <button
              onClick={handleExpandAll}
              className="p-2 rounded hover:bg-button-secondBgHover"
              title="Expand All"
            >
              <Maximize2
                size={16}
                className="hover:text-red-400 text-text-secondary"
              />
            </button>
            <div className="w-px h-6 bg-border-default mx-2" />
            <button
              onClick={() => {
                const folderName = prompt("Enter folder name:");
                if (folderName) {
                  chrome.bookmarks.create(
                    {
                      title: folderName,
                      parentId: bookmarkBarId,
                    },
                    () => {
                      if (chrome.runtime.lastError) {
                        console.error(
                          "Error creating folder:",
                          chrome.runtime.lastError
                        );
                      } else {
                        loadBookmarks();
                      }
                    }
                  );
                }
              }}
              className="p-2 rounded hover:bg-button-secondBgHover"
              title="Create Folder"
            >
              <FolderPlus
                size={16}
                className="hover:text-red-400 text-text-secondary"
              />
            </button>
            <button
              onClick={() =>
                setShowBookmarkForm({
                  parentId: bookmarkBarId,
                })
              }
              className="p-2 rounded hover:bg-button-secondBgHover"
              title="Add Bookmark"
            >
              <BookmarkPlus
                size={16}
                className="hover:text-red-400 text-text-secondary"
              />
            </button>
          </div>

          <div className="flex-1 overflow-auto">
            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              collisionDetection={closestCenter}
            >
              <div className="p-2">
                <TreeGapDropZone parentId={bookmarkBarId} index={0} />
                {bookmarks.map((item, index) => (
                  <React.Fragment key={item.id}>
                    <TreeItem
                      item={item}
                      level={0}
                      expandedItems={expandedItems}
                      onToggleExpanded={handleToggleExpanded}
                      onFolderAction={handleFolderAction}
                      onBookmarkAction={handleBookmarkAction}
                      activeId={activeId}
                      parentId={bookmarkBarId}
                      index={index}
                    />
                    <TreeGapDropZone
                      parentId={bookmarkBarId}
                      index={index + 1}
                    />
                  </React.Fragment>
                ))}
              </div>

              <DragOverlay>
                {draggedItem && (
                  <div className="flex items-center bg-card-background dark:bg-gray-800 border border-border-default rounded px-2 py-1 shadow-lg">
                    {draggedItem.url ? (
                      <img
                        src={`https://www.google.com/s2/favicons?sz=16&domain_url=${encodeURIComponent(
                          draggedItem.url
                        )}`}
                        alt="favicon"
                        className="w-4 h-4 mr-2"
                      />
                    ) : (
                      <Folder size={16} className="text-blue-500 mr-2" />
                    )}
                    <span className="text-sm text-text-primary">
                      {draggedItem.title}
                    </span>
                    <Move size={14} className="ml-2 text-text-secondary" />
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          </div>
        </div>
      </Drawer>

      {showBookmarkForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000]">
          <div className="bg-card-background rounded-lg p-6 max-w-md mx-4 w-full border border-border-default">
            <h2 className="text-xl font-bold mb-4 text-text-primary">
              {showBookmarkForm.initialData ? "Edit Bookmark" : "Add Bookmark"}
            </h2>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const title = formData.get("title") as string;
                const url = formData.get("url") as string;

                try {
                  if (showBookmarkForm.initialData) {
                    const bookmarksToSearch = (
                      items: BookmarkNode[]
                    ): BookmarkNode | null => {
                      for (const item of items) {
                        if (
                          item.title === showBookmarkForm.initialData?.title &&
                          item.url === showBookmarkForm.initialData?.url
                        ) {
                          return item;
                        }
                        if (item.children) {
                          const found = bookmarksToSearch(item.children);
                          if (found) return found;
                        }
                      }
                      return null;
                    };

                    const existingBookmark = bookmarksToSearch(bookmarks);
                    if (existingBookmark) {
                      await new Promise<void>((resolve, reject) => {
                        chrome.bookmarks.update(
                          existingBookmark.id,
                          { title, url },
                          () => {
                            if (chrome.runtime.lastError) {
                              reject(chrome.runtime.lastError);
                            } else {
                              resolve();
                            }
                          }
                        );
                      });
                    }
                  } else {
                    await new Promise<void>((resolve, reject) => {
                      chrome.bookmarks.create(
                        {
                          parentId: showBookmarkForm.parentId,
                          title,
                          url,
                        },
                        () => {
                          if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                          } else {
                            resolve();
                          }
                        }
                      );
                    });
                  }

                  setShowBookmarkForm(null);
                  loadBookmarks();
                } catch (error) {
                  console.error("Error saving bookmark:", error);
                  alert("Failed to save bookmark");
                }
              }}
            >
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-text-secondary">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  defaultValue={showBookmarkForm.initialData?.title || ""}
                  className="w-full px-3 py-2 border border-border-default rounded-md bg-input-background text-text-primary"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-text-secondary">
                  URL
                </label>
                <input
                  type="url"
                  name="url"
                  defaultValue={showBookmarkForm.initialData?.url || ""}
                  className="w-full px-3 py-2 border border-border-default rounded-md bg-input-background text-text-primary"
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBookmarkForm(null)}
                  className="px-4 py-2 border border-border-default rounded hover:bg-button-secondBgHover text-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-button-bg text-button-text rounded hover:bg-button-bgHover"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000]">
          <div className="bg-card-background rounded-lg p-6 max-w-md mx-4 border border-border-default">
            <h3 className="text-lg font-semibold mb-4 text-text-primary">
              Confirm Delete
            </h3>
            <p className="mb-6 text-text-secondary">
              {showDeleteDialog.type === "bookmark"
                ? `Are you sure you want to delete the bookmark "${showDeleteDialog.item.title}"?`
                : `Are you sure you want to delete the folder "${showDeleteDialog.item.title}"?`}
            </p>

            {showDeleteDialog.type === "folder" &&
              showDeleteDialog.item.children?.some((child) => child.url) && (
                <div className="mb-4">
                  <p className="text-sm text-text-secondary mb-2">
                    This folder contains bookmarks. What would you like to do?
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={() =>
                        setShowDeleteDialog({
                          ...showDeleteDialog,
                          type: "folder",
                        })
                      }
                      className="block w-full text-left px-3 py-2 hover:bg-dropdown-itemHover rounded text-text-primary"
                    >
                      Delete folder and all bookmarks inside
                    </button>
                    <button
                      onClick={() =>
                        setShowDeleteDialog({
                          ...showDeleteDialog,
                          type: "folder-move",
                        })
                      }
                      className="block w-full text-left px-3 py-2 hover:bg-dropdown-itemHover rounded text-text-primary"
                    >
                      Move bookmarks out, then delete folder
                    </button>
                  </div>
                </div>
              )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteDialog(null)}
                className="px-4 py-2 border border-border-default rounded hover:bg-button-secondBgHover text-text-primary"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BookmarkBarDrawer;
