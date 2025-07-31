export function renderBookmarkGrid(bookmarks) {
  console.log('renderBookmarkGrid loaded, bookmarks:', bookmarks);
    const grid = document.getElementById('bookmark-grid');
    grid.innerHTML = '';
  
    bookmarks.forEach(bookmark => {
      if (bookmark.url) {
        const element = document.createElement('div');
        element.className = 'bookmark-item';
        element.innerHTML = `
          <img src="chrome://favicon/size/16@2x/${bookmark.url}" alt="Favicon">
          <a href="${bookmark.url}" target="_blank">${bookmark.title}</a>
          <button class="delete-btn" data-id="${bookmark.id}">Xóa</button>
        `;
        grid.appendChild(element);
      }
    });
  
    // Thêm sự kiện xóa
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        await chrome.bookmarks.remove(btn.dataset.id);
      });
    });
  }