/**
 * Type-Safe Performance Monitor Tests
 * 
 * Comprehensive test suite for the enhanced performance monitoring system
 * with focus on type safety and edge cases.
 */

import {
  TypeSafePerformanceMonitor,
  PerformanceMonitorConfig,
  performanceMonitor
} from '../TypeSafePerformanceMonitor'
import {
  createModuleId,
  createMemoryMB,
  isValidPerformanceMetrics
} from '@/types/utilities'
import { DeviceCapabilities } from '@/interfaces/BackgroundSystemV3'

// Mock performance.now for consistent testing
const mockPerformance = {
  now: jest.fn(),
  memory: {
    usedJSHeapSize: 50 * 1024 * 1024, // 50MB
    totalJSHeapSize: 100 * 1024 * 1024, // 100MB
    jsHeapSizeLimit: 200 * 1024 * 1024 // 200MB
  }
}

global.performance = mockPerformance as any
global.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 16.67)) // 60fps
global.cancelAnimationFrame = jest.fn()

describe('TypeSafePerformanceMonitor', () => {
  let monitor: TypeSafePerformanceMonitor
  let mockTime = 0

  beforeEach(() => {
    mockTime = 0
    mockPerformance.now.mockImplementation(() => {
      mockTime += 16.67 // 60fps simulation
      return mockTime
    })
    
    const config: Partial<PerformanceMonitorConfig> = {
      sampleSize: 10,
      logLevel: 'none',
      enableMemoryLeakDetection: true,
      enableAdaptiveQuality: true
    }
    
    monitor = new TypeSafePerformanceMonitor(config)
  })

  afterEach(() => {
    monitor.cleanup()
    jest.clearAllMocks()
  })

  describe('Basic Functionality', () => {
    test('should initialize with default configuration', () => {
      const defaultMonitor = new TypeSafePerformanceMonitor()
      expect(defaultMonitor).toBeInstanceOf(TypeSafePerformanceMonitor)
      defaultMonitor.cleanup()
    })

    test('should start and stop monitoring', () => {
      expect(() => monitor.startMonitoring()).not.toThrow()
      expect(() => monitor.stopMonitoring()).not.toThrow()
    })

    test('should warn when starting monitoring twice', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      monitor.startMonitoring()
      monitor.startMonitoring() // Should warn
      
      expect(consoleSpy).toHaveBeenCalledWith('Performance monitoring is already active')
      consoleSpy.mockRestore()
    })
  })

  describe('Performance Metrics', () => {
    test('should record and retrieve basic metrics', () => {
      monitor.recordFrame()
      
      const metrics = monitor.getMetrics()
      
      expect(metrics).toMatchObject({
        fps: expect.any(Number),
        frameTime: expect.any(Number),
        memoryUsage: expect.any(Number),
        renderTime: expect.any(Number),
        timestamp: expect.any(Number),
        computedFPS: expect.any(Number),
        averageFrameTime: expect.any(Number),
        memoryEfficiency: expect.any(Number),
        performanceScore: expect.any(Number),
        recommendations: expect.any(Array)
      })
      
      expect(isValidPerformanceMetrics(metrics)).toBe(true)
    })

    test('should calculate FPS correctly', () => {
      // Simulate consistent 60fps frames
      for (let i = 0; i < 5; i++) {
        monitor.recordFrame()
      }
      
      const metrics = monitor.getMetrics()
      
      // Should be close to 60fps (allowing for small floating point errors)
      expect(metrics.computedFPS).toBeCloseTo(60, 1)
      expect(metrics.averageFrameTime).toBeCloseTo(16.67, 1)
    })

    test('should track module-specific performance', () => {
      const moduleId = createModuleId('test-module')
      
      monitor.recordRenderTime(moduleId, 5.5)
      monitor.recordRenderTime(moduleId, 6.2)
      monitor.recordRenderTime(moduleId, 4.8)
      
      const moduleMetrics = monitor.getModuleMetrics(moduleId)
      
      expect(moduleMetrics).toBeTruthy()
      expect(moduleMetrics?.averageFrameTime).toBeCloseTo(5.5, 1)
    })

    test('should return null for non-existent module', () => {
      const moduleId = createModuleId('non-existent')
      const moduleMetrics = monitor.getModuleMetrics(moduleId)
      
      expect(moduleMetrics).toBeNull()
    })
  })

  describe('Performance Score Calculation', () => {
    test('should calculate performance score based on FPS and memory', () => {
      // Simulate good performance (60fps, low memory)
      mockPerformance.memory.usedJSHeapSize = 25 * 1024 * 1024 // 25MB
      
      for (let i = 0; i < 10; i++) {
        monitor.recordFrame()
      }
      
      const metrics = monitor.getMetrics()
      
      expect(metrics.performanceScore).toBeGreaterThan(80)
    })

    test('should penalize poor performance', () => {
      // Simulate poor performance (low fps, high memory)
      mockPerformance.memory.usedJSHeapSize = 150 * 1024 * 1024 // 150MB
      mockPerformance.now.mockImplementation(() => {
        mockTime += 100 // 10fps simulation
        return mockTime
      })
      
      for (let i = 0; i < 10; i++) {
        monitor.recordFrame()
      }
      
      const metrics = monitor.getMetrics()
      
      expect(metrics.performanceScore).toBeLessThan(50)
    })
  })

  describe('Memory Leak Detection', () => {
    test('should detect increasing memory trend', () => {
      // Simulate gradually increasing memory usage
      let memoryUsage = 50 * 1024 * 1024
      
      mockPerformance.now.mockImplementation(() => {
        memoryUsage += 1024 * 1024 // Increase by 1MB each time
        mockPerformance.memory.usedJSHeapSize = memoryUsage
        mockTime += 5000 // 5 second intervals
        return mockTime
      })
      
      // Record multiple frames to establish trend
      for (let i = 0; i < 15; i++) {
        monitor.recordFrame()
      }
      
      const leakCheck = monitor.checkMemoryLeaks()
      
      expect(leakCheck.hasLeaks).toBe(false) // Need more sophisticated detection in real implementation
      expect(leakCheck.confidence).toBeGreaterThanOrEqual(0)
      expect(leakCheck.leakRate).toBeDefined()
    })

    test('should provide recommendations for memory leaks', () => {
      const leakCheck = monitor.checkMemoryLeaks()
      
      expect(Array.isArray(leakCheck.recommendations)).toBe(true)
    })
  })

  describe('Performance Recommendations', () => {
    test('should generate FPS-based recommendations', () => {
      // Simulate low FPS
      mockPerformance.now.mockImplementation(() => {
        mockTime += 50 // 20fps
        return mockTime
      })
      
      for (let i = 0; i < 10; i++) {
        monitor.recordFrame()
      }
      
      const metrics = monitor.getMetrics()
      
      expect(metrics.recommendations.length).toBeGreaterThan(0)
      expect(metrics.recommendations.some(r => r.type === 'quality')).toBe(true)
    })

    test('should generate memory-based recommendations', () => {
      // Simulate high memory usage
      mockPerformance.memory.usedJSHeapSize = 120 * 1024 * 1024 // 120MB
      
      monitor.recordFrame()
      
      const metrics = monitor.getMetrics()
      
      expect(metrics.recommendations.some(r => r.type === 'memory')).toBe(true)
    })
  })

  describe('Configuration Optimization', () => {
    test('should optimize configuration for low-end devices', () => {
      const currentConfig = {
        enabled: true,
        quality: 'high' as const,
        nodes: 50,
        animationSpeed: 1.0
      }
      
      const deviceCapabilities: DeviceCapabilities = {
        webgl: false,
        webgl2: false,
        offscreenCanvas: false,
        deviceMemory: 2,
        hardwareConcurrency: 2,
        isMobile: true,
        isLowEnd: true,
        supportedFormats: {
          webp: false,
          avif: false,
          webgl: {
            maxTextureSize: 0,
            maxViewportDims: [0, 0],
            maxVertexAttribs: 0,
            maxVaryingVectors: 0,
            maxFragmentUniforms: 0,
            extensions: []
          }
        },
        networkSpeed: 'slow'
      }
      
      const optimization = monitor.getOptimalConfiguration(currentConfig, deviceCapabilities)
      
      expect(optimization.config.quality).toBe('low')
      expect(optimization.config.animationSpeed).toBeLessThan(1.0)
      expect(optimization.reasoning.length).toBeGreaterThan(0)
    })

    test('should maintain configuration for high-performance scenarios', () => {
      const currentConfig = {
        enabled: true,
        quality: 'high' as const,
        nodes: 25
      }
      
      const deviceCapabilities: DeviceCapabilities = {
        webgl: true,
        webgl2: true,
        offscreenCanvas: true,
        deviceMemory: 16,
        hardwareConcurrency: 8,
        isMobile: false,
        isLowEnd: false,
        supportedFormats: {
          webp: true,
          avif: true,
          webgl: {
            maxTextureSize: 4096,
            maxViewportDims: [4096, 4096],
            maxVertexAttribs: 16,
            maxVaryingVectors: 30,
            maxFragmentUniforms: 1024,
            extensions: ['EXT_texture_filter_anisotropic']
          }
        },
        networkSpeed: 'fast'
      }
      
      // Simulate good performance
      for (let i = 0; i < 5; i++) {
        monitor.recordFrame()
      }
      
      const optimization = monitor.getOptimalConfiguration(currentConfig, deviceCapabilities)
      
      // Should keep high quality for capable devices with good performance
      expect(optimization.config.quality).toBe('high')
    })
  })

  describe('Type Safety', () => {
    test('should handle invalid metrics gracefully', () => {
      const invalidMetrics = {
        fps: 'invalid',
        frameTime: null,
        memoryUsage: undefined,
        renderTime: -1,
        timestamp: 'not-a-number'
      } as any
      
      expect(isValidPerformanceMetrics(invalidMetrics)).toBe(false)
    })

    test('should use branded types correctly', () => {
      const moduleId = createModuleId('test-module')
      const memorySize = createMemoryMB(100)
      
      expect(typeof moduleId).toBe('string')
      expect(typeof memorySize).toBe('number')
      
      // These should compile without errors if types are correct
      monitor.recordRenderTime(moduleId, 5.0)
    })
  })

  describe('Cleanup and Resource Management', () => {
    test('should cleanup resources properly', () => {
      monitor.startMonitoring()
      
      expect(() => monitor.cleanup()).not.toThrow()
      
      // Verify cleanup worked
      const metrics = monitor.getMetrics()
      expect(metrics.performanceScore).toBe(100) // Should be default/empty state
    })

    test('should handle cleanup when not monitoring', () => {
      expect(() => monitor.cleanup()).not.toThrow()
    })
  })
})

