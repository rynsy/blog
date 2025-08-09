/**
 * Type-Safe Performance Monitor for Background System V3
 * 
 * Provides comprehensive performance monitoring with strict TypeScript typing,
 * memory leak detection, and adaptive quality recommendations.
 */

import {
  PerformanceMetrics,
  MemoryStats,
  DeviceCapabilities,
  ModuleConfiguration
} from '@/interfaces/BackgroundSystemV3'
import {
  EnhancedPerformanceMetrics,
  PerformanceRecommendation,
  PerformanceAction,
  ModuleId,
  PerformanceTimestamp,
  MemoryMB,
  createPerformanceTimestamp,
  createMemoryMB,
  isValidPerformanceMetrics
} from '@/types/utilities'

// ============================================================================
// Performance Monitoring Configuration
// ============================================================================

interface PerformanceMonitorConfig {
  readonly sampleSize: number
  readonly memoryCheckInterval: number
  readonly performanceThresholds: PerformanceThresholds
  readonly enableMemoryLeakDetection: boolean
  readonly enableAdaptiveQuality: boolean
  readonly logLevel: 'none' | 'basic' | 'detailed'
}

interface PerformanceThresholds {
  readonly minFPS: number
  readonly maxFrameTime: number
  readonly maxMemoryUsage: MemoryMB
  readonly memoryLeakThreshold: MemoryMB
  readonly criticalPerformanceThreshold: number
}

const DEFAULT_CONFIG: PerformanceMonitorConfig = {
  sampleSize: 60, // 1 second at 60fps
  memoryCheckInterval: 5000, // 5 seconds
  performanceThresholds: {
    minFPS: 30,
    maxFrameTime: 33.33, // 30fps = 33.33ms per frame
    maxMemoryUsage: createMemoryMB(100),
    memoryLeakThreshold: createMemoryMB(10), // 10MB increase over time
    criticalPerformanceThreshold: 25 // Below 25fps is critical
  },
  enableMemoryLeakDetection: true,
  enableAdaptiveQuality: true,
  logLevel: 'basic'
}

// ============================================================================
// Performance History Management
// ============================================================================

class PerformanceHistory {
  private readonly samples: PerformanceMetrics[] = []
  private readonly maxSamples: number
  
  constructor(maxSamples: number = 60) {
    this.maxSamples = maxSamples
  }
  
  addSample(metrics: PerformanceMetrics): void {
    if (!isValidPerformanceMetrics(metrics)) {
      console.warn('Invalid performance metrics provided', metrics)
      return
    }
    
    this.samples.push(metrics)
    
    // Maintain sample size limit
    if (this.samples.length > this.maxSamples) {
      this.samples.shift()
    }
  }
  
  getAverageFPS(): number {
    if (this.samples.length === 0) return 0
    
    const totalFPS = this.samples.reduce((sum, sample) => sum + sample.fps, 0)
    return totalFPS / this.samples.length
  }
  
  getAverageFrameTime(): number {
    if (this.samples.length === 0) return 0
    
    const totalFrameTime = this.samples.reduce((sum, sample) => sum + sample.frameTime, 0)
    return totalFrameTime / this.samples.length
  }
  
  getMemoryTrend(): 'increasing' | 'decreasing' | 'stable' {
    if (this.samples.length < 10) return 'stable'
    
    const recentSamples = this.samples.slice(-10)
    const oldSamples = this.samples.slice(-20, -10)
    
    if (recentSamples.length === 0 || oldSamples.length === 0) return 'stable'
    
    const recentAvg = recentSamples.reduce((sum, s) => sum + s.memoryUsage, 0) / recentSamples.length
    const oldAvg = oldSamples.reduce((sum, s) => sum + s.memoryUsage, 0) / oldSamples.length
    
    const threshold = 5 // 5MB threshold
    if (recentAvg > oldAvg + threshold) return 'increasing'
    if (recentAvg < oldAvg - threshold) return 'decreasing'
    return 'stable'
  }
  
  getPerformanceScore(): number {
    if (this.samples.length === 0) return 100
    
    const avgFPS = this.getAverageFPS()
    const avgFrameTime = this.getAverageFrameTime()
    const latestMemory = this.samples[this.samples.length - 1]?.memoryUsage || 0
    
    // Calculate score based on FPS (60%), frame time consistency (25%), memory usage (15%)
    const fpsScore = Math.min(100, (avgFPS / 60) * 100)
    
    // Frame time consistency (lower variance is better)
    const frameTimeVariance = this.calculateFrameTimeVariance()
    const consistencyScore = Math.max(0, 100 - (frameTimeVariance * 10))
    
    const memoryScore = Math.max(0, 100 - (latestMemory / 2)) // 200MB = 0 score
    
    return Math.round(fpsScore * 0.6 + consistencyScore * 0.25 + memoryScore * 0.15)
  }
  
