import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { i18nPlugin } from './scripts/i18n-vite-plugin.js';

export default defineConfig({
  plugins: [i18nPlugin(), react()],
  base: '/',
  build: {
    outDir: 'dist',
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'dnd-kit',
              test: /node_modules[\\/]@dnd-kit[\\/]/,
              priority: 10,
            },
          ],
        },
      },
    },
  },
  worker: {
    format: 'es'
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src')
    }
  },
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
        ws: true,
        secure: false,
      },
      '/media': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
