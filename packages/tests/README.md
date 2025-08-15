# Interactive Background System - Test Suite

Comprehensive testing suite for the interactive background system in the personal Gatsby/React site. This suite provides fast feedback for development, prevents regressions, and ensures accessibility compliance.

## 🚨 **CURRENT STATUS: CRITICAL ISSUES REQUIRING IMMEDIATE ATTENTION**

**The testing infrastructure is currently experiencing significant failures that prevent reliable testing:**

- ❌ **Unit Tests**: 168/231 tests failing (73% failure rate)
- ❌ **E2E Tests**: Playwright experiencing timeout and dependency issues  
- ❌ **Code Quality**: 150+ ESLint violations blocking CI/CD pipeline
- ✅ **Docker Production**: Working correctly for production validation

## ⚠️ Quick Start (Currently Broken)

```bash
# Install dependencies
npm install

# ❌ FAILING: Run all tests (do not use until fixes applied)
npm run test:ci

# Individual test suites (all currently experiencing issues)
npm run test:unit        # ❌ 168 tests failing - React hooks context issues
npm run test:e2e         # ❌ Timeout issues in Docker environment
npm run lint            # ❌ 150+ violations - unused vars, console statements
npm run typecheck       # ⚠️ May have issues depending on lint state

# ✅ WORKING: Docker production testing
pnpm test:docker:production  # This works correctly
```

### 🔧 **Immediate Fixes Required**

Before running tests, the following issues must be resolved:

1. **React Testing Environment**: Fix hooks context for unit tests
2. **ESLint Violations**: Clean up unused variables and console statements
3. **Playwright Configuration**: Resolve Docker timeout and dependency issues

## 📁 Project Structure

```
packages/tests/
├── unit/               # Unit tests (Vitest + React Testing Library)
│   ├── background-context.test.tsx
│   ├── background-switcher.test.tsx
│   ├── canvas-host.test.tsx
│   ├── control-tray.test.tsx
│   └── module-registry.test.ts
├── e2e/                # End-to-end tests (Playwright)
│   └── module-smoke.spec.ts
├── fixtures/           # Test data and seeds
│   └── module-seeds.json
├── axe/               # Accessibility testing utilities
│   └── custom-rules.ts
├── setup.ts           # Test environment setup
├── vitest.config.ts   # Unit test configuration
├── playwright.config.ts  # E2E test configuration
└── tsconfig.json      # TypeScript configuration
```

## 🧪 Test Categories

### Unit Tests (Vitest + React Testing Library)

Tests individual components and modules in isolation:

- **BackgroundContext**: State management, localStorage persistence, module registration
- **BackgroundSwitcher**: Module switching functionality
- **CanvasHost**: Canvas lifecycle, theme changes, visibility handling
- **ControlTray**: UI interactions and module selection
- **ModuleRegistry**: Module loading, metadata validation, contract compliance

### End-to-End Tests (Playwright)

Tests full user workflows across multiple browsers:

- **Module Smoke Tests**: Each module loads without console errors
- **Module Switching**: Control tray interactions work correctly
- **Theme Switching**: Dark/light mode changes don't break modules
- **Accessibility**: WCAG compliance using axe-core
- **Performance**: Modules pause when page is hidden

### Accessibility Tests (axe-playwright)

Automated accessibility testing for:

- Color contrast compliance
- ARIA label coverage for canvas elements
- Keyboard navigation for interactive modules
- Screen reader compatibility

## 📊 Coverage & Quality Gates

| Metric | Threshold | Purpose |
|--------|-----------|---------|
| Unit test coverage | ≥ 80% | Ensure adequate test coverage |
| E2E test failures | 0 | All user workflows must work |
| Accessibility violations | 0 critical/serious | WCAG compliance |
| Bundle size | < 200KB gzip | Performance optimization |
| CI duration | < 90s median | Fast feedback loop |

## 🔧 Configuration

