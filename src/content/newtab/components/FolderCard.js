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

  // Drag-and-drop support for folders
  card.addEventListener('dragstart', e => {
    console.log('FolderCard dragstart');
    e.dataTransfer.setData('text/plain', JSON.stringify({
      id: folder.id,
      type: 'folder',
      title: folder.title
    }));
    card.classList.add('dragging');
  });

  card.addEventListener('dragend', () => {
    card.classList.remove('dragging');
  });

  card.addEventListener('dragover', e => {
    console.log('FolderCard dragover');
    e.preventDefault();
    card.classList.add('drop-target');
  });

  card.addEventListener('dragleave', () => {
    card.classList.remove('drop-target');
  });

  card.addEventListener('drop', async e => {
    e.stopPropagation();
    console.log('FolderCard drop handler start', {
      folderId: folder.id,
      depth,
      gridParentId: document.getElementById('bookmark-grid').dataset.parentId,
      gridDepth: document.getElementById('bookmark-grid').dataset.depth
    });
    console.log('FolderCard drop event for folder', folder.id);
    e.preventDefault();
    card.classList.remove('drop-target');
    
    const raw = e.dataTransfer.getData('text/plain');
    console.log('FolderCard drop raw data:', raw);
    let data;
    try {
      data = JSON.parse(raw);
      console.log('FolderCard parsed drop data:', data, {
        depth,
        folderId: folder.id,
        gridParentId: document.getElementById('bookmark-grid').dataset.parentId,
        gridDepth: document.getElementById('bookmark-grid').dataset.depth
      });
    } catch (err) {
      console.error('FolderCard drop JSON parse error:', err);
      return;
    }

    // Handle dropping a bookmark into this folder
    if (data.type === 'bookmark') {
      console.log(`Moving bookmark ${data.id} into folder ${folder.id}`);
      try {
        await chrome.bookmarks.move(data.id, { parentId: folder.id });
        console.log('Bookmark move successful');
      } catch (err) {
        console.error('Error moving bookmark:', err);
      }
      console.log('Updating folder card body for bookmark drop', folder.id);
      chrome.bookmarks.getChildren(folder.id, (children) => {
        const body = card.querySelector('.folder-body');
        if (body) {
          body.innerHTML = '';
          children.forEach(child => {
            if (child.url) {
              const bookmarkCard = createBookmarkCard(child, renderBookmarkGrid, children, depth + 1, folder);
              bookmarkCard.classList.add('nested-bookmark');
              body.append(bookmarkCard);
            } else {
              const subFolderCard = createFolderCard(child, renderBookmarkGrid, depth + 1);
              body.append(subFolderCard);
            }
          });
        }
      });
      // Re-render source grid to reflect removal from original location
      const sourceContainer = document.getElementById('bookmark-grid');
      const sourceParentId = sourceContainer.dataset.parentId;
      const sourceDepth = parseInt(sourceContainer.dataset.depth || '0');
      chrome.bookmarks.getChildren(sourceParentId, (siblings) => {
        // Re-render grid with correct folder context for immediate UI update
        if (sourceDepth > 0) {
          chrome.bookmarks.get(sourceParentId, ([sourceFolder]) => {
            renderBookmarkGrid(siblings, sourceDepth, sourceFolder);
          });
        } else {
          renderBookmarkGrid(siblings, sourceDepth, null);
        }
      });
      return;
    }
    
    // Handle dropping a folder into this folder (move/ nest folder)
    if (data.type === 'folder') {
      // Prevent nesting beyond level 2
      if (depth >= 1) {
        console.log('Cannot nest folders beyond level 2');
        showToast('Cannot nest folders beyond level 2', 'error');
        return;
      }
      // Prevent moving folder into itself
      if (data.id === folder.id) {
        console.warn('Cannot move folder into itself');
        showToast('Cannot move folder into itself', 'error');
        return;
      }
      // Proceed with folder move
      console.log(`Moving folder ${data.id} into folder ${folder.id}`);
      try {
        await chrome.bookmarks.move(data.id, { parentId: folder.id });
        console.log('Folder move successful');
      } catch (err) {
        console.error('Error moving folder:', err);
      }
      console.log('Fetching children of folder', folder.id);
      chrome.bookmarks.getChildren(folder.id, (children) => {
        console.log('Fetched children count after folder move:', children.length);
        // Also update nested body of this folder-card so it shows the new subfolder
        const body = card.querySelector('.folder-body');
        if (body) {
          body.innerHTML = '';
          // Fetch subtree to get updated children list
          chrome.bookmarks.getSubTree(folder.id, (trees) => {
            const updated = (trees[0] && trees[0].children) || [];
            updated.forEach(child => {
              if (child.url) {
                const bookmarkCard = createBookmarkCard(child, renderBookmarkGrid, updated, 1, folder);
                bookmarkCard.classList.add('nested-bookmark');
                body.append(bookmarkCard);
              } else {
                const subFolderCard = createFolderCard(child, renderBookmarkGrid, 1);
                body.append(subFolderCard);
              }
            });
          });
        }
      });
    }
    // Refresh current grid view to reflect moved folder
    const container = document.getElementById('bookmark-grid');
    const parentId = container.dataset.parentId;
    const depthVal = parseInt(container.dataset.depth || '0');
    chrome.bookmarks.getChildren(parentId, (children) => {
      renderBookmarkGrid(children, depthVal);
    });
  });

  // Header with title & icon
  const header = document.createElement('div');
  header.className = 'folder-header';
  header.innerHTML = `
    <div class="folder-icon">📁</div>
    <div class="folder-title">${folder.title}</div>
  `;

  // Menu button (hidden until hover)
  const menuBtn = document.createElement('button');
  menuBtn.className = 'menu-btn';
  menuBtn.style.display = 'none';
  menuBtn.textContent = '⋮';
  header.append(menuBtn);

  // Dropdown with Rename/Delete
  const dropdown = document.createElement('div');
  dropdown.className = 'folder-dropdown';
  dropdown.innerHTML = `
    <button class="menu-rename">Rename</button>
    <button class="menu-delete">Delete</button>
  `;
  header.append(dropdown);

  // Show/hide menu on hover
  card.addEventListener('mouseenter', () => {
    menuBtn.style.display = 'block';
  });
  card.addEventListener('mouseleave', () => {
    menuBtn.style.display = 'none';
  });

  // Toggle dropdown on click
  menuBtn.addEventListener('click', e => {
    e.stopPropagation();
    const showing = dropdown.classList.toggle('show');
    dropdown.style.display = showing ? 'flex' : 'none';
    dropdown.style.flexDirection = 'column';
  });

  // Rename action
  dropdown.querySelector('.menu-rename')?.addEventListener('click', async e => {
    e.stopPropagation();
    const newTitle = prompt('New folder name', folder.title) || folder.title;
    await chrome.bookmarks.update(folder.id, { title: newTitle });
    header.querySelector('.folder-title').textContent = newTitle;
    dropdown.classList.remove('show');
  });

  // Delete action
  dropdown.querySelector('.menu-delete')?.addEventListener('click', async e => {
    e.stopPropagation();
    if (confirm('Delete this folder and all its contents?')) {
      await chrome.bookmarks.removeTree(folder.id);
      card.remove();
    }
    dropdown.classList.remove('show');
  });

  // Close dropdown when clicking outside this folder card
  document.addEventListener('click', e => {
    if (!card.contains(e.target)) {
      dropdown.classList.remove('show');
    }
  });

  card.append(header);

  // Body grid of nested items
  const body = document.createElement('div');
  body.className = 'folder-body';
  // Limit nesting in UI
  if (depth >= 1) {
    body.style.display = 'block';
    body.style.gridTemplateColumns = '1fr';
  } else {
    body.style.display = 'grid';
  }

  // Filter children to prevent invalid nesting
  const validChildren = (folder.children || []).filter(child => {
    // Only allow bookmarks at level 2
    if (depth >= 1) return !!child.url;
    // For level 1, allow folders but limit their children
    if (child.children) {
      child.children = child.children.filter(grandchild => !!grandchild.url);
    }
    return true;
  });

  validChildren.forEach(child => {
    if (child.url) {
      const bookmarkCard = createBookmarkCard(child, renderBookmarkGrid, folder.children, depth + 1, folder);
      bookmarkCard.classList.add('nested-bookmark');
      body.append(bookmarkCard);
    } else {
      const subFolderCard = createFolderCard(child, renderBookmarkGrid, depth + 1);
      body.append(subFolderCard);
    }
  });

  card.append(body);
  return card;
}