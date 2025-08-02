import { createFolder, createBookmark } from '../../utils/api.js';

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
  addGroupBtn.textContent = '+ Thêm nhóm';

  const addBookmarkBtn = document.createElement('button');
  addBookmarkBtn.className = 'add-bookmark-btn-grid';
  addBookmarkBtn.textContent = '+ Thêm bookmark';

  header.append(addGroupBtn, addBookmarkBtn);

  // Create new folder
  addGroupBtn.addEventListener('click', async () => {
    if (depth >= 1) {
      alert('Không thể tạo nhóm con quá cấp 2');
      return;
    }
    const name = prompt('Tên nhóm mới');
    if (!name) return;
    await createFolder({ title: name, parentId });
    const list = await new Promise(res => chrome.bookmarks.getChildren(parentId, res));
    renderBookmarkGrid(list);
  });

  // Create new bookmark
  addBookmarkBtn.addEventListener('click', async () => {
    const title = prompt('Tiêu đề bookmark');
    const url = prompt('URL bookmark');
    if (!title || !url) return;
    await createBookmark({ title, url, parentId });
    const subtree = await new Promise(res => chrome.bookmarks.getSubTree(parentId, res));
    const children = (subtree[0] && subtree[0].children) || [];
    renderBookmarkGrid(children);
  });

  return header;
}