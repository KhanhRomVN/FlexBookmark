import { createBookmarkCard } from './BookmarkCard.js';
import { showToast } from '../../utils/helpers.js';

/**
 * Creates a folder card element with nested bookmarks/subfolders,
 * plus rename & delete actions via contextual menu.
 * @param {Object} folder - Folder data (id, title, children).
 * @returns {HTMLElement}
 */
export function createFolderCard(folder, renderBookmarkGrid, depth = 0) {
  const card = document.createElement('div');
  card.className = 'folder-card';
  card.dataset.id = folder.id;
  card.style.position = 'relative';
  card.draggable = true; // Make folder draggable
// Masonry layout styles
  card.style.breakInside = 'avoid';
  card.style.marginBottom = '1.25rem';
  if (folder.isSearchResult) {
    card.classList.add('search-result');
  }

  // Drag-and-drop support for folders
  card.addEventListener('dragstart', e => {
    e.dataTransfer.setData('text/plain', JSON.stringify({
      id: folder.id,
      type: 'folder',
      title: folder.title
    }));
    card.classList.add('dragging');
  });
  card.addEventListener('dragend', () => card.classList.remove('dragging'));

  card.addEventListener('dragover', e => {
    e.preventDefault();
    card.classList.add('folder-drop-target');

    // Compute drop position
    const rect = card.getBoundingClientRect();
    const isTopHalf = e.clientY < rect.top + rect.height / 2;

    if (isTopHalf) {
      card.style.borderTop = '2px solid var(--primary-color)';
      card.style.borderBottom = 'none';
    } else {
      card.style.borderBottom = '2px solid var(--primary-color)';
      card.style.borderTop = 'none';
    }
  });
  card.addEventListener('dragleave', () => {
    card.classList.remove('folder-drop-target');
    card.style.borderTop = 'none';
    card.style.borderBottom = 'none';
  });

  // Simplified drop handler: move then current grid refresh
  card.addEventListener('drop', async e => {
    e.preventDefault();
    e.stopPropagation();
    card.classList.remove('folder-drop-target');
    
    // Reset border styles
    card.style.borderTop = 'none';
    card.style.borderBottom = 'none';
    
    let data;
    try {
      data = JSON.parse(e.dataTransfer.getData('text/plain'));
    } catch {
      return;
    }
    
    // Decide new parent for bookmark or folder
    let newParent = folder.id;
    if (data.type === 'folder') {
      if (depth >= 1) {
        showToast('Cannot nest folders beyond level 2', 'error');
        return;
      }
      if (data.id === folder.id) {
        showToast('Cannot move folder into itself', 'error');
        return;
      }
    } else if (data.type !== 'bookmark') {
      return;
    }
    
    try {
      await chrome.bookmarks.move(data.id, { parentId: newParent });
    } catch (err) {
      console.error('Error moving item:', err);
    }
    
    // Update current grid
    const grid = document.getElementById('bookmark-grid');
    const pid = grid.dataset.parentId;
    const d = parseInt(grid.dataset.depth || '0');
    chrome.bookmarks.getChildren(pid, children => {
      chrome.bookmarks.get(pid, ([parentFolder]) => {
        renderBookmarkGrid(children, d, parentFolder);
      });
    });
  });

  // Header with title & icon
  const header = document.createElement('div');
  header.className = 'folder-header';
  header.innerHTML = `
    <div class="folder-icon">📁</div>
    <div class="folder-title">${folder.title}</div>
  `;

  // Menu button & dropdown
  const menuBtn = document.createElement('button');
  menuBtn.className = 'folder-menu-btn';
  menuBtn.textContent = '⋮';
  header.append(menuBtn);

  const dropdown = document.createElement('div');
  dropdown.className = 'menu-dropdown';
  dropdown.innerHTML = `
    <button class="menu-rename">✏️ Rename</button>
    <button class="menu-delete">🗑️ Delete</button>
    <button class="menu-add-bookmark">🔖 New bookmark</button>
  `;
  header.append(dropdown);

  card.append(header);

  // Render body
  const body = document.createElement('div');
  body.className = 'folder-body';
  body.style.display = depth >= 1 ? 'block' : 'grid';
  // Synthetic temp group support
  if (folder.isSearchResult) {
    const titleEl = document.createElement('div');
    titleEl.className = 'mini-group-header';
    titleEl.innerHTML = `${folder.title} <span class="search-match-count">(${folder.children.length} matches)</span>`;
    header.innerHTML = '';
    header.appendChild(titleEl);

    body.innerHTML = '';
    folder.children.forEach(child => {
      const bm = createBookmarkCard(child, null, 0, folder);
      body.appendChild(bm);
    });
  } else
  if (folder.id.startsWith('temp')) {
    body.innerHTML = '';
    (folder.children || []).forEach(child => {
      if (child.url) {
        const bm = createBookmarkCard(child, renderBookmarkGrid, folder.children, depth + 1, folder);
        bm.classList.add('nested-bookmark');
        body.append(bm);
      } else {
        body.append(createFolderCard(child, renderBookmarkGrid, depth + 1));
      }
    });
  } else {
    chrome.bookmarks.getChildren(folder.id, (children) => {
    const real = children.filter(c => !c.id.startsWith('temp-'));
    body.innerHTML = '';
    real.forEach(child => {
      if (child.url) {
        const bm = createBookmarkCard(child, renderBookmarkGrid, real, depth + 1, folder);
        bm.classList.add('nested-bookmark');
        body.append(bm);
      } else {
        body.append(createFolderCard(child, renderBookmarkGrid, depth + 1));
      }
    });
  });
}
  card.append(body);

  // -- Actions --
  menuBtn.addEventListener('click', e => {
    e.stopPropagation();
    dropdown.classList.toggle('show');
  });

  dropdown.querySelector('.menu-add-bookmark')?.addEventListener('click', async e => {
    e.stopPropagation();
    const title = prompt('Bookmark title');
    const url = prompt('Bookmark URL');
    if (!title || !url) {
      showToast('Title and URL are required', 'error');
      return;
    }
    try {
      await chrome.bookmarks.create({ parentId: folder.id, title, url });
      showToast('Bookmark added', 'success');
    } catch {
      showToast('Error creating bookmark', 'error');
    }
    dropdown.classList.remove('show');
    // refresh grid
    const gridEl = document.getElementById('bookmark-grid');
    const pid2 = gridEl.dataset.parentId;
    const d2 = parseInt(gridEl.dataset.depth || '0');
    chrome.bookmarks.getChildren(pid2, children2 => {
      chrome.bookmarks.get(pid2, ([pf]) => {
        renderBookmarkGrid(children2, d2, pf);
      });
    });
  });

  dropdown.querySelector('.menu-rename')?.addEventListener('click', async e => {
    e.stopPropagation();
    const newTitle = prompt('New folder name', folder.title) || folder.title;
    await chrome.bookmarks.update(folder.id, { title: newTitle });
    header.querySelector('.folder-title').textContent = newTitle;
    dropdown.classList.remove('show');
  });

  dropdown.querySelector('.menu-delete')?.addEventListener('click', async e => {
    e.stopPropagation();
    if (confirm('Delete this folder and all its contents?')) {
      await chrome.bookmarks.removeTree(folder.id);
      card.remove();
    }
    dropdown.classList.remove('show');
  });

  // Close dropdown on outside click
  document.addEventListener('click', () => {
    dropdown.classList.remove('show');
  });

  return card;
}