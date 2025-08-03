import { renderGridHeader } from './GridHeader.js';
import { updateGridTitle } from './GridTitle.js';
import { createEmptyState } from './EmptyState.js';
import { createBookmarkCard } from './BookmarkCard.js';
import { createFolderCard } from './FolderCard.js';
import { showToast } from '../../utils/helpers.js';

/**
 * Renders the bookmark grid showing folder and bookmark cards.
 * @param {Array} items - List of bookmark items.
 * @param {number} depth - Current folder depth.
 * @param {Object|null} folder - Current folder object context.
 */
export function renderBookmarkGrid(items, depth = 0, folder = null) {
  // Filter out temporary and invalid items
  const realItems = items.filter(item => !item.id.startsWith('temp-') && (item.url || item.children));
  const container = document.getElementById('bookmark-grid');
  // Update current parent folder ID so drops and re-renders use correct folder context
  container.dataset.parentId = folder && folder.id ? folder.id : container.dataset.parentId || null;
  const parentId = container.dataset.parentId;
  container.dataset.depth = depth.toString();
  container.innerHTML = '';

  // Enable drop on grid container
  container.classList.add('drop-target');
  container.addEventListener('dragover', e => {
    console.log('BookmarkGrid dragover');
    e.preventDefault();
    container.classList.add('drop-target-highlight');
  });
  container.addEventListener('dragleave', () => {
    container.classList.remove('drop-target-highlight');
  });
  container.addEventListener('drop', async e => {
      console.log('BookmarkGrid drop handler start', {
        parentId,
        depth,
        gridParentId: container.dataset.parentId,
        gridDepth: container.dataset.depth
      });
      e.preventDefault();
      container.classList.remove('drop-target-highlight');

      const raw = e.dataTransfer.getData('text/plain');
      console.log('BookmarkGrid raw drop data:', raw);
      const data = JSON.parse(raw);
    // Handle drop into grid (move bookmark to this folder or root)
    if (data.type === 'bookmark') {
      await chrome.bookmarks.move(data.id, { parentId: parentId });
      chrome.bookmarks.getChildren(parentId, (children) => {
        renderBookmarkGrid(children, depth);
      });
    }
    // Handle folder drop into grid
    if (data.type === 'folder') {
      // Prevent dropping folders into nested grids
      if (depth >= 1) {
        console.log('Cannot drop folders into nested grids');
        showToast('Cannot drop folders into nested grids', 'error');
        return;
      }
      await chrome.bookmarks.move(data.id, { parentId: parentId });
      chrome.bookmarks.getChildren(parentId, (children) => {
        const realChildren = children.filter(item => !item.id.startsWith('temp-'));
        renderBookmarkGrid(realChildren, depth);
      });
    }
  });

  // Header
  const header = renderGridHeader(depth, parentId, renderBookmarkGrid);
  container.append(header);

  // Title & breadcrumb
  const groupTitle = folder && folder.title ? folder.title : container.dataset.groupTitle || '';
  container.dataset.groupTitle = groupTitle;
  updateGridTitle(depth, groupTitle);

  // Empty state
  if (!realItems || realItems.length === 0) {
    container.append(createEmptyState());
    return;
  }

  // Depth 0: top-level grid view
  if (depth === 0) {
    const grid = document.createElement('div');
    grid.className = 'bookmarks-grid drop-target';

    // Use filtered items
    const folders = realItems.filter(item => !item.url);
    const bookmarks = realItems.filter(item => item.url);

    // Top-level: bookmarks group
    if (bookmarks.length > 0) {
      const tempGroup = { id: 'temp-group', title: 'Bookmarks', children: bookmarks };
      const tempCard = createFolderCard(tempGroup, renderBookmarkGrid, depth);
      grid.append(tempCard);
    }

    // Render folder cards with proper children filtering
    folders.forEach(childFolder => {
      // Skip nested beyond level 2 by filtering grandchildren
      if (childFolder.children) {
        childFolder.children = childFolder.children.filter(child =>
          !child.children || child.children.every(grandchild => grandchild.url)
        );
      }
      const card = createFolderCard(childFolder, renderBookmarkGrid, depth);
      grid.append(card);
    });

    container.append(grid);
    return;
  }

  // Depth >=1: list and subfolder view
  const gridList = document.createElement('div');
  gridList.className = 'bookmark-list drop-target';

  // Direct bookmarks (level1)
  const bookmarksLevel1 = realItems.filter(item => item.url);
  if (bookmarksLevel1.length > 0) {
    const tempGroup = { id: 'temp', title: 'Temp', children: bookmarksLevel1 };
    gridList.append(createFolderCard(tempGroup, renderBookmarkGrid, depth));
  }

  // Render subfolder cards with their enriched children
  const level2Folders = realItems.filter(item => !item.url);
  level2Folders.forEach(subFolder => {
    gridList.append(createFolderCard(subFolder, renderBookmarkGrid, depth));
  });

  container.append(gridList);
}