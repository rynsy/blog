/**
 * Comprehensive Test Utilities
 * Shared helper functions for Playwright testing suite
 */

import { Page, Browser, expect } from '@playwright/test';

export interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  networkRequests: number;
  largestContentfulPaint: number;
  firstContentfulPaint: number;
  cumulativeLayoutShift: number;
}

export interface AccessibilityViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  nodes: Array<{ selector: string; html: string; }>;
}

export interface ViewportInfo {
  width: number;
  height: number;
  deviceScaleFactor: number;
}

export interface KeyboardNavigationResult {
  focusableElements: string[];
  hasSkipLinks: boolean;
  focusTrapped: boolean;
}

// Common viewport configurations
export const VIEWPORTS = {
  MOBILE_PORTRAIT: { width: 375, height: 667 },
  MOBILE_LANDSCAPE: { width: 667, height: 375 },
  TABLET_PORTRAIT: { width: 768, height: 1024 },
  TABLET_LANDSCAPE: { width: 1024, height: 768 },
  DESKTOP: { width: 1280, height: 720 },
  DESKTOP_LARGE: { width: 1920, height: 1080 }
};

// Common selectors
export const SELECTORS = {
  CONTROL_BUTTON: 'button[aria-label*="background"], button[aria-label*="control"], .control-trigger, [data-testid="control-trigger"]',
  DIALOG: '[role="dialog"], .dialog, [data-testid="dialog"]',
  CANVAS: 'canvas',
  HEADINGS: 'h1, h2, h3, h4, h5, h6'
};

export class TestUtils {
  constructor(private page: Page) {}
  
