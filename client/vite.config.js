import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  if (mode === 'production') {
    const apiBaseUrl = env.VITE_API_BASE_URL?.trim();
    if (!apiBaseUrl) {
      throw new Error('VITE_API_BASE_URL must be set before building for production');
    }

    if (apiBaseUrl !== '/api/v1') {
      let parsedApiBaseUrl;
      try {
        parsedApiBaseUrl = new URL(apiBaseUrl);
      } catch {
        throw new Error('VITE_API_BASE_URL must be /api/v1 or an absolute HTTPS URL ending in /api/v1');
      }

      if (
        parsedApiBaseUrl.protocol !== 'https:' ||
        parsedApiBaseUrl.pathname !== '/api/v1' ||
        parsedApiBaseUrl.search ||
        parsedApiBaseUrl.hash
      ) {
        throw new Error('VITE_API_BASE_URL must be /api/v1 or an HTTPS URL ending in /api/v1');
      }
    }
  }

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
