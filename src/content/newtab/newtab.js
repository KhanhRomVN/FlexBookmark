import { renderSidebar } from './components/Sidebar.js';
import { renderBookmarkGrid } from './components/BookmarkGrid.js';
import { md5 } from '../utils/helpers.js';
import { createFolderCard } from './components/FolderCard.js';

// Lấy thông tin user
async function getUserInfo() {
  return new Promise(resolve => {
    chrome.identity.getProfileUserInfo({}, userInfo => {
      resolve(userInfo);
    });
  });
}

// Fetch bookmarks
async function getBookmarks() {
  return new Promise(resolve => {
    chrome.bookmarks.getTree(tree => {
      resolve(tree || []);
    });
  });
}

// Flatten bookmark tree
function flattenTree(nodes) {
  let result = [];
  nodes.forEach(node => {
    if (node.url) result.push(node);
    if (node.children) result = result.concat(flattenTree(node.children));
  });
  return result;
}

// Thêm hàm tìm kiếm
async function performSearch(query) {
  const allBookmarks = await new Promise(resolve => {
    chrome.bookmarks.search(query, resolve);
  });
  
  // Nhóm kết quả theo folder cha
  const folderResults = new Map();
  
  for (const item of allBookmarks) {
    if (!item.url) continue; // Bỏ qua folder
    
    // Tìm folder cha cấp 1
    let parentId = item.parentId;
    let folder;
    while (parentId) {
      const [parent] = await new Promise(resolve =>
        chrome.bookmarks.get(parentId, resolve)
      );
      if (!parent) break;
      
      if (!parent.parentId || parent.parentId === '0') {
        folder = parent;
        break;
      }
      parentId = parent.parentId;
    }
    
    if (folder) {
      if (!folderResults.has(folder.id)) {
        folderResults.set(folder.id, {
          folder,
          bookmarks: []
        });
      }
      folderResults.get(folder.id).bookmarks.push(item);
    }
  }
  
  // Chuyển thành mảng và sắp xếp theo số lượng
  const results = Array.from(folderResults.values());
  results.sort((a, b) => b.bookmarks.length - a.bookmarks.length);
  
  return results;
}

function renderSearchResults(results) {
  const grid = document.getElementById('bookmark-grid');
  grid.innerHTML = '';
  
  if (results.length === 0) {
    grid.innerHTML = '<div class="empty-state">No bookmarks found</div>';
    return;
  }
  
  const title = document.createElement('h2');
  title.className = 'grid-header-title';
  title.textContent = `Search results for "${document.getElementById('searchInput').value}"`;
  grid.appendChild(title);
  
  const gridContainer = document.createElement('div');
  gridContainer.className = 'bookmarks-grid';
  
  for (const result of results) {
    const folderCard = createFolderCard({
      ...result.folder,
      children: result.bookmarks,
      isSearchResult: true
    }, renderBookmarkGrid, 0);
    gridContainer.appendChild(folderCard);
  }
  
  grid.appendChild(gridContainer);
}

function initSearch() {
  const searchInput = document.getElementById('searchInput');
  let searchTimeout;
  
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    const query = searchInput.value.trim();
    
    if (!query) {
      // Khôi phục view ban đầu
      chrome.storage.local.get(['lastFolderId'], async result => {
        const lastId = result.lastFolderId || '0';
        chrome.bookmarks.getChildren(lastId, children => {
          renderBookmarkGrid(children, 0);
        });
      });
      return;
    }
    
    searchTimeout = setTimeout(async () => {
      const results = await performSearch(query);
      renderSearchResults(results);
    }, 300);
  });
}

