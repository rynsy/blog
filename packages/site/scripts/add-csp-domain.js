#!/usr/bin/env node

/**
 * Interactive helper for adding CSP domains
 * Usage: node scripts/add-csp-domain.js
 * 
 * This script provides an interactive way to add domains to CSP configuration
 * without manually editing the JSON file.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const configPath = path.join(__dirname, '../csp-config.json');

// Available CSP directives
const CSP_DIRECTIVES = {
  'img-src': 'Image sources (photos, icons, etc.)',
  'media-src': 'Video and audio sources',
  'script-src': 'JavaScript sources',
  'style-src': 'CSS sources', 
  'font-src': 'Font sources',
  'connect-src': 'AJAX/API/WebSocket connections',
  'frame-src': 'Iframe sources',
  'object-src': 'Object/embed sources'
};

const COMMON_CATEGORIES = [
  'media',
  'analytics', 
  'fonts',
  'widgets',
  'social',
  'cdn',
  'tools',
  'other'
];

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Ask a question and return promise with answer
 */
function ask(question) {
  return new Promise(resolve => {
    rl.question(question, answer => resolve(answer.trim()));
  });
}

/**
 * Show menu and get selection
 */
async function selectFromMenu(title, options, allowCustom = false) {
  console.log(`\n${title}:`);
  
  const entries = Object.entries(options);
  entries.forEach(([key, value], index) => {
    const desc = typeof value === 'string' ? ` - ${value}` : '';
    console.log(`  ${index + 1}. ${key}${desc}`);
  });
  
  if (allowCustom) {
    console.log(`  ${entries.length + 1}. Other (specify custom value)`);
  }
  
  while (true) {
    const answer = await ask('\nSelect option (number): ');
    const num = parseInt(answer);
    
    if (num >= 1 && num <= entries.length) {
      return entries[num - 1][0];
    }
    
    if (allowCustom && num === entries.length + 1) {
      return await ask('Enter custom value: ');
    }
    
    console.log('Invalid selection. Please try again.');
  }
}

/**
 * Validate domain format
 */
function validateDomain(domain) {
  // Allow special values
  if (["'self'", "'unsafe-inline'", "'unsafe-eval'", "data:", "blob:"].includes(domain)) {
    return true;
  }
  
  // Check for basic domain format
  const domainRegex = /^(\*\.)?[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\/?.*$/;
  return domainRegex.test(domain);
}

/**
 * Add domain to CSP configuration
 */
async function addDomain() {
  try {
    console.log('🔒 CSP Domain Addition Tool\n');
    
    // Read current config
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // Get domain
    let domain;
    while (true) {
      domain = await ask('Enter domain to add (e.g., example.com, *.example.com): ');
      if (domain && validateDomain(domain)) break;
      console.log('❌ Invalid domain format. Please try again.');
    }
    
    // Get directive
    const directive = await selectFromMenu('Select CSP directive', CSP_DIRECTIVES);
    
    // Get purpose
    const purpose = await ask('Enter purpose/reason for this domain: ');
    
    // Get category
    const categoryOptions = COMMON_CATEGORIES.reduce((acc, cat) => {
      acc[cat] = '';
      return acc;
    }, {});
    const category = await selectFromMenu('Select category', categoryOptions, true);
    
    // Create domain entry
    const domainEntry = {
      domain,
      purpose,
      category
    };
    
    // Add to configuration
    if (!config.csp[directive]) {
      config.csp[directive] = [];
    }
    
    // Check if domain already exists
    const exists = config.csp[directive].some(entry => {
      const existingDomain = typeof entry === 'string' ? entry : entry.domain;
      return existingDomain === domain;
    });
    
    if (exists) {
      console.log(`⚠️  Domain ${domain} already exists in ${directive}`);
      const overwrite = await ask('Overwrite existing entry? (y/N): ');
      if (overwrite.toLowerCase() !== 'y') {
        console.log('❌ Cancelled');
        return;
      }
      
      // Remove existing entry
      config.csp[directive] = config.csp[directive].filter(entry => {
        const existingDomain = typeof entry === 'string' ? entry : entry.domain;
        return existingDomain !== domain;
      });
    }
    
    config.csp[directive].push(domainEntry);
    
    // Update timestamp
    config.meta.lastUpdated = new Date().toISOString().split('T')[0];
    
    // Write back to file
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    console.log('\n✅ Successfully added domain to configuration:');
    console.log(`   Domain: ${domain}`);
    console.log(`   Directive: ${directive}`);
    console.log(`   Purpose: ${purpose}`);
    console.log(`   Category: ${category}`);
    
    // Ask if user wants to regenerate headers
    const regenerate = await ask('\nRegenerate _headers file now? (Y/n): ');
    if (regenerate.toLowerCase() !== 'n') {
      const { generateHeaders } = require('./generate-headers.js');
      console.log();
      generateHeaders();
    }
    
    console.log('\n🎉 Done! Your CSP configuration has been updated.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run if called directly
if (require.main === module) {
  addDomain();
}

module.exports = { addDomain };