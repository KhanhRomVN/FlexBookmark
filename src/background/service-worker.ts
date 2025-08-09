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

// Gửi dữ liệu khi new tab mở
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === "getBookmarks") {
        chrome.storage.local.get("bookmarkTree", (data) => {
            sendResponse(data.bookmarkTree || []);
        });
        return true;
    }
});

// Khởi tạo đồng bộ
chrome.runtime.onInstalled.addListener(syncBookmarks);

// Handle token requests from UI scripts
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "getToken") {
        const { interactive } = message;
        chrome.identity.getAuthToken({ interactive }, (token) => {
            if (chrome.runtime.lastError || !token) {
                sendResponse({ error: chrome.runtime.lastError?.message || "Failed to get token" });
            } else {
                sendResponse({ token });
            }
        });
        return true; // keep channel open for async response
    }
});