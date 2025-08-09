/**
 * Production Validation Tests - Console Errors
 * Detects and validates production console errors, warnings, and GraphQL issues
 */

import { test, expect, Page } from '@playwright/test';

interface ConsoleMessage {
  type: string;
  text: string;
  location?: string;
  stack?: string;
}

test.describe('Production Console Error Detection', () => {
  let consoleMessages: ConsoleMessage[] = [];
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    consoleMessages = [];

    // Capture all console messages
    page.on('console', (msg) => {
      const message: ConsoleMessage = {
        type: msg.type(),
        text: msg.text(),
        location: msg.location()?.url || 'unknown'
      };
      
      consoleMessages.push(message);
    });

    // Capture page errors
    page.on('pageerror', (error) => {
      consoleMessages.push({
        type: 'pageerror',
        text: error.message,
        stack: error.stack
      });
    });

    // Capture failed resource loads
    page.on('response', (response) => {
      if (!response.ok()) {
        consoleMessages.push({
          type: 'resource-error',
          text: `Failed to load: ${response.url()} (${response.status()})`,
          location: response.url()
        });
      }
    });
  });

  test('should detect Gatsby GraphQL compilation errors', async () => {
    await page.goto('/');
    
    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');
    
    // Check for Gatsby GraphQL errors
    const graphqlErrors = consoleMessages.filter(msg => 
      msg.text.includes('Gatsby related `graphql` calls are supposed to only be evaluated at compile time') ||
      msg.text.includes('Gatsby is misconfigured') ||
      msg.text.includes('query was left in the compiled code')
    );

    if (graphqlErrors.length > 0) {
      console.log('🚨 GraphQL Compilation Errors Detected:');
      graphqlErrors.forEach((error, index) => {
        console.log(`${index + 1}. [${error.type}] ${error.text}`);
        if (error.location) {
          console.log(`   Location: ${error.location}`);
        }
        if (error.stack) {
          console.log(`   Stack: ${error.stack}`);
        }
      });

      // This should fail in production builds
      expect(graphqlErrors).toHaveLength(0);
    }

    // Log summary
    console.log(`✅ Total console messages: ${consoleMessages.length}`);
    console.log(`🚨 GraphQL errors: ${graphqlErrors.length}`);
  });

  test('should detect missing external scripts', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for failed script loads
    const scriptErrors = consoleMessages.filter(msg => 
      (msg.type === 'resource-error' || msg.type === 'error') &&
      (msg.text.includes('cloudflareinsights.com') ||
       msg.text.includes('beacon.min.js') ||
       msg.text.includes('Loading failed for the <script>'))
    );

    if (scriptErrors.length > 0) {
      console.log('🚨 Script Loading Errors Detected:');
      scriptErrors.forEach((error, index) => {
        console.log(`${index + 1}. [${error.type}] ${error.text}`);
      });
    }

    // Log all failed resources
    const allResourceErrors = consoleMessages.filter(msg => msg.type === 'resource-error');
    console.log(`📊 Failed resource loads: ${allResourceErrors.length}`);
    
    // Don't fail the test for external scripts, just report
    allResourceErrors.forEach(error => {
      console.log(`⚠️  Resource error: ${error.text}`);
    });
  });

  test('should detect deprecated API warnings', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for deprecated API usage
    const deprecationWarnings = consoleMessages.filter(msg => 
      msg.text.includes('deprecated') ||
      msg.text.includes('MouseEvent.mozInputSource') ||
      msg.text.includes('PointerEvent.pointerType')
    );

    if (deprecationWarnings.length > 0) {
      console.log('⚠️  Deprecation Warnings Detected:');
      deprecationWarnings.forEach((warning, index) => {
        console.log(`${index + 1}. [${warning.type}] ${warning.text}`);
      });

      // Log but don't fail for deprecation warnings
      console.log(`📊 Total deprecation warnings: ${deprecationWarnings.length}`);
    }
  });

  test('should detect source map errors', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for source map errors
    const sourceMapErrors = consoleMessages.filter(msg => 
      msg.text.includes('Source map error') ||
      msg.text.includes('react_devtools_backend_compact.js.map') ||
      msg.text.includes('request failed with status 404')
    );

    if (sourceMapErrors.length > 0) {
      console.log('🗺️  Source Map Errors Detected:');
      sourceMapErrors.forEach((error, index) => {
        console.log(`${index + 1}. [${error.type}] ${error.text}`);
      });

      // Log but don't fail for source map errors in production
      console.log(`📊 Source map errors: ${sourceMapErrors.length}`);
    }
  });

  test('should validate SEO component GraphQL usage', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check specifically for SEO component errors
    const seoErrors = consoleMessages.filter(msg => 
      (msg.text.includes('seo.tsx') && msg.text.includes('GraphQL')) ||
      (msg.location && msg.location.includes('seo.tsx'))
    );

    if (seoErrors.length > 0) {
      console.log('🎯 SEO Component GraphQL Errors:');
      seoErrors.forEach((error, index) => {
        console.log(`${index + 1}. [${error.type}] ${error.text}`);
        if (error.stack) {
          console.log(`   Stack trace: ${error.stack}`);
        }
      });

      // This is a critical issue that should fail the test
      expect(seoErrors, 'SEO component has GraphQL compilation errors').toHaveLength(0);
    }
  });

  test('should check for Phase 4 background module errors', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for background module specific errors
    const bgModuleErrors = consoleMessages.filter(msg => 
      msg.text.includes('BackgroundProvider') ||
      msg.text.includes('bgModules') ||
      msg.text.includes('WebGL') ||
      msg.text.includes('PerformanceDashboard') ||
      msg.text.includes('EasterEgg')
    );

    if (bgModuleErrors.length > 0) {
      console.log('🎨 Background Module Errors:');
      bgModuleErrors.forEach((error, index) => {
        console.log(`${index + 1}. [${error.type}] ${error.text}`);
      });
    }

    // Log Phase 4 specific warnings
    console.log(`🎯 Phase 4 module errors: ${bgModuleErrors.length}`);
  });

  test('should generate comprehensive error report', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to different pages to test GraphQL across the site
    const pages = ['/', '/blog', '/reading', '/about'];
    const pageErrorCounts: Record<string, number> = {};

    for (const pagePath of pages) {
      const initialErrorCount = consoleMessages.length;
      
      try {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');
      } catch (error) {
        console.log(`⚠️  Failed to navigate to ${pagePath}: ${error}`);
        continue;
      }

      const errorsOnPage = consoleMessages.length - initialErrorCount;
      pageErrorCounts[pagePath] = errorsOnPage;
      
      if (errorsOnPage > 0) {
        console.log(`📄 ${pagePath}: ${errorsOnPage} new errors`);
      }
    }

    // Generate comprehensive report
    const errorsByType = consoleMessages.reduce((acc, msg) => {
      acc[msg.type] = (acc[msg.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n📊 ERROR SUMMARY REPORT:');
    console.log('=======================');
    console.log(`Total console messages: ${consoleMessages.length}`);
    
    Object.entries(errorsByType).forEach(([type, count]) => {
      console.log(`${type}: ${count}`);
    });

    console.log('\n📄 ERRORS BY PAGE:');
    Object.entries(pageErrorCounts).forEach(([page, count]) => {
      console.log(`${page}: ${count} errors`);
    });

    // Critical errors that should fail the build
    const criticalErrors = consoleMessages.filter(msg => 
      msg.type === 'error' && 
      (msg.text.includes('Gatsby') || msg.text.includes('GraphQL'))
    );

    if (criticalErrors.length > 0) {
      console.log('\n🚨 CRITICAL ERRORS:');
      criticalErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.text}`);
      });
    }

    // Save error report for CI
    if (process.env.CI) {
      const report = {
        timestamp: new Date().toISOString(),
        totalMessages: consoleMessages.length,
        errorsByType,
        pageErrorCounts,
        criticalErrors: criticalErrors.map(e => ({ type: e.type, text: e.text })),
        allMessages: consoleMessages
      };

      await page.evaluate((reportData) => {
        console.log('ERROR_REPORT:', JSON.stringify(reportData));
      }, report);
    }

    // Fail if we have critical GraphQL errors
    expect(criticalErrors, 'Site has critical GraphQL compilation errors').toHaveLength(0);
  });

  test.afterEach(async () => {
    if (consoleMessages.length > 0) {
      console.log(`\n📋 Final message count: ${consoleMessages.length}`);
    }
  });
});