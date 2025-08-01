import { createBookmark } from '../../utils/api.js';

/**
 * Creates a folder card or temporary group card.
 * @param {Object} item - Folder data or temp group ({ id, title, children, isTempGroup }).
 * @param {Function} renderBookmarkGrid - Callback to re-render the grid.
 * @param {string|null} parentId - ID of current parent folder.
 * @param {boolean} isTempGroup - Whether this is a temporary grouping of bookmarks.
 * @returns {HTMLElement}
 */
export function createFolderCard(item, renderBookmarkGrid, parentId, isTempGroup = false) {
  // Temporary group card (non-persistent grouping)
  if (isTempGroup) {
    // Enable dropping bookmarks into this temporary group (moves into current folder)
    const tempCard = document.createElement('div');
    tempCard.addEventListener('dragover', e => e.preventDefault());
    tempCard.addEventListener('drop', async e => {
      e.preventDefault();
      e.stopPropagation();
      try {
        const data = JSON.parse(e.dataTransfer.getData('application/json'));
        if (data.type === 'bookmark') {
          await chrome.bookmarks.move(data.id, { parentId });
          const list = await new Promise(res => chrome.bookmarks.getChildren(parentId, res));
          renderBookmarkGrid(list);
        }
      } catch (err) {
        console.error('Drop to temp group failed', err);
      }
    });
    tempCard.className = 'mini-group-card temp-group-card';
    tempCard.innerHTML = `
      <div class="mini-group-header">${item.title}</div>
      <div class="temp-group-body"></div>
    `;
    const body = tempCard.querySelector('.temp-group-body');
    item.children.forEach(child => {
      const row = document.createElement('div');
      row.className = 'bookmark-row';
      row.draggable = true;
      row.addEventListener('dragstart', e => {
        e.stopPropagation();
        e.dataTransfer.setData(
          'application/json',
          JSON.stringify({ type: 'bookmark', id: child.id })
        );
      });
      row.innerHTML = `
        <img class="bookmark-icon" src="https://www.google.com/s2/favicons?sz=24&domain_url=${child.url}" alt="">
        <div class="bookmark-title truncate" title="${child.title}">${child.title}</div>
      `;
      body.append(row);
    });
    return tempCard;
  }

  // Persistent folder card
  const groupCard = document.createElement('div');
  groupCard.className = 'mini-group-card';
  groupCard.draggable = true;
  groupCard.addEventListener('dragstart', e => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ type: 'folder', id: item.id })
    );
  });

  // Allow dropping bookmarks onto this folder
  groupCard.addEventListener('dragover', e => e.preventDefault());
  groupCard.addEventListener('drop', async e => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data.type === 'bookmark') {
        await chrome.bookmarks.move(data.id, { parentId: item.id });
        renderBookmarkGrid();
      }
    } catch (err) {
      console.error('Drop to folder failed', err);
    }
  });

  groupCard.innerHTML = `
    <div class="mini-group-header">
      <span class="mini-group-icon">📁</span>${item.title}
    </div>
    <div class="mini-group-body">Đang tải...</div>
  `;

  // Menu button & dropdown
  const menuBtn = document.createElement('button');
  menuBtn.className = 'folder-menu-btn';
  menuBtn.textContent = '⋯';
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

  // Rename & delete
  dropdown.querySelector('.rename-folder')?.addEventListener('click', async e => {
    e.stopPropagation();
    const nm = prompt('Tên mới', item.title);
    if (nm) {
      await chrome.bookmarks.update(item.id, { title: nm });
      renderBookmarkGrid();
    }
    dropdown.style.display = 'none';
  });

  dropdown.querySelector('.delete-folder')?.addEventListener('click', async e => {
    e.stopPropagation();
    if (confirm('Xóa folder và tất cả bookmark?')) {
      await chrome.bookmarks.removeTree(item.id);
      renderBookmarkGrid();
    }
    dropdown.style.display = 'none';
  });

  // Inline add bookmark in folder
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
        renderBookmarkGrid();
      });
      ti.addEventListener('keypress', ke => ke.key === 'Enter' && ok.click());
    };

    confirmUrl.addEventListener('click', toTitle);
    urlInput.addEventListener('keypress', ke => ke.key === 'Enter' && confirmUrl.click());
  });

  // Fetch and display child bookmarks
  chrome.bookmarks.getChildren(item.id, list => {
    const body = groupCard.querySelector('.mini-group-body');
    body.innerHTML = '';
    const bookmarks = list.filter(c => c.url);
    if (bookmarks.length === 0) {
      body.textContent = 'Không có bookmark';
    } else {
      bookmarks.forEach(c => {
        const row = document.createElement('div');
        row.className = 'bookmark-row nested';
        row.draggable = true;
        row.title = c.title;
        row.addEventListener('dragstart', e => {
          e.dataTransfer.setData(
            'application/json',
            JSON.stringify({ type: 'bookmark', id: c.id })
          );
        });
        row.innerHTML = `
          <img class="mini-bookmark-icon" src="https://www.google.com/s2/favicons?sz=16&domain_url=${c.url}" alt="">
          ${c.title}
        `;
        body.appendChild(row);
      });
    }
  });

  return groupCard;
}