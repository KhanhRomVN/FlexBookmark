import { getBookmarks } from './api.js';

// Kiểm tra thay đổi và đồng bộ định kỳ
let lastSyncTime = 0;
const SYNC_INTERVAL = 1000 * 60 * 5; // 5 phút

export async function checkForUpdates() {
  const now = Date.now();
  if (now - lastSyncTime > SYNC_INTERVAL) {
    await syncWithGoogle();
    lastSyncTime = now;
  }
}

// Đồng bộ với Google Bookmarks
export async function syncWithGoogle() {
  try {
    const localTree = await chrome.storage.local.get('bookmarkTree');
    const remoteTree = await getBookmarks();
    
    if (!deepEqual(localTree, remoteTree)) {
      await chrome.storage.local.set({ bookmarkTree: remoteTree });
      chrome.runtime.sendMessage({ action: 'bookmarksUpdated' });
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// So sánh sâu 2 object
function deepEqual(obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

// Lắng nghe thay đổi từ các tab khác
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'bookmarksUpdated') {
    window.location.reload();
  }
});