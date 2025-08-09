/**
 * New Relic Browser Agent Diagnostics
 * 
 * Comprehensive diagnostic tool to troubleshoot New Relic Browser Agent
 * data transmission issues and configuration problems.
 */

interface NewRelicConfig {
  accountID: string;
  trustKey: string;
  agentID: string;
  licenseKey: string;
  applicationID: string;
  beacon: string;
  errorBeacon: string;
}

export interface DiagnosticResult {
  category: 'configuration' | 'network' | 'data' | 'environment';
  status: 'pass' | 'warn' | 'fail';
  message: string;
  details?: any;
  recommendation?: string;
}

class NewRelicDiagnostics {
  private results: DiagnosticResult[] = [];
  private config: NewRelicConfig | null = null;
  
  async runFullDiagnostic(): Promise<{
    results: DiagnosticResult[];
    summary: {
      passes: number;
      warnings: number;
      failures: number;
      overallStatus: 'healthy' | 'issues' | 'critical';
    };
    recommendations: string[];
  }> {
    console.log('🔍 Starting New Relic Browser Agent diagnostics...');
    
    this.results = [];
    
    // Run all diagnostic checks
    await this.checkEnvironment();
    await this.checkConfiguration();
    
    const summary = this.generateSummary();
    const recommendations = this.generateRecommendations();
    
    console.log('✅ New Relic diagnostics complete:', {
      results: this.results,
      summary,
      recommendations
    });
    
    return {
      results: [...this.results],
      summary,
      recommendations
    };
  }
  
  private async checkEnvironment(): Promise<void> {
    const isProduction = process.env.NODE_ENV === 'production';
    const disableNewRelic = process.env.DISABLE_NEW_RELIC === 'true';
    
    if (!isProduction) {
      this.results.push({
        category: 'environment',
        status: 'warn',
        message: 'New Relic is configured to only run in production environment',
        details: { NODE_ENV: process.env.NODE_ENV },
        recommendation: 'This is expected behavior. New Relic will only load in production.'
      });
    }
    
    if (disableNewRelic) {
      this.results.push({
        category: 'environment',
        status: 'warn',
        message: 'New Relic is explicitly disabled via environment variable',
        details: { DISABLE_NEW_RELIC: process.env.DISABLE_NEW_RELIC },
        recommendation: 'Remove or set DISABLE_NEW_RELIC=false to enable New Relic'
      });
    }
  }
  
  private async checkConfiguration(): Promise<void> {
    const nreum = (window as any).NREUM;
    const newrelic = (window as any).newrelic;
    
    if (!nreum && !newrelic) {
      this.results.push({
        category: 'configuration',
        status: 'fail',
        message: 'New Relic objects not found on window',
        recommendation: 'Verify that New Relic scripts are loading correctly'
      });
      return;
    }
    
    if (nreum?.loader_config) {
      this.config = {
        accountID: nreum.loader_config.accountID,
        trustKey: nreum.loader_config.trustKey,
        agentID: nreum.loader_config.agentID,
        licenseKey: nreum.loader_config.licenseKey,
        applicationID: nreum.loader_config.applicationID,
        beacon: nreum.info?.beacon || '',
        errorBeacon: nreum.info?.errorBeacon || ''
      };
      
      this.results.push({
        category: 'configuration',
        status: 'pass',
        message: 'New Relic configuration found',
        details: this.config
      });
    }
  }
  
  private generateSummary(): {
    passes: number;
    warnings: number;
    failures: number;
    overallStatus: 'healthy' | 'issues' | 'critical';
  } {
    const passes = this.results.filter(r => r.status === 'pass').length;
    const warnings = this.results.filter(r => r.status === 'warn').length;
    const failures = this.results.filter(r => r.status === 'fail').length;
    
    let overallStatus: 'healthy' | 'issues' | 'critical';
    if (failures > 3) {
      overallStatus = 'critical';
    } else if (failures > 0 || warnings > 5) {
      overallStatus = 'issues';
    } else {
      overallStatus = 'healthy';
    }
    
    return { passes, warnings, failures, overallStatus };
  }
  
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    for (const result of this.results) {
      if (result.recommendation && result.status !== 'pass') {
        recommendations.push(result.recommendation);
      }
    }
    
    return Array.from(new Set(recommendations));
  }
  
  async quickHealthCheck(): Promise<{
    healthy: boolean;
    issues: string[];
    criticalFailures: string[];
  }> {
    const envCheck = process.env.NODE_ENV === 'production' && process.env.DISABLE_NEW_RELIC !== 'true';
    const nreumExists = !!(window as any).NREUM;
    const newrelicExists = !!(window as any).newrelic;
    
    const issues: string[] = [];
    const criticalFailures: string[] = [];
    
    if (!envCheck) {
      issues.push('Not running in production environment or explicitly disabled');
    }
    
    if (!nreumExists && !newrelicExists) {
      criticalFailures.push('New Relic objects not found on window');
    }
    
    const healthy = criticalFailures.length === 0 && issues.length < 2;
    
    return { healthy, issues, criticalFailures };
  }
  
  logCurrentState(): void {
    console.group('🔍 New Relic Current State');
    console.log('Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      DISABLE_NEW_RELIC: process.env.DISABLE_NEW_RELIC,
      production: process.env.NODE_ENV === 'production'
    });
    console.log('Window objects:', {
      NREUM: !!(window as any).NREUM,
      newrelic: !!(window as any).newrelic,
      NREUMConfig: (window as any).NREUM?.loader_config,
      NREUMInfo: (window as any).NREUM?.info
    });
    console.log('Page load timing:', {
      domContentLoaded: performance.timing?.domContentLoadedEventEnd - performance.timing?.navigationStart,
      loadComplete: performance.timing?.loadEventEnd - performance.timing?.navigationStart
    });
    console.groupEnd();
  }
}

export const newRelicDiagnostics = new NewRelicDiagnostics();
export type { DiagnosticResult };