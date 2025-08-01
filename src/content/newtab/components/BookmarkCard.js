/**
 * Creates a bookmark card element with drag, delete, and edit functionality.
 * @param {Object} item - Bookmark data (id, url, title).
 * @param {Function} renderBookmarkGrid - Callback to re-render the grid.
 * @param {Array} items - Current list of items for rerendering context.
 * @returns {HTMLElement}
 */
export function createBookmarkCard(item, renderBookmarkGrid, items) {
  const card = document.createElement('div');
  card.className = 'bookmark-card';
  card.draggable = true;
  card.addEventListener('dragstart', e => {
    e.dataTransfer.setData(
      'text/plain',
      JSON.stringify({
        type: 'bookmark',
        id: item.id,
        parentId: item.parentId
      })
    );
    e.dataTransfer.effectAllowed = 'move';
    card.classList.add('dragging');
  });

  card.innerHTML = `
    <div class="bookmark-header">
      <img class="bookmark-icon" src="https://www.google.com/s2/favicons?sz=64&domain_url=${item.url}" alt="">
      <div class="bookmark-title" title="${item.title}">${item.title}</div>
      <div class="bookmark-actions">
        <button class="action-btn delete-btn" data-id="${item.id}" title="Xóa">🗑️</button>
        <button class="action-btn edit-btn" data-id="${item.id}" title="Chỉnh sửa">✏️</button>
      </div>
    </div>
  `;

  const deleteBtn = card.querySelector('.delete-btn');
  deleteBtn.addEventListener('click', async e => {
    e.stopPropagation();
    await chrome.bookmarks.remove(item.id);
    card.remove();
  });

  const editBtn = card.querySelector('.edit-btn');
  editBtn.addEventListener('click', async e => {
    e.stopPropagation();
// Drag-and-drop visual handlers for bookmark card
card.addEventListener('dragenter', e => {
  e.preventDefault();
  card.classList.add('drag-over');
});
card.addEventListener('dragover', e => {
  e.preventDefault();
  card.classList.add('drag-over');
});
card.addEventListener('dragleave', () => {
  card.classList.remove('drag-over');
});
card.addEventListener('drop', async e => {
  e.preventDefault();
  card.classList.remove('drag-over');
  const raw = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('application/json');
  try {
    const data = JSON.parse(raw);
    // TODO: handle drop logic if needed
  } catch (err) {
    console.error('Invalid drop data on bookmark card', err);
  }
});

// Remove drag state classes on drag end
card.addEventListener('dragend', () => {
  card.classList.remove('dragging', 'drag-over');
});
    const newUrl = prompt('URL mới', item.url) || item.url;
    const newTitle = prompt('Title mới', item.title) || item.title;
    await chrome.bookmarks.update(item.id, { url: newUrl, title: newTitle });
    renderBookmarkGrid(items);
  });

  return card;
}