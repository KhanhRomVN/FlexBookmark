import { createBookmarkCard } from './BookmarkCard.js';

export function createFolderCard(folder, onClickHandler) {
  const card = document.createElement('div');
  card.className = 'folder-card';
  card.dataset.id = folder.id;

  // header
  const header = document.createElement('div');
  header.className = 'folder-header';
  header.innerHTML = `
    <div class="folder-icon">📁</div>
    <div class="folder-title">${folder.title}</div>
  `;
  card.append(header);

  // body container
  const body = document.createElement('div');
  body.className = 'folder-body';
  card.append(body);

  // render each child as bookmark card
  folder.children.forEach(child => {
    if (child.url) {
      const bookmarkCard = createBookmarkCard(
        child,
        () => chrome.tabs.create({ url: child.url }),
        folder.children
      );
      body.append(bookmarkCard);
      // nested bookmark clicks: open URL in new tab
      bookmarkCard.addEventListener('click', e => {
        e.stopPropagation();
        chrome.tabs.create({ url: child.url });
      });
    }
  });

  // clicking header navigates into folder
  header.addEventListener('click', () => onClickHandler(folder));

  return card;
}