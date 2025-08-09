/**
 * SEO Component GraphQL Validation Tests
 * Specifically tests for the GraphQL compilation issues seen in production
 */

import { test, expect } from '@playwright/test';

test.describe('SEO Component GraphQL Issues', () => {
  
  test('should identify SEO component GraphQL compilation problems', async ({ page }) => {
    const consoleErrors: string[] = [];
    const graphqlErrors: string[] = [];
    
    // Capture console errors specifically related to GraphQL and SEO
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        consoleErrors.push(text);
        
        if (text.includes('GraphQL') || text.includes('seo.tsx') || text.includes('Gatsby')) {
          graphqlErrors.push(text);
        }
      }
    });

    // Capture page errors that might be GraphQL related
    page.on('pageerror', (error) => {
      const errorMessage = error.message;
      consoleErrors.push(errorMessage);
      
      if (errorMessage.includes('GraphQL') || errorMessage.includes('seo.tsx') || errorMessage.includes('Gatsby')) {
        graphqlErrors.push(errorMessage);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check if SEO meta tags are present despite GraphQL errors
    const titleElement = await page.locator('head title').first();
    const metaDescription = await page.locator('head meta[name="description"]').first();
    
    console.log('🔍 Checking SEO elements...');
    
    if (await titleElement.count() > 0) {
      const title = await titleElement.textContent();
      console.log(`✅ Page title: ${title}`);
    } else {
      console.log('❌ No page title found');
    }

    if (await metaDescription.count() > 0) {
      const description = await metaDescription.getAttribute('content');
      console.log(`✅ Meta description: ${description}`);
    } else {
      console.log('❌ No meta description found');
    }

    // Check for GraphQL errors
    if (graphqlErrors.length > 0) {
      console.log('\n🚨 GraphQL/SEO Errors Detected:');
      graphqlErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
      
      // Check if these are the specific errors from production
      const hasGatsbyMisconfigError = graphqlErrors.some(error => 
        error.includes('Gatsby is misconfigured') && 
        error.includes('graphql calls are supposed to only be evaluated at compile time')
      );
      
      const hasSeoComponentError = graphqlErrors.some(error => 
        error.includes('seo.tsx:17')
      );
      
      if (hasGatsbyMisconfigError) {
        console.log('🎯 CONFIRMED: Gatsby GraphQL misconfiguration detected');
      }
      
      if (hasSeoComponentError) {
        console.log('🎯 CONFIRMED: SEO component line 17 GraphQL error detected');
      }

      // This test should fail if we detect the production GraphQL errors
      expect(hasGatsbyMisconfigError, 'Gatsby GraphQL misconfiguration should not occur').toBe(false);
      expect(hasSeoComponentError, 'SEO component should not have GraphQL runtime errors').toBe(false);
    }

    console.log(`\n📊 Total console errors: ${consoleErrors.length}`);
    console.log(`🎯 GraphQL-related errors: ${graphqlErrors.length}`);
  });

  test('should test SEO component across multiple pages', async ({ page }) => {
    const pages = ['/', '/blog', '/reading', '/about'];
    const errorsByPage: Record<string, string[]> = {};

    for (const pagePath of pages) {
      const pageErrors: string[] = [];
      
      page.on('console', (msg) => {
        if (msg.type() === 'error' && 
            (msg.text().includes('GraphQL') || msg.text().includes('seo.tsx') || msg.text().includes('Gatsby'))) {
          pageErrors.push(`[${msg.type()}] ${msg.text()}`);
        }
      });

      page.on('pageerror', (error) => {
        if (error.message.includes('GraphQL') || error.message.includes('seo.tsx') || error.message.includes('Gatsby')) {
          pageErrors.push(`[pageerror] ${error.message}`);
        }
      });

      try {
        console.log(`\n🔍 Testing ${pagePath}...`);
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');
        
        // Give time for any async GraphQL errors to surface
        await page.waitForTimeout(2000);
        
        errorsByPage[pagePath] = [...pageErrors];
        
        if (pageErrors.length > 0) {
          console.log(`❌ ${pagePath}: ${pageErrors.length} GraphQL errors`);
          pageErrors.forEach(error => console.log(`   ${error}`));
        } else {
          console.log(`✅ ${pagePath}: No GraphQL errors`);
        }
        
      } catch (error) {
        console.log(`⚠️  Failed to test ${pagePath}: ${error}`);
        errorsByPage[pagePath] = [`Navigation failed: ${error}`];
      }
    }

    // Summary report
    console.log('\n📊 GRAPHQL ERRORS BY PAGE:');
    console.log('========================');
    
    const totalErrors = Object.values(errorsByPage).flat().length;
    
    Object.entries(errorsByPage).forEach(([page, errors]) => {
      console.log(`${page}: ${errors.length} errors`);
    });
    
    console.log(`\nTotal GraphQL errors across all pages: ${totalErrors}`);

    // Fail if any page has GraphQL errors
    Object.entries(errorsByPage).forEach(([pagePath, errors]) => {
      expect(errors, `${pagePath} should not have GraphQL errors`).toHaveLength(0);
    });
  });

  test('should validate that GraphQL queries are properly compiled', async ({ page }) => {
    // This test checks if GraphQL queries are being processed at build time vs runtime
    let runtimeGraphQLDetected = false;
    
    // Monitor network requests for any GraphQL calls (which shouldn't happen in a static site)
    page.on('request', (request) => {
      const url = request.url();
      const postData = request.postData();
      
      if (url.includes('graphql') || 
          url.includes('__graphql') || 
          (postData && postData.includes('query'))) {
        console.log(`🚨 Runtime GraphQL request detected: ${url}`);
        runtimeGraphQLDetected = true;
      }
    });

    // Check JavaScript bundle for GraphQL query strings that shouldn't be there
    page.on('response', async (response) => {
      if (response.url().includes('.js') && response.status() === 200) {
        try {
          const content = await response.text();
          
          // Look for GraphQL query indicators in the bundle
          const hasGraphQLQueries = content.includes('query {') || 
                                  content.includes('query(') ||
                                  content.includes('useStaticQuery') ||
                                  content.includes('graphql`');
          
          if (hasGraphQLQueries) {
            console.log(`⚠️  GraphQL query strings found in JS bundle: ${response.url()}`);
            
            // Extract some context around GraphQL usage
            const graphqlMatches = content.match(/.{0,50}(query|graphql|useStaticQuery).{0,50}/gi);
            if (graphqlMatches) {
              console.log('GraphQL usage patterns:');
              graphqlMatches.slice(0, 5).forEach((match, i) => {
                console.log(`  ${i + 1}. ...${match}...`);
              });
            }
          }
        } catch (error) {
          // Ignore errors reading response content
        }
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test should pass if no runtime GraphQL is detected
    expect(runtimeGraphQLDetected, 'No runtime GraphQL requests should be made in a static site').toBe(false);
  });
});