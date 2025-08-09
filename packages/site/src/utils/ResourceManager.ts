import { ResourceManager as IResourceManager, MemoryStats, PerformanceMetrics, AssetType } from '../interfaces/BackgroundSystemV3'

/**
 * Manages resource allocation, memory usage, and asset caching for background modules
 */
export class ResourceManager implements IResourceManager {
  private allocatedBuffers = new Map<ArrayBuffer, { size: number; timestamp: number }>()
  private assetCache = new Map<string, { asset: any; timestamp: number; size: number }>()
  private performanceProfiles = new Map<string, { startTime: number; metrics: PerformanceMetrics[] }>()
  private readonly MAX_CACHE_SIZE = 100 * 1024 * 1024 // 100MB cache limit
  private readonly MAX_CACHE_AGE = 30 * 60 * 1000 // 30 minutes
  private readonly MAX_MEMORY_ALLOCATION = 200 * 1024 * 1024 // 200MB memory limit
  private cleanupInterval: number | null = null

  constructor() {
    this.startCleanupTimer()
  }

  /**
   * Allocate memory buffer for module use
   */
  async allocateMemory(sizeInMB: number): Promise<ArrayBuffer> {
    const sizeInBytes = sizeInMB * 1024 * 1024
    
    // Check if allocation would exceed limit
    const currentAllocation = this.getCurrentAllocation()
    if (currentAllocation + sizeInBytes > this.MAX_MEMORY_ALLOCATION) {
      throw new Error(`Memory allocation would exceed limit. Requested: ${sizeInMB}MB, Available: ${(this.MAX_MEMORY_ALLOCATION - currentAllocation) / 1024 / 1024}MB`)
    }

    try {
      const buffer = new ArrayBuffer(sizeInBytes)
      this.allocatedBuffers.set(buffer, {
        size: sizeInBytes,
        timestamp: Date.now()
      })
      return buffer
    } catch (error) {
      throw new Error(`Failed to allocate ${sizeInMB}MB of memory: ${error}`)
    }
  }

  /**
   * Release allocated memory buffer
   */
  releaseMemory(buffer: ArrayBuffer): void {
    this.allocatedBuffers.delete(buffer)
  }

  /**
   * Get current memory usage statistics
   */
  getMemoryUsage(): MemoryStats {
    const currentAllocation = this.getCurrentAllocation()
    const cacheSize = this.getCacheSize()
    const totalUsed = currentAllocation + cacheSize
    
    // Get browser memory info if available
    const browserMemory = this.getBrowserMemoryInfo()
    
    return {
      used: Math.round(totalUsed / 1024 / 1024), // MB
      allocated: Math.round(currentAllocation / 1024 / 1024), // MB
      peak: Math.round((browserMemory?.peak || totalUsed) / 1024 / 1024), // MB
      leaks: this.detectMemoryLeaks()
    }
  }

  /**
   * Load and cache an asset
   */
  async loadAsset<T>(url: string, type: AssetType): Promise<T> {
    // Check cache first
    const cached = this.assetCache.get(url)
    if (cached && Date.now() - cached.timestamp < this.MAX_CACHE_AGE) {
      return cached.asset as T
    }

    try {
      let asset: T
      let size = 0

      switch (type) {
        case AssetType.IMAGE:
          asset = await this.loadImage(url) as T
          size = this.estimateImageSize(asset as any)
          break
        case AssetType.JSON:
          asset = await this.loadJSON(url) as T
          size = JSON.stringify(asset).length * 2 // Rough estimate
          break
        case AssetType.TEXT:
          asset = await this.loadText(url) as T
          size = (asset as any).length * 2 // Rough estimate
          break
        case AssetType.SHADER:
          asset = await this.loadText(url) as T // Shaders are text files
          size = (asset as any).length * 2
          break
        case AssetType.AUDIO:
          asset = await this.loadAudio(url) as T
          size = this.estimateAudioSize(asset as any)
          break
        case AssetType.VIDEO:
          throw new Error('Video loading not implemented yet')
        case AssetType.MODEL:
          throw new Error('Model loading not implemented yet')
        default:
          throw new Error(`Unsupported asset type: ${type}`)
      }

      // Check if caching this asset would exceed cache size limit
      const currentCacheSize = this.getCacheSize()
      if (currentCacheSize + size > this.MAX_CACHE_SIZE) {
        this.evictOldestAssets(size)
      }

      // Cache the asset
      this.assetCache.set(url, {
        asset,
        timestamp: Date.now(),
        size
      })

      return asset
    } catch (error) {
      throw new Error(`Failed to load asset ${url}: ${error}`)
    }
  }

  /**
   * Cache an asset directly
   */
  cacheAsset<T>(key: string, asset: T): void {
    const size = this.estimateAssetSize(asset)
    
    // Check cache size limit
    const currentCacheSize = this.getCacheSize()
    if (currentCacheSize + size > this.MAX_CACHE_SIZE) {
      this.evictOldestAssets(size)
    }

    this.assetCache.set(key, {
      asset,
      timestamp: Date.now(),
      size
    })
  }

  /**
   * Release a cached asset
   */
  releaseAsset(key: string): void {
    this.assetCache.delete(key)
  }

  /**
   * Start performance profiling for a module
   */
  startProfiling(moduleId: string): void {
    this.performanceProfiles.set(moduleId, {
      startTime: performance.now(),
      metrics: []
    })
  }

