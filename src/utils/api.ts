// @ts-ignore
const _chrome = (window as any).chrome ?? (typeof chrome !== 'undefined' ? chrome : undefined);

export const getBookmarks = (): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        if (!_chrome?.runtime?.sendMessage) {
            return reject(new Error('chrome.runtime.sendMessage is not available'));
        }
        _chrome.runtime.sendMessage({ action: "getBookmarks" }, (response: any) => {
            if (_chrome.runtime.lastError) {
                reject(_chrome.runtime.lastError);
            } else {
                resolve(response);
            }
        });
    });
};

export const createBookmark = (bookmark: any): Promise<any> => {
    return new Promise((resolve, reject) => {
        if (!_chrome?.bookmarks?.create) {
            return reject(new Error('chrome.bookmarks.create is not available'));
        }
        _chrome.bookmarks.create(bookmark, resolve);
    });
};

export const createFolder = (folder: any): Promise<any> => {
    return new Promise((resolve, reject) => {
        if (!_chrome?.bookmarks?.create) {
            return reject(new Error('chrome.bookmarks.create is not available'));
        }
        _chrome.bookmarks.create(folder, resolve);
    });
};

export const removeBookmark = (id: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!_chrome?.bookmarks?.remove) {
            return reject(new Error('chrome.bookmarks.remove is not available'));
        }
        _chrome.bookmarks.remove(id, resolve);
    });
};