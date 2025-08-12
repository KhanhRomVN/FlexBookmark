import React, { useMemo } from "react";
import FolderCard from "./FolderCard";
import type { BookmarkNode } from "./BookmarkLayout";

interface BookmarkSearchLayoutProps {
  searchQuery: string;
  folders: BookmarkNode[];
  onSelectFolder: (id: string) => void;
  onBookmarkEdit: (item: BookmarkNode) => void;
}

const BookmarkSearchLayout: React.FC<BookmarkSearchLayoutProps> = ({
  searchQuery,
  folders,
  onSelectFolder,
  onBookmarkEdit,
}) => {
  // Derive sidebar folders (only top-level bar and first-level children under "Other Bookmarks")
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
  // Find all bookmark nodes matching the query
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

  // Group search results under actual sidebar folders
  const groupedResults = useMemo(() => {
    // flatten entire tree for ancestor lookup
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
      // find nearest sidebar ancestor
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

export default BookmarkSearchLayout;
