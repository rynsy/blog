import { test, expect } from '../setup'

/**
 * React Error Monitoring Tests
 * 
 * Specialized monitoring for React-specific errors including:
 * - React minified errors (especially #423)
 * - Component lifecycle errors
 * - Hydration mismatches
 * - State management errors
 * - Error boundary failures
 */

interface ReactError {
  type: 'minified' | 'hydration' | 'lifecycle' | 'boundary' | 'other'
  errorCode?: string
  message: string
  stack?: string
  componentStack?: string
  timestamp: number
  source: 'console' | 'unhandledrejection' | 'error'
}

const REACT_ERROR_PATTERNS = {
  minified: {
    pattern: /Minified React error #(\d+)/i,
    severity: 'critical',
    codes: {
      '423': 'Cannot read properties of undefined/null',
      '418': 'Cannot update component while rendering',
      '185': 'Maximum update depth exceeded',
      '200': 'Invalid hook call'
    }
  },
  hydration: {
    pattern: /hydrat(e|ion)|client.*server.*mismatch/i,
    severity: 'high'
  },
  lifecycle: {
    pattern: /componentDidCatch|getDerivedStateFromError|lifecycle/i,
    severity: 'medium'
  },
  boundary: {
    pattern: /error.*boundary|componentDidCatch|Error: /i,
    severity: 'high'
  }
} as const