// Apply theme
function applyTheme(theme) {
  const root = document.documentElement;
  // Set HTML data-theme
  if (theme === 'light') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', theme);
  }
  // Manage body classes for theme-based styling
  document.body.classList.remove('light-theme', 'dark-theme', 'image-theme');
  if (theme === 'light') {
    document.body.classList.add('light-theme');
  } else if (theme === 'image') {
    document.body.classList.add('image-theme');
  }
  // Handle image theme background and persistence
  if (theme === 'image') {
    chrome.storage.local.get('backgroundImage', result => {
      let imageUrl = result.backgroundImage;
      if (!imageUrl) {
        imageUrl = prompt('Nhập URL hình ảnh:');
        if (imageUrl) {
          chrome.storage.local.set({ backgroundImage: imageUrl });
        }
      }
      if (imageUrl) {
        document.body.style.backgroundImage = `url(${imageUrl})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
      }
    });
  } else {
    document.body.style.backgroundImage = '';
  }
}

// Load saved theme
chrome.storage.local.get(['theme', 'backgroundImage'], result => {
  if (result.theme) {
    applyTheme(result.theme);
    if (result.theme === 'image' && result.backgroundImage) {
      document.body.style.backgroundImage = `url(${result.backgroundImage})`;
    }
  }
});
// Loading spinner
async function showLoading() {
  const grid = document.getElementById('bookmark-grid');
  grid.innerHTML = '<div class="loading-spinner"></div>';
}

// Toast notifications
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Khởi tạo ứng dụng
async function init() {
  await showLoading();
  // Fetch and display user info
  const userInfo = await getUserInfo();
  if (userInfo.email) {
    document.getElementById('user-name').textContent = userInfo.email.split('@')[0];
    const hash = await md5(userInfo.email);
    document.getElementById('user-avatar').src = `https://www.gravatar.com/avatar/${hash}?d=identicon`;
  }

  // Initialize bookmarks UI
  const tree = await getBookmarks();
  const root = tree[0];
  renderSidebar(root.children);
  chrome.storage.local.get(['lastFolderId'], async result => {
    const lastId = result.lastFolderId;
    if (lastId) {
      const item = document.querySelector(`#sidebar .group-item[data-id="${lastId}"]`);
      if (item) {
        item.click();
        return;
      }
    }
    // Default view: all bookmarks
    const gridEl = document.getElementById('bookmark-grid');
    gridEl.dataset.parentId = root.id;
    gridEl.dataset.depth = '0';
    document.getElementById('folder-title').textContent = 'Tất cả bookmark';
    renderBookmarkGrid(root.children, 0);
  });
}

document.addEventListener('DOMContentLoaded', () => {
init();
initSearch();
  // Theme dropdown toggle
  document.body.addEventListener('click', () => {
    document.getElementById('theme-dropdown').classList.remove('show');
  });
  document.getElementById('theme-btn').addEventListener('click', e => {
    e.stopPropagation();
    const dropdown = document.getElementById('theme-dropdown');
    dropdown.classList.toggle('show');
  });
  document.querySelectorAll('#theme-dropdown button').forEach(button => {
    button.addEventListener('click', function() {
      const theme = this.dataset.theme;
      applyTheme(theme);
      chrome.storage.local.set({ theme });
      document.getElementById('theme-dropdown').classList.remove('show');
    });
  });

  // Change Image URL via browser prompt (works on all themes)
  const changeImageBtn = document.getElementById('change-image-btn');
  changeImageBtn.addEventListener('click', e => {
    e.stopPropagation();
    chrome.storage.local.get('backgroundImage', result => {
      const current = result.backgroundImage || '';
      const url = prompt('Nhập URL hình ảnh mới:', current);
      if (url) {
        chrome.storage.local.set({ backgroundImage: url }, () => {
          document.body.style.backgroundImage = `url(${url})`;
          showToast('Background image updated', 'success');
        });
      }
      document.getElementById('theme-dropdown').classList.remove('show');
    });
  });

// Add new group button handler
  const addGroupBtn = document.getElementById('add-group-btn');
  addGroupBtn.addEventListener('click', async () => {
    const groupName = prompt('New Folder:');
    if (groupName) {
      // create new bookmark folder at root
      await new Promise(res => chrome.bookmarks.create({ title: groupName }, res));
      // re-fetch folders and re-render sidebar
      const tree = await getBookmarks();
      const root = tree[0];
      renderSidebar(root.children);
    }
  });
});
// Touch event feedback for mobile
document.querySelectorAll('.bookmark-card, .folder-card').forEach(card => {
  card.addEventListener('touchstart', () => {
    card.classList.add('touch-active');
  });
  card.addEventListener('touchend', () => {
    setTimeout(() => {
      card.classList.remove('touch-active');
    }, 200);
  });
});
// Prevent unwanted zoom
document.addEventListener('touchmove', (e) => {
  if (e.scale !== 1) e.preventDefault();
}, { passive: false });