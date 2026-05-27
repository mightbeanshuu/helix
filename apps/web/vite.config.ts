import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/v1': {
        target: process.env.VITE_API_URL ?? 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query'],
          cytoscape: [
            'cytoscape',
            'react-cytoscapejs',
            'cytoscape-fcose',
            'cytoscape-cose-bilkent',
          ],
        },
      },
    },
  },
});
