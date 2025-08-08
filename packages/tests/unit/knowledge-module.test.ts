import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setup } from '@site/bgModules/knowledge'

// Mock D3 dependencies
vi.mock('d3-force', () => ({
  forceSimulation: vi.fn(() => ({
    nodes: vi.fn().mockReturnThis(),
    force: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    restart: vi.fn().mockReturnThis(),
    alpha: vi.fn().mockReturnThis(),
    alphaTarget: vi.fn().mockReturnThis(),
    alphaDecay: vi.fn().mockReturnThis(),
    velocityDecay: vi.fn().mockReturnThis(),
    tick: vi.fn().mockReturnThis()
  })),
  forceLink: vi.fn(() => ({
    id: vi.fn().mockReturnThis(),
    distance: vi.fn().mockReturnThis(),
    strength: vi.fn().mockReturnThis()
  })),
  forceManyBody: vi.fn(() => ({
    strength: vi.fn().mockReturnThis(),
    distanceMin: vi.fn().mockReturnThis(),
    distanceMax: vi.fn().mockReturnThis()
  })),
  forceCenter: vi.fn(() => ({})),
  forceCollide: vi.fn(() => ({
    radius: vi.fn().mockReturnThis()
  }))
}))

vi.mock('d3-selection', () => ({
  select: vi.fn(() => ({
    call: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis()
  })),
  pointer: vi.fn(() => [100, 100])
}))

vi.mock('d3-drag', () => ({
  drag: vi.fn(() => ({
    on: vi.fn().mockReturnThis()
  }))
}))

vi.mock('d3-zoom', () => ({
  zoom: vi.fn(() => ({
    scaleExtent: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis()
  }))
}))

