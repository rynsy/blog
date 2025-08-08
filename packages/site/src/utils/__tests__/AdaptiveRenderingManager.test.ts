import { AdaptiveRenderingManager, Canvas2DStrategy } from '../AdaptiveRenderingManager'

// Mock HTMLCanvasElement
class MockCanvas {
  width = 800
  height = 600
  
  getContext(type: string) {
    if (type === '2d') {
      return {
        clearRect: jest.fn(),
        save: jest.fn(),
        restore: jest.fn(),
        translate: jest.fn(),
        scale: jest.fn(),
        beginPath: jest.fn(),
        arc: jest.fn(),
        fill: jest.fn(),
        stroke: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        fillText: jest.fn(),
        set fillStyle(value: string) {},
        set strokeStyle(value: string) {},
        set lineWidth(value: number) {},
        set globalAlpha(value: number) {},
        set font(value: string) {},
        set textAlign(value: string) {},
        set textBaseline(value: string) {}
      }
    }
    return null
  }
}

// Mock performance.now
const mockPerformanceNow = jest.fn(() => Date.now())
Object.defineProperty(global.performance, 'now', {
  writable: true,
  value: mockPerformanceNow
})

describe('AdaptiveRenderingManager', () => {
  let canvas: HTMLCanvasElement
  let deviceCapabilities: any
  let renderingManager: AdaptiveRenderingManager

  beforeEach(() => {
    canvas = new MockCanvas() as any
    deviceCapabilities = {
      webgl: true,
      webgl2: false,
      offscreenCanvas: false,
      deviceMemory: 8,
      hardwareConcurrency: 4,
      isMobile: false,
      isLowEnd: false,
      supportedFormats: {
        webp: true,
        avif: false,
        webgl: {
          maxTextureSize: 4096,
          maxViewportDims: [4096, 4096],
          maxVertexAttribs: 16,
          maxVaryingVectors: 8,
          maxFragmentUniforms: 16,
          extensions: []
        }
      },
      networkSpeed: 'fast' as const
    }
    
    renderingManager = new AdaptiveRenderingManager(canvas, deviceCapabilities)
  })

  afterEach(() => {
    renderingManager.cleanup()
  })

  describe('initialization', () => {
    it('should initialize with Canvas2D for small node counts', async () => {
      await renderingManager.initialize(20)
      
      expect(renderingManager.getCurrentStrategyName()).toBe('Canvas2D')
    })

    it('should initialize with WebGL for large node counts on capable devices', async () => {
      // Mock WebGL context creation failure to test fallback
      const originalGetContext = canvas.getContext
      canvas.getContext = jest.fn((type: string) => {
        if (type === 'webgl') return null // Simulate WebGL failure
        return originalGetContext.call(canvas, type)
      })
      
      await renderingManager.initialize(100)
      
      // Should fall back to Canvas2D when WebGL fails
      expect(renderingManager.getCurrentStrategyName()).toBe('Canvas2D')
    })

    it('should use Canvas2D for low-end devices regardless of node count', async () => {
      deviceCapabilities.isLowEnd = true
      const lowEndManager = new AdaptiveRenderingManager(canvas, deviceCapabilities)
      
      await lowEndManager.initialize(100)
      
      expect(lowEndManager.getCurrentStrategyName()).toBe('Canvas2D')
      
      lowEndManager.cleanup()
    })
  })

  describe('rendering', () => {
    beforeEach(async () => {
      await renderingManager.initialize(25)
    })

    it('should render graph data without errors', () => {
      const renderData = {
        type: 'graph' as const,
        timestamp: Date.now(),
        deltaTime: 16.67,
        theme: 'light' as const,
        dimensions: { width: 800, height: 600 },
        nodes: [
          { id: 'node1', x: 100, y: 100, radius: 15, color: '#6366f1', label: 'Test Node' }
        ],
        links: []
      }
      
      expect(() => renderingManager.render(renderData)).not.toThrow()
    })

    it('should update performance metrics after rendering', () => {
      const renderData = {
        type: 'graph' as const,
        timestamp: Date.now(),
        deltaTime: 16.67,
        theme: 'light' as const,
        dimensions: { width: 800, height: 600 },
        nodes: [],
        links: []
      }
      
      renderingManager.render(renderData)
      
      const metrics = renderingManager.getPerformanceMetrics()
      expect(metrics).toBeDefined()
      expect(metrics.renderTime).toBeGreaterThanOrEqual(0)
      expect(metrics.timestamp).toBeGreaterThan(0)
    })
  })

  describe('Canvas2DStrategy', () => {
    it('should initialize successfully', async () => {
      const strategy = new Canvas2DStrategy(canvas)
      
      await expect(strategy.initialize()).resolves.not.toThrow()
      expect(strategy.getName()).toBe('Canvas2D')
      
      strategy.cleanup()
    })

    it('should render without transform', () => {
      const strategy = new Canvas2DStrategy(canvas)
      const renderData = {
        type: 'graph' as const,
        timestamp: Date.now(),
        deltaTime: 16.67,
        theme: 'dark' as const,
        dimensions: { width: 800, height: 600 },
        nodes: [
          { id: 'test', x: 50, y: 50, radius: 10, color: '#ff0000', label: 'Test' }
        ],
        links: []
      }
      
      expect(() => strategy.render(renderData)).not.toThrow()
      strategy.cleanup()
    })

    it('should render with transform', () => {
      const strategy = new Canvas2DStrategy(canvas)
      const renderData = {
        type: 'graph' as const,
        timestamp: Date.now(),
        deltaTime: 16.67,
        theme: 'light' as const,
        dimensions: { width: 800, height: 600 },
        transform: { x: 10, y: 20, scale: 1.5 },
        nodes: [],
        links: []
      }
      
      expect(() => strategy.render(renderData)).not.toThrow()
      strategy.cleanup()
    })
  })
})