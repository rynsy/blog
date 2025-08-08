import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { UrlParameterManager } from '../../../site/src/utils/UrlParameterManager'
import { PerformanceMonitor } from '../../../site/src/utils/PerformanceMonitor'
import { DeviceCapabilityManager } from '../../../site/src/utils/DeviceCapabilityManager'
import { ResourceManager } from '../../../site/src/utils/ResourceManager'
import { ModuleRegistryV3 } from '../../../site/src/utils/ModuleRegistryV3'
import { CanvasLayerManager } from '../../../site/src/utils/CanvasLayerManager'
import { 
  ModuleRegistryEntryV3, 
  ModuleCategory, 
  ModuleCapability, 
  AssetType 
} from '../../../interfaces/BackgroundSystemV3'

// Mock DOM APIs
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    memory: {
      usedJSHeapSize: 10 * 1024 * 1024, // 10MB
      totalJSHeapSize: 50 * 1024 * 1024, // 50MB
      jsHeapSizeLimit: 100 * 1024 * 1024 // 100MB
    }
  }
})

Object.defineProperty(navigator, 'deviceMemory', {
  value: 8,
  configurable: true
})

Object.defineProperty(navigator, 'hardwareConcurrency', {
  value: 8,
  configurable: true
})

// Mock canvas context
HTMLCanvasElement.prototype.getContext = vi.fn((contextType) => {
  if (contextType === '2d') {
    return {
      clearRect: vi.fn(),
      scale: vi.fn(),
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn()
    } as any
  }
  if (contextType === 'webgl' || contextType === 'webgl2') {
    return {
      clear: vi.fn(),
      getParameter: vi.fn((param) => {
        switch (param) {
          case 37445: return 4096 // MAX_TEXTURE_SIZE
          case 33901: return [4096, 4096] // MAX_VIEWPORT_DIMS
          case 34921: return 16 // MAX_VERTEX_ATTRIBS
          case 35659: return 8 // MAX_VARYING_VECTORS
          case 35657: return 16 // MAX_FRAGMENT_UNIFORM_VECTORS
          default: return 0
        }
      }),
      getSupportedExtensions: vi.fn(() => ['OES_texture_float', 'WEBGL_depth_texture'])
    } as any
  }
  return null
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

describe('UrlParameterManager', () => {
  let urlManager: UrlParameterManager

  beforeEach(() => {
    urlManager = new UrlParameterManager()
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:3000',
        origin: 'http://localhost:3000',
        pathname: '/',
        search: ''
      },
      configurable: true
    })
  })

  it('should parse URL parameters correctly', () => {
    window.location.search = '?bg=knowledge&nodes=50&quality=high'
    const params = urlManager.parseFromUrl()
    
    expect(params.bg).toBe('knowledge')
    expect(params.nodes).toBe(50)
    expect(params.quality).toBe('high')
  })

  it('should validate URL parameters', () => {
    const result = urlManager.validateParams({
      nodes: 150,
      connections: 'medium',
      quality: 'high'
    })
    
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should reject invalid parameters', () => {
    const result = urlManager.validateParams({
      nodes: 300, // Too high
      connections: 'invalid',
      fps: 5 // Too low
    })
    
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('should generate shareable URLs', () => {
    const config = {
      currentModule: 'knowledge',
      settings: { nodes: 25 }
    }
    
    const url = urlManager.generateShareableUrl(config)
    expect(url).toContain('config=')
    expect(url).toMatch(/^http:\/\/localhost:3000\/\?config=.+/)
  })
})

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor

  beforeEach(() => {
    monitor = new PerformanceMonitor()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    monitor.cleanup()
  })

  it('should track frame performance', () => {
    monitor.startMonitoring()
    
    // Simulate frame rendering
    monitor.startFrame()
    vi.advanceTimersByTime(16) // 16ms frame time
    monitor.endFrame()
    
    monitor.startFrame()
    vi.advanceTimersByTime(16)
    monitor.endFrame()
    
    // Advance time to trigger FPS update
    vi.advanceTimersByTime(1000)
    
    const metrics = monitor.getMetrics()
    expect(metrics.frameTime).toBeCloseTo(16, 1)
    expect(metrics.fps).toBeGreaterThan(0)
  })

  it('should detect performance issues', () => {
    monitor.startMonitoring()
    
    // Simulate slow frames
    for (let i = 0; i < 10; i++) {
      monitor.startFrame()
      vi.advanceTimersByTime(50) // 50ms frame time (20 FPS)
      monitor.endFrame()
    }
    
    expect(monitor.shouldOptimize()).toBe(true)
  })

  it('should provide optimization suggestions', () => {
    monitor.startMonitoring()
    
    // Simulate poor performance
    monitor.startFrame()
    vi.advanceTimersByTime(100) // Very slow frame
    monitor.endFrame()
    
    const suggestions = monitor.getOptimizationSuggestions()
    expect(suggestions).toContain('Consider reducing particle count or visual effects')
  })

  it('should calculate performance grade', () => {
    monitor.startMonitoring()
    
    // Simulate good performance
    for (let i = 0; i < 60; i++) {
      monitor.startFrame()
      vi.advanceTimersByTime(16.67) // 60 FPS
      monitor.endFrame()
    }
    
    vi.advanceTimersByTime(1000)
    
    const grade = monitor.getPerformanceGrade()
    expect(['A', 'B'].includes(grade)).toBe(true)
  })
})

