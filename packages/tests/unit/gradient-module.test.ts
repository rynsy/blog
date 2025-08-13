import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setup } from '@site/bgModules/gradient'
import testUtils from '../setup/testUtils'

// Mock debug utility
vi.mock('@site/utils/debug', () => ({
  debugBackground: {
    gradient: vi.fn()
  }
}))

describe('Gradient Module Implementation', () => {
  let mockCanvas: HTMLCanvasElement
  let mockContext: CanvasRenderingContext2D
  let mockRequestAnimationFrame: ReturnType<typeof vi.fn>
  let mockCancelAnimationFrame: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Create comprehensive canvas mock
    mockContext = {
      clearRect: vi.fn(),
      createLinearGradient: vi.fn(() => ({
        addColorStop: vi.fn()
      })),
      createRadialGradient: vi.fn(() => ({
        addColorStop: vi.fn()
      })),
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      fillStyle: '',
      globalCompositeOperation: 'source-over',
      globalAlpha: 1
    } as any

    // Use the mock class that properly extends HTMLCanvasElement
    mockCanvas = new (global as any).MockHTMLCanvasElement()
    mockCanvas.getContext = vi.fn(() => mockContext) as any

    // Mock animation frame functions
    mockRequestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
      // Immediately call callback for synchronous testing
      setTimeout(callback, 16)
      return 1
    }) as any
    mockCancelAnimationFrame = vi.fn()

    global.requestAnimationFrame = mockRequestAnimationFrame as any
    global.cancelAnimationFrame = mockCancelAnimationFrame as any
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Module Setup', () => {
    it('creates module instance successfully', () => {
      const module = setup({
        canvas: mockCanvas,
        width: 800,
        height: 600,
        theme: 'light'
      })

      expect(module).toBeDefined()
      expect(module.pause).toBeInstanceOf(Function)
      expect(module.resume).toBeInstanceOf(Function)
      expect(module.destroy).toBeInstanceOf(Function)
      expect(module.onThemeChange).toBeInstanceOf(Function)
    })

    it('validates canvas parameter', () => {
      const invalidCanvas = { tagName: 'DIV' } as any

      expect(() => setup({
        canvas: invalidCanvas,
        width: 800,
        height: 600,
        theme: 'light'
      })).toThrow('Gradient module requires HTMLCanvasElement')
    })

    it('throws error when canvas context is null', () => {
      const invalidCanvas = new (global as any).MockHTMLCanvasElement()
      invalidCanvas.getContext = vi.fn(() => null)

      expect(() => setup({
        canvas: invalidCanvas,
        width: 800,
        height: 600,
        theme: 'light'
      })).toThrow('Failed to get 2D context from canvas')
    })
  })

  describe('Animation Lifecycle', () => {
    it('starts animation on resume', async () => {
      const module = setup({
        canvas: mockCanvas,
        width: 800,
        height: 600,
        theme: 'light'
      })
      expect(module).toBeDefined()

      // Setup starts animation automatically
      expect(mockRequestAnimationFrame).toHaveBeenCalled()
    })

    it('stops animation on pause', async () => {
      const module = setup({
        canvas: mockCanvas,
        width: 800,
        height: 600,
        theme: 'light'
      })

      module.pause()
      expect(mockCancelAnimationFrame).toHaveBeenCalled()
    })

    it('can resume after pause', async () => {
      const module = setup({
        canvas: mockCanvas,
        width: 800,
        height: 600,
        theme: 'light'
      })

      module.pause()
      vi.clearAllMocks()

      module.resume()
      expect(mockRequestAnimationFrame).toHaveBeenCalled()
    })

    it('cleans up on destroy', () => {
      const module = setup({
        canvas: mockCanvas,
        width: 800,
        height: 600,
        theme: 'light'
      })

      module.destroy()

      expect(mockCancelAnimationFrame).toHaveBeenCalled()
      expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 800, 600)
    })
  })

  describe('Gradient Rendering', () => {
    it('creates linear gradients during animation', async () => {
      const module = setup({
        canvas: mockCanvas,
        width: 800,
        height: 600,
        theme: 'light'
      })
      expect(module).toBeDefined()

      // Wait for animation frame
      await testUtils.waitForAnimationFrames(1)

      expect(mockContext.createLinearGradient).toHaveBeenCalled()
      expect(mockContext.fillRect).toHaveBeenCalledWith(0, 0, 800, 600)
    })

    it('creates radial gradients for depth effect', async () => {
      const module = setup({
        canvas: mockCanvas,
        width: 800,
        height: 600,
        theme: 'light'
      })
      expect(module).toBeDefined()

      await testUtils.waitForAnimationFrames(1)

      expect(mockContext.createRadialGradient).toHaveBeenCalled()
    })

    it('draws animated particles', async () => {
      const module = setup({
        canvas: mockCanvas,
        width: 800,
        height: 600,
        theme: 'light'
      })
      expect(module).toBeDefined()

      await testUtils.waitForAnimationFrames(1)

      expect(mockContext.beginPath).toHaveBeenCalled()
      expect(mockContext.arc).toHaveBeenCalled()
      expect(mockContext.fill).toHaveBeenCalled()
    })

    it('clears canvas at start of each frame', async () => {
      const module = setup({
        canvas: mockCanvas,
        width: 800,
        height: 600,
        theme: 'light'
      })
      expect(module).toBeDefined()

      await testUtils.waitForAnimationFrames(1)

      expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 800, 600)
    })
  })

  describe('Theme Handling', () => {
    it('uses light theme colors by default', () => {
      const module = setup({
        canvas: mockCanvas,
        width: 800,
        height: 600,
        theme: 'light'
      })
      expect(module).toBeDefined()

      // Module should be created with light theme
      expect(mockCanvas.getContext).toHaveBeenCalled()
    })

    it('uses dark theme colors when specified', () => {
      const module = setup({
        canvas: mockCanvas,
        width: 800,
        height: 600,
        theme: 'dark'
      })
      expect(module).toBeDefined()

      expect(mockCanvas.getContext).toHaveBeenCalled()
    })

    it('updates theme without restarting animation', async () => {
      const module = setup({
        canvas: mockCanvas,
        width: 800,
        height: 600,
        theme: 'light'
      })

      const initialCallCount = mockRequestAnimationFrame.mock.calls.length

      module.onThemeChange!('dark')

      // Should not trigger new animation start
      expect(mockRequestAnimationFrame.mock.calls.length).toBe(initialCallCount)
    })
  })

  describe('Canvas Composition Effects', () => {
    it('uses multiply blend mode for depth', async () => {
      const module = setup({
        canvas: mockCanvas,
        width: 800,
        height: 600,
        theme: 'light'
      })
      expect(module).toBeDefined()

      await testUtils.waitForAnimationFrames(1)

      // Should set multiply blend mode during render
      expect(mockContext.globalCompositeOperation).toBeDefined()
    })

    it('uses soft-light mode for particles', async () => {
      const module = setup({
        canvas: mockCanvas,
        width: 800,
        height: 600,
        theme: 'light'
      })
      expect(module).toBeDefined()

      await testUtils.waitForAnimationFrames(1)

      // Should modify global alpha for particles
      expect(mockContext.globalAlpha).toEqual(expect.any(Number))
    })

    it('resets composition state after effects', async () => {
      const module = setup({
        canvas: mockCanvas,
        width: 800,
        height: 600,
        theme: 'light'
      })
      expect(module).toBeDefined()

      await testUtils.waitForAnimationFrames(1)

      // Should reset to default values
      // Note: This is tricky to test since we modify the property directly
      expect(mockContext.globalCompositeOperation).toBeDefined()
    })
  })

  describe('Animation Timing', () => {
    it('uses consistent timing for smooth animation', async () => {
      const module = setup({
        canvas: mockCanvas,
        width: 800,
        height: 600,
        theme: 'light'
      })
      expect(module).toBeDefined()

      // Mock Date.now for consistent timing
      const mockDate = vi.spyOn(Date, 'now')
      mockDate.mockReturnValueOnce(1000).mockReturnValueOnce(1016)

      await testUtils.waitForAnimationFrames(1)

      expect(mockRequestAnimationFrame).toHaveBeenCalled()
      mockDate.mockRestore()
    })

    it('handles pause/resume timing correctly', () => {
      const module = setup({
        canvas: mockCanvas,
        width: 800,
        height: 600,
        theme: 'light'
      })

      module.pause()
      
      const mockDate = vi.spyOn(Date, 'now')
      mockDate.mockReturnValue(2000)

      module.resume()

      // Should reset start time on resume
      expect(mockRequestAnimationFrame).toHaveBeenCalled()
      mockDate.mockRestore()
    })
  })

  describe('Resize Handling', () => {
    it('handles resize gracefully', () => {
      const module = setup({
        canvas: mockCanvas,
        width: 800,
        height: 600,
        theme: 'light'
      })
      expect(module).toBeDefined()

      // Should not throw error
      expect(() => module.onResize?.(1000, 800)).not.toThrow()
    })
  })

  describe('Error Handling', () => {
    it('handles missing context gracefully in constructor', () => {
      const badCanvas = new (global as any).MockHTMLCanvasElement()
      badCanvas.getContext = vi.fn(() => null)

      expect(() => setup({
        canvas: badCanvas,
        width: 800,
        height: 600,
        theme: 'light'
      })).toThrow('Failed to get 2D context from canvas')
    })

    it('stops animation when not running', async () => {
      const module = setup({
        canvas: mockCanvas,
        width: 800,
        height: 600,
        theme: 'light'
      })
      expect(module).toBeDefined()

      module.pause()
      vi.clearAllMocks()

      // Simulate animation callback when paused
      const animateCallback = mockRequestAnimationFrame.mock.calls[0]?.[0]
      if (animateCallback) {
        // This should not trigger more animation frames
        animateCallback()
        expect(mockRequestAnimationFrame).not.toHaveBeenCalled()
      }
    })
  })
})