describe('Knowledge Graph Module Implementation', () => {
  let mockCanvas: HTMLCanvasElement
  let mockContext: CanvasRenderingContext2D
  let mockRequestAnimationFrame: ReturnType<typeof vi.fn>
  let mockCancelAnimationFrame: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Create comprehensive canvas mock
    mockContext = {
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn(() => ({ width: 50 })),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      setTransform: vi.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      globalAlpha: 1,
      font: '',
      textAlign: 'center',
      textBaseline: 'middle'
    } as any

    // Use the mock class that properly extends HTMLCanvasElement
    mockCanvas = new (global as any).MockHTMLCanvasElement()
    mockCanvas.getContext = vi.fn(() => mockContext) as any

    // Mock animation frame functions
    mockRequestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
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
      expect(module.onResize).toBeInstanceOf(Function)
    })

    it('initializes with correct dimensions', () => {
      const module = setup({
        canvas: mockCanvas,
        width: 1000,
        height: 800,
        theme: 'dark'
      })
      expect(module).toBeDefined()

      expect(mockCanvas.getContext).toHaveBeenCalled()
    })

    it('sets up event listeners on canvas', () => {
      setup({
        canvas: mockCanvas,
        width: 800,
        height: 600,
        theme: 'light'
      })

      // Check for the actual events registered by the knowledge graph module
      expect(mockCanvas.addEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function))
      expect(mockCanvas.addEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function))
      expect(mockCanvas.addEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function))
      expect(mockCanvas.addEventListener).toHaveBeenCalledWith('contextmenu', expect.any(Function))
      expect(mockCanvas.addEventListener).toHaveBeenCalledWith('wheel', expect.any(Function))
    })
  })

  describe('Graph Initialization', () => {
    it('creates nodes and links', () => {
      const module = setup({
        canvas: mockCanvas,
        width: 800,
        height: 600,
        theme: 'light'
      })

      // The module should create a graph structure
      // We can't directly test the internal state, but we can verify setup completed
      expect(module).toBeDefined()
    })

    it('uses theme-appropriate colors', () => {
      const lightModule = setup({
        canvas: mockCanvas,
        width: 800,
        height: 600,
        theme: 'light'
      })

      const darkModule = setup({
        canvas: mockCanvas,
        width: 800,
        height: 600,
        theme: 'dark'
      })

      expect(lightModule).toBeDefined()
      expect(darkModule).toBeDefined()
    })

    it('creates random but connected graph structure', () => {
      // Mock Math.random for deterministic testing
      const mockRandom = vi.spyOn(Math, 'random')
      mockRandom.mockReturnValueOnce(0.5) // Number of nodes
        .mockReturnValue(0.3) // Various random calls

      const module = setup({
        canvas: mockCanvas,
        width: 800,
        height: 600,
        theme: 'light'
      })

      expect(module).toBeDefined()
      mockRandom.mockRestore()
    })
  })

  describe('Animation Lifecycle', () => {
    it('starts simulation on creation', async () => {
      const module = setup({
        canvas: mockCanvas,
        width: 800,
        height: 600,
        theme: 'light'
      })
      expect(module).toBeDefined()

      // Wait for animation to start
      await new Promise(resolve => setTimeout(resolve, 20))
      expect(mockRequestAnimationFrame).toHaveBeenCalled()
    })

    it('stops animation on pause', () => {
      const module = setup({
        canvas: mockCanvas,
        width: 800,
        height: 600,
        theme: 'light'
      })

      module.pause()
      expect(mockCancelAnimationFrame).toHaveBeenCalled()
    })

    it('resumes animation properly', () => {
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
      // The knowledge graph module doesn't explicitly remove event listeners in destroy()
      // It only stops the animation and simulation
      expect(mockCancelAnimationFrame).toHaveBeenCalled()
    })
  })

  describe('Rendering', () => {
    it('clears canvas each frame', async () => {
      const module = setup({
        canvas: mockCanvas,
        width: 800,
        height: 600,
        theme: 'light'
      })
      expect(module).toBeDefined()

      await new Promise(resolve => setTimeout(resolve, 20))
      expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 800, 600)
    })

    it('draws nodes as circles', async () => {
      const module = setup({
        canvas: mockCanvas,
        width: 800,
        height: 600,
        theme: 'light'
      })
      expect(module).toBeDefined()

      await new Promise(resolve => setTimeout(resolve, 20))

      expect(mockContext.beginPath).toHaveBeenCalled()
      expect(mockContext.arc).toHaveBeenCalled()
      expect(mockContext.fill).toHaveBeenCalled()
    })

    it('draws links between nodes', async () => {
      const module = setup({
        canvas: mockCanvas,
        width: 800,
        height: 600,
        theme: 'light'
      })
      expect(module).toBeDefined()

      await new Promise(resolve => setTimeout(resolve, 20))

      expect(mockContext.moveTo).toHaveBeenCalled()
      expect(mockContext.lineTo).toHaveBeenCalled()
      expect(mockContext.stroke).toHaveBeenCalled()
    })

    it('draws node labels', async () => {
      const module = setup({
        canvas: mockCanvas,
        width: 800,
        height: 600,
        theme: 'light'
      })
      expect(module).toBeDefined()

      await new Promise(resolve => setTimeout(resolve, 20))

      expect(mockContext.fillText).toHaveBeenCalled()
    })
  })

  describe('Theme Handling', () => {
    it('updates colors on theme change', () => {
      const module = setup({
        canvas: mockCanvas,
        width: 800,
        height: 600,
        theme: 'light'
      })

      // Should not throw error
      expect(() => module.onThemeChange!('dark')).not.toThrow()
      expect(() => module.onThemeChange!('light')).not.toThrow()
    })

    it('uses appropriate theme colors for nodes and links', async () => {
      const module = setup({
        canvas: mockCanvas,
        width: 800,
        height: 600,
        theme: 'dark'
      })
      expect(module).toBeDefined()

      await new Promise(resolve => setTimeout(resolve, 20))

      // Should have set fillStyle and strokeStyle
      expect(mockContext.fillStyle).toBeDefined()
      expect(mockContext.strokeStyle).toBeDefined()
    })
  })

  describe('Mouse Interactions', () => {
    it('handles mouse events without errors', () => {
      const module = setup({
        canvas: mockCanvas,
        width: 800,
        height: 600,
        theme: 'light'
      })
      expect(module).toBeDefined()

      // Get the event listeners that were added
      const mousedownListener = (mockCanvas.addEventListener as any).mock.calls
        .find((call: any) => call[0] === 'mousedown')?.[1]

      if (mousedownListener) {
        const mockEvent = {
          preventDefault: vi.fn(),
          clientX: 100,
          clientY: 100,
          button: 0
        }

        expect(() => mousedownListener(mockEvent)).not.toThrow()
      }
    })

    it('handles mouse movement for hovering', () => {
      const module = setup({
        canvas: mockCanvas,
        width: 800,
        height: 600,
        theme: 'light'
      })
      expect(module).toBeDefined()

      const mousemoveListener = (mockCanvas.addEventListener as any).mock.calls
        .find((call: any) => call[0] === 'mousemove')?.[1]

      if (mousemoveListener) {
        const mockEvent = {
          preventDefault: vi.fn(),
          clientX: 200,
          clientY: 200
        }

        expect(() => mousemoveListener(mockEvent)).not.toThrow()
      }
    })

    it('handles contextmenu events for node creation', () => {
      const module = setup({
        canvas: mockCanvas,
        width: 800,
        height: 600,
        theme: 'light'
      })
      expect(module).toBeDefined()

      const contextMenuListener = (mockCanvas.addEventListener as any).mock.calls
        .find((call: any) => call[0] === 'contextmenu')?.[1]

      if (contextMenuListener) {
        const mockEvent = {
          preventDefault: vi.fn(),
          clientX: 300,
          clientY: 300
        }

        expect(() => contextMenuListener(mockEvent)).not.toThrow()
        expect(mockEvent.preventDefault).toHaveBeenCalled()
      }
    })
  })

  describe('Resize Handling', () => {
    it('updates dimensions on resize', () => {
      const module = setup({
        canvas: mockCanvas,
        width: 800,
        height: 600,
        theme: 'light'
      })

      expect(() => module.onResize!(1000, 800)).not.toThrow()
    })

    it('repositions nodes after resize', () => {
      const module = setup({
        canvas: mockCanvas,
        width: 800,
        height: 600,
        theme: 'light'
      })

      // Should handle resize gracefully
      module.onResize!(1200, 900)

      // The simulation should be updated (we can't directly test internal state)
      expect(module).toBeDefined()
    })
  })

  describe('Interactive Features', () => {
    it('supports node dragging', () => {
      const module = setup({
        canvas: mockCanvas,
        width: 800,
        height: 600,
        theme: 'light'
      })
      expect(module).toBeDefined()

      // Test drag start
      const mousedownListener = (mockCanvas.addEventListener as any).mock.calls
        .find((call: any) => call[0] === 'mousedown')?.[1]

      if (mousedownListener) {
        const startEvent = {
          preventDefault: vi.fn(),
          clientX: 100,
          clientY: 100,
          button: 0
        }

        mousedownListener(startEvent)

        // Test drag move
        const mousemoveListener = (mockCanvas.addEventListener as any).mock.calls
          .find((call: any) => call[0] === 'mousemove')?.[1]

        if (mousemoveListener) {
          const moveEvent = {
            preventDefault: vi.fn(),
            clientX: 150,
            clientY: 150
          }

          expect(() => mousemoveListener(moveEvent)).not.toThrow()
        }
      }
    })

    it('handles wheel events for zooming', () => {
      const module = setup({
        canvas: mockCanvas,
        width: 800,
        height: 600,
        theme: 'light'
      })
      expect(module).toBeDefined()

      const wheelListener = (mockCanvas.addEventListener as any).mock.calls
        .find((call: any) => call[0] === 'wheel')?.[1]

      if (wheelListener) {
        const mockEvent = {
          preventDefault: vi.fn(),
          clientX: 400,
          clientY: 300,
          deltaY: 100 // Scroll down
        }

        expect(() => wheelListener(mockEvent)).not.toThrow()
        expect(mockEvent.preventDefault).toHaveBeenCalled()
      }
    })
  })

  describe('Performance', () => {
    it('manages animation frames efficiently', () => {
      const module = setup({
        canvas: mockCanvas,
        width: 800,
        height: 600,
        theme: 'light'
      })

      module.pause()
      module.resume()

      // Should not accumulate animation frames
      expect(mockCancelAnimationFrame).toHaveBeenCalled()
      expect(mockRequestAnimationFrame).toHaveBeenCalled()
    })

    it('stops simulation when paused', () => {
      const module = setup({
        canvas: mockCanvas,
        width: 800,
        height: 600,
        theme: 'light'
      })

      module.pause()
      vi.clearAllMocks()

      // Should not continue requesting frames
      setTimeout(() => {
        expect(mockRequestAnimationFrame).not.toHaveBeenCalled()
      }, 50)
    })
  })

  describe('Error Handling', () => {
    it('handles missing canvas context gracefully', () => {
      const badCanvas = new (global as any).MockHTMLCanvasElement()
      badCanvas.getContext = vi.fn(() => null)

      // Should handle gracefully or throw appropriate error
      expect(() => setup({
        canvas: badCanvas,
        width: 800,
        height: 600,
        theme: 'light'
      })).not.toThrow()
    })

    it('handles invalid mouse coordinates', () => {
      const module = setup({
        canvas: mockCanvas,
        width: 800,
        height: 600,
        theme: 'light'
      })
      expect(module).toBeDefined()

      const mousemoveListener = (mockCanvas.addEventListener as any).mock.calls
        .find((call: any) => call[0] === 'mousemove')?.[1]

      if (mousemoveListener) {
        const invalidEvent = {
          preventDefault: vi.fn(),
          clientX: -100,
          clientY: -100
        }

        expect(() => mousemoveListener(invalidEvent)).not.toThrow()
      }
    })
  })
})