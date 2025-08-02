import { renderGridHeader } from './GridHeader.js';
import { updateGridTitle } from './GridTitle.js';
import { createEmptyState } from './EmptyState.js';
import { createBookmarkCard } from './BookmarkCard.js';
import { createFolderCard } from './FolderCard.js';

/**
 * Renders the bookmark grid showing folder and bookmark cards.
 * @param {Array} items - List of bookmark items.
 * @param {number} depth - Current folder depth.
 */
export function renderBookmarkGrid(items, depth = 0, folder = null) {
  const container = document.getElementById('bookmark-grid');
  const parentId = container.dataset.parentId || null;
  // update dataset depth for nested creation logic
  container.dataset.depth = depth.toString();

  // Clear existing content
  container.innerHTML = '';

  // Header
  const header = renderGridHeader(depth, parentId, renderBookmarkGrid);
  container.append(header);

  // Title & breadcrumb
  const groupTitle = container.dataset.groupTitle || '';
  updateGridTitle(depth, groupTitle);

  // If viewing a single folder detail, render that folder card and return
  if (folder) {
    const detailGrid = document.createElement('div');
    detailGrid.className = depth === 0 ? 'bookmarks-grid' : 'bookmark-list';
    detailGrid.classList.add('drop-target');
    const detailCard = createFolderCard(folder, () => renderBookmarkGrid(folder.children, depth + 1, folder));
    detailGrid.append(detailCard);
    container.append(detailGrid);
    return;
  }

  // Empty state
  if (!items || items.length === 0) {
    container.append(createEmptyState());
    return;
  }

  // Create grid container
  const grid = document.createElement('div');
  grid.className = depth === 0 ? 'bookmarks-grid' : 'bookmark-list';
  grid.classList.add('drop-target');

  // Separate folders and bookmarks
  const folders = items.filter(item => !item.url);
  const bookmarks = items.filter(item => item.url);

  // Create temporary group for top-level bookmarks
  if (depth === 0 && bookmarks.length > 0) {
    const tempGroup = {
      id: 'temp-group',
      title: 'Temp',
      children: bookmarks
    };
    const tempCard = createFolderCard(
      tempGroup,
      () => renderBookmarkGrid(tempGroup.children, depth + 1, tempGroup)
    );
    grid.append(tempCard);
  }

  // Render folder cards
  folders.forEach(folder => {
    const card = createFolderCard(
      folder,
      () => renderBookmarkGrid(folder.children, depth + 1, folder)
    );
    grid.append(card);
  });

  // Render individual bookmark cards at any subpage (depth>0)
  if (depth > 0 && bookmarks.length > 0) {
    bookmarks.forEach(item => {
      const bc = createBookmarkCard(item, renderBookmarkGrid, bookmarks);
      grid.append(bc);
    });
  }

  container.append(grid);
}