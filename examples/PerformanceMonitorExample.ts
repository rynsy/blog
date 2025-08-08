/**
 * Performance Monitoring System Example
 * 
 * This demonstrates comprehensive performance monitoring, memory management,
 * and adaptive optimization for the background system.
 */

import { 
  PerformanceMetrics, 
  MemoryStats, 
  DeviceCapabilities,
  ModuleConfiguration 
} from '../interfaces/BackgroundSystemV3'

// ============================================================================
// Core Performance Monitor
// ============================================================================

export class PerformanceMonitor {
  private metrics: PerformanceMetrics
  private frameHistory: number[] = []
  private memoryHistory: number[] = []
  private lastFrameTime = 0
  private frameStartTime = 0
  private isMonitoring = false
  private observers: ((metrics: PerformanceMetrics) => void)[] = []
  
  // Performance thresholds
  private readonly FPS_TARGET = 60
  private readonly FPS_WARNING = 45
  private readonly FPS_CRITICAL = 20
  private readonly MEMORY_WARNING_MB = 100
  private readonly MEMORY_CRITICAL_MB = 200
  
  constructor() {
    this.metrics = {
      fps: 0,
      frameTime: 0,
      memoryUsage: 0,
      renderTime: 0,
      timestamp: Date.now()
    }
    
    this.setupPerformanceObserver()
    this.startMemoryMonitoring()
  }

  // ============================================================================
  // Frame Performance Monitoring
  // ============================================================================

  startFrame(): void {
    this.frameStartTime = performance.now()
  }

  endFrame(): void {
    if (!this.isMonitoring) return
    
    const frameTime = performance.now() - this.frameStartTime
    this.frameHistory.push(frameTime)
    
    // Keep sliding window of last 60 frames
    if (this.frameHistory.length > 60) {
      this.frameHistory.shift()
    }
    
    this.updateFrameMetrics()
    this.checkPerformanceThresholds()
  }

  private updateFrameMetrics(): void {
    if (this.frameHistory.length === 0) return
    
    const avgFrameTime = this.frameHistory.reduce((sum, time) => sum + time, 0) / this.frameHistory.length
    const fps = Math.min(1000 / avgFrameTime, this.FPS_TARGET)
    
    this.metrics = {
      ...this.metrics,
      fps: Math.round(fps * 100) / 100,
      frameTime: Math.round(avgFrameTime * 100) / 100,
      timestamp: Date.now()
    }
  }

  // ============================================================================
  // Memory Monitoring
  // ============================================================================

  private startMemoryMonitoring(): void {
    // Monitor memory every 5 seconds
    setInterval(() => {
      if (this.isMonitoring) {
        this.updateMemoryMetrics()
      }
    }, 5000)
  }

  private updateMemoryMetrics(): void {
    const memoryInfo = this.getMemoryInfo()
    this.metrics.memoryUsage = memoryInfo.used
    
    this.memoryHistory.push(memoryInfo.used)
    if (this.memoryHistory.length > 60) { // Keep 5 minutes of history
      this.memoryHistory.shift()
    }
    
    this.checkMemoryThresholds(memoryInfo)
  }

