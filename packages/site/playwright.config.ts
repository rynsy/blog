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
    actionTimeout: 30000,
    navigationTimeout: 30000,
    
    /* Custom test metadata for better reporting */
    testIdAttribute: 'data-testid',
  },

  /* Global setup and teardown */
  globalSetup: require.resolve('./tests/global-setup.ts'),
  globalTeardown: require.resolve('./tests/global-teardown.ts'),

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
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
      dependencies: ['setup'],
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
      dependencies: ['setup'],
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
      dependencies: ['setup'],
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
      dependencies: ['setup'],
    },
    
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
        hasTouch: true,
        isMobile: true
      },
      dependencies: ['setup'],
    },

    /* Accessibility and performance focused projects */
    {
      name: 'a11y-chrome',
      use: { 
        ...devices['Desktop Chrome'],
        reducedMotion: 'reduce',
        colorScheme: 'light',
        launchOptions: {
          args: [
            '--enable-webgl',
            '--force-prefers-reduced-motion',
            '--disable-backgrounding-occluded-windows'
          ]
        }
      },
      dependencies: ['setup'],
      testMatch: /.*\.a11y\.spec\.ts/,
    },

    /* Performance testing project */
    {
      name: 'performance',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--enable-webgl',
            '--enable-precise-memory-info',
            '--enable-memory-info'
          ]
        }
      },
      dependencies: ['setup'],
      testMatch: /.*\.perf\.spec\.ts/,
    }
  ],

  /* Run your local dev server before starting the tests */
  webServer: process.env.DOCKER_TEST ? {
    command: 'pnpm run serve',
    url: baseURL,
    reuseExistingServer: false,
    timeout: 60 * 1000, // 1 minute for static server
    ignoreHTTPSErrors: true,
  } : process.env.CI ? undefined : {
    command: 'pnpm run develop',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes for Gatsby to start
    ignoreHTTPSErrors: true,
  },

  /* Test timeouts */
  timeout: 60000, // 1 minute per test
  expect: {
    timeout: 30000, // 30 seconds for assertions
  },

  /* Output directory */
  outputDir: 'test-results/',
})