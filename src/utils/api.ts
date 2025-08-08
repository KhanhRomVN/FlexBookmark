// Chrome Bookmarks API wrapper

export const getBookmarks = async (): Promise<chrome.bookmarks.BookmarkTreeNode[]> => {
    try {
        if (typeof window !== 'undefined' && window.chrome?.bookmarks?.getTree) {
            const tree = await new Promise<chrome.bookmarks.BookmarkTreeNode[]>((resolve) =>
                window.chrome.bookmarks.getTree((t) => resolve(t || []))
            );
            try {
                localStorage.setItem('bookmarkTree', JSON.stringify(tree));
            } catch { }
            return tree;
        }
    } catch (e) {
        console.warn('chrome.bookmarks.getTree failed, falling back to cache', e);
    }
    const stored = localStorage.getItem('bookmarkTree') || '[]';
    try {
        return JSON.parse(stored);
    } catch {
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
        chrome.bookmarks.create(folder, resolve);
    });
};

export const removeBookmark = (id: string): Promise<void> => {
    return new Promise((resolve) => {
        chrome.bookmarks.remove(id, resolve);
    });
};