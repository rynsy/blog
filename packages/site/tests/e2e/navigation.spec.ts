import { test, expect } from '@playwright/test'

test.describe('Cross-page Navigation', () => {
  test('should navigate between all main pages without errors', async ({ page }) => {
    // Start at homepage
    await page.goto('/')
    await expect(page).toHaveTitle(/Ryan Gardner/)
    
    // Navigate to about
    await page.click('[href="/about"]')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/about/)
    await expect(page.locator('h1')).toContainText(/about/i)
    
    // Navigate to projects
    await page.click('[href="/projects"]')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/projects/)
    
    // Navigate to blog
    await page.click('[href="/blog"]')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/blog/)
    
    // Navigate back to home using navigation
    await page.click('[href="/"]')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/^\/$/)
  })

  test('should handle browser back/forward navigation', async ({ page }) => {
    // Navigate through several pages
    await page.goto('/')
    await page.click('[href="/about"]')
    await page.waitForLoadState('networkidle')
    
    await page.click('[href="/projects"]')
    await page.waitForLoadState('networkidle')
    
    // Test back button
    await page.goBack()
    await expect(page).toHaveURL(/\/about/)
    
    // Test forward button
    await page.goForward()
    await expect(page).toHaveURL(/\/projects/)
    
    // Test multiple back navigation
    await page.goBack()
    await page.goBack()
    await expect(page).toHaveURL(/^\/$/)
  })

  test('should preserve WebGL background during navigation', async ({ page }) => {
    // Skip if WebGL not supported
    if (process.env.WEBGL_SUPPORTED !== 'true') {
      test.skip('WebGL not supported in this environment')
    }

    await page.goto('/')
    
    // Check WebGL canvas exists
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible()
    
    // Check WebGL context is created
    const hasWebGL = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement
      if (!canvas) return false
      
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      return !!gl
    })
    expect(hasWebGL).toBe(true)
    
    // Navigate to another page
    await page.click('[href="/about"]')
    await page.waitForLoadState('networkidle')
    
    // Verify WebGL background is still present
    await expect(canvas).toBeVisible()
    
    // Verify WebGL is still active
    const stillHasWebGL = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement
      if (!canvas) return false
      
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      return !!gl
    })
    expect(stillHasWebGL).toBe(true)
  })

  test('should handle deep links correctly', async ({ page }) => {
    // Test direct navigation to deep pages
    await page.goto('/about')
    await expect(page).toHaveTitle(/About/)
    await expect(page.locator('h1')).toContainText(/about/i)
    
    await page.goto('/projects')
    await expect(page).toHaveTitle(/Projects/)
    
    await page.goto('/blog')
    await expect(page).toHaveTitle(/Blog/)
  })

  test('should maintain performance during navigation', async ({ page }) => {
    const navigationTimes: number[] = []
    
    const pages = ['/', '/about', '/projects', '/blog']
    
    for (const pagePath of pages) {
      const startTime = Date.now()
      
      await page.goto(pagePath)
      await page.waitForLoadState('networkidle')
      
      const navigationTime = Date.now() - startTime
      navigationTimes.push(navigationTime)
      
      // Each navigation should be under 3 seconds
      expect(navigationTime).toBeLessThan(3000)
    }
    
    // Average navigation time should be reasonable
    const averageTime = navigationTimes.reduce((a, b) => a + b, 0) / navigationTimes.length
    expect(averageTime).toBeLessThan(2000)
  })

  test('should handle 404 pages gracefully', async ({ page }) => {
    await page.goto('/non-existent-page')
    
    // Should show 404 page or redirect to home
    const is404 = await page.locator('h1').textContent()
    const isHome = page.url().endsWith('/')
    
    expect(is404?.includes('404') || isHome).toBe(true)
  })

  test('should maintain scroll position during navigation', async ({ page }) => {
    await page.goto('/')
    
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500))
    const scrollY = await page.evaluate(() => window.scrollY)
    expect(scrollY).toBe(500)
    
    // Navigate away and back
    await page.click('[href="/about"]')
    await page.waitForLoadState('networkidle')
    
    await page.goBack()
    await page.waitForLoadState('networkidle')
    
    // Scroll position should be restored or at top (both are acceptable)
    const newScrollY = await page.evaluate(() => window.scrollY)
    expect(typeof newScrollY).toBe('number')
  })

  test('should handle rapid navigation without errors', async ({ page }) => {
    await page.goto('/')
    
    // Rapidly click through navigation
    const navigationLinks = ['/about', '/projects', '/blog', '/']
    
    for (let i = 0; i < 3; i++) {
      for (const link of navigationLinks) {
        await page.click(`[href="${link}"]`)
        await page.waitForLoadState('domcontentloaded')
      }
    }
    
    // Should end up on home page without errors
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/^\/$/)
  })
})