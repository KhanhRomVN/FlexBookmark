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

  // Add-group handler (allow up to 2 levels)
  container.querySelector('.add-group-btn-grid').addEventListener('click', async () => {
    const currentDepth = parseInt(container.dataset.depth || '0', 10);
    if (currentDepth >= 3) {
      alert('Không thể tạo nhóm con quá cấp 2');
      return;
    }
    const title = prompt('Tên nhóm mới');
    if (!title) return;
    const currentParent = container.dataset.parentId || null;
    await createFolder({ title, parentId: currentParent });
    const list = await new Promise(res => chrome.bookmarks.getChildren(currentParent, res));
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

// Group bookmarks into a temp folder card when nested
let renderItems = items;
if (depth > 0) {
  const bookmarkItems = items.filter(item => item.url);
  const folderItems = items.filter(item => !item.url);
  renderItems = [];
  if (bookmarkItems.length) {
    renderItems.push({
      id: '__temp',
      title: 'Temp',
      children: bookmarkItems,
      isTempGroup: true
    });
  }
  renderItems.push(...folderItems);
} else {
  renderItems = items;
}
  // Build container for items: grid at root, list in nested group
  const grid = document.createElement('div');
  grid.className = depth === 0 ? 'bookmarks-grid' : 'bookmark-list';

  // Render items
  renderItems.forEach(item => {
// Handle temp group list display (icon + text, single line truncated)
    if (item.isTempGroup) {
      // Temporary group card wrapper
      const tempCard = document.createElement('div');
      tempCard.className = 'mini-group-card temp-group-card';
      tempCard.innerHTML = `
        <div class="mini-group-header">${item.title}</div>
        <div class="temp-group-body"></div>
      `;
      const body = tempCard.querySelector('.temp-group-body');
      item.children.forEach(child => {
        const row = document.createElement('div');
        row.className = 'bookmark-row';
        row.innerHTML = `
          <img class="bookmark-icon" src="https://www.google.com/s2/favicons?sz=24&domain_url=${child.url}" alt="Favicon">
          <div class="bookmark-title truncate" title="${child.title}">${child.title}</div>
        `;
        body.appendChild(row);
      });
      grid.appendChild(tempCard);
      return;
    }
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
        <div class="mini-group-header">
          <span class="mini-group-icon">📁</span>
          ${item.title}
        </div>
        <div class="mini-group-body">Đang tải...</div>
      `;
      // Load child bookmarks with icons
      if (item.isTempGroup) {
        const html = item.children
          .filter(c => c.url)
          .map(c =>
            `<img class="mini-bookmark-icon" src="https://www.google.com/s2/favicons?sz=16&domain_url=${c.url}" title="${c.title}" />`
          )
          .join('');
        groupCard.querySelector('.mini-group-body').innerHTML = html || 'Không có bookmark';
      } else {
        chrome.bookmarks.getChildren(item.id, list => {
          const html = list
            .filter(c => c.url)
            .map(c => `
              <div class="bookmark-row nested">
                <img class="mini-bookmark-icon" src="https://www.google.com/s2/favicons?sz=16&domain_url=${c.url}" title="${c.title}" />
                <span class="bookmark-title truncate" title="${c.title}">${c.title}</span>
              </div>
            `)
            .join('');
          groupCard.querySelector('.mini-group-body').innerHTML = html || 'Không có bookmark';
        });
      }
      // No click navigation for group cards
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