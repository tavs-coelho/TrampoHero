import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          // Proxy /api requests to the backend in development
          '/api': {
            target: (() => {
              try {
                return process.env.VITE_API_URL
                  ? new URL(process.env.VITE_API_URL).origin
                  : 'http://localhost:5000';
              } catch {
                return 'http://localhost:5000';
              }
            })(),
            changeOrigin: true,
          },
        },
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
