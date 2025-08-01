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
    const tempCard = document.createElement('div');
    tempCard.className = 'mini-group-card temp-group-card';

    // helper: render this temp group's body
    function refreshTempBody() {
      const body = tempCard.querySelector('.temp-group-body');
      body.innerHTML = '';
      if (item.children.length === 0) {
        body.textContent = 'Không có bookmark';
      } else {
        item.children.forEach(c => {
          const row = document.createElement('div');
          row.className = 'bookmark-row';
          row.draggable = true;
          row.title = c.title;
          row.addEventListener('dragstart', e => {
            e.stopPropagation();
            e.dataTransfer.setData(
              'application/json',
              JSON.stringify({ type: 'temp', id: c.id, fromGroupId: item.id })
            );
            e.dataTransfer.effectAllowed = 'move';
            row.classList.add('dragging');
          });
          row.addEventListener('dragend', () => row.classList.remove('dragging'));
          row.innerHTML = `
            <img class="bookmark-icon" src="https://www.google.com/s2/favicons?sz=24&domain_url=${c.url}" alt="">
            <div class="bookmark-title truncate" title="${c.title}">${c.title}</div>
          `;
          body.appendChild(row);
        });
      }
    }

    // registry for cross-group moves
    if (!window.tempGroupRegistry) window.tempGroupRegistry = new Map();
    window.tempGroupRegistry.set(item.id, {
      children: item.children,
      refresh: refreshTempBody,
    });

    tempCard.innerHTML = `
      <div class="mini-group-header">${item.title}</div>
      <div class="temp-group-body"></div>
    `;

    tempCard.addEventListener('dragover', e => e.preventDefault());
    tempCard.addEventListener('drop', e => {
      e.preventDefault();
      e.stopPropagation();
      try {
        const raw = e.dataTransfer.getData('application/json');
        const data = JSON.parse(raw);
        if (data.type === 'temp' && data.id && data.fromGroupId) {
          const source = window.tempGroupRegistry.get(data.fromGroupId);
          if (source) {
            const idx = source.children.findIndex(x => x.id === data.id);
            if (idx > -1) {
              const [moved] = source.children.splice(idx, 1);
              if (item.id !== data.fromGroupId) {
                item.children.push(moved);
              }
              source.refresh();
              refreshTempBody();
            }
          }
        }
      } catch (err) {
        console.error('TempGroupCard: drop failed', err);
      }
    });

    // initial render
    refreshTempBody();
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

  // Drag-and-drop handlers for persistent folder card
  groupCard.addEventListener('dragenter', e => {
    e.preventDefault();
    groupCard.classList.add('drag-over');
  });
  groupCard.addEventListener('dragover', e => {
    e.preventDefault();
    groupCard.classList.add('drag-over');
  });
  groupCard.addEventListener('dragleave', () => {
    groupCard.classList.remove('drag-over');
  });
  groupCard.addEventListener('drop', async e => {
    e.preventDefault();
    e.stopPropagation();
    groupCard.classList.remove('drag-over');

    try {
      const raw = e.dataTransfer.getData('text/plain') ||
                 e.dataTransfer.getData('application/json');
      console.log(`FolderCard: drop data on folder ${item.id}:`, raw);

      const data = JSON.parse(raw);
      console.log(`Dropping ${data.type} ${data.id} onto folder ${item.id}`);

      if (!data || !data.id) {
        console.warn('Invalid drop data');
        return;
      }

      // Prevent invalid moves
      if (data.type === 'folder' && data.id === item.id) {
        console.log('Cannot drop folder into itself');
        return;
      }

      // Prevent dropping into same parent
      if (data.parentId === item.id) {
        console.log('Item is already in this folder');
        return;
      }

      // Move the item
      await chrome.bookmarks.move(data.id, { parentId: item.id });
      console.log(`Moved ${data.id} to folder ${item.id}`);

      // Refresh both source and target
      refreshBody();
      renderBookmarkGrid();
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
// helper: render this folder's body
function refreshBody() {
  const body = groupCard.querySelector('.mini-group-body');
  body.innerHTML = '';
  chrome.bookmarks.getChildren(item.id, list => {
    const bookmarks = list.filter(c => c.url);
    if (bookmarks.length === 0) {
      body.textContent = 'Không có bookmark';
    } else {
      bookmarks.forEach(c => {
        const row = document.createElement('div');
        row.className = 'bookmark-row nested';
        row.draggable = true;
        row.title = c.title;
        row.addEventListener('dragstart', ev => {
          ev.dataTransfer.setData(
            'text/plain',
            JSON.stringify({ type: 'bookmark', id: c.id })
          );
          ev.dataTransfer.effectAllowed = 'move';
          row.classList.add('dragging');
        });
        row.addEventListener('dragend', () => row.classList.remove('dragging'));
        row.innerHTML = `
          <img class="mini-bookmark-icon" src="https://www.google.com/s2/favicons?sz=16&domain_url=${c.url}" alt="">
          ${c.title}
        `;
        body.appendChild(row);
      });
    }
  });
}
// initial render of persistent folder
refreshBody();

  // Menu button & dropdown
  const menuBtn = document.createElement('button');
  menuBtn.className = 'folder-menu-btn';
  menuBtn.textContent = '⋯';
  groupCard.insertBefore(menuBtn, groupCard.firstChild);

  const dropdown = document.createElement('div');
  dropdown.className = 'folder-dropdown';
  dropdown.innerHTML =
    '<button class="rename-folder">Rename</button>' +
    '<button class="delete-folder">Delete</button>' +
    '<button class="add-bookmark-folder">Add Bookmark</button>';
  groupCard.appendChild(dropdown);

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
    body.innerHTML =
      '<div class="add-bookmark-inline">' +
      '  <input class="bookmark-url-input" placeholder="Enter URL" />' +
      '  <button class="confirm-url">✅</button>' +
      '</div>';
    const urlInput = body.querySelector('.bookmark-url-input');
    const confirmUrl = body.querySelector('.confirm-url');

    const toTitle = () => {
      const u = urlInput.value.trim();
      return u ? new URL(u).hostname : '';
    };
    urlInput.addEventListener('input', () => {
      const title = toTitle();
      urlInput.title = title;
    });
    confirmUrl.addEventListener('click', async () => {
      const u = urlInput.value.trim();
      if (!u) return;
      const bk = await chrome.bookmarks.create({
        parentId: item.id,
        title: toTitle(),
        url: u,
      });
      item.children.push(bk);
      renderBookmarkGrid();
    });
  });

  return groupCard;
}