import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:8000'

/**
 * Comprehensive Playwright configuration for Phase 4 testing
 * Covers accessibility, performance, cross-device, and visual testing
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ...(process.env.CI ? [['github']] : [['list']])
  ],
  
  /* Shared settings for all the projects below. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL,
    
    /* Collect trace when retrying the failed test. */
    trace: 'on-first-retry',
    
    /* Capture screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Capture video on failure */
    video: 'retain-on-failure',
    
    /* Global timeout for all tests */
    actionTimeout: 15000,  // Increased from 30000
    navigationTimeout: 30000,
    
    /* Custom test metadata for better reporting */
    testIdAttribute: 'data-testid',
  },

  /* Test timeouts */
  timeout: 60000, // 1 minute per test
  expect: {
    timeout: 10000, // 10 seconds for assertions
  },

  /* Output directory */
  outputDir: 'test-results/',

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'setup',
      testMatch: '**/setup.spec.ts',
    },

    /* Basic health check - run on Chrome first */
    {
      name: 'health-check',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/basic-health-check.spec.ts',
      dependencies: ['setup'],
    },

    /* Desktop browsers */
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Enable WebGL and advanced features for background testing
        launchOptions: {
          args: [
            '--enable-webgl',
            '--enable-accelerated-2d-canvas',
            '--enable-gpu-rasterization',
            '--enable-zero-copy',
            '--disable-web-security',
            '--allow-running-insecure-content'
          ]
        }
      },
      testMatch: '**/cross-browser-compatibility.spec.ts',
      dependencies: ['health-check'],
    },

    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        // Firefox-specific settings for WebGL
        launchOptions: {
          firefoxUserPrefs: {
            'webgl.disabled': false,
            'webgl.force-enabled': true,
            'security.tls.insecure_fallback_hosts': 'localhost'
          }
        }
      },
      testMatch: '**/cross-browser-compatibility.spec.ts',
      dependencies: ['health-check'],
    },

    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        // Safari-specific settings
        launchOptions: {
          args: ['--enable-webgl', '--disable-web-security']
        }
      },
      testMatch: '**/cross-browser-compatibility.spec.ts',
      dependencies: ['health-check'],
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        // Mobile-specific settings for touch and performance
        hasTouch: true,
        isMobile: true
      },
      testMatch: '**/basic-health-check.spec.ts',
      dependencies: ['health-check'],
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: process.env.PLAYWRIGHT_TEST_BASE_URL ? undefined : {
    command: 'pnpm run develop',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes for Gatsby to start
    ignoreHTTPSErrors: true,
  },
})