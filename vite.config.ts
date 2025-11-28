import path from "path"
import { resolve } from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        popup: resolve(__dirname, 'popup.html'),
        serviceWorker: resolve(__dirname, 'src/background/service-worker.ts')
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name].[ext]"
      },
      external: ['fsevents', '@swc/core-linux-x64-gnu', '@swc/core-darwin-x64', '@swc/core-win32-x64-msvc']
    }
  },
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: 'manifest.json', dest: '.' },
        { src: 'src/assets/icons/icon.png', dest: 'assets/icons' }
      ]
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Add this configuration to handle native modules
  assetsInclude: ['**/*.node'],
  optimizeDeps: {
    exclude: ['@swc/core', '@swc/core-*']
  },
  define: {
    global: 'globalThis',
  }
})