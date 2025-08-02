// Global drag-and-drop performance optimizations
document.addEventListener('dragover', e => {
  // Only prevent default if it's a valid drop target
  if (
    e.target.classList.contains('drop-target') ||
    e.target.classList.contains('bookmark-card') ||
    e.target.classList.contains('mini-group-card')
  ) {
    e.preventDefault();
  }
}, false);

document.addEventListener('drop', e => {
  // Prevent default drop behavior except on valid drop targets
  if (
    e.target.classList.contains('drop-target') ||
    e.target.classList.contains('bookmark-card') ||
    e.target.classList.contains('mini-group-card')
  ) {
    e.preventDefault();
  }
}, false);

import { renderSidebar } from './components/Sidebar.js';
import { renderBookmarkGrid } from './components/BookmarkGrid.js';
import { setupAddBookmarkForm } from './components/AddBookmarkForm.js';
import { md5 } from '../utils/helpers.js';

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

// Apply theme
function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'light') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', theme);
  }
  if (theme === 'image') {
    const imageUrl = prompt('Nhập URL hình ảnh:');
    if (imageUrl) {
      document.body.style.backgroundImage = `url(${imageUrl})`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      chrome.storage.local.set({ backgroundImage: imageUrl });
    }
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

// Khởi tạo ứng dụng
async function init() {
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
  const gridEl = document.getElementById('bookmark-grid');
  gridEl.dataset.parentId = root.id;
  gridEl.dataset.depth = '0';
  document.getElementById('folder-title').textContent = 'Tất cả bookmark';
  renderBookmarkGrid(root.children);
}

document.addEventListener('DOMContentLoaded', () => {
  // Theme dropdown toggle
  document.body.addEventListener('click', () => {
    document.getElementById('theme-dropdown').classList.remove('active');
  });
  document.getElementById('theme-btn').addEventListener('click', e => {
    e.stopPropagation();
    const dropdown = document.getElementById('theme-dropdown');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
  });
  document.querySelectorAll('#theme-dropdown button').forEach(button => {
    button.addEventListener('click', function() {
      const theme = this.dataset.theme;
      applyTheme(theme);
      chrome.storage.local.set({ theme });
      document.getElementById('theme-dropdown').classList.remove('active');
    });
  });

// Add new group button handler
  const addGroupBtn = document.getElementById('add-group-btn');
  addGroupBtn.addEventListener('click', async () => {
    const groupName = prompt('Tên nhóm mới:');
    if (groupName) {
      // create new bookmark folder at root
      await new Promise(res => chrome.bookmarks.create({ title: groupName }, res));
      // re-fetch folders and re-render sidebar
      const tree = await getBookmarks();
      const root = tree[0];
      renderSidebar(root.children);
    }
  });
  init();
  setupAddBookmarkForm();
});