  private calculateFrameTimeVariance(): number {
    if (this.samples.length < 2) return 0
    
    const frameTimes = this.samples.map(s => s.frameTime)
    const mean = frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length
    const variance = frameTimes.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / frameTimes.length
    
    return Math.sqrt(variance)
  }
  
  clear(): void {
    this.samples.length = 0
  }
  
  getSamples(): readonly PerformanceMetrics[] {
    return [...this.samples]
  }
}

// ============================================================================
// Memory Leak Detection
// ============================================================================

class MemoryLeakDetector {
  private readonly memorySnapshots: MemoryStats[] = []
  private readonly snapshotInterval: number
  private lastSnapshotTime = 0
  
  constructor(snapshotInterval: number = 30000) { // 30 seconds
    this.snapshotInterval = snapshotInterval
  }
  
  recordMemorySnapshot(stats: MemoryStats): void {
    const now = Date.now()
    
    if (now - this.lastSnapshotTime >= this.snapshotInterval) {
      this.memorySnapshots.push({ ...stats })
      this.lastSnapshotTime = now
      
      // Keep only last 20 snapshots (10 minutes of data)
      if (this.memorySnapshots.length > 20) {
        this.memorySnapshots.shift()
      }
    }
  }
  
  detectLeaks(): {
    hasLeaks: boolean
    leakRate: MemoryMB
    confidence: number
  } {
    if (this.memorySnapshots.length < 3) {
      return { hasLeaks: false, leakRate: createMemoryMB(0), confidence: 0 }
    }
    
    // Calculate trend using linear regression
    const n = this.memorySnapshots.length
    let sumX = 0
    let sumY = 0
    let sumXY = 0
    let sumX2 = 0
    
    this.memorySnapshots.forEach((snapshot, index) => {
      const x = index
      const y = snapshot.used
      sumX += x
      sumY += y
      sumXY += x * y
      sumX2 += x * x
    })
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const leakRate = createMemoryMB(slope * (this.snapshotInterval / 1000)) // MB per second
    
    // Calculate confidence based on correlation coefficient
    const avgX = sumX / n
    const avgY = sumY / n
    let numerator = 0
    let denomX = 0
    let denomY = 0
    
    this.memorySnapshots.forEach((snapshot, index) => {
      const deltaX = index - avgX
      const deltaY = snapshot.used - avgY
      numerator += deltaX * deltaY
      denomX += deltaX * deltaX
      denomY += deltaY * deltaY
    })
    
    const correlation = numerator / Math.sqrt(denomX * denomY)
    const confidence = Math.abs(correlation) * 100
    
    const hasLeaks = leakRate > createMemoryMB(0.1) && confidence > 70 // 0.1MB/s leak with 70% confidence
    
    return { hasLeaks, leakRate, confidence }
  }
  
  clear(): void {
    this.memorySnapshots.length = 0
    this.lastSnapshotTime = 0
  }
}

// ============================================================================
// Type-Safe Performance Monitor
// ============================================================================

export class TypeSafePerformanceMonitor {
  private readonly config: PerformanceMonitorConfig
  private readonly history: PerformanceHistory
  private readonly memoryLeakDetector: MemoryLeakDetector
  private readonly modulePerformance = new Map<ModuleId, PerformanceHistory>()
  
  private lastFrameTime = 0
  private frameCount = 0
  private isMonitoring = false
  private animationFrameId: number | null = null
  
  constructor(config: Partial<PerformanceMonitorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.history = new PerformanceHistory(this.config.sampleSize)
    this.memoryLeakDetector = new MemoryLeakDetector(this.config.memoryCheckInterval)
  }
  
  // ========================================================================
  // Monitoring Control
  // ========================================================================
  
  startMonitoring(): void {
    if (this.isMonitoring) {
      console.warn('Performance monitoring is already active')
      return
    }
    
    this.isMonitoring = true
    this.lastFrameTime = performance.now()
    this.scheduleNextFrame()
    
    if (this.config.logLevel !== 'none') {
      console.log('🔍 Type-safe performance monitoring started')
    }
  }
  
  stopMonitoring(): void {
    if (!this.isMonitoring) return
    
    this.isMonitoring = false
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
    
    if (this.config.logLevel !== 'none') {
      console.log('🔍 Performance monitoring stopped')
    }
  }
  
  // ========================================================================
  // Performance Tracking
  // ========================================================================
  
