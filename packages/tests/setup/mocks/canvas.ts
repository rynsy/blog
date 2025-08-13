/**
 * Standardized Canvas and WebGL Mocks for Vitest Testing
 * Provides consistent mock implementations across all test files
 */

import { vi } from 'vitest'

// WebGL Context Mock with comprehensive coverage
export const mockWebGLContext = {
  // Buffer operations
  createBuffer: vi.fn(() => ({})),
  deleteBuffer: vi.fn(),
  bindBuffer: vi.fn(),
  bufferData: vi.fn(),
  
  // Shader operations
  createShader: vi.fn(() => ({})),
  deleteShader: vi.fn(),
  shaderSource: vi.fn(),
  compileShader: vi.fn(),
  getShaderParameter: vi.fn(() => true),
  getShaderInfoLog: vi.fn(() => ''),
  
  // Program operations
  createProgram: vi.fn(() => ({})),
  deleteProgram: vi.fn(),
  attachShader: vi.fn(),
  linkProgram: vi.fn(),
  useProgram: vi.fn(),
  getProgramParameter: vi.fn(() => true),
  getProgramInfoLog: vi.fn(() => ''),
  
  // Attribute and uniform operations
  getAttribLocation: vi.fn(() => 0),
  getUniformLocation: vi.fn(() => ({})),
  enableVertexAttribArray: vi.fn(),
  disableVertexAttribArray: vi.fn(),
  vertexAttribPointer: vi.fn(),
  
  // Uniform setters
  uniform1f: vi.fn(),
  uniform2f: vi.fn(),
  uniform3f: vi.fn(),
  uniform4f: vi.fn(),
  uniform1i: vi.fn(),
  uniform2i: vi.fn(),
  uniform3i: vi.fn(),
  uniform4i: vi.fn(),
  uniformMatrix4fv: vi.fn(),
  uniformMatrix3fv: vi.fn(),
  uniformMatrix2fv: vi.fn(),
  
  // Texture operations
  createTexture: vi.fn(() => ({})),
  deleteTexture: vi.fn(),
  bindTexture: vi.fn(),
  texImage2D: vi.fn(),
  texParameteri: vi.fn(),
  generateMipmap: vi.fn(),
  
  // Framebuffer operations
  createFramebuffer: vi.fn(() => ({})),
  deleteFramebuffer: vi.fn(),
  bindFramebuffer: vi.fn(),
  framebufferTexture2D: vi.fn(),
  checkFramebufferStatus: vi.fn(() => 36053), // FRAMEBUFFER_COMPLETE
  
  // Rendering operations
  clear: vi.fn(),
  clearColor: vi.fn(),
  clearDepth: vi.fn(),
  enable: vi.fn(),
  disable: vi.fn(),
  blendFunc: vi.fn(),
  depthFunc: vi.fn(),
  cullFace: vi.fn(),
  viewport: vi.fn(),
  scissor: vi.fn(),
  
  // Drawing operations
  drawArrays: vi.fn(),
  drawElements: vi.fn(),
  
  // State queries
  getParameter: vi.fn((param: number) => {
    switch (param) {
      case 0x1F00: return 'WebGL Mock Vendor' // GL_VENDOR
      case 0x1F01: return 'WebGL Mock Renderer' // GL_RENDERER
      case 0x1F02: return 'WebGL 1.0 Mock' // GL_VERSION
      case 0x8B8C: return '1.0 Mock' // GL_SHADING_LANGUAGE_VERSION
      case 0x0D33: return 4096 // GL_MAX_TEXTURE_SIZE
      case 0x8869: return 16 // GL_MAX_VERTEX_ATTRIBS
      case 0x8B4D: return 16 // GL_MAX_VERTEX_UNIFORM_VECTORS
      case 0x8B4C: return 16 // GL_MAX_FRAGMENT_UNIFORM_VECTORS
      case 0x8872: return 8 // GL_MAX_TEXTURE_IMAGE_UNITS
      default: return 1
    }
  }),
  getError: vi.fn(() => 0), // GL_NO_ERROR
  
  // Extension support
  getExtension: vi.fn((name: string) => {
    switch (name) {
      case 'WEBGL_debug_renderer_info':
        return {
          UNMASKED_VENDOR_WEBGL: 0x9245,
          UNMASKED_RENDERER_WEBGL: 0x9246
        }
      case 'OES_texture_float':
        return {}
      case 'OES_texture_half_float':
        return {}
      case 'WEBGL_lose_context':
        return {
          loseContext: vi.fn(),
          restoreContext: vi.fn()
        }
      case 'EXT_disjoint_timer_query_webgl2':
        return {
          createQueryEXT: vi.fn(() => ({})),
          deleteQueryEXT: vi.fn(),
          beginQueryEXT: vi.fn(),
          endQueryEXT: vi.fn(),
          getQueryParameterEXT: vi.fn(() => true)
        }
      default:
        return null
    }
  }),
  getSupportedExtensions: vi.fn(() => [
    'WEBGL_debug_renderer_info',
    'OES_texture_float',
    'OES_texture_half_float',
    'WEBGL_lose_context'
  ]),
  
  // Query operations (WebGL2)
  createQuery: vi.fn(() => ({})),
  deleteQuery: vi.fn(),
  beginQuery: vi.fn(),
  endQuery: vi.fn(),
  getQueryParameter: vi.fn(() => true),
  
  // WebGL constants
  ARRAY_BUFFER: 0x8892,
  ELEMENT_ARRAY_BUFFER: 0x8893,
  VERTEX_SHADER: 0x8B31,
  FRAGMENT_SHADER: 0x8B30,
  COLOR_BUFFER_BIT: 0x00004000,
  DEPTH_BUFFER_BIT: 0x00000100,
  STENCIL_BUFFER_BIT: 0x00000400,
  TRIANGLES: 0x0004,
  TRIANGLE_STRIP: 0x0005,
  FLOAT: 0x1406,
  UNSIGNED_BYTE: 0x1401,
  TEXTURE_2D: 0x0DE1,
  TEXTURE_MIN_FILTER: 0x2801,
  TEXTURE_MAG_FILTER: 0x2800,
  LINEAR: 0x2601,
  NEAREST: 0x2600,
  RGBA: 0x1908,
  RGB: 0x1907
} as any

