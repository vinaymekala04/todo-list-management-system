import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite dev server on port 5173.
// /api requests are proxied to the Spring Boot backend on port 8080,
// so the frontend can call relative "/api/..." URLs in development
// without CORS issues. The axios baseURL (VITE_API_URL) takes
// precedence when set — see src/api/axios.js.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
