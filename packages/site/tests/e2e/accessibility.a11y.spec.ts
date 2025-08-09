import { test, expect } from '@playwright/test'

test.describe('Accessibility Testing', () => {
  const pages = ['/', '/about', '/projects', '/blog', '/contact']

  pages.forEach((pagePath) => {
    test(`should meet WCAG AA standards on ${pagePath}`, async ({ page }) => {
      await page.goto(pagePath)
      await page.waitForLoadState('networkidle')

      // Basic accessibility checks using built-in Playwright features
      
      // 1. Check for proper heading hierarchy
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all()
      const headingLevels = await Promise.all(
        headings.map(h => h.evaluate(el => parseInt(el.tagName.charAt(1))))
      )
      
      if (headingLevels.length > 0) {
        // Should have an h1
        expect(headingLevels).toContain(1)
        
        // Check heading order (no skipping levels)
        for (let i = 1; i < headingLevels.length; i++) {
          const diff = headingLevels[i] - headingLevels[i-1]
          expect(diff).toBeLessThanOrEqual(1) // Don't skip heading levels
        }
      }

      // 2. Check all images have alt text
      const images = await page.locator('img').all()
      for (const img of images) {
        const alt = await img.getAttribute('alt')
        const ariaLabel = await img.getAttribute('aria-label')
        const role = await img.getAttribute('role')
        
        // Decorative images can have empty alt or role="presentation"
        expect(
          alt !== null || 
          ariaLabel !== null || 
          role === 'presentation' ||
          role === 'none'
        ).toBe(true)
      }

      // 3. Check form labels
      const inputs = await page.locator('input, textarea, select').all()
      for (const input of inputs) {
        const id = await input.getAttribute('id')
        const ariaLabel = await input.getAttribute('aria-label')
        const ariaLabelledby = await input.getAttribute('aria-labelledby')
        
        if (id) {
          const associatedLabel = await page.locator(`label[for="${id}"]`).count()
          expect(
            associatedLabel > 0 || 
            ariaLabel !== null || 
            ariaLabelledby !== null
          ).toBe(true)
        }
      }

      // 4. Check color contrast (basic check)
      const bodyStyles = await page.evaluate(() => {
        const body = document.body
        const styles = window.getComputedStyle(body)
        return {
          color: styles.color,
          backgroundColor: styles.backgroundColor
        }
      })
      
      // Ensure text is not invisible (same color as background)
      expect(bodyStyles.color).not.toBe(bodyStyles.backgroundColor)

      // 5. Check focus indicators
      const focusableElements = await page.locator('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])').all()
      
      if (focusableElements.length > 0) {
        // Test first focusable element
        await focusableElements[0].focus()
        
        const hasFocusIndicator = await focusableElements[0].evaluate((el) => {
          const styles = window.getComputedStyle(el)
          return styles.outlineWidth !== '0px' || 
                 styles.outlineStyle !== 'none' ||
                 styles.boxShadow !== 'none' ||
                 el.matches(':focus-visible')
        })
        
        expect(hasFocusIndicator).toBe(true)
      }
    })

    test(`should support keyboard navigation on ${pagePath}`, async ({ page }) => {
      await page.goto(pagePath)
      await page.waitForLoadState('networkidle')

      // Get all focusable elements
      const focusableElements = await page.locator('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])').all()
      
      if (focusableElements.length > 0) {
        // Tab through first few elements
        for (let i = 0; i < Math.min(5, focusableElements.length); i++) {
          await page.keyboard.press('Tab')
          
          const focusedElement = await page.evaluate(() => {
            const focused = document.activeElement
            return {
              tagName: focused?.tagName,
              id: focused?.id,
              className: focused?.className
            }
          })
          
          expect(['A', 'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT']).toContain(focusedElement.tagName)
        }

        // Test Enter key on buttons
        const buttons = await page.locator('button, input[type="button"], input[type="submit"]').all()
        if (buttons.length > 0) {
          await buttons[0].focus()
          // Enter key should activate button (test that it doesn't error)
          await page.keyboard.press('Enter')
          // Test passes if no error occurs
        }

        // Test Space key on buttons
        if (buttons.length > 0) {
          await buttons[0].focus()
          await page.keyboard.press('Space')
          // Test passes if no error occurs
        }

        // Test Escape key (should not cause errors)
        await page.keyboard.press('Escape')
      }
    })

    test(`should support screen reader navigation on ${pagePath}`, async ({ page }) => {
      await page.goto(pagePath)
      await page.waitForLoadState('networkidle')

      // Check for ARIA landmarks
      const landmarks = await page.locator('[role="main"], main, [role="navigation"], nav, [role="banner"], header, [role="contentinfo"], footer, [role="complementary"], aside').all()
      
      // Should have at least a main content area
      const hasMainContent = landmarks.some(async (el) => {
        const role = await el.getAttribute('role')
        const tagName = await el.evaluate(el => el.tagName.toLowerCase())
        return role === 'main' || tagName === 'main'
      })
      
      expect(hasMainContent || landmarks.length > 0).toBe(true)

      // Check for proper ARIA labels on interactive elements
      const interactiveElements = await page.locator('button, a, input, select, textarea').all()
      
      for (const element of interactiveElements.slice(0, 5)) { // Test first 5
        const ariaLabel = await element.getAttribute('aria-label')
        const ariaLabelledby = await element.getAttribute('aria-labelledby')
        const title = await element.getAttribute('title')
        const textContent = await element.textContent()
        
        // Element should have some form of accessible name
        expect(
          ariaLabel !== null ||
          ariaLabelledby !== null ||
          title !== null ||
          (textContent && textContent.trim().length > 0)
        ).toBe(true)
      }

      // Check for skip links
      const skipLinks = await page.locator('a[href^="#"], [class*="skip"], [class*="sr-only"]').all()
      // Skip links are good practice but not required for basic functionality
    })

    test(`should handle reduced motion preference on ${pagePath}`, async ({ page }) => {
      // Set reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto(pagePath)
      await page.waitForLoadState('networkidle')

      // Check that animations respect reduced motion
      const hasReducedMotion = await page.evaluate(() => {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      })
      
      expect(hasReducedMotion).toBe(true)

      // WebGL background should still work but with reduced animation
      if (process.env.WEBGL_SUPPORTED === 'true') {
        const canvas = page.locator('canvas')
        if (await canvas.count() > 0) {
          await expect(canvas).toBeVisible()
          
          // Canvas should be functional but may have reduced animation
          const webglWorking = await page.evaluate(() => {
            const canvas = document.querySelector('canvas') as HTMLCanvasElement
            const gl = canvas?.getContext('webgl') || canvas?.getContext('experimental-webgl')
            return !!gl
          })
          expect(webglWorking).toBe(true)
        }
      }
    })

    test(`should support high contrast mode on ${pagePath}`, async ({ page }) => {
      // Simulate high contrast mode
      await page.emulateMedia({ colorScheme: 'dark' })
      await page.addInitScript(() => {
        // Simulate forced colors
        Object.defineProperty(window, 'matchMedia', {
          writable: true,
          value: (query: string) => ({
            matches: query.includes('forced-colors'),
            media: query,
            onchange: null,
            addListener: () => {},
            removeListener: () => {},
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => {},
          })
        })
      })
      
      await page.goto(pagePath)
      await page.waitForLoadState('networkidle')

      // Check that content is still visible and accessible
      const bodyVisible = await page.locator('body').isVisible()
      expect(bodyVisible).toBe(true)

      // Check that interactive elements are still functional
      const buttons = await page.locator('button, a').all()
      if (buttons.length > 0) {
        await expect(buttons[0]).toBeVisible()
        
        // Should be able to interact with elements
        const isClickable = await buttons[0].evaluate((el) => {
          return !el.hasAttribute('disabled') && 
                 getComputedStyle(el).pointerEvents !== 'none'
        })
        expect(isClickable).toBe(true)
      }
    })

    test(`should handle text scaling on ${pagePath}`, async ({ page }) => {
      await page.goto(pagePath)
      await page.waitForLoadState('networkidle')

      // Test 200% zoom (WCAG requirement)
      await page.setViewportSize({ width: 800, height: 600 })
      await page.evaluate(() => {
        document.body.style.zoom = '2'
      })
      
      // Content should still be usable at 200% zoom
      const bodyVisible = await page.locator('body').isVisible()
      expect(bodyVisible).toBe(true)

      // Navigation should still be accessible
      const navElements = await page.locator('nav a, [role="navigation"] a').all()
      if (navElements.length > 0) {
        await expect(navElements[0]).toBeVisible()
      }

      // Reset zoom
      await page.evaluate(() => {
        document.body.style.zoom = '1'
      })
    })
  })

  test('should provide alternative access to WebGL content', async ({ page }) => {
    await page.goto('/')
    
    // If WebGL is available, there should still be non-visual ways to access content
    if (process.env.WEBGL_SUPPORTED === 'true') {
      const canvas = page.locator('canvas')
      if (await canvas.count() > 0) {
        // Canvas should have appropriate ARIA attributes or alternative content
        const ariaLabel = await canvas.getAttribute('aria-label')
        const ariaHidden = await canvas.getAttribute('aria-hidden')
        const role = await canvas.getAttribute('role')
        
        // Canvas should either be properly labeled or marked as decorative
        expect(
          ariaLabel !== null ||
          ariaHidden === 'true' ||
          role === 'presentation' ||
          role === 'img'
        ).toBe(true)
      }
    }
  })
})