  recordFrame(): void {
    const now = performance.now()
    const frameTime = now - this.lastFrameTime
    const fps = frameTime > 0 ? 1000 / frameTime : 0
    
    const metrics: PerformanceMetrics = {
      fps,
      frameTime,
      memoryUsage: this.getCurrentMemoryUsage(),
      renderTime: 0, // Will be updated by render calls
      timestamp: now
    }
    
    this.history.addSample(metrics)
    this.frameCount++
    this.lastFrameTime = now
    
    // Check for performance issues
    if (this.config.enableAdaptiveQuality) {
      this.checkPerformanceThresholds(metrics)
    }
    
    // Record memory snapshot for leak detection
    if (this.config.enableMemoryLeakDetection && this.frameCount % 300 === 0) { // Every 5 seconds at 60fps
      this.memoryLeakDetector.recordMemorySnapshot({
        used: metrics.memoryUsage,
        allocated: metrics.memoryUsage * 1.2, // Estimate
        peak: metrics.memoryUsage * 1.5, // Estimate
        leaks: 0
      })
    }
  }
  
  recordRenderTime(moduleId: ModuleId, renderTime: number): void {
    // Update module-specific performance
    let moduleHistory = this.modulePerformance.get(moduleId)
    if (!moduleHistory) {
      moduleHistory = new PerformanceHistory(30) // Smaller sample for modules
      this.modulePerformance.set(moduleId, moduleHistory)
    }
    
    const metrics: PerformanceMetrics = {
      fps: 0, // Not applicable for render time
      frameTime: 0,
      memoryUsage: this.getCurrentMemoryUsage(),
      renderTime,
      timestamp: performance.now()
    }
    
    moduleHistory.addSample(metrics)
  }
  
  // ========================================================================
  // Metrics Retrieval
  // ========================================================================
  
  getMetrics(): EnhancedPerformanceMetrics {
    const baseMetrics = this.getCurrentMetrics()
    const recommendations = this.generateRecommendations()
    
    return {
      ...baseMetrics,
      computedFPS: this.history.getAverageFPS(),
      averageFrameTime: this.history.getAverageFrameTime(),
      memoryEfficiency: this.calculateMemoryEfficiency(),
      performanceScore: this.history.getPerformanceScore(),
      recommendations
    }
  }
  
  getModuleMetrics(moduleId: ModuleId): EnhancedPerformanceMetrics | null {
    const moduleHistory = this.modulePerformance.get(moduleId)
    if (!moduleHistory) return null
    
    const samples = moduleHistory.getSamples()
    if (samples.length === 0) return null
    
    const latest = samples[samples.length - 1]
    if (!latest) return null
    
    return {
      ...latest,
      computedFPS: 0, // Not applicable
      averageFrameTime: moduleHistory.getAverageFrameTime(),
      memoryEfficiency: 0, // Not applicable
      performanceScore: Math.min(100, Math.max(0, 100 - latest.renderTime)), // Simple render time score
      recommendations: []
    }
  }
  
  // ========================================================================
  // Memory Management
  // ========================================================================
  
  checkMemoryLeaks(): {
    hasLeaks: boolean
    leakRate: MemoryMB
    confidence: number
    recommendations: PerformanceRecommendation[]
  } {
    const detection = this.memoryLeakDetector.detectLeaks()
    const recommendations: PerformanceRecommendation[] = []
    
    if (detection.hasLeaks) {
      recommendations.push({
        type: 'memory',
        severity: 'critical',
        message: `Memory leak detected: ${detection.leakRate}MB/s`,
        action: {
          type: 'reduce_quality',
          parameters: {
            targetQuality: 'low',
            reason: 'memory_leak'
          }
        }
      })
    }
    
    return {
      ...detection,
      recommendations
    }
  }
  
  // ========================================================================
  // Performance Optimization
  // ========================================================================
  
  getOptimalConfiguration(
    currentConfig: ModuleConfiguration,
    deviceCapabilities: DeviceCapabilities
  ): {
    config: ModuleConfiguration
    reasoning: string[]
  } {
    const metrics = this.getMetrics()
    const reasoning: string[] = []
    let optimizedConfig = { ...currentConfig }
    
    // Adjust quality based on performance
    if (metrics.computedFPS < this.config.performanceThresholds.minFPS) {
      if (currentConfig.quality === 'high') {
        optimizedConfig.quality = 'medium'
        reasoning.push('Reduced quality from high to medium due to low FPS')
      } else if (currentConfig.quality === 'medium') {
        optimizedConfig.quality = 'low'
        reasoning.push('Reduced quality from medium to low due to low FPS')
      }
    }
    
    // Memory-based optimizations
    if (metrics.memoryUsage > this.config.performanceThresholds.maxMemoryUsage) {
      if ('nodes' in optimizedConfig && typeof optimizedConfig.nodes === 'number') {
        optimizedConfig.nodes = Math.max(10, Math.floor(optimizedConfig.nodes * 0.8))
        reasoning.push('Reduced node count due to high memory usage')
      }
    }
    
    // Device capability considerations
    if (deviceCapabilities.isLowEnd && currentConfig.quality !== 'low') {
      optimizedConfig.quality = 'low'
      reasoning.push('Set quality to low for low-end device')
    }
    
    if (deviceCapabilities.isMobile && 'animationSpeed' in optimizedConfig) {
      optimizedConfig.animationSpeed = (optimizedConfig.animationSpeed as number) * 0.7
      reasoning.push('Reduced animation speed for mobile device')
    }
    
    return {
      config: optimizedConfig,
      reasoning
    }
  }
  
