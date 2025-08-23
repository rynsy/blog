#!/usr/bin/env node

/**
 * Simple accessibility checker that inspects the built HTML files directly
 * without needing a full browser automation setup
 */

const fs = require('fs')
const path = require('path')

function checkBasicAccessibility(htmlContent, filePath) {
  const violations = []
  const warnings = []
  
  // Check for basic accessibility requirements
  
  // 1. HTML lang attribute
  if (!htmlContent.includes('lang=') && !htmlContent.includes('lang ')) {
    violations.push('Missing lang attribute on <html> element')
  }
  
  // 2. Page title
  const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/)
  if (!titleMatch || !titleMatch[1] || titleMatch[1].trim() === '') {
    violations.push('Missing or empty page title')
  } else {
    console.log(`   ✅ Title found: "${titleMatch[1]}"`)
  }
  
  // 3. Skip links
  if (!htmlContent.includes('skip') && !htmlContent.includes('Skip')) {
    warnings.push('No skip links found (recommended for accessibility)')
  }
  
  // 4. Main landmark
  if (!htmlContent.includes('<main') && !htmlContent.includes('role="main"')) {
    violations.push('Missing main landmark')
  }
  
  // 5. Heading structure
  if (!htmlContent.includes('<h1')) {
    violations.push('Missing h1 heading')
  }
  
  // 6. Images without alt text (basic check)
  const imgTags = htmlContent.match(/<img[^>]+>/gi) || []
  let imagesWithoutAlt = 0
  imgTags.forEach(img => {
    if (!img.includes('alt=')) {
      imagesWithoutAlt++
    }
  })
  if (imagesWithoutAlt > 0) {
    violations.push(`${imagesWithoutAlt} image(s) missing alt attributes`)
  }
  
  // 7. Form inputs without labels
  const inputTags = htmlContent.match(/<input[^>]+>/gi) || []
  let inputsWithoutLabels = 0
  inputTags.forEach(input => {
    if (!input.includes('aria-label=') && !input.includes('aria-labelledby=')) {
      // This is a basic check - in reality we'd need to check for associated labels
      inputsWithoutLabels++
    }
  })
  if (inputsWithoutLabels > 0) {
    warnings.push(`${inputsWithoutLabels} input(s) may be missing proper labels (check manually)`)
  }
  
  // 8. Button elements
  const buttonTags = htmlContent.match(/<button[^>]*>/gi) || []
  const divButtons = htmlContent.match(/<div[^>]*role="button"[^>]*>/gi) || []
  const totalButtons = (buttonTags?.length || 0) + (divButtons?.length || 0)
  
  if (totalButtons > 0) {
    console.log(`Found ${totalButtons} button elements`)
  }
  
  return { violations, warnings }
}

function analyzeHTMLFile(filePath) {
  try {
    const htmlContent = fs.readFileSync(filePath, 'utf8')
    const result = checkBasicAccessibility(htmlContent, filePath)
    
    console.log(`\n📄 Analyzing: ${path.relative(process.cwd(), filePath)}`)
    console.log('=' .repeat(60))
    
    if (result.violations.length === 0 && result.warnings.length === 0) {
      console.log('✅ No basic accessibility issues found')
    } else {
      if (result.violations.length > 0) {
        console.log('❌ Violations:')
        result.violations.forEach(violation => {
          console.log(`   • ${violation}`)
        })
      }
      
      if (result.warnings.length > 0) {
        console.log('⚠️  Warnings:')
        result.warnings.forEach(warning => {
          console.log(`   • ${warning}`)
        })
      }
    }
    
    return result
  } catch (error) {
    console.error(`Error analyzing ${filePath}: ${error.message}`)
    return { violations: [], warnings: [] }
  }
}

function findHTMLFiles(dir) {
  const htmlFiles = []
  
  function scanDir(currentDir) {
    const items = fs.readdirSync(currentDir)
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory()) {
        scanDir(fullPath)
      } else if (item.endsWith('.html')) {
        htmlFiles.push(fullPath)
      }
    }
  }
  
  scanDir(dir)
  return htmlFiles
}

function runAccessibilityAudit() {
  const publicDir = path.join(__dirname, '../packages/site/public')
  
  console.log('🚀 Running Basic Accessibility Audit')
  console.log(`📁 Scanning: ${publicDir}`)
  
  if (!fs.existsSync(publicDir)) {
    console.error('❌ Public directory not found. Please run `pnpm build` first.')
    process.exit(1)
  }
  
  const htmlFiles = findHTMLFiles(publicDir)
  console.log(`📄 Found ${htmlFiles.length} HTML files`)
  
  let totalViolations = 0
  let totalWarnings = 0
  
  // Analyze key pages first
  const keyPages = [
    path.join(publicDir, 'index.html'),
    path.join(publicDir, 'about/index.html'),
    path.join(publicDir, 'blog/index.html'),
    path.join(publicDir, '404.html')
  ]
  
  console.log('\n🎯 Analyzing Key Pages:')
  
  for (const keyPage of keyPages) {
    if (fs.existsSync(keyPage)) {
      const result = analyzeHTMLFile(keyPage)
      totalViolations += result.violations.length
      totalWarnings += result.warnings.length
    }
  }
  
  console.log('\n📊 Summary:')
  console.log(`❌ Total violations: ${totalViolations}`)
  console.log(`⚠️  Total warnings: ${totalWarnings}`)
  
  if (totalViolations === 0) {
    console.log('\n🎉 Basic accessibility checks passed!')
  } else {
    console.log('\n🔧 Accessibility improvements needed')
  }
  
  // Return structured data
  return {
    totalFiles: htmlFiles.length,
    violations: totalViolations,
    warnings: totalWarnings
  }
}

if (require.main === module) {
  runAccessibilityAudit()
}

module.exports = { runAccessibilityAudit, checkBasicAccessibility }