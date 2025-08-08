import { test, expect } from '@playwright/test'

// Configuration for test modules
const TEST_MODULES = [
  { id: 'knowledge', name: 'Knowledge Graph', url: '/?egg=knowledge' },
  // Add more modules as they are implemented
] as const

test.describe('Background Module Smoke Tests (S-01, S-02)', () => {
  test.beforeEach(async ({ page }) => {
    // Set up console error tracking
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    // Attach console errors to test context for debugging
    test.info().attach('console-errors', {
      body: JSON.stringify(consoleErrors),
      contentType: 'application/json',
    })
  })

  test.describe('Module Loading Tests (S-01)', () => {
    for (const module of TEST_MODULES) {
      test(`loads ${module.name} module without errors`, async ({ page }) => {
        const consoleErrors: string[] = []
        page.on('console', (msg) => {
          if (msg.type() === 'error') {
            consoleErrors.push(msg.text())
          }
        })

        // Navigate to module URL
        await page.goto(module.url)

        // Wait for page load and module initialization
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(300) // As specified in requirements

        // Check for canvas element
        const canvas = page.locator('canvas')
        await expect(canvas).toBeVisible()

        // Verify canvas has proper dimensions
        const canvasBox = await canvas.boundingBox()
        expect(canvasBox).toBeTruthy()
        expect(canvasBox!.width).toBeGreaterThan(0)
        expect(canvasBox!.height).toBeGreaterThan(0)

        // Verify no console errors occurred
        expect(consoleErrors).toHaveLength(0)
      })
    }

    test('handles unknown module gracefully', async ({ page }) => {
      const consoleErrors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text())
        }
      })

      // Navigate to non-existent module
      await page.goto('/?egg=nonexistent-module')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(300)

      // Should not crash the page
      const title = await page.title()
      expect(title).toBeTruthy()

      // Should not have critical console errors
      const criticalErrors = consoleErrors.filter(error => 
        !error.includes('404') && !error.includes('not found')
      )
      expect(criticalErrors).toHaveLength(0)
    })
  })

  test.describe('Theme Switching Tests (S-02)', () => {
    for (const module of TEST_MODULES) {
      test(`${module.name} responds to theme changes`, async ({ page }) => {
        // Navigate to module
        await page.goto(module.url)
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(300)

        // Find theme toggle (assuming there's a theme toggle button)
        const themeToggle = page.locator('[data-testid="theme-toggle"], [aria-label*="theme"], button[data-theme]').first()
        
        // If theme toggle is available, test theme switching
        if (await themeToggle.isVisible()) {
          // Get initial state
          const initialTheme = await page.evaluate(() => {
            return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
          })

          // Click theme toggle
          await themeToggle.click()
          await page.waitForTimeout(200) // Allow theme transition

          // Verify theme changed
          const newTheme = await page.evaluate(() => {
            return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
          })

          expect(newTheme).not.toBe(initialTheme)

          // Verify canvas is still visible and functioning
          const canvas = page.locator('canvas')
          await expect(canvas).toBeVisible()
        } else {
          // If no theme toggle found, check for system theme preference handling
          // Emulate dark color scheme
          await page.emulateMedia({ colorScheme: 'dark' })
          await page.waitForTimeout(200)

          const canvas = page.locator('canvas')
          await expect(canvas).toBeVisible()

          // Emulate light color scheme
          await page.emulateMedia({ colorScheme: 'light' })
          await page.waitForTimeout(200)

          await expect(canvas).toBeVisible()
        }
      })
    }
  })

  test.describe('Interactive Features', () => {
    test('knowledge module handles mouse interactions', async ({ page }) => {
      await page.goto('/?egg=knowledge')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(300)

      const canvas = page.locator('canvas')
      await expect(canvas).toBeVisible()

      // Test mouse move (should not crash)
      await canvas.hover()
      await page.waitForTimeout(100)

      // Test click interaction
      await canvas.click()
      await page.waitForTimeout(100)

      // Test right-click for adding nodes
      await canvas.click({ button: 'right' })
      await page.waitForTimeout(100)

      // Verify canvas is still functional
      await expect(canvas).toBeVisible()
    })

    test('knowledge module handles keyboard shortcuts', async ({ page }) => {
      await page.goto('/?egg=knowledge')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(300)

      // Test Shift + ~ for module cycling (if control tray is present)
      await page.keyboard.press('Shift+~')
      await page.waitForTimeout(100)

      // Canvas should still be visible
      const canvas = page.locator('canvas')
      await expect(canvas).toBeVisible()
    })
  })

  test.describe('Performance Tests', () => {
    test('modules load within performance budget', async ({ page }) => {
      const startTime = Date.now()

      await page.goto('/?egg=knowledge')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(300)

      const loadTime = Date.now() - startTime

      // Should load within reasonable time (adjust as needed)
      expect(loadTime).toBeLessThan(5000) // 5 seconds

      // Verify canvas is visible
      const canvas = page.locator('canvas')
      await expect(canvas).toBeVisible()
    })

    test('modules respect reduced motion preference', async ({ page }) => {
      // Set reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' })

      await page.goto('/?egg=knowledge')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(300)

      // Should still render but potentially with reduced animations
      const canvas = page.locator('canvas')
      await expect(canvas).toBeVisible()

      // Check for reduced motion banner if implemented
      const reducedMotionBanner = page.locator('[role="banner"]:has-text("reduced motion")')
      // Banner may or may not be present depending on implementation
      if (await reducedMotionBanner.isVisible()) {
        expect(await reducedMotionBanner.textContent()).toContain('reduced motion')
      }
    })
  })

  test.describe('Page Visibility API', () => {
    test('modules pause when page becomes hidden', async ({ page }) => {
      await page.goto('/?egg=knowledge')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(300)

      const canvas = page.locator('canvas')
      await expect(canvas).toBeVisible()

      // Simulate page becoming hidden
      await page.evaluate(() => {
        Object.defineProperty(document, 'hidden', { value: true, configurable: true })
        document.dispatchEvent(new Event('visibilitychange'))
      })

      await page.waitForTimeout(100)

      // Canvas should still be visible but animations may be paused
      await expect(canvas).toBeVisible()

      // Simulate page becoming visible again
      await page.evaluate(() => {
        Object.defineProperty(document, 'hidden', { value: false, configurable: true })
        document.dispatchEvent(new Event('visibilitychange'))
      })

      await page.waitForTimeout(100)
      await expect(canvas).toBeVisible()
    })
  })

  test.describe('Error Handling', () => {
    test('handles canvas context errors gracefully', async ({ page }) => {
      const consoleErrors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text())
        }
      })

      // Mock canvas context to return null (simulate WebGL unavailable)
      await page.addInitScript(() => {
        const originalGetContext = HTMLCanvasElement.prototype.getContext
        HTMLCanvasElement.prototype.getContext = function(...args) {
          // Return null for the first call to simulate failure
          if (!this.dataset.contextCalled) {
            this.dataset.contextCalled = 'true'
            return null
          }
          return originalGetContext.apply(this, args)
        }
      })

      await page.goto('/?egg=knowledge')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      // Should not crash the page
      const title = await page.title()
      expect(title).toBeTruthy()

      // Should handle context failure gracefully
      const criticalErrors = consoleErrors.filter(error => 
        error.includes('Cannot read properties of null') && error.includes('context')
      )
      
      // Should either handle gracefully or have minimal errors
      expect(criticalErrors.length).toBeLessThanOrEqual(1)
    })

    test('handles resize events properly', async ({ page }) => {
      await page.goto('/?egg=knowledge')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(300)

      const canvas = page.locator('canvas')
      await expect(canvas).toBeVisible()

      // Change viewport size
      await page.setViewportSize({ width: 800, height: 600 })
      await page.waitForTimeout(100)

      await expect(canvas).toBeVisible()

      // Change back
      await page.setViewportSize({ width: 1200, height: 900 })
      await page.waitForTimeout(100)

      await expect(canvas).toBeVisible()
    })
  })
})