  private getMemoryInfo(): MemoryStats {
    // Use Performance API if available
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        allocated: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        peak: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
        leaks: this.detectPotentialLeaks()
      }
    }
    
    // Fallback estimation
    return {
      used: this.estimateMemoryUsage(),
      allocated: 0,
      peak: 0,
      leaks: 0
    }
  }

  private estimateMemoryUsage(): number {
    // Rough estimation based on performance characteristics
    // This is not accurate but provides some indication
    const baseMemory = 20 // Base application memory
    const historyMemory = this.frameHistory.length * 0.001
    const observerMemory = this.observers.length * 0.1
    
    return Math.round(baseMemory + historyMemory + observerMemory)
  }

  private detectPotentialLeaks(): number {
    if (this.memoryHistory.length < 10) return 0
    
    // Check for consistent memory growth over time
    const recentMemory = this.memoryHistory.slice(-10)
    const olderMemory = this.memoryHistory.slice(-20, -10)
    
    if (recentMemory.length === 0 || olderMemory.length === 0) return 0
    
    const recentAvg = recentMemory.reduce((a, b) => a + b, 0) / recentMemory.length
    const olderAvg = olderMemory.reduce((a, b) => a + b, 0) / olderMemory.length
    
    // If memory consistently increased by more than 10MB, flag as potential leak
    return (recentAvg - olderAvg > 10) ? 1 : 0
  }

  // ============================================================================
  // Performance Observer (Advanced Browser API)
  // ============================================================================

  private setupPerformanceObserver(): void {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry) => {
            this.processPerformanceEntry(entry)
          })
        })
        
        // Observe various performance metrics
        observer.observe({ 
          entryTypes: ['measure', 'navigation', 'resource', 'longtask'] 
        })
      } catch (e) {
        console.warn('PerformanceObserver not fully supported:', e)
      }
    }
  }

  private processPerformanceEntry(entry: PerformanceEntry): void {
    switch (entry.entryType) {
      case 'longtask':
        // Tasks longer than 50ms can cause jank
        if (entry.duration > 50) {
          console.warn(`Long task detected: ${entry.duration}ms`)
          this.notifyObservers({ 
            ...this.metrics, 
            renderTime: entry.duration 
          })
        }
        break
        
      case 'measure':
        if (entry.name.includes('background-render')) {
          this.metrics.renderTime = entry.duration
        }
        break
        
      case 'resource':
        // Monitor resource loading performance
        const resourceEntry = entry as PerformanceResourceTiming
        if (resourceEntry.duration > 1000) {
          console.warn(`Slow resource load: ${entry.name} took ${resourceEntry.duration}ms`)
        }
        break
    }
  }

  // ============================================================================
  // Threshold Monitoring & Alerts
  // ============================================================================

  private checkPerformanceThresholds(): void {
    const fps = this.metrics.fps
    
    if (fps <= this.FPS_CRITICAL) {
      this.emitPerformanceAlert('critical', `Critical FPS: ${fps}`)
    } else if (fps <= this.FPS_WARNING) {
      this.emitPerformanceAlert('warning', `Low FPS: ${fps}`)
    }
    
    // Check frame time variance (jank detection)
    if (this.frameHistory.length >= 10) {
      const recentFrames = this.frameHistory.slice(-10)
      const variance = this.calculateVariance(recentFrames)
      
      if (variance > 100) { // High variance indicates jank
        this.emitPerformanceAlert('warning', `Frame time jank detected: ${variance.toFixed(2)}ms variance`)
      }
    }
  }

  private checkMemoryThresholds(memoryInfo: MemoryStats): void {
    if (memoryInfo.used >= this.MEMORY_CRITICAL_MB) {
      this.emitPerformanceAlert('critical', `Critical memory usage: ${memoryInfo.used}MB`)
    } else if (memoryInfo.used >= this.MEMORY_WARNING_MB) {
      this.emitPerformanceAlert('warning', `High memory usage: ${memoryInfo.used}MB`)
    }
    
    if (memoryInfo.leaks > 0) {
      this.emitPerformanceAlert('warning', 'Potential memory leak detected')
    }
  }

  private emitPerformanceAlert(level: 'warning' | 'critical', message: string): void {
    const event = new CustomEvent('background-performance-alert', {
      detail: { level, message, metrics: this.metrics }
    })
    window.dispatchEvent(event)
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2))
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length
  }

  // ============================================================================
  // Public API
  // ============================================================================

  start(): void {
    this.isMonitoring = true
    console.log('Performance monitoring started')
  }

  stop(): void {
    this.isMonitoring = false
    console.log('Performance monitoring stopped')
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  getMemoryStats(): MemoryStats {
    return this.getMemoryInfo()
  }

  subscribe(observer: (metrics: PerformanceMetrics) => void): () => void {
    this.observers.push(observer)
    return () => {
      const index = this.observers.indexOf(observer)
      if (index > -1) {
        this.observers.splice(index, 1)
      }
    }
  }

  private notifyObservers(metrics: PerformanceMetrics): void {
    this.observers.forEach(observer => observer(metrics))
  }

  // Utility method to mark performance events
  mark(name: string): void {
    if ('performance' in window && 'mark' in performance) {
      performance.mark(name)
    }
  }

  measure(name: string, startMark: string, endMark: string): void {
    if ('performance' in window && 'measure' in performance) {
      try {
        performance.measure(name, startMark, endMark)
      } catch (e) {
        console.warn('Performance measure failed:', e)
      }
    }
  }
}

