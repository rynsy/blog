import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import CanvasHost from '../../../src/components/CanvasHost'
import { BackgroundProvider } from '../../../src/contexts/BackgroundContext'
import { ThemeProvider } from '../../../src/contexts/ThemeContext'

// Mock the contexts
jest.mock('../../../src/contexts/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useTheme: () => ({ theme: 'light' as const, toggleTheme: jest.fn() })
}))

// Mock debug utility
jest.mock('../../../src/utils/debug', () => ({
  debugBackground: {
    canvas: jest.fn()
  }
}))

// Create a mock background module
const createMockModule = (overrides = {}) => ({
  pause: jest.fn(),
  resume: jest.fn(),
  destroy: jest.fn(),
  onThemeChange: jest.fn(),
  onResize: jest.fn(),
  ...overrides
})

// Create wrapper with providers and mock context values
const createWrapper = (contextOverrides = {}) => {
  const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Mock the background context
    const mockContext = {
      currentModule: null,
      isActive: false,
      isPaused: false,
      modules: {},
      setCurrentModule: jest.fn(),
      toggleActive: jest.fn(),
      togglePause: jest.fn(),
      registerModule: jest.fn(),
      _setModuleInstance: jest.fn(),
      _moduleInstance: null,
      ...contextOverrides
    }

    return (
      <ThemeProvider>
        <div data-testid="mock-background-context">
          {/* Render children with mocked context */}
          {React.cloneElement(children as React.ReactElement, {
            ...mockContext
          })}
        </div>
      </ThemeProvider>
    )
  }

  return TestWrapper
}

// Override useBackground hook for testing
const mockUseBackground = jest.fn()

jest.mock('../../../src/contexts/BackgroundContext', () => ({
  ...jest.requireActual('../../../src/contexts/BackgroundContext'),
  useBackground: () => mockUseBackground()
}))

