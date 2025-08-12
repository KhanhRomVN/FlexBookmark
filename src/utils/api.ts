// Chrome Bookmarks API wrapper

export const getBookmarks = async (): Promise<chrome.bookmarks.BookmarkTreeNode[]> => {
    // Sử dụng cả chrome.storage và localStorage như fallback
    return new Promise((resolve) => {
        if (typeof chrome !== "undefined" && chrome.runtime) {
            chrome.runtime.sendMessage({ action: "getBookmarks" }, (response) => {
                if (chrome.runtime.lastError) {
                    console.warn('Runtime error, using fallback:', chrome.runtime.lastError);
                    resolve(getBookmarksFallback());
                } else {
                    try {
                        chrome.storage.local.set({ bookmarkTree: response });
                    } catch { }
                    resolve(response);
                }
            });
        } else {
            resolve(getBookmarksFallback());
        }
    });
};

const getBookmarksFallback = async (): Promise<chrome.bookmarks.BookmarkTreeNode[]> => {
    try {
        if (typeof chrome !== "undefined" && chrome.storage?.local) {
            return new Promise(resolve => {
                chrome.storage.local.get('bookmarkTree', (data) => {
                    resolve(data.bookmarkTree || []);
                });
            });
        }
        const stored = localStorage.getItem('bookmarkTree') || '[]';
        return JSON.parse(stored);
    } catch (error) {
        console.error('Bookmark fallback error:', error);
        return [];
    }
};

export const createBookmark = (
    bookmark: chrome.bookmarks.CreateDetails
): Promise<chrome.bookmarks.BookmarkTreeNode> => {
    return new Promise((resolve) => {
        chrome.bookmarks.create(bookmark, resolve);
    });
};

export const createFolder = (
    folder: chrome.bookmarks.CreateDetails
): Promise<chrome.bookmarks.BookmarkTreeNode> => {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: "createFolder", folder }, (response) => {
            resolve(response);
        });
    });
};

export const removeBookmark = (id: string): Promise<void> => {
    return new Promise((resolve) => {
        chrome.bookmarks.remove(id, resolve);
    });
};