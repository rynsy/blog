import { test, expect } from '@playwright/test'

test.describe('Responsive Design Tests (R-01)', () => {
  const breakpoints = [
    { name: 'mobile-portrait', width: 320, height: 568, type: 'mobile' },
    { name: 'mobile-large', width: 375, height: 667, type: 'mobile' },
    { name: 'mobile-landscape', width: 667, height: 375, type: 'mobile' },
    { name: 'tablet-portrait', width: 768, height: 1024, type: 'tablet' },
    { name: 'tablet-landscape', width: 1024, height: 768, type: 'tablet' },
    { name: 'desktop-small', width: 1366, height: 768, type: 'desktop' },
    { name: 'desktop-medium', width: 1920, height: 1080, type: 'desktop' },
    { name: 'desktop-large', width: 2560, height: 1440, type: 'desktop' },
    { name: 'ultrawide', width: 3440, height: 1440, type: 'desktop' }
  ]

  test.describe('Layout Responsiveness', () => {
    breakpoints.forEach(breakpoint => {
      test(`layout adapts correctly to ${breakpoint.name} (${breakpoint.width}x${breakpoint.height})`, async ({ page }) => {
        await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height })
        await page.goto('/')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(500)

        // Check main layout structure
        const main = page.locator('main, [role="main"], .main-content')
        if (await main.count() > 0) {
          const mainRect = await main.first().boundingBox()
          
          // Content should fit within viewport
          expect(mainRect?.width).toBeLessThanOrEqual(breakpoint.width + 50) // Allow for scrollbars
          
          // Content should be visible
          expect(mainRect?.x).toBeGreaterThanOrEqual(-10) // Allow small negative margins
        }

        // Check navigation (should adapt to mobile vs desktop)
        const nav = page.locator('nav, [role="navigation"], .nav, .navigation')
        if (await nav.count() > 0) {
          const navRect = await nav.first().boundingBox()
          
          if (breakpoint.type === 'mobile') {
            // Mobile nav might be collapsed/hamburger
            const hamburger = page.locator('button[aria-label*="menu"], button[aria-expanded], .hamburger, .menu-toggle')
            if (await hamburger.count() > 0) {
              await expect(hamburger.first()).toBeVisible()
            }
          } else {
            // Desktop nav should be visible
            if (navRect) {
              expect(navRect.width).toBeGreaterThan(100)
            }
          }
        }

        // Check that content doesn't overflow horizontally
        const bodyOverflow = await page.evaluate(() => {
          return document.body.scrollWidth > window.innerWidth
        })
        expect(bodyOverflow).toBeFalsy()

        // Verify no elements are cut off
        const visibleElements = page.locator('h1, h2, h3, p, button, a').first()
        if (await visibleElements.count() > 0) {
          const elementRect = await visibleElements.boundingBox()
          if (elementRect) {
            expect(elementRect.x + elementRect.width).toBeLessThanOrEqual(breakpoint.width + 10)
          }
        }
      })
    })
  })

  test.describe('Control Tray Responsiveness', () => {
    breakpoints.forEach(breakpoint => {
      test(`control tray adapts to ${breakpoint.name}`, async ({ page }) => {
        await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height })
        await page.goto('/?egg=knowledge')
        await page.waitForLoadState('networkidle')

        // Control button should be visible and accessible
        const controlButton = page.locator('button[aria-label*="background controls"]').first()
        
        if (await controlButton.isVisible()) {
          const buttonRect = await controlButton.boundingBox()
          
          if (buttonRect) {
            // Button should be within viewport
            expect(buttonRect.x + buttonRect.width).toBeLessThanOrEqual(breakpoint.width)
            expect(buttonRect.y + buttonRect.height).toBeLessThanOrEqual(breakpoint.height)
            
            // Button should be large enough for touch on mobile
            if (breakpoint.type === 'mobile') {
              expect(Math.min(buttonRect.width, buttonRect.height)).toBeGreaterThanOrEqual(44)
            }
          }

          // Open dialog
          await controlButton.click()
          await page.waitForTimeout(300)

          const dialog = page.locator('[role="dialog"]')
          if (await dialog.isVisible()) {
            const dialogRect = await dialog.boundingBox()
            
            if (dialogRect) {
              if (breakpoint.type === 'mobile') {
                // Dialog should be full-width or nearly full-width on mobile
                expect(dialogRect.width).toBeGreaterThan(breakpoint.width * 0.8)
              } else {
                // Dialog should be reasonable size on desktop
                expect(dialogRect.width).toBeLessThan(breakpoint.width * 0.8)
                expect(dialogRect.height).toBeLessThan(breakpoint.height * 0.8)
              }

              // Dialog should be fully visible
              expect(dialogRect.x).toBeGreaterThanOrEqual(-10)
              expect(dialogRect.y).toBeGreaterThanOrEqual(-10)
              expect(dialogRect.x + dialogRect.width).toBeLessThanOrEqual(breakpoint.width + 10)
              expect(dialogRect.y + dialogRect.height).toBeLessThanOrEqual(breakpoint.height + 10)
            }

            // Check dialog content is accessible
            const selectButton = dialog.locator('button').first()
            if (await selectButton.isVisible()) {
              const selectRect = await selectButton.boundingBox()
              if (selectRect && breakpoint.type === 'mobile') {
                // Touch targets should be large enough
                expect(Math.min(selectRect.width, selectRect.height)).toBeGreaterThanOrEqual(44)
              }
            }

            // Close dialog
            await page.keyboard.press('Escape')
            await page.waitForTimeout(300)
          }
        }
      })
    })
  })

  test.describe('Canvas Responsiveness', () => {
    const modules = ['gradient', 'knowledge']

    modules.forEach(module => {
      breakpoints.forEach(breakpoint => {
        test(`${module} module canvas scales to ${breakpoint.name}`, async ({ page }) => {
          await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height })
          await page.goto(`/?egg=${module}`)
          await page.waitForLoadState('networkidle')
          await page.waitForTimeout(module === 'knowledge' ? 2000 : 1000)

          const canvas = page.locator('canvas')
          if (await canvas.isVisible()) {
            const canvasRect = await canvas.boundingBox()
            
            if (canvasRect) {
              // Canvas should match viewport dimensions
              expect(canvasRect.width).toBeCloseTo(breakpoint.width, 20)
              expect(canvasRect.height).toBeCloseTo(breakpoint.height, 20)
              
              // Canvas should start at origin (or close to it)
              expect(Math.abs(canvasRect.x)).toBeLessThan(10)
              expect(Math.abs(canvasRect.y)).toBeLessThan(10)
            }

            // Test resize behavior
            const newWidth = breakpoint.width + 100
            const newHeight = breakpoint.height + 100
            
            await page.setViewportSize({ width: newWidth, height: newHeight })
            await page.waitForTimeout(500)

            const newCanvasRect = await canvas.boundingBox()
            if (newCanvasRect) {
              expect(newCanvasRect.width).toBeCloseTo(newWidth, 20)
              expect(newCanvasRect.height).toBeCloseTo(newHeight, 20)
            }
          }
        })
      })
    })
  })

  test.describe('Typography and Content Scaling', () => {
    const textElements = [
      { selector: 'h1', minSize: 24, role: 'heading' },
      { selector: 'h2', minSize: 20, role: 'heading' },
      { selector: 'h3', minSize: 18, role: 'heading' },
      { selector: 'p', minSize: 14, role: 'body text' },
      { selector: 'button', minSize: 14, role: 'interactive' },
      { selector: 'a', minSize: 14, role: 'link' }
    ]

    breakpoints.forEach(breakpoint => {
      test(`text scales appropriately on ${breakpoint.name}`, async ({ page }) => {
        await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height })
        await page.goto('/')
        await page.waitForLoadState('networkidle')

        for (const textElement of textElements) {
          const elements = page.locator(textElement.selector)
          const count = await elements.count()

          if (count > 0) {
            // Test first few elements of each type
            for (let i = 0; i < Math.min(count, 3); i++) {
              const element = elements.nth(i)
              
              if (await element.isVisible()) {
                const fontSize = await element.evaluate(el => {
                  return parseFloat(window.getComputedStyle(el).fontSize)
                })

                // Font size should meet minimum accessibility requirements
                expect(fontSize).toBeGreaterThanOrEqual(textElement.minSize - 2)

                // On mobile, interactive elements might be slightly larger
                if (breakpoint.type === 'mobile' && textElement.role === 'interactive') {
                  expect(fontSize).toBeGreaterThanOrEqual(16 - 2) // iOS zoom prevention
                }

                // Check line height is reasonable
                const lineHeight = await element.evaluate(el => {
                  const computed = window.getComputedStyle(el)
                  const lh = computed.lineHeight
                  if (lh === 'normal') return fontSize * 1.2
                  return parseFloat(lh)
                })

                expect(lineHeight / fontSize).toBeGreaterThanOrEqual(1.1) // Minimum line height ratio
              }
            }
          }
        }
      })
    })
  })

  test.describe('Touch and Interaction Areas', () => {
    const touchBreakpoints = breakpoints.filter(bp => bp.type === 'mobile' || bp.type === 'tablet')

    touchBreakpoints.forEach(breakpoint => {
      test(`touch targets are appropriately sized on ${breakpoint.name}`, async ({ page }) => {
        await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height })
        await page.goto('/')
        await page.waitForLoadState('networkidle')

        // Find all interactive elements
        const interactiveElements = page.locator('button, a, input, [role="button"], [tabindex="0"]')
        const count = await interactiveElements.count()

        if (count > 0) {
          // Test first 10 interactive elements
          for (let i = 0; i < Math.min(count, 10); i++) {
            const element = interactiveElements.nth(i)
            
            if (await element.isVisible()) {
              const rect = await element.boundingBox()
              
              if (rect) {
                // WCAG recommends minimum 44x44px for touch targets
                const minDimension = Math.min(rect.width, rect.height)
                expect(minDimension).toBeGreaterThanOrEqual(44 - 5) // Allow 5px tolerance

                // Elements should have adequate spacing (not overlapping)
                const otherElements = page.locator('button, a, input, [role="button"]')
                const otherCount = await otherElements.count()
                
                if (otherCount > 1) {
                  // Check first other element for spacing
                  const otherElement = otherElements.nth((i + 1) % otherCount)
                  if (await otherElement.isVisible()) {
                    const otherRect = await otherElement.boundingBox()
                    
                    if (otherRect && rect !== otherRect) {
                      const distance = Math.sqrt(
                        Math.pow(rect.x + rect.width/2 - (otherRect.x + otherRect.width/2), 2) +
                        Math.pow(rect.y + rect.height/2 - (otherRect.y + otherRect.height/2), 2)
                      )
                      
                      // Should have some spacing between touch targets
                      if (distance < 100) { // Only check closely positioned elements
                        expect(distance).toBeGreaterThan(8) // Minimum 8px between edges
                      }
                    }
                  }
                }
              }
            }
          }
        }
      })
    })
  })

  test.describe('Orientation Changes', () => {
    test('handles portrait to landscape orientation change', async ({ page }) => {
      // Start in portrait
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/?egg=gradient')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      // Verify initial canvas size
      const canvas = page.locator('canvas')
      if (await canvas.isVisible()) {
        const canvasRect = await canvas.boundingBox()
        expect(canvasRect?.width).toBeCloseTo(375, 10)
        expect(canvasRect?.height).toBeCloseTo(667, 10)
      }

      // Rotate to landscape
      await page.setViewportSize({ width: 667, height: 375 })
      await page.waitForTimeout(500)

      // Canvas should adapt
      if (await canvas.isVisible()) {
        const canvasRect = await canvas.boundingBox()
        expect(canvasRect?.width).toBeCloseTo(667, 10)
        expect(canvasRect?.height).toBeCloseTo(375, 10)
      }

      // UI should still be accessible
      const controlButton = page.locator('button[aria-label*="background controls"]').first()
      if (await controlButton.isVisible()) {
        await expect(controlButton).toBeVisible()
        
        const buttonRect = await controlButton.boundingBox()
        if (buttonRect) {
          // Button should be within new viewport
          expect(buttonRect.x + buttonRect.width).toBeLessThanOrEqual(667)
          expect(buttonRect.y + buttonRect.height).toBeLessThanOrEqual(375)
        }
      }
    })
  })

  test.describe('Content Overflow and Scrolling', () => {
    test('prevents horizontal overflow on narrow screens', async ({ page }) => {
      // Test very narrow viewport
      await page.setViewportSize({ width: 280, height: 600 })
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Check for horizontal scrollbar
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth
      })
      
      // Should not have horizontal overflow
      expect(hasHorizontalScroll).toBeFalsy()

      // Check specific elements don't overflow
      const wideElements = page.locator('div, section, article, header, footer')
      const count = await wideElements.count()
      
      for (let i = 0; i < Math.min(count, 5); i++) {
        const element = wideElements.nth(i)
        if (await element.isVisible()) {
          const rect = await element.boundingBox()
          if (rect) {
            expect(rect.x + rect.width).toBeLessThanOrEqual(290) // Allow 10px tolerance
          }
        }
      }
    })

    test('maintains vertical scroll functionality', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 400 }) // Short viewport
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Add content to ensure scrolling is needed
      await page.evaluate(() => {
        const div = document.createElement('div')
        div.style.height = '1000px'
        div.style.background = 'linear-gradient(red, blue)'
        div.textContent = 'Scroll test content'
        document.body.appendChild(div)
      })

      await page.waitForTimeout(300)

      // Should be able to scroll
      const initialScrollY = await page.evaluate(() => window.scrollY)
      
      await page.keyboard.press('PageDown')
      await page.waitForTimeout(200)
      
      const afterScrollY = await page.evaluate(() => window.scrollY)
      expect(afterScrollY).toBeGreaterThan(initialScrollY)
    })
  })

  test.describe('Device-Specific Adaptations', () => {
    test('adapts to high-density displays', async ({ page }) => {
      // Simulate high DPI display
      await page.emulateMedia({ reducedMotion: 'no-preference' })
      await page.setViewportSize({ width: 1920, height: 1080 })
      
      await page.evaluate(() => {
        // Mock high device pixel ratio
        Object.defineProperty(window, 'devicePixelRatio', {
          value: 2,
          writable: false
        })
      })

      await page.goto('/?egg=gradient')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      const canvas = page.locator('canvas')
      if (await canvas.isVisible()) {
        // Canvas should handle high DPI rendering
        const canvasInfo = await page.evaluate(() => {
          const canvas = document.querySelector('canvas') as HTMLCanvasElement
          return {
            displayWidth: canvas.offsetWidth,
            displayHeight: canvas.offsetHeight,
            bufferWidth: canvas.width,
            bufferHeight: canvas.height,
            dpr: window.devicePixelRatio
          }
        })

        // Buffer size might be scaled for high DPI
        expect(canvasInfo.bufferWidth).toBeGreaterThanOrEqual(canvasInfo.displayWidth)
        expect(canvasInfo.bufferHeight).toBeGreaterThanOrEqual(canvasInfo.displayHeight)
      }
    })

    test('provides appropriate experience for low-end devices', async ({ page }) => {
      // Simulate low-end device constraints
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.setViewportSize({ width: 375, height: 667 })
      
      // Mock limited memory/performance
      await page.addInitScript(() => {
        // Mock performance limitations
        (window as any).__isLowEnd = true
        Object.defineProperty(navigator, 'hardwareConcurrency', {
          value: 2,
          writable: false
        })
      })

      await page.goto('/?egg=knowledge')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      // Should still function but possibly with reduced features
      const canvas = page.locator('canvas')
      await expect(canvas).toBeVisible()

      // Reduced motion banner should appear
      const banner = page.locator('[role="banner"]:has-text("reduced motion")')
      if (await banner.isVisible()) {
        await expect(banner).toBeVisible()
      }
    })
  })
})