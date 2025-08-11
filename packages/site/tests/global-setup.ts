import { chromium, FullConfig } from '@playwright/test'
import fs from 'fs'
import path from 'path'

async function globalSetup(config: FullConfig) {
  console.log('🔧 Starting global test setup...')
  
  // Ensure test results directory exists
  const testResultsDir = path.join(process.cwd(), 'test-results')
  if (!fs.existsSync(testResultsDir)) {
    fs.mkdirSync(testResultsDir, { recursive: true })
  }
  
  // Get the base URL from config
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:8000'
  console.log(`📍 Base URL: ${baseURL}`)
  
  // Store basic configuration
  const testConfig = {
    baseURL,
    timestamp: new Date().toISOString(),
    dockerTest: process.env.PLAYWRIGHT_TEST_BASE_URL ? true : false
  }
  
  // Write configuration file for tests to reference
  await fs.promises.writeFile(
    path.join(testResultsDir, 'global-config.json'),
    JSON.stringify(testConfig, null, 2)
  )
  
  console.log('✅ Global setup completed successfully')
}

export default globalSetup