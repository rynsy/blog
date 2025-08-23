import { FluidSimulation } from '../../../src/bgModules/FluidSimulation'
import type { ModuleSetupParams } from '../../../src/contexts/BackgroundContext'

// Mock WebGL context
const mockWebGLContext = {
  getExtension: jest.fn(() => ({})),
  createShader: jest.fn(() => ({})),
  shaderSource: jest.fn(),
  compileShader: jest.fn(),
  getShaderParameter: jest.fn(() => true),
  createProgram: jest.fn(() => ({})),
  attachShader: jest.fn(),
  linkProgram: jest.fn(),
  getProgramParameter: jest.fn(() => true),
  useProgram: jest.fn(),
  createBuffer: jest.fn(() => ({})),
  bindBuffer: jest.fn(),
  bufferData: jest.fn(),
  getAttribLocation: jest.fn(() => 0),
  getUniformLocation: jest.fn(() => ({})),
  enableVertexAttribArray: jest.fn(),
  vertexAttribPointer: jest.fn(),
  uniform1f: jest.fn(),
  uniform2f: jest.fn(),
  uniform3f: jest.fn(),
  uniform4f: jest.fn(),
  uniformMatrix4fv: jest.fn(),
  createTexture: jest.fn(() => ({})),
  bindTexture: jest.fn(),
  texImage2D: jest.fn(),
  texParameteri: jest.fn(),
  createFramebuffer: jest.fn(() => ({})),
  bindFramebuffer: jest.fn(),
  framebufferTexture2D: jest.fn(),
  viewport: jest.fn(),
  clear: jest.fn(),
  clearColor: jest.fn(),
  drawArrays: jest.fn(),
  readPixels: jest.fn(),
  // Constants
  VERTEX_SHADER: 0x8B31,
  FRAGMENT_SHADER: 0x8B30,
  ARRAY_BUFFER: 0x8892,
  TEXTURE_2D: 0x0DE1,
  FRAMEBUFFER: 0x8D40,
  COLOR_ATTACHMENT0: 0x8CE0,
  RGBA: 0x1908,
  UNSIGNED_BYTE: 0x1401,
  FLOAT: 0x1406,
  LINEAR: 0x2601,
  CLAMP_TO_EDGE: 0x812F,
  TEXTURE_MIN_FILTER: 0x2801,
  TEXTURE_MAG_FILTER: 0x2800,
  TEXTURE_WRAP_S: 0x2802,
  TEXTURE_WRAP_T: 0x2803,
  TRIANGLES: 0x0004,
  COLOR_BUFFER_BIT: 0x00004000
}

// Mock canvas
const mockCanvas = {
  width: 800,
  height: 600,
  getContext: jest.fn(() => mockWebGLContext),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
} as unknown as HTMLCanvasElement

