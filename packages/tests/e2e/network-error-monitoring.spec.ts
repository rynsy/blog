import { test, expect } from '@playwright/test'

/**
 * Network Error Monitoring Tests
 * 
 * Monitors network-related failures that could indicate production issues:
 * - Script loading failures (especially Cloudflare Insights)
 * - Failed API calls that could trigger React errors
 * - Resource loading timeouts
 * - CDN availability issues
 */

interface NetworkFailure {
  url: string
  status: number
  statusText: string
  method: string
  timestamp: number
  resourceType?: string
  failureReason?: string
}

interface CriticalResource {
  url: string | RegExp
  name: string
  required: boolean
  timeout: number
  description: string
}

const CRITICAL_RESOURCES: CriticalResource[] = [
  {
    url: /cloudflareinsights\.com\/beacon\.min\.js/,
    name: 'Cloudflare Insights',
    required: false, // Analytics, not critical for functionality
    timeout: 10000,
    description: 'Cloudflare Web Analytics beacon script'
  },
  {
    url: /static\/.*\.js$/,
    name: 'Application Scripts',
    required: true,
    timeout: 15000,
    description: 'Main application JavaScript bundles'
  },
  {
    url: /static\/.*\.css$/,
    name: 'Application Styles', 
    required: true,
    timeout: 10000,
    description: 'Main application stylesheets'
  }
]

