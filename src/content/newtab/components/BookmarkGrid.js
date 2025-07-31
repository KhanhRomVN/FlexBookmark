import { createFolder, createBookmark } from '../../utils/api.js';

export function renderBookmarkGrid(items) {
  const container = document.getElementById('bookmark-grid');
  const parentId = container.dataset.parentId || null;
  container.dataset.depth = container.dataset.depth || '0';
  const depth = parseInt(container.dataset.depth, 10);

  // Clear previous content
  container.innerHTML = '';

  // Grid header with buttons
  container.insertAdjacentHTML('beforeend', `
    <div class="grid-header">
      <button class="add-group-btn-grid">+ Thêm nhóm</button>
      <button class="add-bookmark-btn-grid">+ Thêm bookmark</button>
    </div>
  `);

  // Update title & breadcrumb
  const titleEl = document.getElementById('folder-title');
  const breadcrumbEl = document.getElementById('breadcrumb');
  if (depth === 0) {
    titleEl.textContent = 'Tất cả bookmark';
    breadcrumbEl.textContent = 'Trang chủ';
  } else {
    const cur = container.dataset.groupTitle || '';
    titleEl.textContent = cur;
    breadcrumbEl.textContent = cur;
  }

  // Add-group handler (root only)
  container.querySelector('.add-group-btn-grid').addEventListener('click', async () => {
    if (depth >= 1) {
      alert('Không thể tạo nhóm con trong nhóm con');
      return;
    }
    const title = prompt('Tên nhóm mới');
    if (!title) return;
    await createFolder({ title, parentId });
    const list = await new Promise(res => chrome.bookmarks.getChildren(parentId, res));
    container.dataset.parentId = parentId;
    container.dataset.depth = '1';
    container.dataset.groupTitle = title;
    renderBookmarkGrid(list);
  });

  // Add-bookmark handler
  container.querySelector('.add-bookmark-btn-grid').addEventListener('click', async () => {
    const title = prompt('Tiêu đề bookmark');
    const url = prompt('URL bookmark');
    if (!title || !url) return;
    await createBookmark({ title, url, parentId });
    const subtree = await new Promise(res => chrome.bookmarks.getSubTree(parentId, res));
    const children = (subtree[0] && subtree[0].children) || [];
    renderBookmarkGrid(children);
  });

  // Empty state
  if (!items || items.length === 0) {
    container.insertAdjacentHTML('beforeend', `
      <div class="empty-state">
        <div class="empty-icon">📚</div>
        <p>Chưa có bookmark nào trong thư mục này</p>
      </div>
    `);
    return;
  }

  // Build container for items: grid at root, list in nested group
  const grid = document.createElement('div');
  grid.className = depth === 0 ? 'bookmarks-grid' : 'bookmark-list';

  // Render items
  items.forEach(item => {
    if (item.url) {
      // Bookmark card
      const card = document.createElement('div');
      card.className = 'bookmark-card';
      card.innerHTML = `
        <div class="bookmark-header">
          <img class="bookmark-icon"
               src="https://www.google.com/s2/favicons?sz=64&domain_url=${item.url}"
               alt="Favicon">
          <div class="bookmark-title" title="${item.title}">
            ${item.title}
          </div>
          <div class="bookmark-actions">
            <button class="action-btn delete-btn" data-id="${item.id}" title="Xóa">🗑️</button>
          </div>
        </div>
      `;
      grid.appendChild(card);

    } else {
      // Folder card showing its bookmarks
      const groupCard = document.createElement('div');
      groupCard.className = 'mini-group-card';
      groupCard.innerHTML = `
        <div class="mini-group-header">${item.title}</div>
        <div class="mini-group-body">Đang tải...</div>
      `;
      // Load child bookmarks
      chrome.bookmarks.getChildren(item.id, list => {
        const names = list.filter(c => c.url).map(c => c.title).join(', ');
        groupCard.querySelector('.mini-group-body').textContent = names || 'Không có bookmark';
      });
      // If root, allow drilling into folder
      if (depth === 0) {
        groupCard.addEventListener('click', async () => {
          const list = await new Promise(res => chrome.bookmarks.getChildren(item.id, res));
          container.dataset.parentId = item.id;
          container.dataset.depth = '1';
          container.dataset.groupTitle = item.title;
          renderBookmarkGrid(list);
        });
      }
      grid.appendChild(groupCard);
    }
  });

  // Append grid
  container.appendChild(grid);

  // Delete handler
  grid.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      const id = btn.dataset.id;
      try {
        await chrome.bookmarks.remove(id);
        btn.closest('.bookmark-card')?.remove();
      } catch (err) {
        console.error('Failed to delete bookmark', err);
      }
    });
  });
}