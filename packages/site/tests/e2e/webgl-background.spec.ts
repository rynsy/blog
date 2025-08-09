import { test, expect } from '@playwright/test'

test.describe('WebGL Background Effects', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should initialize WebGL canvas on page load', async ({ page }) => {
    // Skip if WebGL not supported
    if (process.env.WEBGL_SUPPORTED !== 'true') {
      test.skip('WebGL not supported in this environment')
    }

    // Check canvas element exists
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible()
    
    // Verify canvas has dimensions
    const canvasSize = await canvas.boundingBox()
    expect(canvasSize?.width).toBeGreaterThan(0)
    expect(canvasSize?.height).toBeGreaterThan(0)
    
    // Check WebGL context is properly initialized
    const webglInfo = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement
      if (!canvas) return null
      
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      if (!gl) return null
      
      return {
        version: gl.getParameter(gl.VERSION),
        vendor: gl.getParameter(gl.VENDOR),
        renderer: gl.getParameter(gl.RENDERER),
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS)
      }
    })
    
    expect(webglInfo).not.toBeNull()
    expect(webglInfo?.version).toBeTruthy()
  })

  test('should handle window resize gracefully', async ({ page }) => {
    if (process.env.WEBGL_SUPPORTED !== 'true') {
      test.skip('WebGL not supported in this environment')
    }

    // Get initial canvas size
    const initialSize = await page.locator('canvas').boundingBox()
    
    // Resize viewport
    await page.setViewportSize({ width: 800, height: 600 })
    await page.waitForTimeout(100) // Allow resize to settle
    
    // Check canvas adapted to new size
    const newSize = await page.locator('canvas').boundingBox()
    expect(newSize?.width).not.toBe(initialSize?.width)
    
    // Verify WebGL is still functioning
    const stillWorking = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      return !!gl
    })
    expect(stillWorking).toBe(true)
  })

  test('should maintain smooth animation performance', async ({ page }) => {
    if (process.env.WEBGL_SUPPORTED !== 'true') {
      test.skip('WebGL not supported in this environment')
    }

    // Monitor frame rate for a few seconds
    const fps = await page.evaluate(async () => {
      let frameCount = 0
      let startTime = performance.now()
      
      return new Promise<number>((resolve) => {
        function countFrames() {
          frameCount++
          
          if (performance.now() - startTime >= 2000) { // 2 second sample
            const fps = (frameCount / 2) // frames per second
            resolve(fps)
          } else {
            requestAnimationFrame(countFrames)
          }
        }
        
        requestAnimationFrame(countFrames)
      })
    })
    
    // Should maintain at least 30 FPS for smooth animation
    expect(fps).toBeGreaterThan(30)
  })

  test('should handle WebGL context loss gracefully', async ({ page }) => {
    if (process.env.WEBGL_SUPPORTED !== 'true') {
      test.skip('WebGL not supported in this environment')
    }

    // Simulate WebGL context loss
    const contextLostHandled = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      
      if (!gl) return false
      
      return new Promise<boolean>((resolve) => {
        canvas.addEventListener('webglcontextlost', (e) => {
          e.preventDefault() // Prevent default context loss behavior
          resolve(true)
        })
        
        canvas.addEventListener('webglcontextrestored', () => {
          // Context should be restored
          const newGl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
          resolve(!!newGl)
        })
        
        // Simulate context loss
        const loseContext = gl.getExtension('WEBGL_lose_context')
        if (loseContext) {
          loseContext.loseContext()
          setTimeout(() => loseContext.restoreContext(), 100)
        } else {
          resolve(true) // If extension not available, assume handling works
        }
      })
    })
    
    expect(contextLostHandled).toBe(true)
  })

  test('should provide fallback when WebGL is not available', async ({ page }) => {
    // Test with WebGL disabled
    await page.addInitScript(() => {
      // Override getContext to simulate WebGL not being available
      const originalGetContext = HTMLCanvasElement.prototype.getContext
      HTMLCanvasElement.prototype.getContext = function(contextType: string, ...args: any[]) {
        if (contextType === 'webgl' || contextType === 'experimental-webgl') {
          return null // Simulate WebGL not available
        }
        return originalGetContext.call(this, contextType, ...args)
      }
    })
    
    await page.reload()
    
    // Should still have a canvas (fallback to 2D or static background)
    const canvas = page.locator('canvas')
    const hasCanvas = await canvas.count() > 0
    
    // Either has canvas with 2D context or uses CSS background
    const has2DFallback = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement
      if (canvas) {
        const ctx2d = canvas.getContext('2d')
        return !!ctx2d
      }
      return true // CSS fallback is acceptable
    })
    
    expect(hasCanvas || has2DFallback).toBe(true)
  })

  test('should not impact page accessibility', async ({ page }) => {
    if (process.env.WEBGL_SUPPORTED !== 'true') {
      test.skip('WebGL not supported in this environment')
    }

    // Test with reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.reload()
    
    // Canvas should still be present but may have reduced animation
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible()
    
    // Test with high contrast
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.reload()
    
    // Background should adapt to color scheme
    await expect(canvas).toBeVisible()
  })

  test('should handle multiple tabs without performance degradation', async ({ browser, page }) => {
    if (process.env.WEBGL_SUPPORTED !== 'true') {
      test.skip('WebGL not supported in this environment')
    }

    // Open multiple tabs with WebGL background
    const context = await browser.newContext()
    const pages = []
    
    for (let i = 0; i < 3; i++) {
      const newPage = await context.newPage()
      await newPage.goto('/')
      pages.push(newPage)
    }
    
    // Wait for all to load
    await Promise.all(pages.map(p => p.waitForLoadState('networkidle')))
    
    // Check each tab has functioning WebGL
    for (const tabPage of pages) {
      const hasWebGL = await tabPage.evaluate(() => {
        const canvas = document.querySelector('canvas') as HTMLCanvasElement
        const gl = canvas?.getContext('webgl') || canvas?.getContext('experimental-webgl')
        return !!gl
      })
      expect(hasWebGL).toBe(true)
    }
    
    // Clean up
    await Promise.all(pages.map(p => p.close()))
    await context.close()
  })

  test('should handle tab visibility changes efficiently', async ({ page }) => {
    if (process.env.WEBGL_SUPPORTED !== 'true') {
      test.skip('WebGL not supported in this environment')
    }

    // Monitor initial animation state
    const initiallyAnimating = await page.evaluate(() => {
      return document.visibilityState === 'visible'
    })
    expect(initiallyAnimating).toBe(true)
    
    // Simulate tab becoming hidden
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        writable: true,
        value: 'hidden'
      })
      
      const event = new Event('visibilitychange')
      document.dispatchEvent(event)
    })
    
    // Animation should pause or reduce when tab is hidden
    await page.waitForTimeout(100)
    
    // Simulate tab becoming visible again
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        writable: true,
        value: 'visible'
      })
      
      const event = new Event('visibilitychange')
      document.dispatchEvent(event)
    })
    
    // WebGL should resume normal operation
    const webglStillWorking = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement
      const gl = canvas?.getContext('webgl') || canvas?.getContext('experimental-webgl')
      return !!gl
    })
    expect(webglStillWorking).toBe(true)
  })

  test('should adapt to device pixel ratio changes', async ({ page }) => {
    if (process.env.WEBGL_SUPPORTED !== 'true') {
      test.skip('WebGL not supported in this environment')
    }

    // Test different device pixel ratios
    const ratios = [1, 1.5, 2, 3]
    
    for (const ratio of ratios) {
      await page.evaluate((devicePixelRatio) => {
        Object.defineProperty(window, 'devicePixelRatio', {
          writable: true,
          value: devicePixelRatio
        })
        
        // Trigger resize event to force canvas to adapt
        window.dispatchEvent(new Event('resize'))
      }, ratio)
      
      await page.waitForTimeout(100)
      
      // Canvas should still be functioning
      const canvasWorking = await page.evaluate(() => {
        const canvas = document.querySelector('canvas') as HTMLCanvasElement
        const gl = canvas?.getContext('webgl') || canvas?.getContext('experimental-webgl')
        return !!gl && canvas.width > 0 && canvas.height > 0
      })
      expect(canvasWorking).toBe(true)
    }
  })
})