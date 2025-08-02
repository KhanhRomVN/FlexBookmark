import { renderBookmarkGrid } from './BookmarkGrid.js';
export function renderSidebar(folders) {
  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
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

  // Render each folder group
  groups.forEach(folder => {
    const count = countUrls(folder);
    const element = document.createElement('div');
    element.className = 'group-item';
    element.dataset.id = folder.id;
    element.innerHTML = `
      <div class="group-color" style="background-color: ${colors[Math.floor(Math.random() * colors.length)]}"></div>
      <span class="group-name">${folder.title}</span>
      <span class="group-count">${count}</span>
    `;
    sidebar.appendChild(element);

    // F2 rename folder
    element.setAttribute('tabindex', '0');
    element.addEventListener('keydown', async (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        const groupNameSpan = element.querySelector('.group-name');
        const newName = prompt('Tên mới:', groupNameSpan.textContent);
        if (newName) {
          await chrome.bookmarks.update(folder.id, { title: newName });
          groupNameSpan.textContent = newName;
        }
      }
    });
  });


  // Attach event handlers
  sidebar.querySelectorAll('.group-item').forEach(item => {
    item.addEventListener('click', async e => {
      e.stopPropagation();
      sidebar.querySelectorAll('.group-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      const folderId = item.dataset.id;

      // Persist this selection
      chrome.storage.local.set({ lastFolderId: folderId });

      // fetch direct children and their grandchildren for nested view
      const list = await new Promise(res => chrome.bookmarks.getChildren(folderId, res));
      let children = list || [];
      // enrich subfolders with grandchildren
      children = await Promise.all(children.map(async child => {
        if (!child.url) {
          const subs = await new Promise(res => chrome.bookmarks.getChildren(child.id, res));
          child.children = subs || [];
        }
        return child;
      }));
      console.log('Sidebar click:', { folderId, childrenLength: children.length, children });
      // update grid context attributes
      const grid = document.getElementById('bookmark-grid');
      grid.dataset.parentId = folderId;
      grid.dataset.depth = '1';
      document.getElementById('folder-title').textContent =
        item.querySelector('.group-name').textContent;
      // Build enriched folder object
      let folderObj = folders.find(f => f.id === folderId) || {
        id: folderId,
        title: item.querySelector('.group-name')?.textContent || '',
        children: []
      };
      folderObj.children = children;
      console.log('About to call renderBookmarkGrid with:', { depth: 1, folderObj, items: children });
      renderBookmarkGrid(children, 1, folderObj);
    });

    // Drag-and-drop handlers for sidebar folder items
    item.addEventListener('dragenter', e => {
      console.log('Sidebar: dragenter on folder', item.dataset.id);
      e.preventDefault();
      item.classList.add('drag-over');
    });
    item.addEventListener('dragover', e => {
      console.log('Sidebar: dragover on folder', item.dataset.id);
      e.preventDefault();
      item.classList.add('drag-over');
    });
    item.addEventListener('dragleave', () => {
      item.classList.remove('drag-over');
    });
    item.addEventListener('drop', async e => {
      console.log('Sidebar: drop event, types=', e.dataTransfer.types);
      e.preventDefault();
      item.classList.remove('drag-over');
      e.stopPropagation();
      const raw = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('application/json');
      console.log('Sidebar: drop data=', raw);
      try {
        const data = JSON.parse(raw);
        if (!data || !data.id) return;
        const folderIdDrop = item.dataset.id;
        if (data.type === 'folder' && data.id === folderIdDrop) {
          console.log('Cannot drop folder into itself');
          return;
        }
        await chrome.bookmarks.move(data.id, { parentId: folderIdDrop });
        const list = await new Promise(res => chrome.bookmarks.getChildren(folderIdDrop, res));
        const childrenDrop = list || [];
        // Find or build folder object for drop context
        let folderObjDrop = folders.find(f => f.id === folderIdDrop);
        if (!folderObjDrop) {
          folderObjDrop = { id: folderIdDrop, title: item.querySelector('.group-name')?.textContent || '', children: childrenDrop };
        } else {
          folderObjDrop.children = childrenDrop;
        }
        renderBookmarkGrid(childrenDrop, 1, folderObjDrop);
      } catch (err) {
        console.error('Drop to sidebar folder failed', err);
      }
    });
  });
}