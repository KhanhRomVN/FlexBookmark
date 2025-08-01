import { createFolder, createBookmark } from '../../utils/api.js';

export function renderBookmarkGrid(items) {
  const container = document.getElementById('bookmark-grid');
  const parentId = container.dataset.parentId || null;
  container.dataset.depth = container.dataset.depth || '0';
  const depth = parseInt(container.dataset.depth, 10);

  // Clear existing
  container.innerHTML = '';

  // Header
  const header = document.createElement('div');
  header.className = 'grid-header';
  const addGroupBtn = document.createElement('button');
  addGroupBtn.className = 'add-group-btn-grid';
  addGroupBtn.textContent = '+ Thêm nhóm';
  const addBookmarkBtn = document.createElement('button');
  addBookmarkBtn.className = 'add-bookmark-btn-grid';
  addBookmarkBtn.textContent = '+ Thêm bookmark';
  header.append(addGroupBtn, addBookmarkBtn);
  container.append(header);

  // Title & breadcrumb
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

  // Add group
  addGroupBtn.addEventListener('click', async () => {
    if (depth >= 2) {
      alert('Không thể tạo nhóm con quá cấp 2');
      return;
    }
    const name = prompt('Tên nhóm mới');
    if (!name) return;
    await createFolder({ title: name, parentId });
    const list = await new Promise(res => chrome.bookmarks.getChildren(parentId, res));
    renderBookmarkGrid(list);
  });

  // Add bookmark at root
  addBookmarkBtn.addEventListener('click', async () => {
    const title = prompt('Tiêu đề bookmark');
    const url = prompt('URL bookmark');
    if (!title || !url) return;
    await createBookmark({ title, url, parentId });
    const subtree = await new Promise(res => chrome.bookmarks.getSubTree(parentId, res));
    const children = (subtree[0] && subtree[0].children) || [];
    renderBookmarkGrid(children);
  });

  // Empty
  if (!items || items.length === 0) {
    container.insertAdjacentHTML('beforeend', `
      <div class="empty-state">
        <div class="empty-icon">📚</div>
        <p>Chưa có bookmark nào trong thư mục này</p>
      </div>
    `);
    return;
  }

  // Nest grouping
  let renderItems = items;
  if (depth > 0) {
    const bm = items.filter(i => i.url);
    const fg = items.filter(i => !i.url);
    renderItems = [];
    if (bm.length) {
      renderItems.push({ id: '__temp', title: 'Temp', children: bm, isTempGroup: true });
    }
    renderItems.push(...fg);
  }

  // Grid container
  const grid = document.createElement('div');
  grid.className = depth === 0 ? 'bookmarks-grid' : 'bookmark-list';
  grid.addEventListener('dragover', e => e.preventDefault());
  grid.addEventListener('drop', async e => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      await chrome.bookmarks.move(data.id, { parentId });
      const list = await new Promise(res => chrome.bookmarks.getChildren(parentId, res));
      renderBookmarkGrid(list);
    } catch (err) {
      console.error('Drop failed', err);
    }
  });

  // Render each
  renderItems.forEach(item => {
    // Temporary group
    if (item.isTempGroup) {
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
        row.setAttribute('draggable', 'true');
        row.addEventListener('dragstart', e => {
          e.dataTransfer.setData('application/json', JSON.stringify({ type: 'bookmark', id: child.id }));
        });
        row.innerHTML = `
          <img class="bookmark-icon" src="https://www.google.com/s2/favicons?sz=24&domain_url=${child.url}" alt="">
          <div class="bookmark-title truncate" title="${child.title}">${child.title}</div>
        `;
        body.append(row);
      });
      grid.append(tempCard);
      return;
    }

    // Bookmark card
    if (item.url) {
      const card = document.createElement('div');
      card.className = 'bookmark-card';
      card.setAttribute('draggable', 'true');
      card.addEventListener('dragstart', e => {
        e.dataTransfer.setData('application/json', JSON.stringify({ type: 'bookmark', id: item.id }));
      });
      card.innerHTML = `
        <div class="bookmark-header">
          <img class="bookmark-icon" src="https://www.google.com/s2/favicons?sz=64&domain_url=${item.url}" alt="">
          <div class="bookmark-title" title="${item.title}">${item.title}</div>
          <div class="bookmark-actions">
            <button class="action-btn delete-btn" data-id="${item.id}" title="Xóa">🗑️</button>
            <button class="action-btn edit-btn" data-id="${item.id}" title="Chỉnh sửa">✏️</button>
          </div>
        </div>
      `;
      // Delete & edit
      card.querySelector('.delete-btn')?.addEventListener('click', async e => {
        e.stopPropagation();
        await chrome.bookmarks.remove(item.id);
        card.remove();
      });
      card.querySelector('.edit-btn')?.addEventListener('click', async e => {
        e.stopPropagation();
        const newUrl = prompt('URL mới', item.url) || item.url;
        const newTitle = prompt('Title mới', item.title) || item.title;
        await chrome.bookmarks.update(item.id, { url: newUrl, title: newTitle });
        renderBookmarkGrid(items);
      });
      grid.append(card);
      return;
    }

    // Folder card
    const groupCard = document.createElement('div');
    groupCard.className = 'mini-group-card';
    groupCard.setAttribute('draggable', 'true');
    groupCard.addEventListener('dragstart', e => {
      e.dataTransfer.setData('application/json', JSON.stringify({ type: 'folder', id: item.id }));
    });
    groupCard.innerHTML = `
      <div class="mini-group-header">
        <span class="mini-group-icon">📁</span>${item.title}
      </div>
      <div class="mini-group-body">Đang tải...</div>
    `;
    // menu
    const menuBtn = document.createElement('button');
    menuBtn.className = 'folder-menu-btn';
    menuBtn.textContent = '⋯';
    // Place menu button at top in DOM for proper absolute positioning
    groupCard.insertBefore(menuBtn, groupCard.firstChild);
    const dropdown = document.createElement('div');
    dropdown.className = 'folder-dropdown';
    dropdown.innerHTML = ''
      + '<button class="rename-folder">Rename</button>'
      + '<button class="delete-folder">Delete</button>'
      + '<button class="add-bookmark-folder">Add Bookmark</button>';
    groupCard.append(dropdown);
    menuBtn.addEventListener('click', e => {
      e.stopPropagation();
      dropdown.style.display = dropdown.style.display === 'flex' ? 'none' : 'flex';
    });
    dropdown.querySelector('.rename-folder')?.addEventListener('click', async e => {
      e.stopPropagation();
      const nm = prompt('Tên mới', item.title);
      if (nm) {
        await chrome.bookmarks.update(item.id, { title: nm });
        renderBookmarkGrid(items);
      }
      dropdown.style.display = 'none';
    });
    dropdown.querySelector('.delete-folder')?.addEventListener('click', async e => {
      e.stopPropagation();
      if (confirm('Xóa folder và tất cả bookmark?')) {
        await chrome.bookmarks.removeTree(item.id);
        const list = await new Promise(res => chrome.bookmarks.getChildren(parentId, res));
        renderBookmarkGrid(list);
      }
      dropdown.style.display = 'none';
    });
    dropdown.querySelector('.add-bookmark-folder')?.addEventListener('click', e => {
      e.stopPropagation();
      dropdown.style.display = 'none';
      const body = groupCard.querySelector('.mini-group-body');
      body.innerHTML = ''
        + '<div class="add-bookmark-inline">'
        + '  <input class="bookmark-url-input" placeholder="Enter URL" />'
        + '  <button class="confirm-url">✅</button>'
        + '</div>';
      const urlInput = body.querySelector('.bookmark-url-input');
      const confirmUrl = body.querySelector('.confirm-url');
      const toTitle = () => {
        const u = urlInput.value.trim();
        if (!u) return;
        body.innerHTML = ''
          + '<div class="add-bookmark-inline">'
          + '  <input class="bookmark-title-input" placeholder="Enter Title" />'
          + '  <button class="confirm-title">✅</button>'
          + '</div>';
        const ti = body.querySelector('.bookmark-title-input');
        const ok = body.querySelector('.confirm-title');
        ok.addEventListener('click', async () => {
          await createBookmark({ title: ti.value.trim() || '', url: u, parentId: item.id });
          const list = await new Promise(res => chrome.bookmarks.getChildren(item.id, res));
          renderBookmarkGrid(list);
        });
        ti.addEventListener('keypress', ke => ke.key === 'Enter' && ok.click());
      };
      confirmUrl.addEventListener('click', toTitle);
      urlInput.addEventListener('keypress', ke => ke.key === 'Enter' && confirmUrl.click());
    });
    // load children
    chrome.bookmarks.getChildren(item.id, list => {
      const html = list.filter(c => c.url)
        .map(c => `<div class="bookmark-row nested" title="${c.title}">
          <img class="mini-bookmark-icon" src="https://www.google.com/s2/favicons?sz=16&domain_url=${c.url}" alt="">
          ${c.title}
        </div>`).join('') || 'Không có bookmark';
      groupCard.querySelector('.mini-group-body').innerHTML = html;
    });
    grid.append(groupCard);
  });

  container.append(grid);
}