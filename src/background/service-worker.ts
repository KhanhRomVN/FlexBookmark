// Chrome Extension Service Worker with proper TypeScript types

// --- Bookmark sync functionality ---
chrome.bookmarks.onCreated.addListener(syncBookmarks);
chrome.bookmarks.onRemoved.addListener(syncBookmarks);
chrome.bookmarks.onChanged.addListener(syncBookmarks);
chrome.bookmarks.onMoved.addListener(syncBookmarks);
chrome.bookmarks.onChildrenReordered.addListener(syncBookmarks);

async function syncBookmarks() {
    try {
        const tree = await chrome.bookmarks.getTree();
        await chrome.storage.local.set({ bookmarkTree: tree });

        // Notify all tabs about bookmark updates
        const tabs = await chrome.tabs.query({});
        tabs.forEach(tab => {
            if (tab.id) {
                chrome.tabs.sendMessage(tab.id, { action: "bookmarksUpdated" }).catch(() => {
                    // Ignore errors for tabs that can't receive messages
                });
            }
        });
    } catch (error) {
        console.error("Bookmark sync error:", error);
    }
}

// --- Message handling ---
chrome.runtime.onMessage.addListener((request: any, _sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void) => {
    if (request.action === "getBookmarks") {
        chrome.storage.local.get("bookmarkTree", (data: any) => {
            sendResponse(data.bookmarkTree || []);
        });
        return true; // Keep message channel open for async response

    }

    // Handle folder creation requested from popup/page
    if (request.action === "createFolder" && request.folder) {
        chrome.bookmarks.create(request.folder, (newNode) => {
            // Sync and notify after creating
            syncBookmarks().catch(console.error);
            sendResponse(newNode);
        });
        return true; // Keep channel open for async response
    }


    if (request.action === "getAuthToken") {
        getAuthToken(request.interactive || false)
            .then(token => sendResponse({ success: true, token }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Keep message channel open for async response
    }

    if (request.action === "removeAuthToken") {
        removeAuthToken(request.token)
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Keep message channel open for async response
    }

    if (request.action === "clearAllTokens") {
        clearAllAuthTokens()
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Keep message channel open for async response
    }

    if (request.action === "getUserInfo") {
        getUserInfo(request.token)
            .then(userInfo => sendResponse({ success: true, userInfo }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Keep message channel open for async response
    }
    // Keep the message channel open for all cases to avoid port closed errors
    return true;
    // Ensure asynchronous response channel remains open for all messages
    return true;
    // Default: keep channel open to prevent port-closed errors
    return true;
});

// Initialize on extension install/startup
chrome.runtime.onInstalled.addListener(() => {
    console.log("FlexBookmark extension installed/updated");
    syncBookmarks();
});

chrome.runtime.onStartup.addListener(() => {
    console.log("FlexBookmark extension started");
    syncBookmarks();
});

// --- Chrome Identity API helpers ---

/**
 * Get OAuth2 token using Chrome Identity API
 */
async function getAuthToken(interactive: boolean = false): Promise<string> {
    return new Promise((resolve, reject) => {
        chrome.identity.getAuthToken(
            { interactive },
            (result: chrome.identity.GetAuthTokenResult) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }

                if (!result?.token) {
                    reject(new Error('No token received'));
                    return;
                }

                resolve(result.token);
            }
        );
    });
}

/**
 * Remove cached auth token
 */
async function removeAuthToken(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
        chrome.identity.removeCachedAuthToken(
            { token },
            () => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }
                resolve();
            }
        );
    });
}

/**
 * Clear all cached auth tokens
 */
async function clearAllAuthTokens(): Promise<void> {
    return new Promise((resolve, reject) => {
        chrome.identity.clearAllCachedAuthTokens(() => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }
            resolve();
        });
    });
}

/**
 * Get user info from Google API using access token
 */
async function getUserInfo(token: string): Promise<any> {
    try {
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const userInfo = await response.json();
        return userInfo;
    } catch (error) {
        console.error('Error fetching user info:', error);
        throw error;
    }
}

/**
 * Verify if token is still valid
 */
async function verifyToken(token: string): Promise<boolean> {
    try {
        const response = await fetch('https://www.googleapis.com/oauth2/v2/tokeninfo', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.ok;
    } catch (error) {
        console.error('Token verification error:', error);
        return false;
    }
}

/**
 * Handle token refresh automatically
 */
async function refreshTokenIfNeeded(token: string): Promise<string> {
    const isValid = await verifyToken(token);

    if (!isValid) {
        // Remove invalid token
        await removeAuthToken(token);
        // Get new token
        return await getAuthToken(false); // Try non-interactive first
    }

    return token;
}

// --- Network request helpers for Google APIs ---

/**
 * Make authenticated request to Google API
 */
async function makeGoogleApiRequest(endpoint: string, token: string, options: RequestInit = {}): Promise<any> {
    try {
        const response = await fetch(endpoint, {
            ...options,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        if (response.status === 401) {
            // Token expired, try to refresh
            const newToken = await refreshTokenIfNeeded(token);

            // Retry with new token
            const retryResponse = await fetch(endpoint, {
                ...options,
                headers: {
                    'Authorization': `Bearer ${newToken}`,
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            if (!retryResponse.ok) {
                throw new Error(`HTTP ${retryResponse.status}: ${retryResponse.statusText}`);
            }

            return await retryResponse.json();
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Google API request error:', error);
        throw error;
    }
}

// --- Extension lifecycle management ---

// Clean up resources when extension is suspended
chrome.runtime.onSuspend.addListener(() => {
    console.log("FlexBookmark extension suspending");
    // Perform any cleanup if needed
});

// Handle extension errors
self.addEventListener('error', (event) => {
    console.error('FlexBookmark service worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('FlexBookmark service worker unhandled rejection:', event.reason);
});

// Export functions for testing or other modules if needed
// Note: In service worker context, we don't use CommonJS exports