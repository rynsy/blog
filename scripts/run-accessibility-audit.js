#!/usr/bin/env node

/**
 * Simple accessibility audit script using axe-core
 * Runs against the built Gatsby site
 */

const { spawn } = require('child_process')
const http = require('http')
const path = require('path')
const fs = require('fs')

// Import axe for Node.js
let axeCore, createHtmlReport

async function importModules() {
  try {
    axeCore = (await import('@axe-core/cli')).default
    console.log('✅ axe-core modules imported successfully')
  } catch (error) {
    console.error('❌ Failed to import axe-core modules:', error.message)
    console.log('📦 Installing axe-core CLI...')
    
    return new Promise((resolve, reject) => {
      const npm = spawn('npm', ['install', '--save-dev', '@axe-core/cli'], { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      })
      
      npm.on('close', (code) => {
        if (code === 0) {
          console.log('✅ axe-core CLI installed successfully')
          resolve()
        } else {
          reject(new Error(`npm install failed with code ${code}`))
        }
      })
    })
  }
}

function startSimpleServer(publicDir, port = 3000) {
  return new Promise((resolve, reject) => {
    // Simple static file server
    const server = http.createServer((req, res) => {
      let filePath = path.join(publicDir, req.url === '/' ? 'index.html' : req.url)
      
      // Security: prevent directory traversal
      if (!filePath.startsWith(publicDir)) {
        res.writeHead(403)
        res.end('Forbidden')
        return
      }
      
      fs.readFile(filePath, (err, content) => {
        if (err) {
          if (err.code === 'ENOENT') {
            res.writeHead(404)
            res.end('Not Found')
          } else {
            res.writeHead(500)
            res.end('Server Error')
          }
          return
        }
        
        // Set content type
        const ext = path.extname(filePath)
        const contentType = {
          '.html': 'text/html',
          '.js': 'text/javascript',
          '.css': 'text/css',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.svg': 'image/svg+xml'
        }[ext] || 'text/plain'
        
        res.writeHead(200, { 'Content-Type': contentType })
        res.end(content)
      })
    })
    
    server.listen(port, () => {
      console.log(`🌐 Server started at http://localhost:${port}`)
      resolve({ server, url: `http://localhost:${port}` })
    })
    
    server.on('error', reject)
  })
}

async function runAxeAudit(url) {
  console.log(`🔍 Running accessibility audit on ${url}`)
  
  return new Promise((resolve, reject) => {
    // Use axe-core CLI to audit the URL
    const axe = spawn('npx', ['@axe-core/cli', url, '--save', 'accessibility-report.json', '--verbose', '--show-errors'], {
      stdio: 'pipe'
    })
    
    let stdout = ''
    let stderr = ''
    
    axe.stdout.on('data', (data) => {
      stdout += data.toString()
    })
    
    axe.stderr.on('data', (data) => {
      stderr += data.toString()
    })
    
    axe.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Accessibility audit completed')
        console.log(stdout)
        resolve({ stdout, violations: [] }) // Parse from stdout if needed
      } else {
        console.error('❌ Accessibility audit failed')
        console.error(stderr)
        reject(new Error(`Axe audit failed with code ${code}`))
      }
    })
  })
}

async function runBasicAccessibilityCheck() {
  const publicDir = path.join(__dirname, '../packages/site/public')
  
  console.log('🚀 Starting accessibility audit...')
  console.log(`📁 Public directory: ${publicDir}`)
  
  // Check if public directory exists
  if (!fs.existsSync(publicDir)) {
    console.error('❌ Public directory not found. Please run `pnpm build` first.')
    process.exit(1)
  }
  
  // Check if index.html exists
  const indexPath = path.join(publicDir, 'index.html')
  if (!fs.existsSync(indexPath)) {
    console.error('❌ index.html not found in public directory.')
    process.exit(1)
  }
  
  let server
  try {
    // Import required modules
    await importModules()
    
    // Start server
    const serverInfo = await startSimpleServer(publicDir, 3001)
    server = serverInfo.server
    
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Run accessibility audit
    const auditResult = await runAxeAudit(serverInfo.url)
    
    console.log('📊 Audit Summary:')
    console.log('- Report saved to: accessibility-report.json')
    console.log('- JSON report contains detailed accessibility results')
    
    // Simple check of common accessibility issues by reading the HTML
    const indexContent = fs.readFileSync(indexPath, 'utf8')
    
    console.log('\n🔍 Basic HTML Structure Check:')
    console.log(`- Has <title>: ${indexContent.includes('<title>') ? '✅' : '❌'}`)
    console.log(`- Has main landmark: ${indexContent.includes('role="main"') || indexContent.includes('<main') ? '✅' : '❌'}`)
    console.log(`- Has skip links: ${indexContent.includes('Skip to') ? '✅' : '❌'}`)
    console.log(`- Has lang attribute: ${indexContent.includes('lang=') ? '✅' : '❌'}`)
    
    return auditResult
    
  } catch (error) {
    console.error('❌ Audit failed:', error.message)
    throw error
  } finally {
    if (server) {
      server.close()
      console.log('🛑 Server stopped')
    }
  }
}

// Run the audit if this script is executed directly
if (require.main === module) {
  runBasicAccessibilityCheck()
    .then(() => {
      console.log('✅ Accessibility audit completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Accessibility audit failed:', error.message)
      process.exit(1)
    })
}

module.exports = { runBasicAccessibilityCheck }