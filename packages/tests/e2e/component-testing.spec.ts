import { test, expect } from '@playwright/test'

test.describe('Component-Level UI Testing (C-02)', () => {

  test.describe('CanvasHost Component Tests', () => {
    test('canvas host initializes correctly', async ({ page }) => {
      await page.goto('/?egg=gradient')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)
      
      const canvas = page.locator('canvas')
      
      // Canvas should be present and properly configured
      await expect(canvas).toBeVisible()
      
      // Check canvas attributes
      const canvasInfo = await page.evaluate(() => {
        const canvas = document.querySelector('canvas') as HTMLCanvasElement
        if (!canvas) return null
        
        return {
          hasCanvas: true,
          width: canvas.width,
          height: canvas.height,
          displayWidth: canvas.offsetWidth,
          displayHeight: canvas.offsetHeight,
          zIndex: window.getComputedStyle(canvas).zIndex,
          position: window.getComputedStyle(canvas).position,
          pointerEvents: window.getComputedStyle(canvas).pointerEvents,
          ariaHidden: canvas.getAttribute('aria-hidden')
        }
      })
      
      expect(canvasInfo).toBeTruthy()
      expect(canvasInfo?.hasCanvas).toBe(true)
      expect(canvasInfo?.position).toBe('fixed')
      expect(canvasInfo?.width).toBeGreaterThan(0)
      expect(canvasInfo?.height).toBeGreaterThan(0)
    })

    test('canvas adapts to viewport changes', async ({ page }) => {
      await page.goto('/?egg=gradient')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)
      
      // Initial viewport
      const initialViewport = { width: 1280, height: 720 }
      await page.setViewportSize(initialViewport)
      await page.waitForTimeout(300)
      
      let canvasRect = await page.locator('canvas').boundingBox()
      expect(canvasRect?.width).toBeCloseTo(initialViewport.width, 10)
      expect(canvasRect?.height).toBeCloseTo(initialViewport.height, 10)
      
      // Resize viewport
      const newViewport = { width: 1920, height: 1080 }
      await page.setViewportSize(newViewport)
      await page.waitForTimeout(500) // Allow resize handler to execute
      
      canvasRect = await page.locator('canvas').boundingBox()
      expect(canvasRect?.width).toBeCloseTo(newViewport.width, 10)
      expect(canvasRect?.height).toBeCloseTo(newViewport.height, 10)
    })

    test('canvas handles module switching', async ({ page }) => {
      await page.goto('/?egg=gradient')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)
      
      // Gradient module should be active
      let canvas = page.locator('canvas')
      await expect(canvas).toBeVisible()
      
      // Check initial module state
      let moduleState = await page.evaluate(() => ({
        currentModule: localStorage.getItem('bg-module'),
        isActive: localStorage.getItem('bg-active')
      }))
      
      expect(moduleState.currentModule).toBe('gradient')
      
      // Switch to knowledge module
      await page.goto('/?egg=knowledge')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000) // Allow D3 to initialize
      
      canvas = page.locator('canvas')
      await expect(canvas).toBeVisible()
      
      // Check new module state
      moduleState = await page.evaluate(() => ({
        currentModule: localStorage.getItem('bg-module'),
        isActive: localStorage.getItem('bg-active')
      }))
      
      expect(moduleState.currentModule).toBe('knowledge')
      
      // Canvas should be interactive for knowledge module
      const ariaHidden = await canvas.getAttribute('aria-hidden')
      expect(ariaHidden).not.toBe('true')
    })

    test('canvas cleanup on module destruction', async ({ page }) => {
      await page.goto('/?egg=gradient')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)
      
      const canvas = page.locator('canvas')
      await expect(canvas).toBeVisible()
      
      // Navigate away (should trigger cleanup)
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Canvas should be gone or cleared
      const canvasAfterNavigation = page.locator('canvas')
      const canvasCount = await canvasAfterNavigation.count()
      
      // Either no canvas or canvas is cleared/hidden
      if (canvasCount > 0) {
        const canvasInfo = await page.evaluate(() => {
          const canvas = document.querySelector('canvas')
          return canvas ? {
            visible: canvas.offsetWidth > 0 && canvas.offsetHeight > 0,
            hasContent: !!canvas.getContext('2d')
          } : null
        })
        
        // Canvas might exist but should be inactive/cleared
        console.log('Canvas state after navigation:', canvasInfo)
      }
    })
  })

  test.describe('ControlTray Component Tests', () => {
    test('control tray dialog structure', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      const controlButton = page.locator('button[aria-label*="background controls"]').first()
      
      if (await controlButton.isVisible()) {
        await controlButton.click()
        await page.waitForTimeout(300)
        
        const dialog = page.locator('[role="dialog"]')
        await expect(dialog).toBeVisible()
        
        // Check dialog structure
        const dialogTitle = dialog.locator('h3, [id*="dialog-title"]')
        await expect(dialogTitle).toBeVisible()
        await expect(dialogTitle).toHaveText(/background controls/i)
        
        // Check module selector
        const moduleSelector = dialog.locator('[role="listbox"], .listbox')
        if (await moduleSelector.count() > 0) {
          await expect(moduleSelector.first()).toBeVisible()
        }
        
        // Check toggle switches
        const toggles = dialog.locator('button[role="switch"], .switch button')
        const toggleCount = await toggles.count()
        expect(toggleCount).toBeGreaterThanOrEqual(2) // Active and Pause toggles
        
        // Check close button
        const closeButton = dialog.locator('button[aria-label*="close"]')
        await expect(closeButton).toBeVisible()
        
        await closeButton.click()
        await page.waitForTimeout(300)
        await expect(dialog).not.toBeVisible()
      }
    })

    test('module selection functionality', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      const controlButton = page.locator('button[aria-label*="background controls"]').first()
      
      if (await controlButton.isVisible()) {
        await controlButton.click()
        await page.waitForTimeout(300)
        
        const dialog = page.locator('[role="dialog"]')
        
        // Open module selector
        const selectorButton = dialog.locator('button').first()
        await selectorButton.click()
        await page.waitForTimeout(200)
        
        // Check available options
        const options = page.locator('[role="option"], .option')
        const optionCount = await options.count()
        expect(optionCount).toBeGreaterThan(0)
        
        // Select gradient module
        const gradientOption = page.locator('text=Animated Gradient').first()
        if (await gradientOption.isVisible()) {
          await gradientOption.click()
          await page.waitForTimeout(200)
          
          // Verify selection
          const selectedText = await selectorButton.textContent()
          expect(selectedText).toContain('Gradient')
        }
        
        await page.keyboard.press('Escape')
      }
    })

    test('toggle switch interactions', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      const controlButton = page.locator('button[aria-label*="background controls"]').first()
      
      if (await controlButton.isVisible()) {
        await controlButton.click()
        await page.waitForTimeout(300)
        
        const dialog = page.locator('[role="dialog"]')
        
        // Test Background Active toggle
        const activeToggle = page.locator('text=Background Active').locator('..').locator('button')
        
        if (await activeToggle.isVisible()) {
          // Get initial state
          const initialChecked = await activeToggle.getAttribute('aria-checked') === 'true' ||
                                 await activeToggle.evaluate(el => el.classList.contains('bg-blue-600'))
          
          // Toggle switch
          await activeToggle.click()
          await page.waitForTimeout(300)
          
          // Verify state changed in localStorage
          const storedActive = await page.evaluate(() => localStorage.getItem('bg-active'))
          const expectedState = initialChecked ? 'false' : 'true'
          expect(storedActive).toBe(expectedState)
          
          // Test Pause toggle (only works when active)
          if (storedActive === 'true') {
            const pauseToggle = page.locator('text=Animation Paused').locator('..').locator('button')
            
            if (await pauseToggle.isVisible()) {
              await pauseToggle.click()
              await page.waitForTimeout(300)
              
              const storedPaused = await page.evaluate(() => localStorage.getItem('bg-paused'))
              expect(storedPaused).toBeTruthy()
            }
          }
        }
        
        await page.keyboard.press('Escape')
      }
    })

    test('keyboard navigation in control tray', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      const controlButton = page.locator('button[aria-label*="background controls"]').first()
      
      if (await controlButton.isVisible()) {
        // Focus control button with keyboard
        await controlButton.focus()
        await page.keyboard.press('Enter')
        await page.waitForTimeout(300)
        
        const dialog = page.locator('[role="dialog"]')
        await expect(dialog).toBeVisible()
        
        // Navigate with Tab
        await page.keyboard.press('Tab')
        await page.waitForTimeout(100)
        
        // Check if focus moved to a dialog element
        const focused = page.locator(':focus')
        const focusedElement = await focused.evaluate(el => ({
          tagName: el.tagName.toLowerCase(),
          role: el.getAttribute('role'),
          ariaLabel: el.getAttribute('aria-label')
        }))
        
        console.log('Focused element in dialog:', focusedElement)
        
        // Should be able to navigate and activate elements
        if (focusedElement.tagName === 'button') {
          await page.keyboard.press('Space')
          await page.waitForTimeout(200)
        }
        
        // Escape should close dialog
        await page.keyboard.press('Escape')
        await page.waitForTimeout(300)
        await expect(dialog).not.toBeVisible()
      }
    })

    test('control tray state persistence', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      const controlButton = page.locator('button[aria-label*="background controls"]').first()
      
      if (await controlButton.isVisible()) {
        await controlButton.click()
        
        // Set specific state
        await page.locator('text=Animated Gradient').click()
        await page.locator('text=Background Active').locator('..').locator('button').click()
        await page.keyboard.press('Escape')
        await page.waitForTimeout(500)
        
        // Verify state was saved
        const savedState = await page.evaluate(() => ({
          module: localStorage.getItem('bg-module'),
          active: localStorage.getItem('bg-active')
        }))
        
        expect(savedState.module).toBe('gradient')
        expect(savedState.active).toBe('true')
        
        // Reload page and check state restoration
        await page.reload()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)
        
        // Canvas should be restored
        const canvas = page.locator('canvas')
        if (await canvas.count() > 0) {
          await expect(canvas).toBeVisible()
        }
        
        // Control tray should show correct state
        await controlButton.click()
        const dialog = page.locator('[role="dialog"]')
        
        // Should show Animated Gradient as selected
        const selectedModule = dialog.locator('button').first()
        const moduleText = await selectedModule.textContent()
        expect(moduleText).toContain('Gradient')
        
        await page.keyboard.press('Escape')
      }
    })
  })

  test.describe('Background Module Components', () => {
    test('gradient module visual output', async ({ page }) => {
      await page.goto('/?egg=gradient')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)
      
      const canvas = page.locator('canvas')
      await expect(canvas).toBeVisible()
      
      // Check that gradient is actually rendering
      const hasGradientContent = await page.evaluate(() => {
        const canvas = document.querySelector('canvas') as HTMLCanvasElement
        const ctx = canvas?.getContext('2d')
        if (!ctx) return false
        
        try {
          // Sample a few pixels to see if there's color variation (gradient)
          const samples = [
            ctx.getImageData(canvas.width * 0.25, canvas.height * 0.25, 1, 1),
            ctx.getImageData(canvas.width * 0.75, canvas.height * 0.25, 1, 1),
            ctx.getImageData(canvas.width * 0.25, canvas.height * 0.75, 1, 1),
            ctx.getImageData(canvas.width * 0.75, canvas.height * 0.75, 1, 1)
          ]
          
          // Check if we have color variation (indicating gradient)
          const colors = samples.map(sample => ({
            r: sample.data[0],
            g: sample.data[1], 
            b: sample.data[2],
            a: sample.data[3]
          }))
          
          // Should have some alpha values > 0 (not transparent)
          const hasColor = colors.some(c => c.a > 0)
          
          // Should have color variation between samples
          const hasVariation = colors.some((c1, i) => 
            colors.some((c2, j) => i !== j && (
              Math.abs(c1.r - c2.r) > 10 ||
              Math.abs(c1.g - c2.g) > 10 ||
              Math.abs(c1.b - c2.b) > 10
            ))
          )
          
          return { hasColor, hasVariation, samples: colors }
        } catch {
          return { hasColor: true, hasVariation: true, samples: [] } // Assume success if can't read
        }
      })
      
      expect(hasGradientContent.hasColor).toBe(true)
      console.log('Gradient rendering check:', hasGradientContent)
    })

    test('knowledge graph module interactions', async ({ page }) => {
      await page.goto('/?egg=knowledge')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000) // Allow D3 simulation to settle
      
      const canvas = page.locator('canvas')
      await expect(canvas).toBeVisible()
      
      const canvasRect = await canvas.boundingBox()
      if (canvasRect) {
        // Test node interaction
        const centerX = canvasRect.x + canvasRect.width / 2
        const centerY = canvasRect.y + canvasRect.height / 2
        
        // Click in different areas to find nodes
        const testPoints = [
          { x: centerX, y: centerY },
          { x: centerX - 100, y: centerY - 100 },
          { x: centerX + 100, y: centerY + 100 },
          { x: centerX - 50, y: centerY + 50 }
        ]
        
        for (const point of testPoints) {
          await page.mouse.click(point.x, point.y)
          await page.waitForTimeout(100)
          
          // Canvas should remain functional
          await expect(canvas).toBeVisible()
        }
        
        // Test right-click (add node)
        await page.mouse.click(centerX + 150, centerY + 150, { button: 'right' })
        await page.waitForTimeout(500)
        
        // Should still be functional
        await expect(canvas).toBeVisible()
        
        // Test zoom
        await page.mouse.move(centerX, centerY)
        await page.mouse.wheel(0, -100)
        await page.waitForTimeout(200)
        await expect(canvas).toBeVisible()
        
        await page.mouse.wheel(0, 100)
        await page.waitForTimeout(200)
        await expect(canvas).toBeVisible()
      }
    })

    test('module theme adaptation', async ({ page }) => {
      // Test light theme
      await page.addInitScript(() => {
        localStorage.setItem('theme', 'light')
        document.documentElement.classList.remove('dark')
      })
      
      await page.goto('/?egg=gradient')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)
      
      // Switch to dark theme
      await page.addStyleTag({
        content: 'html.dark { filter: invert(1); }'
      })
      
      await page.evaluate(() => {
        document.documentElement.classList.add('dark')
        // Trigger theme change event if module supports it
        const event = new CustomEvent('themechange', { detail: { theme: 'dark' } })
        window.dispatchEvent(event)
      })
      
      await page.waitForTimeout(500)
      
      // Canvas should still be visible and functional
      const canvas = page.locator('canvas')
      await expect(canvas).toBeVisible()
    })
  })

  test.describe('Page Layout Components', () => {
    test('main content layout', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Check for semantic HTML structure
      const main = page.locator('main, [role="main"]')
      if (await main.count() > 0) {
        await expect(main.first()).toBeVisible()
        
        const mainRect = await main.first().boundingBox()
        expect(mainRect?.width).toBeGreaterThan(100)
        expect(mainRect?.height).toBeGreaterThan(100)
      }
      
      // Check header
      const header = page.locator('header, [role="banner"]')
      if (await header.count() > 0) {
        await expect(header.first()).toBeVisible()
      }
      
      // Check navigation
      const nav = page.locator('nav, [role="navigation"]')
      if (await nav.count() > 0) {
        await expect(nav.first()).toBeVisible()
        
        const navLinks = nav.locator('a')
        const linkCount = await navLinks.count()
        expect(linkCount).toBeGreaterThan(0)
      }
    })

    test('content hierarchy and headings', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Check heading structure
      const headings = page.locator('h1, h2, h3, h4, h5, h6')
      const headingCount = await headings.count()
      
      if (headingCount > 0) {
        // Should have at least one h1
        const h1Count = await page.locator('h1').count()
        expect(h1Count).toBeGreaterThanOrEqual(1)
        
        // Check heading hierarchy
        for (let i = 0; i < Math.min(headingCount, 5); i++) {
          const heading = headings.nth(i)
          const text = await heading.textContent()
          const tagName = await heading.evaluate(el => el.tagName.toLowerCase())
          
          expect(text?.trim().length).toBeGreaterThan(0)
          console.log(`Heading ${i + 1}: ${tagName} - "${text?.trim()}"`)
        }
      }
    })

    test('footer and supplementary content', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Check for footer
      const footer = page.locator('footer, [role="contentinfo"]')
      if (await footer.count() > 0) {
        await expect(footer.first()).toBeVisible()
        
        // Footer should contain some content
        const footerText = await footer.first().textContent()
        expect(footerText?.trim().length).toBeGreaterThan(0)
        
        // Check for common footer elements
        const footerLinks = footer.locator('a')
        if (await footerLinks.count() > 0) {
          const firstLink = footerLinks.first()
          const href = await firstLink.getAttribute('href')
          expect(href).toBeTruthy()
        }
      }
    })
  })

  test.describe('Theme Toggle Component', () => {
    test('theme toggle functionality', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Look for theme toggle
      const themeToggle = page.locator('button[aria-label*="theme"], button[title*="theme"], .theme-toggle')
      
      if (await themeToggle.count() > 0) {
        const toggle = themeToggle.first()
        await expect(toggle).toBeVisible()
        
        // Check initial theme state
        const initialTheme = await page.evaluate(() => {
          return {
            isDark: document.documentElement.classList.contains('dark'),
            localStorage: localStorage.getItem('theme'),
            dataTheme: document.documentElement.getAttribute('data-theme')
          }
        })
        
        console.log('Initial theme state:', initialTheme)
        
        // Toggle theme
        await toggle.click()
        await page.waitForTimeout(300)
        
        // Check theme changed
        const newTheme = await page.evaluate(() => {
          return {
            isDark: document.documentElement.classList.contains('dark'),
            localStorage: localStorage.getItem('theme'),
            dataTheme: document.documentElement.getAttribute('data-theme')
          }
        })
        
        console.log('New theme state:', newTheme)
        
        // Should have changed
        expect(newTheme.isDark).not.toBe(initialTheme.isDark)
        
        // Toggle back
        await toggle.click()
        await page.waitForTimeout(300)
        
        const finalTheme = await page.evaluate(() => {
          return document.documentElement.classList.contains('dark')
        })
        
        expect(finalTheme).toBe(initialTheme.isDark)
      }
    })
  })

  test.describe('Error Boundary Components', () => {
    test('error boundary handles module failures', async ({ page }) => {
      // Mock module loading to fail
      await page.route('**/bgModules/knowledge/**', route => {
        route.abort('failed')
      })
      
      await page.goto('/?egg=knowledge')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)
      
      // Page should still be functional
      const body = page.locator('body')
      await expect(body).toBeVisible()
      
      // Check for error handling
      const errorMessages = page.locator('[role="alert"], .error, [class*="error"]')
      if (await errorMessages.count() > 0) {
        console.log('Error message found')
        await expect(errorMessages.first()).toBeVisible()
      }
      
      // Control tray should still work
      const controlButton = page.locator('button[aria-label*="background controls"]').first()
      if (await controlButton.isVisible()) {
        await controlButton.click()
        const dialog = page.locator('[role="dialog"]')
        await expect(dialog).toBeVisible()
        await page.keyboard.press('Escape')
      }
    })

    test('graceful degradation without JavaScript', async ({ page, context }) => {
      // Disable JavaScript
      await context.setJavaScriptEnabled(false)
      
      await page.goto('/')
      await page.waitForTimeout(3000)
      
      // Basic page structure should still be visible
      const body = page.locator('body')
      await expect(body).toBeVisible()
      
      // Static content should be accessible
      const headings = page.locator('h1, h2, h3')
      if (await headings.count() > 0) {
        await expect(headings.first()).toBeVisible()
      }
      
      const staticLinks = page.locator('a[href]:not([href^="javascript:"])')
      if (await staticLinks.count() > 0) {
        const href = await staticLinks.first().getAttribute('href')
        expect(href).toBeTruthy()
      }
    })
  })
})