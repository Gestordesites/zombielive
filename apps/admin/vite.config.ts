import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: '/admin/',
  plugins: [react()],
  server: {
    port: 3001,
    host: '0.0.0.0'
  },
  resolve: {
    alias: {
      '@zombie-live/shared': path.resolve(__dirname, '../../packages/shared/src')
    }
  }
});
