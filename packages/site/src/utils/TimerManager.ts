/**
 * Timer Manager
 * Provides centralized tracking and cleanup of setTimeout and setInterval calls
 * to prevent memory leaks in background modules
 */

export class TimerManager {
  private activeTimeouts: Set<NodeJS.Timeout> = new Set()
  private activeIntervals: Set<NodeJS.Timeout> = new Set()
  private isDestroyed: boolean = false

  /**
   * Creates a tracked setTimeout that will be automatically cleaned up
   */
  setTimeout(callback: () => void, delay: number): NodeJS.Timeout {
    if (this.isDestroyed) {
      console.warn('TimerManager is destroyed, ignoring setTimeout call')
      return setTimeout(() => {}, 0) // Return dummy timeout
    }

    const timeoutId = setTimeout(() => {
      // Auto-remove from tracking when completed
      this.activeTimeouts.delete(timeoutId)
      if (!this.isDestroyed) {
        callback()
      }
    }, delay)

    this.activeTimeouts.add(timeoutId)
    return timeoutId
  }

  /**
   * Creates a tracked setInterval that will be automatically cleaned up
   */
  setInterval(callback: () => void, interval: number): NodeJS.Timeout {
    if (this.isDestroyed) {
      console.warn('TimerManager is destroyed, ignoring setInterval call')
      return setInterval(() => {}, Number.MAX_SAFE_INTEGER) // Return dummy interval
    }

    const intervalId = setInterval(() => {
      if (!this.isDestroyed) {
        callback()
      } else {
        // Auto-cleanup if destroyed during execution
        clearInterval(intervalId)
        this.activeIntervals.delete(intervalId)
      }
    }, interval)

    this.activeIntervals.add(intervalId)
    return intervalId
  }

  /**
   * Clears a specific timeout and removes it from tracking
   */
  clearTimeout(timeoutId: NodeJS.Timeout): void {
    clearTimeout(timeoutId)
    this.activeTimeouts.delete(timeoutId)
  }

  /**
   * Clears a specific interval and removes it from tracking
   */
  clearInterval(intervalId: NodeJS.Timeout): void {
    clearInterval(intervalId)
    this.activeIntervals.delete(intervalId)
  }

  /**
   * Clears all active timers and prevents new ones from being created
   */
  destroy(): void {
    // Clear all active timeouts
    this.activeTimeouts.forEach(timeoutId => {
      clearTimeout(timeoutId)
    })
    this.activeTimeouts.clear()

    // Clear all active intervals
    this.activeIntervals.forEach(intervalId => {
      clearInterval(intervalId)
    })
    this.activeIntervals.clear()

    this.isDestroyed = true
  }

  /**
   * Get metrics about active timers
   */
  getMetrics(): {
    activeTimeouts: number
    activeIntervals: number
    isDestroyed: boolean
  } {
    return {
      activeTimeouts: this.activeTimeouts.size,
      activeIntervals: this.activeIntervals.size,
      isDestroyed: this.isDestroyed
    }
  }

  /**
   * Check if there are any active timers that might cause memory leaks
   */
  hasActiveTimers(): boolean {
    return this.activeTimeouts.size > 0 || this.activeIntervals.size > 0
  }

  /**
   * Get a list of all active timer IDs for debugging
   */
  getActiveTimerIds(): {
    timeouts: NodeJS.Timeout[]
    intervals: NodeJS.Timeout[]
  } {
    return {
      timeouts: Array.from(this.activeTimeouts),
      intervals: Array.from(this.activeIntervals)
    }
  }
}

/**
 * Global timer manager instance for modules that don't want to manage their own
 */
let globalTimerManager: TimerManager | null = null

export function getGlobalTimerManager(): TimerManager {
  if (!globalTimerManager) {
    globalTimerManager = new TimerManager()
  }
  return globalTimerManager
}

/**
 * Cleanup the global timer manager (useful for testing or app shutdown)
 */
export function destroyGlobalTimerManager(): void {
  if (globalTimerManager) {
    globalTimerManager.destroy()
    globalTimerManager = null
  }
}

/**
 * Utility hook for React components to create a timer manager that auto-cleans on unmount
 * Note: This requires React to be imported separately
 */
// export function useTimerManager(): TimerManager {
//   const timerManagerRef = React.useRef<TimerManager | null>(null)
//   
//   if (!timerManagerRef.current) {
//     timerManagerRef.current = new TimerManager()
//   }
//
//   React.useEffect(() => {
//     return () => {
//       timerManagerRef.current?.destroy()
//     }
//   }, [])
//
//   return timerManagerRef.current
// }

// Commented out to avoid React dependency in base utility