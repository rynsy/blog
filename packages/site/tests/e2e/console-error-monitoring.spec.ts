import { test, expect } from '../setup'

/**
 * Console Error Monitoring Tests
 * 
 * Monitors production console errors that indicate critical issues:
 * 1. Cloudflare Insights script loading failures
 * 2. Gatsby GraphQL runtime compilation errors
 * 3. React minified errors
 * 
 * These tests help catch production issues before deployment.
 */

interface ConsoleMessage {
  type: 'error' | 'warning' | 'info' | 'log'
  text: string
  location?: {
    url: string
    lineNumber: number
    columnNumber: number
  }
  timestamp: number
}

interface ErrorPattern {
  name: string
  pattern: RegExp
  severity: 'critical' | 'high' | 'medium'
  description: string
}

const MONITORED_ERROR_PATTERNS: ErrorPattern[] = [
  {
    name: 'CloudflareInsightsLoadFailure',
    pattern: /Loading failed for.*cloudflareinsights\.com\/beacon\.min\.js/i,
    severity: 'high',
    description: 'Cloudflare Insights script failed to load - affects analytics and monitoring'
  },
  {
    name: 'GatsbyGraphQLRuntimeError', 
    pattern: /It appears like Gatsby is misconfigured.*graphql.*calls are supposed to only be evaluated at compile time/i,
    severity: 'critical',
    description: 'Gatsby GraphQL runtime compilation error - indicates build configuration issues'
  },
  {
    name: 'ReactMinifiedError423',
    pattern: /React.*minified.*error.*#423|Minified React error #423/i,
    severity: 'critical', 
    description: 'React minified error #423 - critical React runtime error'
  }
]