// Canvas 2D Context Mock with comprehensive coverage
export const mockCanvas2DContext = {
  // Drawing rectangles
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  strokeRect: vi.fn(),
  
  // Drawing text
  fillText: vi.fn(),
  strokeText: vi.fn(),
  measureText: vi.fn(() => ({ width: 100, height: 12 })),
  
  // Drawing paths
  beginPath: vi.fn(),
  closePath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  arc: vi.fn(),
  arcTo: vi.fn(),
  bezierCurveTo: vi.fn(),
  quadraticCurveTo: vi.fn(),
  rect: vi.fn(),
  ellipse: vi.fn(),
  
  // Path drawing
  fill: vi.fn(),
  stroke: vi.fn(),
  clip: vi.fn(),
  
  // Image data
  createImageData: vi.fn((width: number, height: number) => ({
    data: new Uint8ClampedArray(width * height * 4),
    width,
    height
  })),
  getImageData: vi.fn((x: number, y: number, width: number, height: number) => ({
    data: new Uint8ClampedArray(width * height * 4),
    width,
    height
  })),
  putImageData: vi.fn(),
  
  // Drawing images
  drawImage: vi.fn(),
  
  // Transformations
  scale: vi.fn(),
  rotate: vi.fn(),
  translate: vi.fn(),
  transform: vi.fn(),
  setTransform: vi.fn(),
  resetTransform: vi.fn(),
  
  // State management
  save: vi.fn(),
  restore: vi.fn(),
  
  // Compositing
  globalAlpha: 1.0,
  globalCompositeOperation: 'source-over',
  
  // Colors and styles
  fillStyle: '#000000',
  strokeStyle: '#000000',
  
  // Line styles
  lineWidth: 1.0,
  lineCap: 'butt',
  lineJoin: 'miter',
  miterLimit: 10.0,
  lineDashOffset: 0.0,
  setLineDash: vi.fn(),
  getLineDash: vi.fn(() => []),
  
  // Text styles
  font: '10px sans-serif',
  textAlign: 'start',
  textBaseline: 'alphabetic',
  direction: 'inherit',
  
  // Shadows
  shadowBlur: 0,
  shadowColor: 'rgba(0, 0, 0, 0)',
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  
  // Canvas reference
  canvas: {
    width: 800,
    height: 600,
    style: {},
    getBoundingClientRect: vi.fn(() => ({
      left: 0,
      top: 0,
      right: 800,
      bottom: 600,
      width: 800,
      height: 600,
      x: 0,
      y: 0
    }))
  }
} as any

