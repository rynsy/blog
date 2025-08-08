import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const BASE_URL = 'http://localhost:9000'
const SCREENSHOT_DIR = '/home/ryan/code/lab/projects/personal_site/screenshots'

test.describe('Design Quality Assessment', () => {
  test.beforeAll(async () => {
    // Ensure screenshots directory exists
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
    }
  })

  test('capture homepage desktop view', async ({ page }) => {
    console.log('Capturing desktop homepage...')
    
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    
    try {
      await page.goto(BASE_URL, { timeout: 30000 })
      
      // Wait for page to fully load
      await page.waitForLoadState('networkidle')
      
      // Take full page screenshot
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'homepage-desktop.png'),
        fullPage: true
      })
      
      console.log('Desktop homepage screenshot saved')
      
      // Verify page loaded correctly
      await expect(page).toHaveTitle(/.+/)
    } catch (error) {
      console.error('Error capturing desktop homepage:', error)
      throw error
    }
  })

  test('capture homepage mobile view', async ({ page }) => {
    console.log('Capturing mobile homepage...')
    
    // Set mobile viewport (iPhone 12)
    await page.setViewportSize({ width: 390, height: 844 })
    
    try {
      await page.goto(BASE_URL, { timeout: 30000 })
      
      // Wait for page to fully load
      await page.waitForLoadState('networkidle')
      
      // Take full page screenshot
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'homepage-mobile.png'),
        fullPage: true
      })
      
      console.log('Mobile homepage screenshot saved')
    } catch (error) {
      console.error('Error capturing mobile homepage:', error)
      throw error
    }
  })

  test('capture blog page if accessible', async ({ page }) => {
    console.log('Looking for blog page...')
    
    await page.setViewportSize({ width: 1920, height: 1080 })
    
    // Try common blog URLs
    const blogUrls = [
      `${BASE_URL}/blog`,
      `${BASE_URL}/blog/`,
      `${BASE_URL}/posts`,
      `${BASE_URL}/articles`
    ]

    let blogFound = false
    
    for (const url of blogUrls) {
      try {
        console.log(`Trying blog URL: ${url}`)
        const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 })
        if (response && response.status() === 200) {
          await page.screenshot({
            path: path.join(SCREENSHOT_DIR, 'blog-page.png'),
            fullPage: true
          })
          blogFound = true
          console.log(`Blog page found and captured at: ${url}`)
          break
        }
      } catch (e) {
        console.log(`Blog URL ${url} not accessible`)
        continue
      }
    }

    if (!blogFound) {
      console.log('Direct blog URLs not found, checking homepage for blog links...')
      
      try {
        await page.goto(BASE_URL, { timeout: 15000 })
        await page.waitForLoadState('networkidle')
        
        const blogLinks = await page.locator('a').evaluateAll(links => 
          links
            .filter(link => {
              const text = link.textContent?.toLowerCase() || ''
              const href = link.getAttribute('href') || ''
              return text.includes('blog') || text.includes('post') || text.includes('article') ||
                     href.includes('blog') || href.includes('post') || href.includes('article')
            })
            .map(link => link.getAttribute('href'))
            .filter(href => href !== null)
        )

        if (blogLinks.length > 0) {
          const blogLink = blogLinks[0]!
          const fullUrl = blogLink.startsWith('http') ? blogLink : `${BASE_URL}${blogLink}`
          console.log(`Found blog link: ${fullUrl}`)
          
          await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 15000 })
          await page.screenshot({
            path: path.join(SCREENSHOT_DIR, 'blog-page.png'),
            fullPage: true
          })
          blogFound = true
          console.log('Blog page captured via homepage link')
        }
      } catch (e) {
        console.log('Error searching for blog links on homepage')
      }
    }

    if (!blogFound) {
      console.log('Blog page not found - this is expected if no blog exists')
    }
  })

  test('capture about page if accessible', async ({ page }) => {
    console.log('Looking for about page...')
    
    await page.setViewportSize({ width: 1920, height: 1080 })
    
    // Try common about URLs
    const aboutUrls = [
      `${BASE_URL}/about`,
      `${BASE_URL}/about/`,
      `${BASE_URL}/about-me`,
      `${BASE_URL}/bio`
    ]

    let aboutFound = false
    
    for (const url of aboutUrls) {
      try {
        console.log(`Trying about URL: ${url}`)
        const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 })
        if (response && response.status() === 200) {
          await page.screenshot({
            path: path.join(SCREENSHOT_DIR, 'about-page.png'),
            fullPage: true
          })
          aboutFound = true
          console.log(`About page found and captured at: ${url}`)
          break
        }
      } catch (e) {
        console.log(`About URL ${url} not accessible`)
        continue
      }
    }

    if (!aboutFound) {
      console.log('Direct about URLs not found, checking homepage for about links...')
      
      try {
        await page.goto(BASE_URL, { timeout: 15000 })
        await page.waitForLoadState('networkidle')
        
        const aboutLinks = await page.locator('a').evaluateAll(links => 
          links
            .filter(link => {
              const text = link.textContent?.toLowerCase() || ''
              const href = link.getAttribute('href') || ''
              return text.includes('about') || text.includes('bio') || text.includes('profile') ||
                     href.includes('about') || href.includes('bio') || href.includes('profile')
            })
            .map(link => link.getAttribute('href'))
            .filter(href => href !== null)
        )

        if (aboutLinks.length > 0) {
          const aboutLink = aboutLinks[0]!
          const fullUrl = aboutLink.startsWith('http') ? aboutLink : `${BASE_URL}${aboutLink}`
          console.log(`Found about link: ${fullUrl}`)
          
          await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 15000 })
          await page.screenshot({
            path: path.join(SCREENSHOT_DIR, 'about-page.png'),
            fullPage: true
          })
          aboutFound = true
          console.log('About page captured via homepage link')
        }
      } catch (e) {
        console.log('Error searching for about links on homepage')
      }
    }

    if (!aboutFound) {
      console.log('About page not found - this is expected if no about page exists')
    }
  })
})