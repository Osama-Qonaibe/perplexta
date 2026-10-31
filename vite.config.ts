import { createRequire } from 'module';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';

// Polyfill brace-expansion for modern minimatch/glob compatibility in build environments
const __nodeRequire = createRequire(import.meta.url);
try {
  const be = __nodeRequire('brace-expansion');
  if (be && typeof be === 'function' && !be.expand) {
    be.expand = be;
    be.default = be;
  }
} catch (_) {}

const rootDir = path.dirname(fileURLToPath(import.meta.url));



export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, 'VITE_');
  return {
    root: rootDir,
    base: '/',
    publicDir: path.resolve(rootDir, 'public'),
    plugins: [
      react(),
      tailwindcss(),
    ],
    define: {},
    build: {
      outDir: path.resolve(rootDir, 'dist'),
      emptyOutDir: true,
      copyPublicDir: false,
      sourcemap: false,
      minify: false,
      cssMinify: false,
      cssCodeSplit: true,
      target: 'esnext',
      reportCompressedSize: false,
      chunkSizeWarningLimit: 10000,
      rollupOptions: {
        input: 'index.html',
        output: {},
      }
    },
    json: {
      stringify: true,
    },
    resolve: {
      dedupe: ['react', 'react-dom', 'react-router-dom'],
      alias: {
        '@': path.resolve(rootDir, 'src'),
        '/src': path.resolve(rootDir, 'src'),
      },
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
      include: [
        'react',
        'react-dom',
        'react-router-dom',
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
      hmr: false,
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