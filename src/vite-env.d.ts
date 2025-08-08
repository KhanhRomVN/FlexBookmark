/// <reference types="vite/client" />
/// <reference types="chrome" />
declare module 'vite-plugin-static-copy';

declare global {
    interface Window {
        chrome: typeof chrome;
    }
}
