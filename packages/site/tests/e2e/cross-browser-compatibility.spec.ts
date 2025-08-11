/**
 * Cross-Browser Compatibility Testing Suite
 * Tests basic functionality across different browsers and devices
 * Browser configurations are handled in playwright.config.ts
 */

import { test, expect } from '@playwright/test'

test.describe('Cross-Browser Compatibility Tests', () => {
  
  test('basic page functionality', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Page should load successfully across all browsers
    const body = page.locator('body')
    await expect(body).toBeVisible()
    
    // Check for critical elements
    const main = page.locator('main, [role="main"], .main-content, #___gatsby')
    if (await main.count() > 0) {
      await expect(main.first()).toBeVisible()
    }
    
    // Navigation should be present
    const nav = page.locator('nav, [role="navigation"]')
    if (await nav.count() > 0) {
      await expect(nav.first()).toBeVisible()
    }
    
    // Check that links are functional
    const navLinks = page.locator('nav a, [role="navigation"] a')
    if (await navLinks.count() > 0) {
      await expect(navLinks.first()).toBeVisible()
    }
  })

  test('canvas support', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Test canvas support
    const hasCanvas = await page.evaluate(() => {
      const canvas = document.createElement('canvas')
      const has2d = !!(canvas.getContext && canvas.getContext('2d'))
      const hasWebGL = !!(canvas.getContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')))
      return { has2d, hasWebGL }
    })
    
    expect(hasCanvas.has2d).toBe(true)
    console.log('Canvas support:', hasCanvas)
  })

  test('keyboard navigation', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Test tab navigation
    await page.keyboard.press('Tab')
    const firstFocus = await page.evaluate(() => {
      const activeEl = document.activeElement
      return activeEl ? {
        tagName: activeEl.tagName,
        role: activeEl.getAttribute('role'),
        isInteractive: activeEl.matches('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])')
      } : null
    })
    
    if (firstFocus) {
      expect(firstFocus.isInteractive).toBe(true)
      console.log('First tab focus:', firstFocus)
    }
  })

  test('responsive layout', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check that content adapts to viewport
    const viewport = page.viewportSize()
    const isMobile = viewport ? viewport.width < 768 : false
    
    // Navigation should be accessible on all sizes
    const nav = page.locator('nav, [role="navigation"]')
    if (await nav.count() > 0) {
      await expect(nav.first()).toBeVisible()
    }
    
    // Content should be readable
    const content = page.locator('main, #___gatsby, body')
    if (await content.count() > 0) {
      await expect(content.first()).toBeVisible()
    }
  })

  test('local storage support', async ({ page }) => {
    await page.goto('/')
    
    // Test localStorage functionality
    const localStorageWorks = await page.evaluate(() => {
      try {
        const testKey = '__playwright_test__'
        localStorage.setItem(testKey, 'test')
        const value = localStorage.getItem(testKey)
        localStorage.removeItem(testKey)
        return value === 'test'
      } catch {
        return false
      }
    })
    
    expect(localStorageWorks).toBe(true)
    console.log('localStorage support:', localStorageWorks)
  })

  test('css features support', async ({ page }) => {
    await page.goto('/')
    
    // Test modern CSS features
    const cssSupport = await page.evaluate(() => {
      const testEl = document.createElement('div')
      document.body.appendChild(testEl)
      
      const supports = {
        flexbox: CSS.supports('display', 'flex'),
        grid: CSS.supports('display', 'grid'),
        customProperties: CSS.supports('--custom: value'),
        transforms: CSS.supports('transform', 'translateX(0)'),
        transitions: CSS.supports('transition', 'opacity 0.3s')
      }
      
      document.body.removeChild(testEl)
      return supports
    })
    
    // All modern browsers should support these
    expect(cssSupport.flexbox).toBe(true)
    expect(cssSupport.customProperties).toBe(true)
    
    console.log('CSS support:', cssSupport)
  })

  test('javascript api support', async ({ page }) => {
    await page.goto('/')
    
    // Test JavaScript API availability
    const apiSupport = await page.evaluate(() => ({
      fetch: typeof fetch !== 'undefined',
      promises: typeof Promise !== 'undefined',
      es6Classes: typeof class {} === 'function',
      arrow: (() => typeof (() => {}) === 'function')(),
      intersectionObserver: typeof IntersectionObserver !== 'undefined',
      performanceObserver: typeof PerformanceObserver !== 'undefined'
    }))
    
    expect(apiSupport.fetch).toBe(true)
    expect(apiSupport.promises).toBe(true)
    
    console.log('JavaScript API support:', apiSupport)
  })

  test('error handling', async ({ page }) => {
    const consoleMessages: string[] = []
    const errors: string[] = []
    
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`)
    })
    
    page.on('pageerror', err => {
      errors.push(err.message)
    })
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Allow some time for any async errors
    await page.waitForTimeout(2000)
    
    // Check for critical errors (excluding warnings)
    const criticalErrors = errors.filter(err => 
      !err.includes('favicon') && 
      !err.includes('analytics') &&
      !err.includes('third-party') &&
      !err.includes('Non-Error promise rejection captured')
    )
    
    console.log('Console messages:', consoleMessages.slice(-5))
    console.log('Errors:', errors.length)
    
    // Should not have critical JavaScript errors
    expect(criticalErrors.length).toBeLessThanOrEqual(1)
  })

  test('performance baseline', async ({ page }) => {
    await page.goto('/')
    
    // Measure basic performance metrics
    const metrics = await page.evaluate(() => {
      return new Promise(resolve => {
        // Wait for page to settle
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
          const paint = performance.getEntriesByType('paint')
          
          const fcp = paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0
          const loadTime = navigation.loadEventEnd - navigation.loadEventStart
          
          resolve({
            loadTime: Math.round(loadTime),
            firstContentfulPaint: Math.round(fcp),
            domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.navigationStart)
          })
        }, 1000)
      })
    })
    
    console.log('Performance metrics:', metrics)
    
    // Basic performance expectations (generous for cross-browser testing)
    expect((metrics as any).loadTime).toBeLessThan(8000) // 8 seconds
    expect((metrics as any).domContentLoaded).toBeLessThan(5000) // 5 seconds
  })
})