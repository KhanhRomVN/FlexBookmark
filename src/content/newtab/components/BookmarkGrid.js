import { renderGridHeader } from './GridHeader.js';
import { updateGridTitle } from './GridTitle.js';
import { createEmptyState } from './EmptyState.js';
import { createBookmarkCard } from './BookmarkCard.js';
// import { createFolderCard } from './FolderCard.js';

/**
 * Renders the bookmark grid showing only bookmark cards.
 * @param {Array} items - List of bookmark items (flattened).
 */
export function renderBookmarkGrid(items) {
  const container = document.getElementById('bookmark-grid');
  const parentId = container.dataset.parentId || null;
  container.dataset.depth = container.dataset.depth || '0';
  const depth = parseInt(container.dataset.depth, 10);

  // Clear existing content
  container.innerHTML = '';

  // Header
  const header = renderGridHeader(depth, parentId, renderBookmarkGrid);
  container.append(header);

  // Title & breadcrumb
  const groupTitle = container.dataset.groupTitle || '';
  updateGridTitle(depth, groupTitle);

  // Empty state
  if (!items || items.length === 0) {
    container.append(createEmptyState());
    return;
  }

  // Create grid container
  const grid = document.createElement('div');
  grid.className = depth === 0 ? 'bookmarks-grid' : 'bookmark-list';
  grid.classList.add('drop-target');

  // Render each bookmark card
  items.forEach(item => {
    if (item.url) {
      console.log('BookmarkGrid: rendering bookmark', item.id, item.url);
      const card = createBookmarkCard(item, renderBookmarkGrid, items);
      grid.append(card);
    }
  });

  container.append(grid);
}