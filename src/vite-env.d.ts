/// <reference types="vite/client" />
/// <reference types="chrome-types" />
declare module 'vite-plugin-static-copy';

declare global {
    interface Window {
        chrome: typeof chrome;
    }
}