test.describe('Console Error Monitoring', () => {
  let consoleMessages: ConsoleMessage[] = []

  test.beforeEach(async ({ page }) => {
    // Reset console messages for each test
    consoleMessages = []

    // Set up console message monitoring
    page.on('console', (msg) => {
      const message: ConsoleMessage = {
        type: msg.type() as ConsoleMessage['type'],
        text: msg.text(),
        timestamp: Date.now()
      }

      // Try to get location information for errors
      if (msg.type() === 'error' && msg.location()) {
        message.location = {
          url: msg.location().url,
          lineNumber: msg.location().lineNumber,
          columnNumber: msg.location().columnNumber
        }
      }

      consoleMessages.push(message)
    })

    // Also monitor page errors that might not appear in console
    page.on('pageerror', (error) => {
      consoleMessages.push({
        type: 'error',
        text: error.message,
        timestamp: Date.now()
      })
    })

    // Monitor network request failures that might cause script loading errors
    page.on('response', (response) => {
      if (!response.ok() && response.url().includes('cloudflareinsights.com')) {
        consoleMessages.push({
          type: 'error',
          text: `Loading failed for script "${response.url()}"`,
          timestamp: Date.now()
        })
      }
    })
  })

  test('should not have Cloudflare Insights loading failures on home page', async ({ page }) => {
    // Navigate to home page
    await page.goto('/')
    
    // Wait for page to fully load including external scripts
    await page.waitForLoadState('networkidle')
    
    // Wait additional time for async scripts to load
    await page.waitForTimeout(3000)

    // Check for Cloudflare Insights loading failures
    const cloudflareErrors = consoleMessages.filter(msg => 
      MONITORED_ERROR_PATTERNS[0].pattern.test(msg.text)
    )

    if (cloudflareErrors.length > 0) {
      console.error('Cloudflare Insights Loading Errors Found:', cloudflareErrors)
    }

    expect(cloudflareErrors).toHaveLength(0)
  })

  test('should not have Gatsby GraphQL runtime errors on home page', async ({ page }) => {
    // Navigate to home page
    await page.goto('/')
    
    // Wait for Gatsby to fully hydrate
    await page.waitForLoadState('networkidle')
    await page.waitForFunction(() => window.__GATSBY_HYDRATED__ === true || document.readyState === 'complete')

    // Check for Gatsby GraphQL errors
    const gatsbyErrors = consoleMessages.filter(msg => 
      MONITORED_ERROR_PATTERNS[1].pattern.test(msg.text)
    )

    if (gatsbyErrors.length > 0) {
      console.error('Gatsby GraphQL Runtime Errors Found:', gatsbyErrors)
    }

    expect(gatsbyErrors).toHaveLength(0)
  })

  test('should not have React minified error #423 on home page', async ({ page }) => {
    // Navigate to home page
    await page.goto('/')
    
    // Wait for React to fully load and hydrate
    await page.waitForLoadState('networkidle')
    await page.waitForFunction(() => window.React || document.readyState === 'complete')

    // Check for React minified error #423
    const reactErrors = consoleMessages.filter(msg => 
      MONITORED_ERROR_PATTERNS[2].pattern.test(msg.text)
    )

    if (reactErrors.length > 0) {
      console.error('React Minified Error #423 Found:', reactErrors)
    }

    expect(reactErrors).toHaveLength(0)
  })

  test('should monitor console errors across multiple page navigations', async ({ page }) => {
    const pages = ['/', '/about', '/blog', '/projects', '/contact']
    const allErrors: { page: string, errors: ConsoleMessage[] }[] = []

    for (const pagePath of pages) {
      // Clear previous messages
      consoleMessages = []

      try {
        await page.goto(pagePath)
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(2000) // Allow time for scripts to load

        // Check for monitored error patterns
        const pageErrors = consoleMessages.filter(msg => 
          MONITORED_ERROR_PATTERNS.some(pattern => pattern.pattern.test(msg.text))
        )

        if (pageErrors.length > 0) {
          allErrors.push({
            page: pagePath,
            errors: pageErrors
          })
        }
      } catch (navigationError) {
        // If page doesn't exist, skip it but log the attempt
        console.log(`Page ${pagePath} not accessible, skipping...`)
      }
    }

    // Report any found errors
    if (allErrors.length > 0) {
      console.error('Console Errors Found Across Pages:', allErrors)
      
      // Create detailed error report
      const errorReport = allErrors.map(({ page, errors }) => 
        `Page: ${page}\n` + 
        errors.map(error => 
          `  - ${error.type.toUpperCase()}: ${error.text}`
        ).join('\n')
      ).join('\n\n')
      
      throw new Error(`Console errors detected across ${allErrors.length} pages:\n\n${errorReport}`)
    }

    expect(allErrors).toHaveLength(0)
  })

  test('should provide comprehensive console error analysis', async ({ page }) => {
    // Navigate to home page with comprehensive monitoring
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Wait for all async operations to complete
    await page.waitForTimeout(5000)

    // Categorize all console messages
    const errorMessages = consoleMessages.filter(msg => msg.type === 'error')
    const warningMessages = consoleMessages.filter(msg => msg.type === 'warning')
    
    // Analyze critical errors
    const criticalErrors: { pattern: ErrorPattern, messages: ConsoleMessage[] }[] = []
    
    MONITORED_ERROR_PATTERNS.forEach(pattern => {
      const matchingMessages = consoleMessages.filter(msg => pattern.pattern.test(msg.text))
      if (matchingMessages.length > 0) {
        criticalErrors.push({ pattern, messages: matchingMessages })
      }
    })

    // Create comprehensive report
    const report = {
      totalMessages: consoleMessages.length,
      errors: errorMessages.length,
      warnings: warningMessages.length,
      criticalErrors: criticalErrors.length,
      details: {
        monitoredPatterns: MONITORED_ERROR_PATTERNS.length,
        foundCriticalIssues: criticalErrors,
        allErrors: errorMessages,
        allWarnings: warningMessages
      }
    }

    console.log('Console Analysis Report:', JSON.stringify(report, null, 2))

    // Test should fail if any critical errors are found
    if (criticalErrors.length > 0) {
      const errorSummary = criticalErrors.map(({ pattern, messages }) => 
        `${pattern.name} (${pattern.severity}): ${messages.length} occurrences`
      ).join('\n')
      
      throw new Error(`Critical console errors detected:\n${errorSummary}`)
    }

    expect(criticalErrors).toHaveLength(0)
  })

  test('should handle production-specific error monitoring in Docker', async ({ page }) => {
    // Skip if not running in Docker test environment
    if (process.env.DOCKER_TEST !== 'true') {
      test.skip('Only runs in Docker production-like environment')
    }

    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Production-specific checks
    await page.waitForTimeout(10000) // Longer wait for production environment
    
    // Check for production-specific patterns
    const productionErrors = consoleMessages.filter(msg => {
      return MONITORED_ERROR_PATTERNS.some(pattern => pattern.pattern.test(msg.text)) ||
             msg.text.includes('net::ERR_') ||
             msg.text.includes('Failed to fetch') ||
             msg.text.includes('NetworkError')
    })

    if (productionErrors.length > 0) {
      console.error('Production Environment Errors:', productionErrors)
    }

    expect(productionErrors).toHaveLength(0)
  })
})

test.describe('Console Error Pattern Validation', () => {
  test('should validate error pattern detection works correctly', async ({ page }) => {
    // Inject test errors to validate our monitoring works
    await page.goto('/')
    
    // Test pattern matching by injecting known error messages
    await page.evaluate(() => {
      // Simulate the errors we're looking for
      console.error('Loading failed for script "https://static.cloudflareinsights.com/beacon.min.js"')
      console.error('It appears like Gatsby is misconfigured. Gatsby related `graphql` calls are supposed to only be evaluated at compile time')
      console.error('Minified React error #423: Cannot read properties')
    })

    await page.waitForTimeout(1000)

    // Verify our patterns detect these test errors
    const detectedErrors = consoleMessages.filter(msg => 
      MONITORED_ERROR_PATTERNS.some(pattern => pattern.pattern.test(msg.text))
    )

    // Should detect exactly 3 errors (one for each pattern)
    expect(detectedErrors).toHaveLength(3)

    // Verify each pattern was matched
    MONITORED_ERROR_PATTERNS.forEach(pattern => {
      const matchingError = detectedErrors.find(msg => pattern.pattern.test(msg.text))
      expect(matchingError).toBeDefined()
    })
  })
})