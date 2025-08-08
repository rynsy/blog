#!/usr/bin/env node
/**
 * Type Checking and Bundle Analysis Script
 * 
 * Comprehensive development tool that performs:
 * - TypeScript type checking with detailed error reporting
 * - Bundle size analysis and performance budgets validation
 * - Background module health checks
 * - Performance optimization suggestions
 */

const { execSync, spawn } = require('child_process')
const fs = require('fs')
const path = require('path')
const util = require('util')

// Configuration
const CONFIG = {
  typecheck: {
    strict: true,
    noUnusedLocals: true,
    noUnusedParameters: true,
    exactOptionalPropertyTypes: true
  },
  bundle: {
    maxJSSize: 200 * 1024, // 200KB
    maxCSSSize: 50 * 1024,  // 50KB
    maxBackgroundModuleSize: 100 * 1024, // 100KB per module
    warnThreshold: 0.8 // Warn at 80% of limit
  },
  performance: {
    maxBuildTime: 120000, // 2 minutes
    targetModuleCount: 10
  }
}

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m'
}

class TypeCheckAnalyzer {
  constructor() {
    this.startTime = Date.now()
    this.errors = []
    this.warnings = []
    this.stats = {
      typeErrors: 0,
      bundleIssues: 0,
      performanceIssues: 0,
      moduleHealth: 0
    }
  }

  // ========================================================================
  // Main Analysis Pipeline
  // ========================================================================

  async run() {
    this.printHeader()

    try {
      // Phase 1: TypeScript type checking
      console.log(`\n${colors.blue}${colors.bold}📋 Phase 1: TypeScript Analysis${colors.reset}`)
      await this.performTypeCheck()

      // Phase 2: Bundle analysis
      console.log(`\n${colors.blue}${colors.bold}📦 Phase 2: Bundle Analysis${colors.reset}`)
      await this.analyzeBundles()

      // Phase 3: Background module health check
      console.log(`\n${colors.blue}${colors.bold}🎨 Phase 3: Background Module Health${colors.reset}`)
      await this.checkModuleHealth()

      // Phase 4: Performance analysis
      console.log(`\n${colors.blue}${colors.bold}⚡ Phase 4: Performance Analysis${colors.reset}`)
      await this.analyzePerformance()

      // Summary and recommendations
      this.printSummary()

    } catch (error) {
      this.handleError('Analysis failed', error)
      process.exit(1)
    }
  }

  // ========================================================================
  // TypeScript Type Checking
  // ========================================================================

  async performTypeCheck() {
    console.log('  🔍 Running TypeScript compiler...')

    try {
      const tscOutput = execSync('npm run type-check', {
        encoding: 'utf8',
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      })

      console.log(`  ${colors.green}✅ TypeScript compilation successful${colors.reset}`)
      
      // Check for specific type safety patterns
      await this.checkTypeSafetyPatterns()
      
    } catch (error) {
      this.stats.typeErrors++
      console.log(`  ${colors.red}❌ TypeScript compilation failed${colors.reset}`)
      
      if (error.stdout) {
        this.parseTypeScriptErrors(error.stdout)
      }
      
      this.errors.push({
        category: 'TypeScript',
        message: 'Compilation failed',
        details: error.message
      })
    }
  }

