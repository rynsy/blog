import '@testing-library/jest-dom'

// Mock window.matchMedia for responsive and reduced motion tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock window.ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock IntersectionObserver for visibility detection
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16))
global.cancelAnimationFrame = jest.fn(id => clearTimeout(id))

// Mock getComputedStyle for CSS testing
global.getComputedStyle = jest.fn(() => ({
  getPropertyValue: jest.fn(() => ''),
}))

// Mock localStorage and sessionStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
}
global.localStorage = localStorageMock
global.sessionStorage = localStorageMock

// Mock console methods to reduce noise in tests (but allow error logs)
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Keep error for actual debugging
  error: console.error,
}

// Mock performance API for performance monitoring tests
Object.defineProperty(window, 'performance', {
  value: {
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByName: jest.fn(() => []),
    getEntriesByType: jest.fn(() => []),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
    now: jest.fn(() => Date.now()),
    memory: {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 2000000,
      jsHeapSizeLimit: 4000000
    }
  },
  writable: true
})

// Mock Navigator API for device testing
Object.defineProperty(navigator, 'userAgent', {
  value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  writable: true
})

Object.defineProperty(navigator, 'platform', {
  value: 'MacIntel',
  writable: true
})

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url')
global.URL.revokeObjectURL = jest.fn()

// Mock WebGL context for advanced visual modules
const mockWebGLContext = {
  getExtension: jest.fn(),
  createShader: jest.fn(() => ({})),
  shaderSource: jest.fn(),
  compileShader: jest.fn(),
  createProgram: jest.fn(() => ({})),
  attachShader: jest.fn(),
  linkProgram: jest.fn(),
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
  clear: jest.fn(),
  clearColor: jest.fn(),
  enable: jest.fn(),
  disable: jest.fn(),
  drawArrays: jest.fn(),
  drawElements: jest.fn(),
  viewport: jest.fn(),
  // Constants
  VERTEX_SHADER: 0x8B31,
  FRAGMENT_SHADER: 0x8B30,
  ARRAY_BUFFER: 0x8892,
  COLOR_BUFFER_BIT: 0x00004000,
  DEPTH_BUFFER_BIT: 0x00000100,
  TRIANGLES: 0x0004,
  FLOAT: 0x1406
}

// Mock canvas context methods
HTMLCanvasElement.prototype.getContext = jest.fn((contextId) => {
  if (contextId === 'webgl' || contextId === 'webgl2') {
    return mockWebGLContext
  }
  if (contextId === '2d') {
    return {
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      getImageData: jest.fn(() => ({
        data: new Uint8ClampedArray(4)
      })),
      putImageData: jest.fn(),
      createImageData: jest.fn(() => ({
        data: new Uint8ClampedArray(4)
      })),
      setTransform: jest.fn(),
      drawImage: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      closePath: jest.fn(),
      stroke: jest.fn(),
      fill: jest.fn(),
      arc: jest.fn(),
      rect: jest.fn(),
      translate: jest.fn(),
      scale: jest.fn(),
      rotate: jest.fn(),
      measureText: jest.fn(() => ({ width: 0 })),
      // Properties
      canvas: {
        width: 800,
        height: 600
      }
    }
  }
  return null
})

// Mock document.hidden and visibilityState for Page Visibility API
Object.defineProperty(document, 'hidden', {
  value: false,
  writable: true
})

Object.defineProperty(document, 'visibilityState', {
  value: 'visible',
  writable: true
})

// Mock crypto API for secure random generation
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: jest.fn(arr => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256)
      }
      return arr
    })
  }
})

// Custom test utilities
global.testUtils = {
  // Helper to simulate reduced motion preference
  mockReducedMotion: (reduced = true) => {
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(prefers-reduced-motion: reduce)' ? reduced : false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }))
  },
  
  // Helper to simulate device capabilities
  mockDevice: (type = 'desktop') => {
    const deviceSettings = {
      mobile: {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        maxTouchPoints: 5,
        width: 375,
        height: 667
      },
      tablet: {
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        maxTouchPoints: 5,
        width: 768,
        height: 1024
      },
      desktop: {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        maxTouchPoints: 0,
        width: 1920,
        height: 1080
      }
    }
    
    const settings = deviceSettings[type] || deviceSettings.desktop
    
    Object.defineProperty(navigator, 'userAgent', {
      value: settings.userAgent,
      writable: true
    })
    
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: settings.maxTouchPoints,
      writable: true
    })
    
    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', {
      value: settings.width,
      writable: true
    })
    
    Object.defineProperty(window, 'innerHeight', {
      value: settings.height,
      writable: true
    })
  },
  
  // Helper to wait for animations
  waitForAnimation: (duration = 100) => {
    return new Promise(resolve => setTimeout(resolve, duration))
  },
  
  // Helper to trigger resize events
  triggerResize: (width = 1920, height = 1080) => {
    window.innerWidth = width
    window.innerHeight = height
    window.dispatchEvent(new Event('resize'))
  },
  
  // Helper to trigger visibility change
  triggerVisibilityChange: (hidden = false) => {
    Object.defineProperty(document, 'hidden', {
      value: hidden,
      writable: true
    })
    Object.defineProperty(document, 'visibilityState', {
      value: hidden ? 'hidden' : 'visible',
      writable: true
    })
    document.dispatchEvent(new Event('visibilitychange'))
  }
}

// Set up performance monitoring mock data
beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks()
  
  // Reset performance marks and measures
  window.performance.mark.mockClear()
  window.performance.measure.mockClear()
  
  // Reset canvas mock
  HTMLCanvasElement.prototype.getContext.mockClear()
  
  // Reset localStorage
  localStorage.clear()
  sessionStorage.clear()
})

// Clean up after tests
afterEach(() => {
  // Clean up any remaining timers
  jest.runOnlyPendingTimers()
  jest.useRealTimers()
})