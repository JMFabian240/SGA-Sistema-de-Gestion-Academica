import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';
import path from 'path';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'happy-dom',
      setupFiles: './src/tests/setup.ts',
      server: {
        deps: {
          inline: [/react-hook-form/, /@hookform\/resolvers/, /@testing-library/]
        }
      }
    },
    resolve: {
      alias: {
        'react': path.resolve(__dirname, './node_modules/react'),
        'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
        'react-dom/client': path.resolve(__dirname, './node_modules/react-dom/client'),
        'react-dom/server': path.resolve(__dirname, './node_modules/react-dom/server'),
        'react-dom/test-utils': path.resolve(__dirname, './node_modules/react-dom/test-utils'),
        'react/jsx-runtime': path.resolve(__dirname, './node_modules/react/jsx-runtime'),
        'react/jsx-dev-runtime': path.resolve(__dirname, './node_modules/react/jsx-dev-runtime'),
        '@': path.resolve(__dirname, './src'),
      }
    }
  })
);
