#!/usr/bin/env node
/**
 * Basic Accessibility Audit Script using existing Playwright setup
 * 
 * This script performs automated accessibility testing using the project's
 * existing Playwright and axe-playwright dependencies.
 */

const { chromium } = require('playwright')
const { injectAxe, checkA11y } = require('axe-playwright')
const fs = require('fs')

const SITE_URL = 'http://localhost:8000'

// Core pages to test for accessibility
const TEST_PAGES = [
  { path: '/', name: 'Home' },
  { path: '/about', name: 'About' },
  { path: '/blog', name: 'Blog' },
  { path: '/portfolio', name: 'Portfolio' }
]

async function runAccessibilityAudit() {
  console.log('🚀 Starting Basic Accessibility Audit')
  console.log(`Testing site: ${SITE_URL}`)
  
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    // Test with different viewport sizes
    viewport: { width: 1200, height: 800 }
  })
  const page = await context.newPage()
  
  const results = {
    timestamp: new Date().toISOString(),
    summary: { totalViolations: 0, criticalViolations: 0, pages: [] }
  }
  
  for (const testPage of TEST_PAGES) {
    const url = `${SITE_URL}${testPage.path}`
    console.log(`\n🔍 Testing: ${testPage.name} (${url})`)
    
    try {
      // Navigate and wait for content to load
      await page.goto(url, { waitUntil: 'networkidle' })
      await page.waitForTimeout(2000) // Wait for background modules
      
      // Inject axe-core
      await injectAxe(page)
      
      // Basic accessibility check
      const violations = await page.evaluate(async () => {
        const results = await axe.run({
          rules: {
            'color-contrast': { enabled: true },
            'focus-order-semantics': { enabled: true },
            'heading-order': { enabled: true },
            'label': { enabled: true },
            'link-name': { enabled: true },
            'button-name': { enabled: true },
            'image-alt': { enabled: true },
            'aria-allowed-attr': { enabled: true },
            'aria-required-attr': { enabled: true },
            'keyboard': { enabled: true }
          },
          tags: ['wcag2a', 'wcag2aa']
        })
        return results.violations
      })
      
      // Test basic keyboard navigation
      const keyboardTest = await testKeyboardNavigation(page)
      
      // Test focus management
      const focusTest = await testFocusManagement(page)
      
      const pageResult = {
        page: testPage.name,
        url,
        violations: violations.length,
        critical: violations.filter(v => v.impact === 'critical').length,
        serious: violations.filter(v => v.impact === 'serious').length,
        moderate: violations.filter(v => v.impact === 'moderate').length,
        minor: violations.filter(v => v.impact === 'minor').length,
        keyboardIssues: keyboardTest.issues,
        focusIssues: focusTest.issues,
        detailedViolations: violations.map(v => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          help: v.help,
          helpUrl: v.helpUrl,
          nodes: v.nodes.length
        }))
      }
      
      results.summary.pages.push(pageResult)
      results.summary.totalViolations += violations.length
      results.summary.criticalViolations += violations.filter(v => v.impact === 'critical').length
      
      console.log(`  ✅ Violations found: ${violations.length}`)
      if (violations.length > 0) {
        console.log(`     Critical: ${pageResult.critical}, Serious: ${pageResult.serious}`)
      }
      
    } catch (error) {
      console.error(`  ❌ Error testing ${testPage.name}:`, error.message)
      results.summary.pages.push({
        page: testPage.name,
        url,
        error: error.message
      })
    }
  }
  
  await browser.close()
  
  // Save detailed results
  fs.writeFileSync('./accessibility-results.json', JSON.stringify(results, null, 2))
  
  // Print summary
  printSummary(results)
  
  return results
}

async function testKeyboardNavigation(page) {
  const issues = []
  
  try {
    // Test Tab key navigation
    const focusableElements = await page.$$eval('*', elements => {
      return elements.filter(el => {
        const style = getComputedStyle(el)
        return style.display !== 'none' && 
               style.visibility !== 'hidden' &&
               (el.tabIndex >= 0 || 
                el.matches('button, input, select, textarea, a[href], area[href]'))
      }).length
    })
    
    // Test a few tab stops
    for (let i = 0; i < Math.min(5, focusableElements); i++) {
      await page.keyboard.press('Tab')
      const focused = await page.evaluate(() => document.activeElement?.tagName || 'none')
      if (focused === 'none') {
        issues.push('No focus indicator visible')
        break
      }
    }
    
  } catch (error) {
    issues.push(`Keyboard navigation error: ${error.message}`)
  }
  
  return { issues }
}

async function testFocusManagement(page) {
  const issues = []
  
  try {
    // Check for focus traps in modals/dialogs
    const hasModals = await page.evaluate(() => {
      return document.querySelectorAll('[role="dialog"], .modal, [aria-modal="true"]').length > 0
    })
    
    if (hasModals) {
      // Test escape key handling
      await page.keyboard.press('Escape')
      await page.waitForTimeout(500)
    }
    
    // Check for skip links
    const hasSkipLinks = await page.evaluate(() => {
      return document.querySelector('a[href="#main"], a[href="#content"], .skip-link') !== null
    })
    
    if (!hasSkipLinks) {
      issues.push('No skip navigation links found')
    }
    
  } catch (error) {
    issues.push(`Focus management error: ${error.message}`)
  }
  
  return { issues }
}

function printSummary(results) {
  console.log('\n📊 ACCESSIBILITY AUDIT SUMMARY')
  console.log('=' .repeat(40))
  console.log(`Total violations: ${results.summary.totalViolations}`)
  console.log(`Critical violations: ${results.summary.criticalViolations}`)
  
  console.log('\n📄 By Page:')
  results.summary.pages.forEach(page => {
    if (page.error) {
      console.log(`❌ ${page.page}: Error - ${page.error}`)
    } else {
      console.log(`${page.violations === 0 ? '✅' : '⚠️'} ${page.page}: ${page.violations} violations`)
      if (page.violations > 0) {
        console.log(`   Critical: ${page.critical}, Serious: ${page.serious}, Moderate: ${page.moderate}, Minor: ${page.minor}`)
      }
      if (page.keyboardIssues?.length > 0) {
        console.log(`   Keyboard issues: ${page.keyboardIssues.length}`)
      }
    }
  })
  
  if (results.summary.totalViolations > 0) {
    console.log('\n🔧 Next Steps:')
    console.log('1. Review accessibility-results.json for detailed violations')
    console.log('2. Fix critical and serious violations first')
    console.log('3. Test with screen readers (NVDA, JAWS, VoiceOver)')
    console.log('4. Verify keyboard navigation works completely')
  } else {
    console.log('\n🎉 No automated accessibility violations found!')
    console.log('Still recommended: Manual testing with screen readers')
  }
}

// Run if called directly
if (require.main === module) {
  runAccessibilityAudit().catch(console.error)
}

module.exports = { runAccessibilityAudit }