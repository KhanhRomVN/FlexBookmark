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

  // Drag start: serialize data and add dragging class
  card.addEventListener('dragstart', e => {
    console.log('BookmarkCard: dragstart', item.id);
    e.dataTransfer.setData(
      'text/plain',
      JSON.stringify({ type: 'bookmark', id: item.id, parentId: item.parentId })
    );
    e.dataTransfer.effectAllowed = 'move';
    card.classList.add('dragging');
  });

  // Drag visual feedback
  card.addEventListener('dragenter', e => {
    console.log('BookmarkCard: dragenter', item.id);
    e.preventDefault();
    card.classList.add('drag-over');
  });
  card.addEventListener('dragover', e => {
    console.log('BookmarkCard: dragover', item.id);
    e.preventDefault();
    card.classList.add('drag-over');
  });
  card.addEventListener('dragleave', () => {
    card.classList.remove('drag-over');
  });
  card.addEventListener('drop', async e => {
    console.log('BookmarkCard: drop event, types=', e.dataTransfer.types);
    e.preventDefault();
    card.classList.remove('drag-over');
    
    try {
      const raw = e.dataTransfer.getData('text/plain') ||
                 e.dataTransfer.getData('application/json');
      console.log('BookmarkCard: drop data=', raw);
      
      const data = JSON.parse(raw);
      console.log(`BookmarkCard: dropping ${data.type} ${data.id} onto bookmark ${item.id}`);
      
      // Prevent dropping onto itself
      if (data.id === item.id) {
        console.log('Cannot drop onto itself');
        return;
      }
      
      // Get current parent folder
      const grid = document.getElementById('bookmark-grid');
      const parentId = grid.dataset.parentId || null;
      
      // Move the bookmark
      await chrome.bookmarks.move(data.id, { parentId });
      
      // Re-render the grid
      renderBookmarkGrid();
    } catch (err) {
      console.error('Invalid drop data on bookmark card', err);
    }
  });
  card.addEventListener('dragend', () => {
    card.classList.remove('dragging', 'drag-over');
  });

  // Card content
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

  // Delete bookmark
  const deleteBtn = card.querySelector('.delete-btn');
  deleteBtn.addEventListener('click', async e => {
    e.stopPropagation();
    await chrome.bookmarks.remove(item.id);
    card.remove();
  });

  // Edit bookmark
  const editBtn = card.querySelector('.edit-btn');
  editBtn.addEventListener('click', async e => {
    e.stopPropagation();
    const newUrl = prompt('URL mới', item.url) || item.url;
    const newTitle = prompt('Title mới', item.title) || item.title;
    await chrome.bookmarks.update(item.id, { url: newUrl, title: newTitle });
    renderBookmarkGrid(items);
  });

  return card;
}