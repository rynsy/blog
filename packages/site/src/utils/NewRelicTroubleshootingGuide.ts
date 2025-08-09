/**
 * New Relic Troubleshooting Guide
 * 
 * Comprehensive troubleshooting guide for New Relic Browser Agent
 * data transmission issues with step-by-step resolution instructions.
 */

export interface TroubleshootingStep {
  id: string;
  title: string;
  description: string;
  action: string;
  expected: string;
  troubleshooting?: string;
  code?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface TroubleshootingCategory {
  category: string;
  description: string;
  steps: TroubleshootingStep[];
}

export const NEW_RELIC_TROUBLESHOOTING_GUIDE: TroubleshootingCategory[] = [
  {
    category: 'Environment Configuration',
    description: 'Verify that New Relic is properly configured for your environment',
    steps: [
      {
        id: 'env-production-check',
        title: 'Verify Production Environment',
        description: 'New Relic is configured to only load in production environment',
        action: 'Check that NODE_ENV is set to "production"',
        expected: 'NODE_ENV === "production"',
        troubleshooting: 'If testing locally, temporarily modify gatsby-ssr.ts to load New Relic in development',
        code: 'console.log("NODE_ENV:", process.env.NODE_ENV);',
        priority: 'high'
      },
      {
        id: 'env-disable-check',
        title: 'Check Disable Flag',
        description: 'Verify New Relic is not explicitly disabled',
        action: 'Ensure DISABLE_NEW_RELIC environment variable is not set to "true"',
        expected: 'DISABLE_NEW_RELIC !== "true"',
        troubleshooting: 'Remove or set DISABLE_NEW_RELIC=false in your environment',
        code: 'console.log("DISABLE_NEW_RELIC:", process.env.DISABLE_NEW_RELIC);',
        priority: 'high'
      },
      {
        id: 'script-loading',
        title: 'Verify Script Loading',
        description: 'Check that New Relic scripts are being loaded',
        action: 'Inspect page source for New Relic scripts',
        expected: 'Scripts with src="https://js-agent.newrelic.com/" should be present',
        troubleshooting: 'Check gatsby-ssr.ts loadNewRelicScripts function and CSP configuration',
        priority: 'high'
      }
    ]
  },
  {
    category: 'Configuration Validation',
    description: 'Validate New Relic account configuration and credentials',
    steps: [
      {
        id: 'config-account-id',
        title: 'Verify Account ID',
        description: 'Ensure the correct New Relic account ID is configured',
        action: 'Check NREUM.loader_config.accountID matches your New Relic account',
        expected: 'accountID: "6576957" (your actual account ID)',
        troubleshooting: 'Log into New Relic and verify account ID in account settings',
        code: 'console.log("Account ID:", window.NREUM?.loader_config?.accountID);',
        priority: 'high'
      },
      {
        id: 'config-license-key',
        title: 'Verify License Key',
        description: 'Check that the license key is valid and not expired',
        action: 'Verify NREUM.loader_config.licenseKey is correct',
        expected: 'Valid license key starting with "NRBR-"',
        troubleshooting: 'Generate a new browser license key in New Relic if current one is invalid',
        code: 'console.log("License Key:", window.NREUM?.loader_config?.licenseKey);',
        priority: 'high'
      },
      {
        id: 'config-app-id',
        title: 'Verify Application ID',
        description: 'Ensure the application ID matches your New Relic browser app',
        action: 'Check NREUM.loader_config.applicationID',
        expected: 'applicationID: "1589121593" (your browser app ID)',
        troubleshooting: 'Check browser application settings in New Relic dashboard',
        code: 'console.log("App ID:", window.NREUM?.loader_config?.applicationID);',
        priority: 'high'
      }
    ]
  },
  {
    category: 'Network Connectivity',
    description: 'Diagnose network-related issues that prevent data transmission',
    steps: [
      {
        id: 'network-beacon-reachability',
        title: 'Test Beacon Endpoint',
        description: 'Verify that New Relic beacon endpoints are reachable',
        action: 'Test connectivity to bam.nr-data.net',
        expected: 'No CORS or network errors when accessing beacon',
        troubleshooting: 'Check firewall, proxy, or corporate network restrictions',
        code: 'fetch("https://bam.nr-data.net/1/test", {method: "HEAD", mode: "no-cors"}).then(() => console.log("Beacon reachable")).catch(e => console.error("Beacon unreachable:", e));',
        priority: 'high'
      }
    ]
  }
];

export const COMMON_ISSUES = {
  'script_not_loading': {
    title: 'New Relic Script Not Loading',
    description: 'The New Relic browser agent script is not being loaded on the page',
    symptoms: ['window.NREUM is undefined', 'window.newrelic is undefined', 'No New Relic scripts in page source'],
    solutions: [
      'Check that NODE_ENV is set to "production"',
      'Verify DISABLE_NEW_RELIC is not set to "true"',
      'Ensure gatsby-ssr.ts is correctly configured',
      'Check for CSP blocking the script loading'
    ],
    priority: 'critical'
  }
};

export function getRelevantTroubleshooting(symptoms: string[]): {
  matchingIssues: string[];
  recommendedSteps: TroubleshootingStep[];
} {
  const matchingIssues: string[] = [];
  const recommendedSteps: TroubleshootingStep[] = [];
  
  // Get relevant troubleshooting steps
  for (const category of NEW_RELIC_TROUBLESHOOTING_GUIDE) {
    recommendedSteps.push(...category.steps.filter(step => step.priority === 'high'));
  }
  
  return {
    matchingIssues,
    recommendedSteps: recommendedSteps.slice(0, 5)
  };
}

export function generateTroubleshootingScript(steps: TroubleshootingStep[]): string {
  const scriptLines = [
    '// New Relic Troubleshooting Script',
    '// Run this in your browser console to diagnose issues',
    '',
    'console.log("🔍 New Relic Troubleshooting Script");',
    'console.log("=====================================");',
    ''
  ];
  
  steps.forEach((step, index) => {
    scriptLines.push(
      `// ${index + 1}. ${step.title}`,
      `console.log("${index + 1}. ${step.title}");`
    );
    
    if (step.code) {
      scriptLines.push(step.code);
    }
    
    scriptLines.push('');
  });
  
  scriptLines.push(
    'console.log("=====================================");',
    'console.log("✅ Troubleshooting script complete");'
  );
  
  return scriptLines.join('\n');
}