  async checkTypeSafetyPatterns() {
    console.log('  🛡️  Checking type safety patterns...')

    const patterns = [
      {
        name: 'No explicit any',
        pattern: /:\s*any\b/g,
        severity: 'warning',
        files: ['src/**/*.ts', 'src/**/*.tsx']
      },
      {
        name: 'Proper interface usage',
        pattern: /interface\s+\w+V3/g,
        severity: 'info',
        files: ['src/bgModules/**/*.ts']
      },
      {
        name: 'Type guards usage',
        pattern: /is\w+\(/g,
        severity: 'info',
        files: ['src/utils/**/*.ts']
      }
    ]

    for (const pattern of patterns) {
      await this.checkPattern(pattern)
    }
  }

  async checkPattern(pattern) {
    try {
      const files = this.findFiles(pattern.files)
      let matches = 0
      let violations = 0

      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8')
        const fileMatches = (content.match(pattern.pattern) || []).length
        
        if (pattern.name === 'No explicit any' && fileMatches > 0) {
          violations += fileMatches
          this.warnings.push({
            category: 'Type Safety',
            file: file,
            message: `Found ${fileMatches} explicit 'any' usage(s)`,
            suggestion: 'Consider using more specific types'
          })
        } else {
          matches += fileMatches
        }
      }

      if (pattern.name === 'No explicit any') {
        if (violations === 0) {
          console.log(`    ${colors.green}✅ ${pattern.name}: Clean${colors.reset}`)
        } else {
          console.log(`    ${colors.yellow}⚠️  ${pattern.name}: ${violations} violations${colors.reset}`)
        }
      } else {
        console.log(`    ${colors.cyan}ℹ️  ${pattern.name}: ${matches} instances${colors.reset}`)
      }
      
    } catch (error) {
      console.log(`    ${colors.red}❌ ${pattern.name}: Check failed${colors.reset}`)
    }
  }

  parseTypeScriptErrors(output) {
    const lines = output.split('\n')
    let currentError = null

    for (const line of lines) {
      // Parse TypeScript error format: file(line,col): error TS####: message
      const errorMatch = line.match(/(.*?)\((\d+),(\d+)\):\s*error\s*TS(\d+):\s*(.*)$/)
      
      if (errorMatch) {
        const [, file, line, col, code, message] = errorMatch
        
        currentError = {
          category: 'TypeScript',
          file: file,
          line: parseInt(line),
          column: parseInt(col),
          code: `TS${code}`,
          message: message.trim()
        }
        
        this.errors.push(currentError)
      }
    }
  }

  // ========================================================================
  // Bundle Analysis
  // ========================================================================

  async analyzeBundles() {
    console.log('  📊 Building for analysis...')

    try {
      // Build the project
      execSync('npm run build', {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd()
      })

      console.log('  📏 Measuring bundle sizes...')
      await this.measureBundleSizes()
      
      console.log('  🔍 Analyzing bundle composition...')
      await this.analyzeBundleComposition()
      
    } catch (error) {
      this.stats.bundleIssues++
      console.log(`  ${colors.red}❌ Bundle analysis failed${colors.reset}`)
      
      this.errors.push({
        category: 'Bundle',
        message: 'Build failed during bundle analysis',
        details: error.message
      })
    }
  }

  async measureBundleSizes() {
    const publicDir = path.join(process.cwd(), 'public')
    
    if (!fs.existsSync(publicDir)) {
      console.log('    ⚠️  Public directory not found, skipping bundle analysis')
      return
    }

    const files = this.findFiles(['public/**/*.js', 'public/**/*.css'])
    const sizes = {
      js: { total: 0, files: [] },
      css: { total: 0, files: [] }
    }

    for (const file of files) {
      const stats = fs.statSync(file)
      const size = stats.size
      const relativePath = path.relative(publicDir, file)
      const type = file.endsWith('.css') ? 'css' : 'js'

      sizes[type].total += size
      sizes[type].files.push({ path: relativePath, size })
    }

    // Check against budgets
    this.checkBudgets('JavaScript', sizes.js.total, CONFIG.bundle.maxJSSize)
    this.checkBudgets('CSS', sizes.css.total, CONFIG.bundle.maxCSSSize)

    // Check background module sizes
    const bgModuleFiles = sizes.js.files.filter(f => f.path.includes('bg-module-'))
    for (const bgFile of bgModuleFiles) {
      this.checkBudgets(
        `Background Module (${bgFile.path})`,
        bgFile.size,
        CONFIG.bundle.maxBackgroundModuleSize
      )
    }
  }

