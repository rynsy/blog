import { FullConfig } from '@playwright/test'
import fs from 'fs'
import path from 'path'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global test teardown...')
  
  try {
    const testResultsDir = path.join(process.cwd(), 'test-results')
    
    // Generate test summary report
    console.log('📝 Generating test summary report...')
    
    const testConfigPath = path.join(testResultsDir, 'test-config.json')
    let testConfig = null
    
    if (fs.existsSync(testConfigPath)) {
      const configContent = await fs.promises.readFile(testConfigPath, 'utf8')
      testConfig = JSON.parse(configContent)
    }
    
    const summary = {
      completedAt: new Date().toISOString(),
      testEnvironment: {
        baseURL: testConfig?.baseURL || 'unknown',
        dockerTest: process.env.DOCKER_TEST === 'true',
        ci: process.env.CI === 'true',
        webglSupported: process.env.WEBGL_SUPPORTED === 'true',
        analyticsAvailable: process.env.ANALYTICS_MOCK_AVAILABLE === 'true'
      },
      performance: testConfig?.performance || {},
      webgl: testConfig?.webgl || {},
      memory: testConfig?.memory || {}
    }
    
    // Write summary report
    await fs.promises.writeFile(
      path.join(testResultsDir, 'test-summary.json'),
      JSON.stringify(summary, null, 2)
    )
    
    // Clean up temporary files if in CI
    if (process.env.CI === 'true') {
      console.log('🧽 Cleaning up temporary files...')
      
      // Keep only essential files in CI
      const filesToKeep = [
        'test-summary.json',
        'test-config.json',
        'results.json',
        'junit.xml'
      ]
      
      if (fs.existsSync(testResultsDir)) {
        const files = await fs.promises.readdir(testResultsDir)
        
        for (const file of files) {
          if (!filesToKeep.includes(file) && !file.endsWith('.png') && !file.endsWith('.webm')) {
            const filePath = path.join(testResultsDir, file)
            const stat = await fs.promises.stat(filePath)
            
            if (stat.isFile()) {
              await fs.promises.unlink(filePath)
            }
          }
        }
      }
    }
    
    // Log final summary
    console.log('📊 Test execution completed:')
    console.log(`   - Environment: ${summary.testEnvironment.dockerTest ? 'Docker' : 'Local'}`)
    console.log(`   - WebGL Support: ${summary.testEnvironment.webglSupported ? 'Yes' : 'No'}`)
    console.log(`   - Analytics Mock: ${summary.testEnvironment.analyticsAvailable ? 'Available' : 'Unavailable'}`)
    
    if (testConfig?.performance?.loadTime) {
      console.log(`   - Baseline Load Time: ${testConfig.performance.loadTime}ms`)
    }
    
    console.log('✅ Global teardown completed successfully')
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error)
    // Don't throw error in teardown to avoid masking test failures
  }
}

export default globalTeardown