import { createBookmark } from '../../utils/api.js';

/**
 * Shows a modal form for creating or editing a bookmark.
 * @param {Object} options
 * @param {string} options.parentId - ID of the folder to add or update the bookmark.
 * @param {Function} options.renderBookmarkGrid - Callback to refresh the grid after operation.
 * @param {number} [options.depth=0] - Current folder depth.
 * @param {Object|null} [options.folder=null] - Current folder object context.
 * @param {Object|null} [options.bookmark=null] - Bookmark object when editing (id, title, url).
 */
export function showBookmarkForm({
  parentId,
  renderBookmarkGrid,
  depth = 0,
  folder = null,
  bookmark = null
}) {
  const modal = document.getElementById('add-bookmark-modal');
  const isEdit = Boolean(bookmark && bookmark.id);
  modal.innerHTML = `
    <div class="edit-dialog-overlay show">
      <div class="edit-dialog">
        <h2>${isEdit ? 'Edit bookmark' : 'New bookmark'}</h2>
        <form id="bookmark-form">
          <div class="form-group">
            <label for="form-title">Tiêu đề</label>
            <input type="text" id="form-title" placeholder="Tiêu đề" required value="${bookmark ? bookmark.title : ''}" />
          </div>
          <div class="form-group">
            <label for="form-url">URL</label>
            <input type="url" id="form-url" placeholder="URL" required value="${bookmark ? bookmark.url : ''}" />
          </div>
          <div class="dialog-buttons">
            <button type="submit" class="save-btn">${isEdit ? 'Update' : 'Save'}</button>
            <button type="button" class="cancel-btn">Cancel</button>
          </div>
        </form>
      </div>
    </div>`;
  modal.style.display = 'block';

  const form = document.getElementById('bookmark-form');
  const titleInput = document.getElementById('form-title');
  const urlInput = document.getElementById('form-url');
  const cancelBtn = modal.querySelector('.cancel-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = titleInput.value.trim();
    const url = urlInput.value.trim();
    if (!title || !url) return;
    if (isEdit) {
      await chrome.bookmarks.update(bookmark.id, { title, url });
    } else {
      await createBookmark({ parentId, title, url });
    }
    // refresh grid
    chrome.bookmarks.getChildren(parentId, (children) => {
      renderBookmarkGrid(children, depth, folder);
    });
    modal.style.display = 'none';
    modal.innerHTML = '';
  });

  cancelBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    modal.innerHTML = '';
  });
}