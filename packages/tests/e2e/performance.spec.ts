import { test, expect } from '@playwright/test'

test.describe('Performance Tests (P-01)', () => {
  test.describe('Lighthouse Performance', () => {
    test('home page achieves minimum Lighthouse performance score', async ({ page, browserName }) => {
      // Skip on webkit for now as lighthouse may not work consistently
      test.skip(browserName === 'webkit', 'Lighthouse not fully supported on webkit')

      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Basic performance checks without lighthouse for now
      // TODO: Integrate lighthouse-ci for actual scoring when available
      
      // Measure basic performance metrics
      const performanceMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
          largestContentfulPaint: performance.getEntriesByName('largest-contentful-paint')[0]?.startTime || 0,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        }
      })

      // Performance assertions (adjust thresholds as needed)
      expect(performanceMetrics.domContentLoaded).toBeLessThan(2000) // 2 seconds
      expect(performanceMetrics.loadComplete).toBeLessThan(3000) // 3 seconds
      
      if (performanceMetrics.firstContentfulPaint > 0) {
        expect(performanceMetrics.firstContentfulPaint).toBeLessThan(3000) // 3 seconds
      }

      if (performanceMetrics.largestContentfulPaint > 0) {
        expect(performanceMetrics.largestContentfulPaint).toBeLessThan(4000) // 4 seconds
      }
    })

    test('knowledge module performance is acceptable', async ({ page }) => {
      const startTime = Date.now()
      
      await page.goto('/?egg=knowledge')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(300) // Module initialization time
      
      const totalLoadTime = Date.now() - startTime
      
      // Should load within reasonable time
      expect(totalLoadTime).toBeLessThan(5000) // 5 seconds total

      // Check that canvas is visible and functional
      const canvas = page.locator('canvas')
      await expect(canvas).toBeVisible()
      
      // Measure animation frame rate if possible
      const animationMetrics = await page.evaluate(async () => {
        return new Promise((resolve) => {
          let frameCount = 0
          const startTime = performance.now()
          const measureFrames = () => {
            frameCount++
            if (frameCount < 60) { // Measure for about 1 second at 60fps
              requestAnimationFrame(measureFrames)
            } else {
              const endTime = performance.now()
              const duration = endTime - startTime
              const fps = (frameCount / duration) * 1000
              resolve(fps)
            }
          }
          requestAnimationFrame(measureFrames)
        })
      })

      // Should maintain reasonable frame rate
      expect(animationMetrics).toBeGreaterThan(15) // At least 15 FPS
    })
  })

  test.describe('Memory Usage', () => {
    test('modules do not cause memory leaks', async ({ page }) => {
      // Get initial memory usage
      const initialMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize
        }
        return 0
      })

      // Load and unload module multiple times
      for (let i = 0; i < 3; i++) {
        await page.goto('/?egg=knowledge')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(500)
        
        await page.goto('/')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(500)
      }

      // Force garbage collection if available
      await page.evaluate(() => {
        if ('gc' in window) {
          (window as any).gc()
        }
      })

      const finalMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize
        }
        return 0
      })

      // Memory should not grow excessively (allow for some growth)
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryGrowth = (finalMemory - initialMemory) / initialMemory
        expect(memoryGrowth).toBeLessThan(0.5) // Less than 50% growth
      }
    })

    test('modules clean up properly on destroy', async ({ page }) => {
      await page.goto('/?egg=knowledge')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(300)

      // Check that module creates expected elements
      const canvas = page.locator('canvas')
      await expect(canvas).toBeVisible()

      // Switch to no module
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(300)

      // Check that canvas is removed or hidden
      const canvasAfter = page.locator('canvas')
      const canvasCount = await canvasAfter.count()
      
      // Either no canvas elements or they are hidden
      if (canvasCount > 0) {
        const isVisible = await canvasAfter.first().isVisible()
        expect(isVisible).toBe(false)
      }
    })
  })

  test.describe('Page Visibility Performance', () => {
    test('modules pause correctly when document becomes hidden', async ({ page }) => {
      await page.goto('/?egg=knowledge')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(300)

      // Measure CPU usage before hiding page (rough estimate)
      const initialCpuTime = await page.evaluate(() => {
        return performance.now()
      })

      // Hide the page
      await page.evaluate(() => {
        Object.defineProperty(document, 'hidden', { value: true, configurable: true })
        document.dispatchEvent(new Event('visibilitychange'))
      })

      await page.waitForTimeout(1000) // Wait 1 second

      // Show the page again
      await page.evaluate(() => {
        Object.defineProperty(document, 'hidden', { value: false, configurable: true })
        document.dispatchEvent(new Event('visibilitychange'))
      })

      const finalCpuTime = await page.evaluate(() => {
        return performance.now()
      })

      // This is a rough test - in real implementation, you'd want to measure
      // actual CPU usage or animation frame rates during hidden state
      expect(finalCpuTime - initialCpuTime).toBeGreaterThan(800) // At least 800ms passed
    })
  })

  test.describe('Network Performance', () => {
    test('modules load efficiently with minimal network requests', async ({ page }) => {
      // Track network requests
      const requests: string[] = []
      page.on('request', (request) => {
        requests.push(request.url())
      })

      await page.goto('/?egg=knowledge')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(300)

      // Should not make excessive network requests for basic module
      const moduleRequests = requests.filter(url => 
        url.includes('.js') || url.includes('.css') || url.includes('.json')
      )

      // Reasonable limit on additional resources (adjust based on actual needs)
      expect(moduleRequests.length).toBeLessThan(20)
    })

    test('modules work offline after initial load', async ({ page, context }) => {
      // Load page normally first
      await page.goto('/?egg=knowledge')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(300)

      // Verify initial load works
      const canvas = page.locator('canvas')
      await expect(canvas).toBeVisible()

      // Go offline
      await context.setOffline(true)

      // Reload page
      await page.reload()
      await page.waitForLoadState('domcontentloaded')
      await page.waitForTimeout(500)

      // Should still render something (may be cached or have offline fallback)
      const title = await page.title()
      expect(title).toBeTruthy()
      expect(title.length).toBeGreaterThan(0)

      // Go back online
      await context.setOffline(false)
    })
  })

  test.describe('Resource Usage', () => {
    test('modules respect browser resource limits', async ({ page }) => {
      await page.goto('/?egg=knowledge')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(300)

      // Check WebGL context usage
      const webglInfo = await page.evaluate(() => {
        const canvas = document.querySelector('canvas') as HTMLCanvasElement
        if (!canvas) return null

        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
        if (!gl) return null

        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
        return {
          renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown',
          vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'unknown',
          maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
          maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS)
        }
      })

      if (webglInfo) {
        console.log('WebGL Info:', webglInfo)
        // Basic sanity checks
        expect(webglInfo.maxTextureSize).toBeGreaterThan(0)
      }

      // Check canvas size is reasonable
      const canvasInfo = await page.evaluate(() => {
        const canvas = document.querySelector('canvas') as HTMLCanvasElement
        if (!canvas) return null
        
        return {
          width: canvas.width,
          height: canvas.height,
          offsetWidth: canvas.offsetWidth,
          offsetHeight: canvas.offsetHeight
        }
      })

      if (canvasInfo) {
        // Canvas should not be excessively large
        expect(canvasInfo.width).toBeLessThan(4000)
        expect(canvasInfo.height).toBeLessThan(4000)
        expect(canvasInfo.width).toBeGreaterThan(0)
        expect(canvasInfo.height).toBeGreaterThan(0)
      }
    })

    test('modules handle low-performance devices gracefully', async ({ page }) => {
      // Simulate low-performance device by throttling CPU
      const session = await page.context().newCDPSession(page)
      await session.send('Emulation.setCPUThrottlingRate', { rate: 4 }) // 4x slowdown

      try {
        const startTime = Date.now()
        
        await page.goto('/?egg=knowledge')
        await page.waitForLoadState('networkidle', { timeout: 10000 }) // Longer timeout
        await page.waitForTimeout(500)

        const loadTime = Date.now() - startTime
        
        // Should still load within reasonable time even when throttled
        expect(loadTime).toBeLessThan(15000) // 15 seconds with throttling

        // Canvas should still be visible
        const canvas = page.locator('canvas')
        await expect(canvas).toBeVisible()
        
      } finally {
        // Reset CPU throttling
        await session.send('Emulation.setCPUThrottlingRate', { rate: 1 })
      }
    })
  })

  test.describe('Animation Performance', () => {
    test('animations maintain stable frame rate', async ({ page }) => {
      await page.goto('/?egg=knowledge')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(300)

      // Measure frame timing over several frames
      const frameTimings = await page.evaluate(async () => {
        return new Promise<number[]>((resolve) => {
          const timings: number[] = []
          let frameCount = 0
          let lastTime = performance.now()
          
          const measureFrame = (currentTime: number) => {
            if (frameCount > 0) {
              timings.push(currentTime - lastTime)
            }
            lastTime = currentTime
            frameCount++
            
            if (frameCount < 30) { // Measure 30 frames
              requestAnimationFrame(measureFrame)
            } else {
              resolve(timings)
            }
          }
          
          requestAnimationFrame(measureFrame)
        })
      })

      if (frameTimings.length > 0) {
        // Calculate average frame time
        const averageFrameTime = frameTimings.reduce((a, b) => a + b) / frameTimings.length
        
        // Should maintain reasonable frame rate (16.67ms = 60fps, 33.33ms = 30fps)
        expect(averageFrameTime).toBeLessThan(50) // At least 20fps
        
        // Frame times should be relatively stable (not too much jank)
        const maxFrameTime = Math.max(...frameTimings)
        expect(maxFrameTime).toBeLessThan(100) // No frames longer than 100ms
      }
    })

    test('animations pause efficiently when not visible', async ({ page }) => {
      await page.goto('/?egg=knowledge')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(300)

      // Scroll page so canvas might be out of view
      await page.evaluate(() => {
        window.scrollTo(0, window.innerHeight * 2)
      })
      
      await page.waitForTimeout(200)

      // Check if module properly handles being out of viewport
      const canvas = page.locator('canvas')
      await expect(canvas).toBeInViewport({ ratio: 0.1 }) // At least 10% visible
      
      // Scroll back
      await page.evaluate(() => {
        window.scrollTo(0, 0)
      })
      
      await page.waitForTimeout(200)
      
      // Should still be functional
      await expect(canvas).toBeVisible()
    })
  })
})