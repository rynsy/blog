import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act, waitFor } from '@testing-library/react'
import { BackgroundProvider, useBackground } from '@site/contexts/BackgroundContext'
import { ThemeProvider } from '@site/contexts/ThemeContext'
import React from 'react'

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

// Mock ThemeContext
vi.mock('@site/contexts/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  ),
  useTheme: () => ({
    theme: 'light',
    toggleTheme: vi.fn(),
  }),
}))

// Mock document.hidden and visibilitychange
Object.defineProperty(document, 'hidden', {
  writable: true,
  value: false,
})

// Test component to access context
const TestComponent = () => {
  const context = useBackground()
  return (
    <div data-testid="test-component">
      <div data-testid="current-module">{context.currentModule || 'none'}</div>
      <div data-testid="is-active">{context.isActive.toString()}</div>
      <div data-testid="is-paused">{context.isPaused.toString()}</div>
      <div data-testid="modules-count">{Object.keys(context.modules).length}</div>
      <button data-testid="toggle-active" onClick={context.toggleActive}>Toggle Active</button>
      <button data-testid="toggle-pause" onClick={context.togglePause}>Toggle Pause</button>
      <button data-testid="set-module" onClick={() => context.setCurrentModule('test')}>Set Module</button>
    </div>
  )
}

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    <BackgroundProvider>
      {children}
    </BackgroundProvider>
  </ThemeProvider>
)

