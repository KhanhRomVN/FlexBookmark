import { getBookmarks } from './api';

let lastSyncTime = 0;
const SYNC_INTERVAL = 1000 * 60 * 5; // 5 phút

export async function checkForUpdates(): Promise<void> {
    const now = Date.now();
    if (now - lastSyncTime > SYNC_INTERVAL) {
        await syncWithGoogle();
        lastSyncTime = now;
    }
}

export async function syncWithGoogle(): Promise<void> {
    try {
        const localTree = await new Promise<any>(resolve =>
            chrome.storage.local.get('bookmarkTree', resolve)
        );
        const remoteTree = await getBookmarks();

        if (!deepEqual(localTree, remoteTree)) {
            await chrome.storage.local.set({ bookmarkTree: remoteTree });
            chrome.runtime.sendMessage({ action: 'bookmarksUpdated' });
        }
    } catch (error) {
        console.error('Sync failed:', error);
    }
}

function deepEqual(obj1: any, obj2: any): boolean {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
}

// Lắng nghe thay đổi từ các tab khác
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'bookmarksUpdated') {
        window.location.reload();
    }
});