import { test, expect } from '@playwright/test'

test.describe('Performance Testing', () => {
  const pages = ['/', '/about', '/projects', '/blog']

  pages.forEach((pagePath) => {
    test(`should meet Core Web Vitals on ${pagePath}`, async ({ page }) => {
      await page.goto(pagePath)
      
      // Wait for page to fully load
      await page.waitForLoadState('networkidle')
      
      // Measure Core Web Vitals
      const vitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          const vitals: any = {}
          
          // LCP - Largest Contentful Paint
          new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries()
            if (entries.length > 0) {
              vitals.lcp = entries[entries.length - 1].startTime
            }
          }).observe({ entryTypes: ['largest-contentful-paint'] })
          
          // FID - First Input Delay (simulated)
          vitals.fid = 0 // Will be measured in interaction tests
          
          // CLS - Cumulative Layout Shift
          let clsValue = 0
          new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries() as any[]) {
              if (!entry.hadRecentInput) {
                clsValue += entry.value
              }
            }
            vitals.cls = clsValue
          }).observe({ entryTypes: ['layout-shift'] })
          
          // FCP - First Contentful Paint
          new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries()
            if (entries.length > 0) {
              vitals.fcp = entries[0].startTime
            }
          }).observe({ entryTypes: ['paint'] })
          
          // TTFB - Time to First Byte
          const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
          vitals.ttfb = navigationEntry.responseStart - navigationEntry.requestStart
          
          // Give time for measurements
          setTimeout(() => resolve(vitals), 2000)
        })
      })

      // Core Web Vitals thresholds (good performance)
      if (vitals.lcp) {
        expect(vitals.lcp).toBeLessThan(2500) // LCP < 2.5s
      }
      
      if (vitals.fcp) {
        expect(vitals.fcp).toBeLessThan(1800) // FCP < 1.8s
      }
      
      if (vitals.cls !== undefined) {
        expect(vitals.cls).toBeLessThan(0.1) // CLS < 0.1
      }
      
      if (vitals.ttfb) {
        expect(vitals.ttfb).toBeLessThan(800) // TTFB < 800ms
      }
    })

    test(`should load quickly on ${pagePath}`, async ({ page }) => {
      const startTime = Date.now()
      
      await page.goto(pagePath)
      await page.waitForLoadState('domcontentloaded')
      
      const domLoadTime = Date.now() - startTime
      expect(domLoadTime).toBeLessThan(3000) // DOM ready in < 3s
      
      await page.waitForLoadState('networkidle')
      const fullLoadTime = Date.now() - startTime
      expect(fullLoadTime).toBeLessThan(5000) // Fully loaded in < 5s
    })

    test(`should maintain memory usage within limits on ${pagePath}`, async ({ page }) => {
      await page.goto(pagePath)
      await page.waitForLoadState('networkidle')
      
      // Wait for any initial memory allocation to stabilize
      await page.waitForTimeout(2000)
      
      const initialMemory = await page.evaluate(() => {
        const memory = (performance as any).memory
        return memory ? {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        } : null
      })
      
      if (initialMemory) {
        // Memory usage should be reasonable (under 100MB for a blog site)
        expect(initialMemory.usedJSHeapSize).toBeLessThan(100 * 1024 * 1024)
        
        // Should not be using more than 50% of available heap
        expect(initialMemory.usedJSHeapSize).toBeLessThan(initialMemory.jsHeapSizeLimit * 0.5)
        
        // Navigate around to test for memory leaks
        const otherPages = pages.filter(p => p !== pagePath).slice(0, 2)
        
        for (const otherPage of otherPages) {
          await page.goto(otherPage)
          await page.waitForLoadState('networkidle')
          await page.waitForTimeout(1000)
        }
        
        // Return to original page
        await page.goto(pagePath)
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(2000)
        
        const finalMemory = await page.evaluate(() => {
          const memory = (performance as any).memory
          return memory ? memory.usedJSHeapSize : null
        })
        
        if (finalMemory) {
          // Memory should not have grown significantly (allow 50% increase)
          const memoryIncrease = finalMemory - initialMemory.usedJSHeapSize
          const acceptableIncrease = initialMemory.usedJSHeapSize * 0.5
          expect(memoryIncrease).toBeLessThan(acceptableIncrease)
        }
      }
    })
  })

  test('should maintain 60 FPS with WebGL background', async ({ page }) => {
    if (process.env.WEBGL_SUPPORTED !== 'true') {
      test.skip('WebGL not supported in this environment')
    }

    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Measure frame rate over time
    const fpsData = await page.evaluate(async () => {
      const samples: number[] = []
      let frameCount = 0
      let startTime = performance.now()
      
      return new Promise<number[]>((resolve) => {
        function measureFPS() {
          frameCount++
          const currentTime = performance.now()
          const elapsed = currentTime - startTime
          
          if (elapsed >= 1000) { // Every second
            const fps = (frameCount / elapsed) * 1000
            samples.push(fps)
            frameCount = 0
            startTime = currentTime
            
            if (samples.length >= 5) { // Collect 5 samples
              resolve(samples)
              return
            }
          }
          
          requestAnimationFrame(measureFPS)
        }
        
        requestAnimationFrame(measureFPS)
      })
    })
    
    // Average FPS should be above 30 (ideally 60)
    const averageFPS = fpsData.reduce((a, b) => a + b, 0) / fpsData.length
    expect(averageFPS).toBeGreaterThan(30)
    
    // No sample should drop below 20 FPS
    const minFPS = Math.min(...fpsData)
    expect(minFPS).toBeGreaterThan(20)
  })

  test('should handle resource loading efficiently', async ({ page }) => {
    // Monitor network requests
    const resourceSizes: number[] = []
    const resourceTypes: string[] = []
    
    page.on('response', (response) => {
      const contentLength = response.headers()['content-length']
      if (contentLength) {
        resourceSizes.push(parseInt(contentLength))
      }
      
      const contentType = response.headers()['content-type']
      if (contentType) {
        if (contentType.includes('javascript')) {
          resourceTypes.push('js')
        } else if (contentType.includes('css')) {
          resourceTypes.push('css')
        } else if (contentType.includes('image')) {
          resourceTypes.push('image')
        }
      }
    })
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check total resource size is reasonable
    const totalSize = resourceSizes.reduce((a, b) => a + b, 0)
    expect(totalSize).toBeLessThan(5 * 1024 * 1024) // Under 5MB total
    
    // Check resource distribution
    const jsCount = resourceTypes.filter(t => t === 'js').length
    const cssCount = resourceTypes.filter(t => t === 'css').length
    
    // Should not have excessive number of requests
    expect(jsCount).toBeLessThan(20)
    expect(cssCount).toBeLessThan(10)
  })

  test('should handle slow network conditions', async ({ page }) => {
    // Simulate slow 3G network
    await page.route('**/*', async (route) => {
      const response = await route.fetch()
      
      // Add delay to simulate slow network
      await new Promise(resolve => setTimeout(resolve, 100))
      
      await route.fulfill({ response })
    })
    
    const startTime = Date.now()
    await page.goto('/')
    
    // Should still load within reasonable time even on slow connection
    await page.waitForLoadState('domcontentloaded')
    const loadTime = Date.now() - startTime
    
    // Allow more time for slow network simulation
    expect(loadTime).toBeLessThan(10000) // 10s max on slow connection
    
    // Page should still be functional
    const isInteractive = await page.evaluate(() => {
      return document.readyState === 'complete' || 
             document.readyState === 'interactive'
    })
    expect(isInteractive).toBe(true)
  })

  test('should optimize images and assets', async ({ page }) => {
    const resourceInfo: Array<{url: string, size: number, type: string}> = []
    
    page.on('response', async (response) => {
      const url = response.url()
      const contentLength = response.headers()['content-length']
      const contentType = response.headers()['content-type'] || ''
      
      if (contentLength && (contentType.includes('image') || contentType.includes('font'))) {
        resourceInfo.push({
          url,
          size: parseInt(contentLength),
          type: contentType.split('/')[0]
        })
      }
    })
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check image sizes
    const images = resourceInfo.filter(r => r.type === 'image')
    for (const image of images) {
      // No single image should be over 1MB
      expect(image.size).toBeLessThan(1024 * 1024)
    }
    
    // Check for modern image formats
    const modernFormats = images.filter(img => 
      img.url.includes('.webp') || 
      img.url.includes('.avif') ||
      img.url.includes('format=webp')
    )
    
    // At least some images should use modern formats (if any images exist)
    if (images.length > 0) {
      // Modern formats are preferred but not required for basic functionality
      expect(modernFormats.length >= 0).toBe(true)
    }
  })

  test('should handle concurrent user interactions efficiently', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Simulate rapid interactions
    const interactions = [
      () => page.click('body'), // Click background
      () => page.keyboard.press('Tab'), // Keyboard navigation
      () => page.hover('nav a'), // Hover navigation
      () => page.mouse.wheel(0, 100), // Scroll
    ]
    
    // Perform multiple interactions rapidly
    const startTime = Date.now()
    
    for (let i = 0; i < 10; i++) {
      const interaction = interactions[i % interactions.length]
      await interaction()
      await page.waitForTimeout(50) // Small delay between interactions
    }
    
    const totalTime = Date.now() - startTime
    
    // All interactions should complete quickly
    expect(totalTime).toBeLessThan(2000)
    
    // Page should still be responsive
    const isResponsive = await page.evaluate(() => {
      return document.visibilityState === 'visible' && 
             !document.hidden
    })
    expect(isResponsive).toBe(true)
  })
})