// Performance API Mock
export const mockPerformanceMemory = {
  usedJSHeapSize: 50 * 1024 * 1024, // 50MB
  totalJSHeapSize: 100 * 1024 * 1024, // 100MB  
  jsHeapSizeLimit: 2000 * 1024 * 1024 // 2GB
}

// Canvas Element Mock Factory
export function createMockCanvas(width = 800, height = 600): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  
  canvas.getContext = vi.fn((contextType: string, options?: any) => {
    switch (contextType) {
      case 'webgl':
      case 'webgl2':
        return mockWebGLContext
      case '2d':
        return mockCanvas2DContext
      case 'webgl-experimental':
        return mockWebGLContext
      default:
        return null
    }
  })
  
  canvas.getBoundingClientRect = vi.fn(() => ({
    left: 0,
    top: 0,
    right: width,
    bottom: height,
    width,
    height,
    x: 0,
    y: 0
  }))
  
  return canvas
}

// Setup function for test files
export function setupCanvasMocks() {
  // Mock HTMLCanvasElement.prototype methods globally
  HTMLCanvasElement.prototype.getContext = vi.fn(function(this: HTMLCanvasElement, contextType: string) {
    switch (contextType) {
      case 'webgl':
      case 'webgl2':
        return mockWebGLContext
      case '2d':
        return mockCanvas2DContext
      default:
        return null
    }
  })
  
  // Mock performance.memory if not available
  if (!(performance as any).memory) {
    Object.defineProperty(performance, 'memory', {
      value: mockPerformanceMemory,
      writable: true,
      configurable: true
    })
  }
  
  // Mock window.devicePixelRatio if not set
  if (!window.devicePixelRatio) {
    Object.defineProperty(window, 'devicePixelRatio', {
      value: 1,
      writable: true,
      configurable: true
    })
  }
}

// Reset function for beforeEach hooks
export function resetCanvasMocks() {
  vi.clearAllMocks()
  
  // Reset mock return values to defaults
  mockWebGLContext.getParameter.mockImplementation((param: number) => {
    switch (param) {
      case 0x1F00: return 'WebGL Mock Vendor'
      case 0x1F01: return 'WebGL Mock Renderer'
      case 0x1F02: return 'WebGL 1.0 Mock'
      case 0x8B8C: return '1.0 Mock'
      case 0x0D33: return 4096
      case 0x8869: return 16
      default: return 1
    }
  })
  
  mockCanvas2DContext.measureText.mockReturnValue({ width: 100, height: 12 })
  mockCanvas2DContext.canvas.width = 800
  mockCanvas2DContext.canvas.height = 600
  
  // Reset performance memory values
  mockPerformanceMemory.usedJSHeapSize = 50 * 1024 * 1024
  mockPerformanceMemory.totalJSHeapSize = 100 * 1024 * 1024
  mockPerformanceMemory.jsHeapSizeLimit = 2000 * 1024 * 1024
}