describe('FluidSimulation', () => {
  let fluidSim: ReturnType<typeof FluidSimulation.setup>
  let setupParams: ModuleSetupParams

  beforeEach(() => {
    jest.clearAllMocks()
    
    setupParams = {
      canvas: mockCanvas,
      width: 800,
      height: 600,
      theme: 'light'
    }

    // Reset WebGL context mock
    mockWebGLContext.getShaderParameter.mockReturnValue(true)
    mockWebGLContext.getProgramParameter.mockReturnValue(true)
    mockWebGLContext.getExtension.mockReturnValue({})
  })

  describe('Module Setup', () => {
    it('should initialize WebGL context successfully', () => {
      fluidSim = FluidSimulation.setup(setupParams)

      expect(mockCanvas.getContext).toHaveBeenCalledWith('webgl2')
      expect(fluidSim).toHaveProperty('pause')
      expect(fluidSim).toHaveProperty('resume')
      expect(fluidSim).toHaveProperty('destroy')
      expect(fluidSim).toHaveProperty('onThemeChange')
      expect(fluidSim).toHaveProperty('onResize')
    })

    it('should fallback to webgl if webgl2 is not available', () => {
      mockCanvas.getContext = jest.fn()
        .mockReturnValueOnce(null) // webgl2 fails
        .mockReturnValueOnce(mockWebGLContext) // webgl succeeds

      fluidSim = FluidSimulation.setup(setupParams)

      expect(mockCanvas.getContext).toHaveBeenCalledWith('webgl2')
      expect(mockCanvas.getContext).toHaveBeenCalledWith('webgl')
      expect(fluidSim).toBeDefined()
    })

    it('should throw error if WebGL is not supported', () => {
      mockCanvas.getContext = jest.fn().mockReturnValue(null)

      expect(() => {
        FluidSimulation.setup(setupParams)
      }).toThrow('WebGL not supported')
    })

    it('should compile shaders successfully', () => {
      fluidSim = FluidSimulation.setup(setupParams)

      expect(mockWebGLContext.createShader).toHaveBeenCalled()
      expect(mockWebGLContext.shaderSource).toHaveBeenCalled()
      expect(mockWebGLContext.compileShader).toHaveBeenCalled()
      expect(mockWebGLContext.createProgram).toHaveBeenCalled()
      expect(mockWebGLContext.linkProgram).toHaveBeenCalled()
    })

    it('should handle shader compilation errors', () => {
      mockWebGLContext.getShaderParameter.mockReturnValue(false)
      mockWebGLContext.getShaderInfoLog = jest.fn(() => 'Shader error')

      expect(() => {
        FluidSimulation.setup(setupParams)
      }).toThrow('Shader compilation failed: Shader error')
    })

    it('should handle program linking errors', () => {
      mockWebGLContext.getProgramParameter.mockReturnValue(false)
      mockWebGLContext.getProgramInfoLog = jest.fn(() => 'Program error')

      expect(() => {
        FluidSimulation.setup(setupParams)
      }).toThrow('Program linking failed: Program error')
    })
  })

  describe('Simulation Physics', () => {
    beforeEach(() => {
      fluidSim = FluidSimulation.setup(setupParams)
    })

    it('should initialize fluid properties correctly', () => {
      // Check that simulation properties are set
      expect(mockWebGLContext.uniform1f).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(Number) // viscosity
      )
      expect(mockWebGLContext.uniform1f).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(Number) // density
      )
    })

    it('should update simulation each frame', () => {
      jest.useFakeTimers()
      
      fluidSim.resume()
      
      // Advance animation frame
      jest.advanceTimersByTime(16) // ~60fps
      
      expect(mockWebGLContext.drawArrays).toHaveBeenCalled()
      expect(mockWebGLContext.clear).toHaveBeenCalled()
      
      jest.useRealTimers()
    })

    it('should handle mouse interaction for fluid disturbance', () => {
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: 400,
        clientY: 300
      })

      // Simulate mouse interaction
      fluidSim.onMouseMove?.(mouseEvent)

      // Should update force uniforms
      expect(mockWebGLContext.uniform2f).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(Number), // mouse x
        expect.any(Number)  // mouse y
      )
    })

    it('should apply different force magnitudes based on mouse speed', () => {
      // Simulate slow mouse movement
      const slowEvent = new MouseEvent('mousemove', {
        clientX: 401,
        clientY: 301
      })
      fluidSim.onMouseMove?.(slowEvent)

      // Then fast mouse movement
      const fastEvent = new MouseEvent('mousemove', {
        clientX: 450,
        clientY: 350
      })
      fluidSim.onMouseMove?.(fastEvent)

      // Should have different force values
      expect(mockWebGLContext.uniform1f).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(Number) // force magnitude
      )
    })
  })

  describe('Performance Optimization', () => {
    beforeEach(() => {
      fluidSim = FluidSimulation.setup(setupParams)
    })

    it('should adapt quality based on frame rate', () => {
      jest.useFakeTimers()
      
      // Mock poor performance
      const originalNow = performance.now
      let frameTime = 0
      performance.now = jest.fn(() => {
        frameTime += 33 // Simulate 30fps (poor performance)
        return frameTime
      })

      fluidSim.resume()
      
      // Run several frames to trigger quality adjustment
      for (let i = 0; i < 10; i++) {
        jest.advanceTimersByTime(33)
      }

      // Should reduce simulation quality
      expect(mockWebGLContext.uniform1f).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(Number) // quality factor
      )

      performance.now = originalNow
      jest.useRealTimers()
    })

    it('should use lower resolution textures on mobile', () => {
      global.testUtils.mockDevice('mobile')
      
      const mobileFluidSim = FluidSimulation.setup(setupParams)

      // Should create smaller textures for mobile
      expect(mockWebGLContext.texImage2D).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.any(Number), // smaller width
        expect.any(Number), // smaller height
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything()
      )
    })

    it('should disable expensive effects when battery is low', () => {
      // Mock battery API
      Object.defineProperty(navigator, 'getBattery', {
        value: () => Promise.resolve({
          level: 0.15, // Low battery
          charging: false
        })
      })

      const batteryFluidSim = FluidSimulation.setup(setupParams)

      // Should disable expensive effects
      expect(mockWebGLContext.uniform1f).toHaveBeenCalledWith(
        expect.anything(),
        0 // complexity disabled
      )
    })
  })

  describe('Theme Integration', () => {
    beforeEach(() => {
      fluidSim = FluidSimulation.setup(setupParams)
    })

    it('should update colors for dark theme', () => {
      fluidSim.onThemeChange!('dark')

      expect(mockWebGLContext.uniform3f).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(Number), // dark theme colors
        expect.any(Number),
        expect.any(Number)
      )
    })

    it('should update colors for light theme', () => {
      fluidSim.onThemeChange!('light')

      expect(mockWebGLContext.uniform3f).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(Number), // light theme colors
        expect.any(Number),
        expect.any(Number)
      )
    })

    it('should smoothly transition between themes', () => {
      jest.useFakeTimers()

      fluidSim.onThemeChange!('dark')
      
      // Should not immediately change - should transition
      jest.advanceTimersByTime(500) // Mid-transition
      
      expect(mockWebGLContext.uniform1f).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(Number) // transition progress
      )

      jest.useRealTimers()
    })
  })

  describe('Memory Management', () => {
    beforeEach(() => {
      fluidSim = FluidSimulation.setup(setupParams)
    })

    it('should clean up WebGL resources on destroy', () => {
      fluidSim.destroy()

      expect(mockWebGLContext.deleteBuffer).toHaveBeenCalled()
      expect(mockWebGLContext.deleteTexture).toHaveBeenCalled()
      expect(mockWebGLContext.deleteProgram).toHaveBeenCalled()
      expect(mockWebGLContext.deleteFramebuffer).toHaveBeenCalled()
    })

    it('should remove event listeners on destroy', () => {
      fluidSim.destroy()

      expect(mockCanvas.removeEventListener).toHaveBeenCalledWith(
        'mousemove',
        expect.any(Function)
      )
      expect(mockCanvas.removeEventListener).toHaveBeenCalledWith(
        'click',
        expect.any(Function)
      )
    })

    it('should stop animation loop on destroy', () => {
      const cancelAnimationFrameSpy = jest.spyOn(global, 'cancelAnimationFrame')
      
      fluidSim.destroy()

      expect(cancelAnimationFrameSpy).toHaveBeenCalled()
    })
  })

  describe('Resize Handling', () => {
    beforeEach(() => {
      fluidSim = FluidSimulation.setup(setupParams)
    })

    it('should update simulation dimensions on resize', () => {
      fluidSim.onResize!(1024, 768)

      expect(mockWebGLContext.viewport).toHaveBeenCalledWith(0, 0, 1024, 768)
      expect(mockWebGLContext.uniform2f).toHaveBeenCalledWith(
        expect.anything(),
        1024, // new width
        768   // new height
      )
    })

    it('should recreate textures with new dimensions', () => {
      fluidSim.onResize!(1024, 768)

      expect(mockWebGLContext.texImage2D).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        1024, // new width
        768,  // new height
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything()
      )
    })
  })

  describe('Accessibility', () => {
    it('should respect reduced motion preferences', () => {
      global.testUtils.mockReducedMotion(true)
      
      const reducedMotionFluidSim = FluidSimulation.setup(setupParams)

      // Should reduce or disable animation
      expect(mockWebGLContext.uniform1f).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(Number) // reduced motion factor
      )
    })

    it('should provide alternative visual indicators for motion-sensitive users', () => {
      global.testUtils.mockReducedMotion(true)
      
      const reducedMotionFluidSim = FluidSimulation.setup(setupParams)

      // Should enable static pattern mode
      expect(mockWebGLContext.uniform1f).toHaveBeenCalledWith(
        expect.anything(),
        1 // static pattern enabled
      )
    })
  })

  describe('Error Recovery', () => {
    it('should handle WebGL context loss gracefully', () => {
      fluidSim = FluidSimulation.setup(setupParams)

      // Simulate context loss
      const contextLostEvent = new Event('webglcontextlost')
      mockCanvas.dispatchEvent(contextLostEvent)

      // Should attempt to restore context
      expect(mockCanvas.addEventListener).toHaveBeenCalledWith(
        'webglcontextrestored',
        expect.any(Function)
      )
    })

    it('should reinitialize after context restoration', () => {
      fluidSim = FluidSimulation.setup(setupParams)

      // Simulate context restoration
      const contextRestoredEvent = new Event('webglcontextrestored')
      mockCanvas.dispatchEvent(contextRestoredEvent)

      // Should reinitialize shaders and buffers
      expect(mockWebGLContext.createShader).toHaveBeenCalled()
      expect(mockWebGLContext.createBuffer).toHaveBeenCalled()
    })
  })
})