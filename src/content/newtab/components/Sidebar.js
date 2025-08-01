import { renderBookmarkGrid } from './BookmarkGrid.js';
export function renderSidebar(folders) {
  const sidebar = document.getElementById('sidebar');
  sidebar.innerHTML = '';

  // Build first-level groups: skip Bookmark Bar, expand Other bookmarks children
  const groups = [];
  folders.forEach(node => {
    if (node.url) return;
    const titleLower = node.title.toLowerCase();
    // always include Bookmark Bar
    if (node.title === 'Other bookmarks' && node.children) {
      node.children
        .filter(child => !child.url)
        .forEach(child => groups.push(child));
    } else {
      groups.push(node);
    }
  });

  function countUrls(node) {
    let count = 0;
    if (node.url) count++;
    if (node.children) {
      node.children.forEach(child => {
        count += countUrls(child);
      });
    }
    return count;
  }

  groups.forEach(folder => {
      const count = countUrls(folder);
      const element = document.createElement('div');
      element.className = 'group-item';
      element.dataset.id = folder.id;
      element.innerHTML = `
        <div class="group-color" style="background-color: #3b82f6"></div>
        <span class="group-name">${folder.title}</span>
        <span class="group-count">${count}</span>
        <div class="group-actions">
          <button class="group-action-btn" title="Chỉnh sửa">✏️</button>
        </div>
      `;
      sidebar.appendChild(element);
    });

  sidebar.querySelectorAll('.group-item').forEach(item => {
    item.addEventListener('click', async e => {
      e.stopPropagation();
      sidebar.querySelectorAll('.group-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      const folderId = item.dataset.id;
      // fetch direct children of this folder
      const list = await new Promise(res => chrome.bookmarks.getChildren(folderId, res));
      const children = list || [];
      // update grid context
      const grid = document.getElementById('bookmark-grid');
      grid.dataset.parentId = folderId;
      grid.dataset.depth = '1';
      document.getElementById('folder-title').textContent = item.querySelector('.group-name').textContent;
      renderBookmarkGrid(children);
    });

    // Drag-and-drop handlers for sidebar folder items
    item.addEventListener('dragenter', e => {
      e.preventDefault();
      item.classList.add('drag-over');
    });
    item.addEventListener('dragover', e => {
      e.preventDefault();
      item.classList.add('drag-over');
    });
    item.addEventListener('dragleave', () => {
      item.classList.remove('drag-over');
    });
    item.addEventListener('drop', async e => {
      e.preventDefault();
      item.classList.remove('drag-over');
      e.stopPropagation();
      const raw = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('application/json');
      try {
        const data = JSON.parse(raw);
        if (!data || !data.id) return;
        const folderId = item.dataset.id;
        if (data.type === 'folder' && data.id === folderId) {
          console.log('Cannot drop folder into itself');
          return;
        }
        await chrome.bookmarks.move(data.id, { parentId: folderId });
        const list = await new Promise(res => chrome.bookmarks.getChildren(folderId, res));
        renderBookmarkGrid(list);
      } catch (err) {
        console.error('Drop to sidebar folder failed', err);
      }
    });
  });
}