### Vitest (Unit Tests)

- **Environment**: happy-dom for lightweight DOM simulation
- **Coverage**: v8 provider with HTML/JSON reports
- **Aliases**: `@site/*` for source files, `@/*` for test utilities
- **Mocking**: Canvas context, localStorage, matchMedia, and more

### Playwright (E2E Tests)

- **Browsers**: Chromium, Firefox, WebKit
- **Base URL**: http://localhost:8000 (Gatsby dev server)
- **Parallelization**: Enabled for faster test execution
- **Screenshots**: On failure for debugging

### ESLint & TypeScript

- **Strict mode**: Enabled for better code quality
- **Test-specific rules**: Relaxed for mocking and test utilities
- **Global test functions**: Vitest globals (describe, it, expect, vi)

## 🎯 Test Patterns

### Module Contract Testing

All background modules must implement the standard interface:

```typescript
interface BackgroundModule {
  pause: () => void
  resume: () => void  
  destroy: () => void
  onThemeChange?: (theme: 'light' | 'dark') => void
  onResize?: (width: number, height: number) => void
}
```

Tests verify:
- Module setup returns correct interface
- Lifecycle methods work as expected
- Theme changes are handled properly
- Resize events update module state

### Accessibility Testing

Custom axe-core rules for background modules:

```typescript
// Example: Canvas accessibility
{
  selector: 'canvas',
  evaluate: (node) => {
    return node.hasAttribute('aria-label') || 
           node.hasAttribute('role')
  }
}
```

### Deterministic Testing

Test fixtures provide consistent test data:

```json
{
  "deterministicSeeds": {
    "gradient": {
      "seed": 12345,
      "colorStops": [...]
    }
  }
}
```

## 🚀 Adding New Tests

### For New Background Modules

1. Add module metadata to `fixtures/module-seeds.json`
2. Update module list in `e2e/module-smoke.spec.ts`
3. Create unit tests for any exported utilities
4. Verify accessibility compliance

### For New UI Components

1. Create component test file in `unit/`
2. Mock dependencies (BackgroundContext, ThemeContext)
3. Test user interactions with `@testing-library/user-event`
4. Verify accessibility with appropriate ARIA attributes

### For New User Workflows

1. Add E2E test scenario to relevant spec file
2. Use page object pattern for complex interactions
3. Include accessibility checks with `checkA11y()`
4. Test across multiple browsers if workflow is critical

## 🐛 Debugging Tests

### Unit Tests

```bash
# Run tests in watch mode
npm run test:unit:watch

# Debug specific test file
npx vitest run unit/background-context.test.tsx

# View coverage report
open packages/tests/coverage/index.html
```

### E2E Tests

```bash
# Run with browser UI (headed mode)
npm run test:e2e:headed

# Debug specific test
npx playwright test --debug module-smoke.spec.ts

# View test report
npx playwright show-report
```

### Common Issues

1. **Canvas tests failing**: Check if canvas context is properly mocked in `setup.ts`
2. **Theme tests failing**: Verify `matchMedia` mock handles theme queries
3. **E2E tests timing out**: Increase timeout or add wait conditions
4. **TypeScript errors**: Check path aliases in `tsconfig.json`

### 🚨 **Current Critical Issues (August 2025)**

#### **Unit Test Failures**
```
Error: Cannot read properties of null (reading 'useState')
```
**Root Cause**: React testing environment not properly configured for React 18 hooks
**Files Affected**: Most component tests, especially BackgroundContext tests
**Fix Required**: Update test setup with proper React context mocking

#### **ESLint Violations (150+ errors)**
```
❌ 'variable' is assigned a value but never used
❌ 'console' statements not allowed in production code  
❌ 'undefined' variable referenced
```
**Root Cause**: Development debugging code left in codebase
**Files Affected**: Most E2E test files and some unit tests
**Fix Required**: Clean up unused variables, remove console statements, fix references

