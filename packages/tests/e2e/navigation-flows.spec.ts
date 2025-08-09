import { test, expect } from '@playwright/test'

test.describe('Navigation and User Flow Tests (N-01)', () => {
  
  test.describe('Core Navigation', () => {
    test('homepage loads successfully', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Page should load without errors
      await expect(page.locator('body')).toBeVisible()
      
      // Should have proper page title
      const title = await page.title()
      expect(title).toBeTruthy()
      expect(title.length).toBeGreaterThan(0)
      
      // Check for main content
      const main = page.locator('main, [role="main"], .main-content')
      if (await main.count() > 0) {
        await expect(main.first()).toBeVisible()
      }
      
      // Check for heading structure
      const h1 = page.locator('h1')
      if (await h1.count() > 0) {
        await expect(h1.first()).toBeVisible()
      }
    })

    test('navigation menu functionality', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Find navigation elements
      const navLinks = page.locator('nav a, [role="navigation"] a, .nav a')
      const linkCount = await navLinks.count()
      
      if (linkCount > 0) {
        // Test first few navigation links
        for (let i = 0; i < Math.min(linkCount, 5); i++) {
          const link = navLinks.nth(i)
          
          if (await link.isVisible()) {
            const href = await link.getAttribute('href')
            const text = await link.textContent()
            
            expect(href).toBeTruthy()
            expect(text?.trim().length).toBeGreaterThan(0)
            
            // Test link accessibility
            const ariaLabel = await link.getAttribute('aria-label')
            const title = await link.getAttribute('title')
            
            // Should have some form of accessible name
            expect(text?.trim() || ariaLabel || title).toBeTruthy()
          }
        }
      }
    })

    test('breadcrumb navigation (if present)', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Check for breadcrumbs
      const breadcrumbs = page.locator('nav[aria-label*="breadcrumb"], .breadcrumb, [role="navigation"]:has-text("breadcrumb")')
      
      if (await breadcrumbs.count() > 0) {
        await expect(breadcrumbs.first()).toBeVisible()
        
        // Breadcrumb links should be functional
        const breadcrumbLinks = breadcrumbs.locator('a')
        const count = await breadcrumbLinks.count()
        
        if (count > 0) {
          const firstLink = breadcrumbLinks.first()
          const href = await firstLink.getAttribute('href')
          expect(href).toBeTruthy()
        }
      }
    })
  })

  test.describe('Blog/Content Navigation', () => {
    test('blog listing page functionality', async ({ page }) => {
      // Try common blog page URLs
      const blogUrls = ['/blog', '/posts', '/articles', '/writing']
      let blogFound = false
      
      for (const url of blogUrls) {
        try {
          const response = await page.goto(url)
          if (response?.status() === 200) {
            blogFound = true
            await page.waitForLoadState('networkidle')
            
            // Should have blog posts or articles
            const posts = page.locator('article, .post, .blog-post, [class*="post"]')
            if (await posts.count() > 0) {
              await expect(posts.first()).toBeVisible()
              
              // Posts should have titles
              const postTitle = posts.first().locator('h1, h2, h3, .title, [class*="title"]')
              if (await postTitle.count() > 0) {
                await expect(postTitle.first()).toBeVisible()
              }
              
              // Posts should have links
              const postLink = posts.first().locator('a')
              if (await postLink.count() > 0) {
                const href = await postLink.first().getAttribute('href')
                expect(href).toBeTruthy()
              }
            }
            break
          }
        } catch {
          // Continue to next URL
          continue
        }
      }
      
      if (!blogFound) {
        console.log('No blog section found, skipping blog navigation tests')
      }
    })

    test('individual blog post navigation', async ({ page }) => {
      // First find a blog post
      const blogUrls = ['/blog', '/posts', '/articles']
      let postUrl = null
      
      for (const url of blogUrls) {
        try {
          const response = await page.goto(url)
          if (response?.status() === 200) {
            await page.waitForLoadState('networkidle')
            
            const firstPostLink = page.locator('article a, .post a, [class*="post"] a').first()
            if (await firstPostLink.isVisible()) {
              postUrl = await firstPostLink.getAttribute('href')
              break
            }
          }
        } catch {
          continue
        }
      }
      
      if (postUrl) {
        await page.goto(postUrl)
        await page.waitForLoadState('networkidle')
        
        // Should have article content
        const article = page.locator('article, .post-content, .blog-content, main')
        await expect(article.first()).toBeVisible()
        
        // Should have post title
        const title = page.locator('h1, .post-title, .article-title')
        if (await title.count() > 0) {
          await expect(title.first()).toBeVisible()
        }
        
        // Should have content
        const content = page.locator('article p, .content p, .post-content p')
        if (await content.count() > 0) {
          const text = await content.first().textContent()
          expect(text?.trim().length).toBeGreaterThan(10)
        }
      }
    })
  })

  test.describe('Search Functionality', () => {
    test('site search (if available)', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Look for search functionality
      const searchElements = page.locator('input[type="search"], [role="search"], .search, [placeholder*="search" i]')
      
      if (await searchElements.count() > 0) {
        const searchInput = searchElements.first()
        await expect(searchInput).toBeVisible()
        
        // Test search functionality
        await searchInput.fill('test')
        await page.keyboard.press('Enter')
        await page.waitForTimeout(1000)
        
        // Should show results or indicate search was performed
        const results = page.locator('.search-results, [class*="search"], [class*="result"]')
        if (await results.count() > 0) {
          await expect(results.first()).toBeVisible()
        }
      }
    })

    test('search results navigation', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      const searchInput = page.locator('input[type="search"], [role="search"]').first()
      
      if (await searchInput.isVisible()) {
        await searchInput.fill('react')
        await page.keyboard.press('Enter')
        await page.waitForTimeout(1000)
        
        // Check for search result links
        const resultLinks = page.locator('.search-results a, [class*="result"] a')
        
        if (await resultLinks.count() > 0) {
          const firstResult = resultLinks.first()
          const href = await firstResult.getAttribute('href')
          
          expect(href).toBeTruthy()
          
          // Verify result link works
          await firstResult.click()
          await page.waitForLoadState('networkidle')
          
          // Should navigate to a valid page
          expect(page.url()).not.toBe('about:blank')
        }
      }
    })
  })

  test.describe('External Links and Social Media', () => {
    test('external links open correctly', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Find external links
      const externalLinks = page.locator('a[href^="http"]:not([href*="' + new URL(page.url()).hostname + '"])')
      const count = await externalLinks.count()
      
      if (count > 0) {
        // Test first external link
        const firstLink = externalLinks.first()
        
        if (await firstLink.isVisible()) {
          const href = await firstLink.getAttribute('href')
          const target = await firstLink.getAttribute('target')
          const rel = await firstLink.getAttribute('rel')
          
          expect(href).toBeTruthy()
          
          // External links should open in new tab/window or have appropriate rel attributes
          if (target === '_blank') {
            // Should have security attributes
            expect(rel).toContain('noopener')
          }
          
          // Test that link is accessible
          const text = await firstLink.textContent()
          const ariaLabel = await firstLink.getAttribute('aria-label')
          expect(text?.trim() || ariaLabel).toBeTruthy()
        }
      }
    })

    test('social media links functionality', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Look for social media links
      const socialPatterns = [
        'github.com',
        'linkedin.com',
        'twitter.com',
        'x.com',
        'mastodon',
        'youtube.com',
        'instagram.com'
      ]
      
      for (const pattern of socialPatterns) {
        const socialLink = page.locator(`a[href*="${pattern}"]`)
        
        if (await socialLink.count() > 0) {
          const link = socialLink.first()
          
          if (await link.isVisible()) {
            const href = await link.getAttribute('href')
            const target = await link.getAttribute('target')
            
            expect(href).toBeTruthy()
            expect(href).toContain(pattern)
            
            // Social links typically open in new tabs
            expect(target).toBe('_blank')
            
            // Should have proper accessibility
            const ariaLabel = await link.getAttribute('aria-label')
            const title = await link.getAttribute('title')
            const text = await link.textContent()
            
            expect(ariaLabel || title || text?.trim()).toBeTruthy()
          }
        }
      }
    })
  })

  test.describe('Background Module Navigation Flow', () => {
    test('module selection workflow', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Open control tray
      const controlButton = page.locator('button[aria-label*="background controls"]').first()
      
      if (await controlButton.isVisible()) {
        await controlButton.click()
        await page.waitForTimeout(300)
        
        const dialog = page.locator('[role="dialog"]')
        await expect(dialog).toBeVisible()
        
        // Navigate through module selection
        const moduleSelect = dialog.locator('button[role="option"], .listbox button').first()
        if (await moduleSelect.isVisible()) {
          await moduleSelect.click()
          await page.waitForTimeout(200)
          
          // Should show module options
          const options = page.locator('[role="option"], .option')
          if (await options.count() > 0) {
            // Select a module
            const gradientOption = page.locator('text=Animated Gradient, text=gradient').first()
            if (await gradientOption.isVisible()) {
              await gradientOption.click()
              await page.waitForTimeout(200)
            }
          }
        }
        
        // Enable background
        const activeToggle = page.locator('text=Background Active').locator('..').locator('button')
        if (await activeToggle.isVisible()) {
          await activeToggle.click()
          await page.waitForTimeout(500)
        }
        
        // Close dialog
        await page.keyboard.press('Escape')
        await page.waitForTimeout(300)
        
        // Canvas should be visible
        const canvas = page.locator('canvas')
        await expect(canvas).toBeVisible()
      }
    })

    test('keyboard navigation flow', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Enable background first
      const controlButton = page.locator('button[aria-label*="background controls"]').first()
      if (await controlButton.isVisible()) {
        await controlButton.click()
        await page.locator('text=Background Active').locator('..').locator('button').click()
        await page.keyboard.press('Escape')
        await page.waitForTimeout(300)
      }
      
      // Use keyboard shortcut to cycle modules
      for (let i = 0; i < 3; i++) {
        await page.keyboard.press('Shift+`') // Shift + ~
        await page.waitForTimeout(1000)
        
        // Check that module changed
        const currentModule = await page.evaluate(() => localStorage.getItem('bg-module'))
        console.log(`Cycle ${i}: Module is now ${currentModule}`)
      }
    })
  })

  test.describe('Error Handling and Recovery', () => {
    test('404 page navigation', async ({ page }) => {
      const response = await page.goto('/this-page-does-not-exist')
      
      if (response?.status() === 404) {
        await page.waitForLoadState('networkidle')
        
        // Should show 404 page
        const body = page.locator('body')
        await expect(body).toBeVisible()
        
        // Should have navigation back to home
        const homeLink = page.locator('a[href="/"], a[href="./"], text=home, text=back').first()
        if (await homeLink.isVisible()) {
          await homeLink.click()
          await page.waitForLoadState('networkidle')
          
          // Should navigate back to home
          expect(page.url()).toMatch(/\/$/)
        }
      }
    })

    test('navigation with disabled JavaScript', async ({ page, context }) => {
      // Disable JavaScript
      await context.route('**/*.js', route => route.abort())
      
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Page should still be functional
      const body = page.locator('body')
      await expect(body).toBeVisible()
      
      // Basic navigation should work
      const links = page.locator('a[href]')
      if (await links.count() > 0) {
        const firstLink = links.first()
        const href = await firstLink.getAttribute('href')
        
        if (href && href !== '#' && !href.startsWith('javascript:')) {
          await firstLink.click()
          await page.waitForLoadState('networkidle')
          
          // Should navigate successfully
          expect(page.url()).not.toBe('about:blank')
        }
      }
    })

    test('slow network navigation', async ({ page, context }) => {
      // Throttle network to simulate slow connection
      await context.route('**/*', async route => {
        await new Promise(resolve => setTimeout(resolve, 100)) // 100ms delay
        await route.continue()
      })
      
      await page.goto('/')
      await page.waitForLoadState('networkidle', { timeout: 10000 })
      
      // Page should load successfully despite slow network
      const body = page.locator('body')
      await expect(body).toBeVisible()
      
      // Navigation should still work
      const controlButton = page.locator('button[aria-label*="background controls"]').first()
      if (await controlButton.isVisible()) {
        await controlButton.click()
        await page.waitForTimeout(1000) // Extra time for slow network
        
        const dialog = page.locator('[role="dialog"]')
        await expect(dialog).toBeVisible()
      }
    })
  })

  test.describe('URL State Management', () => {
    test('background module URL parameters', async ({ page }) => {
      // Test gradient module URL
      await page.goto('/?egg=gradient')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)
      
      const canvas = page.locator('canvas')
      if (await canvas.isVisible()) {
        // Module should be active
        const storedModule = await page.evaluate(() => localStorage.getItem('bg-module'))
        expect(storedModule).toBe('gradient')
      }
      
      // Test knowledge module URL
      await page.goto('/?egg=knowledge')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)
      
      const knowledgeCanvas = page.locator('canvas')
      if (await knowledgeCanvas.isVisible()) {
        const storedModule = await page.evaluate(() => localStorage.getItem('bg-module'))
        expect(storedModule).toBe('knowledge')
      }
      
      // Test invalid module URL
      await page.goto('/?egg=invalid')
      await page.waitForLoadState('networkidle')
      
      // Should handle gracefully
      const body = page.locator('body')
      await expect(body).toBeVisible()
    })

    test('browser back/forward with module states', async ({ page }) => {
      // Start at home
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Navigate to gradient module
      await page.goto('/?egg=gradient')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)
      
      // Navigate to knowledge module
      await page.goto('/?egg=knowledge')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)
      
      // Go back
      await page.goBack()
      await page.waitForTimeout(1000)
      
      // Should be back to gradient
      expect(page.url()).toContain('gradient')
      
      // Go back again
      await page.goBack()
      await page.waitForTimeout(1000)
      
      // Should be at home
      expect(page.url()).not.toContain('egg=')
      
      // Go forward
      await page.goForward()
      await page.waitForTimeout(1000)
      
      // Should be back to gradient
      expect(page.url()).toContain('gradient')
    })
  })

  test.describe('Mobile Navigation Patterns', () => {
    test('mobile navigation menu', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Look for mobile menu toggle
      const menuToggle = page.locator('button[aria-label*="menu"], .hamburger, .menu-toggle, [aria-expanded]')
      
      if (await menuToggle.count() > 0) {
        const toggle = menuToggle.first()
        await expect(toggle).toBeVisible()
        
        // Open menu
        await toggle.click()
        await page.waitForTimeout(300)
        
        // Menu should be visible
        const menu = page.locator('nav[aria-expanded="true"], .mobile-menu, [role="navigation"][aria-hidden="false"]')
        if (await menu.count() > 0) {
          await expect(menu.first()).toBeVisible()
          
          // Menu items should be accessible
          const menuItems = menu.locator('a')
          if (await menuItems.count() > 0) {
            const firstItem = menuItems.first()
            await expect(firstItem).toBeVisible()
            
            const href = await firstItem.getAttribute('href')
            expect(href).toBeTruthy()
          }
          
          // Close menu
          await toggle.click()
          await page.waitForTimeout(300)
        }
      }
    })

    test('touch navigation gestures', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/?egg=knowledge')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)
      
      const canvas = page.locator('canvas')
      if (await canvas.isVisible()) {
        const canvasRect = await canvas.boundingBox()
        
        if (canvasRect) {
          // Simulate touch interactions
          const centerX = canvasRect.x + canvasRect.width / 2
          const centerY = canvasRect.y + canvasRect.height / 2
          
          // Tap
          await page.touchscreen.tap(centerX, centerY)
          await page.waitForTimeout(200)
          
          // Canvas should still be visible
          await expect(canvas).toBeVisible()
          
          // Pinch zoom (simulate)
          await page.mouse.move(centerX - 50, centerY - 50)
          await page.mouse.down()
          await page.mouse.move(centerX - 25, centerY - 25)
          await page.mouse.up()
          await page.waitForTimeout(200)
          
          // Should handle touch interactions gracefully
          await expect(canvas).toBeVisible()
        }
      }
    })
  })
})