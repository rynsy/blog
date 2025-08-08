import '@testing-library/jest-dom'

// Mock requestAnimationFrame for animations
global.requestAnimationFrame = (callback: FrameRequestCallback) => {
  return setTimeout(callback, 16)
}

global.cancelAnimationFrame = (id: number) => {
  clearTimeout(id)
}

// Mock matchMedia for theme detection
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock canvas context for background modules
const mockGradient = {
  addColorStop: vi.fn()
}

const mockContext = {
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({ data: new Array(4) })),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => ({ data: new Array(4) })),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  // Canvas gradient methods
  createLinearGradient: vi.fn(() => mockGradient),
  createRadialGradient: vi.fn(() => mockGradient),
  createPattern: vi.fn(),
  // Additional canvas properties
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  globalAlpha: 1,
  globalCompositeOperation: 'source-over',
  // Text methods
  fillText: vi.fn(),
  strokeText: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  // Path methods
  arc: vi.fn(),
  arcTo: vi.fn(),
  bezierCurveTo: vi.fn(),
  quadraticCurveTo: vi.fn(),
  rect: vi.fn(),
}

HTMLCanvasElement.prototype.getContext = vi.fn(() => mockContext)
HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,mock')