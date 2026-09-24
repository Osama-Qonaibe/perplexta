import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

const pwaConfig: any = {
  registerType: 'autoUpdate',
  manifest: false, // Let public/manifest.json and server dynamic manifest be authoritative
  workbox: {
    navigateFallback: '/index.html',
    navigateFallbackDenylist: [/^\/api\//, /^\/uploads\//, /^\/\.well-known\//],
    skipWaiting: true,
    clientsClaim: true,
    cleanupOutdatedCaches: true,
    maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts-cache',
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 60 * 60 * 24 * 365,
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      {
        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'gstatic-fonts-cache',
          expiration: {
            maxEntries: 20,
            maxAgeSeconds: 60 * 60 * 24 * 365,
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      {
        urlPattern: /\/api\/.*/i,
        handler: 'NetworkOnly',
      },
    ],
  },
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, 'VITE_');
  return {
    root: rootDir,
    base: '/',
    publicDir: path.resolve(rootDir, 'public'),
    plugins: [
      react(),
      tailwindcss(),
      VitePWA(pwaConfig),
    ],
    define: {},
    build: {
      outDir: path.resolve(rootDir, 'dist'),
      emptyOutDir: true,
      sourcemap: false,
      minify: 'esbuild',
      target: 'esnext',
      reportCompressedSize: false,
      chunkSizeWarningLimit: 3000,
      rollupOptions: {
        input: 'index.html',
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(rootDir, 'src'),
        '/src': path.resolve(rootDir, 'src'),
        'react': path.resolve(rootDir, 'node_modules/react'),
        'react-dom': path.resolve(rootDir, 'node_modules/react-dom'),
      },
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'lucide-react',
        'motion',
        '@tanstack/react-query',
        'recharts',
        'd3',
      ],
    },
    server: {
      host: '0.0.0.0',
      allowedHosts: true,
      headers: {
        'Content-Security-Policy': "default-src * 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; script-src * 'self' 'unsafe-inline' 'unsafe-eval' blob:; style-src * 'self' 'unsafe-inline'; img-src * 'self' data: blob:; connect-src * 'self' 'unsafe-inline' 'unsafe-eval' blob:; frame-ancestors * 'self';"
      },
      hmr: process.env.DISABLE_HMR === 'true' ? false : {
        overlay: false
      },
      watch: {
        ignored: [
          '**/node_modules/**',
          '**/dist/**',
          '**/android/**',
          '**/ios/**',
          '**/uploads/**',
          '**/.git/**',
          '**/.github/**',
        ],
      },
    },
    preview: {
      host: '0.0.0.0',
      allowedHosts: true,
    },
  };
});