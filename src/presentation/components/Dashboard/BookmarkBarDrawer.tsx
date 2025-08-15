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
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import BookmarkForm from "../BookmarkManager/BookmarkForm";

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
}

const TreeItem: React.FC<TreeItemProps> = ({
  item,
  level,
  expandedItems,
  onToggleExpanded,
  onFolderAction,
  onBookmarkAction,
  activeId,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isFolder = !item.url;
  const isExpanded = expandedItems.has(item.id);
  const hasChildren = item.children && item.children.length > 0;

  // Draggable setup
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
    },
  });

  // Droppable setup for folders
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

  // Close menu on outside click
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
        isOver ? "bg-blue-100 dark:bg-blue-900" : ""
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`flex items-center py-1 px-2 rounded cursor-pointer`}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        {...attributes}
        {...listeners}
      >
        {/* Expand/Collapse button for folders */}
        {isFolder && (
          <button
            className="mr-1 p-1 rounded"
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

        {/* Icon */}
        <div className="mr-2">
          {isFolder ? (
            <Folder size={16} className="text-blue-500" />
          ) : (
            <Bookmark size={16} className="text-green-500" />
          )}
        </div>

        {/* Title */}
        <span className="flex-1 text-sm truncate">{item.title}</span>

        {/* Action button */}
        {isHovered && (
          <div ref={menuRef} className="relative">
            <button
              className="ml-2 p-1 rounded"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
            >
              {isFolder ? <FolderCog size={14} /> : <Bolt size={14} />}
            </button>

            {/* Dropdown menu */}
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border rounded-md shadow-lg z-10">
                {isFolder ? (
                  <>
                    <button
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      onClick={() => handleMenuAction("rename")}
                    >
                      <Edit size={14} /> Rename
                    </button>
                    <button
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      onClick={() => handleMenuAction("add-bookmark")}
                    >
                      <BookmarkPlus size={14} /> Add Bookmark
                    </button>
                    <button
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-500"
                      onClick={() => handleMenuAction("delete")}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                    {hasChildren && (
                      <button
                        className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-orange-500"
                        onClick={() => handleMenuAction("delete-bookmarks")}
                      >
                        <Trash2 size={14} /> Delete Bookmarks
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      onClick={() => handleMenuAction("edit")}
                    >
                      <Edit size={14} /> Edit
                    </button>
                    <button
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-500"
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

      {/* Children */}
      {isFolder && isExpanded && hasChildren && (
        <div>
          {item.children!.map((child) => (
            <TreeItem
              key={child.id}
              item={child}
              level={level + 1}
              expandedItems={expandedItems}
              onToggleExpanded={onToggleExpanded}
              onFolderAction={onFolderAction}
              onBookmarkAction={onBookmarkAction}
              activeId={activeId}
            />
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
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<string>>(
    new Set()
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Load bookmarks
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
        // Add parentId to each child for easier management
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
        // Move bookmarks out first, then delete folder
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

    if (targetData?.type === "folder") {
      try {
        await chrome.bookmarks.move(draggedItem.id, {
          parentId: targetData.folderId,
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
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Bookmarks Bar Manager</h2>
            <button onClick={onClose} className="p-1 rounded">
              <X size={20} className="hover:text-red-400" />
            </button>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-2 p-3 border-b">
            <button
              onClick={handleCollapseAll}
              className="p-2 rounded"
              title="Collapse All"
            >
              <Minimize2 size={16} className="hover:text-red-400" />
            </button>
            <button
              onClick={handleExpandAll}
              className="p-2 rounded"
              title="Expand All"
            >
              <Maximize2 size={16} className="hover:text-red-400" />
            </button>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />
            <button
              onClick={() => {
                const folderName = prompt("Enter folder name:");
                if (folderName) {
                  chrome.bookmarks.create(
                    {
                      title: folderName,
                      parentId:
                        bookmarks.length > 0
                          ? bookmarks[0].parentId
                          : undefined,
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
              className="p-2 rounded"
              title="Create Folder"
            >
              <FolderPlus size={16} className="hover:text-red-400" />
            </button>
            <button
              onClick={() =>
                setShowBookmarkForm({
                  parentId:
                    bookmarks.length > 0 ? bookmarks[0].parentId || "" : "",
                })
              }
              className="p-2 rounded"
              title="Add Bookmark"
            >
              <BookmarkPlus size={16} className="hover:text-red-400" />
            </button>
          </div>

          {/* Tree View */}
          <div className="flex-1 overflow-auto">
            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="p-2">
                {bookmarks.map((item) => (
                  <TreeItem
                    key={item.id}
                    item={item}
                    level={0}
                    expandedItems={expandedItems}
                    onToggleExpanded={handleToggleExpanded}
                    onFolderAction={handleFolderAction}
                    onBookmarkAction={handleBookmarkAction}
                    activeId={activeId}
                  />
                ))}
              </div>

              <DragOverlay>
                {draggedItem && (
                  <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 shadow-lg">
                    {draggedItem.url ? (
                      <Bookmark size={16} className="text-green-500 mr-2" />
                    ) : (
                      <Folder size={16} className="text-blue-500 mr-2" />
                    )}
                    <span className="text-sm">{draggedItem.title}</span>
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          </div>
        </div>
      </Drawer>

      {/* Bookmark Form Modal */}
      {showBookmarkForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000]">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4 w-full">
            <h2 className="text-xl font-bold mb-4">
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
                    // Edit existing bookmark - we need to find the bookmark ID
                    // This is a simplified approach - in real implementation you'd pass the ID
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
                    // Create new bookmark
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
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  name="title"
                  defaultValue={showBookmarkForm.initialData?.title || ""}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">URL</label>
                <input
                  type="url"
                  name="url"
                  defaultValue={showBookmarkForm.initialData?.url || ""}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBookmarkForm(null)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000]">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="mb-6">
              {showDeleteDialog.type === "bookmark"
                ? `Are you sure you want to delete the bookmark "${showDeleteDialog.item.title}"?`
                : `Are you sure you want to delete the folder "${showDeleteDialog.item.title}"?`}
            </p>

            {showDeleteDialog.type === "folder" &&
              showDeleteDialog.item.children?.some((child) => child.url) && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
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
                      className="block w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
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
                      className="block w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      Move bookmarks out, then delete folder
                    </button>
                  </div>
                </div>
              )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteDialog(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
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
