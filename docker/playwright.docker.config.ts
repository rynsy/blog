import { defineConfig, devices } from '@playwright/test'

/**
 * Focused Docker Playwright Config
 * Runs only essential e2e tests on Chromium to validate production deployment
 */
export default defineConfig({
  testDir: '../packages/tests/e2e',
  fullyParallel: false, // Single worker for Docker
  forbidOnly: true,
  retries: 1,
  workers: 1, // Single worker for Docker stability
  reporter: [['dot']], // Clean output
  
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://production-site',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  
  expect: {
    timeout: 10000,
  },
  
  projects: [
    {
      name: 'docker-essentials',
      use: { ...devices['Desktop Chrome'] },
      testMatch: [
        '**/basic-health-check.spec.ts',
        '**/smoke-tests.spec.ts',
        '**/accessibility.spec.ts'
      ]
    }
  ],
})