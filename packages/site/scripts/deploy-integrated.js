#!/usr/bin/env node

/**
 * Integrated Deployment Script
 * Handles environment-aware builds with header generation and deployment
 * 
 * Usage:
 *   npm run deploy:cf:integrated
 *   npm run deploy:gh:integrated  
 *   npm run build:integrated [environment]
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { generateHeaders } = require('./generate-headers');

// Configuration
const config = {
  environments: {
    development: {
      NODE_ENV: 'development',
      GATSBY_ENV: 'development',
      buildCommand: 'build:gh',
      deploymentType: 'github-pages',
      description: 'Development build with drafts visible'
    },
    production: {
      NODE_ENV: 'production', 
      GATSBY_ENV: 'production',
      buildCommand: 'build:cf',
      deploymentType: 'cloudflare-pages',
      description: 'Production build with only published content'
    },
    preview: {
      NODE_ENV: 'production',
      GATSBY_ENV: 'development', 
      buildCommand: 'build:cf',
      deploymentType: 'cloudflare-pages-preview',
      description: 'Production build with development content for preview'
    }
  }
};

// Utility functions
function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green  
    warning: '\x1b[33m', // Yellow
    error: '\x1b[31m',   // Red
    reset: '\x1b[0m'
  };
  
  const prefix = {
    info: 'ℹ',
    success: '✅', 
    warning: '⚠️',
    error: '❌'
  };
  
  console.log(`${colors[type]}${prefix[type]} ${message}${colors.reset}`);
}

function execCommand(command, description, options = {}) {
  log(`Running: ${command}`, 'info');
  try {
    const result = execSync(command, { 
      stdio: options.silent ? 'pipe' : 'inherit', 
      encoding: 'utf8',
      ...options 
    });
    log(`${description} completed successfully`, 'success');
    return result;
  } catch (error) {
    log(`${description} failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

function setEnvironmentVars(env) {
  const envConfig = config.environments[env];
  if (!envConfig) {
    log(`Unknown environment: ${env}`, 'error');
    process.exit(1);
  }
  
  // Set environment variables
  process.env.NODE_ENV = envConfig.NODE_ENV;
  process.env.GATSBY_ENV = envConfig.GATSBY_ENV;
  
  log(`Environment set to: ${env}`, 'info');
  log(`NODE_ENV: ${envConfig.NODE_ENV}`, 'info');
  log(`GATSBY_ENV: ${envConfig.GATSBY_ENV}`, 'info');
  log(`Description: ${envConfig.description}`, 'info');
  
  return envConfig;
}

function checkPrerequisites() {
  log('Checking prerequisites...', 'info');
  
  // Check if we're in the right directory
  if (!fs.existsSync('package.json')) {
    log('Must be run from the site package directory', 'error');
    process.exit(1);
  }
  
  // Check if CSP config exists
  if (!fs.existsSync('csp-config.json')) {
    log('CSP configuration file not found', 'error');
    process.exit(1);
  }
  
  log('Prerequisites check passed', 'success');
}

function generateHeadersWithEnvironment(env) {
  log(`Generating headers for ${env} environment...`, 'info');
  
  try {
    generateHeaders();
    
    // Add environment-specific comments to headers file
    const headersPath = path.join(__dirname, '../static/_headers');
    let content = fs.readFileSync(headersPath, 'utf8');
    
    const envComment = `# Environment: ${env} (NODE_ENV=${process.env.NODE_ENV}, GATSBY_ENV=${process.env.GATSBY_ENV})`;
    content = content.replace(
      /# Last generated: .*/,
      `$&\n${envComment}`
    );
    
    fs.writeFileSync(headersPath, content);
    log('Headers generated with environment info', 'success');
  } catch (error) {
    log(`Header generation failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

function buildSite(envConfig) {
  log(`Building site using ${envConfig.buildCommand}...`, 'info');
  execCommand(`npm run ${envConfig.buildCommand}`, 'Site build');
  
  // Verify build output
  if (!fs.existsSync('public/index.html')) {
    log('Build verification failed - no index.html found', 'error');
    process.exit(1);
  }
  
  log('Build verification passed', 'success');
}

function deployToCloudflare(preview = false) {
  const command = preview 
    ? 'npx wrangler pages deploy public --project-name rynsy-personal-site --compatibility-date 2024-10-01'
    : 'npx wrangler pages deploy public --project-name rynsy-personal-site';
    
  log(`Deploying to Cloudflare Pages ${preview ? '(preview)' : '(production)'}...`, 'info');
  
  try {
    const output = execCommand(command, 'Cloudflare deployment');
    
    // Extract deployment URL from output
    const urlMatch = output?.match(/https:\/\/[^\s]+/);
    if (urlMatch) {
      log(`Deployment URL: ${urlMatch[0]}`, 'success');
    }
    
  } catch (error) {
    log('Deployment failed - check Wrangler configuration', 'error');
    log('Make sure CLOUDFLARE_API_TOKEN is set in your environment', 'warning');
    process.exit(1);
  }
}

function showDeploymentSummary(env, envConfig) {
  console.log('\\n' + '='.repeat(50));
  log('DEPLOYMENT SUMMARY', 'success');
  console.log('='.repeat(50));
  console.log(`Environment: ${env}`);
  console.log(`Build type: ${envConfig.buildCommand}`);
  console.log(`Deployment: ${envConfig.deploymentType}`);
  console.log(`Description: ${envConfig.description}`);
  console.log(`Node Environment: ${process.env.NODE_ENV}`);
  console.log(`Gatsby Environment: ${process.env.GATSBY_ENV}`);
  console.log('='.repeat(50) + '\\n');
}

// Main functions
function buildIntegrated(env = 'development') {
  log(`Starting integrated build for ${env} environment`, 'info');
  
  checkPrerequisites();
  const envConfig = setEnvironmentVars(env);
  generateHeadersWithEnvironment(env);
  buildSite(envConfig);
  
  log(`Build completed successfully for ${env} environment`, 'success');
  return envConfig;
}

function deployCloudflareIntegrated(preview = false) {
  const env = preview ? 'preview' : 'production';
  log(`Starting integrated Cloudflare deployment (${env})`, 'info');
  
  const envConfig = buildIntegrated(env);
  deployToCloudflare(preview);
  showDeploymentSummary(env, envConfig);
  
  log('Integrated Cloudflare deployment completed successfully', 'success');
}

function deployGitHubIntegrated() {
  log('Starting integrated GitHub Pages deployment', 'info');
  
  const envConfig = buildIntegrated('development');
  
  // GitHub Pages deployment is handled by GitHub Actions
  log('Build ready for GitHub Pages deployment', 'success');
  log('Push to main branch to trigger GitHub Actions deployment', 'info');
  
  showDeploymentSummary('development', envConfig);
}

// CLI interface
function main() {
  const command = process.argv[2];
  const argument = process.argv[3];
  
  switch (command) {
    case 'build':
      buildIntegrated(argument || 'development');
      break;
      
    case 'deploy:cf':
      deployCloudflareIntegrated(false);
      break;
      
    case 'deploy:cf:preview':
      deployCloudflareIntegrated(true);
      break;
      
    case 'deploy:gh':
      deployGitHubIntegrated();
      break;
      
    default:
      console.log('Integrated Deployment Script');
      console.log('');
      console.log('Usage:');
      console.log('  node scripts/deploy-integrated.js build [environment]');
      console.log('  node scripts/deploy-integrated.js deploy:cf');
      console.log('  node scripts/deploy-integrated.js deploy:cf:preview');
      console.log('  node scripts/deploy-integrated.js deploy:gh');
      console.log('');
      console.log('Environments: development, production, preview');
      process.exit(1);
  }
}

// Export for use as module
module.exports = {
  buildIntegrated,
  deployCloudflareIntegrated,
  deployGitHubIntegrated
};

// Run if called directly
if (require.main === module) {
  main();
}