# Production Error Monitoring Tests

This directory contains comprehensive Playwright tests designed to monitor and detect critical production console errors before deployment.

## Overview

These tests specifically monitor for the following production issues:

1. **Cloudflare Insights Loading Failures**
   - Pattern: `Loading failed for script "https://static.cloudflareinsights.com/beacon.min.js"`
   - Severity: High (affects analytics but not core functionality)

2. **Gatsby GraphQL Runtime Errors**
   - Pattern: `It appears like Gatsby is misconfigured. Gatsby related 'graphql' calls are supposed to only be evaluated at compile time`
   - Severity: Critical (indicates build configuration issues)

3. **React Minified Error #423**
   - Pattern: `Minified React error #423`
   - Severity: Critical (React runtime error - often undefined/null property access)

## Test Files

### 1. `console-error-monitoring.spec.ts`
**Primary console error detection**
- Monitors console.error messages during page load
- Detects specific error patterns mentioned above
- Tests across multiple pages and navigation scenarios
- Validates error pattern detection works correctly

### 2. `network-error-monitoring.spec.ts`
**Network failure monitoring**
- Tracks failed HTTP requests that could cause script loading errors
- Monitors resource loading timeouts
- Validates critical resources (JS, CSS) load successfully
- Handles CDN failures and external resource issues

### 3. `react-error-monitoring.spec.ts`
**React-specific error detection**
- Specialized monitoring for React minified errors
- Detects hydration mismatches
- Monitors error boundary failures
- Tests component interaction error handling
- Comprehensive React error analysis

### 4. `production-health-monitoring.spec.ts`
**Comprehensive production health checks**
- Combines all error monitoring into single health assessment
- Performance baseline validation
- Critical service availability checks
- Production readiness gate for CI/CD
- Detailed health reporting

### 5. `docker-production-monitoring.spec.ts`
**Container-specific monitoring**
- Docker environment validation
- Analytics service mocking validation
- Production build artifact validation
- Cross-browser error consistency
- CI/CD integration testing

## Usage

### Run All Production Error Monitoring
```bash
npm run test:production-errors
```

### Run Specific Error Types
```bash
# Console errors only
npm run test:console-errors

# Network failures only  
npm run test:network-errors

# React errors only
npm run test:react-errors

# Cloudflare Insights specific
npm run test:cloudflare-errors

# Gatsby GraphQL specific
npm run test:gatsby-errors

# React #423 specific
npm run test:react423-errors
```

### Production Health Check
```bash
npm run test:production-health
```

### Docker Environment Testing
```bash
npm run test:docker-monitoring
```

### Production Deployment Gate
```bash
npm run test:production-gate
```

### Complete Monitoring Suite
```bash
npm run test:all-monitoring
```

## CI/CD Integration

### Pre-deployment Check
The production error monitoring tests are designed to run in CI/CD pipelines before production deployment:

```bash
# Production readiness gate - must pass for deployment
npm run test:production-gate
```

### Docker Testing
For testing in production-like Docker containers:

```bash
# Set Docker environment and run monitoring
DOCKER_TEST=true npm run test:docker-monitoring
```

### Environment Variables

- `DOCKER_TEST=true` - Enables Docker-specific tests and extended timeouts
- `ANALYTICS_MOCK_AVAILABLE=true` - Indicates analytics mock service is available
- `PLAYWRIGHT_TEST_BASE_URL` - Base URL for testing (default: http://localhost:8000)

## Test Features

### Error Pattern Detection
- Regex-based pattern matching for specific error messages
- Configurable severity levels (critical, high, medium, low)
- Categorization by error type (analytics, framework, react, network)

### Comprehensive Monitoring
- Console message tracking
- Page error monitoring
- Network request failure detection
- Performance regression monitoring
- Service availability validation

### Production Readiness Validation
- Critical error blocking (prevents deployment)
- Warning-level error reporting (allows deployment with warnings)
- Performance threshold validation
- Service dependency checks

### Reporting
- Detailed error reports with timestamps and context
- JSON-formatted output for CI/CD integration
- Categorized error summaries
- Performance baseline comparison

## Test Architecture

### Custom Fixtures
The tests extend the base Playwright test with custom fixtures from `../setup.ts`:
- `analyticsMock` - Analytics call interception and mocking
- `performanceMonitor` - Core Web Vitals and performance tracking
- `a11yTester` - Accessibility testing helpers
- `webglTester` - WebGL capability testing

### Error Tracking
Each test maintains detailed error logs with:
- Error type and message
- Timestamp and source
- Severity classification
- Pattern matching results

### Cross-browser Consistency
Tests validate that production errors are consistent across:
- Chrome/Chromium
- Firefox
- Safari/WebKit
- Mobile browsers

## Integration with Existing Tests

These monitoring tests integrate with the existing test suite:
- Uses existing Playwright configuration (`playwright.config.ts`)
- Leverages global setup and teardown (`global-setup.ts`, `global-teardown.ts`)
- Works with existing fixtures and utilities (`setup.ts`)
- Compatible with Docker test environment

## Deployment Workflow

1. **Development Testing**
   ```bash
   npm run test:console-errors
   npm run test:react-errors
   ```

2. **Pre-commit Validation**
   ```bash
   npm run test:production-errors
   ```

3. **CI/CD Pipeline**
   ```bash
   npm run test:production-health
   npm run test:docker-monitoring
   ```

4. **Production Deployment Gate**
   ```bash
   npm run test:production-gate
   ```

## Maintenance

### Adding New Error Patterns
To monitor additional error patterns, update the `MONITORED_ERROR_PATTERNS` or `PRODUCTION_ERROR_PATTERNS` arrays in the respective test files with:
- Pattern name
- Regex pattern
- Severity level
- Description

### Adjusting Thresholds
Performance and error count thresholds can be adjusted in:
- `production-health-monitoring.spec.ts` for health check thresholds
- Individual test files for specific error tolerance levels

### Extending Monitoring
New monitoring capabilities can be added by:
1. Creating new test files following the existing patterns
2. Adding custom fixtures to `setup.ts`
3. Updating `package.json` scripts for new test commands

## Troubleshooting

### Common Issues

1. **Tests failing in Docker but passing locally**
   - Check `DOCKER_TEST` environment variable
   - Verify extended timeouts are being used
   - Ensure analytics mock services are available

2. **False positives on error detection**
   - Review error patterns for specificity
   - Check for test-injected errors being detected
   - Validate pattern matching logic

3. **Performance threshold failures**
   - Check baseline performance metrics
   - Adjust thresholds for environment differences
   - Monitor for performance regressions

### Debug Mode
Run tests in debug mode for troubleshooting:
```bash
npm run test:e2e:debug -- tests/e2e/console-error-monitoring.spec.ts
```

This comprehensive error monitoring system provides robust detection of production issues and serves as a critical gate in the CI/CD pipeline to prevent deployment of applications with known console errors.