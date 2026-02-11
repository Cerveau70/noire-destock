import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          strategies: 'injectManifest',
          srcDir: '.',
          filename: 'sw.ts',
          registerType: 'autoUpdate',
          includeAssets: ['img/carr.png', 'img/dest.png'],
          injectManifest: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
            maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
          },
          manifest: {
            name: 'IVOIREDESTOCK',
            short_name: 'IvoireDestock',
            description: "Plateforme de déstockage alimentaire B2B/B2C pour la Côte d'Ivoire.",
            theme_color: '#064e3b',
            background_color: '#f8fafc',
            display: 'standalone',
            start_url: '/',
            icons: [
              {
                src: '/img/carr.png',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: '/img/dest.png',
                sizes: '512x512',
                type: 'image/png'
              }
            ]
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
