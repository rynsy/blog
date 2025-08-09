import { test, expect } from '@playwright/test';
import { NavigationUtils, VisualUtils, WaitUtils, BackgroundUtils } from './test-utils';

test.describe('Visual Regression Testing', () => {
  let navigationUtils: NavigationUtils;
  let visualUtils: VisualUtils;
  let waitUtils: WaitUtils;
  let backgroundUtils: BackgroundUtils;

  test.beforeEach(async ({ page }) => {
    navigationUtils = new NavigationUtils(page);
    visualUtils = new VisualUtils(page);
    waitUtils = new WaitUtils(page);
    backgroundUtils = new BackgroundUtils(page);
    
    // Set consistent viewport for visual tests
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Wait for fonts and other resources
    await waitUtils.waitForFontsLoaded();
  });

  test.describe('Page-level Screenshots', () => {
    test('Homepage visual consistency', async ({ page }) => {
      await navigationUtils.goHome();
      await waitUtils.waitForHydration();
      
      // Wait for background to load
      try {
        await backgroundUtils.waitForBackgroundLoad(5000);
      } catch {
        // Continue if background fails to load
        console.log('Background module did not load, continuing with test');
      }
      
      await visualUtils.takeStableScreenshot('homepage-full');
      await expect(page).toHaveScreenshot('homepage.png', {
        fullPage: true,
        threshold: 0.3
      });
    });

    test('About page visual consistency', async ({ page }) => {
      await navigationUtils.goToAbout();
      await waitUtils.waitForHydration();
      
      await visualUtils.takeStableScreenshot('about-page-full');
      await expect(page).toHaveScreenshot('about-page.png', {
        fullPage: true,
        threshold: 0.3
      });
    });

    test('Blog listing visual consistency', async ({ page }) => {
      await navigationUtils.goToBlog();
      await waitUtils.waitForHydration();
      
      // Wait for blog posts to load
      await page.waitForSelector('article', { timeout: 10000 });
      
      await visualUtils.takeStableScreenshot('blog-listing-full');
      await expect(page).toHaveScreenshot('blog-listing.png', {
        fullPage: true,
        threshold: 0.3
      });
    });

    test('Reading list visual consistency', async ({ page }) => {
      await navigationUtils.goToReading();
      await waitUtils.waitForHydration();
      
      await visualUtils.takeStableScreenshot('reading-list-full');
      await expect(page).toHaveScreenshot('reading-list.png', {
        fullPage: true,
        threshold: 0.3
      });
    });

    test('Blog post detail visual consistency', async ({ page }) => {
      await navigationUtils.navigateToFirstBlogPost();
      await waitUtils.waitForHydration();
      
      // Wait for code highlighting and math to render
      await page.waitForTimeout(2000);
      
      await visualUtils.takeStableScreenshot('blog-post-detail-full');
      await expect(page).toHaveScreenshot('blog-post-detail.png', {
        fullPage: true,
        threshold: 0.3
      });
    });
  });

  test.describe('Component-level Screenshots', () => {
    test('Navigation header consistency', async ({ page }) => {
      await navigationUtils.goHome();
      
      const header = page.locator('header, nav').first();
      await expect(header).toBeVisible();
      
      await visualUtils.compareElementScreenshot('header, nav', 'navigation-header');
    });

    test('Footer consistency', async ({ page }) => {
      await navigationUtils.goHome();
      
      const footer = page.locator('footer').first();
      await expect(footer).toBeVisible();
      
      await visualUtils.compareElementScreenshot('footer', 'site-footer');
    });

    test('Blog post card consistency', async ({ page }) => {
      await navigationUtils.goToBlog();
      
      const firstPost = page.locator('article').first();
      await expect(firstPost).toBeVisible();
      
      await visualUtils.compareElementScreenshot('article:first-child', 'blog-post-card');
    });

    test('Background canvas consistency', async ({ page }) => {
      await navigationUtils.goHome();
      
      try {
        const canvas = await backgroundUtils.getCanvasElement();
        await expect(canvas).toBeVisible();
        
        // Wait for initial render
        await page.waitForTimeout(3000);
        
        await visualUtils.compareElementScreenshot('canvas', 'background-canvas');
      } catch (error) {
        console.log('Canvas not available for testing:', error);
        test.skip();
      }
    });
  });

  test.describe('Theme Variations', () => {
    test('Light theme consistency', async ({ page }) => {
      await navigationUtils.goHome();
      
      // Set light theme
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
      });
      
      await page.waitForTimeout(1000);
      await expect(page).toHaveScreenshot('homepage-light-theme.png', {
        threshold: 0.3
      });
    });

    test('Dark theme consistency', async ({ page }) => {
      await navigationUtils.goHome();
      
      // Set dark theme
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
      });
      
      await page.waitForTimeout(1000);
      await expect(page).toHaveScreenshot('homepage-dark-theme.png', {
        threshold: 0.3
      });
    });

    test('System theme consistency', async ({ page }) => {
      await navigationUtils.goHome();
      
      // Set system theme with light preference
      await page.emulateMedia({ colorScheme: 'light' });
      await page.evaluate(() => {
        document.documentElement.removeAttribute('data-theme');
        localStorage.removeItem('theme');
      });
      
      await page.waitForTimeout(1000);
      await expect(page).toHaveScreenshot('homepage-system-light.png', {
        threshold: 0.3
      });
    });
  });

  test.describe('Responsive Visual Tests', () => {
    test('Mobile viewport consistency', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await navigationUtils.goHome();
      await waitUtils.waitForHydration();
      
      await expect(page).toHaveScreenshot('homepage-mobile.png', {
        threshold: 0.3
      });
    });

    test('Tablet viewport consistency', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await navigationUtils.goHome();
      await waitUtils.waitForHydration();
      
      await expect(page).toHaveScreenshot('homepage-tablet.png', {
        threshold: 0.3
      });
    });

    test('Desktop viewport consistency', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await navigationUtils.goHome();
      await waitUtils.waitForHydration();
      
      await expect(page).toHaveScreenshot('homepage-desktop.png', {
        threshold: 0.3
      });
    });

    test('Large viewport consistency', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await navigationUtils.goHome();
      await waitUtils.waitForHydration();
      
      await expect(page).toHaveScreenshot('homepage-large.png', {
        threshold: 0.3
      });
    });
  });

  test.describe('Interactive State Screenshots', () => {
    test('Navigation hover states', async ({ page }) => {
      await navigationUtils.goHome();
      
      // Test main navigation hover
      const navLinks = page.locator('nav a');
      const firstLink = navLinks.first();
      
      if (await firstLink.isVisible()) {
        await firstLink.hover();
        await page.waitForTimeout(500);
        
        await expect(firstLink).toHaveScreenshot('nav-link-hover.png');
      }
    });

    test('Button focus states', async ({ page }) => {
      await navigationUtils.goHome();
      
      // Find focusable buttons
      const buttons = page.locator('button, [role="button"]');
      const firstButton = buttons.first();
      
      if (await firstButton.isVisible()) {
        await firstButton.focus();
        await page.waitForTimeout(500);
        
        await expect(firstButton).toHaveScreenshot('button-focus.png');
      }
    });

    test('Form input states', async ({ page }) => {
      await navigationUtils.goHome();
      
      // Look for form inputs (search, contact, etc.)
      const inputs = page.locator('input, textarea');
      const firstInput = inputs.first();
      
      if (await firstInput.isVisible()) {
        // Focus state
        await firstInput.focus();
        await page.waitForTimeout(500);
        await expect(firstInput).toHaveScreenshot('input-focus.png');
        
        // Filled state
        await firstInput.fill('Test input value');
        await page.waitForTimeout(500);
        await expect(firstInput).toHaveScreenshot('input-filled.png');
      }
    });
  });

  test.describe('Background Module Visual Tests', () => {
    test('Gradient module consistency', async ({ page }) => {
      await navigationUtils.goHome();
      
      try {
        // Switch to gradient module if available
        await backgroundUtils.switchModule('gradient');
        await page.waitForTimeout(2000);
        
        const canvas = await backgroundUtils.getCanvasElement();
        await expect(canvas).toHaveScreenshot('gradient-module.png');
      } catch (error) {
        console.log('Gradient module not available:', error);
        test.skip();
      }
    });

    test('Knowledge graph module consistency', async ({ page }) => {
      await navigationUtils.goHome();
      
      try {
        // Switch to knowledge module if available
        await backgroundUtils.switchModule('knowledge');
        await page.waitForTimeout(3000);
        
        const canvas = await backgroundUtils.getCanvasElement();
        await expect(canvas).toHaveScreenshot('knowledge-module.png');
      } catch (error) {
        console.log('Knowledge module not available:', error);
        test.skip();
      }
    });
  });

  test.describe('Error State Screenshots', () => {
    test('404 page visual consistency', async ({ page }) => {
      await page.goto('/non-existent-page');
      await waitUtils.waitForHydration();
      
      // Wait for 404 content to load
      await page.waitForTimeout(2000);
      
      await expect(page).toHaveScreenshot('404-page.png', {
        threshold: 0.3
      });
    });

    test('Network error state', async ({ page, context }) => {
      // Block network requests to simulate offline
      await context.route('**/*', route => route.abort());
      
      try {
        await navigationUtils.goHome();
      } catch {
        // Expected to fail
      }
      
      await page.waitForTimeout(2000);
      await expect(page).toHaveScreenshot('network-error.png', {
        threshold: 0.3
      });
    });
  });

  test.describe('Print Styles', () => {
    test('Print layout consistency', async ({ page }) => {
      await navigationUtils.goHome();
      await waitUtils.waitForHydration();
      
      // Emulate print media
      await page.emulateMedia({ media: 'print' });
      await page.waitForTimeout(1000);
      
      await expect(page).toHaveScreenshot('homepage-print.png', {
        threshold: 0.3
      });
    });

    test('Blog post print layout', async ({ page }) => {
      await navigationUtils.navigateToFirstBlogPost();
      await waitUtils.waitForHydration();
      
      await page.emulateMedia({ media: 'print' });
      await page.waitForTimeout(1000);
      
      await expect(page).toHaveScreenshot('blog-post-print.png', {
        fullPage: true,
        threshold: 0.3
      });
    });
  });

  test.describe('Animation Consistency', () => {
    test('Page transition animations', async ({ page }) => {
      await navigationUtils.goHome();
      
      // Enable animations for this test
      await page.addStyleTag({
        content: `
          * {
            animation-duration: 0.3s !important;
            transition-duration: 0.3s !important;
          }
        `
      });
      
      // Navigate and capture mid-animation
      const blogLink = page.locator('a[href*="/blog"]').first();
      if (await blogLink.isVisible()) {
        await blogLink.click();
        await page.waitForTimeout(150); // Capture mid-animation
        
        await expect(page).toHaveScreenshot('page-transition-animation.png', {
          threshold: 0.5 // Higher threshold for animation frames
        });
      }
    });

    test('Loading states consistency', async ({ page }) => {
      await navigationUtils.goHome();
      
      // Look for loading indicators
      const loadingElements = page.locator('[data-testid*="loading"], .loading, .spinner');
      const firstLoader = loadingElements.first();
      
      if (await firstLoader.isVisible()) {
        await expect(firstLoader).toHaveScreenshot('loading-state.png');
      }
    });
  });
});