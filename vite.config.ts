import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          '@/components': path.resolve(__dirname, './components'),
          '@/lib': path.resolve(__dirname, './lib'),
          '@/types': path.resolve(__dirname, './types'),
          '@/utils': path.resolve(__dirname, './utils'),
          '@/services': path.resolve(__dirname, './services'),
          '@/stores': path.resolve(__dirname, './stores'),
          '@/hooks': path.resolve(__dirname, './hooks'),
          '@/pages': path.resolve(__dirname, './pages'),
          '@/design-system': path.resolve(__dirname, './design-system'),
        }
      }
    };
});