describe('CanvasHost', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Reset canvas mock
    HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      // ... other 2D context methods are already mocked in jest.setup.js
    }))

    // Default mock values
    mockUseBackground.mockReturnValue({
      currentModule: null,
      isActive: false,
      isPaused: false,
      modules: {},
      _setModuleInstance: jest.fn(),
      _moduleInstance: null
    })
  })

  describe('Canvas Rendering', () => {
    it('should render canvas element', () => {
      render(<CanvasHost />)
      
      const canvas = screen.getByRole('img', { hidden: true })
      expect(canvas).toBeInTheDocument()
      expect(canvas.tagName).toBe('CANVAS')
    })

    it('should apply correct CSS classes and styles', () => {
      render(<CanvasHost className="test-class" />)
      
      const canvas = screen.getByRole('img', { hidden: true })
      expect(canvas).toHaveClass('fixed', 'inset-0', 'test-class')
      expect(canvas).toHaveStyle({
        zIndex: '-1',
        width: '100vw',
        height: '100vh'
      })
    })

    it('should make canvas interactive for knowledge module', () => {
      mockUseBackground.mockReturnValue({
        currentModule: 'knowledge',
        isActive: true,
        isPaused: false,
        modules: {},
        _setModuleInstance: jest.fn(),
        _moduleInstance: null
      })

      render(<CanvasHost />)
      
      const canvas = screen.getByRole('img', { hidden: true })
      expect(canvas).toHaveClass('pointer-events-auto')
      expect(canvas).toHaveStyle({ zIndex: '1' })
      expect(canvas).toHaveAttribute('aria-hidden', 'false')
    })

    it('should make canvas non-interactive for non-knowledge modules', () => {
      mockUseBackground.mockReturnValue({
        currentModule: 'stars',
        isActive: true,
        isPaused: false,
        modules: {},
        _setModuleInstance: jest.fn(),
        _moduleInstance: null
      })

      render(<CanvasHost />)
      
      const canvas = screen.getByRole('img', { hidden: true })
      expect(canvas).toHaveClass('pointer-events-none')
      expect(canvas).toHaveStyle({ zIndex: '-1' })
      expect(canvas).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('Module Lifecycle', () => {
    it('should not initialize module when not active', async () => {
      const mockModule = createMockModule()
      const mockSetInstance = jest.fn()

      mockUseBackground.mockReturnValue({
        currentModule: 'stars',
        isActive: false,
        isPaused: false,
        modules: {
          stars: {
            name: 'Stars',
            load: () => Promise.resolve({ setup: () => mockModule })
          }
        },
        _setModuleInstance: mockSetInstance,
        _moduleInstance: null
      })

      render(<CanvasHost />)

      await waitFor(() => {
        expect(mockSetInstance).not.toHaveBeenCalled()
      })
    })

    it('should initialize module when active and module is selected', async () => {
      const mockModule = createMockModule()
      const mockSetup = jest.fn(() => mockModule)
      const mockSetInstance = jest.fn()

      mockUseBackground.mockReturnValue({
        currentModule: 'stars',
        isActive: true,
        isPaused: false,
        modules: {
          stars: {
            name: 'Stars',
            load: () => Promise.resolve({ setup: mockSetup })
          }
        },
        _setModuleInstance: mockSetInstance,
        _moduleInstance: null
      })

      render(<CanvasHost />)

      await waitFor(() => {
        expect(mockSetup).toHaveBeenCalledWith({
          canvas: expect.any(HTMLCanvasElement),
          width: expect.any(Number),
          height: expect.any(Number),
          theme: 'light'
        })
      })

      await waitFor(() => {
        expect(mockSetInstance).toHaveBeenCalledWith(mockModule)
      })
    })

    it('should destroy module when component unmounts', async () => {
      const mockModule = createMockModule()
      const mockSetInstance = jest.fn()

      mockUseBackground.mockReturnValue({
        currentModule: 'stars',
        isActive: true,
        isPaused: false,
        modules: {
          stars: {
            name: 'Stars',
            load: () => Promise.resolve({ setup: () => mockModule })
          }
        },
        _setModuleInstance: mockSetInstance,
        _moduleInstance: mockModule
      })

      const { unmount } = render(<CanvasHost />)

      await waitFor(() => {
        expect(mockSetInstance).toHaveBeenCalledWith(mockModule)
      })

      unmount()

      expect(mockModule.destroy).toHaveBeenCalled()
    })

    it('should handle module loading errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      const mockSetInstance = jest.fn()

      mockUseBackground.mockReturnValue({
        currentModule: 'failing',
        isActive: true,
        isPaused: false,
        modules: {
          failing: {
            name: 'Failing Module',
            load: () => Promise.reject(new Error('Load failed'))
          }
        },
        _setModuleInstance: mockSetInstance,
        _moduleInstance: null
      })

      render(<CanvasHost />)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to initialize background module:',
          expect.any(Error)
        )
      })

      consoleSpy.mockRestore()
    })
  })

  describe('Pause/Resume Handling', () => {
    it('should pause module when isPaused is true', async () => {
      const mockModule = createMockModule()

      mockUseBackground.mockReturnValue({
        currentModule: 'stars',
        isActive: true,
        isPaused: true,
        modules: {},
        _setModuleInstance: jest.fn(),
        _moduleInstance: mockModule
      })

      render(<CanvasHost />)

      await waitFor(() => {
        expect(mockModule.pause).toHaveBeenCalled()
      })
    })

    it('should resume module when isPaused is false and isActive is true', async () => {
      const mockModule = createMockModule()

      mockUseBackground.mockReturnValue({
        currentModule: 'stars',
        isActive: true,
        isPaused: false,
        modules: {},
        _setModuleInstance: jest.fn(),
        _moduleInstance: mockModule
      })

      render(<CanvasHost />)

      await waitFor(() => {
        expect(mockModule.resume).toHaveBeenCalled()
      })
    })

    it('should pause module when document is hidden', async () => {
      const mockModule = createMockModule()

      // Mock document.hidden
      Object.defineProperty(document, 'hidden', { value: true, writable: true })

      mockUseBackground.mockReturnValue({
        currentModule: 'stars',
        isActive: true,
        isPaused: false,
        modules: {},
        _setModuleInstance: jest.fn(),
        _moduleInstance: mockModule
      })

      render(<CanvasHost />)

      await waitFor(() => {
        expect(mockModule.pause).toHaveBeenCalled()
      })
    })
  })

  describe('Resize Handling', () => {
    it('should resize canvas on window resize', async () => {
      const mockModule = createMockModule()

      mockUseBackground.mockReturnValue({
        currentModule: 'stars',
        isActive: true,
        isPaused: false,
        modules: {},
        _setModuleInstance: jest.fn(),
        _moduleInstance: mockModule
      })

      render(<CanvasHost />)

      // Trigger resize
      act(() => {
        global.testUtils.triggerResize(1024, 768)
      })

      await waitFor(() => {
        expect(mockModule.onResize).toHaveBeenCalledWith(1024, 768)
      })
    })

    it('should update canvas dimensions on resize', () => {
      render(<CanvasHost />)
      
      const canvas = screen.getByRole('img', { hidden: true }) as HTMLCanvasElement

      // Trigger resize
      act(() => {
        global.testUtils.triggerResize(1024, 768)
      })

      expect(canvas.width).toBe(1024)
      expect(canvas.height).toBe(768)
    })
  })

  describe('Accessibility', () => {
    it('should show reduced motion banner when appropriate', async () => {
      global.testUtils.mockReducedMotion(true)

      mockUseBackground.mockReturnValue({
        currentModule: 'stars',
        isActive: true,
        isPaused: false,
        modules: {},
        _setModuleInstance: jest.fn(),
        _moduleInstance: null
      })

      render(<CanvasHost />)

      await waitFor(() => {
        expect(screen.getByRole('banner')).toBeInTheDocument()
        expect(screen.getByText(/animations are disabled/i)).toBeInTheDocument()
      })
    })

    it('should not show reduced motion banner when motion is allowed', () => {
      global.testUtils.mockReducedMotion(false)

      mockUseBackground.mockReturnValue({
        currentModule: 'stars',
        isActive: true,
        isPaused: false,
        modules: {},
        _setModuleInstance: jest.fn(),
        _moduleInstance: null
      })

      render(<CanvasHost />)

      expect(screen.queryByRole('banner')).not.toBeInTheDocument()
    })

    it('should have proper ARIA attributes', () => {
      render(<CanvasHost />)
      
      const canvas = screen.getByRole('img', { hidden: true })
      expect(canvas).toHaveAttribute('aria-hidden', 'true')
    })

    it('should handle reduced motion preference changes', () => {
      const { rerender } = render(<CanvasHost />)

      // Initially no reduced motion
      expect(screen.queryByRole('banner')).not.toBeInTheDocument()

      // Enable reduced motion
      global.testUtils.mockReducedMotion(true)

      mockUseBackground.mockReturnValue({
        currentModule: 'stars',
        isActive: true,
        isPaused: false,
        modules: {},
        _setModuleInstance: jest.fn(),
        _moduleInstance: null
      })

      rerender(<CanvasHost />)

      expect(screen.getByRole('banner')).toBeInTheDocument()
    })
  })

  describe('Theme Integration', () => {
    it('should call onThemeChange when theme changes', async () => {
      const mockModule = createMockModule()

      // First render with light theme
      mockUseBackground.mockReturnValue({
        currentModule: 'stars',
        isActive: true,
        isPaused: false,
        modules: {},
        _setModuleInstance: jest.fn(),
        _moduleInstance: mockModule
      })

      const { rerender } = render(<CanvasHost />)

      // Mock theme change to dark
      jest.doMock('../../../src/contexts/ThemeContext', () => ({
        useTheme: () => ({ theme: 'dark' as const, toggleTheme: jest.fn() })
      }))

      rerender(<CanvasHost />)

      await waitFor(() => {
        expect(mockModule.onThemeChange).toHaveBeenCalledWith('dark')
      })
    })
  })
})