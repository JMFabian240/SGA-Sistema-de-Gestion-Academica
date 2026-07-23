import { defineConfig, devices } from '@playwright/test';

process.env.DATABASE_URL = 'postgresql://sae_admin:SaeColegio2026@localhost:5433/sga_test';

export default defineConfig({
  testDir: './packages/front-end/tests/e2e',
  timeout: 60 * 1000,
  expect: {
    timeout: 10000
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      DATABASE_URL: 'postgresql://sae_admin:SaeColegio2026@localhost:5433/sga_test'
    }
  },
  use: {
    actionTimeout: 0,
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
