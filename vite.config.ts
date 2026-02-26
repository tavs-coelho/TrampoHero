import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Derive the backend origin from VITE_API_URL so the dev proxy stays in sync
  let backendOrigin = 'http://localhost:5000';
  if (env.VITE_API_URL) {
    try {
      backendOrigin = new URL(env.VITE_API_URL).origin;
    } catch {
      // Malformed URL – keep the default
    }
  }

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        // Proxy /api requests to the backend during development
        '/api': {
          target: backendOrigin,
          changeOrigin: true,
        },
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      // Emit a warning (not an error) for chunks larger than 1 MB.
      chunkSizeWarningLimit: 1000,
    },
  };
export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  build: {
    // Emit a warning (not an error) for chunks larger than 1 MB.
    chunkSizeWarningLimit: 1000,
  },
});
