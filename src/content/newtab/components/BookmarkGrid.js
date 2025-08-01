import { createFolder, createBookmark } from '../../utils/api.js';
import { renderGridHeader } from './GridHeader.js';
import { updateGridTitle } from './GridTitle.js';
import { createEmptyState } from './EmptyState.js';
import { createBookmarkCard } from './BookmarkCard.js';
import { createFolderCard } from './FolderCard.js';

/**
 * Renders the entire bookmark grid for given items.
 * @param {Array} items - List of bookmark and folder items.
 */
export function renderBookmarkGrid(items) {
  const container = document.getElementById('bookmark-grid');
  const parentId = container.dataset.parentId || null;
  container.dataset.depth = container.dataset.depth || '0';
  const depth = parseInt(container.dataset.depth, 10);

  // Clear existing
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

  // Determine render items (group nested at depth > 0)
  let renderItems = items;
  if (depth > 0) {
    const bm = items.filter(i => i.url);
    const fg = items.filter(i => !i.url);
    renderItems = [];
    if (bm.length) {
      renderItems.push({ id: '__temp', title: 'Temp', children: bm, isTempGroup: true });
    }
    renderItems.push(...fg);
  }

  // Grid container with drag/drop
  const grid = document.createElement('div');
  grid.className = depth === 0 ? 'bookmarks-grid' : 'bookmark-list';
  grid.addEventListener('dragover', e => e.preventDefault());
  grid.addEventListener('drop', async e => {
      e.preventDefault();
      try {
        const data = JSON.parse(e.dataTransfer.getData('application/json'));
  
        if (!data || !data.id) {
          console.warn('Invalid drop data');
          return;
        }
  
        if (data.id === parentId) {
          console.log('Cannot drop into itself');
          return;
        }
  
        await chrome.bookmarks.move(data.id, { parentId });
  
        const list = await new Promise(res => chrome.bookmarks.getChildren(parentId, res));
        renderBookmarkGrid(list);
      } catch (err) {
        console.error('Drop failed', err);
      }
    });

  // Render each item
  renderItems.forEach(item => {
    if (item.url) {
      const bookmarkCard = createBookmarkCard(item, renderBookmarkGrid, items);
      grid.append(bookmarkCard);
    } else {
      const folderCard = createFolderCard(item, renderBookmarkGrid, parentId, item.isTempGroup);
      grid.append(folderCard);
    }
  });

  container.append(grid);
}