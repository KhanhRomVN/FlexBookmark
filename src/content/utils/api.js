export async function getBookmarks() {
  console.log('getBookmarks called');
  return new Promise((resolve) => {
    chrome.bookmarks.getTree((tree) => {
      console.log('getBookmarks response tree:', tree);
      resolve(tree || []);
    });
  });
}
  
  // Tạo bookmark mới
  export async function createBookmark(bookmark) {
    return chrome.bookmarks.create(bookmark);
  }

  // Tạo nhóm bookmark (folder)
  export async function createFolder(folder) {
    return chrome.bookmarks.create(folder);
  }
  
  // Xóa bookmark
  export async function removeBookmark(id) {
    return chrome.bookmarks.remove(id);
  }