  // ========================================================================
  // Private Methods
  // ========================================================================
  
  private scheduleNextFrame(): void {
    if (!this.isMonitoring) return
    
    this.animationFrameId = requestAnimationFrame(() => {
      this.recordFrame()
      this.scheduleNextFrame()
    })
  }
  
  private getCurrentMetrics(): PerformanceMetrics {
    const samples = this.history.getSamples()
    if (samples.length === 0) {
      return {
        fps: 0,
        frameTime: 0,
        memoryUsage: 0,
        renderTime: 0,
        timestamp: performance.now()
      }
    }
    
    return samples[samples.length - 1] || {
      fps: 0,
      frameTime: 0,
      memoryUsage: 0,
      renderTime: 0,
      timestamp: performance.now()
    }
  }
  
  private getCurrentMemoryUsage(): number {
    // Use performance.memory if available (Chrome)
    if ('memory' in performance && performance.memory) {
      const memory = performance.memory as {
        usedJSHeapSize?: number
        totalJSHeapSize?: number
        jsHeapSizeLimit?: number
      }
      return (memory.usedJSHeapSize || 0) / (1024 * 1024) // Convert to MB
    }
    
    // Fallback estimation
    return Math.random() * 50 // Random estimation for demo
  }
  
  private calculateMemoryEfficiency(): number {
    const avgFPS = this.history.getAverageFPS()
    const memoryUsage = this.getCurrentMemoryUsage()
    
    if (memoryUsage === 0) return 100
    
    // Higher efficiency = more FPS per MB of memory
    return Math.min(100, (avgFPS / memoryUsage) * 10)
  }
  
  private checkPerformanceThresholds(metrics: PerformanceMetrics): void {
    const thresholds = this.config.performanceThresholds
    
    if (metrics.fps < thresholds.criticalPerformanceThreshold) {
      if (this.config.logLevel === 'detailed') {
        console.warn(`🚨 Critical performance: ${metrics.fps.toFixed(1)} FPS`)
      }
    } else if (metrics.fps < thresholds.minFPS) {
      if (this.config.logLevel === 'detailed') {
        console.warn(`⚠️ Low performance: ${metrics.fps.toFixed(1)} FPS`)
      }
    }
    
    if (metrics.memoryUsage > thresholds.maxMemoryUsage) {
      if (this.config.logLevel === 'detailed') {
        console.warn(`🧠 High memory usage: ${metrics.memoryUsage.toFixed(1)} MB`)
      }
    }
  }
  
  private generateRecommendations(): PerformanceRecommendation[] {
    const recommendations: PerformanceRecommendation[] = []
    const metrics = this.getMetrics()
    
    // FPS recommendations
    if (metrics.computedFPS < this.config.performanceThresholds.minFPS) {
      recommendations.push({
        type: 'quality',
        severity: metrics.computedFPS < this.config.performanceThresholds.criticalPerformanceThreshold ? 'critical' : 'warning',
        message: `Low FPS detected (${metrics.computedFPS.toFixed(1)}). Consider reducing quality or node count.`,
        action: {
          type: 'reduce_quality',
          parameters: {
            targetQuality: 'low',
            reason: 'low_fps'
          }
        }
      })
    }
    
    // Memory recommendations
    if (metrics.memoryUsage > this.config.performanceThresholds.maxMemoryUsage) {
      recommendations.push({
        type: 'memory',
        severity: 'warning',
        message: `High memory usage (${metrics.memoryUsage.toFixed(1)}MB). Consider limiting active modules.`,
        action: {
          type: 'limit_nodes',
          parameters: {
            maxNodes: 15,
            reason: 'high_memory'
          }
        }
      })
    }
    
    // Memory trend recommendations
    const memoryTrend = this.history.getMemoryTrend()
    if (memoryTrend === 'increasing') {
      recommendations.push({
        type: 'memory',
        severity: 'info',
        message: 'Memory usage is increasing over time. Monitor for potential leaks.'
      })
    }
    
    return recommendations
  }
  
  // ========================================================================
  // Cleanup
  // ========================================================================
  
  cleanup(): void {
    this.stopMonitoring()
    this.history.clear()
    this.memoryLeakDetector.clear()
    this.modulePerformance.clear()
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const performanceMonitor = new TypeSafePerformanceMonitor()

// Export types for external use
export type {
  PerformanceMonitorConfig,
  PerformanceThresholds,
  EnhancedPerformanceMetrics,
  PerformanceRecommendation,
  PerformanceAction
}
