import { createBookmarkCard } from './BookmarkCard.js';

/**
 * Creates a folder card element with nested bookmarks/subfolders,
 * plus rename & delete actions via contextual menu.
 * @param {Object} folder - Folder data (id, title, children).
 * @returns {HTMLElement}
 */
export function createFolderCard(folder) {
  const card = document.createElement('div');
  card.className = 'folder-card';
  card.dataset.id = folder.id;
  card.style.position = 'relative';

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
  body.style.display = 'grid';

  folder.children.forEach(child => {
    if (child.url) {
      const bookmarkCard = createBookmarkCard(child, null, folder.children);
      bookmarkCard.classList.add('nested-bookmark');
      body.append(bookmarkCard);
    } else {
      const subFolderCard = createFolderCard(child);
      body.append(subFolderCard);
    }
  });

  card.append(body);
  return card;
}