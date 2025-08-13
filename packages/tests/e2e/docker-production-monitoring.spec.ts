import { test, expect } from '@playwright/test'

/**
 * Docker Production Monitoring Tests
 * 
 * Specialized tests for monitoring production errors in Docker environment:
 * - Container-specific error patterns
 * - Analytics service mocking validation
 * - Production build error detection
 * - Cross-browser compatibility in containers
 * - CI/CD integration validation
 */

test.describe('Docker Production Monitoring', () => {
  test.beforeAll(async () => {
    // Only run these tests in Docker environment
    if (process.env.DOCKER_TEST !== 'true') {
      test.skip('Docker-specific tests only run in containerized environment')
    }
  })

  test('should validate Docker environment setup for error monitoring', async ({ page }) => {
    // Verify we're running in the correct environment
    const environment = {
      isDocker: process.env.DOCKER_TEST === 'true',
      hasAnalyticsMock: process.env.ANALYTICS_MOCK_AVAILABLE === 'true',
      baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || page.context().baseURL
    }

    console.log('🐳 Docker Environment:', environment)

    expect(environment.isDocker).toBe(true)
    expect(environment.baseURL).toBeTruthy()

    // Test that the application is accessible
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const title = await page.title()
    expect(title).toBeTruthy()
    expect(title.length).toBeGreaterThan(0)
  })

  test('should monitor production console errors in Docker container', async ({ page }) => {
    const consoleErrors: Array<{ type: string, message: string, timestamp: number }> = []

    // Set up error monitoring
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push({
          type: msg.type(),
          message: msg.text(),
          timestamp: Date.now()
        })
      }
    })

    page.on('pageerror', (error) => {
      consoleErrors.push({
        type: 'pageerror',
        message: error.message,
        timestamp: Date.now()
      })
    })

    // Navigate and wait for full load
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(5000) // Extended wait for production environment

    // Check for the specific production errors
    const criticalErrors = consoleErrors.filter(error => {
      const message = error.message.toLowerCase()
      return message.includes('cloudflareinsights.com/beacon.min.js') ||
             message.includes('gatsby is misconfigured') ||
             message.includes('minified react error #423') ||
             message.includes('graphql') && message.includes('compile time')
    })

    if (criticalErrors.length > 0) {
      console.error('🚨 Critical production errors in Docker:', criticalErrors)
      
      // Create detailed error report
      const errorReport = criticalErrors.map(error => 
        `[${new Date(error.timestamp).toISOString()}] ${error.type}: ${error.message}`
      ).join('\n')
      
      throw new Error(`Production errors detected in Docker environment:\n${errorReport}`)
    }

    expect(criticalErrors).toHaveLength(0)
  })

  test.skip('should handle analytics mock service correctly', async ({ page }) => {
    // Test that analytics calls are properly mocked to prevent Cloudflare errors
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Trigger any analytics events
    await page.evaluate(() => {
      // Simulate typical analytics calls that might be made
      if (window.gtag) {
        window.gtag('event', 'page_view', { page_path: '/' })
      }
      
      // Try to load Cloudflare Insights if present
      const script = document.createElement('script')
      script.src = 'https://static.cloudflareinsights.com/beacon.min.js'
      document.head.appendChild(script)
    })

    await page.waitForTimeout(3000)

    // Check tracked events
    const trackedEvents = analyticsMock.getTrackedEvents()
    console.log('📊 Analytics events tracked in Docker:', trackedEvents)

    // Verify no analytics-related errors
    const analyticsErrors = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('*')).some(el => 
        el.textContent?.includes('beacon.min.js') || 
        el.textContent?.includes('cloudflareinsights')
      )
    })

    expect(analyticsErrors).toBe(false)
  })

  test('should validate production build artifacts load correctly', async ({ page }) => {
    const resourceLoadResults: Array<{
      url: string
      status: number
      resourceType: string
      success: boolean
    }> = []

    // Monitor all resource loading
    page.on('response', (response) => {
      resourceLoadResults.push({
        url: response.url(),
        status: response.status(),
        resourceType: response.request().resourceType(),
        success: response.ok()
      })
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    // Analyze critical resource loading
    const criticalResources = resourceLoadResults.filter(resource => 
      resource.resourceType === 'script' || 
      resource.resourceType === 'stylesheet' ||
      resource.url.includes('/static/')
    )

    const failedCriticalResources = criticalResources.filter(resource => !resource.success)

    if (failedCriticalResources.length > 0) {
      console.error('❌ Critical resource loading failures in Docker:', failedCriticalResources)
    }

    // Log successful resources for debugging
    const successfulResources = criticalResources.filter(resource => resource.success)
    console.log(`✅ Successfully loaded ${successfulResources.length} critical resources`)

    expect(failedCriticalResources).toHaveLength(0)
  })

  test('should test cross-browser error consistency in Docker', async ({ page, browserName }) => {
    const browserSpecificErrors: Array<{
      browser: string
      error: string
      timestamp: number
    }> = []

    // Monitor browser-specific errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        browserSpecificErrors.push({
          browser: browserName || 'unknown',
          error: msg.text(),
          timestamp: Date.now()
        })
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    // Check for browser-specific production errors
    const productionErrors = browserSpecificErrors.filter(error => {
      const message = error.error.toLowerCase()
      return message.includes('cloudflareinsights') ||
             message.includes('gatsby') && message.includes('graphql') ||
             message.includes('minified react error')
    })

    if (productionErrors.length > 0) {
      console.error(`🌐 Browser-specific production errors in ${browserName}:`, productionErrors)
    }

    // Production errors should be consistent across browsers
    expect(productionErrors).toHaveLength(0)
  })

  test('should validate container networking for external resources', async ({ page }) => {
    const networkRequests: Array<{
      url: string
      success: boolean
      status: number
      external: boolean
    }> = []

    // Monitor network requests
    page.on('response', (response) => {
      const url = response.url()
      const isExternal = !url.includes(page.url().split('/')[2]) // Different domain

      networkRequests.push({
        url,
        success: response.ok(),
        status: response.status(),
        external: isExternal
      })
    })

    page.on('requestfailed', (request) => {
      const url = request.url()
      const isExternal = !url.includes(page.url().split('/')[2])

      networkRequests.push({
        url,
        success: false,
        status: 0,
        external: isExternal
      })
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(5000)

    // Analyze external request failures
    const externalRequests = networkRequests.filter(req => req.external)
    const failedExternalRequests = externalRequests.filter(req => !req.success)

    console.log(`🌐 External requests: ${externalRequests.length}, Failed: ${failedExternalRequests.length}`)

    // Check for Cloudflare Insights specifically
    const cloudflareRequests = networkRequests.filter(req => 
      req.url.includes('cloudflareinsights.com')
    )

    if (cloudflareRequests.length > 0) {
      const failedCloudflare = cloudflareRequests.filter(req => !req.success)
      if (failedCloudflare.length > 0) {
        console.warn('⚠️ Cloudflare Insights requests failed (expected in test environment):', failedCloudflare)
      }
    }

    // Critical external resources should work (or be properly mocked)
    const criticalExternalFailures = failedExternalRequests.filter(req => 
      req.url.includes('.js') && !req.url.includes('cloudflareinsights')
    )

    expect(criticalExternalFailures).toHaveLength(0)
  })

  test('should validate CI/CD error reporting integration', async ({ page }) => {
    const testReport = {
      timestamp: new Date().toISOString(),
      environment: 'docker-production',
      browser: process.env.BROWSER_NAME || 'chromium',
      errors: [] as Array<{ type: string, message: string, critical: boolean }>,
      performance: {} as any,
      status: 'pending'
    }

    // Comprehensive error monitoring
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const message = msg.text()
        const critical = message.includes('gatsby') && message.includes('graphql') ||
                        message.includes('minified react error #423')

        testReport.errors.push({
          type: 'console',
          message,
          critical
        })
      }
    })

    page.on('pageerror', (error) => {
      testReport.errors.push({
        type: 'pageerror',  
        message: error.message,
        critical: true
      })
    })

    // Navigate and test
    const startTime = Date.now()
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(5000)
    const loadTime = Date.now() - startTime

    // Collect performance data
    testReport.performance = {
      loadTime,
      timestamp: Date.now()
    }

    // Determine overall status
    const criticalErrors = testReport.errors.filter(e => e.critical)
    testReport.status = criticalErrors.length === 0 ? 'passed' : 'failed'

    // Output report in CI-friendly format
    console.log('🔄 CI/CD Test Report:', JSON.stringify(testReport, null, 2))

    // Set exit code via environment variable for CI/CD
    if (testReport.status === 'failed') {
      process.env.PLAYWRIGHT_TEST_FAILED = 'true'
    }

    expect(testReport.status).toBe('passed')
    expect(criticalErrors).toHaveLength(0)
  })

  test('should handle production deployment gate checks', async ({ page }) => {
    // This test acts as a deployment gate - must pass for production deployment
    const deploymentGate = {
      consoleErrorsCheck: false,
      networkFailuresCheck: false,
      reactErrorsCheck: false,
      performanceCheck: false,
      overallPassed: false
    }

    const allErrors: string[] = []

    // Monitor all potential issues
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        allErrors.push(`Console: ${msg.text()}`)
      }
    })

    page.on('pageerror', (error) => {
      allErrors.push(`Page: ${error.message}`)
    })

    page.on('requestfailed', (request) => {
      if (request.url().includes('.js') || request.url().includes('.css')) {
        allErrors.push(`Network: Failed to load ${request.url()}`)
      }
    })

    // Test deployment readiness
    const startTime = Date.now()
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(10000) // Extended wait for production environment
    const totalTime = Date.now() - startTime

    // Run deployment gate checks
    const productionSpecificErrors = allErrors.filter(error => 
      error.includes('cloudflareinsights.com/beacon.min.js') ||
      error.includes('Gatsby is misconfigured') ||
      error.includes('minified React error #423')
    )

    deploymentGate.consoleErrorsCheck = productionSpecificErrors.length === 0
    deploymentGate.networkFailuresCheck = !allErrors.some(e => e.includes('Network:'))
    deploymentGate.reactErrorsCheck = !allErrors.some(e => e.includes('React') && e.includes('error'))
    deploymentGate.performanceCheck = totalTime < 30000 // 30 second absolute max

    deploymentGate.overallPassed = Object.values(deploymentGate).every(Boolean)

    console.log('🚦 Deployment Gate Status:', deploymentGate)

    if (!deploymentGate.overallPassed) {
      console.error('❌ Deployment gate failed. Blocking production deployment.')
      console.error('Errors found:', allErrors)
    } else {
      console.log('✅ Deployment gate passed. Production deployment approved.')
    }

    expect(deploymentGate.overallPassed).toBe(true)
    expect(productionSpecificErrors).toHaveLength(0)
  })
})