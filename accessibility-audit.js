#!/usr/bin/env node
/**
 * Comprehensive Accessibility Audit Script
 * 
 * This script performs automated accessibility testing using Playwright and axe-core
 * to identify WCAG 2.1 compliance issues across the site.
 */

const fs = require('fs')
const path = require('path')
const { chromium } = require('playwright')
const { injectAxe, checkA11y, getViolations } = require('axe-playwright')

const SITE_URL = process.env.SITE_URL || 'http://localhost:8000'

// Pages to test
const TEST_PAGES = [
  '/',
  '/about',
  '/portfolio', 
  '/blog',
  '/reading',
  '/contact'
]

// WCAG 2.1 AA compliance configuration
const AXE_CONFIG = {
  rules: {
    // WCAG 2.1 Level AA rules
    'color-contrast': { enabled: true },
    'focus-order-semantics': { enabled: true },
    'heading-order': { enabled: true },
    'label': { enabled: true },
    'landmark-one-main': { enabled: true },
    'link-name': { enabled: true },
    'region': { enabled: true },
    'skip-link': { enabled: true },
    'tabindex': { enabled: true },
    'aria-allowed-attr': { enabled: true },
    'aria-hidden-focus': { enabled: true },
    'aria-input-field-name': { enabled: true },
    'aria-required-attr': { enabled: true },
    'aria-valid-attr': { enabled: true },
    'aria-valid-attr-value': { enabled: true },
    'button-name': { enabled: true },
    'form-field-multiple-labels': { enabled: true },
    'image-alt': { enabled: true },
    'input-button-name': { enabled: true },
    'keyboard': { enabled: true },
    'no-autoplay-audio': { enabled: true }
  },
  tags: ['wcag2a', 'wcag2aa', 'wcag21aa']
}

async function testPageAccessibility(page, url) {
  console.log(`\n🔍 Testing: ${url}`)
  
  try {
    // Navigate to page
    await page.goto(url, { waitUntil: 'networkidle' })
    
    // Wait for any background modules to load
    await page.waitForTimeout(2000)
    
    // Inject axe-core
    await injectAxe(page)
    
    // Run accessibility audit
    const results = await page.evaluate(async (config) => {
      return await window.axe.run(config)
    }, AXE_CONFIG)
    
    return {
      url,
      violations: results.violations,
      passes: results.passes,
      incomplete: results.incomplete,
      inapplicable: results.inapplicable
    }
    
  } catch (error) {
    console.error(`❌ Error testing ${url}:`, error.message)
    return {
      url,
      error: error.message,
      violations: [],
      passes: [],
      incomplete: [],
      inapplicable: []
    }
  }
}

async function testKeyboardNavigation(page, url) {
  console.log(`\n⌨️  Testing keyboard navigation: ${url}`)
  
  await page.goto(url, { waitUntil: 'networkidle' })
  
  const keyboardIssues = []
  
  try {
    // Test Tab navigation
    const focusableElements = await page.$$eval('*', elements => {
      return elements
        .filter(el => {
          const style = window.getComputedStyle(el)
          return style.display !== 'none' && 
                 style.visibility !== 'hidden' &&
                 (el.tabIndex >= 0 || 
                  ['button', 'input', 'select', 'textarea', 'a', 'area'].includes(el.tagName.toLowerCase()) ||
                  el.hasAttribute('tabindex'))
        })
        .map(el => ({
          tagName: el.tagName,
          id: el.id,
          className: el.className,
          role: el.getAttribute('role'),
          ariaLabel: el.getAttribute('aria-label'),
          tabIndex: el.tabIndex
        }))
    })
    
    // Test focus indicators
    for (let i = 0; i < Math.min(focusableElements.length, 10); i++) {
      await page.keyboard.press('Tab')
      await page.waitForTimeout(100)
      
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement
        if (!el) return null
        
        const computedStyle = window.getComputedStyle(el)
        const pseudoStyle = window.getComputedStyle(el, ':focus')
        
        return {
          tagName: el.tagName,
          id: el.id,
          className: el.className,
          hasFocusStyle: computedStyle.outline !== 'none' || 
                        computedStyle.outlineWidth !== '0px' ||
                        pseudoStyle.boxShadow !== 'none' ||
                        computedStyle.borderColor !== pseudoStyle.borderColor
        }
      })
      
      if (focusedElement && !focusedElement.hasFocusStyle) {
        keyboardIssues.push({
          type: 'missing-focus-indicator',
          element: focusedElement,
          message: 'Element lacks visible focus indicator'
        })
      }
    }
    
    // Test Escape key handling for modals/overlays
    const hasModals = await page.evaluate(() => {
      return document.querySelectorAll('[role="dialog"], [role="modal"], .modal, .overlay').length > 0
    })
    
    if (hasModals) {
      await page.keyboard.press('Escape')
      await page.waitForTimeout(500)
      
      const modalsStillOpen = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('[role="dialog"], [role="modal"], .modal, .overlay'))
          .some(el => window.getComputedStyle(el).display !== 'none')
      })
      
      if (modalsStillOpen) {
        keyboardIssues.push({
          type: 'escape-not-handled',
          message: 'Modal/overlay does not close on Escape key'
        })
      }
    }
    
  } catch (error) {
    keyboardIssues.push({
      type: 'navigation-error',
      message: error.message
    })
  }
  
  return {
    url,
    focusableCount: await page.$$eval('*', els => 
      els.filter(el => el.tabIndex >= 0 || 
        ['button', 'input', 'select', 'textarea', 'a', 'area'].includes(el.tagName.toLowerCase())
      ).length
    ),
    issues: keyboardIssues
  }
}