// ============================================================================
// Resource Manager with Performance Integration
// ============================================================================

export class ResourceManager {
  private performanceMonitor: PerformanceMonitor
  private allocatedBuffers: Map<string, ArrayBuffer> = new Map()
  private assetCache: Map<string, any> = new Map()
  private loadingPromises: Map<string, Promise<any>> = new Map()
  private maxCacheSize: number = 50 * 1024 * 1024 // 50MB cache limit
  private currentCacheSize: number = 0

  constructor(performanceMonitor: PerformanceMonitor) {
    this.performanceMonitor = performanceMonitor
    this.setupCleanupInterval()
  }

  // ============================================================================
  // Memory Management
  // ============================================================================

  async allocateMemory(sizeInMB: number, id?: string): Promise<ArrayBuffer> {
    const sizeInBytes = sizeInMB * 1024 * 1024
    const memoryStats = this.performanceMonitor.getMemoryStats()
    
    // Check if allocation would exceed safe limits
    if (memoryStats.used + sizeInMB > 150) {
      throw new Error(`Memory allocation would exceed safe limits: ${memoryStats.used + sizeInMB}MB`)
    }
    
    this.performanceMonitor.mark('memory-allocation-start')
    
    try {
      const buffer = new ArrayBuffer(sizeInBytes)
      const bufferId = id || `buffer-${Date.now()}-${Math.random()}`
      this.allocatedBuffers.set(bufferId, buffer)
      
      this.performanceMonitor.mark('memory-allocation-end')
      this.performanceMonitor.measure('memory-allocation', 'memory-allocation-start', 'memory-allocation-end')
      
      return buffer
    } catch (e) {
      throw new Error(`Failed to allocate ${sizeInMB}MB: ${e.message}`)
    }
  }

  releaseMemory(buffer: ArrayBuffer): void {
    for (const [id, allocatedBuffer] of this.allocatedBuffers.entries()) {
      if (allocatedBuffer === buffer) {
        this.allocatedBuffers.delete(id)
        break
      }
    }
    
    // Note: JavaScript GC will handle the actual memory cleanup
    // We're just removing our reference
  }

  // ============================================================================
  // Asset Loading with Performance Tracking
  // ============================================================================

