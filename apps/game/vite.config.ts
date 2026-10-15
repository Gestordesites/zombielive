import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: './',
  server: {
    port: 3000,
    host: '0.0.0.0'
  },
  resolve: {
    alias: {
      '@zombie-live/shared': path.resolve(__dirname, '../../packages/shared/src')
    }
  }
});
