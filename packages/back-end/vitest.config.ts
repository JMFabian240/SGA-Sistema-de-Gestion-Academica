import { defineConfig, configDefaults } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup/prisma-mock.ts'],
    alias: {
      '@sga/data-access': path.resolve(__dirname, '../data-access/src')
    },
    exclude: [...configDefaults.exclude, 'tests/integration/**/*.ts', 'dist/**/*.ts', 'dist/**/*.js']
  }
});