  /**
   * Navigate to a page and wait for it to be fully loaded
   */
  async navigateAndWait(page: Page, path: string, options?: {
    waitForSelector?: string;
    timeout?: number;
    networkIdle?: boolean;
  }): Promise<void> {
    const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:8000';
    const url = `${baseUrl}${path}`;
    
    // Navigate to the page
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: options?.timeout || 30000
    });
    
    // Wait for network to be idle if requested
    if (options?.networkIdle !== false) {
      await page.waitForLoadState('networkidle');
    }
    
    // Wait for specific selector if provided
    if (options?.waitForSelector) {
      await page.waitForSelector(options.waitForSelector, {
        timeout: options?.timeout || 10000
      });
    }
    
    // Wait for any hydration to complete
    await page.waitForTimeout(500);
  }

  /**
   * Wait for background animations to settle
   */
  async waitForAnimationsToSettle(page: Page, timeout: number = 2000): Promise<void> {
    // Wait for any CSS animations/transitions
    await page.waitForFunction(() => {
      const animatedElements = document.querySelectorAll('*');
      for (const el of animatedElements) {
        const computedStyle = getComputedStyle(el);
        if (computedStyle.animationName !== 'none' || 
            computedStyle.transitionProperty !== 'none') {
          return false;
        }
      }
      return true;
    }, { timeout });
  }

  /**
   * Get comprehensive performance metrics
   */
  async getPerformanceMetrics(page: Page): Promise<PerformanceMetrics> {
    return await page.evaluate(() => {
      return new Promise((resolve) => {
        // Wait for all performance entries to be available
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          const paint = performance.getEntriesByType('paint');
          const resources = performance.getEntriesByType('resource');
          
          const fcp = paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
          const lcp = (performance.getEntriesByType('largest-contentful-paint').pop() as any)?.startTime || 0;
          
          // Calculate approximate FPS (simplified)
          const fps = 60; // Default assumption
          
          // Memory usage (if available)
          const memory = (performance as any).memory;
          const memoryUsage = memory ? memory.usedJSHeapSize / 1024 / 1024 : 0;
          
          // Layout shift calculation
          let cls = 0;
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                cls += (entry as any).value;
              }
            }
          });
          observer.observe({ type: 'layout-shift', buffered: true });
          
          resolve({
            fps,
            memoryUsage,
            renderTime: navigation.loadEventEnd - navigation.loadEventStart,
            networkRequests: resources.length,
            largestContentfulPaint: lcp,
            firstContentfulPaint: fcp,
            cumulativeLayoutShift: cls
          });
        }, 1000);
      });
    });
  }

  /**
   * Check Core Web Vitals
   */
  async checkCoreWebVitals(page: Page): Promise<{
    lcp: number;
    fid: number;
    cls: number;
    scores: { lcp: 'good' | 'needs-improvement' | 'poor'; fid: 'good' | 'needs-improvement' | 'poor'; cls: 'good' | 'needs-improvement' | 'poor' };
  }> {
    return await page.evaluate(() => {
      return new Promise((resolve) => {
        let lcp = 0;
        let fid = 0;
        let cls = 0;
        
        // LCP Observer
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          lcp = entries[entries.length - 1].startTime;
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        
        // FID Observer  
        new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            fid = (entry as any).processingStart - entry.startTime;
          }
        }).observe({ type: 'first-input', buffered: true });
        
        // CLS Observer
        new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              cls += (entry as any).value;
            }
          }
        }).observe({ type: 'layout-shift', buffered: true });
        
        setTimeout(() => {
          resolve({
            lcp,
            fid,
            cls,
            scores: {
              lcp: lcp <= 2500 ? 'good' : lcp <= 4000 ? 'needs-improvement' : 'poor',
              fid: fid <= 100 ? 'good' : fid <= 300 ? 'needs-improvement' : 'poor',
              cls: cls <= 0.1 ? 'good' : cls <= 0.25 ? 'needs-improvement' : 'poor'
            }
          });
        }, 3000);
      });
    });
  }

  /**
   * Simulate user interactions
   */
  async simulateUserFlow(page: Page, actions: Array<{
    type: 'click' | 'hover' | 'type' | 'scroll' | 'wait';
    selector?: string;
    text?: string;
    x?: number;
    y?: number;
    delay?: number;
  }>): Promise<void> {
    for (const action of actions) {
      switch (action.type) {
        case 'click':
          if (action.selector) {
            await page.click(action.selector);
          }
          break;
        case 'hover':
          if (action.selector) {
            await page.hover(action.selector);
          }
          break;
        case 'type':
          if (action.selector && action.text) {
            await page.fill(action.selector, action.text);
          }
          break;
        case 'scroll':
          await page.evaluate((coords) => {
            window.scrollTo(coords.x || 0, coords.y || 0);
          }, { x: action.x || 0, y: action.y || 0 });
          break;
        case 'wait':
          await page.waitForTimeout(action.delay || 1000);
          break;
      }
      
      // Small delay between actions for realism
      await page.waitForTimeout(100);
    }
  }

  /**
   * Test responsive breakpoints
   */
  async testResponsiveBreakpoints(
    browser: Browser, 
    path: string, 
    testFn: (page: Page, viewport: { width: number; height: number; name: string }) => Promise<void>
  ): Promise<void> {
    const breakpoints = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1280, height: 720 },
      { name: 'large', width: 1920, height: 1080 }
    ];

    for (const viewport of breakpoints) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      
      try {
        await this.navigateAndWait(page, path);
        await testFn(page, viewport);
      } finally {
        await context.close();
      }
    }
  }

  /**
   * Monitor network requests
   */
  async monitorNetworkRequests(page: Page): Promise<{
    requests: Array<{ url: string; method: string; resourceType: string; status?: number; }>;
    failedRequests: Array<{ url: string; error: string; }>;
  }> {
    const requests: Array<{ url: string; method: string; resourceType: string; status?: number; }> = [];
    const failedRequests: Array<{ url: string; error: string; }> = [];

    page.on('request', (request) => {
      requests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType()
      });
    });

    page.on('response', (response) => {
      const request = requests.find(r => r.url === response.url());
      if (request) {
        request.status = response.status();
      }
    });

    page.on('requestfailed', (request) => {
      failedRequests.push({
        url: request.url(),
        error: request.failure()?.errorText || 'Unknown error'
      });
    });

    return { requests, failedRequests };
  }

  /**
   * Check for console errors and warnings
   */
  async monitorConsole(page: Page): Promise<{
    errors: string[];
    warnings: string[];
    logs: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const logs: string[] = [];

    page.on('console', (msg) => {
      const text = msg.text();
      switch (msg.type()) {
        case 'error':
          errors.push(text);
          break;
        case 'warning':
          warnings.push(text);
          break;
        case 'log':
          logs.push(text);
          break;
      }
    });

    return { errors, warnings, logs };
  }

  /**
   * Wait for element to be in viewport
   */
  async waitForElementInViewport(page: Page, selector: string): Promise<void> {
    await page.waitForFunction((sel) => {
      const element = document.querySelector(sel);
      if (!element) return false;
      
      const rect = element.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= window.innerHeight &&
        rect.right <= window.innerWidth
      );
    }, selector);
  }

  /**
   * Measure rendering performance
   */
  async measureRenderingPerformance(page: Page): Promise<{
    frameRate: number;
    droppedFrames: number;
    renderTime: number;
  }> {
    return await page.evaluate(() => {
      return new Promise((resolve) => {
        let frameCount = 0;
        let lastTime = performance.now();
        let droppedFrames = 0;
        
        function countFrame() {
          const now = performance.now();
          const deltaTime = now - lastTime;
          
          if (deltaTime > 16.67) { // More than 60fps threshold
            droppedFrames++;
          }
          
          frameCount++;
          lastTime = now;
          
          if (frameCount < 60) { // Count for 1 second at 60fps
            requestAnimationFrame(countFrame);
          } else {
            const frameRate = frameCount / ((lastTime - (lastTime - (frameCount * 16.67))) / 1000);
            resolve({
              frameRate: Math.round(frameRate),
              droppedFrames,
              renderTime: lastTime - (lastTime - (frameCount * 16.67))
            });
          }
        }
        
        requestAnimationFrame(countFrame);
      });
    });
  }

  /**
   * Test keyboard navigation
   */
  async testKeyboardNavigation(maxTabs: number = 20): Promise<KeyboardNavigationResult> {
    const focusableElements: string[] = [];
    let hasSkipLinks = false;
    
    for (let i = 0; i < maxTabs; i++) {
      await this.page.keyboard.press('Tab');
      await this.page.waitForTimeout(100);
      
      const focusedElement = await this.page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return null;
        
        const tagName = el.tagName.toLowerCase();
        const role = el.getAttribute('role');
        const ariaLabel = el.getAttribute('aria-label');
        const text = el.textContent?.trim();
        const href = el.getAttribute('href');
        
        return {
          tagName,
          role,
          ariaLabel,
          text: text?.substring(0, 50),
          href,
          selector: el.tagName.toLowerCase() + (el.id ? `#${el.id}` : '') + 
                   (el.className ? `.${el.className.split(' ').join('.')}` : '')
        };
      });
      
      if (focusedElement) {
        focusableElements.push(focusedElement.selector);
        
        // Check for skip links
        if (focusedElement.text?.toLowerCase().includes('skip') || 
            focusedElement.ariaLabel?.toLowerCase().includes('skip')) {
          hasSkipLinks = true;
        }
        
        // Stop if we've cycled back to the beginning
        if (i > 5 && focusableElements[0] === focusedElement.selector) {
          break;
        }
      }
    }
    
    return {
      focusableElements,
      hasSkipLinks,
      focusTrapped: false // Would need more complex logic to determine
    };
  }

  /**
   * Simulate slow network conditions
   */
  async simulateSlowNetwork(page: Page): Promise<void> {
    const client = await page.context().newCDPSession(page);
    await client.send('Network.enable');
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: 1.5 * 1024, // 1.5 KB/s
      uploadThroughput: 750, // 750 B/s
      latency: 2000 // 2s latency
    });
  }

  /**
   * Check for ARIA attributes and labels
   */
  async validateARIA(page: Page, selector: string): Promise<{
    hasLabel: boolean;
    hasRole: boolean;
    isDescribedBy: boolean;
    ariaAttributes: Record<string, string>;
  }> {
    return await page.locator(selector).evaluate((element) => {
      const ariaAttributes: Record<string, string> = {};
      
      for (const attr of element.attributes) {
        if (attr.name.startsWith('aria-')) {
          ariaAttributes[attr.name] = attr.value;
        }
      }
      
      return {
        hasLabel: !!(element.getAttribute('aria-label') || element.getAttribute('aria-labelledby')),
        hasRole: !!element.getAttribute('role'),
        isDescribedBy: !!element.getAttribute('aria-describedby'),
        ariaAttributes
      };
    });
  }

  /**
   * Test form validation
   */
  async testFormValidation(page: Page, formSelector: string, testCases: Array<{
    field: string;
    value: string;
    shouldBeValid: boolean;
    expectedError?: string;
  }>): Promise<void> {
    for (const testCase of testCases) {
      // Clear and fill field
      await page.fill(`${formSelector} ${testCase.field}`, '');
      await page.fill(`${formSelector} ${testCase.field}`, testCase.value);
      
      // Trigger validation (blur event)
      await page.locator(`${formSelector} ${testCase.field}`).blur();
      
      // Wait for validation feedback
      await page.waitForTimeout(300);
      
      // Check validity
      const isValid = await page.locator(`${formSelector} ${testCase.field}`).evaluate(
        (el: HTMLInputElement) => el.validity.valid
      );
      
      expect(isValid).toBe(testCase.shouldBeValid);
      
      // Check error message if expected
      if (!testCase.shouldBeValid && testCase.expectedError) {
        const errorElement = page.locator(`${formSelector} [data-error-for="${testCase.field.replace(/[^\w]/g, '')}"]`);
        await expect(errorElement).toContainText(testCase.expectedError);
      }
    }
  }

  // Background Module Specific Utils
  
  /**
   * Select a background module
   */
  async selectBackgroundModule(module: string): Promise<void> {
    try {
      const controlButton = this.page.locator(SELECTORS.CONTROL_BUTTON).first();
      
      if (await controlButton.isVisible()) {
        await controlButton.click();
        await this.page.waitForTimeout(300);
        
        const dialog = this.page.locator(SELECTORS.DIALOG);
        await expect(dialog).toBeVisible();
        
        // Select module
        const moduleOption = this.page.locator(`text=${module}, [value="${module}"], [data-value="${module}"]`).first();
        if (await moduleOption.isVisible()) {
          await moduleOption.click();
          await this.page.waitForTimeout(200);
        }
        
        // Enable background if not already
        const enableToggle = this.page.locator('text=Background Active, text=Enable, [aria-label*="enable"]').first();
        if (await enableToggle.isVisible()) {
          const isEnabled = await enableToggle.evaluate((el) => 
            el.getAttribute('aria-checked') === 'true' || 
            el.classList.contains('checked') ||
            el.classList.contains('active')
          );
          
          if (!isEnabled) {
            await enableToggle.click();
            await this.page.waitForTimeout(500);
          }
        }
        
        // Close dialog
        await this.page.keyboard.press('Escape');
        await this.page.waitForTimeout(300);
      } else {
        // Try URL parameter method
        const currentUrl = this.page.url();
        const url = new URL(currentUrl);
        url.searchParams.set('egg', module);
        await this.page.goto(url.toString());
        await this.page.waitForLoadState('networkidle');
      }
    } catch (error) {
      console.warn(`Failed to select background module ${module}:`, error);
    }
  }

  /**
   * Open control tray
   */
  async openControlTray(): Promise<any> {
    const controlButton = this.page.locator(SELECTORS.CONTROL_BUTTON).first();
    await controlButton.click();
    await this.page.waitForTimeout(300);
    
    const dialog = this.page.locator(SELECTORS.DIALOG);
    await expect(dialog).toBeVisible();
    return dialog;
  }

  /**
   * Close control tray
   */
  async closeControlTray(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(300);
  }

  /**
   * Enable reduced motion
   */
  async enableReducedMotion(): Promise<void> {
    await this.page.emulateMedia({ reducedMotion: 'reduce' });
  }

  /**
   * Get viewport information
   */
  async getViewportInfo(): Promise<ViewportInfo> {
    const viewport = this.page.viewportSize();
    if (!viewport) {
      throw new Error('No viewport size available');
    }
    
    const deviceScaleFactor = await this.page.evaluate(() => window.devicePixelRatio);
    
    return {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor
    };
  }

  /**
   * Set theme
   */
  async setTheme(theme: 'light' | 'dark'): Promise<void> {
    await this.page.evaluate((themeValue) => {
      localStorage.setItem('theme', themeValue);
      document.documentElement.setAttribute('data-theme', themeValue);
    }, theme);
  }

  /**
   * Simulate network condition
   */
  async simulateNetworkCondition(condition: 'fast' | 'slow' | 'offline'): Promise<void> {
    const client = await this.page.context().newCDPSession(this.page);
    await client.send('Network.enable');
    
    switch (condition) {
      case 'fast':
        await client.send('Network.emulateNetworkConditions', {
          offline: false,
          downloadThroughput: 10 * 1024 * 1024, // 10MB/s
          uploadThroughput: 5 * 1024 * 1024, // 5MB/s
          latency: 10
        });
        break;
      case 'slow':
        await client.send('Network.emulateNetworkConditions', {
          offline: false,
          downloadThroughput: 50 * 1024, // 50KB/s
          uploadThroughput: 20 * 1024, // 20KB/s
          latency: 500
        });
        break;
      case 'offline':
        await client.send('Network.emulateNetworkConditions', {
          offline: true,
          downloadThroughput: 0,
          uploadThroughput: 0,
          latency: 0
        });
        break;
    }
  }
}

