/**
 * Creates a bookmark card element with delete, edit, and click functionality.
 * @param {Object} item - Bookmark data (id, url, title).
 * @param {Function} renderBookmarkGrid - Callback to re-render the grid.
 * @param {Array} items - Current list of items for rerendering context.
 * @returns {HTMLElement}
 */
export function createBookmarkCard(item, renderBookmarkGrid, items) {
  const card = document.createElement('div');
  card.className = 'bookmark-card';
  card.draggable = false;
  card.style.position = 'relative';
  // card.style.border = '1px solid transparent'; // border removed to disable hover border
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
      <div class="bookmark-title" title="${item.title}">${item.title}</div>
    </div>
  `;

  // Menu button setup
  const headerEl = card.querySelector('.bookmark-header');
  const menuBtn = document.createElement('button');
  menuBtn.style.display = 'none';
  menuBtn.className = 'menu-btn';
  menuBtn.textContent = '⋮';
  headerEl.append(menuBtn);

  const dropdown = document.createElement('div');
  dropdown.className = 'menu-dropdown';
  dropdown.innerHTML =
    '<button class="menu-edit">Edit</button>' +
    '<button class="menu-delete">Delete</button>';
  headerEl.append(dropdown);

  // Ensure modal dialog overlay exists
  let overlay = document.querySelector('.edit-dialog-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'edit-dialog-overlay';
    overlay.innerHTML = `
      <div class="edit-dialog">
        <input type="text" class="dialog-title-input" placeholder="Title" />
        <input type="text" class="dialog-url-input" placeholder="URL" />
        <div class="dialog-buttons">
          <button class="save-btn">Save</button>
          <button class="cancel-btn">Cancel</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }
  const titleInput = overlay.querySelector('.dialog-title-input');
  const urlInput = overlay.querySelector('.dialog-url-input');
  const saveBtn = overlay.querySelector('.save-btn');
  const cancelBtn = overlay.querySelector('.cancel-btn');

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
    dropdown.classList.remove('show');
  });

  // Toggle dropdown on menu click
  menuBtn.addEventListener('click', e => {
    e.stopPropagation();
    dropdown.classList.toggle('show');
  });

  // Edit via custom modal
  dropdown.querySelector('.menu-edit')?.addEventListener('click', e => {
    e.stopPropagation();
    titleInput.value = item.title;
    urlInput.value = item.url;
    overlay.classList.add('show');
  });

  saveBtn.addEventListener('click', async () => {
    const newTitle = titleInput.value.trim() || item.title;
    const newUrl = urlInput.value.trim() || item.url;
    await chrome.bookmarks.update(item.id, { title: newTitle, url: newUrl });
    const titleEl = card.querySelector('.bookmark-title');
    titleEl.textContent = newTitle;
    titleEl.title = newTitle;
    const iconEl = card.querySelector('.bookmark-icon');
    iconEl.src = `https://www.google.com/s2/favicons?sz=64&domain_url=${newUrl}`;
    overlay.classList.remove('show');
    dropdown.classList.remove('show');
  });

  cancelBtn.addEventListener('click', e => {
    e.stopPropagation();
    overlay.classList.remove('show');
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

  // Close dropdown when clicking outside
  document.addEventListener('click', () => {
    dropdown.classList.remove('show');
  });

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