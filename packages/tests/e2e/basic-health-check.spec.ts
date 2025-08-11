import { test, expect } from '@playwright/test'

test.describe('Basic Health Check', () => {
  test('homepage loads successfully', async ({ page }) => {
    console.log('Starting basic health check test...')
    console.log('Base URL:', process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:8000')
    
    try {
      await page.goto('/', { 
        waitUntil: 'domcontentloaded',
        timeout: 30000
      })
      
      // Wait for the page to be ready
      await page.waitForTimeout(2000)
      
      // Check if page loaded
      const title = await page.title()
      console.log('Page title:', title)
      
      // Page should have a title
      expect(title.length).toBeGreaterThan(0)
      
      // Check if body is visible
      const body = page.locator('body')
      await expect(body).toBeVisible({ timeout: 10000 })
      
      // Try to find main content
      const main = page.locator('main, [role="main"], .main-content, #___gatsby')
      const mainCount = await main.count()
      console.log('Main content elements found:', mainCount)
      
      if (mainCount > 0) {
        await expect(main.first()).toBeVisible()
      } else {
        // Just check that something loaded
        const allElements = page.locator('div, section, article, header')
        const elementCount = await allElements.count()
        console.log('Total structural elements found:', elementCount)
        expect(elementCount).toBeGreaterThan(0)
      }
      
      console.log('Basic health check passed!')
      
    } catch (error) {
      console.error('Health check failed:', error)
      
      // Log some debug info
      const url = page.url()
      console.log('Current URL:', url)
      
      const content = await page.content()
      console.log('Page content length:', content.length)
      console.log('First 500 chars:', content.substring(0, 500))
      
      throw error
    }
  })
  
  test('basic DOM structure exists', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle', { timeout: 30000 })
    
    // Check for basic HTML structure
    const html = page.locator('html')
    await expect(html).toBeVisible()
    
    const head = page.locator('head')
    await expect(head).toBeAttached()
    
    const body = page.locator('body')
    await expect(body).toBeVisible()
    
    console.log('Basic DOM structure test passed!')
  })
})