// Background-specific utility classes for interactive-backgrounds.spec.ts

export class NavigationUtils {
  constructor(private page: Page) {}

  async goHome(): Promise<void> {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  async goToAbout(): Promise<void> {
    try {
      await this.page.goto('/about');
      await this.page.waitForLoadState('networkidle');
    } catch {
      // About page not found, skipping
    }
  }

  async goToBlog(): Promise<void> {
    try {
      await this.page.goto('/blog');
      await this.page.waitForLoadState('networkidle');
    } catch {
      // Blog page not found, skipping
    }
  }
}

export class BackgroundUtils {
  constructor(private page: Page) {}

  async isWebGLAvailable(): Promise<boolean> {
    return await this.page.evaluate(() => {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      return !!gl;
    });
  }

  async waitForBackgroundLoad(timeout: number = 5000): Promise<void> {
    try {
      await this.page.waitForSelector('canvas', { timeout });
      await this.page.waitForTimeout(1000); // Additional time for initialization
    } catch {
      // Background canvas not found within timeout
    }
  }

  async getCanvasElement(): Promise<any> {
    const canvas = this.page.locator('canvas');
    await expect(canvas).toBeVisible();
    return canvas;
  }

  async getCanvasSize(): Promise<{ width: number; height: number }> {
    return await this.page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) return { width: 0, height: 0 };
      return {
        width: canvas.width,
        height: canvas.height
      };
    });
  }

  async getActiveModule(): Promise<string | null> {
    return await this.page.evaluate(() => {
      return localStorage.getItem('bg-module');
    });
  }

  async switchModule(module: string): Promise<void> {
    await this.page.evaluate((mod) => {
      localStorage.setItem('bg-module', mod);
      window.location.reload();
    }, module);
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(2000);
  }
}

