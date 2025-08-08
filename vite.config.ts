import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: 'manifest.json', dest: '.' },
        { src: 'extension_temp/src/background/service-worker.js', dest: '.' },
        { src: 'extension_temp/src/content/newtab/newtab.html', dest: '.', rename: 'bookmark_manager.html' },
        { src: 'extension_temp/src/popup/popup.html', dest: '.', rename: 'popup.html' },
        { src: 'index.html', dest: '.', rename: 'dashboard.html' }
      ]
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})