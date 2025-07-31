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
    renderSidebar(tree[0].children);
    const allBookmarks = flattenTree(tree[0].children);
    document.getElementById('folder-title').textContent = 'All Bookmarks';
    renderBookmarkGrid(allBookmarks);
  } catch (error) {
    console.error('Error in init:', error);
  }
  setupAddBookmarkForm();
}

document.addEventListener('DOMContentLoaded', init);