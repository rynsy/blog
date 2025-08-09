import { test as base, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

// Extend basic test with custom fixtures
export const test = base.extend({
  // Test data fixture
  testData: async ({}, use) => {
    const testDataPath = path.join(process.cwd(), '../../test-fixtures/test-data.json')
    let testData = {}
    
    if (fs.existsSync(testDataPath)) {
      const data = await fs.promises.readFile(testDataPath, 'utf8')
      testData = JSON.parse(data)
    }
    
    await use(testData)
  },

  // Analytics mock fixture
  analyticsMock: async ({ page }, use) => {
    // Set up analytics intercepting
    const trackedEvents: Array<{event: string, data: any}> = []
    
    // Intercept analytics calls
    await page.route('**/api/send', async (route) => {
      const request = route.request()
      const postData = request.postData()
      
      if (postData) {
        try {
          const eventData = JSON.parse(postData)
          trackedEvents.push(eventData)
        } catch (e) {
          // Invalid JSON, ignore
        }
      }
      
      // Mock successful response
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Event tracked successfully' })
      })
    })
    
    // Intercept other analytics endpoints
    await page.route('**/track**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'ok', tracked: true })
      })
    })
    
    await use({
      getTrackedEvents: () => trackedEvents,
      clearTrackedEvents: () => trackedEvents.length = 0
    })
  },

  // Performance monitoring fixture
  performanceMonitor: async ({ page }, use) => {
    const performanceData: Array<{metric: string, value: number, timestamp: number}> = []
    
    // Inject performance monitoring script
    await page.addInitScript(() => {
      // Monitor Core Web Vitals
      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        entries.forEach((entry: any) => {
          if (entry.entryType === 'largest-contentful-paint') {
            window.__performanceData = window.__performanceData || []
            window.__performanceData.push({
              metric: 'LCP',
              value: entry.startTime,
              timestamp: Date.now()
            })
          }
          
          if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
            window.__performanceData = window.__performanceData || []
            window.__performanceData.push({
              metric: 'CLS',
              value: entry.value,
              timestamp: Date.now()
            })
          }
        })
      })
      
      observer.observe({ entryTypes: ['largest-contentful-paint', 'layout-shift'] })
      
      // Monitor paint metrics
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        entries.forEach((entry: any) => {
          window.__performanceData = window.__performanceData || []
          window.__performanceData.push({
            metric: entry.name === 'first-paint' ? 'FP' : 'FCP',
            value: entry.startTime,
            timestamp: Date.now()
          })
        })
      }).observe({ entryTypes: ['paint'] })
    })
    
    await use({
      getMetrics: async () => {
        return await page.evaluate(() => {
          return (window as any).__performanceData || []
        })
      },
      clearMetrics: async () => {
        await page.evaluate(() => {
          (window as any).__performanceData = []
        })
      }
    })
  },

  // Accessibility testing fixture
  a11yTester: async ({ page }, use) => {
    // Add accessibility testing helpers
    await page.addInitScript(() => {
      // Color contrast checker
      window.__a11yHelpers = {
        checkColorContrast: (element: Element) => {
          const styles = window.getComputedStyle(element)
          const color = styles.color
          const backgroundColor = styles.backgroundColor
          
          // Simple contrast check (would normally use more sophisticated algorithm)
          return {
            color,
            backgroundColor,
            hasContrast: color !== backgroundColor && color !== 'rgba(0, 0, 0, 0)'
          }
        },
        
        findFocusableElements: () => {
          const focusableSelectors = [
            'a[href]',
            'button:not([disabled])',
            'input:not([disabled])',
            'textarea:not([disabled])',
            'select:not([disabled])',
            '[tabindex]:not([tabindex="-1"])'
          ]
          
          return Array.from(document.querySelectorAll(focusableSelectors.join(', ')))
        },
        
        checkAriaLabels: (element: Element) => {
          return {
            hasAriaLabel: element.hasAttribute('aria-label'),
            hasAriaLabelledBy: element.hasAttribute('aria-labelledby'),
            hasAriaDescribedBy: element.hasAttribute('aria-describedby'),
            hasTitle: element.hasAttribute('title'),
            textContent: element.textContent?.trim() || ''
          }
        }
      }
    })
    
    await use({
      checkColorContrast: async (selector: string) => {
        return await page.evaluate((sel) => {
          const element = document.querySelector(sel)
          return element ? window.__a11yHelpers.checkColorContrast(element) : null
        }, selector)
      },
      
      getFocusableElements: async () => {
        return await page.evaluate(() => {
          return window.__a11yHelpers.findFocusableElements().map(el => ({
            tagName: el.tagName,
            id: el.id,
            className: el.className,
            ariaInfo: window.__a11yHelpers.checkAriaLabels(el)
          }))
        })
      }
    })
  },

  // WebGL testing fixture
  webglTester: async ({ page }, use) => {
    await use({
      checkWebGLSupport: async () => {
        return await page.evaluate(() => {
          const canvas = document.createElement('canvas')
          const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
          const gl2 = canvas.getContext('webgl2')
          
          if (!gl) return { supported: false }
          
          const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
          
          return {
            supported: true,
            webgl2: !!gl2,
            version: gl.getParameter(gl.VERSION),
            vendor: gl.getParameter(gl.VENDOR),
            renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown',
            maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
            extensions: gl.getSupportedExtensions() || []
          }
        })
      },
      
      measureWebGLPerformance: async () => {
        return await page.evaluate(async () => {
          const canvas = document.querySelector('canvas') as HTMLCanvasElement
          if (!canvas) return null
          
          const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
          if (!gl) return null
          
          // Measure frame rate
          let frameCount = 0
          const startTime = performance.now()
          
          return new Promise<{fps: number, memoryUsage?: number}>((resolve) => {
            function countFrames() {
              frameCount++
              
              if (performance.now() - startTime >= 1000) { // 1 second sample
                const fps = frameCount
                const memory = (performance as any).memory?.usedJSHeapSize || 0
                resolve({ fps, memoryUsage: memory })
              } else {
                requestAnimationFrame(countFrames)
              }
            }
            
            requestAnimationFrame(countFrames)
          })
        })
      }
    })
  }
})

// Export expect for convenience
export { expect }