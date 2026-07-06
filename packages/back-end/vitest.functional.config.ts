import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    fileParallelism: false,
    setupFiles: ['./tests/setup/setup-integration.ts'],
    include: ['tests/functional/**/*.test.ts'],
    alias: {
      '@sga/data-access': path.resolve(__dirname, '../data-access/src')
    }
  }
});
