// Lắng nghe sự kiện thay đổi bookmark
chrome.bookmarks.onCreated.addListener(syncBookmarks);
chrome.bookmarks.onRemoved.addListener(syncBookmarks);
chrome.bookmarks.onChanged.addListener(syncBookmarks);
chrome.bookmarks.onMoved.addListener(syncBookmarks);
chrome.bookmarks.onChildrenReordered.addListener(syncBookmarks);

// Đồng bộ dữ liệu với storage
async function syncBookmarks() {
    const tree = await chrome.bookmarks.getTree();
    chrome.storage.local.set({ bookmarkTree: tree });
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
syncBookmarks();