  async loadAsset<T>(url: string, type: AssetType, options?: AssetLoadOptions): Promise<T> {
    // Check cache first
    const cacheKey = `${url}:${type}`
    if (this.assetCache.has(cacheKey)) {
      return this.assetCache.get(cacheKey)
    }
    
    // Check if already loading
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey)
    }
    
    // Start loading with performance tracking
    this.performanceMonitor.mark(`asset-load-start-${cacheKey}`)
    
    const loadPromise = this.performAssetLoad<T>(url, type, options)
      .finally(() => {
        this.performanceMonitor.mark(`asset-load-end-${cacheKey}`)
        this.performanceMonitor.measure(
          `asset-load-${type}`,
          `asset-load-start-${cacheKey}`,
          `asset-load-end-${cacheKey}`
        )
        this.loadingPromises.delete(cacheKey)
      })
    
    this.loadingPromises.set(cacheKey, loadPromise)
    return loadPromise
  }

  private async performAssetLoad<T>(url: string, type: AssetType, options?: AssetLoadOptions): Promise<T> {
    switch (type) {
      case AssetType.IMAGE:
        return this.loadImage(url) as Promise<T>
        
      case AssetType.JSON:
        return this.loadJSON(url) as Promise<T>
        
      case AssetType.SHADER:
        return this.loadShader(url) as Promise<T>
        
      case AssetType.AUDIO:
        return this.loadAudio(url) as Promise<T>
        
      default:
        throw new Error(`Unsupported asset type: ${type}`)
    }
  }

  private async loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`))
      img.src = url
    })
  }

  private async loadJSON(url: string): Promise<any> {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to load JSON: ${response.statusText}`)
    }
    return response.json()
  }

  private async loadShader(url: string): Promise<string> {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to load shader: ${response.statusText}`)
    }
    return response.text()
  }

  private async loadAudio(url: string): Promise<AudioBuffer> {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to load audio: ${response.statusText}`)
    }
    
    const arrayBuffer = await response.arrayBuffer()
    const audioContext = new AudioContext()
    return audioContext.decodeAudioData(arrayBuffer)
  }

  cacheAsset<T>(key: string, asset: T, sizeInBytes?: number): void {
    const size = sizeInBytes || this.estimateAssetSize(asset)
    
    // Check cache size limits
    if (this.currentCacheSize + size > this.maxCacheSize) {
      this.evictOldAssets(size)
    }
    
    this.assetCache.set(key, asset)
    this.currentCacheSize += size
  }

  private estimateAssetSize(asset: any): number {
    if (asset instanceof HTMLImageElement) {
      return asset.width * asset.height * 4 // RGBA bytes
    }
    
    if (asset instanceof ArrayBuffer) {
      return asset.byteLength
    }
    
    // Rough JSON size estimation
    if (typeof asset === 'object') {
      return JSON.stringify(asset).length * 2 // Unicode characters
    }
    
    return 1024 // Default 1KB estimation
  }

  private evictOldAssets(requiredSpace: number): void {
    // Simple LRU eviction - could be improved with proper LRU cache
    const entries = Array.from(this.assetCache.entries())
    entries.sort(() => Math.random() - 0.5) // Random eviction for simplicity
    
    let freedSpace = 0
    for (const [key] of entries) {
      if (freedSpace >= requiredSpace) break
      
      const asset = this.assetCache.get(key)
      const size = this.estimateAssetSize(asset)
      
      this.assetCache.delete(key)
      this.currentCacheSize -= size
      freedSpace += size
    }
  }

  releaseAsset(key: string): void {
    if (this.assetCache.has(key)) {
      const asset = this.assetCache.get(key)
      const size = this.estimateAssetSize(asset)
      
      this.assetCache.delete(key)
      this.currentCacheSize -= size
    }
  }

  private setupCleanupInterval(): void {
    // Clean up resources every minute
    setInterval(() => {
      this.performMaintenance()
    }, 60000)
  }

  private performMaintenance(): void {
    const memoryStats = this.performanceMonitor.getMemoryStats()
    
    // If memory usage is high, be more aggressive with cleanup
    if (memoryStats.used > 100) {
      const targetCacheSize = this.maxCacheSize * 0.5 // Reduce to 50%
      this.evictOldAssets(this.currentCacheSize - targetCacheSize)
    }
    
    // Clean up completed loading promises
    for (const [key, promise] of this.loadingPromises.entries()) {
      Promise.resolve(promise).then(() => {
        if (this.loadingPromises.get(key) === promise) {
          this.loadingPromises.delete(key)
        }
      }).catch(() => {
        this.loadingPromises.delete(key)
      })
    }
  }

  cleanup(): void {
    this.allocatedBuffers.clear()
    this.assetCache.clear()
    this.loadingPromises.clear()
    this.currentCacheSize = 0
  }
}

// ============================================================================
// Device Capability Detector
// ============================================================================

export class DeviceCapabilityDetector {
  private capabilities: DeviceCapabilities | null = null

  async detect(): Promise<DeviceCapabilities> {
    if (this.capabilities) {
      return this.capabilities
    }

    this.capabilities = {
      webgl: this.detectWebGL(),
      webgl2: this.detectWebGL2(),
      offscreenCanvas: this.detectOffscreenCanvas(),
      deviceMemory: this.detectDeviceMemory(),
      hardwareConcurrency: this.detectHardwareConcurrency(),
      isMobile: this.detectMobile(),
      isLowEnd: await this.detectLowEndDevice(),
      supportedFormats: {
        webp: this.detectWebP(),
        avif: this.detectAVIF(),
        webgl: this.getWebGLCapabilities()
      },
      networkSpeed: await this.detectNetworkSpeed(),
      batteryLevel: await this.detectBatteryLevel(),
      isCharging: await this.detectChargingStatus()
    }

    return this.capabilities
  }

