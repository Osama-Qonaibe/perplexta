import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import { lucideBarrelOptimizerPlugin } from './vite.config';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, 'VITE_');
  return {
    root: rootDir,
    base: '/',
    publicDir: path.resolve(rootDir, 'public'),
    plugins: [
      lucideBarrelOptimizerPlugin(),
      react(),
      tailwindcss(),
    ],
    build: {
      outDir: path.resolve(rootDir, 'dist-app'),
      emptyOutDir: true,
      copyPublicDir: false,
      sourcemap: false,
      minify: 'esbuild',
      cssMinify: 'esbuild',
      cssCodeSplit: true,
      target: 'esnext',
      reportCompressedSize: false,
      rollupOptions: {
        input: 'app.html',
        treeshake: {
          moduleSideEffects: 'no-external',
          propertyReadSideEffects: false,
          tryCatchDeoptimization: false,
        },
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // React Core & Essentials
              if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/') || id.includes('@base-ui')) {
                return 'vendor-react-core';
              }
              // Router (Standalone for mobile)
              if (id.includes('/react-router/') || id.includes('/react-router-dom/')) {
                return 'vendor-router';
              }
              // Icons
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              // Motion
              if (id.includes('framer-motion') || id.includes('/motion/')) {
                return 'vendor-motion';
              }
              // Utilities & Networking
              if (id.includes('axios') || id.includes('socket.io-client') || id.includes('dompurify')) {
                return 'vendor-network';
              }
            }
          },
        },
      }
    },
    resolve: {
      dedupe: ['react', 'react-dom', 'react-router-dom'],
      alias: {
        '@': path.resolve(rootDir, 'src'),
        '/src': path.resolve(rootDir, 'src'),
      },
    },
  };
});