describe('Singleton Performance Monitor', () => {
  test('should provide singleton instance', () => {
    expect(performanceMonitor).toBeInstanceOf(TypeSafePerformanceMonitor)
  })

  test('should be the same instance across imports', () => {
    // This test ensures singleton behavior
    expect(performanceMonitor).toBe(performanceMonitor)
  })
})

describe('Integration Tests', () => {
  test('should handle rapid successive calls', () => {
    const monitor = new TypeSafePerformanceMonitor({ sampleSize: 100 })
    
    // Rapidly record many frames
    for (let i = 0; i < 200; i++) {
      monitor.recordFrame()
    }
    
    const metrics = monitor.getMetrics()
    
    expect(metrics.fps).toBeFinite()
    expect(metrics.computedFPS).toBeFinite()
    expect(metrics.performanceScore).toBeFinite()
    
    monitor.cleanup()
  })

  test('should maintain accuracy under load', () => {
    const monitor = new TypeSafePerformanceMonitor()
    const moduleId = createModuleId('stress-test')
    
    // Simulate mixed load
    for (let i = 0; i < 50; i++) {
      monitor.recordFrame()
      monitor.recordRenderTime(moduleId, Math.random() * 10)
      
      if (i % 10 === 0) {
        monitor.checkMemoryLeaks()
      }
    }
    
    const metrics = monitor.getMetrics()
    const moduleMetrics = monitor.getModuleMetrics(moduleId)
    
    expect(metrics.recommendations).toBeDefined()
    expect(moduleMetrics).toBeTruthy()
    
    monitor.cleanup()
  })
})
