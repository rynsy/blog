import { test, expect } from '../setup'

/**
 * Production Health Monitoring Tests
 * 
 * Comprehensive production health checks that combine all error monitoring:
 * - Console error detection
 * - Network failure monitoring  
 * - React error tracking
 * - Performance baseline validation
 * - Critical service availability
 * 
 * Designed to run in CI/CD before production deployment.
 */

interface ProductionHealth {
  consoleErrors: Array<{
    type: string
    message: string
    severity: 'critical' | 'high' | 'medium' | 'low'
    pattern: string
  }>
  networkFailures: Array<{
    url: string
    status: number
    critical: boolean
  }>
  reactErrors: Array<{
    type: string
    code?: string
    critical: boolean
  }>
  performance: {
    loadTime: number
    lcp: number
    fcp: number
    cls: number
  }
  criticalServices: {
    gatsby: boolean
    react: boolean
    analytics: boolean
  }
  overallStatus: 'healthy' | 'warning' | 'critical'
  deploymentReady: boolean
}

const PRODUCTION_ERROR_PATTERNS = [
  {
    name: 'CloudflareInsightsFailure',
    pattern: /Loading failed for.*cloudflareinsights\.com\/beacon\.min\.js/i,
    severity: 'medium' as const,
    critical: false,
    category: 'analytics'
  },
  {
    name: 'GatsbyGraphQLError',
    pattern: /It appears like Gatsby is misconfigured.*graphql.*calls are supposed to only be evaluated at compile time/i,
    severity: 'critical' as const,
    critical: true,
    category: 'framework'
  },
  {
    name: 'ReactMinifiedError423',
    pattern: /React.*minified.*error.*#423|Minified React error #423/i,
    severity: 'critical' as const,
    critical: true,
    category: 'react'
  },
  {
    name: 'ReactMinifiedErrorAny',
    pattern: /Minified React error #\d+/i,
    severity: 'high' as const,
    critical: true,
    category: 'react'
  },
  {
    name: 'HydrationMismatch',
    pattern: /hydrat(e|ion).*mismatch|Text content did not match/i,
    severity: 'high' as const,
    critical: true,
    category: 'react'
  },
  {
    name: 'NetworkError',
    pattern: /net::ERR_|Failed to fetch|NetworkError/i,
    severity: 'high' as const,
    critical: true,
    category: 'network'
  },
  {
    name: 'JSError',
    pattern: /TypeError|ReferenceError|SyntaxError|RangeError/i,
    severity: 'high' as const,
    critical: true,
    category: 'javascript'
  }
] as const

