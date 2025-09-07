export class BookmarkService {
    static async getBookmarks(): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
        return new Promise((resolve) => {
            chrome.bookmarks.getTree(resolve);
        });
    }

    static async createFolder(details: { parentId: string; title: string }): Promise<chrome.bookmarks.BookmarkTreeNode> {
        return new Promise((resolve, reject) => {
            chrome.bookmarks.create(details, (result) => {
                if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
                else resolve(result);
            });
        });
    }

    static async createBookmark(details: { parentId: string; title: string; url: string }): Promise<chrome.bookmarks.BookmarkTreeNode> {
        return new Promise((resolve, reject) => {
            chrome.bookmarks.create(details, (result) => {
                if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
                else resolve(result);
            });
        });
    }

    static async moveBookmark(id: string, destination: { parentId: string; index?: number }): Promise<void> {
        return new Promise((resolve, reject) => {
            chrome.bookmarks.move(id, destination, (result) => {
                if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
                else resolve();
            });
        });
    }

    static async updateBookmark(id: string, changes: { title?: string; url?: string }): Promise<void> {
        return new Promise((resolve, reject) => {
            chrome.bookmarks.update(id, changes, (result) => {
                if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
                else resolve();
            });
        });
    }

    static async removeBookmark(id: string): Promise<void> {
        return new Promise((resolve, reject) => {
            chrome.bookmarks.remove(id, () => {
                if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
                else resolve();
            });
        });
    }

    static async removeFolder(id: string): Promise<void> {
        return new Promise((resolve, reject) => {
            chrome.bookmarks.removeTree(id, () => {
                if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
                else resolve();
            });
        });
    }
}