describe('DeviceCapabilityManager', () => {
  let capabilityManager: DeviceCapabilityManager

  beforeEach(() => {
    capabilityManager = new DeviceCapabilityManager()
  })

  it('should detect device capabilities', () => {
    const capabilities = capabilityManager.getCapabilities()
    
    expect(typeof capabilities.webgl).toBe('boolean')
    expect(typeof capabilities.webgl2).toBe('boolean')
    expect(typeof capabilities.deviceMemory).toBe('number')
    expect(typeof capabilities.hardwareConcurrency).toBe('number')
    expect(typeof capabilities.isMobile).toBe('boolean')
    expect(typeof capabilities.isLowEnd).toBe('boolean')
  })

  it('should provide optimal configuration for device', () => {
    const defaultConfig = {
      enabled: true,
      quality: 'high' as const,
      animationSpeed: 1.0,
      physics: {
        enabled: true,
        gravity: 0.1,
        damping: 0.9,
        collisionDetection: true,
        forces: { attraction: 0.1, repulsion: 100, centering: 0.05 }
      },
      interactions: {
        enableDrag: true,
        enableClick: true,
        enableHover: true,
        enableKeyboard: true,
        clickToCreate: true,
        doubleClickAction: 'delete' as const,
        keyboardShortcuts: {}
      }
    }
    
    const optimized = capabilityManager.getOptimalConfiguration(defaultConfig)
    expect(optimized).toBeDefined()
    expect(optimized.quality).toBeDefined()
  })

  it('should recommend appropriate quality level', () => {
    const quality = capabilityManager.getRecommendedQuality()
    expect(['low', 'medium', 'high'].includes(quality)).toBe(true)
  })

  it('should support feature detection', () => {
    expect(typeof capabilityManager.supportsFeature('webgl')).toBe('boolean')
    expect(typeof capabilityManager.supportsFeature('touch')).toBe('boolean')
    expect(typeof capabilityManager.supportsFeature('deviceMemory')).toBe('boolean')
  })

  it('should recommend appropriate node count', () => {
    const maxNodes = capabilityManager.getMaxRecommendedNodes()
    expect(maxNodes).toBeGreaterThan(0)
    expect(maxNodes).toBeLessThanOrEqual(200)
  })
})

describe('ResourceManager', () => {
  let resourceManager: ResourceManager

  beforeEach(() => {
    resourceManager = new ResourceManager()
  })

  afterEach(() => {
    resourceManager.cleanup()
  })

  it('should allocate and release memory', async () => {
    const buffer = await resourceManager.allocateMemory(10) // 10MB
    expect(buffer).toBeInstanceOf(ArrayBuffer)
    expect(buffer.byteLength).toBe(10 * 1024 * 1024)
    
    resourceManager.releaseMemory(buffer)
    
    const memoryStats = resourceManager.getMemoryUsage()
    expect(memoryStats.allocated).toBe(0)
  })

  it('should track memory usage', async () => {
    const buffer1 = await resourceManager.allocateMemory(5)
    const buffer2 = await resourceManager.allocateMemory(3)
    
    const stats = resourceManager.getMemoryUsage()
    expect(stats.allocated).toBe(8) // 5 + 3 MB
    
    resourceManager.releaseMemory(buffer1)
    resourceManager.releaseMemory(buffer2)
  })

  it('should enforce memory limits', async () => {
    await expect(resourceManager.allocateMemory(300)).rejects.toThrow()
  })

  it('should cache assets', async () => {
    const testAsset = 'test data'
    resourceManager.cacheAsset('test-key', testAsset)
    
    // Should be able to retrieve cached asset (indirectly tested through cache size)
    const summary = resourceManager.getResourceSummary()
    expect(summary.cachedAssets).toBe(1)
  })

  it('should provide resource summary', () => {
    const summary = resourceManager.getResourceSummary()
    expect(typeof summary.allocatedBuffers).toBe('number')
    expect(typeof summary.allocatedMemoryMB).toBe('number')
    expect(typeof summary.cachedAssets).toBe('number')
    expect(typeof summary.cacheSizeMB).toBe('number')
    expect(typeof summary.activeProfiles).toBe('number')
  })
})

