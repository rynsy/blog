# Test Improvements: Timeout Replacements

## Overview

This document summarizes the improvements made to replace hard-coded test timeouts with proper condition-based waiting mechanisms across the test suite.

## Changes Made

### 1. Created Test Utilities (`packages/tests/setup/testUtils.ts`)

A comprehensive test utility library that provides condition-based waiting functions:

- **`waitFor(condition, options)`** - Wait for a boolean condition to be true
- **`waitForDefined(getValue, options)`** - Wait for a value to be non-null/undefined
- **`waitForElement(selector, options)`** - Wait for DOM elements to exist
- **`waitForHookResult(getResult, expectedValue, options)`** - Wait for React hook state changes
- **`waitForAnimationFrames(count)`** - Wait for animation frames (better than setTimeout)
- **`waitForStablePerformanceMetric(getMetric, options)`** - Wait for metrics to stabilize
- **`waitForWebGLContext(canvas, options)`** - Wait for WebGL context availability
- **`waitForModuleReady(moduleGetter, options)`** - Wait for modules to initialize
- **`waitForStateChange(getCurrentState, predicate, options)`** - Wait for state changes

### 2. Updated Test Files

**Performance Monitoring Tests (`performance-monitoring.test.ts`):**
- Replaced `setTimeout(measurementDuration + 100)` with condition-based waiting
- Replaced rendering delays with `testUtils.sleep()` for consistency
- Added proper condition checking for FPS measurements

**Easter Egg System Tests (`easter-egg-system.test.ts`):**
- Replaced keyboard event delays with `waitForAnimationFrames()`
- Replaced mouse gesture timing with frame-based waiting
- Replaced scroll event processing with animation frame waits
- Replaced preferences loading waits with animation frame waits

**Gradient Module Tests (`gradient-module.test.ts`):**
- Replaced all `setTimeout(20)` calls with `waitForAnimationFrames(1)`
- More reliable animation frame timing for canvas operations

### 3. Benefits of the Changes

#### Reliability Improvements:
- **Deterministic Timing**: Animation frames provide consistent timing across different environments
- **Condition-Based**: Tests wait for actual conditions rather than arbitrary time periods
- **Environment Agnostic**: Works consistently on slow/fast machines
- **Reduced Flakiness**: No more timing-dependent test failures

#### Performance Improvements:
- **Faster Tests**: No waiting longer than necessary
- **Better Resource Usage**: Efficient polling intervals
- **Timeout Protection**: Proper timeout handling prevents infinite waits

#### Maintainability:
- **Consistent API**: Standardized waiting patterns across tests
- **Better Error Messages**: Clear timeout messages for debugging
- **Reusable Utilities**: Common waiting patterns centralized

### 4. Migration Pattern

**Before:**
```typescript
await new Promise(resolve => setTimeout(resolve, 100));
```

**After:**
```typescript
await testUtils.waitForAnimationFrames(3); // For UI updates
// OR
await testUtils.waitFor(() => condition(), { timeout: 5000 }); // For specific conditions
```

### 5. Specific Replacements Made

| File | Old Pattern | New Pattern | Reason |
|------|-------------|-------------|---------|
| `performance-monitoring.test.ts` | `setTimeout(measurementDuration + 100)` | `waitFor(() => condition \|\| timeElapsed)` | Condition-based timing |
| `easter-egg-system.test.ts` | `setTimeout(100)` for keyboard events | `waitForAnimationFrames(2)` | Event processing timing |
| `easter-egg-system.test.ts` | `setTimeout(16)` for mouse events | `waitForAnimationFrames(1)` | 60fps equivalent |
| `easter-egg-system.test.ts` | `setTimeout(400)` for scroll timing | `waitForAnimationFrames(5)` | ~83ms at 60fps |
| `gradient-module.test.ts` | `setTimeout(20)` for animation | `waitForAnimationFrames(1)` | Canvas frame timing |

### 6. Future Improvements

The test utility framework is extensible and can be enhanced with:

- WebGL-specific waiting functions
- Performance metric stabilization
- Module lifecycle waiting
- Custom condition matchers
- Async resource loading helpers

### 7. Usage Guidelines

When writing new tests or updating existing ones:

1. **Use `waitForAnimationFrames()`** for UI-related operations
2. **Use `waitFor()`** for custom conditions
3. **Use `waitForDefined()`** for resource loading
4. **Always provide meaningful timeout messages**
5. **Use appropriate polling intervals** (default 50ms is usually good)
6. **Set realistic timeouts** (5s default, adjust as needed)

This systematic approach to test timing makes the test suite more reliable, maintainable, and faster while reducing flakiness across different environments.