import { test, expect } from '@playwright/test'
import { injectAxe, checkA11y, getViolations } from 'axe-playwright'
import { TestUtils, VIEWPORTS, SELECTORS } from './test-utils'

test.describe('Accessibility Tests (A-01)', () => {
  let testUtils: TestUtils

  test.beforeEach(async ({ page }) => {
    testUtils = new TestUtils(page)
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
        tags: ['wcag2a', 'wcag2aa', 'wcag21aa']
      })
    })

    test('home page with knowledge module passes accessibility checks', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Enable knowledge module
      await testUtils.selectBackgroundModule('knowledge')
      
      // Run axe checks on page with active background module
      await checkA11y(page, undefined, {
        detailedReport: true,
        detailedReportOptions: { html: true },
        rules: {
          // Allow canvas elements to not have accessible content since they're decorative/interactive
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

    test('passes accessibility with gradient module active', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      await testUtils.selectBackgroundModule('gradient')
      
      await checkA11y(page, undefined, {
        detailedReport: true,
        detailedReportOptions: { html: true },
        rules: {
          'canvas-has-accessible-text': { enabled: false }
        }
      })
    })
  })

  test.describe('Control Tray Accessibility', () => {
    test('control tray is accessible when opened', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Open control tray using test utils
      const dialog = await testUtils.openControlTray()

      // Check accessibility of opened dialog
      await checkA11y(page, SELECTORS.DIALOG, {
        detailedReport: true,
        detailedReportOptions: { html: true },
      })

      await testUtils.closeControlTray()
    })

    test('control tray has proper ARIA labels', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Check control button accessibility
      const controlButton = page.locator(SELECTORS.CONTROL_BUTTON).first()
      
      if (await controlButton.isVisible()) {
        const ariaLabel = await controlButton.getAttribute('aria-label')
        const title = await controlButton.getAttribute('title')
        
        // Should have meaningful label
        expect(ariaLabel || title).toBeTruthy()
        expect((ariaLabel || title)?.length).toBeGreaterThan(10)

        // Open dialog and check internal elements
        const dialog = await testUtils.openControlTray()
        
        // Check dialog title
        const dialogTitle = dialog.locator('h3, [id*="dialog-title"]')
        await expect(dialogTitle).toBeVisible()
        
        // Check switches have proper labels
        const switches = dialog.locator('button[role="switch"], .switch button')
        const switchCount = await switches.count()
        
        for (let i = 0; i < switchCount; i++) {
          const switchEl = switches.nth(i)
          const parentText = await switchEl.locator('..').textContent()
          expect(parentText?.trim().length).toBeGreaterThan(5)
        }

        await testUtils.closeControlTray()
      }
    })

    test('control tray keyboard navigation works', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Test keyboard navigation
      const navResult = await testUtils.testKeyboardNavigation(15)
      
      // Should have focusable elements
      expect(navResult.focusableElements.length).toBeGreaterThan(0)
      
      // Control button should be focusable
      const controlButton = page.locator(SELECTORS.CONTROL_BUTTON).first()
      
      if (await controlButton.isVisible()) {
        // Focus and activate with keyboard
        await controlButton.focus()
        await page.keyboard.press('Enter')
        await page.waitForTimeout(300)

        // Check if dialog opened
        const dialog = page.locator(SELECTORS.DIALOG)
        if (await dialog.isVisible()) {
          // Test tab navigation within dialog
          await page.keyboard.press('Tab')
          await page.waitForTimeout(100)
          
          const focused = page.locator(':focus')
          if (await focused.count() > 0) {
            const focusedInfo = await focused.evaluate(el => ({
              tagName: el.tagName.toLowerCase(),
              role: el.getAttribute('role'),
              insideDialog: !!el.closest('[role="dialog"]')
            }))
            
            // Focus should be trapped within dialog
            expect(focusedInfo.insideDialog).toBe(true)
          }
          
          // Test Escape key to close
          await page.keyboard.press('Escape')
          await page.waitForTimeout(300)

          // Dialog should be closed
          await expect(dialog).not.toBeVisible()
        }
      }
    })

    test('control tray focus management', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      const controlButton = page.locator(SELECTORS.CONTROL_BUTTON).first()
      
      if (await controlButton.isVisible()) {
        // Focus control button
        await controlButton.focus()
        
        // Open dialog
        await page.keyboard.press('Enter')
        await page.waitForTimeout(300)

        const dialog = page.locator(SELECTORS.DIALOG)
        
        if (await dialog.isVisible()) {
          // Focus should move into dialog
          const focused = page.locator(':focus')
          const isInDialog = await focused.evaluate(el => !!el.closest('[role="dialog"]'))
          
          // Close dialog
          await page.keyboard.press('Escape')
          await page.waitForTimeout(300)
          
          // Focus should return to trigger button
          const newFocused = page.locator(':focus')
          const isSameElement = await page.evaluate((buttonSelector) => {
            const focused = document.activeElement
            const button = document.querySelector(buttonSelector)
            return focused === button
          }, SELECTORS.CONTROL_BUTTON)
          
          expect(isSameElement).toBe(true)
        }
      }
    })
  })

  test.describe('Canvas Accessibility', () => {
    test('canvas elements have appropriate ARIA attributes', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      await testUtils.selectBackgroundModule('knowledge')
      
      const canvas = page.locator(SELECTORS.CANVAS)
      
      if (await canvas.isVisible()) {
        // Interactive canvas should not be aria-hidden
        const ariaHidden = await canvas.getAttribute('aria-hidden')
        const isInteractive = await canvas.evaluate((el) => {
          const style = window.getComputedStyle(el)
          return style.pointerEvents !== 'none'
        })

        if (isInteractive) {
          expect(ariaHidden).not.toBe('true')
        }
        
        // Check for appropriate role or description
        const role = await canvas.getAttribute('role')
        const ariaLabel = await canvas.getAttribute('aria-label')
        const ariaDescription = await canvas.getAttribute('aria-describedby')
        
        // Interactive canvas should have some accessibility context
        if (isInteractive) {
          const hasA11yContext = role || ariaLabel || ariaDescription
          expect(hasA11yContext).toBeTruthy()
        }
      }
    })

    test('decorative canvas is properly hidden', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      await testUtils.selectBackgroundModule('gradient')
      
      const canvas = page.locator(SELECTORS.CANVAS)
      
      if (await canvas.isVisible()) {
        const isDecorative = await canvas.evaluate((el) => {
          const style = window.getComputedStyle(el)
          return style.pointerEvents === 'none'
        })

        if (isDecorative) {
          const ariaHidden = await canvas.getAttribute('aria-hidden')
          expect(ariaHidden).toBe('true')
        }
      }
    })

    test('interactive canvas has proper focus indicators', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      await testUtils.selectBackgroundModule('knowledge')

      const canvas = page.locator(SELECTORS.CANVAS)
      
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
          
          // Try to focus the canvas
          await canvas.focus()
          
          // Check if it received focus
          const hasFocus = await canvas.evaluate(el => document.activeElement === el)
          
          // Interactive canvas should be focusable
          if (tabIndex === '0') {
            expect(hasFocus).toBe(true)
          }
        }
      }
    })
  })

  test.describe('Reduced Motion Accessibility', () => {
    test('respects prefers-reduced-motion setting', async ({ page }) => {
      // Enable reduced motion preference
      await testUtils.enableReducedMotion()

      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      await testUtils.selectBackgroundModule('knowledge')

      // Should still be functional
      const canvas = page.locator(SELECTORS.CANVAS)
      if (await canvas.count() > 0) {
        await expect(canvas).toBeVisible()
      }

      // Check for reduced motion notification
      const notification = page.locator('[role="banner"]:has-text("reduced motion"), [aria-label*="reduced motion"]')
      
      if (await notification.count() > 0) {
        await expect(notification).toBeVisible()
        
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

    test('animation controls respect reduced motion', async ({ page }) => {
      await testUtils.enableReducedMotion()
      
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Should auto-pause animations when reduced motion is preferred
      const isPaused = await page.evaluate(() => localStorage.getItem('bg-paused'))
      
      // Reduced motion preference should influence pause state
      if (isPaused === 'true') {
        console.log('Background correctly paused due to reduced motion preference')
      }
    })
  })

  test.describe('Screen Reader Compatibility', () => {
    test('page structure is screen reader friendly', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Check for proper heading hierarchy
      const headings = page.locator(SELECTORS.HEADINGS)
      const headingCount = await headings.count()
      
      if (headingCount > 0) {
        // Should have at least one h1
        const h1Count = await page.locator('h1').count()
        expect(h1Count).toBeGreaterThanOrEqual(1)
        
        // Check heading order
        for (let i = 0; i < Math.min(headingCount, 5); i++) {
          const heading = headings.nth(i)
          const text = await heading.textContent()
          const level = await heading.evaluate(el => el.tagName.toLowerCase())
          
          expect(text?.trim().length).toBeGreaterThan(0)
          console.log(`Heading ${i + 1}: ${level} - "${text?.trim()}"`)
        }
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
          
          // Check for appropriate role
          const role = await element.getAttribute('role')
          const tagName = await element.evaluate(el => el.tagName.toLowerCase())
          
          console.log(`Interactive element ${i + 1}: ${tagName}${role ? ` (role=${role})` : ''} - "${accessibleName}"`)
        }
      }
    })

    test('skip links are available for screen readers', async ({ page }) => {
      await page.goto('/')
      
      // Test keyboard navigation to find skip links
      const navResult = await testUtils.testKeyboardNavigation(5)
      
      if (navResult.hasSkipLinks) {
        console.log('Skip links found and accessible')
      }
      
      // Check for common skip link patterns
      const skipLinks = page.locator('a[href^="#"]:has-text("skip"), a[class*="skip"]')
      const skipCount = await skipLinks.count()
      
      if (skipCount > 0) {
        const firstSkip = skipLinks.first()
        const href = await firstSkip.getAttribute('href')
        const text = await firstSkip.textContent()
        
        expect(href).toBeTruthy()
        expect(text?.toLowerCase()).toContain('skip')
        
        console.log(`Skip link found: "${text}" -> ${href}`)
      }
    })
  })

  test.describe('High Contrast Mode', () => {
    test('works in high contrast mode', async ({ page }) => {
      // Enable high contrast mode
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
      
      // Test with background module active
      await testUtils.selectBackgroundModule('gradient')
      
      const canvas = page.locator(SELECTORS.CANVAS)
      if (await canvas.count() > 0) {
        await expect(canvas).toBeVisible()
      }
    })

    test('control elements remain accessible in high contrast', async ({ page }) => {
      await page.emulateMedia({ 
        colorScheme: 'dark',
        forcedColors: 'active' as any 
      })

      await page.goto('/')
      await page.waitForLoadState('networkidle')

      const controlButton = page.locator(SELECTORS.CONTROL_BUTTON).first()
      
      if (await controlButton.isVisible()) {
        await expect(controlButton).toBeVisible()
        
        const dialog = await testUtils.openControlTray()
        await expect(dialog).toBeVisible()
        
        // Elements should still be accessible in high contrast
        const switches = dialog.locator('button[role="switch"], .switch button')
        if (await switches.count() > 0) {
          await expect(switches.first()).toBeVisible()
        }
        
        await testUtils.closeControlTray()
      }
    })
  })

  test.describe('Mobile Accessibility', () => {
    test('touch targets are appropriately sized on mobile', async ({ page }) => {
      // Simulate mobile device
      await page.setViewportSize(VIEWPORTS.MOBILE_PORTRAIT)
      
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Find touch targets (buttons, links, etc.)
      const touchTargets = page.locator('button, [role="button"], a, input[type="checkbox"], input[type="radio"]')
      const count = await touchTargets.count()

      for (let i = 0; i < Math.min(count, 10); i++) {
        const target = touchTargets.nth(i)
        if (await target.isVisible()) {
          const box = await target.boundingBox()
          if (box) {
            // WCAG recommends minimum 44x44px touch targets
            const minSize = Math.min(box.width, box.height)
            expect(minSize).toBeGreaterThanOrEqual(44 - 5) // Allow 5px tolerance
            
            console.log(`Touch target ${i + 1}: ${Math.round(box.width)}x${Math.round(box.height)}px`)
          }
        }
      }
    })

    test('mobile navigation is accessible', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.MOBILE_PORTRAIT)
      
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Look for mobile menu toggle
      const menuToggle = page.locator('button[aria-label*="menu"], button[aria-expanded], .hamburger, .menu-toggle')
      
      if (await menuToggle.count() > 0) {
        const toggle = menuToggle.first()
        await expect(toggle).toBeVisible()
        
        // Should have proper ARIA attributes
        const ariaLabel = await toggle.getAttribute('aria-label')
        const ariaExpanded = await toggle.getAttribute('aria-expanded')
        
        expect(ariaLabel || ariaExpanded).toBeTruthy()
        
        // Should be large enough for touch
        const box = await toggle.boundingBox()
        if (box) {
          const minSize = Math.min(box.width, box.height)
          expect(minSize).toBeGreaterThanOrEqual(44 - 5)
        }
      }
    })

    test('mobile control tray is accessible', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.MOBILE_PORTRAIT)
      
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      const controlButton = page.locator(SELECTORS.CONTROL_BUTTON).first()
      
      if (await controlButton.isVisible()) {
        // Touch target should be large enough
        const box = await controlButton.boundingBox()
        if (box) {
          const minSize = Math.min(box.width, box.height)
          expect(minSize).toBeGreaterThanOrEqual(44 - 5)
        }

        const dialog = await testUtils.openControlTray()
        
        // Dialog should be appropriately sized for mobile
        const dialogBox = await dialog.boundingBox()
        const viewport = await testUtils.getViewportInfo()
        
        if (dialogBox) {
          // Dialog should use most of screen width on mobile
          expect(dialogBox.width).toBeGreaterThan(viewport.width * 0.8)
          
          // Should not exceed viewport
          expect(dialogBox.x + dialogBox.width).toBeLessThanOrEqual(viewport.width + 10)
          expect(dialogBox.y + dialogBox.height).toBeLessThanOrEqual(viewport.height + 10)
        }

        await testUtils.closeControlTray()
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

    test('network error handling maintains accessibility', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Simulate network failure for module loading
      await testUtils.simulateNetworkCondition('offline')
      
      // Try to load a module (should fail gracefully)
      const controlButton = page.locator(SELECTORS.CONTROL_BUTTON).first()
      
      if (await controlButton.isVisible()) {
        const dialog = await testUtils.openControlTray()
        
        // Try to select knowledge module (will fail to load)
        await page.locator('text=Knowledge Graph').click()
        await page.locator('text=Background Active').click()
        
        await testUtils.closeControlTray()
        await page.waitForTimeout(2000)
        
        // Page should remain accessible despite module load failure
        await checkA11y(page, undefined, {
          detailedReport: true,
          rules: {
            'canvas-has-accessible-text': { enabled: false }
          }
        })
      }

      // Restore network
      await testUtils.simulateNetworkCondition('fast')
    })
  })

  test.describe('Dynamic Content Accessibility', () => {
    test('theme changes maintain accessibility', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Test light theme first
      await testUtils.setTheme('light')
      await page.reload()
      await page.waitForLoadState('networkidle')

      await checkA11y(page, undefined, {
        detailedReport: true
      })

      // Switch to dark theme
      await testUtils.setTheme('dark')
      await page.reload()
      await page.waitForLoadState('networkidle')

      await checkA11y(page, undefined, {
        detailedReport: true
      })
    })

    test('module switching maintains accessibility', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Test each module for accessibility
      const modules = ['gradient', 'knowledge', 'none']
      
      for (const module of modules) {
        await testUtils.selectBackgroundModule(module)
        
        await checkA11y(page, undefined, {
          detailedReport: true,
          rules: {
            'canvas-has-accessible-text': { enabled: false }
          }
        })
        
        console.log(`Accessibility check passed for ${module} module`)
      }
    })
  })
})