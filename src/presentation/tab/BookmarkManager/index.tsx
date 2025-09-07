import React, { useState, useEffect, useRef, useMemo } from "react";
import { useBookmark } from "./hooks/useBookmark";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import BookmarkForm from "./components/BookmarkForm";
import BookmarkCard from "./components/BookmarkCard";
import FolderCard from "./components/FolderCard";
import ThemeDrawer from "../../components/drawer/ThemeDrawer";
import { BookmarkNode, FolderModel } from "./types";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragOverEvent,
  DragStartEvent,
  UniqueIdentifier,
  PointerSensor,
  useSensor,
  useSensors,
  Collision,
  MeasuringStrategy,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { BookmarkService } from "./services/BookmarkService";

const TEMP_FOLDER_ID = "temp";

const EmptyState: React.FC = () => {
  return (
    <div className="empty-state flex flex-col items-center justify-center text-center p-8 text-text-secondary">
      <div className="empty-icon text-5xl mb-4">📚</div>
      <p className="text-lg">There are no bookmarks in this folder.</p>
    </div>
  );
};

const ImportForm: React.FC<{
  parentId: string;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ parentId, onClose, onSuccess }) => {
  const [importText, setImportText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const lines = importText.split("\n");
      for (const line of lines) {
        const [title, url] = line.split(",");
        if (title && url) {
          await BookmarkService.createBookmark({
            parentId,
            title: title.trim(),
            url: url.trim(),
          });
        }
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error importing bookmarks:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dialog-background rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Import Bookmarks</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2">
              Paste bookmarks (Title,URL per line):
            </label>
            <textarea
              className="w-full h-40 p-2 border border-border-default rounded bg-input-background text-text-primary"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Google,https://google.com\nFacebook,https://facebook.com"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-4 py-2 bg-button-secondBg rounded"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-button-bg text-text-primary rounded"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Importing..." : "Import"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const GridHeader: React.FC<{
  folderId: string;
  folder: any;
  depth: number;
}> = ({ folderId, folder, depth }) => {
  const [showImportDropdown, setShowImportDropdown] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);

  const handleAddFolder = async () => {
    if (depth >= 2) {
      alert("Cannot create folder beyond level 2");
      return;
    }

    const name = prompt("Enter folder name:");
    if (!name) return;

    await BookmarkService.createFolder({ title: name, parentId: folderId });
    window.location.reload();
  };

  return (
    <div className="grid-header flex items-center justify-between mb-4">
      <h3 className="grid-header-title text-xl font-semibold text-text-primary">
        {folder?.title || "All Bookmarks"}
      </h3>

      {folder?.id !== "temp" && (
        <div className="grid-header-actions flex gap-2">
          <button
            className="px-4 py-2 bg-button-bg hover:bg-button-bgHover text-button-bgText rounded-lg"
            onClick={() => alert("Add bookmark form will open here")}
          >
            + Bookmark
          </button>

          <button
            className="px-4 py-2 bg-button-bg hover:bg-button-bgHover text-button-bgText rounded-lg"
            onClick={handleAddFolder}
          >
            + Folder
          </button>

          <button
            className="px-4 py-2 bg-button-bg hover:bg-button-bgHover text-button-bgText rounded-lg"
            onClick={() => setShowImportDropdown(!showImportDropdown)}
          >
            + Import
          </button>

          {showImportDropdown && (
            <div className="import-dropdown absolute right-0 top-10 bg-dropdown-background rounded-md shadow-lg z-50 border min-w-[150px]">
              <button
                className="w-full text-left px-4 py-2 hover:bg-dropdown-itemHover"
                onClick={() => {
                  setShowImportForm(true);
                  setShowImportDropdown(false);
                }}
              >
                From Text
              </button>
            </div>
          )}
        </div>
      )}
      {showImportForm && (
        <ImportForm
          parentId={folderId}
          onClose={() => setShowImportForm(false)}
          onSuccess={() => window.location.reload()}
        />
      )}
    </div>
  );
};

const BookmarkLayout: React.FC<{
  folderId: string | null;
  folders: BookmarkNode[];
}> = ({ folderId, folders }) => {
  const [foldersList, setFoldersList] = useState<FolderModel[]>([]);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [activeType, setActiveType] = useState<string | null>(null);
  const [dragPayload, setDragPayload] = useState<any | null>(null);
  const [columnCount, setColumnCount] = useState<number>(4);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [editBookmark, setEditBookmark] = useState<{
    id: string;
    title: string;
    url?: string;
    parentId: string;
  } | null>(null);

  const findSelectedFolder = (
    nodes: BookmarkNode[],
    id: string
  ): BookmarkNode | undefined => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findSelectedFolder(node.children, id);
        if (found) return found;
      }
    }
    return undefined;
  };

  const selectedFolder = folderId
    ? findSelectedFolder(folders, folderId)
    : undefined;

  const [highlightFolderId, setHighlightFolderId] = useState<string | null>(
    null
  );
  const [, setHighlightColumn] = useState<number | null>(null);
  const [, setInsertHint] = useState<{ column: number; index: number } | null>(
    null
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  useEffect(() => {
    const initList = async () => {
      if (!folderId) {
        setFoldersList([]);
        return;
      }

      const findNode = (
        nodes: BookmarkNode[],
        id: string
      ): BookmarkNode | undefined => {
        for (const node of nodes) {
          if (node.id === id) return node;
          if (node.children) {
            const found = findNode(node.children, id);
            if (found) return found;
          }
        }
      };

      const selected = findNode(folders, folderId);
      if (!selected) {
        setFoldersList([]);
        return;
      }

      const directBookmarks: BookmarkNode[] =
        selected.children?.filter((c) => c.url) || [];
      const subfolders: BookmarkNode[] =
        selected.children?.filter((c) => !c.url) || [];
      const subfolderModels: FolderModel[] = subfolders.map((s) => ({
        id: s.id,
        title: s.title,
        parentId: folderId,
        bookmarks: s.children?.filter((c) => c.url) || [],
      }));

      const mapped: FolderModel[] = [
        ...(directBookmarks.length > 0
          ? [
              {
                id: TEMP_FOLDER_ID,
                title: "Temp",
                parentId: folderId,
                bookmarks: directBookmarks,
              },
            ]
          : []),
        ...subfolderModels,
      ];

      setFoldersList(mapped);
    };

    initList();
  }, [folders, folderId]);

  useEffect(() => {
    const update = () => {
      const w = gridRef.current?.clientWidth || window.innerWidth;
      if (w < 640) setColumnCount(1);
      else if (w < 768) setColumnCount(2);
      else if (w < 1024) setColumnCount(3);
      else setColumnCount(4);
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const columns: FolderModel[][] = Array.from(
    { length: columnCount },
    () => []
  );
  foldersList.forEach((f, i) => {
    columns[i % columnCount].push(f);
  });

  const customCollisionDetection: any = ({
    droppableRects,
    pointerCoordinates,
  }: any) => {
    if (!pointerCoordinates) return [];
    const { x, y } = pointerCoordinates;
    const collisions: Collision[] = [];

    for (const [id, rect] of droppableRects.entries()) {
      if (
        x >= rect.left &&
        x <= rect.right &&
        y >= rect.top &&
        y <= rect.bottom
      ) {
        collisions.push({ id });
      }
    }

    const gapCollision = collisions.find((c) =>
      String(c.id).startsWith("gap-")
    );
    if (gapCollision) return [gapCollision];

    const bookmarkCollision = collisions.find((c) =>
      String(c.id).startsWith("bookmark-")
    );
    if (bookmarkCollision) return [bookmarkCollision];

    return collisions.length ? [collisions[0]] : [];
  };

  const handleDragStart = (ev: DragStartEvent) => {
    const { active } = ev;
    const t = (active.data as any).current?.type || null;
    if (t !== "bookmark") return;
    setActiveId(active.id);
    setActiveType(t);
    setDragPayload((active.data as any).current?.payload || null);
  };

  const handleDragOver = (ev: DragOverEvent) => {
    const { active, over } = ev;
    setHighlightFolderId(null);
    setHighlightColumn(null);
    setInsertHint(null);
    if (!over) return;

    const overData = (over.data as any).current;
    if (!overData) return;

    if ((active.data as any).current?.type === "bookmark") {
      if (overData.zone === "gap") {
        setHighlightColumn(overData.column);
        setInsertHint({ column: overData.column, index: overData.index });
        return;
      }
      if (overData.zone === "folder-head" || overData.zone === "folder-body") {
        setHighlightFolderId(overData.folderId);
      }
      return;
    }

    if ((active.data as any).current?.type === "folder") {
      if (overData.type === "gap") {
        setHighlightColumn(overData.column);
        setInsertHint({ column: overData.column, index: overData.index });
        return;
      }
      if (overData.zone === "folder-head" || overData.zone === "folder-any") {
        setHighlightColumn(overData.column ?? null);
        setInsertHint({
          column: overData.column ?? 0,
          index: overData.folderIndex ?? 0,
        });
        return;
      }
    }
  };

  const handleDragEnd = async (ev: DragEndEvent) => {
    const { active, over } = ev;

    if ((active.data as any).current?.type === "folder") {
      const folderIdRaw = String(active.id);
      if (folderIdRaw === TEMP_FOLDER_ID) {
        setActiveId(null);
        setActiveType(null);
        setDragPayload(null);
        setInsertHint(null);
        return;
      }

      window.location.reload();
      const fromIndex = (active.data as any).current.folderIndex as number;
      let toIndex: number;

      if (!over) {
        toIndex = foldersList.length - 1;
      } else {
        const overData = (over.data as any).current;
        if (overData.folderId === TEMP_FOLDER_ID) {
          toIndex = foldersList.length - 1;
        } else {
          toIndex = overData.folderIndex as number;
        }
      }

      try {
        if (typeof chrome !== "undefined" && chrome.bookmarks) {
          await new Promise((res, rej) =>
            chrome.bookmarks.move(
              folderIdRaw,
              { parentId: folderId!, index: toIndex },
              (node) => {
                if (chrome.runtime.lastError) rej(chrome.runtime.lastError);
                else res(node);
              }
            )
          );
        }
      } catch (err) {
        console.warn("[BookmarkLayout] chrome folder move error", err);
      }

      setFoldersList((prev) => arrayMove(prev, fromIndex, toIndex));
      setActiveId(null);
      setActiveType(null);
      setDragPayload(null);
      setInsertHint(null);
      return;
    }

    if ((active.data as any).current?.type !== "bookmark") {
      setActiveId(null);
      setActiveType(null);
      setDragPayload(null);
      setInsertHint(null);
      return;
    }

    setHighlightFolderId(null);
    setHighlightColumn(null);
    const payload = (active.data as any).current.payload as BookmarkNode;
    const fromParent = payload.parentId || "";

    if (!over) {
      await moveBookmark(payload.id, fromParent, folderId!);
      setActiveId(null);
      setActiveType(null);
      setDragPayload(null);
      setInsertHint(null);
      return;
    }

    const overData = (over.data as any).current;
    if ((active.data as any).current?.type === "bookmark") {
      let toParentRaw = TEMP_FOLDER_ID;
      let dropIndex: number | undefined;

      if (overData?.folderId) {
        toParentRaw = overData.folderId as string;
      }
      if (overData?.zone === "gap") {
        dropIndex = overData.index as number;
      }
      await moveBookmark(payload.id, fromParent, toParentRaw, dropIndex);
    }

    setActiveId(null);
    setActiveType(null);
    setDragPayload(null);
    setInsertHint(null);
  };

  const moveBookmark = async (
    bookmarkId: string,
    fromParent: string,
    toParent: string,
    toIndex?: number
  ) => {
    if (fromParent === toParent) return;

    const realToParent = toParent === TEMP_FOLDER_ID ? folderId! : toParent;
    try {
      if (typeof chrome !== "undefined" && chrome.bookmarks) {
        await new Promise((res, rej) =>
          chrome.bookmarks.move(
            bookmarkId,
            { parentId: realToParent, index: toIndex },
            (node) => {
              if (chrome.runtime.lastError) rej(chrome.runtime.lastError);
              else res(node);
            }
          )
        );
      }
    } catch (err) {
      console.warn("[BookmarkLayout] chrome move error", err);
    }

    setFoldersList((prev) => {
      const copy = prev.map((p) => ({
        ...p,
        bookmarks: [...p.bookmarks],
      }));

      const sourceFolder = copy.find((c) => c.id === fromParent);
      if (sourceFolder) {
        sourceFolder.bookmarks = sourceFolder.bookmarks.filter(
          (b) => b.id !== bookmarkId
        );
      }

      const movedBookmark: BookmarkNode =
        dragPayload?.id === bookmarkId
          ? (dragPayload as BookmarkNode)
          : {
              id: bookmarkId,
              title: "Untitled",
              url: undefined,
              parentId: realToParent,
            };

      const targetFolder = copy.find((c) => c.id === toParent);
      if (targetFolder) {
        targetFolder.bookmarks = [movedBookmark, ...targetFolder.bookmarks];
      }

      if (toParent === TEMP_FOLDER_ID) {
        const rootFolder = copy.find((c) => c.id === TEMP_FOLDER_ID);
        if (rootFolder) {
          rootFolder.bookmarks = [
            movedBookmark,
            ...rootFolder.bookmarks.filter((b) => b.id !== bookmarkId),
          ];
        }
      }

      return copy;
    });
  };

  const handleFolderRename = async (id: string, newTitle: string) => {
    if (typeof chrome !== "undefined" && chrome.bookmarks?.update) {
      await new Promise<void>((resolve, reject) =>
        chrome.bookmarks.update(id, { title: newTitle }, () =>
          chrome.runtime.lastError
            ? reject(chrome.runtime.lastError)
            : resolve()
        )
      );
    }
    setFoldersList((list) =>
      list.map((f) => (f.id === id ? { ...f, title: newTitle } : f))
    );
  };

  const handleFolderDelete = async (id: string) => {
    if (typeof chrome !== "undefined" && chrome.bookmarks?.removeTree) {
      await new Promise<void>((resolve, reject) =>
        chrome.bookmarks.removeTree(id, () =>
          chrome.runtime.lastError
            ? reject(chrome.runtime.lastError)
            : resolve()
        )
      );
    }
    setFoldersList((list) => list.filter((f) => f.id !== id));
  };

  return (
    <div className="flex flex-col">
      <div className="pb-4">
        <GridHeader folderId={folderId!} folder={selectedFolder} depth={0} />
      </div>
      <div
        ref={gridRef}
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
        }}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={customCollisionDetection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
        >
          {foldersList.length === 0 && (
            <div className="col-span-full">
              <EmptyState />
            </div>
          )}
          {columns.map((col, colIndex) => (
            <div key={colIndex} className="flex flex-col space-y-4">
              {col.map((folder) => {
                if (
                  folder.id === TEMP_FOLDER_ID &&
                  folder.bookmarks.length === 0
                ) {
                  return null;
                }
                return (
                  <FolderCard
                    key={folder.id}
                    onBookmarkEdit={(item) => setEditBookmark(item)}
                    folder={folder}
                    columnIndex={colIndex}
                    folderIndex={foldersList.findIndex(
                      (f) => f.id === folder.id
                    )}
                    isHighlighted={folder.id === highlightFolderId}
                    activeId={activeId}
                    activeType={activeType}
                    onBookmarkMoveRequested={(bookmarkId, fromParentId) =>
                      moveBookmark(bookmarkId, fromParentId, folder.id)
                    }
                    onFolderInsertHint={(idx) => {
                      setHighlightColumn(colIndex);
                      setInsertHint({ column: colIndex, index: idx });
                    }}
                    onFolderRename={handleFolderRename}
                    onFolderDelete={handleFolderDelete}
                  />
                );
              })}
            </div>
          ))}

          <DragOverlay>
            {activeType === "bookmark" && dragPayload ? (
              <BookmarkCard
                item={dragPayload as BookmarkNode}
                parentId={(dragPayload as BookmarkNode).parentId}
                depth={1}
                isDragging
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
      {editBookmark && (
        <BookmarkForm
          parentId={editBookmark.parentId}
          initialData={{
            title: editBookmark.title,
            url: editBookmark.url || "",
          }}
          onClose={() => setEditBookmark(null)}
          onSuccess={() => window.location.reload()}
        />
      )}
    </div>
  );
};

const BookmarkSearchLayout: React.FC<{
  searchQuery: string;
  folders: BookmarkNode[];
  onSelectFolder: (id: string) => void;
  onBookmarkEdit: (item: BookmarkNode) => void;
}> = ({ searchQuery, folders, onBookmarkEdit }) => {
  const sidebarFolders = useMemo<BookmarkNode[]>(() => {
    const result: BookmarkNode[] = [];
    const bar = folders.find((f) =>
      f.title.toLowerCase().includes("bookmarks bar")
    );
    if (bar) result.push(bar);
    const other = folders.find((f) =>
      f.title.toLowerCase().includes("other bookmarks")
    );
    if (other?.children) {
      other.children
        .filter((child) => !child.url)
        .forEach((child) => result.push(child));
    }
    return result;
  }, [folders]);

  const searchResults = useMemo(() => {
    if (!searchQuery) return [];

    const query = searchQuery.toLowerCase();
    const results: BookmarkNode[] = [];

    const searchInNode = (node: BookmarkNode) => {
      const matches =
        node.title.toLowerCase().includes(query) ||
        (node.url && node.url.toLowerCase().includes(query));

      if (matches) {
        results.push(node);
      }
      if (node.children) {
        node.children.forEach(searchInNode);
      }
    };

    folders.forEach(searchInNode);
    return results;
  }, [searchQuery, folders]);

  const groupedResults = useMemo(() => {
    const allNodes: BookmarkNode[] = [];
    const collect = (nodes: BookmarkNode[]) => {
      nodes.forEach((n) => {
        allNodes.push(n);
        if (n.children) collect(n.children);
      });
    };
    collect(folders);

    const sidebarIds = new Set(sidebarFolders.map((f) => f.id));
    const groupsMap: Record<
      string,
      { rootFolder: BookmarkNode; folders: Map<string, BookmarkNode[]> }
    > = {};

    for (const result of searchResults) {
      let ancestor = result;
      while (ancestor.parentId) {
        if (sidebarIds.has(ancestor.id)) break;
        const parent = allNodes.find((n) => n.id === ancestor.parentId);
        if (!parent) break;
        ancestor = parent;
      }
      const rootId = ancestor.id;
      const rootFolder = allNodes.find((n) => n.id === rootId)!;
      if (!groupsMap[rootId]) {
        groupsMap[rootId] = { rootFolder, folders: new Map() };
      }
      const grp = groupsMap[rootId];
      const fid = result.parentId || rootId;
      if (!grp.folders.has(fid)) grp.folders.set(fid, []);
      grp.folders.get(fid)!.push(result);
    }

    return Object.values(groupsMap)
      .map(({ rootFolder, folders: subs }) => ({
        rootFolder,
        folders: Array.from(subs.entries()).map(([folderId, bookmarks]) => ({
          folderId,
          bookmarks,
        })),
      }))
      .filter((group) => sidebarIds.has(group.rootFolder.id))
      .sort((a, b) => b.folders.length - a.folders.length);
  }, [searchResults, folders, sidebarFolders]);

  if (!searchQuery.trim()) return null;

  if (groupedResults.length === 0) {
    return (
      <div className="search-results-container mt-6 text-center py-10">
        <p className="text-gray-500">No bookmarks found.</p>
      </div>
    );
  }

  return (
    <div className="search-results-container mt-6">
      {groupedResults
        .filter(
          (group) =>
            !group.rootFolder.title.toLowerCase().includes("other bookmarks")
        )
        .map((group) => (
          <div key={group.rootFolder.id} className="mb-10">
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-xl font-bold text-text-primary">
                {group.rootFolder.title}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {group.folders
                .filter(({ folderId }) => {
                  const f =
                    folders.find((f) => f.id === folderId) ||
                    searchResults.find((r) => r.id === folderId);
                  return (
                    f && !f.title.toLowerCase().includes("other bookmarks")
                  );
                })
                .map(({ folderId, bookmarks }) => {
                  const folder =
                    folders.find((f) => f.id === folderId) ||
                    searchResults.find((r) => r.id === folderId);
                  return folder ? (
                    <FolderCard
                      key={`${group.rootFolder.id}-${folderId}`}
                      folder={{
                        id: folder.id,
                        title: folder.title,
                        bookmarks,
                      }}
                      onBookmarkEdit={onBookmarkEdit}
                      hideActions={true}
                      alwaysExpand={true}
                    />
                  ) : null;
                })}
            </div>
          </div>
        ))}
    </div>
  );
};

const MainLayout: React.FC<{
  folders: BookmarkNode[];
  onSelectFolder: (id: string) => void;
  onAddFolder: (title: string) => Promise<void>;
  children: React.ReactNode;
}> = ({ folders, onSelectFolder, onAddFolder, children }) => {
  const [showThemeDrawer, setShowThemeDrawer] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        folders={folders}
        onSelectFolder={onSelectFolder}
        onAddFolder={onAddFolder}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onOpenTheme={() => setShowThemeDrawer(true)} />
        <main className="flex-1 overflow-y-auto p-4">
          <div className="mx-auto w-full max-w-none">{children}</div>
        </main>
      </div>
      <ThemeDrawer
        isOpen={showThemeDrawer}
        onClose={() => setShowThemeDrawer(false)}
      />
    </div>
  );
};

const BookmarkManager: React.FC = () => {
  const {
    folders,
    selectedFolder,
    loading,
    searchQuery,
    onSelectFolder,
    onAddFolder,
    onBookmarkEdit,
  } = useBookmark();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <MainLayout
      folders={folders}
      onSelectFolder={onSelectFolder}
      onAddFolder={onAddFolder}
    >
      {searchQuery ? (
        <BookmarkSearchLayout
          searchQuery={searchQuery}
          folders={folders}
          onSelectFolder={onSelectFolder}
          onBookmarkEdit={onBookmarkEdit}
        />
      ) : (
        <BookmarkLayout folderId={selectedFolder} folders={folders} />
      )}
    </MainLayout>
  );
};

export default BookmarkManager;
