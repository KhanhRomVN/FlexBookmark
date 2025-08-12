import React, { useEffect, useRef, useState, Fragment } from "react";
import BookmarkForm from "./BookmarkForm";
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
import type { CollisionDetection } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import BookmarkCard from "./BookmarkCard";
import FolderCard, { GapDropZone } from "./FolderCard";
import EmptyState from "./EmptyState";
import GridHeader from "./GridHeader";
import { motion } from "framer-motion";

interface BookmarkNode {
  parentId: string;
  id: string;
  title: string;
  url?: string;
  children?: BookmarkNode[];
}
interface FolderModel {
  id: string;
  title: string;
  parentId?: string;
  bookmarks: BookmarkNode[];
}
interface BookmarkLayoutProps {
  folderId: string | null; // root parent id for current view
  folders: BookmarkNode[]; // initial folder nodes
}
const TEMP_FOLDER_ID = "temp";

const BookmarkLayout: React.FC<BookmarkLayoutProps> = ({
  folderId,
  folders,
}) => {
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

  // determine selected folder for header
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

  // UI hints
  const [highlightFolderId, setHighlightFolderId] = useState<string | null>(
    null
  );
  const [highlightColumn, setHighlightColumn] = useState<number | null>(null);
  const [insertHint, setInsertHint] = useState<{
    column: number;
    index: number;
  } | null>(null);

  // sensors - only PointerSensor for bookmarks
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  // Initialize foldersList based on selected folder
  useEffect(() => {
    const initList = async () => {
      if (!folderId) {
        setFoldersList([]);
        return;
      }
      // recursively find the selected node in the full tree
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
      // temp container for bookmarks in this folder
      const directBookmarks: BookmarkNode[] =
        selected.children?.filter((c) => c.url) || [];
      // subfolders under selected
      const subfolders: BookmarkNode[] =
        selected.children?.filter((c) => !c.url) || [];
      const subfolderModels: FolderModel[] = subfolders.map((s) => ({
        id: s.id,
        title: s.title,
        parentId: folderId,
        bookmarks: s.children?.filter((c) => c.url) || [],
      }));
      // only include Temp column if there are direct bookmarks
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
      console.debug("[BookmarkLayout] init foldersList for", folderId, mapped);
    };
    initList();
  }, [folders, folderId]);

  // responsive columns
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

  // build columns from foldersList (round-robin)
  const columns: FolderModel[][] = Array.from(
    { length: columnCount },
    () => []
  );
  foldersList.forEach((f, i) => {
    columns[i % columnCount].push(f);
  });

  // --------- Custom collision detection ----------
  const customCollisionDetection: CollisionDetection = ({
    droppableRects,
    pointerCoordinates,
  }) => {
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
    // prioritize gap droppables first
    const gapCollision = collisions.find((c) =>
      String(c.id).startsWith("gap-")
    );
    if (gapCollision) {
      return [gapCollision];
    }
    // then bookmark droppables
    const bookmarkCollision = collisions.find((c) =>
      String(c.id).startsWith("bookmark-")
    );
    if (bookmarkCollision) {
      return [bookmarkCollision];
    }
    return collisions.length ? [collisions[0]] : [];
  };

  // --------- Drag handlers ----------
  const handleDragStart = (ev: DragStartEvent) => {
    const { active } = ev;
    const t = (active.data as any).current?.type || null;
    if (t !== "bookmark") return;
    setActiveId(active.id);
    setActiveType(t);
    setDragPayload((active.data as any).current?.payload || null);
    console.log("[BookmarkLayout] bookmark drag start", active.id);
  };

  const handleDragOver = (ev: DragOverEvent) => {
    const { active, over } = ev;
    setHighlightFolderId(null);
    setHighlightColumn(null);
    setInsertHint(null);
    if (!over) return;
    const overData = (over.data as any).current;
    console.debug("[BookmarkLayout] dragOver", {
      active: active.id,
      over: over.id,
      overData,
    });
    if (!overData) return;
    if ((active.data as any).current?.type === "bookmark") {
      // gap drop between bookmarks
      if (overData.zone === "gap") {
        setHighlightColumn(overData.column);
        setInsertHint({ column: overData.column, index: overData.index });
        return;
      }
      // folder head/body drop
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
    // handle folder drag end (swap or move-to-end), skip Temp
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
      // persist order in Chrome bookmarks
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
    // bookmark drag
    if ((active.data as any).current?.type !== "bookmark") {
      setActiveId(null);
      setActiveType(null);
      setDragPayload(null);
      setInsertHint(null);
      return;
    }
    // cleanup UI hints
    setHighlightFolderId(null);
    setHighlightColumn(null);
    const payload = (active.data as any).current.payload as BookmarkNode;
    const fromParent = payload.parentId || "";
    if (!over) {
      // Sửa tại đây: Sử dụng folderId thay vì TEMP_FOLDER_ID
      console.log(
        "[BookmarkLayout] bookmark dropped empty -> move to ROOT FOLDER",
        payload.id
      );
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

  // Helpers
  const moveBookmark = async (
    bookmarkId: string,
    fromParent: string,
    toParent: string,
    toIndex?: number
  ) => {
    if (fromParent === toParent) return;
    // Sửa tại đây: Chuyển đổi TEMP_FOLDER_ID thành folderId thực
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
    // Cập nhật state (vẫn giữ nguyên logic state)
    setFoldersList((prev) => {
      const copy = prev.map((p) => ({
        ...p,
        bookmarks: [...p.bookmarks],
      }));
      // remove from source folder
      const sourceFolder = copy.find((c) => c.id === fromParent);
      if (sourceFolder) {
        sourceFolder.bookmarks = sourceFolder.bookmarks.filter(
          (b) => b.id !== bookmarkId
        );
      }
      // determine moved bookmark
      const movedBookmark: BookmarkNode =
        dragPayload?.id === bookmarkId
          ? (dragPayload as BookmarkNode)
          : {
              id: bookmarkId,
              title: "Untitled",
              url: undefined,
              parentId: realToParent,
            };
      // add to target folder
      const targetFolder = copy.find((c) => c.id === toParent);
      if (targetFolder) {
        targetFolder.bookmarks = [movedBookmark, ...targetFolder.bookmarks];
      }
      // Nếu target là TEMP_FOLDER_ID, cập nhật folderId thực tế cho cho movedBookmark
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

  return (
    <div className="flex flex-col">
      {/* Header nằm riêng trên cùng */}
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
          collisionDetection={customCollisionDetection as CollisionDetection}
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
                // Ẩn FolderCard Temp nếu không có bookmark
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
    </div>
  );
};

export default BookmarkLayout;
