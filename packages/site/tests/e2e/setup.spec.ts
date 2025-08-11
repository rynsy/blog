import { test as setup, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

setup('verify site is accessible and ready', async ({ page }) => {
  console.log('🔧 Running test setup verification...')
  
  const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:8000'
  console.log(`Base URL: ${baseURL}`)
  
  // Navigate to the site
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 })
  
  // Verify basic page structure
  const body = page.locator('body')
  await expect(body).toBeVisible()
  
  const title = await page.title()
  console.log(`Page title: "${title}"`)
  expect(title.length).toBeGreaterThan(0)
  
  // Check for main content areas
  const contentSelectors = ['main', '[role="main"]', '.main-content', '#___gatsby']
  let foundContent = false
  
  for (const selector of contentSelectors) {
    const element = page.locator(selector)
    if (await element.count() > 0) {
      console.log(`Found content area: ${selector}`)
      foundContent = true
      break
    }
  }
  
  if (!foundContent) {
    // Check for any structural elements
    const structuralElements = page.locator('div, section, article, header, nav')
    const count = await structuralElements.count()
    console.log(`Found ${count} structural elements`)
    expect(count).toBeGreaterThan(0)
  }
  
  // Store test configuration
  const testResultsDir = path.join(process.cwd(), 'test-results')
  if (!fs.existsSync(testResultsDir)) {
    fs.mkdirSync(testResultsDir, { recursive: true })
  }
  
  const testConfig = {
    baseURL,
    timestamp: new Date().toISOString(),
    title,
    hasContent: foundContent
  }
  
  await fs.promises.writeFile(
    path.join(testResultsDir, 'setup-config.json'),
    JSON.stringify(testConfig, null, 2)
  )
  
  console.log('✅ Setup verification completed successfully')
})