#### **Playwright Timeout Issues**
```
Error: Timeout 30000ms exceeded
Error: ECONNREFUSED while building Docker containers
```
**Root Cause**: Docker container dependency resolution and network configuration
**Files Affected**: All E2E tests when run in Docker environment
**Fix Required**: Update Docker configuration and container networking

## 📈 Performance Optimization

### Test Execution Speed

- **Parallel execution**: Playwright runs tests concurrently
- **Smart mocking**: Mock heavy dependencies (canvas, D3, etc.)
- **Selective running**: Only test changed files in development
- **Cached builds**: Reuse Playwright browser installations

### CI Optimization

```yaml
# GitHub Actions cache strategy
- uses: actions/cache@v4
  with:
    path: |
      ~/.npm
      packages/tests/node_modules/.playwright
    key: ${{ runner.os }}-test-deps-${{ hashFiles('**/package-lock.json') }}
```

## 🔄 Continuous Integration

The test suite runs automatically on:

- **Pull Requests**: Full test suite + accessibility checks
- **Main branch pushes**: Full test suite + bundle size analysis
- **Nightly**: Extended test suite with visual regression tests (future)

### Branch Protection

Main branch requires:
- ❌ All unit tests passing **[CURRENTLY FAILING]**
- ❌ All E2E tests passing **[CURRENTLY FAILING]**
- ❌ No accessibility violations **[NEEDS ATTENTION]**
- ✅ Bundle size under threshold
- ❌ Code coverage ≥ 80% **[CANNOT MEASURE DUE TO TEST FAILURES]**

**⚠️ Branch protection is currently disabled due to critical test failures**

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [Background System Design Document](../../docs/S-BG-TEST-001.md)

## 🤝 Contributing

1. **Add tests for new features**: All new background modules and UI components need tests
2. **Update documentation**: Keep this README current with any architectural changes
3. **Run full test suite**: Use `npm run test:ci` before submitting PRs
4. **Check accessibility**: Use `checkA11y()` for any UI changes

## 📋 Maintenance

### Regular Tasks

- Update Playwright browsers: `npx playwright install`
- Update dependencies: `npm audit fix`
- Review coverage reports: Identify untested code paths
- Monitor CI performance: Keep test execution under 90s

### When Adding Dependencies

1. Update `package.json` with appropriate version ranges
2. Add TypeScript types if needed (`@types/*`)
3. Update ESLint configuration for new globals
4. Add to `.gitignore` if needed (coverage, build artifacts)

---

## 🎯 **Recovery Plan**

### **Phase 1: Critical Fixes (Priority 1)**
1. **React Testing Environment** (3-5 days)
   - Fix hooks context mocking in test setup
   - Update React Testing Library configuration for React 18
   - Restore BackgroundContext test functionality
   
2. **Code Quality** (2-3 days)
   - Prefix unused variables with underscore
   - Remove all console.log statements
   - Fix undefined variable references
   
3. **Playwright Stability** (2-4 days)
   - Fix Docker container networking
   - Update timeout configurations
   - Resolve dependency installation issues

### **Phase 2: Validation (Priority 2)**
1. **Test Coverage Restoration** (1-2 days)
   - Verify all unit tests pass
   - Confirm E2E test stability
   - Re-enable CI/CD pipeline

2. **Accessibility Fixes** (2-3 days)
   - Complete ARIA implementation
   - Fix focus management issues
   - Pass all axe-core audits

### **Success Criteria**
- [ ] 0 unit test failures
- [ ] 0 E2E test failures  
- [ ] 0 ESLint violations
- [ ] CI/CD pipeline functional
- [ ] Branch protection re-enabled

---

**⚠️ Documentation Updated: August 14, 2025**  
**Status**: Testing infrastructure requires immediate stabilization before reliable development can continue.

**Generated with [Claude Code](https://claude.ai/code)**

Built with ❤️ for reliable, accessible, and performant background animations.