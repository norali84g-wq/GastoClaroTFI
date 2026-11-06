import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    css: false,
    // Las pruebas simulan fetch; la URL solo tiene que existir.
    env: { VITE_API_URL: 'http://api.test/api/v1' },
  },
});
