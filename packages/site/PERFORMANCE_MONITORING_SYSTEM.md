# Advanced Performance Monitoring System

## Overview

This document describes the comprehensive performance monitoring system implemented for the Phase 4 background system, featuring hybrid New Relic integration, advanced metrics collection, and privacy-respecting analytics.

## 🏗️ Architecture

### Core Components

1. **EnhancedPerformanceCollector** - Advanced metrics collection with GPU, thermal, and network monitoring
2. **PerformanceDashboard** - Real-time performance visualization with New Relic correlation
3. **NewRelicDiagnostics** - Comprehensive diagnostic tool for troubleshooting data transmission issues
4. **TypeSafePerformanceMonitor** - Type-safe performance monitoring with memory leak detection
5. **NewRelicTroubleshootingGuide** - Detailed troubleshooting guide for common issues

### Integration Points

- **Background System V3** - Integrated with existing background provider
- **Easter Egg System** - Performance impact monitoring for discovery patterns
- **Advanced Visual Modules** - Per-module performance tracking
- **Device Capability Detection** - Adaptive monitoring based on device capabilities

## 📊 Monitoring Features

### Real-Time Metrics

- **Frame Rate Monitoring** - Current, average, and minimum FPS over time periods
- **Memory Usage Tracking** - Heap size, garbage collection events, and leak detection
- **GPU Utilization** - WebGL context health and render queue monitoring
- **CPU Usage Estimation** - Performance-based CPU load estimation
- **Thermal Monitoring** - Thermal throttling detection and temperature estimation
- **Battery Impact Assessment** - Power efficiency tracking for mobile devices
- **Network Performance** - Latency, resource loading times, and connection quality

### Module-Specific Analytics

- **Per-Module Performance** - Individual performance metrics for each background module
- **Interactive Element Performance** - Mouse tracking and gesture recognition metrics
- **Easter Egg Discovery Impact** - Performance cost analysis of pattern matching
- **Background Switching Performance** - Memory cleanup validation during transitions

### User Experience Metrics

- **Perceived Performance Scores** - Weighted performance calculation based on user experience
- **Interaction Latency Measurements** - Real-time UI responsiveness tracking
- **Visual Quality Scores** - Frame consistency and rendering quality assessment
- **Accessibility Metrics** - Performance impact of accessibility features

## 🔧 New Relic Integration

### Hybrid Approach

The system implements a hybrid monitoring approach that respects user privacy while providing comprehensive insights:

- **Privacy-First Design** - New Relic integration is opt-in and disabled by default
- **Local-First Analytics** - Core metrics collected locally with optional cloud correlation
- **Diagnostic Mode** - Advanced troubleshooting tools for New Relic configuration issues

### Configuration

