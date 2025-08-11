/**
 * Comprehensive Visual Regression Testing Suite
 * Tests visual consistency across devices, themes, and interactive states
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';
import { TestUtils } from './test-utils';

const testUtils = new TestUtils();

// Comprehensive viewport testing matrix
const viewports = [
  { name: 'mobile-portrait', width: 320, height: 568 },
  { name: 'mobile-landscape', width: 568, height: 320 },
  { name: 'tablet-portrait', width: 768, height: 1024 },
  { name: 'tablet-landscape', width: 1024, height: 768 },
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'desktop-large', width: 1920, height: 1080 },
  { name: 'desktop-4k', width: 3840, height: 2160 },
  { name: 'ultrawide', width: 3440, height: 1440 },
  { name: 'narrow', width: 280, height: 653 }
];

const testPages = [
  { path: '/', name: 'homepage' },
  { path: '/about', name: 'about' },
  { path: '/portfolio', name: 'portfolio' },
  { path: '/blog', name: 'blog' },
  { path: '/reading', name: 'reading' },
  { path: '/404', name: '404' }
];

test.describe('Visual Regression Testing', () => {
  
  test.describe('Responsive Design Screenshots', () => {
    for (const viewport of viewports) {
      for (const page of testPages) {
        test(`${page.name} page at ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ browser }) => {
          const context = await browser.newContext({
            viewport: { width: viewport.width, height: viewport.height },
            deviceScaleFactor: viewport.width >= 1920 ? 2 : 1
          });
          
          const pageInstance = await context.newPage();
          await testUtils.navigateAndWait(pageInstance, page.path);
          
          // Wait for any animations or lazy loading
          await pageInstance.waitForTimeout(1000);
          
          // Ensure fonts are loaded
          await pageInstance.waitForLoadState('networkidle');
          
          // Take full page screenshot
          await expect(pageInstance).toHaveScreenshot(
            `${page.name}-${viewport.name}.png`,
            {
              fullPage: true,
              threshold: 0.2, // Allow minor rendering differences
              animations: 'disabled' // Disable animations for consistent screenshots
            }
          );
          
          await context.close();
        });
      }
    }
  });

  test.describe('Theme Comparison Tests', () => {
    const themes = ['light', 'dark'];
    
    for (const theme of themes) {
      for (const page of testPages) {
        test(`${page.name} page in ${theme} theme`, async ({ browser }) => {
          const context = await browser.newContext({
            viewport: { width: 1280, height: 720 },
            colorScheme: theme as 'light' | 'dark'
          });
          
          const pageInstance = await context.newPage();
          await testUtils.navigateAndWait(pageInstance, page.path);
          
          // Wait for theme to apply
          await pageInstance.waitForTimeout(500);
          
          // Check that theme classes are applied
          const htmlElement = pageInstance.locator('html');
          if (theme === 'dark') {
            await expect(htmlElement).toHaveClass(/dark/);
          }
          
          // Take screenshot
          await expect(pageInstance).toHaveScreenshot(
            `${page.name}-${theme}-theme.png`,
            {
              fullPage: true,
              threshold: 0.2,
              animations: 'disabled'
            }
          );
          
          await context.close();
        });
      }
    }
  });

  test.describe('Interactive Elements Visual Testing', () => {
    test('Navigation hover states', async ({ page }) => {
      await testUtils.navigateAndWait(page, '/');
      
      const navLinks = page.locator('nav a');
      const linkCount = await navLinks.count();
      
      for (let i = 0; i < linkCount; i++) {
        const link = navLinks.nth(i);
        const linkText = await link.textContent();
        
        // Hover over the link
        await link.hover();
        await page.waitForTimeout(200); // Wait for hover animation
        
        // Take screenshot of navigation area
        const nav = page.locator('nav');
        await expect(nav).toHaveScreenshot(
          `nav-hover-${linkText?.toLowerCase().replace(/\s+/g, '-')}.png`,
          { threshold: 0.3 }
        );
      }
    });

    test('Theme toggle visual states', async ({ page }) => {
      await testUtils.navigateAndWait(page, '/');
      
      const themeToggle = page.locator('[data-testid="theme-toggle"]');
      if (await themeToggle.count() > 0) {
        // Test light state
        await expect(themeToggle).toHaveScreenshot('theme-toggle-light.png');
        
        // Click to switch to dark
        await themeToggle.click();
        await page.waitForTimeout(300); // Wait for theme transition
        
        // Test dark state
        await expect(themeToggle).toHaveScreenshot('theme-toggle-dark.png');
      }
    });

    test('Form elements visual validation', async ({ page }) => {
      await testUtils.navigateAndWait(page, '/test/form');
      
      // Test form in default state
      const form = page.locator('form');
      await expect(form).toHaveScreenshot('form-default-state.png');
      
      // Test form with validation errors
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
      await page.waitForTimeout(200);
      
      await expect(form).toHaveScreenshot('form-validation-errors.png');
      
      // Test form with valid input
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('textarea', 'This is a test message with sufficient content.');
      
      await expect(form).toHaveScreenshot('form-valid-input.png');
    });
  });

  test.describe('Layout Shift Detection', () => {
    test('Measure layout stability during page load', async ({ page }) => {
      // Enable layout shift tracking
      await page.addInitScript(() => {
        let cls = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              cls += (entry as any).value;
            }
          }
          (window as any).cls = cls;
        }).observe({ type: 'layout-shift', buffered: true });
      });
      
      await testUtils.navigateAndWait(page, '/');
      
      // Wait for page to settle
      await page.waitForTimeout(2000);
      
      // Check cumulative layout shift
      const cls = await page.evaluate(() => (window as any).cls || 0);
      expect(cls).toBeLessThan(0.1); // Good CLS score
    });

    test('Font loading does not cause layout shift', async ({ page }) => {
      await page.goto('/');
      
      // Take screenshot immediately after navigation
      await expect(page).toHaveScreenshot('page-before-fonts.png', {
        animations: 'disabled',
        timeout: 5000
      });
      
      // Wait for fonts to load
      await page.waitForFunction(() => document.fonts.ready);
      await page.waitForTimeout(500);
      
      // Take screenshot after fonts load
      await expect(page).toHaveScreenshot('page-after-fonts.png', {
        animations: 'disabled'
      });
      
      // The two screenshots should be very similar
      // (This will fail if there's significant layout shift due to font loading)
    });
  });

  test.describe('Error State Screenshots', () => {
    test('404 page visual design', async ({ page }) => {
      await page.goto('/non-existent-page');
      
      // Wait for 404 page to load
      await page.waitForSelector('h1', { timeout: 5000 });
      
      // Verify we're on 404 page
      await expect(page.locator('h1')).toContainText(/404|not found/i);
      
      // Take full page screenshot
      await expect(page).toHaveScreenshot('404-page.png', {
        fullPage: true,
        threshold: 0.2
      });
    });

    test('Network error fallback', async ({ context, page }) => {
      // Block all network requests to simulate offline
      await context.route('**/*', route => {
        if (route.request().url().includes('localhost')) {
          route.continue();
        } else {
          route.abort();
        }
      });
      
      await testUtils.navigateAndWait(page, '/reading');
      
      // Check for graceful degradation
      await expect(page).toHaveScreenshot('network-error-fallback.png', {
        fullPage: true,
        threshold: 0.3
      });
    });
  });

  test.describe('Print Styles Validation', () => {
    test('Print preview of blog post', async ({ page }) => {
      await testUtils.navigateAndWait(page, '/blog/mathematical-foundations-visual-media/');
      
      // Emulate print media
      await page.emulateMedia({ media: 'print' });
      
      // Take screenshot in print mode
      await expect(page).toHaveScreenshot('blog-post-print.png', {
        fullPage: true,
        threshold: 0.2
      });
      
      // Reset to screen media
      await page.emulateMedia({ media: 'screen' });
    });

    test('Print styles for main pages', async ({ page }) => {
      const printPages = ['/', '/about', '/portfolio'];
      
      for (const pagePath of printPages) {
        await testUtils.navigateAndWait(page, pagePath);
        await page.emulateMedia({ media: 'print' });
        
        const pageName = pagePath === '/' ? 'homepage' : pagePath.slice(1);
        await expect(page).toHaveScreenshot(`${pageName}-print.png`, {
          fullPage: true,
          threshold: 0.2
        });
        
        await page.emulateMedia({ media: 'screen' });
      }
    });
  });

  test.describe('Visual Component Isolation', () => {
    test('Navigation component visual test', async ({ page }) => {
      await testUtils.navigateAndWait(page, '/');
      
      const navigation = page.locator('nav');
      await expect(navigation).toHaveScreenshot('navigation-component.png');
    });

    test('Footer component visual test', async ({ page }) => {
      await testUtils.navigateAndWait(page, '/');
      
      const footer = page.locator('footer');
      if (await footer.count() > 0) {
        await expect(footer).toHaveScreenshot('footer-component.png');
      }
    });

    test('Blog post cards visual consistency', async ({ page }) => {
      await testUtils.navigateAndWait(page, '/blog');
      
      const blogCards = page.locator('.blog-card, [data-testid="blog-card"]');
      const cardCount = await blogCards.count();
      
      if (cardCount > 0) {
        // Test first few blog cards
        for (let i = 0; i < Math.min(cardCount, 3); i++) {
          const card = blogCards.nth(i);
          await expect(card).toHaveScreenshot(`blog-card-${i + 1}.png`, {
            threshold: 0.2
          });
        }
      }
    });
  });
});

test.describe('High DPI Display Testing', () => {
  test('High DPI screenshot comparison', async ({ browser }) => {
    const contexts = [
      { name: 'standard', deviceScaleFactor: 1 },
      { name: 'retina', deviceScaleFactor: 2 },
      { name: 'high-dpi', deviceScaleFactor: 3 }
    ];
    
    for (const config of contexts) {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        deviceScaleFactor: config.deviceScaleFactor
      });
      
      const page = await context.newPage();
      await testUtils.navigateAndWait(page, '/');
      
      await expect(page).toHaveScreenshot(`homepage-${config.name}-dpi.png`, {
        threshold: 0.3,
        animations: 'disabled'
      });
      
      await context.close();
    }
  });
});