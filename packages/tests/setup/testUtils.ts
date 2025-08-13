/**
 * Test Utilities for Condition-Based Waiting
 * Replaces hard-coded setTimeout with proper condition waiting
 */

/**
 * Wait for a condition to be true with polling
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  options: {
    timeout?: number
    interval?: number
    timeoutMessage?: string
  } = {}
): Promise<void> {
  const {
    timeout = 5000,
    interval = 50,
    timeoutMessage = 'Condition was not met within timeout period'
  } = options

  const startTime = Date.now()

  while (Date.now() - startTime < timeout) {
    const result = await condition()
    if (result) {
      return
    }
    await new Promise(resolve => setTimeout(resolve, interval))
  }

  throw new Error(timeoutMessage)
}

/**
 * Wait for an async function to not throw an error
 */
export async function waitForNoThrow(
  fn: () => Promise<void>,
  options: {
    timeout?: number
    interval?: number
    timeoutMessage?: string
  } = {}
): Promise<void> {
  const {
    timeout = 5000,
    interval = 100,
    timeoutMessage = 'Function continued to throw within timeout period'
  } = options

  await waitFor(
    async () => {
      try {
        await fn()
        return true
      } catch {
        return false
      }
    },
    { timeout, interval, timeoutMessage }
  )
}

/**
 * Wait for a value to be defined (not null or undefined)
 */
export async function waitForDefined<T>(
  getValue: () => T | null | undefined,
  options: {
    timeout?: number
    interval?: number
    timeoutMessage?: string
  } = {}
): Promise<T> {
  const {
    timeout = 5000,
    interval = 50,
    timeoutMessage = 'Value was not defined within timeout period'
  } = options

  let value: T | null | undefined

  await waitFor(
    () => {
      value = getValue()
      return value != null
    },
    { timeout, interval, timeoutMessage }
  )

  return value!
}

/**
 * Wait for a DOM element to exist
 */
export async function waitForElement(
  selector: string,
  options: {
    timeout?: number
    interval?: number
    timeoutMessage?: string
    root?: Document | Element
  } = {}
): Promise<Element> {
  const {
    timeout = 5000,
    interval = 50,
    timeoutMessage = `Element "${selector}" was not found within timeout period`,
    root = document
  } = options

  return waitForDefined(
    () => root.querySelector(selector),
    { timeout, interval, timeoutMessage }
  )
}

/**
 * Wait for a React hook result to change
 */
export async function waitForHookResult<T>(
  getResult: () => T,
  expectedValue: T | ((value: T) => boolean),
  options: {
    timeout?: number
    interval?: number
    timeoutMessage?: string
  } = {}
): Promise<T> {
  const {
    timeout = 5000,
    interval = 50,
    timeoutMessage = 'Hook result did not reach expected value within timeout period'
  } = options

  let currentValue: T

  await waitFor(
    () => {
      currentValue = getResult()
      if (typeof expectedValue === 'function') {
        return (expectedValue as (value: T) => boolean)(currentValue)
      }
      return currentValue === expectedValue
    },
    { timeout, interval, timeoutMessage }
  )

  return currentValue!
}

/**
 * Wait for multiple animation frames to pass
 */
export async function waitForAnimationFrames(count: number = 1): Promise<void> {
  for (let i = 0; i < count; i++) {
    await new Promise(resolve => requestAnimationFrame(resolve))
  }
}

/**
 * Wait for a performance metric to stabilize
 */
export async function waitForStablePerformanceMetric(
  getMetric: () => number,
  options: {
    stabilityThreshold?: number
    stabilityDuration?: number
    timeout?: number
    interval?: number
  } = {}
): Promise<number> {
  const {
    stabilityThreshold = 0.1, // 10% variation
    stabilityDuration = 500, // 500ms of stability
    timeout = 10000,
    interval = 100
  } = options

  const startTime = Date.now()
  let stableStartTime: number | null = null
  let previousValue: number | null = null

  while (Date.now() - startTime < timeout) {
    const currentValue = getMetric()

    if (previousValue !== null) {
      const variation = Math.abs((currentValue - previousValue) / previousValue)
      
      if (variation <= stabilityThreshold) {
        if (stableStartTime === null) {
          stableStartTime = Date.now()
        } else if (Date.now() - stableStartTime >= stabilityDuration) {
          return currentValue
        }
      } else {
        stableStartTime = null
      }
    }

    previousValue = currentValue
    await new Promise(resolve => setTimeout(resolve, interval))
  }

  throw new Error('Performance metric did not stabilize within timeout period')
}

/**
 * Wait for a resource to load
 */
export async function waitForResourceLoad(
  resourceChecker: () => boolean,
  resourceName: string = 'Resource',
  options: {
    timeout?: number
    interval?: number
  } = {}
): Promise<void> {
  const {
    timeout = 10000,
    interval = 100
  } = options

  await waitFor(
    resourceChecker,
    {
      timeout,
      interval,
      timeoutMessage: `${resourceName} did not load within timeout period`
    }
  )
}

/**
 * Wait for WebGL context to be ready
 */
export async function waitForWebGLContext(
  canvas: HTMLCanvasElement,
  options: {
    timeout?: number
    interval?: number
  } = {}
): Promise<WebGLRenderingContext> {
  const {
    timeout = 5000,
    interval = 50
  } = options

  return waitForDefined(
    () => {
      try {
        return canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      } catch {
        return null
      }
    },
    {
      timeout,
      interval,
      timeoutMessage: 'WebGL context was not available within timeout period'
    }
  ) as Promise<WebGLRenderingContext>
}

/**
 * Wait for module initialization to complete
 */
export async function waitForModuleReady(
  moduleGetter: () => any,
  options: {
    timeout?: number
    interval?: number
    requiredMethods?: string[]
  } = {}
): Promise<any> {
  const {
    timeout = 5000,
    interval = 50,
    requiredMethods = ['start', 'stop', 'destroy']
  } = options

  return waitForDefined(
    () => {
      const module = moduleGetter()
      if (!module) return null
      
      // Check if all required methods exist
      const hasAllMethods = requiredMethods.every(method => 
        typeof module[method] === 'function'
      )
      
      return hasAllMethods ? module : null
    },
    {
      timeout,
      interval,
      timeoutMessage: 'Module was not ready with required methods within timeout period'
    }
  )
}

/**
 * Wait for state change in a React component
 */
export async function waitForStateChange<T>(
  getCurrentState: () => T,
  predicate: (state: T) => boolean,
  options: {
    timeout?: number
    interval?: number
    timeoutMessage?: string
  } = {}
): Promise<T> {
  const {
    timeout = 5000,
    interval = 50,
    timeoutMessage = 'State did not change as expected within timeout period'
  } = options

  let currentState: T

  await waitFor(
    () => {
      currentState = getCurrentState()
      return predicate(currentState)
    },
    { timeout, interval, timeoutMessage }
  )

  return currentState!
}

/**
 * Utility to make tests more reliable by ensuring conditions are met
 */
export const testUtils = {
  waitFor,
  waitForNoThrow,
  waitForDefined,
  waitForElement,
  waitForHookResult,
  waitForAnimationFrames,
  waitForStablePerformanceMetric,
  waitForResourceLoad,
  waitForWebGLContext,
  waitForModuleReady,
  waitForStateChange,

  // Legacy support - gradually replace these with condition-based waits
  sleep: (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
}

export default testUtils