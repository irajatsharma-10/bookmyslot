import { defineConfig } from 'vitest/config';
import path from 'path';
import { loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Load env files
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''));
  
  return {
    test: {
      environment: 'node',
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});
