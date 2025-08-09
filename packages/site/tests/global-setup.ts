/**
 * Global test setup for Phase 4 comprehensive testing
 * Initializes performance monitoring, device emulation, and accessibility testing
 */

import { chromium, type FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Phase 4 Test Setup: Initializing comprehensive test environment');
  
  // Launch browser for global setup tasks
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. Performance baseline establishment
    console.log('📊 Establishing performance baselines...');
    
    // Navigate to the site to establish baseline metrics
    const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:8000';
    await page.goto(baseURL);
    
    // Wait for initial load and measure baseline performance
    await page.waitForLoadState('networkidle');
    
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
        largestContentfulPaint: performance.getEntriesByName('largest-contentful-paint')[0]?.startTime || 0,
      };
    });
    
    console.log('🎯 Baseline performance metrics:', performanceMetrics);
    
    // Store baseline for comparison in tests
    process.env.BASELINE_LOAD_TIME = performanceMetrics.loadTime.toString();
    process.env.BASELINE_FCP = performanceMetrics.firstContentfulPaint.toString();
    process.env.BASELINE_LCP = performanceMetrics.largestContentfulPaint.toString();
    
    // 2. WebGL capabilities detection
    console.log('🎮 Detecting WebGL capabilities...');
    
    const webglCapabilities = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      const gl2 = canvas.getContext('webgl2');
      
      if (!gl) return { supported: false };
      
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      const extensions = gl.getSupportedExtensions();
      
      return {
        supported: true,
        webgl2: !!gl2,
        version: gl.getParameter(gl.VERSION),
        vendor: gl.getParameter(gl.VENDOR),
        renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown',
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        maxVertexAttributes: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
        maxViewportDimensions: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
        extensions: extensions || []
      };
    });
    
    console.log('🖼️ WebGL capabilities:', webglCapabilities);
    process.env.WEBGL_SUPPORTED = webglCapabilities.supported.toString();
    process.env.WEBGL2_SUPPORTED = webglCapabilities.webgl2.toString();
    
    // 3. Memory and performance budgets
    console.log('💾 Setting performance budgets...');
    
    const memoryInfo = await page.evaluate(() => {
      const memory = (performance as any).memory;
      return memory ? {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      } : null;
    });
    
    if (memoryInfo) {
      console.log('🧠 Memory baseline:', memoryInfo);
      process.env.BASELINE_MEMORY = memoryInfo.usedJSHeapSize.toString();
      process.env.MEMORY_LIMIT = (memoryInfo.usedJSHeapSize * 2).toString(); // 2x baseline as limit
    }
    
    // 4. Device capabilities matrix
    console.log('📱 Building device capabilities matrix...');
    
    const deviceCapabilities = {
      desktop: {
        webgl: webglCapabilities.supported,
        webgl2: webglCapabilities.webgl2,
        performanceProfile: 'high',
        memoryProfile: 'high',
        touchSupport: false
      },
      mobile: {
        webgl: true, // Will be tested per device
        webgl2: false, // Conservative assumption
        performanceProfile: 'medium',
        memoryProfile: 'medium',
        touchSupport: true
      },
      tablet: {
        webgl: true,
        webgl2: webglCapabilities.webgl2,
        performanceProfile: 'medium',
        memoryProfile: 'medium',
        touchSupport: true
      }
    };
    
    process.env.DEVICE_CAPABILITIES = JSON.stringify(deviceCapabilities);
    
    // 5. Accessibility testing setup
    console.log('♿ Initializing accessibility testing...');
    
    // Check for system-level accessibility preferences
    const accessibilityFeatures = await page.evaluate(() => ({
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      highContrast: window.matchMedia('(prefers-contrast: high)').matches,
      darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
      forcedColors: window.matchMedia('(forced-colors: active)').matches
    }));
    
    process.env.ACCESSIBILITY_FEATURES = JSON.stringify(accessibilityFeatures);
    
    // 6. Analytics and privacy compliance setup
    console.log('🔒 Setting up privacy compliance testing...');
    
    // Check for existing analytics configurations
    const analyticsConfig = await page.evaluate(() => ({
      umamiFound: !!window.umami,
      cookiesPresent: document.cookie.length > 0,
      localStorageKeys: Object.keys(localStorage),
      sessionStorageKeys: Object.keys(sessionStorage)
    }));
    
    process.env.ANALYTICS_BASELINE = JSON.stringify(analyticsConfig);
    
    console.log('✅ Phase 4 test environment initialized successfully');
    
    // Save test configuration for use in tests
    const testConfig = {
      baseURL,
      performance: performanceMetrics,
      webgl: webglCapabilities,
      memory: memoryInfo,
      devices: deviceCapabilities,
      accessibility: accessibilityFeatures,
      analytics: analyticsConfig,
      timestamp: new Date().toISOString()
    };
    
    // Write configuration file for tests to reference
    const fs = await import('fs');
    await fs.promises.writeFile(
      'test-results/test-config.json', 
      JSON.stringify(testConfig, null, 2)
    );
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

export default globalSetup;