test.describe('Production Health Monitoring', () => {
  let productionHealth: ProductionHealth

  test.beforeEach(async ({ page }) => {
    // Initialize health tracking
    productionHealth = {
      consoleErrors: [],
      networkFailures: [],
      reactErrors: [],
      performance: {
        loadTime: 0,
        lcp: 0,
        fcp: 0,
        cls: 0
      },
      criticalServices: {
        gatsby: false,
        react: false,
        analytics: false
      },
      overallStatus: 'healthy',
      deploymentReady: true
    }

    // Set up comprehensive monitoring
    await setupProductionMonitoring(page)
  })

  async function setupProductionMonitoring(page: any) {
    // Monitor console messages
    page.on('console', (msg: any) => {
      if (msg.type() === 'error') {
        const message = msg.text()
        
        PRODUCTION_ERROR_PATTERNS.forEach(pattern => {
          if (pattern.pattern.test(message)) {
            productionHealth.consoleErrors.push({
              type: pattern.name,
              message,
              severity: pattern.severity,
              pattern: pattern.category
            })

            if (pattern.critical) {
              productionHealth.overallStatus = 'critical'
              productionHealth.deploymentReady = false
            } else if (productionHealth.overallStatus === 'healthy') {
              productionHealth.overallStatus = 'warning'
            }
          }
        })
      }
    })

    // Monitor page errors
    page.on('pageerror', (error: Error) => {
      const message = error.message
      
      PRODUCTION_ERROR_PATTERNS.forEach(pattern => {
        if (pattern.pattern.test(message)) {
          productionHealth.consoleErrors.push({
            type: pattern.name,
            message,
            severity: pattern.severity,
            pattern: pattern.category
          })
        }
      })

      if (message.includes('React') || message.includes('Minified')) {
        const codeMatch = message.match(/error #(\d+)/)
        productionHealth.reactErrors.push({
          type: 'minified',
          code: codeMatch?.[1],
          critical: true
        })
        productionHealth.overallStatus = 'critical'
        productionHealth.deploymentReady = false
      }
    })

    // Monitor network failures
    page.on('response', (response: any) => {
      if (!response.ok()) {
        const critical = response.url().includes('.js') || 
                        response.url().includes('.css') ||
                        response.status() >= 500

        productionHealth.networkFailures.push({
          url: response.url(),
          status: response.status(),
          critical
        })

        if (critical) {
          productionHealth.overallStatus = 'critical'
          productionHealth.deploymentReady = false
        }
      }
    })

    page.on('requestfailed', (request: any) => {
      const critical = request.url().includes('.js') || 
                      request.url().includes('.css')

      productionHealth.networkFailures.push({
        url: request.url(),
        status: 0,
        critical
      })

      if (critical) {
        productionHealth.overallStatus = 'critical'
        productionHealth.deploymentReady = false
      }
    })

    // Inject performance and service monitoring
    await page.addInitScript(() => {
      window.__productionHealth = {
        startTime: Date.now(),
        errors: [],
        performance: {},
        services: {}
      }

      // Monitor performance metrics
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        entries.forEach((entry: any) => {
          if (entry.entryType === 'largest-contentful-paint') {
            window.__productionHealth.performance.lcp = entry.startTime
          }
          if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
            window.__productionHealth.performance.cls = (window.__productionHealth.performance.cls || 0) + entry.value
          }
        })
      }).observe({ entryTypes: ['largest-contentful-paint', 'layout-shift'] })

      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        entries.forEach((entry: any) => {
          if (entry.name === 'first-contentful-paint') {
            window.__productionHealth.performance.fcp = entry.startTime
          }
        })
      }).observe({ entryTypes: ['paint'] })

      // Monitor service availability
      setTimeout(() => {
        window.__productionHealth.services = {
          gatsby: !!(window.___gatsby || window.__GATSBY_HYDRATED__),
          react: !!(window.React || document.querySelector('[data-reactroot]')),
          analytics: !!window.gtag || !!window.dataLayer || document.querySelector('script[src*="gtag"]')
        }
      }, 2000)
    })
  }

  test('comprehensive production health check', async ({ page }) => {
    const startTime = Date.now()

    // Navigate and wait for full load
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Wait for framework hydration
    await page.waitForFunction(() => {
      return window.___gatsby || 
             window.__GATSBY_HYDRATED__ || 
             window.React ||
             document.readyState === 'complete'
    }, { timeout: 15000 })

    // Additional wait for all services to initialize
    await page.waitForTimeout(5000)

    const loadTime = Date.now() - startTime
    productionHealth.performance.loadTime = loadTime

    // Get performance metrics from page
    const pageMetrics = await page.evaluate(() => window.__productionHealth || {})
    
    if (pageMetrics.performance) {
      Object.assign(productionHealth.performance, pageMetrics.performance)
    }

    if (pageMetrics.services) {
      Object.assign(productionHealth.criticalServices, pageMetrics.services)
    }

    // Validate critical services
    if (!productionHealth.criticalServices.gatsby) {
      productionHealth.overallStatus = 'critical'
      productionHealth.deploymentReady = false
    }

    if (!productionHealth.criticalServices.react) {
      productionHealth.overallStatus = 'critical'  
      productionHealth.deploymentReady = false
    }

    // Performance thresholds
    if (productionHealth.performance.loadTime > 10000) { // 10 seconds
      productionHealth.overallStatus = productionHealth.overallStatus === 'healthy' ? 'warning' : productionHealth.overallStatus
    }

    if (productionHealth.performance.lcp > 4000) { // 4 seconds LCP
      productionHealth.overallStatus = productionHealth.overallStatus === 'healthy' ? 'warning' : productionHealth.overallStatus  
    }

    // Generate comprehensive report
    const healthReport = {
      timestamp: new Date().toISOString(),
      environment: process.env.DOCKER_TEST ? 'docker' : 'local',
      ...productionHealth,
      summary: {
        criticalErrors: productionHealth.consoleErrors.filter(e => e.severity === 'critical').length,
        highSeverityIssues: productionHealth.consoleErrors.filter(e => e.severity === 'high').length,
        networkFailures: productionHealth.networkFailures.filter(f => f.critical).length,
        reactErrors: productionHealth.reactErrors.filter(e => e.critical).length,
        performanceIssues: [
          productionHealth.performance.loadTime > 10000 ? 'slow-load' : null,
          productionHealth.performance.lcp > 4000 ? 'slow-lcp' : null,
          productionHealth.performance.cls > 0.25 ? 'layout-shift' : null
        ].filter(Boolean)
      }
    }

    console.log('🏥 Production Health Report:', JSON.stringify(healthReport, null, 2))

    // Assert deployment readiness
    if (!productionHealth.deploymentReady) {
      const criticalIssues = [
        ...productionHealth.consoleErrors.filter(e => e.severity === 'critical'),
        ...productionHealth.networkFailures.filter(f => f.critical),
        ...productionHealth.reactErrors.filter(e => e.critical)
      ]

      const issueReport = criticalIssues.map(issue => {
        if ('message' in issue) {
          return `${issue.type}: ${issue.message}`
        }
        if ('url' in issue) {
          return `Network failure: ${issue.url} (${issue.status})`
        }
        return `React error: ${issue.type}${issue.code ? ` #${issue.code}` : ''}`
      }).join('\n')

      throw new Error(`🚨 Production deployment blocked due to critical issues:\n\n${issueReport}`)
    }

    expect(productionHealth.deploymentReady).toBe(true)
    expect(productionHealth.overallStatus).not.toBe('critical')
  })

  test('should pass production readiness gate', async ({ page }) => {
    // This is the final gate before production deployment
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(8000)

    // Critical checks for production readiness
    const readinessChecks = {
      noConsoleErrors: productionHealth.consoleErrors.filter(e => e.severity === 'critical').length === 0,
      noNetworkFailures: productionHealth.networkFailures.filter(f => f.critical).length === 0,
      noReactErrors: productionHealth.reactErrors.filter(e => e.critical).length === 0,
      gatsbyHealthy: productionHealth.criticalServices.gatsby,
      reactHealthy: productionHealth.criticalServices.react,
      performanceAcceptable: productionHealth.performance.loadTime < 15000 // 15 second absolute max
    }

    const failedChecks = Object.entries(readinessChecks)
      .filter(([_, passed]) => !passed)
      .map(([check, _]) => check)

    console.log('🚦 Production Readiness Checks:', readinessChecks)

    if (failedChecks.length > 0) {
      throw new Error(`Production readiness failed. Failed checks: ${failedChecks.join(', ')}`)
    }

    // All checks passed
    console.log('✅ Production deployment approved - all health checks passed')
    
    expect(failedChecks).toHaveLength(0)
    expect(productionHealth.deploymentReady).toBe(true)
  })

  test('should monitor specific production error patterns in Docker', async ({ page }) => {
    if (process.env.DOCKER_TEST !== 'true') {
      test.skip('Production monitoring only runs in Docker environment')
    }

    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(10000) // Extended wait for production environment

    // Production-specific error monitoring
    const productionSpecificErrors = productionHealth.consoleErrors.filter(error => {
      // Filter for the exact errors mentioned in requirements
      return error.type === 'CloudflareInsightsFailure' ||
             error.type === 'GatsbyGraphQLError' ||
             error.type === 'ReactMinifiedError423'
    })

    if (productionSpecificErrors.length > 0) {
      const errorReport = productionSpecificErrors.map(error => 
        `${error.type} (${error.severity}): ${error.message}`
      ).join('\n')
      
      console.error('🚨 Production-specific errors detected:', productionSpecificErrors)
      
      // Fail for critical errors, warn for others
      const criticalProductionErrors = productionSpecificErrors.filter(e => e.severity === 'critical')
      
      if (criticalProductionErrors.length > 0) {
        throw new Error(`Critical production errors detected:\n${errorReport}`)
      } else {
        console.warn(`Non-critical production errors detected:\n${errorReport}`)
      }
    }

    // For the specific errors mentioned, we want zero tolerance in production
    const targetErrors = productionSpecificErrors.filter(error => 
      ['GatsbyGraphQLError', 'ReactMinifiedError423'].includes(error.type)
    )

    expect(targetErrors).toHaveLength(0)
  })

  test('should validate production performance baselines', async ({ page, performanceMonitor }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Get baseline performance from global setup
    const baselineLoadTime = parseInt(process.env.BASELINE_LOAD_TIME || '5000')
    const baselineFCP = parseInt(process.env.BASELINE_FCP || '3000')
    
    await page.waitForTimeout(5000)
    
    // Get current performance metrics
    const metrics = await performanceMonitor.getMetrics()
    const currentFCP = metrics.find(m => m.metric === 'FCP')?.value || 0
    const currentLCP = metrics.find(m => m.metric === 'LCP')?.value || 0
    
    productionHealth.performance.fcp = currentFCP
    productionHealth.performance.lcp = currentLCP

    // Performance regression check
    const performanceRegression = {
      fcpRegression: currentFCP > (baselineFCP * 1.5), // 50% regression threshold
      lcpRegression: currentLCP > 4000, // Absolute threshold
      loadTimeRegression: productionHealth.performance.loadTime > (baselineLoadTime * 2)
    }

    if (performanceRegression.fcpRegression || 
        performanceRegression.lcpRegression || 
        performanceRegression.loadTimeRegression) {
      
      productionHealth.overallStatus = 'warning'
      console.warn('⚠️ Performance regression detected:', performanceRegression)
      
      // Don't fail deployment for performance regression, but log it
      console.warn(`Performance metrics: FCP=${currentFCP}ms, LCP=${currentLCP}ms, Load=${productionHealth.performance.loadTime}ms`)
    }

    expect(currentLCP).toBeLessThan(10000) // 10 second absolute maximum
  })
})

// Extend global types
declare global {
  interface Window {
    __productionHealth?: {
      startTime: number
      errors: any[]
      performance: Record<string, any>
      services: Record<string, any>
    }
    ___gatsby?: any
    __GATSBY_HYDRATED__?: boolean
    React?: any
    gtag?: any
    dataLayer?: any
  }
}