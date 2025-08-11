import { PerformanceMetrics, MemoryStats } from '../../../interfaces/BackgroundSystemV3'

/**
 * Monitors performance metrics for background modules
 * Tracks FPS, memory usage, frame time, and provides optimization hints
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    fps: 0,
    frameTime: 0,
    memoryUsage: 0,
    renderTime: 0,
    timestamp: Date.now()
  }

  private frameHistory: number[] = []
  private renderTimeHistory: number[] = []
  private lastFrameTime = 0
  private frameCount = 0
  private lastFPSUpdate = 0
  private isMonitoring = false
  private memoryObserver: PerformanceObserver | null = null

  private readonly HISTORY_SIZE = 60 // Keep 60 frames of history
  private readonly FPS_UPDATE_INTERVAL = 1000 // Update FPS every second
  private readonly PERFORMANCE_THRESHOLDS = {
    LOW_FPS: 30,
    HIGH_FRAME_TIME: 33.33, // ~30 FPS
    HIGH_MEMORY: 100, // MB
    CRITICAL_MEMORY: 200 // MB
  }

  constructor() {
    this.initializeMemoryMonitoring()
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return

    this.isMonitoring = true
    this.lastFPSUpdate = performance.now()
    this.frameCount = 0
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false
    this.frameHistory.length = 0
    this.renderTimeHistory.length = 0
  }

  /**
   * Mark the start of a frame
   */
  startFrame(): void {
    if (!this.isMonitoring) return
    this.lastFrameTime = performance.now()
  }

  /**
   * Mark the end of a frame and update metrics
   */
  endFrame(): void {
    if (!this.isMonitoring) return

    const currentTime = performance.now()
    const frameTime = currentTime - this.lastFrameTime
    const renderTime = frameTime // For now, assume render time equals frame time

    // Update frame history
    this.frameHistory.push(frameTime)
    this.renderTimeHistory.push(renderTime)

    if (this.frameHistory.length > this.HISTORY_SIZE) {
      this.frameHistory.shift()
    }

    if (this.renderTimeHistory.length > this.HISTORY_SIZE) {
      this.renderTimeHistory.shift()
    }

    // Update frame count for FPS calculation
    this.frameCount++

    // Update FPS periodically
    if (currentTime - this.lastFPSUpdate >= this.FPS_UPDATE_INTERVAL) {
      this.updateFPS(currentTime)
      this.lastFPSUpdate = currentTime
      this.frameCount = 0
    }

    // Update metrics
    this.updateMetrics()
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  /**
   * Check if performance optimization is needed
   */
  shouldOptimize(): boolean {
    return (
      this.metrics.fps < this.PERFORMANCE_THRESHOLDS.LOW_FPS ||
      this.metrics.frameTime > this.PERFORMANCE_THRESHOLDS.HIGH_FRAME_TIME ||
      this.metrics.memoryUsage > this.PERFORMANCE_THRESHOLDS.HIGH_MEMORY
    )
  }

  /**
   * Get performance grade (A-F)
   */
  getPerformanceGrade(): string {
    const { fps, frameTime, memoryUsage } = this.metrics

    let score = 100

    // Deduct points for low FPS
    if (fps < 60) score -= (60 - fps) * 2
    if (fps < 30) score -= 20 // Extra penalty for very low FPS

    // Deduct points for high frame time
    if (frameTime > 16.67) score -= (frameTime - 16.67) * 2

    // Deduct points for high memory usage
    if (memoryUsage > 50) score -= (memoryUsage - 50) * 0.5
    if (memoryUsage > 100) score -= 10 // Extra penalty for high memory

    if (score >= 90) return 'A'
    if (score >= 80) return 'B'
    if (score >= 70) return 'C'
    if (score >= 60) return 'D'
    return 'F'
  }

  /**
   * Get optimization suggestions
   */
  getOptimizationSuggestions(): string[] {
    const suggestions: string[] = []
    const { fps, frameTime, memoryUsage } = this.metrics

    if (fps < this.PERFORMANCE_THRESHOLDS.LOW_FPS) {
      suggestions.push('Consider reducing particle count or visual effects')
      suggestions.push('Enable adaptive quality mode')
    }

    if (frameTime > this.PERFORMANCE_THRESHOLDS.HIGH_FRAME_TIME) {
      suggestions.push('Optimize rendering pipeline')
      suggestions.push('Consider using requestIdleCallback for non-critical updates')
    }

    if (memoryUsage > this.PERFORMANCE_THRESHOLDS.HIGH_MEMORY) {
      suggestions.push('Release unused resources')
      suggestions.push('Implement object pooling for frequently created objects')
    }

    if (memoryUsage > this.PERFORMANCE_THRESHOLDS.CRITICAL_MEMORY) {
      suggestions.push('Critical memory usage - consider disabling background modules')
    }

    return suggestions
  }

  /**
   * Get memory statistics if available
   */
  getMemoryStats(): MemoryStats {
    const memory = (performance as any).memory
    
    if (memory) {
      return {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
        allocated: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
        peak: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB (simplified)
        leaks: 0 // Would need more sophisticated detection
      }
    }

    // Fallback for browsers without memory API
    return {
      used: this.metrics.memoryUsage,
      allocated: this.metrics.memoryUsage * 1.2,
      peak: this.metrics.memoryUsage * 1.1,
      leaks: 0
    }
  }

  /**
   * Reset all metrics and history
   */
  reset(): void {
    this.metrics = {
      fps: 0,
      frameTime: 0,
      memoryUsage: 0,
      renderTime: 0,
      timestamp: Date.now()
    }
    this.frameHistory.length = 0
    this.renderTimeHistory.length = 0
    this.frameCount = 0
  }

  /**
   * Export performance data for analysis
   */
  exportData(): {
    metrics: PerformanceMetrics
    frameHistory: number[]
    renderTimeHistory: number[]
    memoryStats: MemoryStats
    timestamp: number
  } {
    return {
      metrics: this.getMetrics(),
      frameHistory: [...this.frameHistory],
      renderTimeHistory: [...this.renderTimeHistory],
      memoryStats: this.getMemoryStats(),
      timestamp: Date.now()
    }
  }

  private updateFPS(currentTime: number): void {
    const deltaTime = currentTime - this.lastFPSUpdate
    if (deltaTime > 0) {
      this.metrics.fps = Math.round((this.frameCount * 1000) / deltaTime)
    }
  }

  private updateMetrics(): void {
    if (this.frameHistory.length === 0) return

    // Calculate average frame time
    const avgFrameTime = this.frameHistory.reduce((a, b) => a + b, 0) / this.frameHistory.length
    this.metrics.frameTime = Math.round(avgFrameTime * 100) / 100

    // Calculate average render time
    if (this.renderTimeHistory.length > 0) {
      const avgRenderTime = this.renderTimeHistory.reduce((a, b) => a + b, 0) / this.renderTimeHistory.length
      this.metrics.renderTime = Math.round(avgRenderTime * 100) / 100
    }

    // Update memory usage
    const memoryStats = this.getMemoryStats()
    this.metrics.memoryUsage = memoryStats.used

    // Update timestamp
    this.metrics.timestamp = Date.now()
  }

  private initializeMemoryMonitoring(): void {
    // Use PerformanceObserver if available
    if ('PerformanceObserver' in window) {
      try {
        this.memoryObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          // Process memory-related performance entries if needed
        })

        // Observe relevant entry types if supported
        try {
          this.memoryObserver.observe({ entryTypes: ['measure', 'navigation'] })
        } catch (error) {
          // Browser may not support all entry types
          console.warn('Some performance observation features not available:', error)
        }
      } catch (error) {
        console.warn('PerformanceObserver not available:', error)
      }
    }
  }

  /**
   * Cleanup performance monitoring
   */
  cleanup(): void {
    this.stopMonitoring()
    
    if (this.memoryObserver) {
      this.memoryObserver.disconnect()
      this.memoryObserver = null
    }
  }
}
