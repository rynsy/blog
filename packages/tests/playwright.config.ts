import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:8000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000, // Increased for complex interactions
    navigationTimeout: 30000,
  },
  expect: {
    timeout: 10000,
    toHaveScreenshot: { 
      threshold: 0.3,
      mode: 'auto'
    },
    toMatchSnapshot: { 
      threshold: 0.3 
    }
  },
  projects: [
    // Desktop browsers
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: ['**/*.spec.ts']
    },
    {
      name: 'desktop-firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: ['**/*.spec.ts']
    },
    {
      name: 'desktop-safari',
      use: { ...devices['Desktop Safari'] },
      testMatch: ['**/*.spec.ts']
    },
    
    // Mobile browsers
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      testMatch: ['**/responsive-design.spec.ts', '**/navigation-flows.spec.ts', '**/accessibility.spec.ts']
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
      testMatch: ['**/responsive-design.spec.ts', '**/navigation-flows.spec.ts', '**/accessibility.spec.ts']
    },
    
    // Tablet
    {
      name: 'tablet-ipad',
      use: { ...devices['iPad Pro'] },
      testMatch: ['**/responsive-design.spec.ts', '**/interactive-backgrounds.spec.ts']
    },
    
    // Performance testing (Chrome only for consistency)
    {
      name: 'performance',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--enable-gpu-benchmarking', '--enable-gpu-memory-buffer-compositor-resources']
        }
      },
      testMatch: ['**/performance-monitoring.spec.ts']
    },
    
    // Visual regression (Chromium only for stability)
    {
      name: 'visual-regression',
      use: { 
        ...devices['Desktop Chrome'],
        // Consistent screenshot conditions
        colorScheme: 'light',
        timezoneId: 'America/Los_Angeles'
      },
      testMatch: ['**/visual-regression.spec.ts']
    },
    
    // Accessibility (all browsers)
    {
      name: 'accessibility-desktop',
      use: { ...devices['Desktop Chrome'] },
      testMatch: ['**/accessibility.spec.ts']
    },
    {
      name: 'accessibility-mobile', 
      use: { ...devices['Pixel 5'] },
      testMatch: ['**/accessibility.spec.ts']
    },
    
    // Cross-browser compatibility
    {
      name: 'cross-browser-chrome',
      use: { ...devices['Desktop Chrome'] },
      testMatch: ['**/cross-browser-compatibility.spec.ts']
    },
    {
      name: 'cross-browser-firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: ['**/cross-browser-compatibility.spec.ts']
    },
    {
      name: 'cross-browser-safari',
      use: { ...devices['Desktop Safari'] },
      testMatch: ['**/cross-browser-compatibility.spec.ts']
    }
  ],
  webServer: process.env.PLAYWRIGHT_TEST_BASE_URL ? undefined : {
    command: 'cd ../site && npm run develop',
    url: 'http://localhost:8000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})