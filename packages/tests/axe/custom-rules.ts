import { RunOptions } from 'axe-core'

// Custom axe-core configuration for background module testing
export const axeConfig: RunOptions = {
  rules: {
    // Disable color-contrast for canvas elements since they're dynamic
    'color-contrast': {
      enabled: true,
      // Exclude canvas from color contrast checks
      selector: ':not(canvas)'
    },
    
    // Ensure canvas elements have proper accessibility attributes
    'canvas-accessible-text': {
      enabled: true
    },
    
    // Focus management for interactive modules
    'focus-visible': {
      enabled: true
    },
    
    // Ensure proper keyboard navigation
    'keyboard-navigation': {
      enabled: true
    }
  },
  
  // Tags to run - focus on critical accessibility issues
  tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
  
  // Exclude dynamic content that changes frequently
  exclude: [
    '#gatsby-focus-wrapper canvas', // Dynamic canvas content
    '.background-animation',        // Animation elements
  ],
  
  // Include specific regions for testing
  include: [
    'main',                        // Main content area
    '[role="main"]',              // ARIA main landmark
    '.control-tray',              // Background controls
    '.theme-toggle'               // Theme switching controls
  ]
}

// Custom accessibility checks specific to background modules
export const backgroundModuleChecks = {
  // Check that canvas elements have proper ARIA labels
  canvasAccessibility: {
    selector: 'canvas',
    evaluate: (node: Element) => {
      const hasAriaLabel = node.hasAttribute('aria-label')
      const hasAriaLabelledby = node.hasAttribute('aria-labelledby')
      const hasRole = node.hasAttribute('role')
      
      return hasAriaLabel || hasAriaLabelledby || hasRole
    },
    metadata: {
      impact: 'serious',
      messages: {
        pass: 'Canvas element has appropriate accessibility attributes',
        fail: 'Canvas element lacks accessibility attributes (aria-label, aria-labelledby, or role)'
      }
    }
  },
  
  // Check that interactive modules are keyboard accessible
  keyboardAccessibility: {
    selector: '[data-interactive="true"]',
    evaluate: (node: Element) => {
      const hasTabindex = node.hasAttribute('tabindex')
      const hasFocusHandler = node.hasAttribute('data-keyboard-accessible')
      
      return hasTabindex || hasFocusHandler || node.tagName === 'BUTTON'
    },
    metadata: {
      impact: 'critical',
      messages: {
        pass: 'Interactive element is keyboard accessible',
        fail: 'Interactive element cannot be accessed via keyboard'
      }
    }
  },
  
  // Check that theme changes maintain adequate contrast
  themeContrast: {
    selector: '.theme-aware',
    evaluate: (node: Element) => {
      const computedStyle = window.getComputedStyle(node)
      const bgColor = computedStyle.backgroundColor
      const textColor = computedStyle.color
      
      // Basic contrast check (simplified)
      return bgColor !== textColor && bgColor !== 'transparent'
    },
    metadata: {
      impact: 'moderate',
      messages: {
        pass: 'Theme-aware element maintains visual distinction',
        fail: 'Theme-aware element may have contrast issues'
      }
    }
  }
}

// Helper to run accessibility tests on background modules
export const runBackgroundModuleA11yTest = async (page: any, moduleId: string) => {
  // Navigate to the specific module
  await page.goto(`/?egg=${moduleId}`)
  await page.waitForTimeout(500) // Allow module to initialize
  
  // Run standard axe checks
  const results = await page.evaluate(async () => {
    // @ts-ignore - axe is injected by axe-playwright  
    return await axe.run(axeConfig)
  })
  
  return results
}

export default axeConfig