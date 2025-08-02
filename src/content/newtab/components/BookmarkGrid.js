import { renderGridHeader } from './GridHeader.js';
import { updateGridTitle } from './GridTitle.js';
import { createEmptyState } from './EmptyState.js';
import { createBookmarkCard } from './BookmarkCard.js';
import { createFolderCard } from './FolderCard.js';

/**
 * Renders the bookmark grid showing folder and bookmark cards.
 * @param {Array} items - List of bookmark items.
 * @param {number} depth - Current folder depth.
 * @param {Object|null} folder - Current folder object context.
 */
export function renderBookmarkGrid(items, depth = 0, folder = null) {
  const container = document.getElementById('bookmark-grid');
  const parentId = container.dataset.parentId || null;
  container.dataset.depth = depth.toString();
  container.innerHTML = '';

  // Header
  const header = renderGridHeader(depth, parentId, renderBookmarkGrid);
  container.append(header);

  // Title & breadcrumb
  const groupTitle = folder && folder.title ? folder.title : container.dataset.groupTitle || '';
  container.dataset.groupTitle = groupTitle;
  updateGridTitle(depth, groupTitle);

  // Empty state
  if (!items || items.length === 0) {
    container.append(createEmptyState());
    return;
  }

  // Depth 0: top-level grid view
  if (depth === 0) {
    const grid = document.createElement('div');
    grid.className = 'bookmarks-grid drop-target';

    const folders = items.filter(item => !item.url);
    const bookmarks = items.filter(item => item.url);

    // Top-level: bookmarks group
    if (bookmarks.length > 0) {
      const tempGroup = { id: 'temp-group', title: 'Bookmarks', children: bookmarks };
      const tempCard = createFolderCard(tempGroup);
      grid.append(tempCard);
    }

    // Render folder cards
    folders.forEach(childFolder => {
      const card = createFolderCard(childFolder);
      grid.append(card);
    });

    container.append(grid);
    return;
  }

  // Depth >=1: list and subfolder view
  const gridList = document.createElement('div');
  gridList.className = 'bookmark-list drop-target';

  // Direct bookmarks (level1)
  const bookmarksLevel1 = items.filter(item => item.url);
  if (bookmarksLevel1.length > 0) {
    const tempGroup = { id: 'temp', title: 'Temp', children: bookmarksLevel1 };
    gridList.append(createFolderCard(tempGroup));
  }

  // Render subfolder cards with their enriched children
  const level2Folders = items.filter(item => !item.url);
  level2Folders.forEach(subFolder => {
    gridList.append(createFolderCard(subFolder));
  });

  container.append(gridList);
}