import { test, expect } from '@playwright/test'

test.describe('Performance and Monitoring Tests (P-01)', () => {
  
  test.describe('Core Web Vitals', () => {
    test('measures Largest Contentful Paint (LCP)', async ({ page }) => {
      await page.goto('/')
      
      // Collect LCP metric
      const lcp = await page.evaluate(() => {
        return new Promise<number>(resolve => {
          const observer = new PerformanceObserver(list => {
            const entries = list.getEntries()
            const lastEntry = entries[entries.length - 1] as any
            resolve(lastEntry.startTime)
          })
          observer.observe({ entryTypes: ['largest-contentful-paint'] })
          
          // Fallback timeout
          setTimeout(() => resolve(-1), 5000)
        })
      })
      
      if (lcp > 0) {
        // LCP should be under 2.5s for good performance
        expect(lcp).toBeLessThan(2500)
        console.log(`LCP: ${lcp}ms`)
      }
    })

    test('measures First Input Delay (FID) simulation', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Measure time to first interaction
      const startTime = Date.now()
      
      // Try to interact with the page
      const controlButton = page.locator('button[aria-label*="background controls"]').first()
      if (await controlButton.isVisible()) {
        await controlButton.click()
        const responseTime = Date.now() - startTime
        
        // FID should be under 100ms for good performance
        expect(responseTime).toBeLessThan(300) // Allow more time for E2E tests
        console.log(`Simulated FID: ${responseTime}ms`)
        
        await page.keyboard.press('Escape')
      }
    })

    test('measures Cumulative Layout Shift (CLS)', async ({ page }) => {
      let cls = 0
      
      // Monitor layout shifts
      await page.addInitScript(() => {
        (window as any).__cls = 0
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
              (window as any).__cls += (entry as any).value
            }
          }
        }).observe({ entryTypes: ['layout-shift'] })
      })

      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Load background module to test dynamic content
      const controlButton = page.locator('button[aria-label*="background controls"]').first()
      if (await controlButton.isVisible()) {
        await controlButton.click()
        await page.locator('text=Knowledge Graph').click()
        await page.locator('text=Background Active').click()
        await page.keyboard.press('Escape')
        await page.waitForTimeout(2000)
      }

      cls = await page.evaluate(() => (window as any).__cls)
      
      // CLS should be under 0.1 for good performance
      expect(cls).toBeLessThan(0.1)
      console.log(`CLS: ${cls}`)
    })

    test('measures Time to Interactive (TTI)', async ({ page }) => {
      const startTime = Date.now()
      
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Test if page is fully interactive
      const controlButton = page.locator('button[aria-label*="background controls"]').first()
      if (await controlButton.isVisible()) {
        await controlButton.click()
        await page.waitForTimeout(100)
        
        const dialog = page.locator('[role="dialog"]')
        if (await dialog.isVisible()) {
          const tti = Date.now() - startTime
          
          // TTI should be reasonable (under 5s for good performance)
          expect(tti).toBeLessThan(5000)
          console.log(`TTI: ${tti}ms`)
          
          await page.keyboard.press('Escape')
        }
      }
    })
  })

  test.describe('Resource Loading Performance', () => {
    test('measures resource loading times', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Get performance timing
      const timing = await page.evaluate(() => {
        const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        return {
          dns: perf.domainLookupEnd - perf.domainLookupStart,
          connection: perf.connectEnd - perf.connectStart,
          response: perf.responseEnd - perf.responseStart,
          dom: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
          load: perf.loadEventEnd - perf.loadEventStart,
          total: perf.loadEventEnd - perf.navigationStart
        }
      })
      
      // Log performance metrics
      console.log('Performance Timing:', timing)
      
      // Assertions for reasonable performance
      expect(timing.total).toBeLessThan(10000) // Total load under 10s
      expect(timing.dom).toBeLessThan(3000) // DOM ready under 3s
    })

    test('monitors background module loading performance', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Enable background module and measure loading time
      const startTime = performance.now()
      
      const controlButton = page.locator('button[aria-label*="background controls"]').first()
      if (await controlButton.isVisible()) {
        await controlButton.click()
        await page.locator('text=Animated Gradient').click()
        await page.locator('text=Background Active').click()
        await page.keyboard.press('Escape')
        
        // Wait for canvas to appear
        await page.waitForSelector('canvas', { state: 'visible' })
        
        const endTime = performance.now()
        const moduleLoadTime = endTime - startTime
        
        // Module loading should be fast (under 2s)
        expect(moduleLoadTime).toBeLessThan(2000)
        console.log(`Module load time: ${moduleLoadTime}ms`)
      }
    })

    test('checks for unused resources', async ({ page }) => {
      const resourceSizes = new Map<string, number>()
      
      page.on('response', response => {
        const _url = response.url()
        const size = parseInt(response.headers()['content-length'] || '0')
        if (size > 0) {
          resourceSizes.set(url, size)
        }
      })
      
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Analyze resource usage
      const resources = Array.from(resourceSizes.entries())
      const totalSize = resources.reduce((sum, [, size]) => sum + size, 0)
      
      console.log(`Total resources loaded: ${resources.length}`)
      console.log(`Total size: ${Math.round(totalSize / 1024)}KB`)
      
      // Check for reasonable resource usage
      expect(totalSize).toBeLessThan(5 * 1024 * 1024) // Under 5MB total
      
      // Log largest resources
      const largeResources = resources
        .filter(([, size]) => size > 100 * 1024) // Over 100KB
        .sort(([, a], [, b]) => b - a)
      
      if (largeResources.length > 0) {
        console.log('Large resources:')
        largeResources.slice(0, 5).forEach(([url, size]) => {
          console.log(`  ${Math.round(size / 1024)}KB: ${url}`)
        })
      }
    })

    test('monitors memory usage during module operation', async ({ page }) => {
      // Track memory usage
      await page.addInitScript(() => {
        (window as any).__memoryStats = []
        
        const trackMemory = () => {
          if ('memory' in performance) {
            (window as any).__memoryStats.push({
              used: (performance as any).memory.usedJSHeapSize,
              total: (performance as any).memory.totalJSHeapSize,
              limit: (performance as any).memory.jsHeapSizeLimit,
              timestamp: Date.now()
            })
          }
        }
        
        // Track memory every second
        setInterval(trackMemory, 1000)
        trackMemory() // Initial reading
      })

      await page.goto('/?egg=gradient')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(5000) // Let module run for 5 seconds
      
      // Switch to knowledge module
      const controlButton = page.locator('button[aria-label*="background controls"]').first()
      if (await controlButton.isVisible()) {
        await controlButton.click()
        await page.locator('text=Knowledge Graph').click()
        await page.keyboard.press('Escape')
        await page.waitForTimeout(3000) // Let new module run
      }
      
      const memoryStats = await page.evaluate(() => (window as any).__memoryStats)
      
      if (memoryStats && memoryStats.length > 0) {
        const initial = memoryStats[0]
        const final = memoryStats[memoryStats.length - 1]
        
        console.log(`Memory usage: ${Math.round(initial.used / 1024 / 1024)}MB -> ${Math.round(final.used / 1024 / 1024)}MB`)
        
        // Check for reasonable memory usage (under 100MB)
        expect(final.used).toBeLessThan(100 * 1024 * 1024)
        
        // Check for memory leaks (growth should be reasonable)
        const growth = final.used - initial.used
        expect(growth).toBeLessThan(50 * 1024 * 1024) // Under 50MB growth
      }
    })
  })

  test.describe('Animation Performance', () => {
    test('measures canvas animation frame rate', async ({ page }) => {
      // Track frame timing
      await page.addInitScript(() => {
        (window as any).__frameTimings = []
        let lastFrameTime = performance.now()
        
        const originalRAF = requestAnimationFrame
        window.requestAnimationFrame = function(callback) {
          return originalRAF(() => {
            const now = performance.now()
            const delta = now - lastFrameTime;
            (window as any).__frameTimings.push(delta)
            lastFrameTime = now
            callback(now)
          })
        }
      })

      await page.goto('/?egg=gradient')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(3000) // Let animation run
      
      const frameTimings = await page.evaluate(() => (window as any).__frameTimings || [])
      
      if (frameTimings.length > 10) {
        const avgFrameTime = frameTimings.reduce((a: number, b: number) => a + b, 0) / frameTimings.length
        const fps = 1000 / avgFrameTime
        
        console.log(`Average FPS: ${fps.toFixed(1)}`)
        console.log(`Average frame time: ${avgFrameTime.toFixed(2)}ms`)
        
        // Should maintain reasonable frame rate (>30fps, ideally >50fps)
        expect(fps).toBeGreaterThan(30)
        expect(avgFrameTime).toBeLessThan(33) // 33ms = 30fps
        
        // Check for frame drops
        const longFrames = frameTimings.filter((t: number) => t > 50) // >50ms frames
        const dropPercentage = (longFrames.length / frameTimings.length) * 100
        
        expect(dropPercentage).toBeLessThan(5) // Less than 5% dropped frames
        console.log(`Frame drops: ${dropPercentage.toFixed(1)}%`)
      }
    })

    test('performance under load', async ({ page }) => {
      await page.goto('/?egg=knowledge')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)
      
      // Simulate high CPU load
      await page.evaluate(() => {
        // Create some CPU intensive work
        const worker = () => {
          let result = 0
          for (let i = 0; i < 1000000; i++) {
            result += Math.random()
          }
          return result
        }
        
        // Run intensive work periodically
        const interval = setInterval(worker, 100)
        
        // Clean up after 5 seconds
        setTimeout(() => clearInterval(interval), 5000)
      })
      
      // Track performance during load
      await page.addInitScript(() => {
        (window as any).__performanceUnderLoad = []
        const startTime = Date.now()
        
        const measurePerformance = () => {
          const now = Date.now()
          ;(window as any).__performanceUnderLoad.push({
            timestamp: now - startTime,
            memory: 'memory' in performance ? (performance as any).memory?.usedJSHeapSize : 0
          })
        }
        
        setInterval(measurePerformance, 500)
      })
      
      await page.waitForTimeout(6000) // Let test run
      
      const performanceData = await page.evaluate(() => (window as any).__performanceUnderLoad)
      
      if (performanceData && performanceData.length > 0) {
        console.log(`Performance samples under load: ${performanceData.length}`)
        
        // Canvas should still be visible and functional
        const canvas = page.locator('canvas')
        await expect(canvas).toBeVisible()
        
        // Should be able to interact
        const canvasRect = await canvas.boundingBox()
        if (canvasRect) {
          await page.mouse.click(canvasRect.x + 100, canvasRect.y + 100)
          await page.waitForTimeout(200)
          await expect(canvas).toBeVisible()
        }
      }
    })

    test('handles device performance limitations', async ({ page }) => {
      // Mock low-end device constraints
      await page.addInitScript(() => {
        // Mock limited hardware concurrency
        Object.defineProperty(navigator, 'hardwareConcurrency', {
          value: 2,
          writable: false
        })
        
        // Mock limited memory
        if ('memory' in performance) {
          const originalMemory = (performance as any).memory
          Object.defineProperty(performance, 'memory', {
            value: {
              ...originalMemory,
              jsHeapSizeLimit: 1024 * 1024 * 1024 // 1GB limit
            }
          })
        }
      })

      await page.goto('/?egg=gradient')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)
      
      // Module should adapt to constraints
      const canvas = page.locator('canvas')
      await expect(canvas).toBeVisible()
      
      // Should still be performant
      const isResponsive = await page.evaluate(async () => {
        const startTime = Date.now()
        await new Promise(resolve => requestAnimationFrame(resolve))
        const endTime = Date.now()
        
        return (endTime - startTime) < 50 // Frame should render quickly
      })
      
      expect(isResponsive).toBe(true)
    })
  })

  test.describe('Network Performance', () => {
    test('performance on slow network', async ({ page, context }) => {
      // Simulate slow 3G connection
      await context.route('**/*', async route => {
        await new Promise(resolve => setTimeout(resolve, 200)) // 200ms delay
        await route.continue()
      })

      const startTime = Date.now()
      await page.goto('/')
      await page.waitForLoadState('networkidle', { timeout: 15000 })
      const loadTime = Date.now() - startTime
      
      console.log(`Load time on slow network: ${loadTime}ms`)
      
      // Should still load within reasonable time
      expect(loadTime).toBeLessThan(15000) // 15 seconds max
      
      // Page should be functional
      const body = page.locator('body')
      await expect(body).toBeVisible()
    })

    test('handles network failures gracefully', async ({ page, context }) => {
      // Let initial page load succeed
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Then block subsequent requests
      await context.route('**/bgModules/**', route => route.abort('failed'))
      
      // Try to load background module
      const controlButton = page.locator('button[aria-label*="background controls"]').first()
      if (await controlButton.isVisible()) {
        await controlButton.click()
        await page.locator('text=Knowledge Graph').click()
        await page.locator('text=Background Active').click()
        await page.keyboard.press('Escape')
        await page.waitForTimeout(2000)
      }
      
      // Page should still be functional despite module load failure
      const body = page.locator('body')
      await expect(body).toBeVisible()
      
      // Should be able to open control tray again
      if (await controlButton.isVisible()) {
        await controlButton.click()
        const dialog = page.locator('[role="dialog"]')
        await expect(dialog).toBeVisible()
        await page.keyboard.press('Escape')
      }
    })

    test('optimizes resource loading order', async ({ page }) => {
      const loadOrder: string[] = []
      
      page.on('response', response => {
        const _url = response.url()
        const type = response.headers()['content-type'] || ''
        
        if (type.includes('text/html')) {
          loadOrder.push('HTML')
        } else if (type.includes('text/css')) {
          loadOrder.push('CSS')
        } else if (type.includes('javascript')) {
          loadOrder.push('JS')
        } else if (type.includes('image/')) {
          loadOrder.push('Image')
        }
      })
      
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      console.log('Resource load order:', loadOrder.slice(0, 10))
      
      // HTML should load first
      if (loadOrder.length > 0) {
        expect(loadOrder[0]).toBe('HTML')
      }
      
      // CSS should load early (before most JS and images)
      const cssIndex = loadOrder.indexOf('CSS')
      const jsIndex = loadOrder.findIndex(item => item === 'JS')
      
      if (cssIndex !== -1 && jsIndex !== -1) {
        expect(cssIndex).toBeLessThanOrEqual(jsIndex + 1) // Allow some flexibility
      }
    })
  })

  test.describe('Lighthouse Metrics', () => {
    test('lighthouse-like performance audit', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Simulate lighthouse metrics collection
      const metrics = await page.evaluate(async () => {
        // First Contentful Paint
        const fcp = await new Promise<number>(resolve => {
          new PerformanceObserver(list => {
            const entries = list.getEntries()
            if (entries.length > 0) {
              resolve(entries[0].startTime)
            }
          }).observe({ entryTypes: ['paint'] })
          setTimeout(() => resolve(-1), 3000)
        })
        
        // DOM Content Loaded
        const dcl = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        
        return {
          fcp,
          dcl: dcl.domContentLoadedEventEnd - dcl.domContentLoadedEventStart,
          loadComplete: dcl.loadEventEnd - dcl.loadEventStart
        }
      })
      
      console.log('Lighthouse-like metrics:', metrics)
      
      if (metrics.fcp > 0) {
        expect(metrics.fcp).toBeLessThan(3000) // FCP under 3s
      }
      
      expect(metrics.dcl).toBeLessThan(2000) // DCL under 2s
      expect(metrics.loadComplete).toBeLessThan(1000) // Load event under 1s
    })
  })

  test.describe('Error Performance Impact', () => {
    test('performance impact of console errors', async ({ page }) => {
      const errors: string[] = []
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text())
        }
      })
      
      const startTime = Date.now()
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      const loadTime = Date.now() - startTime
      
      // Try to trigger some module loading
      const controlButton = page.locator('button[aria-label*="background controls"]').first()
      if (await controlButton.isVisible()) {
        await controlButton.click()
        await page.locator('text=Knowledge Graph').click()
        await page.locator('text=Background Active').click()
        await page.keyboard.press('Escape')
        await page.waitForTimeout(2000)
      }
      
      console.log(`Console errors detected: ${errors.length}`)
      if (errors.length > 0) {
        console.log('First few errors:', errors.slice(0, 3))
      }
      
      // Performance should not be severely impacted by errors
      expect(loadTime).toBeLessThan(8000)
      
      // Should have minimal console errors
      expect(errors.length).toBeLessThan(5) // Allow some errors but not many
    })
  })
})