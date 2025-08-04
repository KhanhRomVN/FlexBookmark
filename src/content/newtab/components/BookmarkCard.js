/**
 * Creates a bookmark card element with delete, edit, and click functionality.
 * @param {Object} item - Bookmark data (id, url, title).
 * @param {Function} renderBookmarkGrid - Callback to re-render the grid.
 * @param {Array} items - Current list of items for rerendering context.
 * @returns {HTMLElement}
 */
import { showToast } from '../../utils/helpers.js';
import { showBookmarkForm } from './BookmarkForm.js';
import { createFolderCard } from './FolderCard.js';

export function createBookmarkCard(item, renderBookmarkGrid, items, depth = 0, folder = null) {
  const card = document.createElement('div');
  card.className = 'bookmark-card';
  card.draggable = true;
  card.style.position = 'relative';
  card.style.transition = 'border-color 0.2s, box-shadow 0.2s';
  card.dataset.id = item.id;

  // wrap in container for layering and hover isolation
  const container = document.createElement('div');
  container.className = 'bookmark-card-container';
  container.appendChild(card);

  // Card content with favicon icon
  card.innerHTML = `
    <div class="bookmark-header">
      <img class="bookmark-icon" src="https://www.google.com/s2/favicons?sz=64&domain_url=${item.url}" alt="">
      <div class="bookmark-title">${item.title}</div>
    </div>
  `;

  // Menu button setup
  const headerEl = card.querySelector('.bookmark-header');
  const menuBtn = document.createElement('button');
  menuBtn.style.display = 'none';
  menuBtn.className = 'bookmark-menu-btn';
  menuBtn.textContent = '⋮';
  headerEl.append(menuBtn);

  const dropdown = document.createElement('div');
  dropdown.className = 'menu-dropdown';
  dropdown.innerHTML =
    '<button class="menu-edit">✏️ Edit</button>' +
    '<button class="menu-delete">🗑️ Delete</button>';
  headerEl.append(dropdown);

  // Hover handlers for border and menu visibility
  card.addEventListener('mouseenter', () => {
    if (!card.closest('.folder-card')) {
      // card.style.borderColor = '#3b82f6'; // disabled hover border effect
    }
    menuBtn.style.display = 'block';
  });
  card.addEventListener('mouseleave', () => {
    if (!card.closest('.folder-card')) {
      // card.style.borderColor = 'transparent'; // disabled hover border reset
    }
    menuBtn.style.display = 'none';
    // dropdown stays open until outside click; do not auto-close on leave
  });

  // Toggle dropdown on menu click
  menuBtn.addEventListener('click', e => {
    e.stopPropagation();
    dropdown.classList.toggle('show');
  });

  // Edit bookmark via form
  dropdown.querySelector('.menu-edit')?.addEventListener('click', e => {
    e.stopPropagation();
    showBookmarkForm({
      parentId: (folder && folder.id) || document.getElementById('bookmark-grid').dataset.parentId,
      renderBookmarkGrid,
      depth,
      folder,
      bookmark: item
    });
    dropdown.classList.remove('show');
  });

  // Delete from dropdown
  dropdown.querySelector('.menu-delete')?.addEventListener('click', async e => {
    e.stopPropagation();
    if (confirm('Delete this bookmark?')) {
      await chrome.bookmarks.remove(item.id);
      card.remove();
    }
    dropdown.classList.remove('show');
  });

  // Close dropdown when clicking outside only if click outside menu
  document.addEventListener('click', e => {
    if (!e.target.closest('.menu-dropdown') && !e.target.closest('.menu-btn')) {
      dropdown.classList.remove('show');
    }
  });

  if (typeof renderBookmarkGrid === 'function') {
    // Drag-and-drop support
    card.addEventListener('dragstart', e => {
      // Prevent parent folder from also initiating drag
      e.stopPropagation();
      console.log('BookmarkCard dragstart');
      const grid = document.getElementById('bookmark-grid');
      const sourceParent = (folder && folder.id) || grid.dataset.parentId;
      const sourceDepth = depth;
      e.dataTransfer.setData('text/plain', JSON.stringify({
        id: item.id,
        type: 'bookmark',
        title: item.title,
        sourceParentId: sourceParent,
        sourceDepth: sourceDepth
      }));
      card.classList.add('dragging');
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
    });
    card.addEventListener('dragover', e => {
      console.log('BookmarkCard dragover', item.id);
      e.preventDefault();
      card.classList.add('drop-target');
    });
    card.addEventListener('dragleave', () => {
      card.classList.remove('drop-target');
    });
    card.addEventListener('drop', async e => {
      e.preventDefault();
      e.stopPropagation();
      card.classList.remove('drop-target');

      const raw = e.dataTransfer.getData('text/plain');
      const data = JSON.parse(raw);

      const grid = document.getElementById('bookmark-grid');
      const currentParentId = grid.dataset.parentId;
      const currentDepth = parseInt(grid.dataset.depth || '0');

      if (data.type === 'bookmark') {
        await chrome.bookmarks.move(data.id, { parentId: folder.id });
      } else if (data.type === 'folder') {
        await chrome.bookmarks.move(item.id, { parentId: data.id });
      }

      // Cập nhật toàn bộ grid sau khi di chuyển
      chrome.bookmarks.getChildren(currentParentId, children => {
        chrome.bookmarks.get(currentParentId, ([parentFolder]) => {
          renderBookmarkGrid(children, currentDepth, parentFolder);
        });
      });
    });
  }

  // Click anywhere on card to open URL in a new tab next to current
  card.addEventListener('click', e => {
    if (!e.target.closest('.menu-btn') && !e.target.closest('.menu-dropdown')) {
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        const currentIndex = (tabs[0] && tabs[0].index) || 0;
        chrome.tabs.create({ url: item.url, index: currentIndex + 1 });
      });
    }
  });

  return container;
}