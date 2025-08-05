import { createBookmark } from '../../utils/api.js';

/**
 * Shows a modal dialog for importing bookmarks via comma-separated text.
 * @param {Object} options
 * @param {string|null} options.parentId - ID of the folder to add bookmarks into.
 * @param {Function} options.renderBookmarkGrid - Callback to refresh the grid.
 * @param {number} options.depth - Current folder depth.
 * @param {string} [options.gridTitle] - Current grid title, for breadcrumb context.
 */
export function showImportForm({ parentId, renderBookmarkGrid, depth, gridTitle = '' }) {
  const modal = document.getElementById('import-modal');
  modal.innerHTML = `
    <div class="edit-dialog-overlay show">
      <div class="edit-dialog">
        <h2>Import Bookmarks</h2>
        <form id="import-form">
          <div class="form-group">
            <label for="import-text">Enter title, url, title, url, ...</label>
            <textarea id="import-text" rows="4" placeholder="e.g. Example, https://example.com, Foo, https://foo.com"></textarea>
          </div>
          <div class="dialog-buttons">
            <button type="submit" class="save-btn">Import</button>
            <button type="button" class="cancel-btn">Cancel</button>
          </div>
        </form>
      </div>
    </div>`;
  modal.style.display = 'block';

  const form = document.getElementById('import-form');
  const textInput = document.getElementById('import-text');
  const cancelBtn = modal.querySelector('.cancel-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const value = textInput.value.trim();
    if (!value) return;
    const parts = value.split(',').map(s => s.trim()).filter(Boolean);
    for (let i = 0; i < parts.length; i += 2) {
      const title = parts[i];
      const url = parts[i + 1];
      if (title && url) {
        await createBookmark({ parentId, title, url });
      }
    }
    const list = await new Promise(res => chrome.bookmarks.getChildren(parentId, res));
    renderBookmarkGrid(list, depth, { id: parentId, title: gridTitle });
    modal.style.display = 'none';
    modal.innerHTML = '';
  });

  cancelBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    modal.innerHTML = '';
  });
}