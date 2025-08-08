#!/usr/bin/env node

/**
 * Generate _headers file from CSP configuration
 * This script reads csp-config.json and generates a Cloudflare Pages _headers file
 * 
 * Usage: node scripts/generate-headers.js
 * Run this script whenever you update CSP configuration
 */

const fs = require('fs');
const path = require('path');

// Paths
const configPath = path.join(__dirname, '../csp-config.json');
const headersPath = path.join(__dirname, '../static/_headers');

/**
 * Extract domain from CSP rule (handles both strings and objects)
 */
function extractDomain(rule) {
  if (typeof rule === 'string') {
    return rule;
  }
  if (typeof rule === 'object' && rule.domain) {
    return rule.domain;
  }
  return rule;
}

/**
 * Build CSP directive string from configuration
 */
function buildCspDirective(directiveName, rules) {
  const domains = rules.map(extractDomain).join(' ');
  return `${directiveName} ${domains}`;
}

/**
 * Generate CSP policy string from configuration
 */
function generateCsp(cspConfig) {
  const directives = [];
  
  for (const [directive, rules] of Object.entries(cspConfig)) {
    directives.push(buildCspDirective(directive, rules));
  }
  
  return directives.join('; ');
}

/**
 * Generate cache control rules
 */
function generateCacheRules(cacheConfig) {
  let rules = '';
  
  // Static assets
  if (cacheConfig.staticAssets) {
    for (const path of cacheConfig.staticAssets.paths) {
      rules += `\n${path}\n`;
      const control = `Cache-Control: public, max-age=${cacheConfig.staticAssets.maxAge}`;
      rules += `  ${control}${cacheConfig.staticAssets.immutable ? ', immutable' : ''}\n`;
    }
  }
  
  // Images
  if (cacheConfig.images) {
    for (const ext of cacheConfig.images.extensions) {
      rules += `\n${ext}\n`;
      rules += `  Cache-Control: public, max-age=${cacheConfig.images.maxAge}\n`;
    }
  }
  
  // CSS and JS
  if (cacheConfig.cssJs) {
    for (const ext of cacheConfig.cssJs.extensions) {
      rules += `\n${ext}\n`;
      rules += `  Cache-Control: public, max-age=${cacheConfig.cssJs.maxAge}\n`;
    }
  }
  
  return rules;
}

/**
 * Generate comments with domain purposes for documentation
 */
function generateDocumentationComments(cspConfig) {
  const comments = [];
  const categories = {};
  
  // Group domains by category
  for (const [directive, rules] of Object.entries(cspConfig)) {
    for (const rule of rules) {
      if (typeof rule === 'object' && rule.category && rule.domain) {
        if (!categories[rule.category]) {
          categories[rule.category] = [];
        }
        categories[rule.category].push({
          domain: rule.domain,
          purpose: rule.purpose,
          directive: directive
        });
      }
    }
  }
  
  // Generate comments
  if (Object.keys(categories).length > 0) {
    comments.push('# CSP Configuration:');
    for (const [category, domains] of Object.entries(categories)) {
      comments.push(`# ${category.toUpperCase()}:`);
      for (const {domain, purpose} of domains) {
        comments.push(`#   ${domain} - ${purpose}`);
      }
    }
  }
  
  return comments;
}

/**
 * Main function to generate headers file
 */
function generateHeaders() {
  try {
    // Read configuration
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    console.log('📋 Generating _headers file from CSP configuration...');
    
    // Generate file content
    let content = '# Security headers for Cloudflare Pages\n';
    content += '# Generated automatically from csp-config.json\n';
    content += `# Last generated: ${new Date().toISOString()}\n`;
    
    // Add documentation comments
    const docComments = generateDocumentationComments(config.csp);
    if (docComments.length > 0) {
      content += '\n' + docComments.join('\n') + '\n';
    }
    
    content += '\n/*\n';
    
    // Add other headers
    for (const [header, value] of Object.entries(config.otherHeaders)) {
      content += `  ${header}: ${value}\n`;
    }
    
    // Add CSP policy
    const cspPolicy = generateCsp(config.csp);
    content += `  Content-Security-Policy: ${cspPolicy}\n`;
    
    // Add cache rules
    if (config.cacheRules) {
      content += generateCacheRules(config.cacheRules);
    }
    
    // Write to file
    fs.writeFileSync(headersPath, content);
    
    console.log('✅ Successfully generated _headers file');
    console.log(`   Config domains: ${countDomains(config.csp)} unique domains`);
    console.log(`   File size: ${Math.round(content.length / 1024 * 10) / 10}KB`);
    
    // Show summary of changes
    const categories = getCategoryStats(config.csp);
    if (categories.length > 0) {
      console.log('\n📊 Domains by category:');
      categories.forEach(({category, count}) => {
        console.log(`   ${category}: ${count} domains`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error generating headers file:', error.message);
    process.exit(1);
  }
}

/**
 * Count unique domains in CSP configuration
 */
function countDomains(cspConfig) {
  const domains = new Set();
  
  for (const rules of Object.values(cspConfig)) {
    for (const rule of rules) {
      const domain = extractDomain(rule);
      if (domain && !domain.startsWith("'") && domain !== 'data:') {
        domains.add(domain);
      }
    }
  }
  
  return domains.size;
}

/**
 * Get statistics by category
 */
function getCategoryStats(cspConfig) {
  const categories = {};
  
  for (const rules of Object.values(cspConfig)) {
    for (const rule of rules) {
      if (typeof rule === 'object' && rule.category) {
        categories[rule.category] = (categories[rule.category] || 0) + 1;
      }
    }
  }
  
  return Object.entries(categories).map(([category, count]) => ({category, count}));
}

// Run if called directly
if (require.main === module) {
  generateHeaders();
}

module.exports = { generateHeaders };