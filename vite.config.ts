
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
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
        // Zjednodušené pre stabilitu buildu
        globPatterns: ['**/*.{js,css,html,png,svg,json}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
      }
    })
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false
  }
});