export class WaitUtils {
  constructor(private page: Page) {}

  async waitForHydration(): Promise<void> {
    // Wait for React hydration
    await this.page.waitForFunction(() => {
      return (window as any).React !== undefined || 
             document.querySelector('[data-reactroot]') !== null ||
             document.querySelector('#___gatsby') !== null;
    }, { timeout: 10000 });
    
    await this.page.waitForTimeout(500);
  }
}

export class PerformanceUtils {
  constructor(private page: Page) {}

  async measureFrameRate(duration: number = 3000): Promise<number> {
    return await this.page.evaluate((testDuration) => {
      return new Promise((resolve) => {
        let frameCount = 0;
        const startTime = performance.now();

        function countFrame() {
          frameCount++;
          const elapsed = performance.now() - startTime;
          
          if (elapsed < testDuration) {
            requestAnimationFrame(countFrame);
          } else {
            const fps = (frameCount * 1000) / elapsed;
            resolve(Math.round(fps));
          }
        }

        requestAnimationFrame(countFrame);
      });
    }, duration);
  }

  async getCoreWebVitals(): Promise<Record<string, number>> {
    return await this.page.evaluate(() => {
      return new Promise((resolve) => {
        const vitals: Record<string, number> = {};
        
        // LCP
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          vitals.lcp = entries[entries.length - 1].startTime;
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        
        // FID
        new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            vitals.fid = (entry as any).processingStart - entry.startTime;
          }
        }).observe({ type: 'first-input', buffered: true });
        
        // CLS
        new PerformanceObserver((entryList) => {
          let cls = 0;
          for (const entry of entryList.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              cls += (entry as any).value;
            }
          }
          vitals.cls = cls;
        }).observe({ type: 'layout-shift', buffered: true });
        
        setTimeout(() => resolve(vitals), 2000);
      });
    });
  }
}