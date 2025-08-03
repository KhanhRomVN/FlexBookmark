import { createFolder } from '../../utils/api.js';
import { showBookmarkForm } from './AddBookmarkForm.js';

/**
 * Renders the header section with Add Group and Add Bookmark buttons.
 * @param {number} depth - Current folder depth.
 * @param {string|null} parentId - ID of the current parent folder.
 * @param {Function} renderBookmarkGrid - Callback to re-render the grid.
 * @returns {HTMLElement} Header container element.
 */
export function renderGridHeader(depth, parentId, renderBookmarkGrid) {
  const header = document.createElement('div');
  header.className = 'grid-header';

  const addGroupBtn = document.createElement('button');
  addGroupBtn.className = 'add-group-btn-grid';
  addGroupBtn.textContent = '+ New Folder';

  const addBookmarkBtn = document.createElement('button');
  addBookmarkBtn.className = 'add-bookmark-btn-grid';
  addBookmarkBtn.textContent = '+ New bookmark';

  header.append(addGroupBtn, addBookmarkBtn);

  // Create new folder
  addGroupBtn.addEventListener('click', async () => {
    if (depth >= 1) {
      alert('Cannot create folder beyond level 2');
      return;
    }
    const name = prompt('New Title Folder');
    if (!name) return;
    await createFolder({ title: name, parentId });
    const list = await new Promise(res => chrome.bookmarks.getChildren(parentId, res));
    renderBookmarkGrid(list);
  });

  // Show Add Bookmark form
  addBookmarkBtn.addEventListener('click', () => {
    showBookmarkForm({ parentId, renderBookmarkGrid, depth });
  });

// Improved breadcrumb with folder validation
  const breadcrumbEl = document.getElementById('breadcrumb');
  if (parentId) {
    chrome.bookmarks.get(parentId, ([folderItem]) => {
      if (!folderItem) return;
      const parts = [];
      // Walk up max 2 levels
      (function buildCrumb(node, level) {
        if (node.parentId && node.parentId !== '0' && level < 2) {
          chrome.bookmarks.get(node.parentId, ([parent]) => {
            if (parent) {
              parts.unshift(parent.title);
              buildCrumb(parent, level + 1);
            }
            // At top after walking, append current folder title and update UI
            if (level === 0 && folderItem.title !== 'Other Bookmarks') {
              parts.push(folderItem.title);
              if (breadcrumbEl) breadcrumbEl.textContent = parts.join(' › ');
            }
          });
        } else if (level === 0 && folderItem.title !== 'Other Bookmarks') {
          parts.push(folderItem.title);
          if (breadcrumbEl) breadcrumbEl.textContent = parts.join(' › ');
        }
      })(folderItem, 0);
    });
  }
  return header;
}