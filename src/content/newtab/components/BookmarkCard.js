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
  card.style.border = '1px solid transparent';
  card.style.transition = 'border-color 0.2s, box-shadow 0.2s';
  card.dataset.id = item.id;

  // wrap in container for layering and hover isolation
  const container = document.createElement('div');
  container.className = 'bookmark-card-container';
  container.appendChild(card);

  console.log(`Creating bookmark card for: ${item.title} (${item.id})`);

  // Card content
  card.innerHTML = `
    <div class="bookmark-header">
      <img class="bookmark-icon" src="https://www.google.com/s2/favicons?sz=64&domain_url=${item.url}" alt="">
      <div class="bookmark-title" title="${item.title}">${item.title}</div>
    </div>
  `;

  // Insert menu button into header
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
  console.log(`DEBUG: menuBtn appended for bookmark ${item.id}`, menuBtn, dropdown);

  // Hover handlers for border and menu visibility
  card.addEventListener('mouseenter', () => {
    if (!card.closest('.folder-card')) {
      card.style.borderColor = '#3b82f6';
    }
    menuBtn.style.display = 'block';
  });
  card.addEventListener('mouseleave', () => {
    if (!card.closest('.folder-card')) {
      card.style.borderColor = 'transparent';
    }
    menuBtn.style.display = 'none';
    dropdown.classList.remove('show');
  });

  // Toggle dropdown on menu click
  menuBtn.addEventListener('click', e => {
    e.stopPropagation();
    dropdown.classList.toggle('show');
  });

  // Edit & Delete from dropdown
  dropdown.querySelector('.menu-edit')?.addEventListener('click', async e => {
    e.stopPropagation();
    const newUrl = prompt('URL mới', item.url) || item.url;
    const newTitle = prompt('Title mới', item.title) || item.title;
    await chrome.bookmarks.update(item.id, { url: newUrl, title: newTitle });
    const titleEl = card.querySelector('.bookmark-title');
    titleEl.textContent = newTitle;
    titleEl.title = newTitle;
    const iconEl = card.querySelector('.bookmark-icon');
    iconEl.src = `https://www.google.com/s2/favicons?sz=64&domain_url=${newUrl}`;
    dropdown.classList.remove('show');
  });

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

  // Click anywhere on card (except menu or actions) to open URL
  card.addEventListener('click', e => {
    console.log(`BookmarkCard clicked: id=${item.id}, url=${item.url}`, e.target);
    if (!e.target.closest('.action-btn') && !e.target.closest('.menu-btn') && !e.target.closest('.menu-dropdown')) {
      console.log(`Opening URL: ${item.url}`);
      try {
        chrome.tabs.create({ url: item.url });
      } catch (err) {
        console.error('chrome.tabs.create error:', err);
      }
    }
  });

  
  return container;
}