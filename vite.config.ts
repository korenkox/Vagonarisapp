
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      // Explicitne povieme pluginu, ktoré súbory má zahrnúť
      includeAssets: ['manifest.json', 'favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        "name": "Dochádzka Pro",
        "short_name": "Dochádzka",
        "description": "Profesionálna PWA aplikácia na sledovanie dochádzky",
        "theme_color": "#ffffff",
        "background_color": "#ffffff",
        "display": "standalone",
        "orientation": "portrait",
        "start_url": "/",
        "scope": "/",
        "icons": [
          {
            "src": "https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/google-keep.png",
            "sizes": "192x192",
            "type": "image/png",
            "purpose": "any maskable"
          },
          {
            "src": "https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/google-keep.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "any maskable"
          }
        ]
      },
      workbox: {
        // Zabezpečíme, aby Workbox našiel aspoň JS a HTML súbory
        globPatterns: ['**/*.{js,css,html}', '**/*.{png,svg,ico,json}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        // Ignorujeme chybu, ak sa niektoré vzory nenájdu (napr. ak nemáme žiadne ico)
        maximumFileSizeToCacheInBytes: 3000000
      }
    })
  ],
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1500
  }
});
