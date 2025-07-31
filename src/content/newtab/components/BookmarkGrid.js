export function renderBookmarkGrid(bookmarks) {
  const container = document.getElementById('bookmark-grid');
  container.innerHTML = '';

  if (!bookmarks || bookmarks.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📚</div>
        <p>Chưa có bookmark nào trong thư mục này</p>
      </div>`;
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'bookmarks-grid';

  bookmarks.forEach(bookmark => {
    if (!bookmark.url) return;
    const card = document.createElement('div');
    card.className = 'bookmark-card';
    card.innerHTML = `
      <div class="bookmark-header">
        <img class="bookmark-icon" src="chrome://favicon/size/16@2x/${bookmark.url}" alt="Favicon">
        <div class="bookmark-title" title="${bookmark.title}">${bookmark.title}</div>
        <div class="bookmark-actions">
          <button class="action-btn delete-btn" data-id="${bookmark.id}" title="Xóa">🗑️</button>
        </div>
      </div>
      <div class="bookmark-url">${bookmark.url}</div>
    `;
    grid.appendChild(card);
  });

  container.appendChild(grid);

  // Delete handlers
  grid.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      const id = btn.dataset.id;
      try {
        await chrome.bookmarks.remove(id);
        btn.closest('.bookmark-card').remove();
      } catch (err) {
        console.error('Failed to delete bookmark', err);
      }
    });
  });
}