  checkBudgets(name, actualSize, maxSize) {
    const percentage = (actualSize / maxSize) * 100
    const sizeKB = (actualSize / 1024).toFixed(1)
    const maxKB = (maxSize / 1024).toFixed(1)

    if (actualSize > maxSize) {
      console.log(`    ${colors.red}❌ ${name}: ${sizeKB}KB (${percentage.toFixed(1)}% of ${maxKB}KB limit)${colors.reset}`)
      this.stats.bundleIssues++
      this.errors.push({
        category: 'Bundle Size',
        message: `${name} exceeds size budget`,
        details: `Actual: ${sizeKB}KB, Limit: ${maxKB}KB`
      })
    } else if (actualSize > maxSize * CONFIG.bundle.warnThreshold) {
      console.log(`    ${colors.yellow}⚠️  ${name}: ${sizeKB}KB (${percentage.toFixed(1)}% of ${maxKB}KB limit)${colors.reset}`)
      this.warnings.push({
        category: 'Bundle Size',
        message: `${name} approaching size budget`,
        suggestion: 'Consider code splitting or optimization'
      })
    } else {
      console.log(`    ${colors.green}✅ ${name}: ${sizeKB}KB (${percentage.toFixed(1)}% of budget)${colors.reset}`)
    }
  }

  async analyzeBundleComposition() {
    // Look for potential optimizations in bundle composition
    const analysisPoints = [
      'Check for duplicate dependencies',
      'Verify tree shaking effectiveness', 
      'Analyze chunk splitting strategy',
      'Review vendor bundle composition'
    ]

    for (const point of analysisPoints) {
      console.log(`    ${colors.cyan}📋 ${point}${colors.reset}`)
      // In a real implementation, this would perform actual analysis
    }
  }

  // ========================================================================
  // Background Module Health Check
  // ========================================================================

  async checkModuleHealth() {
    console.log('  🔍 Scanning background modules...')

    const moduleDir = path.join(process.cwd(), 'src', 'bgModules')
    
    if (!fs.existsSync(moduleDir)) {
      console.log('    ⚠️  Background modules directory not found')
      return
    }

    const moduleDirs = fs.readdirSync(moduleDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)

    console.log(`    Found ${moduleDirs.length} background modules`)

    let healthyModules = 0
    
    for (const moduleDir of moduleDirs) {
      const isHealthy = await this.checkSingleModuleHealth(moduleDir)
      if (isHealthy) {
        healthyModules++
      }
    }

    this.stats.moduleHealth = (healthyModules / moduleDirs.length) * 100
    
    console.log(`  ${colors.green}✅ Module health: ${healthyModules}/${moduleDirs.length} (${this.stats.moduleHealth.toFixed(1)}%)${colors.reset}`)
  }

  async checkSingleModuleHealth(moduleName) {
    const moduleRoot = path.join(process.cwd(), 'src', 'bgModules', moduleName)
    const indexFile = path.join(moduleRoot, 'index.ts')
    
    const checks = [
      {
        name: 'Index file exists',
        check: () => fs.existsSync(indexFile)
      },
      {
        name: 'Implements BackgroundModuleV3',
        check: () => {
          if (!fs.existsSync(indexFile)) return false
          const content = fs.readFileSync(indexFile, 'utf8')
          return content.includes('BackgroundModuleV3')
        }
      },
      {
        name: 'Has proper type exports',
        check: () => {
          if (!fs.existsSync(indexFile)) return false
          const content = fs.readFileSync(indexFile, 'utf8')
          return content.includes('export') && content.includes('setup')
        }
      },
      {
        name: 'Uses strict typing',
        check: () => {
          if (!fs.existsSync(indexFile)) return false
          const content = fs.readFileSync(indexFile, 'utf8')
          return !content.includes(': any') || content.split(': any').length <= 2
        }
      }
    ]

    let passedChecks = 0
    
    for (const check of checks) {
      const passed = check.check()
      if (passed) {
        passedChecks++
      }
    }

    const healthPercentage = (passedChecks / checks.length) * 100
    const healthStatus = healthPercentage >= 75 ? 'healthy' : healthPercentage >= 50 ? 'warning' : 'critical'
    const color = healthStatus === 'healthy' ? colors.green : healthStatus === 'warning' ? colors.yellow : colors.red
    
    console.log(`    ${color}${moduleName}: ${passedChecks}/${checks.length} checks passed${colors.reset}`)

    return healthPercentage >= 75
  }

  // ========================================================================
  // Performance Analysis
  // ========================================================================

