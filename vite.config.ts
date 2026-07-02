import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'icon.png',
        'og-image.jpg',
        'avatars/*.webp',
        'sounds/*',
      ],
      manifest: {
        name: 'ABCHESS Battle',
        short_name: 'Battle',
        description: 'Multiplayer chess puzzle battle',
        theme_color: '#5B6CFF',
        background_color: '#0F1117',
        display: 'standalone',
        icons: [
          {
            src: 'icon.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
});
