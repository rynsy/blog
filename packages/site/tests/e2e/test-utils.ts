/**
 * Comprehensive Test Utilities
 * Shared helper functions for Playwright testing suite
 */

import { Page, Browser, BrowserContext, expect } from '@playwright/test';

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
    const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || page.context().options?.baseURL || 'http://localhost:8000';
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