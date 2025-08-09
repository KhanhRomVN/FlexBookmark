// Lắng nghe sự kiện thay đổi bookmark
chrome.bookmarks.onCreated.addListener(syncBookmarks);
chrome.bookmarks.onRemoved.addListener(syncBookmarks);
chrome.bookmarks.onChanged.addListener(syncBookmarks);
chrome.bookmarks.onMoved.addListener(syncBookmarks);
chrome.bookmarks.onChildrenReordered.addListener(syncBookmarks);

// Đồng bộ dữ liệu với storage
async function syncBookmarks() {
    try {
        const tree = await chrome.bookmarks.getTree();
        await chrome.storage.local.set({ bookmarkTree: tree });
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                if (tab.id) {
                    chrome.tabs.sendMessage(tab.id, { action: "bookmarksUpdated" });
                }
            });
        });
    } catch (error) {
        console.error('Sync error:', error);
    }
}

// Handle messages from UI scripts
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === "getBookmarks") {
        chrome.storage.local.get("bookmarkTree", (data) => {
            sendResponse(data.bookmarkTree || []);
        });
        return true;
    }
    if (request.type === "getToken") {
        const { interactive } = request;
        chrome.identity.getAuthToken({ interactive }, (token) => {
            if (chrome.runtime.lastError || !token) {
                sendResponse({ error: chrome.runtime.lastError?.message || "Failed to get token" });
            } else {
                sendResponse({ token });
            }
        });
        return true;
    }
});

// Khởi tạo đồng bộ khi cài đặt
chrome.runtime.onInstalled.addListener(syncBookmarks);