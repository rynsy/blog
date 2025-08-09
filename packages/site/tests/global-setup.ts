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
  
  try {
    // Launch a browser to verify the application is running
    const browser = await chromium.launch()
    const page = await browser.newPage()
    
    console.log(`🌐 Checking if application is available at ${baseURL}`)
    
    // Wait for the application to be ready
    let retries = 0
    const maxRetries = 30 // 30 seconds
    
    while (retries < maxRetries) {
      try {
        const response = await page.goto(baseURL, { 
          waitUntil: 'networkidle',
          timeout: 5000 
        })
        
        if (response && response.ok()) {
          console.log('✅ Application is ready!')
          break
        }
        throw new Error(`HTTP ${response?.status()}`)
      } catch (error) {
        retries++
        if (retries >= maxRetries) {
          throw new Error(`Application not ready after ${maxRetries} seconds: ${error}`)
        }
        console.log(`⏳ Waiting for application... (${retries}/${maxRetries})`)
        await page.waitForTimeout(1000)
      }
    }
    
    // Establish performance baselines
    console.log('📊 Establishing performance baselines...')
    
    await page.waitForLoadState('networkidle')
    
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
      }
    })
    
    console.log('🎯 Baseline performance metrics:', performanceMetrics)
    
    // Verify WebGL support
    console.log('🎨 Checking WebGL support...')
    const webglCapabilities = await page.evaluate(() => {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      const gl2 = canvas.getContext('webgl2')
      
      if (!gl) return { supported: false, webgl2: false }
      
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
      
      return {
        supported: true,
        webgl2: !!gl2,
        version: gl.getParameter(gl.VERSION),
        vendor: gl.getParameter(gl.VENDOR),
        renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown',
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      }
    })
    
    if (webglCapabilities.supported) {
      console.log('✅ WebGL is supported:', webglCapabilities)
    } else {
      console.log('⚠️  WebGL support not detected - some visual tests may be skipped')
    }
    
    // Check memory capabilities
    const memoryInfo = await page.evaluate(() => {
      const memory = (performance as any).memory
      return memory ? {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      } : null
    })
    
    if (memoryInfo) {
      console.log('🧠 Memory baseline:', memoryInfo)
    }
    
    // Check for analytics mock service in Docker environment
    if (process.env.DOCKER_TEST === 'true') {
      console.log('🔍 Checking analytics mock service...')
      try {
        await page.goto('http://analytics-mock/health', { timeout: 5000 })
        console.log('✅ Analytics mock service is available')
        process.env.ANALYTICS_MOCK_AVAILABLE = 'true'
      } catch (error) {
        console.log('⚠️  Analytics mock service not available')
        process.env.ANALYTICS_MOCK_AVAILABLE = 'false'
      }
    }
    
    // Store global configuration for tests
    const testConfig = {
      baseURL,
      performance: performanceMetrics,
      webgl: webglCapabilities,
      memory: memoryInfo,
      timestamp: new Date().toISOString(),
      dockerTest: process.env.DOCKER_TEST === 'true',
      analyticsAvailable: process.env.ANALYTICS_MOCK_AVAILABLE === 'true'
    }
    
    // Write configuration file for tests to reference
    await fs.promises.writeFile(
      path.join(testResultsDir, 'test-config.json'),
      JSON.stringify(testConfig, null, 2)
    )
    
    // Set environment variables for test access
    process.env.WEBGL_SUPPORTED = webglCapabilities.supported ? 'true' : 'false'
    process.env.WEBGL2_SUPPORTED = webglCapabilities.webgl2 ? 'true' : 'false'
    process.env.BASELINE_LOAD_TIME = performanceMetrics.loadTime.toString()
    process.env.BASELINE_FCP = performanceMetrics.firstContentfulPaint.toString()
    
    if (memoryInfo) {
      process.env.BASELINE_MEMORY = memoryInfo.usedJSHeapSize.toString()
    }
    
    await browser.close()
    console.log('✅ Global setup completed successfully')
    
  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  }
}

export default globalSetup