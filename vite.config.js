

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { visualizer } from 'rollup-plugin-visualizer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), visualizer({ open: true })],
  optimizeDeps: {
    exclude: ['@capacitor-community/background-geolocation'],
    include: ['web3', 'crypto-js']
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      // Exclude backend and police-dashboard from build
      external: [
        resolve(__dirname, 'backend/**'),
        resolve(__dirname, 'backend-services/**'),
        resolve(__dirname, 'police-dashboard/**'),
        resolve(__dirname, 'redis/**'),
        // Exclude problematic Capacitor community plugins for web build
        '@capacitor-community/background-geolocation'
      ],
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return id.toString().split('node_modules/')[1].split('/')[0].toString();
          }
        },
      },
    },
    // Only output files from src, public, and root
    emptyOutDir: true,
    outDir: 'dist',
  },
  publicDir: 'public',
  define: {
    global: 'globalThis',
  },
});
