import { createBookmarkCard } from './BookmarkCard.js';

export function createFolderCard(folder) {
  const card = document.createElement('div');
  card.className = 'folder-card';
  card.dataset.id = folder.id;

  const header = document.createElement('div');
  header.className = 'folder-header';
  header.innerHTML = `<div class="folder-icon">📁</div><div class="folder-title">${folder.title}</div>`;
  card.append(header);

  const body = document.createElement('div');
  body.className = 'folder-body';
  body.style.display = 'grid';
  card.append(body);

  // Render nested children
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


  return card;
}