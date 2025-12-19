
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
        "name": "Vagonaris Boss Dochádzka",
        "short_name": "Boss",
        "description": "Profesionálna PWA aplikácia pre elitu šichty. Sleduj svoju dochádzku ako skutočný boss.",
        "theme_color": "#0f172a",
        "background_color": "#0f172a",
        "display": "standalone",
        "orientation": "portrait",
        "start_url": "/",
        "scope": "/",
        "icons": [
          {
            "src": "mascot.png",
            "sizes": "192x192",
            "type": "image/png",
            "purpose": "any maskable"
          },
          {
            "src": "mascot.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "any maskable"
          }
        ]
      },
      workbox: {
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