test.describe('React Error Monitoring', () => {
  let reactErrors: ReactError[] = []

  test.beforeEach(async ({ page }) => {
    // Reset error tracking
    reactErrors = []

    // Monitor console for React errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text()
        const error = analyzeReactError(text, 'console')
        if (error) {
          reactErrors.push(error)
        }
      }
    })

    // Monitor page errors
    page.on('pageerror', (error) => {
      const reactError = analyzeReactError(error.message, 'error')
      if (reactError) {
        reactError.stack = error.stack
        reactErrors.push(reactError)
      }
    })

    // Inject React error monitoring script
    await page.addInitScript(() => {
      // Monitor unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        const error = event.reason
        if (error && (error.message || error.stack)) {
          window.__reactErrors = window.__reactErrors || []
          window.__reactErrors.push({
            message: error.message || String(error),
            stack: error.stack,
            source: 'unhandledrejection',
            timestamp: Date.now()
          })
        }
      })

      // Monitor React DevTools if available
      if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        const originalOnError = window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberUnmount
        
        window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberUnmount = function(...args) {
          try {
            if (originalOnError) {
              originalOnError.apply(this, args)
            }
          } catch (error) {
            window.__reactErrors = window.__reactErrors || []
            window.__reactErrors.push({
              message: error.message,
              stack: error.stack,
              source: 'devtools',
              timestamp: Date.now()
            })
          }
        }
      }

      // Monitor React error boundaries
      const originalError = console.error
      console.error = function(...args) {
        const message = args.join(' ')
        if (message.includes('React') || message.includes('component') || message.includes('Error:')) {
          window.__reactErrors = window.__reactErrors || []
          window.__reactErrors.push({
            message,
            source: 'console-error',
            timestamp: Date.now()
          })
        }
        originalError.apply(console, args)
      }
    })
  })

  function analyzeReactError(message: string, source: ReactError['source']): ReactError | null {
    // Check for minified React errors
    const minifiedMatch = message.match(REACT_ERROR_PATTERNS.minified.pattern)
    if (minifiedMatch) {
      const errorCode = minifiedMatch[1]
      return {
        type: 'minified',
        errorCode,
        message,
        timestamp: Date.now(),
        source
      }
    }

    // Check for hydration errors
    if (REACT_ERROR_PATTERNS.hydration.pattern.test(message)) {
      return {
        type: 'hydration',
        message,
        timestamp: Date.now(),
        source
      }
    }

    // Check for error boundary errors
    if (REACT_ERROR_PATTERNS.boundary.pattern.test(message)) {
      return {
        type: 'boundary',
        message,
        timestamp: Date.now(),
        source
      }
    }

    // Check for lifecycle errors
    if (REACT_ERROR_PATTERNS.lifecycle.pattern.test(message)) {
      return {
        type: 'lifecycle',
        message,
        timestamp: Date.now(),
        source
      }
    }

    // Check if it's a React-related error
    if (message.toLowerCase().includes('react') || 
        message.includes('Component') ||
        message.includes('Hook') ||
        message.includes('jsx')) {
      return {
        type: 'other',
        message,
        timestamp: Date.now(),
        source
      }
    }

    return null
  }

  test('should not have React minified error #423', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Wait for React hydration
    await page.waitForFunction(() => {
      return window.React || 
             window.__GATSBY_HYDRATED__ || 
             document.querySelector('[data-reactroot]') ||
             document.readyState === 'complete'
    })

    // Additional wait for component mounting
    await page.waitForTimeout(3000)

    // Check specifically for error #423
    const error423 = reactErrors.filter(error => 
      error.type === 'minified' && error.errorCode === '423'
    )

    if (error423.length > 0) {
      console.error('React Minified Error #423 Found:', error423)
      
      // Get additional context from page
      const pageErrors = await page.evaluate(() => window.__reactErrors || [])
      console.error('Additional React Errors from Page:', pageErrors)
    }

    expect(error423).toHaveLength(0)
  })

  test('should not have critical React minified errors', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForFunction(() => window.React || document.readyState === 'complete')
    await page.waitForTimeout(3000)

    // Check for any critical minified errors
    const criticalCodes = ['423', '418', '185', '200'] // Most critical error codes
    const criticalErrors = reactErrors.filter(error => 
      error.type === 'minified' && 
      error.errorCode && 
      criticalCodes.includes(error.errorCode)
    )

    if (criticalErrors.length > 0) {
      console.error('Critical React Minified Errors Found:', criticalErrors)
      
      // Map error codes to descriptions
      const errorDescriptions = criticalErrors.map(error => {
        const description = REACT_ERROR_PATTERNS.minified.codes[error.errorCode as keyof typeof REACT_ERROR_PATTERNS.minified.codes]
        return `Error #${error.errorCode}: ${description || 'Unknown error'}`
      })
      
      throw new Error(`Critical React errors detected:\n${errorDescriptions.join('\n')}`)
    }

    expect(criticalErrors).toHaveLength(0)
  })

  test('should not have hydration mismatches', async ({ page }) => {
    await page.goto('/')
    
    // Monitor during hydration process
    await page.waitForFunction(() => window.__GATSBY_HYDRATED__ || document.readyState === 'complete')
    await page.waitForTimeout(2000)

    // Check for hydration errors
    const hydrationErrors = reactErrors.filter(error => error.type === 'hydration')

    if (hydrationErrors.length > 0) {
      console.error('React Hydration Errors Found:', hydrationErrors)
    }

    expect(hydrationErrors).toHaveLength(0)
  })

  test('should handle component interaction without React errors', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForFunction(() => window.React || document.readyState === 'complete')

    // Clear any initial errors
    reactErrors = []

    // Interact with components to trigger potential errors
    try {
      // Click on interactive elements
      const buttons = await page.$$('button')
      for (let i = 0; i < Math.min(buttons.length, 3); i++) {
        await buttons[i].click()
        await page.waitForTimeout(500)
      }

      // Try navigation if available
      const navLinks = await page.$$('nav a, [role="navigation"] a')
      if (navLinks.length > 0) {
        await navLinks[0].click()
        await page.waitForTimeout(1000)
        await page.goBack()
        await page.waitForTimeout(1000)
      }

      // Scroll to trigger lazy loading/intersection observers
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(1000)
      await page.evaluate(() => window.scrollTo(0, 0))

    } catch (interactionError) {
      console.log('Some interactions failed, continuing with error check...')
    }

    // Wait for any async errors to surface
    await page.waitForTimeout(2000)

    // Check for errors that occurred during interactions
    const interactionErrors = reactErrors.filter(error => 
      error.type === 'minified' || error.type === 'boundary'
    )

    if (interactionErrors.length > 0) {
      console.error('React Errors During Interaction:', interactionErrors)
    }

    expect(interactionErrors).toHaveLength(0)
  })

  test('should monitor React error boundaries', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForFunction(() => window.React || document.readyState === 'complete')
    await page.waitForTimeout(3000)

    // Get page errors from injected script
    const pageErrors = await page.evaluate(() => window.__reactErrors || [])
    
    // Combine with our tracked errors
    const allReactErrors = [...reactErrors]
    pageErrors.forEach(pageError => {
      const analyzed = analyzeReactError(pageError.message, pageError.source as ReactError['source'])
      if (analyzed) {
        allReactErrors.push(analyzed)
      }
    })

    // Check for error boundary failures
    const boundaryErrors = allReactErrors.filter(error => error.type === 'boundary')

    if (boundaryErrors.length > 0) {
      console.error('React Error Boundary Issues:', boundaryErrors)
    }

    // Error boundaries should catch errors, not fail themselves
    expect(boundaryErrors).toHaveLength(0)
  })

  test('should provide comprehensive React error analysis', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForFunction(() => window.React || document.readyState === 'complete')
    await page.waitForTimeout(5000)

    // Get all React-related errors from page
    const pageErrors = await page.evaluate(() => window.__reactErrors || [])
    
    // Comprehensive analysis
    const analysis = {
      totalReactErrors: reactErrors.length,
      pageDetectedErrors: pageErrors.length,
      errorsByType: {} as Record<string, number>,
      minifiedErrorCodes: [] as string[],
      criticalErrors: 0,
      details: {
        trackedErrors: reactErrors,
        pageErrors: pageErrors
      }
    }

    // Analyze tracked errors
    reactErrors.forEach(error => {
      analysis.errorsByType[error.type] = (analysis.errorsByType[error.type] || 0) + 1
      
      if (error.type === 'minified' && error.errorCode) {
        analysis.minifiedErrorCodes.push(error.errorCode)
        if (['423', '418', '185', '200'].includes(error.errorCode)) {
          analysis.criticalErrors++
        }
      }
      
      if (error.type === 'boundary' || error.type === 'hydration') {
        analysis.criticalErrors++
      }
    })

    console.log('React Error Analysis:', JSON.stringify(analysis, null, 2))

    // Fail if critical React errors are found
    if (analysis.criticalErrors > 0) {
      const criticalDetails = reactErrors
        .filter(error => 
          (error.type === 'minified' && ['423', '418', '185', '200'].includes(error.errorCode || '')) ||
          error.type === 'boundary' ||
          error.type === 'hydration'
        )
        .map(error => `${error.type}${error.errorCode ? ` #${error.errorCode}` : ''}: ${error.message}`)
        .join('\n')
      
      throw new Error(`Critical React errors detected:\n${criticalDetails}`)
    }

    expect(analysis.criticalErrors).toBe(0)
  })

  test('should validate React error monitoring works correctly', async ({ page }) => {
    await page.goto('/')
    
    // Test that our monitoring catches React errors by injecting test errors
    await page.evaluate(() => {
      // Simulate React minified error #423
      console.error('Minified React error #423: Cannot read properties of undefined (reading \'length\')')
      
      // Simulate hydration error
      console.error('Warning: Text content did not match. Server: "server text" Client: "client text"')
      
      // Simulate error boundary error
      console.error('React Error: The above error occurred in the <Component> component')
    })

    await page.waitForTimeout(1000)

    // Verify our monitoring detected the test errors
    const detectedMinified = reactErrors.filter(e => e.type === 'minified' && e.errorCode === '423')
    const detectedHydration = reactErrors.filter(e => e.type === 'hydration')
    const detectedBoundary = reactErrors.filter(e => e.type === 'boundary')

    expect(detectedMinified.length).toBeGreaterThan(0)
    expect(detectedHydration.length).toBeGreaterThan(0)
    expect(detectedBoundary.length).toBeGreaterThan(0)
  })
})

// Extend global Window interface for TypeScript
declare global {
  interface Window {
    __reactErrors?: Array<{
      message: string
      stack?: string
      source: string
      timestamp: number
    }>
    React?: any
    __GATSBY_HYDRATED__?: boolean
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: any
  }
}