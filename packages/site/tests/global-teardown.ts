import { FullConfig } from '@playwright/test'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Running global test teardown...')
  
  // Log final test statistics if available
  const testResultsDir = process.cwd() + '/test-results'
  
  try {
    const fs = await import('fs')
    const resultsFiles = await fs.promises.readdir(testResultsDir).catch(() => [])
    console.log(`📁 Test artifacts saved to: ${testResultsDir}`)
    console.log(`📄 Files generated: ${resultsFiles.length}`)
  } catch (error) {
    console.log('Note: Could not read test results directory')
  }
  
  console.log('✅ Global teardown completed')
}

export default globalTeardown