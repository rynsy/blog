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
    ['html'],
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
            '--enable-zero-copy'
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
            'webgl.force-enabled': true
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
          args: ['--enable-webgl']
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

    /* Tablet testing */
    {
      name: 'Tablet',
      use: { 
        ...devices['iPad Pro'],
        hasTouch: true
      },
      dependencies: ['setup'],
    },

    /* High DPI testing */
    {
      name: 'High DPI',
      use: { 
        ...devices['Desktop Chrome HiDPI'],
        launchOptions: {
          args: [
            '--enable-webgl',
            '--force-device-scale-factor=2'
          ]
        }
      },
      dependencies: ['setup'],
    },

    /* Reduced motion testing */
    {
      name: 'Reduced Motion',
      use: { 
        ...devices['Desktop Chrome'],
        reducedMotion: 'reduce',
        launchOptions: {
          args: [
            '--enable-webgl',
            '--force-prefers-reduced-motion'
          ]
        }
      },
      dependencies: ['setup'],
    },

    /* Dark mode testing */
    {
      name: 'Dark Mode',
      use: { 
        ...devices['Desktop Chrome'],
        colorScheme: 'dark',
        launchOptions: {
          args: [
            '--enable-webgl',
            '--force-dark-mode'
          ]
        }
      },
      dependencies: ['setup'],
    },

    /* Performance testing with slow network */
    {
      name: 'Slow 3G',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--enable-webgl']
        },
        // Simulate slow network for performance testing
        contextOptions: {
          // Simulate slow connection
          offline: false,
          // Custom network conditions will be set in tests
        }
      },
      dependencies: ['setup'],
    }
  ],

  /* Run your local dev server before starting the tests */
  webServer: process.env.CI ? undefined : {
    command: 'npm run develop',
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
  
  /* Test artifacts */
  use: {
    ...{
      /* Base URL to use in actions like `await page.goto('/')`. */
      baseURL,
      
      /* Collect trace when retrying the failed test. */
      trace: 'on-first-retry',
      
      /* Capture screenshot on failure */
      screenshot: 'only-on-failure',
      
      /* Capture video on failure */
      video: 'retain-on-failure',
    },
    
    // Custom test metadata for better reporting
    testIdAttribute: 'data-testid',
    
    // Enable experimental features for Phase 4 testing
    launchOptions: {
      args: [
        '--enable-experimental-web-platform-features',
        '--enable-webgl2-compute-context'
      ]
    }
  }
})