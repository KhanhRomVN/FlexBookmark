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
  // Filter out only temporary placeholders; keep all real folders and bookmarks
  const realItems = items.filter(item => !item.id.startsWith('temp-'));
  // Remove old event listeners by replacing the container node
  const oldContainer = document.getElementById('bookmark-grid');
  oldContainer.replaceWith(oldContainer.cloneNode(true));
  const container = document.getElementById('bookmark-grid');

  // Update current parent folder ID
  // On root depth, ensure parentId defaults to '0' (chrome bookmarks root)
  container.dataset.parentId = folder && folder.id ? folder.id : container.dataset.parentId || '0';
  const parentId = container.dataset.parentId;
  container.dataset.depth = String(depth);

  // Clear and set up drop area
  container.innerHTML = '';
  container.classList.add('drop-target');
  container.addEventListener('dragover', e => {
    e.preventDefault();
    container.classList.add('drop-target-highlight');
  });
  container.addEventListener('dragleave', () => {
    container.classList.remove('drop-target-highlight');
  });
  container.addEventListener('drop', async e => {
    // only handle drops directly on grid container, not on child elements
    if (e.target !== container) return;
    e.preventDefault();
    container.classList.remove('drop-target-highlight');
    let data;
    try {
      data = JSON.parse(e.dataTransfer.getData('text/plain'));
    } catch {
      return;
    }

    if (data.type === 'bookmark') {
      try {
        await chrome.bookmarks.move(data.id, { parentId });
      } catch (err) {
        console.error('BookmarkGrid error moving bookmark:', err);
      }
      chrome.bookmarks.getChildren(parentId, children => {
        chrome.bookmarks.get(parentId, ([parentFolder]) => {
          renderBookmarkGrid(children, depth, parentFolder);
        });
      });
    }

    if (data.type === 'folder') {
      if (depth >= 1) {
        showToast('Cannot drop folders into nested grids', 'error');
        return;
      }
      try {
        await chrome.bookmarks.move(data.id, { parentId });
      } catch (err) {
        console.error('BookmarkGrid error moving folder:', err);
      }
      chrome.bookmarks.getChildren(parentId, children => {
        const filtered = children.filter(item => !item.id.startsWith('temp-'));
        chrome.bookmarks.get(parentId, ([parentFolder]) => {
          renderBookmarkGrid(filtered, depth, parentFolder);
        });
      });
    }
    // restore interactions by removing drop-target class
    container.classList.remove('drop-target');
  });

  // Header & breadcrumb
  container.append(renderGridHeader(depth, parentId, renderBookmarkGrid));
  const title = folder && folder.title ? folder.title : container.dataset.groupTitle || '';
  container.dataset.groupTitle = title;
  updateGridTitle(depth, title);

  // Empty state
  if (!realItems.length) {
    container.append(createEmptyState());
    return;
  }

  // Depth 0: top-level grid view
  if (depth === 0) {
    const grid = document.createElement('div');
    grid.className = 'bookmarks-grid drop-target';

    const folders = realItems.filter(item => !item.url);
    const bookmarks = realItems.filter(item => item.url);

    // Bookmarks temp-group
    if (bookmarks.length) {
      grid.append(
        createFolderCard(
          { id: 'temp-group', title: 'Bookmarks', children: bookmarks },
          renderBookmarkGrid,
          depth
        )
      );
    }

    // Folder cards
    folders.forEach(folderItem => {
      const childrenFiltered = folderItem.children
        ? folderItem.children.filter(child =>
            !child.children || child.children.every(gc => gc.url)
          )
        : undefined;
      const folderData = childrenFiltered
        ? { ...folderItem, children: childrenFiltered }
        : folderItem;
      grid.append(createFolderCard(folderData, renderBookmarkGrid, depth));
    });

    container.append(grid);
    return;
  }

  // Depth >=1: list and subfolder view
  const list = document.createElement('div');
  list.className = 'bookmark-list drop-target';

  // Direct bookmarks at this depth
  const bookmarksLevel1 = realItems.filter(item => item.url);
  if (bookmarksLevel1.length) {
    // Wrap level-1 bookmarks in a synthetic Temp folder, preserving original context
    const tempFolder = {
      id: 'temp',
      title: 'Temp',
      children: bookmarksLevel1,
      originalParentId: parentId,
      originalDepth: depth
    };
    list.append(createFolderCard(tempFolder, renderBookmarkGrid, depth));
  }

  const subfolders = realItems.filter(item => !item.url);
  subfolders.forEach(sub => {
    list.append(createFolderCard(sub, renderBookmarkGrid, depth));
  });

  container.append(list);
}