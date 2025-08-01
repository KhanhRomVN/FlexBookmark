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
    // Initialize sidebar and grid with root children
    const root = tree[0];
    renderSidebar(root.children);
    const gridEl = document.getElementById('bookmark-grid');
    gridEl.dataset.parentId = root.id;
    gridEl.dataset.depth = '0';
    document.getElementById('folder-title').textContent = 'Tất cả bookmark';
    renderBookmarkGrid(root.children);
  } catch (error) {
    console.error('Error in init:', error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  init();
  setupAddBookmarkForm();
});