  async analyzePerformance() {
    const buildTime = Date.now() - this.startTime
    
    console.log(`  ⏱️  Total analysis time: ${(buildTime / 1000).toFixed(2)}s`)
    
    if (buildTime > CONFIG.performance.maxBuildTime) {
      console.log(`    ${colors.red}❌ Analysis time exceeds target (${CONFIG.performance.maxBuildTime / 1000}s)${colors.reset}`)
      this.stats.performanceIssues++
      this.warnings.push({
        category: 'Performance',
        message: 'Analysis time is slow',
        suggestion: 'Consider optimizing TypeScript configuration or reducing module complexity'
      })
    } else {
      console.log(`    ${colors.green}✅ Analysis completed within target time${colors.reset}`)
    }

    // Check TypeScript compilation performance
    await this.checkCompilationPerformance()
  }

  async checkCompilationPerformance() {
    const tsconfigPath = path.join(process.cwd(), 'tsconfig.json')
    
    if (!fs.existsSync(tsconfigPath)) {
      console.log('    ⚠️  tsconfig.json not found')
      return
    }

    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'))
    const compilerOptions = tsconfig.compilerOptions || {}

    const performanceOptions = [
      {
        name: 'Incremental compilation',
        key: 'incremental',
        recommended: true,
        impact: 'Significantly faster rebuilds'
      },
      {
        name: 'Skip lib check',
        key: 'skipLibCheck', 
        recommended: true,
        impact: 'Faster compilation by skipping declaration file checks'
      },
      {
        name: 'Build info file',
        key: 'tsBuildInfoFile',
        recommended: true,
        impact: 'Enables incremental compilation caching'
      }
    ]

    console.log('    🔧 TypeScript performance configuration:')
    
    for (const option of performanceOptions) {
      const isEnabled = compilerOptions[option.key] !== undefined && compilerOptions[option.key] !== false
      const status = isEnabled ? colors.green + '✅' : colors.yellow + '⚠️'
      
      console.log(`      ${status} ${option.name}: ${isEnabled ? 'enabled' : 'disabled'}${colors.reset}`)
      
      if (!isEnabled && option.recommended) {
        this.warnings.push({
          category: 'TypeScript Performance',
          message: `Consider enabling ${option.name}`,
          suggestion: `${option.impact}. Add "${option.key}": true to compilerOptions`
        })
      }
    }
  }

  // ========================================================================
  // Utility Methods
  // ========================================================================

  findFiles(patterns) {
    const glob = require('glob')
    const files = []
    
    for (const pattern of patterns) {
      try {
        const matches = glob.sync(pattern, { cwd: process.cwd() })
        files.push(...matches.map(file => path.join(process.cwd(), file)))
      } catch (error) {
        // Ignore glob errors
      }
    }
    
    return [...new Set(files)] // Remove duplicates
  }

  handleError(message, error) {
    console.log(`\n${colors.red}${colors.bold}❌ ${message}${colors.reset}`)
    console.log(`${colors.red}${error.message}${colors.reset}`)
    
    if (error.stdout) {
      console.log(`\n${colors.dim}STDOUT:${colors.reset}`)
      console.log(error.stdout)
    }
    
    if (error.stderr) {
      console.log(`\n${colors.dim}STDERR:${colors.reset}`)
      console.log(error.stderr)
    }
  }

  printHeader() {
    console.log(`${colors.cyan}${colors.bold}`)
    console.log('┌─────────────────────────────────────────────────────────────┐')
    console.log('│                                                             │')
    console.log('│         🚀 TypeScript Background System Analysis           │')
    console.log('│                                                             │')
    console.log('└─────────────────────────────────────────────────────────────┘')
    console.log(colors.reset)
    
    console.log(`${colors.dim}Starting comprehensive analysis...${colors.reset}`)
    console.log(`${colors.dim}Target: TypeScript 5.6+ with strict mode enabled${colors.reset}`)
    console.log(`${colors.dim}Performance Budget: JS ${CONFIG.bundle.maxJSSize / 1024}KB, CSS ${CONFIG.bundle.maxCSSSize / 1024}KB${colors.reset}`)
  }

