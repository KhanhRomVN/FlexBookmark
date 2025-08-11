import React, { useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragOverEvent,
  DragStartEvent,
  UniqueIdentifier,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  Collision,
  MeasuringStrategy,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import BookmarkCard from "./BookmarkCard";
import FolderCard from "./FolderCard";
import EmptyState from "./EmptyState";
import GridHeader from "./GridHeader";
import { motion } from "framer-motion";

/**
 * Full-featured single DndContext layout.
 * - Two draggable types: "bookmark" and "folder"
 * - Custom collisionDetector to detect folder head/body and gaps between folders
 * - Persist folder order via chrome.bookmarks.move when reordering within same parent
 */

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

  // UI hints
  const [highlightFolderId, setHighlightFolderId] = useState<string | null>(
    null
  );
  const [highlightColumn, setHighlightColumn] = useState<number | null>(null);
  const [insertHint, setInsertHint] = useState<{
    column: number;
    index: number;
  } | null>(null);

  // sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Initialize foldersList from prop `folders`
  useEffect(() => {
    (async () => {
      try {
        const mapped: FolderModel[] = await Promise.all(
          folders.map(async (f) => {
            // build bookmarks list: prefer children in prop, otherwise fetch
            let bookmarks: BookmarkNode[] = [];
            if (f.children && f.children.length > 0) {
              bookmarks = f.children.filter(
                (c) => (c as any).url
              ) as unknown as BookmarkNode[];
            } else if (typeof chrome !== "undefined" && chrome.bookmarks) {
              try {
                const children = await new Promise<
                  chrome.bookmarks.BookmarkTreeNode[]
                >((res) => chrome.bookmarks.getChildren(f.id, res));
                bookmarks = (children || []).filter(
                  (c) => (c as any).url
                ) as BookmarkNode[];
              } catch (err) {
                console.warn("[BookmarkLayout] chrome.getChildren fail", err);
              }
            }
            return {
              id: f.id,
              title: f.title,
              parentId: (f as any).parentId || folderId || undefined,
              bookmarks,
            } as FolderModel;
          })
        );

        // ensure temp folder exists at end
        const hasTemp = mapped.some((m) => m.id === TEMP_FOLDER_ID);
        if (!hasTemp) {
          mapped.push({
            id: TEMP_FOLDER_ID,
            title: "Temp",
            parentId: folderId || undefined,
            bookmarks: [],
          } as FolderModel);
        }

        setFoldersList(mapped);
        console.debug("[BookmarkLayout] init foldersList", mapped);
      } catch (error) {
        console.error("[BookmarkLayout] init error", error);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folders]);

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
  // We'll use pointer coordinates to detect:
  // - if pointer is over folder head -> return that folder head id
  // - if pointer is over folder body -> return that folder body id
  // - if pointer is between folders in a column -> return synthetic "gap" id like gap-col-<c>-<idx>
  // Implementation relies on getClientRect of droppables provided by DnD kit.

  const customCollisionDetection = ({
    droppableRects,
    pointerCoordinates,
  }: {
    droppableRects: Map<string, DOMRect>;
    pointerCoordinates: { x: number; y: number } | null;
  }): Collision[] | null => {
    if (!pointerCoordinates) return null;
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

    // prioritize bookmark droppables
    const bookmarkCollision = collisions.find((c) =>
      String(c.id).startsWith("bookmark-")
    );
    if (bookmarkCollision) {
      return [bookmarkCollision];
    }
    // return first collision if exists
    return collisions.length ? [collisions[0]] : null;
  };

  // --------- Drag handlers ----------
  const handleDragStart = (ev: DragStartEvent) => {
    const { active } = ev;
    setActiveId(active.id);
    const t = (active.data as any).current?.type || null;
    setActiveType(t);
    setDragPayload((active.data as any).current?.payload || null);
    console.log("[BookmarkLayout] dragStart", {
      id: active.id,
      type: t,
      payload: (active.data as any).current?.payload,
    });
  };

  const handleDragOver = (ev: DragOverEvent) => {
    const { active, over } = ev;
    setHighlightFolderId(null);
    setHighlightColumn(null);
    setInsertHint(null);

    if (!over) {
      // pointer over empty space - do nothing (onDragEnd will handle move-to-temp)
      return;
    }

    const overData = (over.data as any).current;
    console.debug("[BookmarkLayout] dragOver", {
      active: active.id,
      over: over.id,
      overData,
    });

    if (!overData) return;

    // If dragging bookmark
    if ((active.data as any).current?.type === "bookmark") {
      // If over folder head/body -> highlight folder
      if (overData.zone === "folder-head" || overData.zone === "folder-body") {
        setHighlightFolderId(overData.folderId);
      }
      return;
    }

    // If dragging folder
    if ((active.data as any).current?.type === "folder") {
      if (overData.type === "gap") {
        setHighlightColumn(overData.column);
        setInsertHint({ column: overData.column, index: overData.index });
        return;
      }
      if (overData.zone === "folder-head" || overData.zone === "folder-any") {
        setHighlightColumn(overData.column ?? null);
        // insert hint at that folder index
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
    console.log("[BookmarkLayout] dragEnd start", {
      activeId: active.id,
      overId: over?.id,
      activeData: (active.data as any).current,
      overData: (over?.data as any)?.current,
      insertHint,
    });

    // cleanup UI hints
    setHighlightFolderId(null);
    setHighlightColumn(null);

    // If no target (dropped in empty area)
    if (!over) {
      if ((active.data as any).current?.type === "bookmark") {
        // move bookmark -> TEMP
        const payload = (active.data as any).current.payload as BookmarkNode;
        const fromParent = payload.parentId || "";
        console.log(
          "[BookmarkLayout] bookmark dropped empty -> move to TEMP",
          payload.id
        );
        await moveBookmark(payload.id, fromParent, TEMP_FOLDER_ID);
      } else if ((active.data as any).current?.type === "folder") {
        // folder dropped empty: if we have insertHint, insert accordingly; else append to end column 0
        if (insertHint) {
          await insertFolderAt(
            active.id as string,
            insertHint.column,
            insertHint.index
          );
        } else {
          await insertFolderAt(active.id as string, 0, columns[0].length);
        }
      }
      setActiveId(null);
      setActiveType(null);
      setDragPayload(null);
      setInsertHint(null);
      return;
    }

    const overData = (over.data as any).current;

    // Bookmark dropped
    if ((active.data as any).current?.type === "bookmark") {
      const payload = (active.data as any).current.payload as BookmarkNode;
      const fromParent = payload.parentId || "";
      // If over folder head/body -> move to that folder
      if (
        overData?.zone === "folder-head" ||
        overData?.zone === "folder-body"
      ) {
        const toFolder = overData.folderId as string;
        if (toFolder === fromParent) {
          console.log(
            "[BookmarkLayout] bookmark dropped to same folder -> no-op",
            payload.id
          );
        } else {
          console.log(
            "[BookmarkLayout] move bookmark",
            payload.id,
            "->",
            toFolder
          );
          await moveBookmark(payload.id, fromParent, toFolder);
        }
      } else if (overData?.type === "gap") {
        console.log(
          "[BookmarkLayout] bookmark dropped onto gap -> move to TEMP",
          payload.id
        );
        await moveBookmark(payload.id, fromParent, TEMP_FOLDER_ID);
      } else {
        console.log(
          "[BookmarkLayout] bookmark dropped unknown -> move to TEMP",
          payload.id
        );
        await moveBookmark(payload.id, fromParent, TEMP_FOLDER_ID);
      }

      setActiveId(null);
      setActiveType(null);
      setDragPayload(null);
      setInsertHint(null);
      return;
    }

    // Folder dropped
    if ((active.data as any).current?.type === "folder") {
      const fromFolderId = active.id as string;
      // Dropped onto folder head/any -> swap positions (reorder)
      if (overData?.zone === "folder-head" || overData?.zone === "folder-any") {
        const toFolderId = overData.folderId as string;
        console.log(
          "[BookmarkLayout] folder drop onto folder -> reorder",
          fromFolderId,
          "=>",
          toFolderId
        );
        if (fromFolderId === toFolderId) {
          console.log("[BookmarkLayout] folder dropped on itself -> no-op");
        } else {
          // reorder foldersList: find indices and move
          const fromIdx = foldersList.findIndex((f) => f.id === fromFolderId);
          const toIdx = foldersList.findIndex((f) => f.id === toFolderId);
          if (fromIdx >= 0 && toIdx >= 0) {
            const newOrder = arrayMove(foldersList, fromIdx, toIdx);
            setFoldersList(newOrder);
            // persist order if parentId same
            // We try to move folder nodes within the same parent to correct index
            const fromParent = foldersList[fromIdx].parentId || folderId;
            const toParent = foldersList[toIdx].parentId || folderId;
            if (fromParent && toParent && fromParent === toParent) {
              // call chrome.bookmarks.move for each folder to its index (expensive but explicit)
              try {
                await Promise.all(
                  newOrder.map(async (node, idx) => {
                    if (!node.parentId) return;
                    await new Promise((res, rej) =>
                      chrome.bookmarks.move(
                        node.id,
                        { parentId: node.parentId || fromParent, index: idx },
                        () => {
                          if (chrome.runtime.lastError) {
                            console.warn(
                              "[BookmarkLayout] chrome.move folder warning",
                              chrome.runtime.lastError
                            );
                            // not rejecting to allow best-effort
                            res(true);
                          } else res(true);
                        }
                      )
                    );
                  })
                );
                console.log(
                  "[BookmarkLayout] folder order persisted to chrome"
                );
              } catch (err) {
                console.error(
                  "[BookmarkLayout] persist folder order fail",
                  err
                );
              }
            } else {
              console.debug(
                "[BookmarkLayout] folder parents differ - skipping persist",
                { fromParent, toParent }
              );
            }
          } else {
            console.warn(
              "[BookmarkLayout] cannot find folder indices for reorder",
              { fromIdx, toIdx }
            );
          }
        }
      } else if (overData?.type === "gap") {
        console.log(
          "[BookmarkLayout] folder dropped into gap -> insertAt",
          overData.column,
          overData.index
        );
        await insertFolderAt(fromFolderId, overData.column, overData.index);
      } else {
        console.log("[BookmarkLayout] folder drop unknown -> no-op");
      }

      setActiveId(null);
      setActiveType(null);
      setDragPayload(null);
      setInsertHint(null);
      return;
    }

    // fallback cleanup
    setActiveId(null);
    setActiveType(null);
    setDragPayload(null);
    setInsertHint(null);
  };

  // ---------- Helpers: move bookmark between folders and update UI + chrome persist ----------
  const moveBookmark = async (
    bookmarkId: string,
    fromParent: string,
    toParent: string
  ) => {
    console.log("[BookmarkLayout] request moveBookmark", {
      bookmarkId,
      fromParent,
      toParent,
    });
    try {
      if (fromParent === toParent) {
        console.debug("[BookmarkLayout] moveBookmark: same parent skip");
        return;
      }

      // call chrome.bookmarks.move if present
      if (typeof chrome !== "undefined" && chrome.bookmarks) {
        try {
          await new Promise((res, rej) =>
            chrome.bookmarks.move(
              bookmarkId,
              { parentId: toParent },
              (node) => {
                if (chrome.runtime.lastError) {
                  console.warn(
                    "[BookmarkLayout] chrome.bookmarks.move error",
                    chrome.runtime.lastError
                  );
                  rej(chrome.runtime.lastError);
                } else res(node);
              }
            )
          );
        } catch (err) {
          console.error(
            "[BookmarkLayout] chrome move fail, continuing with UI update",
            err
          );
        }
      } else {
        console.debug("[BookmarkLayout] chrome undefined - skip actual move");
      }

      // update UI: remove from fromParent folder and add to toParent at front
      setFoldersList((prev) => {
        const copy = prev.map((p) => ({ ...p, bookmarks: [...p.bookmarks] }));
        // remove
        const s = copy.find((c) => c.id === fromParent);
        if (s) s.bookmarks = s.bookmarks.filter((b) => b.id !== bookmarkId);
        // find moved item data: try dragPayload or fallback minimal
        const moved = (dragPayload && dragPayload.id === bookmarkId
          ? dragPayload
          : null) || { id: bookmarkId, title: "Untitled", url: undefined };
        const t =
          copy.find((c) => c.id === toParent) ||
          copy.find((c) => c.id === TEMP_FOLDER_ID);
        if (t) t.bookmarks = [moved, ...t.bookmarks];
        else
          console.warn(
            "[BookmarkLayout] target folder not found to insert moved bookmark",
            toParent
          );
        return copy;
      });

      console.log("[BookmarkLayout] moveBookmark UI updated");
    } catch (error) {
      console.error("[BookmarkLayout] moveBookmark error", error);
    }
  };

  // ---------- Insert folder into column at idx ----------
  const insertFolderAt = async (
    folderId: string,
    column: number,
    index: number
  ) => {
    console.log("[BookmarkLayout] insertFolderAt", { folderId, column, index });
    try {
      // Build columns array from current foldersList
      const cols: FolderModel[][] = Array.from(
        { length: columnCount },
        () => [] as FolderModel[]
      );
      foldersList.forEach((f, i) => cols[i % columnCount].push(f));

      // find and remove the folder from its current column
      let removed: FolderModel | null = null;
      for (let c = 0; c < cols.length; c++) {
        const i = cols[c].findIndex((x) => x.id === folderId);
        if (i >= 0) {
          removed = cols[c].splice(i, 1)[0];
          break;
        }
      }
      // if not found attempt to find in foldersList
      if (!removed) {
        removed = foldersList.find((f) => f.id === folderId) || null;
      }
      if (!removed) {
        console.warn(
          "[BookmarkLayout] insertFolderAt cannot find folder",
          folderId
        );
        return;
      }

      // clamp index
      const targetCol = cols[Math.max(0, Math.min(column, cols.length - 1))];
      const insertionIndex = Math.max(0, Math.min(index, targetCol.length));
      targetCol.splice(insertionIndex, 0, removed);

      // rebuild flat list by round robin reading columns
      const maxLen = Math.max(...cols.map((c) => c.length));
      const newFlat: FolderModel[] = [];
      for (let r = 0; r < maxLen; r++) {
        for (let c = 0; c < cols.length; c++) {
          if (cols[c][r]) newFlat.push(cols[c][r]);
        }
      }

      setFoldersList(newFlat);

      // persist folder order if possible: if all folders share same parent, move them in order
      const parentIds = new Set(newFlat.map((n) => n.parentId || folderId));
      if (parentIds.size === 1) {
        const parent = Array.from(parentIds)[0];
        // move each folder to index 0..n
        try {
          await Promise.all(
            newFlat.map(
              (node, idx) =>
                new Promise((res) =>
                  chrome.bookmarks.move(
                    node.id,
                    { parentId: parent, index: idx },
                    () => {
                      // ignore lastError for best-effort
                      res(true);
                    }
                  )
                )
            )
          );
          console.log(
            "[BookmarkLayout] persisted folder order via chrome.bookmarks.move"
          );
        } catch (err) {
          console.error("[BookmarkLayout] persist order error", err);
        }
      } else {
        console.debug(
          "[BookmarkLayout] not persisting order - multiple parentIds",
          Array.from(parentIds)
        );
      }
    } catch (error) {
      console.error("[BookmarkLayout] insertFolderAt error", error);
    }
  };

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
      collisionDetection={customCollisionDetection as any}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
    >
      <div
        id="bookmark-grid"
        className="bookmark-grid"
        data-parent-id={folderId}
      >
        <GridHeader
          folderId={folderId}
          folder={foldersList.find((f) => f.id === folderId) as any}
          depth={0}
        />

        {foldersList.length === 0 ? (
          <EmptyState />
        ) : (
          <div
            ref={gridRef}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4"
          >
            {columns.map((col, colIndex) => (
              <div
                key={colIndex}
                className={`flex flex-col gap-4 p-1 relative ${
                  highlightColumn === colIndex ? "ring-2 ring-blue-300/30" : ""
                }`}
              >
                {col.map((folder, idxInCol) => {
                  const globalIndex = foldersList.findIndex(
                    (f) => f.id === folder.id
                  );
                  // We'll render a small gap droppable region before each folder (we rely on customCollisionDetection to read rects)
                  return (
                    <motion.div
                      key={folder.id}
                      layout
                      initial={false}
                      animate={{}}
                    >
                      {/* Gap region BEFORE folder */}
                      <div
                        id={`gap-${colIndex}-${idxInCol}`}
                        data-gap={`gap-${colIndex}-${idxInCol}`}
                        // style for gap indicator
                        className={`h-2 transition-all ${
                          insertHint &&
                          insertHint.column === colIndex &&
                          insertHint.index === idxInCol
                            ? "bg-blue-200/50 rounded"
                            : "hover:bg-gray-100/20"
                        }`}
                      />
                      <FolderCard
                        folder={folder}
                        columnIndex={colIndex}
                        folderIndex={globalIndex}
                        isHighlighted={highlightFolderId === folder.id}
                        // When FolderCard reports a drop request (native fallback), we forward to moveBookmark
                        onBookmarkMoveRequested={async (
                          bookmarkId: string,
                          fromParentId: string
                        ) => {
                          await moveBookmark(
                            bookmarkId,
                            fromParentId,
                            folder.id
                          );
                        }}
                        onFolderInsertHint={(insertAt) => {
                          setInsertHint({ column: colIndex, index: idxInCol });
                        }}
                      />
                    </motion.div>
                  );
                })}
                {/* Gap at end of column */}
                <div
                  id={`gap-${colIndex}-${col.length}`}
                  className={`h-4 mt-2 ${
                    insertHint &&
                    insertHint.column === colIndex &&
                    insertHint.index === col.length
                      ? "bg-blue-200/50 rounded"
                      : "hover:bg-gray-100/20"
                  }`}
                />
              </div>
            ))}
          </div>
        )}

        <DragOverlay>
          {activeId && dragPayload ? (
            activeType === "bookmark" ? (
              <BookmarkCard
                item={dragPayload}
                parentId={dragPayload.parentId}
                depth={0}
                isDragging
              />
            ) : activeType === "folder" ? (
              <div className="p-2 bg-white rounded shadow-lg">
                <div className="font-medium">
                  {dragPayload?.title || activeId}
                </div>
              </div>
            ) : null
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
};

export default BookmarkLayout;