describe('ModuleRegistryV3', () => {
  let registry: ModuleRegistryV3
  let mockModule: ModuleRegistryEntryV3

  beforeEach(() => {
    registry = new ModuleRegistryV3()
    mockModule = {
      id: 'test-module',
      version: '1.0.0',
      name: 'Test Module',
      description: 'A test module for unit testing',
      category: ModuleCategory.VISUAL,
      capabilities: [ModuleCapability.CANVAS_2D],
      tags: ['test', 'mock'],
      memoryBudget: 20,
      cpuIntensity: 'medium',
      requiresWebGL: false,
      preferredCanvas: 'canvas2d',
      dependencies: [],
      conflicts: [],
      load: vi.fn().mockResolvedValue({
        setup: vi.fn().mockReturnValue({
          initialize: vi.fn(),
          pause: vi.fn(),
          resume: vi.fn(),
          destroy: vi.fn()
        })
      }),
      configSchema: {
        type: 'object',
        properties: {
          enabled: { type: 'boolean', default: true }
        }
      },
      defaultConfig: { enabled: true, quality: 'medium' }
    }
  })

  it('should register modules successfully', async () => {
    await registry.registerModule(mockModule)
    
    const retrievedModule = registry.getModule('test-module')
    expect(retrievedModule).toBeDefined()
    expect(retrievedModule?.name).toBe('Test Module')
  })

  it('should validate module entries', async () => {
    const invalidModule = { ...mockModule, id: '', load: null }
    
    await expect(registry.registerModule(invalidModule as any)).rejects.toThrow()
  })

  it('should discover modules by criteria', async () => {
    await registry.registerModule(mockModule)
    
    const discovered = registry.discoverModules({
      category: ModuleCategory.VISUAL,
      maxMemoryMB: 50
    })
    
    expect(discovered).toHaveLength(1)
    expect(discovered[0].id).toBe('test-module')
  })

  it('should check module compatibility', async () => {
    const conflictingModule = {
      ...mockModule,
      id: 'conflicting-module',
      conflicts: ['test-module']
    }
    
    await registry.registerModule(mockModule)
    await registry.registerModule(conflictingModule)
    
    const compatibility = registry.areModulesCompatible(['test-module', 'conflicting-module'])
    expect(compatibility.compatible).toBe(false)
    expect(compatibility.conflicts.length).toBeGreaterThan(0)
  })

  it('should provide module statistics', async () => {
    await registry.registerModule(mockModule)
    
    const stats = registry.getStatistics()
    expect(stats.totalModules).toBe(1)
    expect(stats.categories[ModuleCategory.VISUAL]).toBe(1)
    expect(stats.averageMemoryBudget).toBe(20)
  })

  it('should get recommended modules for device', async () => {
    await registry.registerModule(mockModule)
    
    const deviceCapabilities = {
      webgl: false,
      webgl2: false,
      deviceMemory: 4,
      hardwareConcurrency: 4,
      isMobile: true,
      isLowEnd: false
    }
    
    const recommended = registry.getRecommendedModules(deviceCapabilities as any, 5)
    expect(recommended).toHaveLength(1)
  })
})

describe('CanvasLayerManager', () => {
  let layerManager: CanvasLayerManager

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = ''
    layerManager = new CanvasLayerManager()
  })

  afterEach(() => {
    layerManager.cleanup()
  })

  it('should create dedicated layers', () => {
    const requirements = {
      dedicated: true,
      interactive: true,
      zIndex: 10,
      alpha: true,
      preserveDrawingBuffer: false,
      contextType: 'canvas2d' as const
    }
    
    const canvas = layerManager.createDedicatedLayer('test-module', requirements)
    expect(canvas).toBeInstanceOf(HTMLCanvasElement)
    
    const layer = layerManager.getLayer('test-module-layer')
    expect(layer).toBeDefined()
    expect(layer?.interactive).toBe(true)
  })

  it('should manage layer visibility', () => {
    const requirements = {
      dedicated: true,
      interactive: false,
      zIndex: 5,
      alpha: true,
      preserveDrawingBuffer: false,
      contextType: 'canvas2d' as const
    }
    
    layerManager.createDedicatedLayer('test-module', requirements)
    
    layerManager.setLayerVisibility('test-module-layer', false)
    const layer = layerManager.getLayer('test-module-layer')
    expect(layer?.visible).toBe(false)
  })

  it('should provide layer statistics', () => {
    const requirements = {
      dedicated: true,
      interactive: true,
      zIndex: 10,
      alpha: true,
      preserveDrawingBuffer: false,
      contextType: 'canvas2d' as const
    }
    
    layerManager.createDedicatedLayer('test-module-1', requirements)
    layerManager.createDedicatedLayer('test-module-2', requirements)
    
    const stats = layerManager.getStatistics()
    expect(stats.totalLayers).toBeGreaterThan(0)
    expect(stats.dedicatedLayers).toBe(2)
  })

  it('should release layers properly', () => {
    const requirements = {
      dedicated: true,
      interactive: false,
      zIndex: 5,
      alpha: true,
      preserveDrawingBuffer: false,
      contextType: 'canvas2d' as const
    }
    
    layerManager.createDedicatedLayer('test-module', requirements)
    expect(layerManager.getLayer('test-module-layer')).toBeDefined()
    
    layerManager.releaseLayer('test-module-layer')
    expect(layerManager.getLayer('test-module-layer')).toBeUndefined()
  })
})
