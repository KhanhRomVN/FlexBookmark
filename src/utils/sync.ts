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

// Debounce helper to batch rapid bookmark events
function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
    let timer: number;
    return (...args: Parameters<T>) => {
        clearTimeout(timer);
        timer = window.setTimeout(() => fn(...args), delay);
    };
}

// Listen for bookmark events to trigger sync
chrome.bookmarks.onCreated.addListener(debounce(syncWithGoogle, 1000));
chrome.bookmarks.onRemoved.addListener(debounce(syncWithGoogle, 1000));
chrome.bookmarks.onChanged.addListener(debounce(syncWithGoogle, 1000));
chrome.bookmarks.onMoved.addListener(debounce(syncWithGoogle, 1000));

// Listen for updates from runtime messages (fallback for other contexts)
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'bookmarksUpdated') {
        window.location.reload();
    }
});