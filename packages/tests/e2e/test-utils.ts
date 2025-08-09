import { Page, expect, Locator } from '@playwright/test';

/**
 * Shared utility functions for Playwright tests
 */

// Navigation utilities
export class NavigationUtils {
  constructor(private page: Page) {}

  async goHome() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  async goToBlog() {
    await this.page.goto('/blog');
    await this.page.waitForLoadState('networkidle');
  }

  async goToAbout() {
    await this.page.goto('/about');
    await this.page.waitForLoadState('networkidle');
  }

  async goToReading() {
    await this.page.goto('/reading');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToFirstBlogPost() {
    await this.goToBlog();
    const firstPost = this.page.locator('article').first();
    await expect(firstPost).toBeVisible();
    await firstPost.locator('a').first().click();
    await this.page.waitForLoadState('networkidle');
  }
}

// Background system utilities
export class BackgroundUtils {
  constructor(private page: Page) {}

  async getActiveModule(): Promise<string | null> {
    return await this.page.evaluate(() => {
      // Access global background context if available
      const context = (window as any).__BACKGROUND_CONTEXT__;
      return context?.activeModule || null;
    });
  }

  async waitForBackgroundLoad(timeout: number = 10000) {
    await this.page.waitForFunction(
      () => {
        const canvas = document.querySelector('canvas');
        return canvas && canvas.getContext('webgl2') !== null;
      },
      { timeout }
    );
  }

  async getCanvasElement(): Promise<Locator> {
    const canvas = this.page.locator('canvas').first();
    await expect(canvas).toBeVisible();
    return canvas;
  }

  async switchModule(moduleId: string) {
    // Look for module switcher controls
    const moduleButton = this.page.locator(`[data-testid="bg-module-${moduleId}"]`);
    if (await moduleButton.isVisible()) {
      await moduleButton.click();
      await this.page.waitForTimeout(1000); // Allow animation to settle
    }
  }

  async isWebGLAvailable(): Promise<boolean> {
    return await this.page.evaluate(() => {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      return gl !== null;
    });
  }

  async getCanvasSize(): Promise<{ width: number; height: number }> {
    return await this.page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      return canvas ? { width: canvas.width, height: canvas.height } : { width: 0, height: 0 };
    });
  }
}

// Performance utilities
export class PerformanceUtils {
  constructor(private page: Page) {}

  async getCoreWebVitals() {
    return await this.page.evaluate(() => {
      return new Promise((resolve) => {
        const vitals: Record<string, number> = {};
        
        // Collect Core Web Vitals
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              vitals.FCP = navEntry.domContentLoadedEventEnd - navEntry.fetchStart;
              vitals.LCP = navEntry.loadEventEnd - navEntry.fetchStart;
            }
          }
        });

        observer.observe({ entryTypes: ['navigation'] });

        // Also collect paint metrics
        const paintObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              vitals.FCP = entry.startTime;
            }
          }
        });

        paintObserver.observe({ entryTypes: ['paint'] });

        // Resolve after short delay to allow collection
        setTimeout(() => resolve(vitals), 1000);
      });
    });
  }

  async measureFrameRate(duration: number = 5000): Promise<number> {
    return await this.page.evaluate((duration) => {
      return new Promise((resolve) => {
        let frames = 0;
        const startTime = performance.now();

        function countFrame() {
          frames++;
          const elapsed = performance.now() - startTime;
          if (elapsed < duration) {
            requestAnimationFrame(countFrame);
          } else {
            resolve((frames * 1000) / elapsed);
          }
        }

        requestAnimationFrame(countFrame);
      });
    }, duration);
  }

  async getBundleSize(): Promise<{ total: number; javascript: number; css: number }> {
    return await this.page.evaluate(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      let total = 0;
      let javascript = 0;
      let css = 0;

      resources.forEach(resource => {
        const size = resource.transferSize || resource.encodedBodySize || 0;
        total += size;
        
        if (resource.name.includes('.js')) {
          javascript += size;
        } else if (resource.name.includes('.css')) {
          css += size;
        }
      });

      return { total, javascript, css };
    });
  }
}

// Responsive design utilities
export class ResponsiveUtils {
  constructor(private page: Page) {}

  async setViewport(width: number, height: number) {
    await this.page.setViewportSize({ width, height });
    await this.page.waitForTimeout(500); // Allow layout to settle
  }

  async testBreakpoint(breakpoint: 'mobile' | 'tablet' | 'desktop' | 'large') {
    const breakpoints = {
      mobile: { width: 375, height: 667 },
      tablet: { width: 768, height: 1024 },
      desktop: { width: 1280, height: 720 },
      large: { width: 1920, height: 1080 }
    };

    await this.setViewport(breakpoints[breakpoint].width, breakpoints[breakpoint].height);
  }

  async getComputedStyle(selector: string, property: string): Promise<string> {
    return await this.page.locator(selector).evaluate(
      (element, prop) => window.getComputedStyle(element).getPropertyValue(prop),
      property
    );
  }

