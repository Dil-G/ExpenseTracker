import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        // API_PORT, not PORT: many hosts/launchers set PORT to the *web* server's port,
        // which would silently aim this proxy at Vite itself (ECONNREFUSED / 502).
        target: `http://127.0.0.1:${process.env.API_PORT || 3001}`,
        changeOrigin: true,
      },
    },
  },
  test: {
    // happy-dom (not jsdom): jsdom 25 delegates localStorage to Node's native
    // experimental webstorage backend, which needs a --localstorage-file flag we don't
    // want to wire through Vitest. happy-dom implements localStorage in-memory itself.
    // default environment is happy-dom (client tests need DOM); server tests override
    // to 'node' per-file via a `// @vitest-environment node` docblock comment.
    environment: 'happy-dom',
    globals: false,
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'src/**/*.pbt.test.ts', 'server/**/*.test.ts'],
  },
});
