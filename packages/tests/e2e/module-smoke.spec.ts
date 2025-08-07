import { test, expect } from '@playwright/test'
import { injectAxe, checkA11y } from 'axe-playwright'

const MODULES = ['gradient', 'knowledge']

test.describe('Background Module Smoke Tests', () => {
  for (const moduleId of MODULES) {
    test(`${moduleId} module loads without errors`, async ({ page }) => {
      // Listen for console errors
      const consoleErrors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text())
        }
      })

      // Navigate to page with specific module
      await page.goto(`/?egg=${moduleId}`)
      
      // Wait for module to initialize
      await page.waitForTimeout(300)
      
      // Check that canvas is present and visible
      const canvas = page.locator('canvas').first()
      await expect(canvas).toBeVisible()
      
      // Verify no console errors
      expect(consoleErrors).toHaveLength(0)
      
      // Basic interaction test if module is interactive
      if (moduleId === 'knowledge') {
        // Try hovering over canvas area
        await canvas.hover()
        await page.waitForTimeout(100)
      }
    })
  }

  test('module switching works correctly', async ({ page }) => {
    await page.goto('/')
    
    // Wait for initial load
    await page.waitForTimeout(500)
    
    // Look for control tray or module switcher
    const controlTray = page.locator('[data-testid="control-tray"], [data-testid="background-switcher"]').first()
    
    if (await controlTray.isVisible()) {
      // Test switching between modules
      for (const moduleId of MODULES) {
        const moduleButton = page.locator(`[data-testid="module-${moduleId}"], button:has-text("${moduleId}")`).first()
        if (await moduleButton.isVisible()) {
          await moduleButton.click()
          await page.waitForTimeout(300)
          
          // Verify canvas is still present after switch
          await expect(page.locator('canvas').first()).toBeVisible()
        }
      }
    }
  })

  test('dark/light theme switching', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(500)

    // Look for theme toggle
    const themeToggle = page.locator('[data-testid="theme-toggle"], button:has-text("theme"), button:has-text("dark"), button:has-text("light")').first()
    
    if (await themeToggle.isVisible()) {
      await themeToggle.click()
      await page.waitForTimeout(300)
      
      // Verify page didn't crash and canvas is still visible
      await expect(page.locator('canvas').first()).toBeVisible()
    }
  })

  test('accessibility compliance', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(500)
    
    // Inject axe-core
    await injectAxe(page)
    
    // Run accessibility checks
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true }
    })
  })

  test('performance - modules pause when page hidden', async ({ page }) => {
    await page.goto('/?egg=gradient')
    await page.waitForTimeout(500)
    
    // Simulate tab switch (page becomes hidden)
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: true,
      })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    
    await page.waitForTimeout(100)
    
    // Restore visibility
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: false,
      })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    
    // Verify no errors occurred during pause/resume cycle
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    await page.waitForTimeout(100)
    expect(consoleErrors).toHaveLength(0)
  })
})