  async isElementVisible(selector: string): Promise<boolean> {
    try {
      await expect(this.page.locator(selector)).toBeVisible({ timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }
}

// Accessibility utilities
export class AccessibilityUtils {
  constructor(private page: Page) {}

  async checkAriaLabels(selectors: string[]) {
    for (const selector of selectors) {
      const element = this.page.locator(selector);
      if (await element.isVisible()) {
        const ariaLabel = await element.getAttribute('aria-label');
        const ariaLabelledby = await element.getAttribute('aria-labelledby');
        const hasText = await element.textContent();
        
        expect(
          ariaLabel || ariaLabelledby || hasText,
          `Element ${selector} should have accessible label`
        ).toBeTruthy();
      }
    }
  }

  async checkKeyboardNavigation(selectors: string[]) {
    for (const selector of selectors) {
      const element = this.page.locator(selector);
      if (await element.isVisible()) {
        await element.press('Tab');
        await expect(element).toBeFocused();
      }
    }
  }

  async checkColorContrast(selector: string): Promise<number> {
    return await this.page.locator(selector).evaluate((element) => {
      const styles = window.getComputedStyle(element);
      const bgColor = styles.backgroundColor;
      const textColor = styles.color;
      
      // Simple contrast calculation (would need proper implementation)
      // This is a placeholder for actual contrast calculation
      return parseFloat(bgColor.match(/\d+/)?.[0] || '0') / parseFloat(textColor.match(/\d+/)?.[0] || '1');
    });
  }
}

// Visual testing utilities
export class VisualUtils {
  constructor(private page: Page) {}

  async waitForAnimationsToComplete() {
    await this.page.waitForTimeout(2000); // Wait for CSS animations
    await this.page.waitForFunction(() => {
      // Check if any CSS animations are running
      const animating = document.getAnimations().length > 0;
      return !animating;
    }, { timeout: 10000 });
  }

  async takeStableScreenshot(name: string, options?: { fullPage?: boolean }) {
    await this.waitForAnimationsToComplete();
    await this.page.waitForLoadState('networkidle');
    
    // Disable any random animations or transitions
    await this.page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `
    });

    await this.page.waitForTimeout(500);
    return await this.page.screenshot({ 
      fullPage: options?.fullPage || false,
      path: `test-results/screenshots/${name}.png`
    });
  }

  async compareElementScreenshot(selector: string, name: string) {
    const element = this.page.locator(selector);
    await expect(element).toBeVisible();
    await this.waitForAnimationsToComplete();
    
    return await expect(element).toHaveScreenshot(`${name}.png`);
  }
}

// Component testing utilities
export class ComponentUtils {
  constructor(private page: Page) {}

  async isolateComponent(selector: string) {
    // Hide all other elements to focus on specific component
    await this.page.addStyleTag({
      content: `
        body > * { display: none !important; }
        ${selector} { display: block !important; position: relative !important; }
      `
    });
  }

  async testComponentStates(selector: string, states: string[]) {
    const component = this.page.locator(selector);
    
    for (const state of states) {
      // Add state class or attribute
      await component.evaluate((el, state) => {
        el.classList.add(state);
        el.setAttribute('data-state', state);
      }, state);
      
      await this.page.waitForTimeout(500);
      await expect(component).toHaveScreenshot(`${selector.replace(/[^a-zA-Z0-9]/g, '_')}-${state}.png`);
      
      // Remove state
      await component.evaluate((el, state) => {
        el.classList.remove(state);
        el.removeAttribute('data-state');
      }, state);
    }
  }
}

// Test data utilities
export class TestDataUtils {
  static readonly SAMPLE_BLOG_DATA = {
    title: 'Test Blog Post',
    slug: 'test-blog-post',
    date: '2024-01-01',
    excerpt: 'This is a test blog post excerpt for testing purposes.',
    content: '# Test Blog Post\n\nThis is test content with some **bold** and *italic* text.'
  };

  static readonly PERFORMANCE_THRESHOLDS = {
    FCP: 2000, // First Contentful Paint
    LCP: 3000, // Largest Contentful Paint
    FID: 100,  // First Input Delay
    CLS: 0.1,  // Cumulative Layout Shift
    TTFB: 500  // Time to First Byte
  };

  static readonly BREAKPOINTS = {
    mobile: 768,
    tablet: 1024,
    desktop: 1280
  };
}

// Wait utilities
export class WaitUtils {
  constructor(private page: Page) {}

  async waitForHydration() {
    // Wait for React hydration to complete
    await this.page.waitForFunction(() => {
      return (window as any).__REACT_HYDRATED__ === true || 
             document.querySelector('[data-reactroot]') !== null;
    }, { timeout: 10000 });
  }

  async waitForWebGL() {
    await this.page.waitForFunction(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return false;
      
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      return gl !== null;
    }, { timeout: 15000 });
  }

  async waitForFontsLoaded() {
    await this.page.waitForFunction(() => {
      return document.fonts.ready;
    }, { timeout: 10000 });
  }
}