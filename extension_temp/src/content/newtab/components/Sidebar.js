import { renderBookmarkGrid } from './BookmarkGrid.js';

export async function renderSidebar(folders) {
  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
  const sidebar = document.getElementById('sidebar');
  sidebar.innerHTML = '';

  // Load persisted sidebar order
  const { sidebarOrder } = await new Promise(res =>
    chrome.storage.local.get({ sidebarOrder: null }, res)
  );

  // Build first-level groups: skip Bookmark Bar, expand Other bookmarks children
  const groups = [];
  folders.forEach(node => {
    if (node.url) return;
    if (node.title === 'Other bookmarks' && node.children) {
      node.children
        .filter(child => !child.url)
        .forEach(child => groups.push(child));
    } else {
      groups.push(node);
    }
  });

  // Apply saved sidebar order
  if (sidebarOrder && Array.isArray(sidebarOrder)) {
    groups.sort((a, b) => {
      const ai = sidebarOrder.indexOf(a.id);
      const bi = sidebarOrder.indexOf(b.id);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }

  // Count URLs recursively
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

  // Render each folder group
  groups.forEach(folder => {
    const count = countUrls(folder);
    const element = document.createElement('div');
    element.className = 'group-item';
    element.dataset.id = folder.id;
    element.innerHTML = `
      <div class="group-color" style="background-color: ${
        colors[Math.floor(Math.random() * colors.length)]
      }"></div>
      <span class="group-name">${folder.title}</span>
      <span class="group-count">${count}</span>
    `;
    element.setAttribute('tabindex', '0');

    // Make draggable
    element.draggable = true;
    element.addEventListener('dragstart', e => {
      // Use text/plain for broader compatibility
      e.dataTransfer.setData(
        'text/plain',
        JSON.stringify({ id: folder.id, type: 'folder' })
      );
      element.classList.add('dragging');
    });
    element.addEventListener('dragend', () => {
      element.classList.remove('dragging');
    });

    sidebar.appendChild(element);
  });

  // Attach event handlers
  sidebar.querySelectorAll('.group-item').forEach(item => {
    item.addEventListener('click', async e => {
      e.stopPropagation();
      sidebar.querySelectorAll('.group-item').forEach(i =>
        i.classList.remove('active')
      );
      item.classList.add('active');
      const folderId = item.dataset.id;

      // Persist this selection
      chrome.storage.local.set({ lastFolderId: folderId });

      // fetch children and grandchildren
      const list = await new Promise(res =>
        chrome.bookmarks.getChildren(folderId, res)
      );
      let children = list || [];
      children = await Promise.all(
        children.map(async child => {
          if (!child.url) {
            const subs = await new Promise(res =>
              chrome.bookmarks.getChildren(child.id, res)
            );
            child.children = subs || [];
          }
          return child;
        })
      );

      const grid = document.getElementById('bookmark-grid');
      grid.dataset.parentId = folderId;
      grid.dataset.depth = '1';
      document.getElementById('folder-title').textContent =
        item.querySelector('.group-name').textContent;

      let folderObj =
        folders.find(f => f.id === folderId) || {
          id: folderId,
          title: item.querySelector('.group-name')?.textContent || '',
          children: []
        };
      folderObj.children = children;
      renderBookmarkGrid(children, 1, folderObj);
    });

    // Rename on F2
    item.addEventListener('keydown', async e => {
      if (e.key === 'F2') {
        e.preventDefault();
        const span = item.querySelector('.group-name');
        const newName = prompt('Tên mới:', span.textContent);
        if (newName) {
          await chrome.bookmarks.update(item.dataset.id, { title: newName });
          span.textContent = newName;
        }
      }
      // Delete on Delete
      if (e.key === 'Delete') {
        e.preventDefault();
        if (
          confirm(
            'Are you sure you want to delete this folder and all its bookmarks?'
          )
        ) {
          await chrome.bookmarks.removeTree(item.dataset.id);
          item.remove();
        }
      }
    });

    // Drag visuals
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

    // Drop
    item.addEventListener('drop', async e => {
      e.preventDefault();
      item.classList.remove('drag-over');
      e.stopPropagation();
      let data;
      try {
        data = JSON.parse(
          e.dataTransfer.getData('application/json') ||
            e.dataTransfer.getData('text/plain')
        );
      } catch {
        return;
      }

      // Reorder sidebar groups
      if (data.type === 'folder') {
        const srcEl = sidebar.querySelector(
          `.group-item[data-id="${data.id}"]`
        );
        if (srcEl && srcEl !== item) {
          const rect = item.getBoundingClientRect();
          const isTop = e.clientY < rect.top + rect.height / 2;
          sidebar.insertBefore(srcEl, isTop ? item : item.nextSibling);
          // Persist new order
          const newOrder = Array.from(
            sidebar.querySelectorAll('.group-item')
          ).map(el => el.dataset.id);
          chrome.storage.local.set({ sidebarOrder: newOrder });
        }
        return;
      }

      // Otherwise move bookmark/folder into this folder
      const folderIdDrop = item.dataset.id;
      try {
        await chrome.bookmarks.move(data.id, { parentId: folderIdDrop });
        const list = await new Promise(res =>
          chrome.bookmarks.getChildren(folderIdDrop, res)
        );
        const children = list || [];
        let folderObj = folders.find(f => f.id === folderIdDrop);
        if (!folderObj) {
          folderObj = {
            id: folderIdDrop,
            title: item.querySelector('.group-name')?.textContent || '',
            children
          };
        } else {
          folderObj.children = children;
        }
        renderBookmarkGrid(children, 1, folderObj);
      } catch (err) {
        console.error('Drop to sidebar folder failed', err);
      }
    });
  });

  // Auto-select last active or default
  chrome.storage.local.get({ lastFolderId: null }, ({ lastFolderId }) => {
    if (lastFolderId) {
      const activeEl = sidebar.querySelector(
        `.group-item[data-id="${lastFolderId}"]`
      );
      if (activeEl) {
        activeEl.classList.add('active');
        activeEl.scrollIntoView({ block: 'nearest' });
        activeEl.click();
      }
    } else {
      const defaultEl = sidebar.querySelector('.group-item[data-id="1"]');
      if (defaultEl) {
        defaultEl.classList.add('active');
        defaultEl.scrollIntoView({ block: 'nearest' });
        defaultEl.click();
      }
    }
  });
}