  /**
   * End performance profiling and return metrics
   */
  endProfiling(moduleId: string): PerformanceMetrics {
    const profile = this.performanceProfiles.get(moduleId)
    if (!profile) {
      throw new Error(`No active profiling session for module ${moduleId}`)
    }

    const endTime = performance.now()
    const totalTime = endTime - profile.startTime

    const metrics: PerformanceMetrics = {
      fps: profile.metrics.length > 0 ? profile.metrics[profile.metrics.length - 1].fps : 0,
      frameTime: totalTime / Math.max(profile.metrics.length, 1),
      memoryUsage: this.getMemoryUsage().used,
      renderTime: totalTime,
      timestamp: Date.now()
    }

    this.performanceProfiles.delete(moduleId)
    return metrics
  }

  /**
   * Clean up all resources
   */
  cleanup(): void {
    // Clear all allocated buffers
    this.allocatedBuffers.clear()
    
    // Clear asset cache
    this.assetCache.clear()
    
    // Clear performance profiles
    this.performanceProfiles.clear()
    
    // Stop cleanup timer
    if (this.cleanupInterval !== null) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }

  /**
   * Get resource usage summary
   */
  getResourceSummary() {
    return {
      allocatedBuffers: this.allocatedBuffers.size,
      allocatedMemoryMB: Math.round(this.getCurrentAllocation() / 1024 / 1024),
      cachedAssets: this.assetCache.size,
      cacheSizeMB: Math.round(this.getCacheSize() / 1024 / 1024),
      activeProfiles: this.performanceProfiles.size,
      memoryStats: this.getMemoryUsage()
    }
  }

  private getCurrentAllocation(): number {
    let total = 0
    for (const { size } of this.allocatedBuffers.values()) {
      total += size
    }
    return total
  }

  private getCacheSize(): number {
    let total = 0
    for (const { size } of this.assetCache.values()) {
      total += size
    }
    return total
  }

  private getBrowserMemoryInfo() {
    const memory = (performance as any).memory
    if (memory) {
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        peak: memory.usedJSHeapSize // Simplified
      }
    }
    return null
  }

  private detectMemoryLeaks(): number {
    // Simple leak detection - count buffers older than 5 minutes
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000)
    let leakCount = 0
    
    for (const { timestamp } of this.allocatedBuffers.values()) {
      if (timestamp < fiveMinutesAgo) {
        leakCount++
      }
    }
    
    return leakCount
  }

  private evictOldestAssets(sizeNeeded: number): void {
    const entries = Array.from(this.assetCache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp)

    let freedSize = 0
    for (const [key] of entries) {
      const entry = this.assetCache.get(key)!
      this.assetCache.delete(key)
      freedSize += entry.size
      
      if (freedSize >= sizeNeeded) {
        break
      }
    }
  }

  private startCleanupTimer(): void {
    this.cleanupInterval = window.setInterval(() => {
      this.cleanupExpiredAssets()
      this.cleanupOldBuffers()
    }, 60000) // Run cleanup every minute
  }

  private cleanupExpiredAssets(): void {
    const now = Date.now()
    const expiredKeys = []
    
    for (const [key, { timestamp }] of this.assetCache.entries()) {
      if (now - timestamp > this.MAX_CACHE_AGE) {
        expiredKeys.push(key)
      }
    }
    
    for (const key of expiredKeys) {
      this.assetCache.delete(key)
    }
  }

  private cleanupOldBuffers(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000)
    const expiredBuffers = []
    
    for (const [buffer, { timestamp }] of this.allocatedBuffers.entries()) {
      if (timestamp < oneHourAgo) {
        expiredBuffers.push(buffer)
      }
    }
    
    // Log potential memory leaks
    if (expiredBuffers.length > 0) {
      console.warn(`Cleaning up ${expiredBuffers.length} potentially leaked memory buffers`)
    }
    
    for (const buffer of expiredBuffers) {
      this.allocatedBuffers.delete(buffer)
    }
  }

  private async loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = (error) => reject(error)
      img.src = url
    })
  }

  private async loadJSON(url: string): Promise<any> {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    return response.json()
  }

  private async loadText(url: string): Promise<string> {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    return response.text()
  }

  private async loadAudio(url: string): Promise<HTMLAudioElement> {
    return new Promise((resolve, reject) => {
      const audio = new Audio()
      audio.addEventListener('canplaythrough', () => resolve(audio), { once: true })
      audio.addEventListener('error', (error) => reject(error), { once: true })
      audio.src = url
    })
  }

  private estimateImageSize(img: HTMLImageElement): number {
    // Rough estimate: width * height * 4 bytes per pixel (RGBA)
    return img.width * img.height * 4
  }

  private estimateAudioSize(audio: HTMLAudioElement): number {
    // Very rough estimate - actual size depends on compression, duration, etc.
    return audio.duration ? audio.duration * 44100 * 2 * 2 : 1024 * 1024 // 1MB default
  }

  private estimateAssetSize(asset: any): number {
    if (typeof asset === 'string') {
      return asset.length * 2 // UTF-16 characters
    }
    
    if (asset instanceof HTMLImageElement) {
      return this.estimateImageSize(asset)
    }
    
    if (asset instanceof HTMLAudioElement) {
      return this.estimateAudioSize(asset)
    }
    
    // Default estimate for objects
    try {
      return JSON.stringify(asset).length * 2
    } catch {
      return 1024 // 1KB default
    }
  }
}
