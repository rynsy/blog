import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { BackgroundProvider, useBackground } from '@site/contexts/BackgroundContext'
import { ThemeProvider } from '@site/contexts/ThemeContext'

// Mock the ThemeContext
vi.mock('@site/contexts/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useTheme: () => ({ theme: 'light' as const, toggleTheme: vi.fn() })
}))

// Create wrapper component for testing
const createWrapper = () => {
  return ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider>
      <BackgroundProvider>
        {children}
      </BackgroundProvider>
    </ThemeProvider>
  )
}

describe('BackgroundContext', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useBackground(), {
        wrapper: createWrapper()
      })

      expect(result.current.currentModule).toBeNull()
      expect(result.current.isActive).toBe(false)
      expect(result.current.isPaused).toBe(false)
      expect(result.current.modules).toEqual({})
    })

    it('should load saved preferences from localStorage', () => {
      localStorage.setItem('bg-module', 'stars')
      localStorage.setItem('bg-active', 'true')
      localStorage.setItem('bg-paused', 'true')

      const { result } = renderHook(() => useBackground(), {
        wrapper: createWrapper()
      })

      // Wait for useEffect to run
      act(() => {
        // Trigger re-render
      })

      expect(result.current.currentModule).toBe('stars')
      expect(result.current.isActive).toBe(true)
      expect(result.current.isPaused).toBe(true)
    })
  })

  describe('Module Registration', () => {
    it('should register modules correctly', () => {
      const { result } = renderHook(() => useBackground(), {
        wrapper: createWrapper()
      })

      const mockModule = {
        name: 'Test Module',
        description: 'Test description',
        load: vi.fn(() => Promise.resolve({
          setup: vi.fn(() => ({
            pause: vi.fn(),
            resume: vi.fn(),
            destroy: vi.fn()
          }))
        }))
      }

      act(() => {
        result.current.registerModule('test', mockModule)
      })

      expect(result.current.modules).toHaveProperty('test', mockModule)
    })

    it('should allow multiple module registrations', () => {
      const { result } = renderHook(() => useBackground(), {
        wrapper: createWrapper()
      })

      const mockModule1 = {
        name: 'Module 1',
        description: 'First module',
        load: vi.fn()
      }

      const mockModule2 = {
        name: 'Module 2', 
        description: 'Second module',
        load: vi.fn()
      }

      act(() => {
        result.current.registerModule('module1', mockModule1)
        result.current.registerModule('module2', mockModule2)
      })

      expect(result.current.modules).toHaveProperty('module1', mockModule1)
      expect(result.current.modules).toHaveProperty('module2', mockModule2)
      expect(Object.keys(result.current.modules)).toHaveLength(2)
    })
  })

  describe('Module Selection', () => {
    it('should update current module', async () => {
      const { result } = renderHook(() => useBackground(), {
        wrapper: createWrapper()
      })

      await act(async () => {
        await result.current.setCurrentModule('stars')
      })

      expect(result.current.currentModule).toBe('stars')
      expect(localStorage.getItem('bg-module')).toBe('stars')
    })

    it('should clear module when setting to null', async () => {
      const { result } = renderHook(() => useBackground(), {
        wrapper: createWrapper()
      })

      // First set a module
      await act(async () => {
        await result.current.setCurrentModule('stars')
      })

      // Then clear it
      await act(async () => {
        await result.current.setCurrentModule(null)
      })

      expect(result.current.currentModule).toBeNull()
      expect(localStorage.getItem('bg-module')).toBeNull()
    })
  })

  describe('Active State Management', () => {
    it('should toggle active state', () => {
      const { result } = renderHook(() => useBackground(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.toggleActive()
      })

      expect(result.current.isActive).toBe(true)
      expect(localStorage.getItem('bg-active')).toBe('true')

      act(() => {
        result.current.toggleActive()
      })

      expect(result.current.isActive).toBe(false)
      expect(localStorage.getItem('bg-active')).toBe('false')
    })
  })

  describe('Pause State Management', () => {
    it('should toggle pause state', () => {
      const { result } = renderHook(() => useBackground(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.togglePause()
      })

      expect(result.current.isPaused).toBe(true)
      expect(localStorage.getItem('bg-paused')).toBe('true')

      act(() => {
        result.current.togglePause()
      })

      expect(result.current.isPaused).toBe(false)
      expect(localStorage.getItem('bg-paused')).toBe('false')
    })
  })

  describe('Reduced Motion Handling', () => {
    it('should pause when prefers-reduced-motion is enabled and module is active', () => {
      // Mock reduced motion preference
      global.testUtils.mockReducedMotion(true)

      const { result } = renderHook(() => useBackground(), {
        wrapper: createWrapper()
      })

      // Set active state
      act(() => {
        result.current.toggleActive()
      })

      // Should be paused due to reduced motion
      expect(result.current.isPaused).toBe(true)
    })

    it('should not pause when prefers-reduced-motion is disabled', () => {
      // Mock normal motion preference
      global.testUtils.mockReducedMotion(false)

      const { result } = renderHook(() => useBackground(), {
        wrapper: createWrapper()
      })

      // Set active state
      act(() => {
        result.current.toggleActive()
      })

      // Should not be automatically paused
      expect(result.current.isPaused).toBe(false)
    })
  })

  describe('Page Visibility Handling', () => {
    it('should handle visibility change events', () => {
      const { result } = renderHook(() => useBackground(), {
        wrapper: createWrapper()
      })

      // Activate background
      act(() => {
        result.current.toggleActive()
      })

      // Simulate page becoming hidden
      act(() => {
        global.testUtils.triggerVisibilityChange(true)
      })

      // Module should be paused when page is hidden (handled in CanvasHost)
      // This test verifies the context setup for visibility handling
      expect(result.current.isActive).toBe(true) // Active state doesn't change
      expect(document.hidden).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should throw error when used outside provider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        renderHook(() => useBackground())
      }).toThrow('useBackground must be used within a BackgroundProvider')

      consoleSpy.mockRestore()
    })

    it('should handle module loading errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const { result } = renderHook(() => useBackground(), {
        wrapper: createWrapper()
      })

      // Register a module that will fail to load
      const failingModule = {
        name: 'Failing Module',
        description: 'This will fail',
        load: vi.fn(() => Promise.reject(new Error('Load failed')))
      }

      act(() => {
        result.current.registerModule('failing', failingModule)
        result.current.toggleActive()
      })

      await act(async () => {
        await result.current.setCurrentModule('failing')
      })

      // Should reset to null module on load failure
      expect(result.current.currentModule).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load module failing:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('Storage Persistence', () => {
    it('should save and restore module preferences', () => {
      // First render with module set
      const { result: result1 } = renderHook(() => useBackground(), {
        wrapper: createWrapper()
      })

      act(() => {
        result1.current.toggleActive()
      })

      act(async () => {
        await result1.current.setCurrentModule('stars')
      })

      // Simulate page reload by creating new hook
      const { result: result2 } = renderHook(() => useBackground(), {
        wrapper: createWrapper()
      })

      // Should restore saved values
      expect(result2.current.currentModule).toBe('stars')
      expect(result2.current.isActive).toBe(true)
    })

    it('should handle invalid stored values gracefully', () => {
      // Set invalid values in localStorage
      localStorage.setItem('bg-active', 'invalid')
      localStorage.setItem('bg-paused', 'also-invalid')

      const { result } = renderHook(() => useBackground(), {
        wrapper: createWrapper()
      })

      // Should default to false for boolean values
      expect(result.current.isActive).toBe(false)
      expect(result.current.isPaused).toBe(false)
    })
  })
})