```typescript\ninterface DashboardConfig {\n  enableNewRelicCorrelation: boolean; // Privacy-first default: false\n  privacyMode: boolean; // Limits data collection to essential metrics\n  showNetworkMetrics: boolean;\n  showGpuMetrics: boolean;\n  alertThresholds: {\n    fps: number;\n    memory: number;\n    cpu: number;\n    battery: number;\n    thermalThrottling: number;\n    networkLatency: number;\n  };\n}\n```\n\n### Troubleshooting New Relic Issues\n\n#### Common Problems and Solutions\n\n1. **New Relic Script Not Loading**\n   - Check `NODE_ENV` is set to \"production\"\n   - Verify `DISABLE_NEW_RELIC` is not set to \"true\"\n   - Ensure CSP allows `js-agent.newrelic.com`\n\n2. **Data Not Appearing in Dashboard**\n   - Wait 1-2 minutes for data processing delay\n   - Verify account ID and license key are correct\n   - Check network requests are reaching `bam.nr-data.net`\n\n3. **Network Requests Blocked**\n   - Update CSP configuration to include New Relic domains\n   - Check for ad blocker interference\n   - Verify firewall/proxy settings\n\n#### Diagnostic Tools\n\n**Test Page**: Visit `/test/performance-monitoring` for comprehensive diagnostics\n\n**Console Diagnostics**:\n```javascript\n// Quick health check\nnewRelicDiagnostics.quickHealthCheck().then(console.log);\n\n// Full diagnostic suite\nnewRelicDiagnostics.runFullDiagnostic().then(console.log);\n\n// Current state logging\nnewRelicDiagnostics.logCurrentState();\n```\n\n## 🚨 Alerting System\n\n### Performance Alerts\n\n- **Real-time alerts** for performance degradation\n- **Memory leak detection** with confidence scoring\n- **Thermal throttling notifications**\n- **Battery drain warnings** for mobile users\n- **Network performance issues** detection\n\n### Alert Configuration\n\n```typescript\nalertThresholds: {\n  fps: 30,              // Minimum acceptable FPS\n  memory: 100,          // Memory usage in MB\n  cpu: 80,              // CPU usage percentage\n  battery: 20,          // Battery level percentage\n  thermalThrottling: 85, // Temperature in °C\n  networkLatency: 200   // Network latency in ms\n}\n```\n\n## 📈 Data Export and Analysis\n\n### Export Formats\n\n- **JSON Export** - Complete session data with metadata\n- **CSV Export** - Time-series performance metrics\n- **New Relic Correlation** - Enhanced export with trace IDs\n\n### Privacy Controls\n\n- **Local Storage Only** - No external data transmission by default\n- **Opt-in Cloud Analytics** - User-controlled New Relic integration\n- **Data Retention Limits** - Automatic cleanup of historical data\n- **Anonymous Metrics** - No personally identifiable information collected\n\n## ♿ Accessibility Features\n\n### Dashboard Accessibility\n\n- **Keyboard Navigation** - Full keyboard support for all controls\n- **Screen Reader Support** - Proper ARIA labels and live regions\n- **High Contrast Mode** - Enhanced visibility options\n- **Cognitive Load Reduction** - Configurable refresh rates and simplified displays\n\n### Implementation\n\n```typescript\n// Screen reader announcements\naria-live=\"assertive\" // For critical alerts\naria-live=\"polite\"    // For status updates\n\n// Keyboard navigation\nonKeyDown={handleKeyDown} // Escape, Enter, Space support\ntabIndex={0}             // Focusable elements\n\n// Accessibility labels\naria-label=\"Performance grade: A, Score: 95%\"\nrole=\"status\"            // Status indicators\nrole=\"alert\"             // Critical alerts\n```\n\n## 🧪 Testing and Validation\n\n### Test Page Features\n\n**Performance Test Page** (`/test/performance-monitoring`):\n- New Relic status validation\n- Performance stress testing\n- Custom metrics testing\n- Error simulation\n- Full diagnostic suite\n\n### Manual Testing Steps\n\n1. **Environment Verification**\n   ```bash\n   # Check environment variables\n   echo $NODE_ENV\n   echo $DISABLE_NEW_RELIC\n   ```\n\n2. **Script Loading Verification**\n   - Inspect page source for New Relic scripts\n   - Check browser console for loading errors\n   - Verify NREUM object availability\n\n3. **Data Transmission Testing**\n   - Monitor network tab for requests to `bam.nr-data.net`\n   - Test custom event recording\n   - Verify error reporting functionality\n\n4. **Dashboard Validation**\n   - Toggle performance dashboard visibility\n   - Test different display modes\n   - Verify accessibility features\n\n## 🔧 Integration Guide\n\n### Basic Integration\n\n```typescript\nimport PerformanceDashboard from './PerformanceDashboard';\nimport { TypeSafePerformanceMonitor } from '../utils/TypeSafePerformanceMonitor';\n\nconst performanceMonitor = new TypeSafePerformanceMonitor();\n\nfunction App() {\n  useEffect(() => {\n    performanceMonitor.startMonitoring();\n    return () => performanceMonitor.stopMonitoring();\n  }, []);\n\n  return (\n    <>\n      <YourAppContent />\n      <PerformanceDashboard\n        performanceMonitor={performanceMonitor}\n        deviceCapabilities={deviceCapabilities}\n        visible={showDashboard}\n        position=\"bottom-right\"\n        initialConfig={{\n          privacyMode: true,\n          enableNewRelicCorrelation: false\n        }}\n      />\n    </>\n  );\n}\n```\n\n### Advanced Configuration\n\n```typescript\nconst advancedConfig = {\n  refreshRate: 1000,\n  alertThresholds: {\n    fps: 30,\n    memory: 100,\n    cpu: 80,\n    battery: 20,\n    thermalThrottling: 85,\n    networkLatency: 200\n  },\n  displayMode: 'detailed',\n  showNetworkMetrics: true,\n  showGpuMetrics: true,\n  enableNewRelicCorrelation: process.env.NODE_ENV === 'production',\n  privacyMode: true,\n  accessibilityMode: false,\n  highContrastMode: false\n};\n```\n\n## 📋 Performance Budget\n\nThe monitoring system adheres to strict performance budgets:\n\n- **JavaScript Bundle**: <5KB additional size\n- **Memory Overhead**: <10MB peak usage\n- **CPU Impact**: <2% additional CPU usage\n- **Network Requests**: Batched and optimized\n- **DOM Impact**: Minimal DOM manipulation\n\n## 🔒 Privacy and Security\n\n### Privacy-First Design\n\n- **No Tracking by Default** - All monitoring is local unless explicitly enabled\n- **User Consent** - New Relic integration requires explicit user opt-in\n- **Data Minimization** - Only essential metrics are collected\n- **Local Processing** - Analysis performed client-side when possible\n\n### Security Considerations\n\n- **CSP Compliance** - All scripts and resources respect Content Security Policy\n- **No Sensitive Data** - Performance metrics contain no user-identifiable information\n- **Secure Transmission** - All external requests use HTTPS\n- **Input Validation** - All configuration inputs are validated and sanitized\n\n## 🚀 Deployment Checklist\n\n### Production Deployment\n\n- [ ] Verify New Relic account configuration\n- [ ] Update CSP headers to allow New Relic domains\n- [ ] Set `NODE_ENV=production`\n- [ ] Configure performance alert thresholds\n- [ ] Test dashboard functionality\n- [ ] Validate accessibility features\n- [ ] Run diagnostic test suite\n- [ ] Monitor initial data transmission\n\n### Environment Variables\n\n```bash\n# Required for New Relic\nNODE_ENV=production\n\n# Optional - disable New Relic\nDISABLE_NEW_RELIC=false\n\n# CSP configuration should include:\n# - js-agent.newrelic.com (script-src)\n# - bam.nr-data.net (connect-src)\n# - bam-cell.nr-data.net (connect-src)\n```\n\n## 🛠️ Maintenance and Monitoring\n\n### Regular Tasks\n\n1. **Weekly**: Review performance dashboard for anomalies\n2. **Monthly**: Update performance thresholds based on usage patterns\n3. **Quarterly**: Review New Relic license key validity\n4. **As Needed**: Update CSP configuration for new domains\n\n### Troubleshooting Resources\n\n- **Diagnostic Page**: `/test/performance-monitoring`\n- **Console Tools**: `newRelicDiagnostics.*` methods\n- **New Relic Support**: Account-specific troubleshooting\n- **Browser DevTools**: Network and console monitoring\n\n---\n\n*This monitoring system provides comprehensive performance insights while maintaining user privacy and system efficiency. For additional support or customization, refer to the individual component documentation.*"