test.describe('Network Error Monitoring', () => {
  let networkFailures: NetworkFailure[] = []
  const resourceLoadTimes: Map<string, number> = new Map()

  test.beforeEach(async ({ page }) => {
    // Reset tracking for each test
    networkFailures = []
    resourceLoadTimes.clear()

    // Monitor all network requests
    page.on('request', (request) => {
      const startTime = Date.now()
      resourceLoadTimes.set(request.url(), startTime)
    })

    // Monitor failed responses
    page.on('response', (response) => {
      const endTime = Date.now()
      const startTime = resourceLoadTimes.get(response.url()) || endTime
      const loadTime = endTime - startTime

      // Track failures
      if (!response.ok()) {
        networkFailures.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
          method: response.request().method(),
          timestamp: endTime,
          resourceType: response.request().resourceType(),
          failureReason: `HTTP ${response.status()}: ${response.statusText()}`
        })
      }

      // Track slow loading resources
      if (loadTime > 5000) { // 5 second threshold
        console.warn(`Slow resource loading: ${response.url()} took ${loadTime}ms`)
      }
    })

    // Monitor request failures (network errors, timeouts, etc.)
    page.on('requestfailed', (request) => {
      networkFailures.push({
        url: request.url(),
        status: 0,
        statusText: 'Request Failed',
        method: request.method(),
        timestamp: Date.now(),
        resourceType: request.resourceType(),
        failureReason: request.failure()?.errorText || 'Unknown network error'
      })
    })
  })

  test('should not have critical script loading failures', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000) // Wait for async scripts

    // Check for critical script failures
    const criticalScriptFailures = networkFailures.filter(failure => {
      return CRITICAL_RESOURCES.some(resource => {
        if (resource.required && resource.url instanceof RegExp) {
          return resource.url.test(failure.url) && failure.url.includes('.js')
        }
        return false
      })
    })

    if (criticalScriptFailures.length > 0) {
      console.error('Critical Script Loading Failures:', criticalScriptFailures)
      
      const failureReport = criticalScriptFailures.map(failure => 
        `${failure.url}: ${failure.failureReason} (${failure.status})`
      ).join('\n')
      
      throw new Error(`Critical script loading failures detected:\n${failureReport}`)
    }

    expect(criticalScriptFailures).toHaveLength(0)
  })

  test('should monitor Cloudflare Insights availability', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(5000) // Give time for analytics scripts

    // Check for Cloudflare Insights failures
    const cloudflareFailures = networkFailures.filter(failure =>
      /cloudflareinsights\.com/i.test(failure.url)
    )

    // Log but don't fail test for analytics failures (non-critical)
    if (cloudflareFailures.length > 0) {
      console.warn('Cloudflare Insights Loading Issues (Non-Critical):', cloudflareFailures)
      
      // Check if this is a consistent failure pattern
      const beaconFailures = cloudflareFailures.filter(f => f.url.includes('beacon.min.js'))
      
      if (beaconFailures.length > 0) {
        console.warn('Cloudflare beacon script failures detected - analytics may not be working')
      }
    }

    // Only fail if there are multiple repeated failures (indicating systematic issue)
    const repeatedFailures = cloudflareFailures.filter(f => f.status === 0 || f.status >= 500)
    expect(repeatedFailures.length).toBeLessThan(3) // Allow some transient failures
  })

  test('should detect resource loading timeouts', async ({ page }) => {
    const resourceTimeouts: { url: string, timeout: number }[] = []

    // Set up timeout monitoring
    page.on('request', (request) => {
      const matchingResource = CRITICAL_RESOURCES.find(resource => {
        if (resource.url instanceof RegExp) {
          return resource.url.test(request.url())
        }
        return request.url().includes(resource.url as string)
      })

      if (matchingResource) {
        // Set a timeout for this resource
        setTimeout(() => {
          const isStillPending = !networkFailures.some(f => f.url === request.url()) &&
                                 !resourceLoadTimes.has(request.url() + '_completed')
          
          if (isStillPending) {
            resourceTimeouts.push({
              url: request.url(),
              timeout: matchingResource.timeout
            })
          }
        }, matchingResource.timeout)
      }
    })

    page.on('response', (response) => {
      resourceLoadTimes.set(response.url() + '_completed', Date.now())
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(20000) // Wait for potential timeouts

    if (resourceTimeouts.length > 0) {
      console.error('Resource Loading Timeouts:', resourceTimeouts)
    }

    expect(resourceTimeouts).toHaveLength(0)
  })

  test('should validate all critical resources load successfully', async ({ page }) => {
    const resourceStatus: Array<{
      name: string
      url: string
      status: 'success' | 'failed' | 'timeout'
      details?: string
    }> = []

    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(5000)

    // Check each critical resource
    for (const resource of CRITICAL_RESOURCES) {
      let found = false
      let status: 'success' | 'failed' | 'timeout' = 'timeout'
      let details = ''

      // Check if any requests match this resource pattern
      const matchingFailures = networkFailures.filter(failure => {
        if (resource.url instanceof RegExp) {
          return resource.url.test(failure.url)
        }
        return failure.url.includes(resource.url as string)
      })

      if (matchingFailures.length > 0) {
        found = true
        status = 'failed'
        details = matchingFailures.map(f => f.failureReason).join('; ')
        
        resourceStatus.push({
          name: resource.name,
          url: matchingFailures[0].url,
          status,
          details
        })
      } else {
        // Check if we can detect successful loads
        const pageResources = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('script[src], link[href]')).map((el: any) => 
            el.src || el.href
          )
        })

        const matchingResource = pageResources.find(url => {
          if (resource.url instanceof RegExp) {
            return resource.url.test(url)
          }
          return url.includes(resource.url as string)
        })

        if (matchingResource) {
          found = true
          status = 'success'
          
          resourceStatus.push({
            name: resource.name,
            url: matchingResource,
            status
          })
        }
      }

      // If resource is required but not found, add to status
      if (!found && resource.required) {
        resourceStatus.push({
          name: resource.name,
          url: 'Not found',
          status: 'failed',
          details: 'Required resource not detected in page'
        })
      }
    }

    console.log('Critical Resource Status:', resourceStatus)

    // Fail if any required resources failed
    const requiredFailures = resourceStatus.filter(r => 
      CRITICAL_RESOURCES.find(cr => cr.name === r.name)?.required && r.status === 'failed'
    )

    if (requiredFailures.length > 0) {
      const failureReport = requiredFailures.map(f => 
        `${f.name}: ${f.status} - ${f.details}`
      ).join('\n')
      
      throw new Error(`Required resource failures:\n${failureReport}`)
    }

    expect(requiredFailures).toHaveLength(0)
  })

  test('should handle production CDN failures gracefully', async ({ page }) => {
    // Only run in production-like environments
    if (process.env.DOCKER_TEST !== 'true') {
      test.skip('Only runs in Docker production-like environment')
    }

    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(10000) // Extended wait for production

    // Check for CDN-related failures
    const cdnFailures = networkFailures.filter(failure => 
      failure.url.includes('cloudflare') ||
      failure.url.includes('cdn.') ||
      failure.url.includes('static.')
    )

    // Analyze failure patterns
    const criticalCDNFailures = cdnFailures.filter(failure => {
      // Critical if it's a required resource or systematic failure
      return failure.status >= 500 || // Server errors
             failure.status === 0 ||   // Network failures
             CRITICAL_RESOURCES.some(resource => 
               resource.required && 
               (resource.url instanceof RegExp ? 
                 resource.url.test(failure.url) : 
                 failure.url.includes(resource.url as string)
               )
             )
    })

    if (criticalCDNFailures.length > 0) {
      console.error('Critical CDN Failures in Production:', criticalCDNFailures)
    }

    // Allow some non-critical CDN failures but not systematic issues
    expect(criticalCDNFailures).toHaveLength(0)
  })

  test('should provide comprehensive network failure analysis', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(8000)

    // Comprehensive analysis
    const analysis = {
      totalFailures: networkFailures.length,
      failuresByStatus: {} as Record<number, number>,
      failuresByResourceType: {} as Record<string, number>,
      criticalFailures: 0,
      warningFailures: 0,
      details: networkFailures
    }

    networkFailures.forEach(failure => {
      // Count by status
      analysis.failuresByStatus[failure.status] = (analysis.failuresByStatus[failure.status] || 0) + 1
      
      // Count by resource type
      const resourceType = failure.resourceType || 'unknown'
      analysis.failuresByResourceType[resourceType] = (analysis.failuresByResourceType[resourceType] || 0) + 1
      
      // Categorize by severity
      if (failure.status >= 500 || failure.status === 0) {
        analysis.criticalFailures++
      } else if (failure.status >= 400) {
        analysis.warningFailures++
      }
    })

    console.log('Network Failure Analysis:', JSON.stringify(analysis, null, 2))

    // Fail test if there are critical network issues
    if (analysis.criticalFailures > 2) { // Allow some transient issues
      throw new Error(`Too many critical network failures: ${analysis.criticalFailures}`)
    }

    expect(analysis.criticalFailures).toBeLessThanOrEqual(2)
  })
})