async function testColorContrast(page, url) {
  console.log(`\n🎨 Testing color contrast: ${url}`)
  
  await page.goto(url, { waitUntil: 'networkidle' })
  
  const contrastIssues = await page.evaluate(() => {
    const issues = []
    
    // Get all text elements
    const textElements = Array.from(document.querySelectorAll('*')).filter(el => {
      const style = window.getComputedStyle(el)
      return style.fontSize && 
             el.textContent && 
             el.textContent.trim() !== '' &&
             style.display !== 'none' &&
             style.visibility !== 'hidden'
    })
    
    textElements.forEach(el => {
      const style = window.getComputedStyle(el)
      const color = style.color
      const backgroundColor = style.backgroundColor
      const fontSize = parseFloat(style.fontSize)
      const fontWeight = style.fontWeight
      
      // Simple contrast check (this is a basic implementation)
      // In real testing, you'd want to use a proper contrast calculation library
      if (color && backgroundColor && color !== backgroundColor) {
        const isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700))
        
        issues.push({
          element: {
            tagName: el.tagName,
            id: el.id,
            className: el.className,
            text: el.textContent.substring(0, 50)
          },
          color,
          backgroundColor,
          fontSize,
          fontWeight,
          isLargeText,
          needsManualCheck: true
        })
      }
    })
    
    return issues
  })
  
  return {
    url,
    contrastElements: contrastIssues.length,
    issues: contrastIssues.slice(0, 5) // Limit output
  }
}

async function runFullAudit() {
  console.log('🚀 Starting Comprehensive Accessibility Audit\n')
  console.log(`Testing ${TEST_PAGES.length} pages for WCAG 2.1 AA compliance`)
  console.log(`Site URL: ${SITE_URL}`)
  
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()
  
  const auditResults = {
    timestamp: new Date().toISOString(),
    siteUrl: SITE_URL,
    pages: [],
    summary: {
      totalViolations: 0,
      criticalViolations: 0,
      keyboardIssues: 0,
      contrastIssues: 0
    }
  }
  
  for (const testPath of TEST_PAGES) {
    const fullUrl = `${SITE_URL}${testPath}`
    
    try {
      // Run accessibility audit
      const a11yResults = await testPageAccessibility(page, fullUrl)
      
      // Run keyboard navigation test
      const keyboardResults = await testKeyboardNavigation(page, fullUrl)
      
      // Run color contrast test
      const contrastResults = await testColorContrast(page, fullUrl)
      
      const pageResults = {
        path: testPath,
        url: fullUrl,
        accessibility: a11yResults,
        keyboard: keyboardResults,
        contrast: contrastResults
      }
      
      auditResults.pages.push(pageResults)
      
      // Update summary
      auditResults.summary.totalViolations += a11yResults.violations.length
      auditResults.summary.criticalViolations += a11yResults.violations.filter(v => v.impact === 'critical').length
      auditResults.summary.keyboardIssues += keyboardResults.issues.length
      auditResults.summary.contrastIssues += contrastResults.issues.length
      
    } catch (error) {
      console.error(`❌ Failed to test ${testPath}:`, error.message)
      auditResults.pages.push({
        path: testPath,
        url: fullUrl,
        error: error.message
      })
    }
  }
  
  await browser.close()
  
  // Save results
  const resultsPath = path.join(__dirname, 'accessibility-audit-results.json')
  fs.writeFileSync(resultsPath, JSON.stringify(auditResults, null, 2))
  
  // Generate summary report
  generateReport(auditResults)
  
  return auditResults
}

function generateReport(results) {
  console.log('\n📊 ACCESSIBILITY AUDIT SUMMARY')
  console.log('=' .repeat(50))
  
  console.log(`\nTotal Pages Tested: ${results.pages.length}`)
  console.log(`Total Violations: ${results.summary.totalViolations}`)
  console.log(`Critical Violations: ${results.summary.criticalViolations}`)
  console.log(`Keyboard Issues: ${results.summary.keyboardIssues}`)
  console.log(`Elements Needing Contrast Check: ${results.summary.contrastIssues}`)
  
  // Detailed violations by page
  results.pages.forEach(page => {
    if (page.accessibility && page.accessibility.violations.length > 0) {
      console.log(`\n🚨 ${page.path} - ${page.accessibility.violations.length} violations:`)
      page.accessibility.violations.forEach(violation => {
        console.log(`  • ${violation.id}: ${violation.description}`)
        console.log(`    Impact: ${violation.impact} | Nodes: ${violation.nodes.length}`)
      })
    }
    
    if (page.keyboard && page.keyboard.issues.length > 0) {
      console.log(`\n⌨️  ${page.path} - ${page.keyboard.issues.length} keyboard issues:`)
      page.keyboard.issues.forEach(issue => {
        console.log(`  • ${issue.type}: ${issue.message}`)
      })
    }
  })
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS')
  console.log('=' .repeat(30))
  
  if (results.summary.totalViolations === 0) {
    console.log('✅ No automated accessibility violations found!')
  } else {
    console.log('1. Address critical violations first')
    console.log('2. Ensure all interactive elements have proper focus indicators')
    console.log('3. Verify color contrast ratios meet WCAG AA standards')
    console.log('4. Test with actual screen readers (NVDA, JAWS, VoiceOver)')
    console.log('5. Conduct user testing with people who use assistive technologies')
  }
  
  console.log(`\n📄 Full results saved to: accessibility-audit-results.json`)
}

// Run audit if called directly
if (require.main === module) {
  runFullAudit().catch(console.error)
}

module.exports = { runFullAudit, testPageAccessibility, testKeyboardNavigation, testColorContrast }