describe('BackgroundProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
    Object.defineProperty(document, 'hidden', { value: false, writable: true })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Context Provider', () => {
    it('provides background context to children', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      expect(getByTestId('current-module')).toHaveTextContent('none')
      expect(getByTestId('is-active')).toHaveTextContent('false')
      expect(getByTestId('is-paused')).toHaveTextContent('false')
      expect(getByTestId('modules-count')).toHaveTextContent('0')
    })

    it('throws error when used outside provider', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      expect(() => render(<TestComponent />)).toThrow(
        'useBackground must be used within a BackgroundProvider'
      )
      
      consoleError.mockRestore()
    })
  })

  describe('localStorage Integration (U-02)', () => {
    it('loads saved module from localStorage on mount', async () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        switch (key) {
          case 'bg-module': return 'knowledge'
          case 'bg-active': return 'true'
          case 'bg-paused': return 'false'
          default: return null
        }
      })

      const { getByTestId } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(getByTestId('current-module')).toHaveTextContent('knowledge')
        expect(getByTestId('is-active')).toHaveTextContent('true')
        expect(getByTestId('is-paused')).toHaveTextContent('false')
      })

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('bg-module')
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('bg-active')
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('bg-paused')
    })

    it('saves module selection to localStorage', async () => {
      const { getByTestId } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      await act(async () => {
        getByTestId('set-module').click()
      })

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('bg-module', 'test')
    })

    it('saves active state to localStorage', async () => {
      const { getByTestId } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      await act(async () => {
        getByTestId('toggle-active').click()
      })

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('bg-active', 'true')
    })

    it('saves paused state to localStorage', async () => {
      const { getByTestId } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      await act(async () => {
        getByTestId('toggle-pause').click()
      })

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('bg-paused', 'true')
    })

    it('removes module from localStorage when set to null', async () => {
      const TestComponentWithNull = () => {
        const context = useBackground()
        return (
          <button data-testid="clear-module" onClick={() => context.setCurrentModule(null)}>
            Clear Module
          </button>
        )
      }

      const { getByTestId } = render(
        <TestWrapper>
          <TestComponentWithNull />
        </TestWrapper>
      )

      await act(async () => {
        getByTestId('clear-module').click()
      })

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('bg-module')
    })

    it('handles corrupted localStorage data gracefully', async () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'bg-active') return 'invalid-boolean'
        if (key === 'bg-paused') return 'also-invalid'
        return null
      })

      const { getByTestId } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      // Should handle invalid boolean strings gracefully
      await waitFor(() => {
        expect(getByTestId('is-active')).toHaveTextContent('false')
        expect(getByTestId('is-paused')).toHaveTextContent('false')
      })
    })
  })

  describe('Module Registration', () => {
    it('registers new modules dynamically', async () => {
      const TestModuleRegistration = () => {
        const context = useBackground()
        
        const registerTestModule = () => {
          context.registerModule('test-module', {
            name: 'Test Module',
            description: 'A test module',
            icon: '🧪',
            load: () => Promise.resolve({
              setup: () => ({
                pause: vi.fn(),
                resume: vi.fn(),
                destroy: vi.fn(),
              })
            })
          })
        }

        return (
          <div>
            <div data-testid="modules-count">{Object.keys(context.modules).length}</div>
            <button data-testid="register-module" onClick={registerTestModule}>
              Register Module
            </button>
          </div>
        )
      }

      const { getByTestId } = render(
        <TestWrapper>
          <TestModuleRegistration />
        </TestWrapper>
      )

      expect(getByTestId('modules-count')).toHaveTextContent('0')

      await act(async () => {
        getByTestId('register-module').click()
      })

      expect(getByTestId('modules-count')).toHaveTextContent('1')
    })
  })

  describe('Page Visibility API Integration', () => {
    it('pauses module when page becomes hidden', async () => {
      const mockModuleInstance = {
        pause: vi.fn(),
        resume: vi.fn(),
        destroy: vi.fn(),
        onThemeChange: vi.fn(),
        onResize: vi.fn(),
      }

      // Mock the internal state to have an active module
      const TestWithModule = () => {
        const context = useBackground() as any
        
        React.useEffect(() => {
          context._setModuleInstance(mockModuleInstance)
        }, [context])

        return <div data-testid="test-with-module" />
      }

      render(
        <TestWrapper>
          <TestWithModule />
        </TestWrapper>
      )

      // Simulate page becoming hidden
      await act(async () => {
        Object.defineProperty(document, 'hidden', { value: true, writable: true })
        document.dispatchEvent(new Event('visibilitychange'))
      })

      expect(mockModuleInstance.pause).toHaveBeenCalled()
    })

    it('resumes module when page becomes visible', async () => {
      const mockModuleInstance = {
        pause: vi.fn(),
        resume: vi.fn(),
        destroy: vi.fn(),
        onThemeChange: vi.fn(),
        onResize: vi.fn(),
      }

      const TestWithActiveModule = () => {
        const context = useBackground() as any
        
        React.useEffect(() => {
          context._setModuleInstance(mockModuleInstance)
          context.toggleActive() // Make it active
        }, [context])

        return <div data-testid="test-with-active-module" />
      }

      render(
        <TestWrapper>
          <TestWithActiveModule />
        </TestWrapper>
      )

      // Simulate page becoming visible (after being hidden)
      await act(async () => {
        Object.defineProperty(document, 'hidden', { value: false, writable: true })
        document.dispatchEvent(new Event('visibilitychange'))
      })

      expect(mockModuleInstance.resume).toHaveBeenCalled()
    })
  })

  describe('Reduced Motion Support', () => {
    it('pauses animation when prefers-reduced-motion is set', async () => {
      const mockMatchMedia = vi.fn()
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })
      
      Object.defineProperty(window, 'matchMedia', {
        value: mockMatchMedia,
      })

      const { getByTestId } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      // Activate the background
      await act(async () => {
        getByTestId('toggle-active').click()
      })

      // Should be paused due to reduced motion preference
      await waitFor(() => {
        expect(getByTestId('is-paused')).toHaveTextContent('true')
      })

      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)')
    })
  })

  describe('Theme Integration', () => {
    it('calls module onThemeChange when theme changes', async () => {
      const mockModuleInstance = {
        pause: vi.fn(),
        resume: vi.fn(),
        destroy: vi.fn(),
        onThemeChange: vi.fn(),
        onResize: vi.fn(),
      }

      const TestWithModuleTheme = () => {
        const context = useBackground() as any
        
        React.useEffect(() => {
          context._setModuleInstance(mockModuleInstance)
        }, [context])

        return <div data-testid="test-with-module-theme" />
      }

      // Mock theme context to trigger theme change
      const mockUseTheme = vi.fn()
      mockUseTheme.mockReturnValueOnce({ theme: 'light', toggleTheme: vi.fn() })
        .mockReturnValueOnce({ theme: 'dark', toggleTheme: vi.fn() })

      vi.mocked(require('@site/contexts/ThemeContext').useTheme).mockImplementation(mockUseTheme)

      const { rerender } = render(
        <TestWrapper>
          <TestWithModuleTheme />
        </TestWrapper>
      )

      // Re-render to trigger theme change
      rerender(
        <TestWrapper>
          <TestWithModuleTheme />
        </TestWrapper>
      )

      expect(mockModuleInstance.onThemeChange).toHaveBeenCalledWith('dark')
    })
  })

  describe('Window Resize Integration', () => {
    it('calls module onResize when window resizes', async () => {
      const mockModuleInstance = {
        pause: vi.fn(),
        resume: vi.fn(),
        destroy: vi.fn(),
        onThemeChange: vi.fn(),
        onResize: vi.fn(),
      }

      const TestWithModuleResize = () => {
        const context = useBackground() as any
        
        React.useEffect(() => {
          context._setModuleInstance(mockModuleInstance)
        }, [context])

        return <div data-testid="test-with-module-resize" />
      }

      render(
        <TestWrapper>
          <TestWithModuleResize />
        </TestWrapper>
      )

      // Simulate window resize
      await act(async () => {
        window.dispatchEvent(new Event('resize'))
      })

      expect(mockModuleInstance.onResize).toHaveBeenCalledWith(
        window.innerWidth,
        window.innerHeight
      )
    })
  })

  describe('Error Handling', () => {
    it('handles module loading failures gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const TestModuleError = () => {
        const context = useBackground()
        
        const registerFailingModule = () => {
          context.registerModule('failing-module', {
            name: 'Failing Module',
            description: 'This module will fail',
            load: () => Promise.reject(new Error('Module load failed'))
          })
        }

        const loadFailingModule = async () => {
          await context.setCurrentModule('failing-module')
        }

        return (
          <div>
            <div data-testid="current-module">{context.currentModule || 'none'}</div>
            <button data-testid="register-failing" onClick={registerFailingModule}>Register</button>
            <button data-testid="load-failing" onClick={loadFailingModule}>Load</button>
          </div>
        )
      }

      const { getByTestId } = render(
        <TestWrapper>
          <TestModuleError />
        </TestWrapper>
      )

      // Register and try to load failing module
      await act(async () => {
        getByTestId('register-failing').click()
        getByTestId('toggle-active').click() // Make active
        getByTestId('load-failing').click()
      })

      // Should reset to null on failure
      await waitFor(() => {
        expect(getByTestId('current-module')).toHaveTextContent('none')
      })

      expect(consoleError).toHaveBeenCalledWith(
        'Failed to load module failing-module:', 
        expect.any(Error)
      )
      
      consoleError.mockRestore()
    })
  })
})