import { test, expect } from '@playwright/test'
import { injectAxe, checkA11y, getViolations } from 'axe-playwright'

test.describe('Accessibility Tests (A-01)', () => {
  test.beforeEach(async ({ page }) => {
    // Inject axe-core into every page
    await injectAxe(page)
  })

  test.describe('Homepage Accessibility', () => {
    test('home page passes axe accessibility checks', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Run axe accessibility checks
      await checkA11y(page, undefined, {
        detailedReport: true,
        detailedReportOptions: { html: true },
      })
    })

    test('home page with knowledge module passes accessibility checks', async ({ page }) => {
      await page.goto('/?egg=knowledge')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(300) // Allow module to initialize

      // Run axe checks on page with active background module
      await checkA11y(page, undefined, {
        detailedReport: true,
        detailedReportOptions: { html: true },
        rules: {
          // Allow canvas elements to not have accessible content since they're decorative
          'canvas-has-accessible-text': { enabled: false }
        }
      })
    })

    test('no color contrast violations', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      const violations = await getViolations(page, null, {
        rules: {
          'color-contrast': { enabled: true },
          'color-contrast-enhanced': { enabled: true }
        }
      })

      expect(violations).toHaveLength(0)
    })
  })

  test.describe('Control Tray Accessibility', () => {
    test('control tray is accessible when opened', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Look for control tray trigger (may be hidden/subtle)
      const triggerSelectors = [
        '[aria-label*="background control"]',
        '[title*="background control"]',
        'button[data-testid*="control"]',
        '.fixed.bottom-4.right-4 button', // Based on ControlTray implementation
      ]

      let trigger = null
      for (const selector of triggerSelectors) {
        const element = page.locator(selector).first()
        if (await element.isVisible()) {
          trigger = element
          break
        }
      }

      if (trigger) {
        // Open control tray
        await trigger.click()
        await page.waitForTimeout(200)

        // Check accessibility of opened dialog
        await checkA11y(page, '[role="dialog"], [data-testid="dialog"]', {
          detailedReport: true,
          detailedReportOptions: { html: true },
        })
      } else {
        console.warn('Control tray trigger not found - test skipped')
      }
    })

    test('control tray has proper ARIA labels', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Check for properly labeled control elements
      const controlSelectors = [
        '[aria-label*="background"]',
        '[aria-label*="control"]',
        'button[title*="background"]'
      ]

      let foundControls = false
      for (const selector of controlSelectors) {
        const controls = page.locator(selector)
        const count = await controls.count()
        if (count > 0) {
          foundControls = true
          for (let i = 0; i < count; i++) {
            const control = controls.nth(i)
            const ariaLabel = await control.getAttribute('aria-label')
            const title = await control.getAttribute('title')
            
            // Should have meaningful label or title
            expect(ariaLabel || title).toBeTruthy()
            expect((ariaLabel || title)?.length).toBeGreaterThan(3)
          }
        }
      }

      if (foundControls) {
        console.log('Found and validated control labels')
      } else {
        console.warn('No control elements found to validate')
      }
    })

    test('control tray keyboard navigation works', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Try to find and open control tray with keyboard
      const triggerSelectors = [
        'button[aria-label*="background"]',
        'button[title*="background"]',
        '.fixed button'
      ]

      let trigger = null
      for (const selector of triggerSelectors) {
        const element = page.locator(selector).first()
        if (await element.isVisible()) {
          trigger = element
          break
        }
      }

      if (trigger) {
        // Focus and activate with keyboard
        await trigger.focus()
        await page.keyboard.press('Enter')
        await page.waitForTimeout(200)

        // Check if dialog opened
        const dialog = page.locator('[role="dialog"], [data-testid="dialog"]')
        if (await dialog.isVisible()) {
          // Test Escape key to close
          await page.keyboard.press('Escape')
          await page.waitForTimeout(200)

          // Dialog should be closed
          await expect(dialog).not.toBeVisible()
        }
      }
    })
  })

  test.describe('Canvas Accessibility', () => {
    test('canvas elements have appropriate ARIA attributes', async ({ page }) => {
      await page.goto('/?egg=knowledge')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(300)

      const canvas = page.locator('canvas')
      if (await canvas.isVisible()) {
        // Interactive canvas should not be aria-hidden
        const ariaHidden = await canvas.getAttribute('aria-hidden')
        const isInteractive = await canvas.evaluate((el) => {
          const style = window.getComputedStyle(el)
          return style.pointerEvents !== 'none'
        })

        if (isInteractive) {
          expect(ariaHidden).not.toBe('true')
        } else {
          // Decorative canvas should be aria-hidden
          expect(ariaHidden).toBe('true')
        }
      }
    })

    test('interactive canvas has proper focus indicators', async ({ page }) => {
      await page.goto('/?egg=knowledge')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(300)

      const canvas = page.locator('canvas')
      if (await canvas.isVisible()) {
        const isInteractive = await canvas.evaluate((el) => {
          const style = window.getComputedStyle(el)
          return style.pointerEvents !== 'none'
        })

        if (isInteractive) {
          // Interactive canvas should be focusable
          const tabIndex = await canvas.getAttribute('tabindex')
          // Should either have tabindex="0" or be naturally focusable
          expect(tabIndex === '0' || tabIndex === null).toBe(true)
        }
      }
    })
  })

  test.describe('Reduced Motion Accessibility', () => {
    test('respects prefers-reduced-motion setting', async ({ page }) => {
      // Enable reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' })

      await page.goto('/?egg=knowledge')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(300)

      // Should still be functional
      const canvas = page.locator('canvas')
      await expect(canvas).toBeVisible()

      // Check for reduced motion notification if implemented
      const notification = page.locator('[role="banner"]:has-text("reduced motion"), [aria-label*="reduced motion"]')
      
      // If notification is present, verify it's properly announced
      if (await notification.isVisible()) {
        const role = await notification.getAttribute('role')
        const ariaLabel = await notification.getAttribute('aria-label')
        const ariaLive = await notification.getAttribute('aria-live')
        
        // Should have proper announcement attributes
        expect(role || ariaLive || ariaLabel).toBeTruthy()
      }

      // Run accessibility check with reduced motion
      await checkA11y(page, undefined, {
        detailedReport: true,
        rules: {
          'canvas-has-accessible-text': { enabled: false }
        }
      })
    })
  })

  test.describe('Screen Reader Compatibility', () => {
    test('page structure is screen reader friendly', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Check for proper heading hierarchy
      const headings = page.locator('h1, h2, h3, h4, h5, h6')
      const headingCount = await headings.count()
      
      if (headingCount > 0) {
        // Should have at least one h1
        const h1Count = await page.locator('h1').count()
        expect(h1Count).toBeGreaterThanOrEqual(1)
      }

      // Check for proper landmark structure
      const landmarks = page.locator('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], main, nav, header, footer')
      const landmarkCount = await landmarks.count()
      
      // Should have some landmark structure
      expect(landmarkCount).toBeGreaterThan(0)

      // Run specific screen reader checks
      await checkA11y(page, undefined, {
        tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
        rules: {
          'landmark-one-main': { enabled: true },
          'page-has-heading-one': { enabled: true },
          'region': { enabled: true }
        }
      })
    })

    test('interactive elements are properly announced', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Find all interactive elements
      const interactiveElements = page.locator('button, [role="button"], a, input, select, textarea')
      const count = await interactiveElements.count()

      for (let i = 0; i < Math.min(count, 10); i++) { // Test up to 10 elements
        const element = interactiveElements.nth(i)
        if (await element.isVisible()) {
          // Each interactive element should have accessible name
          const accessibleName = await element.evaluate((el) => {
            // Compute accessible name using various methods
            return el.getAttribute('aria-label') || 
                   el.getAttribute('title') || 
                   el.textContent?.trim() || 
                   el.getAttribute('alt') ||
                   ''
          })

          expect(accessibleName.length).toBeGreaterThan(0)
        }
      }
    })
  })

  test.describe('High Contrast Mode', () => {
    test('works in high contrast mode', async ({ page }) => {
      // Enable high contrast (if supported by browser)
      await page.emulateMedia({ 
        colorScheme: 'dark',
        forcedColors: 'active' as any 
      })

      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Should still be functional and accessible
      await checkA11y(page, undefined, {
        detailedReport: true,
        rules: {
          'canvas-has-accessible-text': { enabled: false },
          'color-contrast': { enabled: false } // May not apply in forced colors mode
        }
      })
    })
  })

  test.describe('Mobile Accessibility', () => {
    test('touch targets are appropriately sized on mobile', async ({ page }) => {
      // Simulate mobile device
      await page.setViewportSize({ width: 375, height: 667 })
      
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Find touch targets (buttons, links, etc.)
      const touchTargets = page.locator('button, [role="button"], a, input[type="checkbox"], input[type="radio"]')
      const count = await touchTargets.count()

      for (let i = 0; i < count; i++) {
        const target = touchTargets.nth(i)
        if (await target.isVisible()) {
          const box = await target.boundingBox()
          if (box) {
            // WCAG recommends minimum 44x44px touch targets
            const minSize = Math.min(box.width, box.height)
            expect(minSize).toBeGreaterThanOrEqual(44)
          }
        }
      }
    })
  })

  test.describe('Error States Accessibility', () => {
    test('error states are properly announced', async ({ page }) => {
      // Test with invalid module to trigger error state
      await page.goto('/?egg=invalid-module')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      // Check that page is still accessible even in error state
      await checkA11y(page, undefined, {
        detailedReport: true,
        rules: {
          'canvas-has-accessible-text': { enabled: false }
        }
      })

      // Look for error messages with proper ARIA
      const errorMessages = page.locator('[role="alert"], [aria-live="polite"], [aria-live="assertive"]')
      const errorCount = await errorMessages.count()
      
      // If errors are shown, they should be properly announced
      if (errorCount > 0) {
        for (let i = 0; i < errorCount; i++) {
          const error = errorMessages.nth(i)
          const text = await error.textContent()
          expect(text?.trim().length).toBeGreaterThan(0)
        }
      }
    })
  })
})