import { renderSidebar } from './components/Sidebar.js';
import { renderBookmarkGrid } from './components/BookmarkGrid.js';
import { setupAddBookmarkForm } from './components/AddBookmarkForm.js';

 // Inlined getBookmarks to avoid module-loading errors
 async function getBookmarks() {
   console.log('getBookmarks called');
   return new Promise((resolve) => {
     chrome.bookmarks.getTree((tree) => {
       console.log('getBookmarks response tree:', tree);
       resolve(tree || []);
     });
   });
 }

function flattenTree(nodes) {
 let result = [];
 nodes.forEach(node => {
   if (node.url) result.push(node);
   if (node.children) result = result.concat(flattenTree(node.children));
 });
 return result;
}

// Khởi tạo ứng dụng
async function init() {
  console.log('NewTab init start');
  try {
    const tree = await getBookmarks();
    console.log('Bookmark tree:', tree);
    // Render sidebar and initial empty state
    renderSidebar(tree[0].children);
    document.getElementById('folder-title').textContent = 'Chọn thư mục';
    renderBookmarkGrid([]);
  } catch (error) {
    console.error('Error in init:', error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  init();
  setupAddBookmarkForm();
});