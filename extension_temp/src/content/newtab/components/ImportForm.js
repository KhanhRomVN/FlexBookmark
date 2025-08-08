import { createBookmark } from '../../utils/api.js';

/**
 * Shows a modal dialog for importing bookmarks via structured text segments.
 * Format: "Folder: title, url, title, url; AnotherFolder: ...".
 * Automatically creates or reuses subfolders under parentId.
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
            <textarea id="import-text" rows="4"
              placeholder="e.g. Work: Docs, https://docs.com, Blog, https://blog.com; Example: Example, https://example.com, Foo, https://foo.com"
              required autofocus></textarea>
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
    const rawSegments = textInput.value.trim().split(';').map(s => s.trim()).filter(Boolean);
    const getChildren = id => new Promise(res => chrome.bookmarks.getChildren(id, res));

    for (const segment of rawSegments) {
      const [folderName, bookmarkStr = ''] = segment.split(/:(.*)/s).map(s => s.trim());
      let targetParent = parentId;

      if (folderName) {
        const children = await getChildren(parentId);
        const existing = children.find(c => !c.url && c.title === folderName);
        if (existing) {
          targetParent = existing.id;
        } else {
          const newFolder = await chrome.bookmarks.create({ parentId, title: folderName });
          targetParent = newFolder.id;
        }
      }

      const items = bookmarkStr.split(',').map(s => s.trim()).filter(Boolean);
      for (let i = 0; i < items.length; i += 2) {
        const title = items[i];
        const url = items[i + 1];
        if (title && url) {
          await createBookmark({ parentId: targetParent, title, url });
        }
      }
    }

    const updated = await getChildren(parentId);
    renderBookmarkGrid(updated, depth, { id: parentId, title: gridTitle });
    modal.style.display = 'none';
    modal.innerHTML = '';
  });

  cancelBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    modal.innerHTML = '';
  });
}