  private detectWebGL(): boolean {
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      return !!gl
    } catch {
      return false
    }
  }

  private detectWebGL2(): boolean {
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl2')
      return !!gl
    } catch {
      return false
    }
  }

  private detectOffscreenCanvas(): boolean {
    return typeof OffscreenCanvas !== 'undefined'
  }

  private detectDeviceMemory(): number {
    return (navigator as any).deviceMemory || 4 // Default to 4GB
  }

  private detectHardwareConcurrency(): number {
    return navigator.hardwareConcurrency || 4 // Default to 4 cores
  }

  private detectMobile(): boolean {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  private async detectLowEndDevice(): Promise<boolean> {
    const memory = this.detectDeviceMemory()
    const cores = this.detectHardwareConcurrency()
    const isMobile = this.detectMobile()
    
    // Consider device low-end if:
    // - Less than 3GB RAM
    // - Less than 4 CPU cores
    // - Mobile device with less than 4GB RAM
    return memory < 3 || cores < 4 || (isMobile && memory < 4)
  }

  private detectWebP(): boolean {
    const canvas = document.createElement('canvas')
    return canvas.toDataURL('image/webp').indexOf('webp') !== -1
  }

  private detectAVIF(): boolean {
    const canvas = document.createElement('canvas')
    return canvas.toDataURL('image/avif').indexOf('avif') !== -1
  }

  private getWebGLCapabilities(): WebGLCapabilities {
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl')
      
      if (!gl) {
        return {
          maxTextureSize: 0,
          maxViewportDims: [0, 0],
          maxVertexAttribs: 0,
          maxVaryingVectors: 0,
          maxFragmentUniforms: 0,
          extensions: []
        }
      }

      return {
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
        maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
        maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS),
        maxFragmentUniforms: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
        extensions: gl.getSupportedExtensions() || []
      }
    } catch {
      return {
        maxTextureSize: 2048, // Safe fallback
        maxViewportDims: [2048, 2048],
        maxVertexAttribs: 8,
        maxVaryingVectors: 8,
        maxFragmentUniforms: 16,
        extensions: []
      }
    }
  }

  private async detectNetworkSpeed(): Promise<'slow' | 'medium' | 'fast'> {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      const effectiveType = connection.effectiveType
      
      switch (effectiveType) {
        case 'slow-2g':
        case '2g':
          return 'slow'
        case '3g':
          return 'medium'
        case '4g':
        default:
          return 'fast'
      }
    }
    
    return 'medium' // Default assumption
  }

  private async detectBatteryLevel(): Promise<number | undefined> {
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery()
        return battery.level
      } catch {
        return undefined
      }
    }
    return undefined
  }

  private async detectChargingStatus(): Promise<boolean | undefined> {
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery()
        return battery.charging
      } catch {
        return undefined
      }
    }
    return undefined
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

export enum AssetType {
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  JSON = 'json',
  TEXT = 'text',
  SHADER = 'shader',
  MODEL = 'model'
}

export interface AssetLoadOptions {
  timeout?: number
  retries?: number
  priority?: 'low' | 'medium' | 'high'
}

export interface WebGLCapabilities {
  maxTextureSize: number
  maxViewportDims: [number, number]
  maxVertexAttribs: number
  maxVaryingVectors: number
  maxFragmentUniforms: number
  extensions: string[]
}

// ============================================================================
// Usage Example
// ============================================================================

/*
// Example integration with background system:

const performanceMonitor = new PerformanceMonitor()
const resourceManager = new ResourceManager(performanceMonitor)
const deviceDetector = new DeviceCapabilityDetector()

// Start monitoring
performanceMonitor.start()

// Listen for performance alerts
window.addEventListener('background-performance-alert', (event) => {
  const { level, message, metrics } = event.detail
  console.warn(`Performance Alert [${level}]: ${message}`, metrics)
  
  if (level === 'critical') {
    // Take drastic action - switch to low quality mode
    switchToLowQualityMode()
  }
})

// In render loop:
performanceMonitor.startFrame()

// ... rendering code ...

performanceMonitor.endFrame()

// Get current performance metrics
const metrics = performanceMonitor.getMetrics()
console.log(`FPS: ${metrics.fps}, Memory: ${metrics.memoryUsage}MB`)

// Detect device capabilities
const capabilities = await deviceDetector.detect()
if (capabilities.isLowEnd) {
  // Use conservative settings for low-end devices
}
*/