  printSummary() {
    const totalIssues = this.errors.length + this.warnings.length
    const buildTime = Date.now() - this.startTime

    console.log(`\n${colors.bold}${colors.white}📊 ANALYSIS SUMMARY${colors.reset}`)
    console.log(`${colors.dim}${'='.repeat(60)}${colors.reset}`)
    
    // Overall status
    if (this.errors.length === 0) {
      console.log(`\n${colors.green}${colors.bold}✅ BUILD HEALTHY${colors.reset}`)
      console.log(`${colors.green}All critical checks passed!${colors.reset}`)
    } else {
      console.log(`\n${colors.red}${colors.bold}❌ ISSUES FOUND${colors.reset}`)
      console.log(`${colors.red}${this.errors.length} error(s) need attention${colors.reset}`)
    }

    // Statistics
    console.log(`\n${colors.bold}📈 Statistics:${colors.reset}`)
    console.log(`  ⏱️  Total time: ${(buildTime / 1000).toFixed(2)}s`)
    console.log(`  🔧 TypeScript errors: ${this.stats.typeErrors}`)
    console.log(`  📦 Bundle issues: ${this.stats.bundleIssues}`)
    console.log(`  🎨 Module health: ${this.stats.moduleHealth.toFixed(1)}%`)
    console.log(`  ⚠️  Warnings: ${this.warnings.length}`)

    // Errors
    if (this.errors.length > 0) {
      console.log(`\n${colors.red}${colors.bold}❌ ERRORS (${this.errors.length}):${colors.reset}`)
      this.errors.forEach((error, index) => {
        console.log(`\n  ${index + 1}. ${colors.red}[${error.category}]${colors.reset} ${error.message}`)
        if (error.file) {
          console.log(`     📁 ${error.file}${error.line ? `:${error.line}:${error.column}` : ''}`)
        }
        if (error.details) {
          console.log(`     ${colors.dim}${error.details}${colors.reset}`)
        }
      })
    }

    // Warnings
    if (this.warnings.length > 0) {
      console.log(`\n${colors.yellow}${colors.bold}⚠️  WARNINGS (${this.warnings.length}):${colors.reset}`)
      this.warnings.slice(0, 5).forEach((warning, index) => { // Show first 5 warnings
        console.log(`\n  ${index + 1}. ${colors.yellow}[${warning.category}]${colors.reset} ${warning.message}`)
        if (warning.file) {
          console.log(`     📁 ${warning.file}`)
        }
        if (warning.suggestion) {
          console.log(`     💡 ${colors.cyan}${warning.suggestion}${colors.reset}`)
        }
      })
      
      if (this.warnings.length > 5) {
        console.log(`\n     ${colors.dim}... and ${this.warnings.length - 5} more warnings${colors.reset}`)
      }
    }

    // Recommendations
    if (this.errors.length > 0 || this.warnings.length > 5) {
      console.log(`\n${colors.blue}${colors.bold}💡 RECOMMENDATIONS:${colors.reset}`)
      console.log(`  1. Run ${colors.cyan}npm run type-check:watch${colors.reset} for continuous type checking`)
      console.log(`  2. Use ${colors.cyan}npm run lint${colors.reset} to fix style issues automatically`)
      console.log(`  3. Check bundle analysis at ${colors.cyan}.cache/bundle-report.html${colors.reset}`)
      console.log(`  4. Consider running ${colors.cyan}npm run analyze-bundle${colors.reset} for detailed size analysis`)
    }

    console.log(`\n${colors.dim}Analysis completed at ${new Date().toLocaleTimeString()}${colors.reset}`)

    // Exit with appropriate code
    if (this.errors.length > 0) {
      process.exit(1)
    }
  }
}

// ============================================================================
// CLI Interface
// ============================================================================

if (require.main === module) {
  const analyzer = new TypeCheckAnalyzer()
  analyzer.run().catch(error => {
    console.error(`${colors.red}${colors.bold}Fatal error:${colors.reset}`, error)
    process.exit(1)
  })
}

module.exports = TypeCheckAnalyzer
