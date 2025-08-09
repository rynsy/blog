import { test, expect, devices } from '@playwright/test'

// Define test configurations for different browsers and devices
const browserConfigs = [
  { name: 'Desktop Chrome', ...devices['Desktop Chrome'] },
  { name: 'Desktop Firefox', ...devices['Desktop Firefox'] },  
  { name: 'Desktop Safari', ...devices['Desktop Safari'] },
  { name: 'Mobile Chrome', ...devices['Pixel 5'] },
  { name: 'Mobile Safari', ...devices['iPhone 12'] },
  { name: 'Tablet iPad', ...devices['iPad Pro'] }
]

test.describe('Cross-Browser Compatibility Tests (C-01)', () => {
  
  browserConfigs.forEach(config => {
    test.describe(`${config.name} Tests`, () => {
      test.use(config)

      test('basic page functionality', async ({ page }) => {
        await page.goto('/')
        await page.waitForLoadState('networkidle')
        
        // Page should load successfully across all browsers
        const body = page.locator('body')
        await expect(body).toBeVisible()
        
        // Check for critical elements
        const main = page.locator('main, [role="main"], .main-content')
        if (await main.count() > 0) {
          await expect(main.first()).toBeVisible()
        }
        
        // Basic navigation should work
        const links = page.locator('a[href]')
        if (await links.count() > 0) {
          const firstLink = links.first()
          const href = await firstLink.getAttribute('href')
          expect(href).toBeTruthy()
        }
      })

      test('canvas rendering compatibility', async ({ page }) => {
        await page.goto('/?egg=gradient')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)
        
        const canvas = page.locator('canvas')
        if (await canvas.isVisible()) {
          // Canvas should be present and sized correctly
          const canvasRect = await canvas.boundingBox()
          const viewportSize = page.viewportSize()
          
          expect(canvasRect?.width).toBeCloseTo(viewportSize?.width || 1280, 20)
          expect(canvasRect?.height).toBeCloseTo(viewportSize?.height || 720, 20)
          
          // Test canvas context availability
          const hasContext = await page.evaluate(() => {
            const canvas = document.querySelector('canvas') as HTMLCanvasElement
            if (!canvas) return false
            
            // Test 2D context
            const ctx2d = canvas.getContext('2d')
            if (!ctx2d) return false
            
            // Test WebGL context (if supported)
            const webgl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
            
            return {
              has2d: !!ctx2d,
              hasWebGL: !!webgl,
              canvasWidth: canvas.width,
              canvasHeight: canvas.height
            }
          })
          
          expect(hasContext.has2d).toBe(true)
          console.log(`${config.name} Canvas support:`, hasContext)
        }
      })

      test('interactive module compatibility', async ({ page }) => {
        await page.goto('/?egg=knowledge')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(2000) // Allow D3 simulation to settle
        
        const canvas = page.locator('canvas')
        if (await canvas.isVisible()) {
          const canvasRect = await canvas.boundingBox()
          
          if (canvasRect) {
            // Test click interaction
            const centerX = canvasRect.x + canvasRect.width / 2
            const centerY = canvasRect.y + canvasRect.height / 2
            
            await page.mouse.click(centerX, centerY)
            await page.waitForTimeout(200)
            
            // Canvas should still be visible after interaction
            await expect(canvas).toBeVisible()
            
            // Test hover (desktop only)
            if (!config.name.includes('Mobile')) {
              await page.mouse.move(centerX + 50, centerY + 50)
              await page.waitForTimeout(100)
              
              // Check cursor changes (knowledge graph shows pointer on hover)
              const cursor = await page.evaluate(() => {
                const canvas = document.querySelector('canvas')
                return canvas ? window.getComputedStyle(canvas).cursor : 'default'
              })
              
              // Interactive canvas might change cursor
              console.log(`${config.name} Cursor on hover:`, cursor)
            }
            
            // Test zoom (wheel event)
            if (!config.name.includes('Mobile')) {
              await page.mouse.move(centerX, centerY)
              await page.mouse.wheel(0, -100) // Zoom in
              await page.waitForTimeout(200)
              await expect(canvas).toBeVisible()
              
              await page.mouse.wheel(0, 100) // Zoom out
              await page.waitForTimeout(200)
              await expect(canvas).toBeVisible()
            }
          }
        }
      })

      test('control tray functionality', async ({ page }) => {
        await page.goto('/')
        await page.waitForLoadState('networkidle')
        
        const controlButton = page.locator('button[aria-label*="background controls"]').first()
        
        if (await controlButton.isVisible()) {
          // Test button click
          await controlButton.click()
          await page.waitForTimeout(300)
          
          const dialog = page.locator('[role="dialog"]')
          await expect(dialog).toBeVisible()
          
          // Test dialog interactions
          const moduleSelect = dialog.locator('button').first()
          if (await moduleSelect.isVisible()) {
            await moduleSelect.click()
            await page.waitForTimeout(200)
            
            // Options should appear
            const options = page.locator('[role="option"], .option')
            if (await options.count() > 0) {
              // Select gradient module
              const gradientOption = page.locator('text=Animated Gradient').first()
              if (await gradientOption.isVisible()) {
                await gradientOption.click()
                await page.waitForTimeout(200)
              }
            }
          }
          
          // Test toggle switches
          const activeToggle = dialog.locator('text=Background Active').locator('..').locator('button')
          if (await activeToggle.isVisible()) {
            await activeToggle.click()
            await page.waitForTimeout(300)
          }
          
          // Close dialog
          await page.keyboard.press('Escape')
          await page.waitForTimeout(300)
          await expect(dialog).not.toBeVisible()
          
          // Canvas should appear
          const canvas = page.locator('canvas')
          if (await canvas.count() > 0) {
            await expect(canvas).toBeVisible()
          }
        }
      })

      test('keyboard navigation compatibility', async ({ page }) => {
        await page.goto('/')
        await page.waitForLoadState('networkidle')
        
        // Test tab navigation
        await page.keyboard.press('Tab')
        await page.waitForTimeout(100)
        
        const focused = page.locator(':focus')
        if (await focused.count() > 0) {
          const tagName = await focused.evaluate(el => el.tagName.toLowerCase())
          const role = await focused.getAttribute('role')
          
          // Should focus on interactive element
          const isInteractive = ['button', 'a', 'input', 'select', 'textarea'].includes(tagName) || 
                               ['button', 'link', 'menuitem'].includes(role || '')
          
          console.log(`${config.name} First tab focus:`, { tagName, role, isInteractive })
        }
        
        // Test escape key
        const controlButton = page.locator('button[aria-label*="background controls"]').first()
        if (await controlButton.isVisible()) {
          await controlButton.click()
          const dialog = page.locator('[role="dialog"]')
          
          if (await dialog.isVisible()) {
            await page.keyboard.press('Escape')
            await page.waitForTimeout(300)
            await expect(dialog).not.toBeVisible()
          }
        }
        
        // Test keyboard shortcuts (desktop only)
        if (!config.name.includes('Mobile')) {
          // Enable background first
          if (await controlButton.isVisible()) {
            await controlButton.click()
            await page.locator('text=Background Active').locator('..').locator('button').click()
            await page.keyboard.press('Escape')
            await page.waitForTimeout(300)
          }
          
          // Test Shift + ~ module cycling
          await page.keyboard.press('Shift+`')
          await page.waitForTimeout(1000)
          
          // Should cycle to a module
          const currentModule = await page.evaluate(() => localStorage.getItem('bg-module'))
          console.log(`${config.name} Module after Shift+~:`, currentModule)
        }
      })

      test('theme switching compatibility', async ({ page }) => {
        // Test light theme
        await page.addInitScript(() => {
          localStorage.setItem('theme', 'light')
          document.documentElement.classList.remove('dark')
        })
        
        await page.goto('/?egg=gradient')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(500)
        
        // Check light theme is active
        const isDarkMode = await page.evaluate(() => document.documentElement.classList.contains('dark'))
        expect(isDarkMode).toBe(false)
        
        // Test theme toggle (if available)
        const themeToggle = page.locator('button[aria-label*="theme"], button[title*="theme"]').first()
        if (await themeToggle.isVisible()) {
          await themeToggle.click()
          await page.waitForTimeout(300)
          
          // Theme should change
          const isNowDark = await page.evaluate(() => document.documentElement.classList.contains('dark'))
          expect(isNowDark).toBe(true)
          
          // Canvas should still be visible
          const canvas = page.locator('canvas')
          if (await canvas.count() > 0) {
            await expect(canvas).toBeVisible()
          }
        }
      })

      test('responsive behavior', async ({ page }) => {
        const viewportSize = page.viewportSize()
        const isMobile = config.name.includes('Mobile')
        const isTablet = config.name.includes('iPad')
        
        await page.goto('/')
        await page.waitForLoadState('networkidle')
        
        // Check layout adaptation
        const body = page.locator('body')
        const bodyRect = await body.boundingBox()
        
        if (bodyRect && viewportSize) {
          // Content should fit viewport
          expect(bodyRect.width).toBeLessThanOrEqual(viewportSize.width + 50) // Allow for scrollbar
        }
        
        // Test control button size on mobile
        const controlButton = page.locator('button[aria-label*="background controls"]').first()
        if (await controlButton.isVisible()) {
          const buttonRect = await controlButton.boundingBox()
          
          if (buttonRect && (isMobile || isTablet)) {
            // Touch targets should be large enough (44px minimum)
            const minDimension = Math.min(buttonRect.width, buttonRect.height)
            expect(minDimension).toBeGreaterThanOrEqual(44 - 5) // Allow tolerance
          }
        }
        
        // Test horizontal scrolling
        const hasHorizontalScroll = await page.evaluate(() => document.body.scrollWidth > window.innerWidth)
        expect(hasHorizontalScroll).toBe(false)
      })

      test('local storage compatibility', async ({ page }) => {
        await page.goto('/')
        await page.waitForLoadState('networkidle')
        
        // Test localStorage functionality
        const localStorageWorks = await page.evaluate(() => {
          try {
            const testKey = 'test-storage-' + Date.now()
            localStorage.setItem(testKey, 'test-value')
            const retrieved = localStorage.getItem(testKey)
            localStorage.removeItem(testKey)
            return retrieved === 'test-value'
          } catch {
            return false
          }
        })
        
        expect(localStorageWorks).toBe(true)
        console.log(`${config.name} localStorage support:`, localStorageWorks)
        
        // Test background module state persistence
        const controlButton = page.locator('button[aria-label*="background controls"]').first()
        if (await controlButton.isVisible()) {
          await controlButton.click()
          await page.locator('text=Animated Gradient').click()
          await page.locator('text=Background Active').click()
          await page.keyboard.press('Escape')
          await page.waitForTimeout(500)
          
          // Check state was saved
          const savedModule = await page.evaluate(() => localStorage.getItem('bg-module'))
          const savedActive = await page.evaluate(() => localStorage.getItem('bg-active'))
          
          expect(savedModule).toBe('gradient')
          expect(savedActive).toBe('true')
          
          // Reload and check state restoration
          await page.reload()
          await page.waitForLoadState('networkidle')
          await page.waitForTimeout(1000)
          
          // Canvas should be restored
          const canvas = page.locator('canvas')
          if (await canvas.count() > 0) {
            await expect(canvas).toBeVisible()
          }
        }
      })

      test('CSS features compatibility', async ({ page }) => {
        await page.goto('/')
        await page.waitForLoadState('networkidle')
        
        // Test CSS Grid support
        const hasGridSupport = await page.evaluate(() => {
          return CSS.supports('display', 'grid')
        })
        
        // Test Flexbox support  
        const hasFlexSupport = await page.evaluate(() => {
          return CSS.supports('display', 'flex')
        })
        
        // Test CSS Custom Properties (variables)
        const hasCustomPropsSupport = await page.evaluate(() => {
          return CSS.supports('--custom-prop', 'value')
        })
        
        console.log(`${config.name} CSS support:`, {
          grid: hasGridSupport,
          flex: hasFlexSupport, 
          customProps: hasCustomPropsSupport
        })
        
        // Modern browsers should support these features
        if (!config.name.includes('legacy')) {
          expect(hasGridSupport).toBe(true)
          expect(hasFlexSupport).toBe(true)
          expect(hasCustomPropsSupport).toBe(true)
        }
        
        // Check for backdrop-filter support (used in control tray)
        const hasBackdropFilter = await page.evaluate(() => {
          return CSS.supports('backdrop-filter', 'blur(10px)') || 
                 CSS.supports('-webkit-backdrop-filter', 'blur(10px)')
        })
        
        console.log(`${config.name} backdrop-filter support:`, hasBackdropFilter)
      })

      test('JavaScript API compatibility', async ({ page }) => {
        await page.goto('/')
        await page.waitForLoadState('networkidle')
        
        // Test required APIs
        const apiSupport = await page.evaluate(() => {
          return {
            requestAnimationFrame: typeof requestAnimationFrame === 'function',
            performance: typeof performance === 'object' && typeof performance.now === 'function',
            intersectionObserver: typeof IntersectionObserver === 'function',
            mutationObserver: typeof MutationObserver === 'function',
            matchMedia: typeof window.matchMedia === 'function',
            getComputedStyle: typeof window.getComputedStyle === 'function',
            addEventListener: typeof window.addEventListener === 'function',
            promiseSupport: typeof Promise === 'function',
            arrowFunctions: (() => { try { eval('() => {}'); return true } catch { return false } })(),
            asyncAwait: (() => { try { eval('async function test() { await Promise.resolve() }'); return true } catch { return false } })()
          }
        })
        
        console.log(`${config.name} JavaScript API support:`, apiSupport)
        
        // Critical APIs should be available
        expect(apiSupport.requestAnimationFrame).toBe(true)
        expect(apiSupport.performance).toBe(true)
        expect(apiSupport.matchMedia).toBe(true)
        expect(apiSupport.addEventListener).toBe(true)
        expect(apiSupport.promiseSupport).toBe(true)
      })

      test('error handling across browsers', async ({ page }) => {
        const errors: string[] = []
        const consoleMessages: string[] = []
        
        page.on('console', msg => {
          consoleMessages.push(`${msg.type()}: ${msg.text()}`)
          if (msg.type() === 'error') {
            errors.push(msg.text())
          }
        })
        
        page.on('pageerror', err => {
          errors.push(`Page error: ${err.message}`)
        })
        
        await page.goto('/')
        await page.waitForLoadState('networkidle')
        
        // Try to trigger some functionality
        const controlButton = page.locator('button[aria-label*="background controls"]').first()
        if (await controlButton.isVisible()) {
          await controlButton.click()
          await page.locator('text=Knowledge Graph').click()
          await page.locator('text=Background Active').click()
          await page.keyboard.press('Escape')
          await page.waitForTimeout(2000)
        }
        
        // Test invalid module (should handle gracefully)
        await page.goto('/?egg=nonexistent-module')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)
        
        console.log(`${config.name} Console messages:`, consoleMessages.slice(-5))
        console.log(`${config.name} Errors:`, errors.length)
        
        // Should have minimal errors
        expect(errors.length).toBeLessThan(3) // Allow some errors but not many
        
        // Page should still be functional
        const body = page.locator('body')
        await expect(body).toBeVisible()
      })
    })
  })

  test.describe('Feature Detection and Graceful Degradation', () => {
    test('handles missing WebGL gracefully', async ({ page }) => {
      // Mock WebGL as unavailable
      await page.addInitScript(() => {
        const originalGetContext = HTMLCanvasElement.prototype.getContext
        HTMLCanvasElement.prototype.getContext = function(contextType) {
          if (contextType === 'webgl' || contextType === 'experimental-webgl') {
            return null // Simulate WebGL not available
          }
          return originalGetContext.call(this, contextType as any)
        }
      })
      
      await page.goto('/?egg=knowledge')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)
      
      // Should fall back to 2D canvas
      const canvas = page.locator('canvas')
      if (await canvas.isVisible()) {
        const contextType = await page.evaluate(() => {
          const canvas = document.querySelector('canvas') as HTMLCanvasElement
          const ctx2d = canvas?.getContext('2d')
          const webgl = canvas?.getContext('webgl')
          
          return {
            has2d: !!ctx2d,
            hasWebgl: !!webgl
          }
        })
        
        expect(contextType.has2d).toBe(true)
        expect(contextType.hasWebgl).toBe(false)
        
        // Should still be functional
        await expect(canvas).toBeVisible()
      }
    })

    test('handles reduced motion preferences', async ({ page }) => {
      // Enable reduced motion
      await page.emulateMedia({ reducedMotion: 'reduce' })
      
      await page.goto('/?egg=gradient')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)
      
      // Should respect reduced motion
      const banner = page.locator('[role="banner"]:has-text("reduced motion")')
      if (await banner.count() > 0) {
        await expect(banner).toBeVisible()
      }
      
      // Animation should be paused or reduced
      const isPaused = await page.evaluate(() => localStorage.getItem('bg-paused'))
      console.log('Reduced motion paused state:', isPaused)
    })

    test('handles no-JavaScript scenario', async ({ page, context }) => {
      // Disable JavaScript
      await context.setJavaScriptEnabled(false)
      
      await page.goto('/')
      await page.waitForTimeout(3000) // Extra time without JS
      
      // Page should still show content
      const body = page.locator('body')
      await expect(body).toBeVisible()
      
      // Basic HTML content should be accessible
      const headings = page.locator('h1, h2, h3')
      if (await headings.count() > 0) {
        await expect(headings.first()).toBeVisible()
      }
      
      const links = page.locator('a[href]')
      if (await links.count() > 0) {
        const href = await links.first().getAttribute('href')
        expect(href).toBeTruthy()
      }
    })
  })

  test.describe('Performance Across Browsers', () => {
    test('consistent load times across browsers', async ({ page }) => {
      const startTime = Date.now()
      
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      const loadTime = Date.now() - startTime
      console.log(`Load time: ${loadTime}ms`)
      
      // Load time should be reasonable regardless of browser
      expect(loadTime).toBeLessThan(10000) // 10 seconds max
    })

    test('canvas performance across browsers', async ({ page }) => {
      await page.addInitScript(() => {
        (window as any).__frameTimings = []
        let frameCount = 0
        
        const originalRAF = requestAnimationFrame
        window.requestAnimationFrame = function(callback) {
          const startTime = performance.now()
          return originalRAF(() => {
            const endTime = performance.now()
            frameCount++
            if (frameCount <= 60) { // Track first 60 frames
              (window as any).__frameTimings.push(endTime - startTime)
            }
            callback(endTime)
          })
        }
      })

      await page.goto('/?egg=gradient')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000) // Let animation run
      
      const frameTimings = await page.evaluate(() => (window as any).__frameTimings || [])
      
      if (frameTimings.length > 10) {
        const avgFrameTime = frameTimings.reduce((a: number, b: number) => a + b, 0) / frameTimings.length
        
        console.log(`Average frame time: ${avgFrameTime.toFixed(2)}ms`)
        
        // Frame time should be reasonable (allow more tolerance for different browsers)
        expect(avgFrameTime).toBeLessThan(50) // 20fps minimum
      }
    })
  })
})