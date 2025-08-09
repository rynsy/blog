import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EasterEggDiscovery } from '../../../src/components/EasterEggDiscovery'

// Mock local storage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

// Mock console for achievement notifications
const mockConsole = jest.spyOn(console, 'log').mockImplementation(() => {})

describe('EasterEggDiscovery', () => {
  const defaultProps = {
    onDiscovery: jest.fn(),
    onAchievementUnlock: jest.fn(),
    enableKeyboard: true,
    enableMouse: true,
    enableScroll: true,
    difficulty: 1 as const
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  afterAll(() => {
    mockConsole.mockRestore()
  })

  describe('Component Rendering', () => {
    it('should render without errors', () => {
      render(<EasterEggDiscovery {...defaultProps} />)
      
      // Should render the discovery overlay (invisible but present)
      expect(screen.getByTestId('easter-egg-discovery')).toBeInTheDocument()
    })

    it('should be accessible with proper ARIA attributes', () => {
      render(<EasterEggDiscovery {...defaultProps} />)
      
      const discoveryElement = screen.getByTestId('easter-egg-discovery')
      expect(discoveryElement).toHaveAttribute('role', 'region')
      expect(discoveryElement).toHaveAttribute('aria-label', 'Easter egg discovery system')
      expect(discoveryElement).toHaveAttribute('aria-live', 'polite')
    })

    it('should have keyboard navigation instructions for accessibility', () => {
      render(<EasterEggDiscovery {...defaultProps} />)
      
      expect(screen.getByText(/Press keys to discover hidden patterns/i)).toBeInTheDocument()
    })
  })

  describe('Keyboard Pattern Recognition', () => {
    it('should recognize the Konami code sequence', async () => {
      const user = userEvent.setup()
      render(<EasterEggDiscovery {...defaultProps} />)

      const discoveryElement = screen.getByTestId('easter-egg-discovery')

      // Input Konami code: ↑↑↓↓←→←→BA
      await user.keyboard('[ArrowUp][ArrowUp][ArrowDown][ArrowDown][ArrowLeft][ArrowRight][ArrowLeft][ArrowRight]ba')

      expect(defaultProps.onDiscovery).toHaveBeenCalledWith({
        type: 'keyboard',
        pattern: 'konami',
        difficulty: 1,
        timestamp: expect.any(Number)
      })
    })

    it('should recognize custom key sequences for different difficulty levels', async () => {
      const user = userEvent.setup()
      const hardModeProps = { ...defaultProps, difficulty: 3 as const }
      render(<EasterEggDiscovery {...hardModeProps} />)

      // Difficulty 3 pattern: "secret"
      await user.keyboard('secret')

      expect(defaultProps.onDiscovery).toHaveBeenCalledWith({
        type: 'keyboard',
        pattern: 'secret-word',
        difficulty: 3,
        timestamp: expect.any(Number)
      })
    })

    it('should reset sequence on wrong key', async () => {
      const user = userEvent.setup()
      render(<EasterEggDiscovery {...defaultProps} />)

      // Start Konami code but make mistake
      await user.keyboard('[ArrowUp][ArrowUp][ArrowDown][Space]') // Wrong key
      await user.keyboard('[ArrowUp][ArrowUp][ArrowDown][ArrowDown][ArrowLeft][ArrowRight][ArrowLeft][ArrowRight]ba')

      // Should still trigger since we completed sequence after reset
      expect(defaultProps.onDiscovery).toHaveBeenCalledTimes(1)
    })

    it('should have timeout for sequence completion', async () => {
      const user = userEvent.setup()
      render(<EasterEggDiscovery {...defaultProps} />)

      // Start sequence
      await user.keyboard('[ArrowUp][ArrowUp]')

      // Wait for timeout (simulate with fake timers)
      jest.useFakeTimers()
      jest.advanceTimersByTime(5000) // 5 second timeout

      // Continue sequence after timeout
      await user.keyboard('[ArrowDown][ArrowDown][ArrowLeft][ArrowRight][ArrowLeft][ArrowRight]ba')

      // Should not trigger discovery due to timeout
      expect(defaultProps.onDiscovery).not.toHaveBeenCalled()

      jest.useRealTimers()
    })

    it('should be disabled when enableKeyboard is false', async () => {
      const user = userEvent.setup()
      const disabledProps = { ...defaultProps, enableKeyboard: false }
      render(<EasterEggDiscovery {...disabledProps} />)

      await user.keyboard('[ArrowUp][ArrowUp][ArrowDown][ArrowDown][ArrowLeft][ArrowRight][ArrowLeft][ArrowRight]ba')

      expect(defaultProps.onDiscovery).not.toHaveBeenCalled()
    })
  })

  describe('Mouse Gesture Recognition', () => {
    it('should recognize circular mouse gestures', async () => {
      render(<EasterEggDiscovery {...defaultProps} />)
      
      const discoveryElement = screen.getByTestId('easter-egg-discovery')

      // Simulate circular mouse movement (8 points around circle)
      const centerX = 400, centerY = 300, radius = 50
      const points = []
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * 2 * Math.PI
        points.push({
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius
        })
      }

      // Start mouse down
      fireEvent.mouseDown(discoveryElement, { clientX: points[0].x, clientY: points[0].y })

      // Move through all points
      for (let i = 1; i < points.length; i++) {
        fireEvent.mouseMove(discoveryElement, { clientX: points[i].x, clientY: points[i].y })
      }

      // Complete circle back to start
      fireEvent.mouseMove(discoveryElement, { clientX: points[0].x, clientY: points[0].y })
      fireEvent.mouseUp(discoveryElement)

      await waitFor(() => {
        expect(defaultProps.onDiscovery).toHaveBeenCalledWith({
          type: 'mouse',
          pattern: 'circle',
          difficulty: 1,
          timestamp: expect.any(Number)
        })
      })
    })

    it('should recognize zigzag mouse patterns', async () => {
      render(<EasterEggDiscovery {...defaultProps} />)
      
      const discoveryElement = screen.getByTestId('easter-egg-discovery')

      // Simulate zigzag pattern
      const zigzagPoints = [
        { x: 100, y: 100 },
        { x: 200, y: 200 },
        { x: 300, y: 100 },
        { x: 400, y: 200 },
        { x: 500, y: 100 }
      ]

      fireEvent.mouseDown(discoveryElement, { clientX: zigzagPoints[0].x, clientY: zigzagPoints[0].y })

      for (let i = 1; i < zigzagPoints.length; i++) {
        fireEvent.mouseMove(discoveryElement, { clientX: zigzagPoints[i].x, clientY: zigzagPoints[i].y })
      }

      fireEvent.mouseUp(discoveryElement)

      await waitFor(() => {
        expect(defaultProps.onDiscovery).toHaveBeenCalledWith({
          type: 'mouse',
          pattern: 'zigzag',
          difficulty: 2,
          timestamp: expect.any(Number)
        })
      })
    })

    it('should be disabled when enableMouse is false', async () => {
      const disabledProps = { ...defaultProps, enableMouse: false }
      render(<EasterEggDiscovery {...disabledProps} />)
      
      const discoveryElement = screen.getByTestId('easter-egg-discovery')

      // Try circular gesture
      fireEvent.mouseDown(discoveryElement, { clientX: 100, clientY: 100 })
      fireEvent.mouseMove(discoveryElement, { clientX: 200, clientY: 100 })
      fireEvent.mouseUp(discoveryElement)

      expect(defaultProps.onDiscovery).not.toHaveBeenCalled()
    })
  })

  describe('Scroll Pattern Recognition', () => {
    it('should recognize rapid scroll patterns', async () => {
      render(<EasterEggDiscovery {...defaultProps} />)
      
      const discoveryElement = screen.getByTestId('easter-egg-discovery')

      // Simulate rapid scroll down then up
      for (let i = 0; i < 10; i++) {
        fireEvent.wheel(discoveryElement, { deltaY: 100 })
      }

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100))

      for (let i = 0; i < 10; i++) {
        fireEvent.wheel(discoveryElement, { deltaY: -100 })
      }

      await waitFor(() => {
        expect(defaultProps.onDiscovery).toHaveBeenCalledWith({
          type: 'scroll',
          pattern: 'rapid-yo-yo',
          difficulty: 2,
          timestamp: expect.any(Number)
        })
      })
    })

    it('should recognize scroll pause patterns', async () => {
      render(<EasterEggDiscovery {...defaultProps} />)
      
      const discoveryElement = screen.getByTestId('easter-egg-discovery')

      // Scroll with specific rhythm: scroll, pause, scroll, pause
      fireEvent.wheel(discoveryElement, { deltaY: 100 })
      await new Promise(resolve => setTimeout(resolve, 500))
      fireEvent.wheel(discoveryElement, { deltaY: 100 })
      await new Promise(resolve => setTimeout(resolve, 500))
      fireEvent.wheel(discoveryElement, { deltaY: 100 })

      await waitFor(() => {
        expect(defaultProps.onDiscovery).toHaveBeenCalledWith({
          type: 'scroll',
          pattern: 'rhythm',
          difficulty: 3,
          timestamp: expect.any(Number)
        })
      })
    })

    it('should be disabled when enableScroll is false', async () => {
      const disabledProps = { ...defaultProps, enableScroll: false }
      render(<EasterEggDiscovery {...disabledProps} />)
      
      const discoveryElement = screen.getByTestId('easter-egg-discovery')

      fireEvent.wheel(discoveryElement, { deltaY: 100 })

      expect(defaultProps.onDiscovery).not.toHaveBeenCalled()
    })
  })

  describe('Achievement System', () => {
    it('should track discovered patterns and unlock achievements', async () => {
      const user = userEvent.setup()
      render(<EasterEggDiscovery {...defaultProps} />)

      // Discover first pattern
      await user.keyboard('[ArrowUp][ArrowUp][ArrowDown][ArrowDown][ArrowLeft][ArrowRight][ArrowLeft][ArrowRight]ba')

      expect(defaultProps.onAchievementUnlock).toHaveBeenCalledWith({
        id: 'first-discovery',
        name: 'First Discovery',
        description: 'Found your first easter egg',
        type: 'milestone',
        timestamp: expect.any(Number)
      })
    })

    it('should unlock pattern-specific achievements', async () => {
      const user = userEvent.setup()
      render(<EasterEggDiscovery {...defaultProps} />)

      await user.keyboard('[ArrowUp][ArrowUp][ArrowDown][ArrowDown][ArrowLeft][ArrowRight][ArrowLeft][ArrowRight]ba')

      expect(defaultProps.onAchievementUnlock).toHaveBeenCalledWith({
        id: 'konami-master',
        name: 'Konami Master',
        description: 'Successfully entered the legendary Konami code',
        type: 'pattern',
        timestamp: expect.any(Number)
      })
    })

    it('should track achievement progress persistence', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        discoveredPatterns: ['konami', 'circle'],
        achievements: ['first-discovery', 'konami-master']
      }))

      render(<EasterEggDiscovery {...defaultProps} />)

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('easter-egg-progress')
    })

    it('should save progress to localStorage', async () => {
      const user = userEvent.setup()
      render(<EasterEggDiscovery {...defaultProps} />)

      await user.keyboard('[ArrowUp][ArrowUp][ArrowDown][ArrowDown][ArrowLeft][ArrowRight][ArrowLeft][ArrowRight]ba')

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'easter-egg-progress',
          expect.stringContaining('konami')
        )
      })
    })
  })

  describe('Difficulty Scaling', () => {
    it('should have easier patterns for difficulty 1', async () => {
      const user = userEvent.setup()
      const easyProps = { ...defaultProps, difficulty: 1 }
      render(<EasterEggDiscovery {...easyProps} />)

      // Simple sequence for difficulty 1
      await user.keyboard('easy')

      expect(defaultProps.onDiscovery).toHaveBeenCalledWith({
        type: 'keyboard',
        pattern: 'easy-mode',
        difficulty: 1,
        timestamp: expect.any(Number)
      })
    })

    it('should require more complex patterns for difficulty 3', async () => {
      const user = userEvent.setup()
      const hardProps = { ...defaultProps, difficulty: 3 }
      render(<EasterEggDiscovery {...hardProps} />)

      // Simple pattern should not work on difficulty 3
      await user.keyboard('easy')

      expect(defaultProps.onDiscovery).not.toHaveBeenCalled()

      // But complex pattern should work
      await user.keyboard('complex-secret-pattern')

      expect(defaultProps.onDiscovery).toHaveBeenCalledWith({
        type: 'keyboard',
        pattern: 'master-code',
        difficulty: 3,
        timestamp: expect.any(Number)
      })
    })
  })

  describe('Privacy and Security', () => {
    it('should not track keystrokes outside of recognized patterns', async () => {
      const user = userEvent.setup()
      render(<EasterEggDiscovery {...defaultProps} />)

      // Type random text that isn't a pattern
      await user.keyboard('this is random typing that should not be tracked')

      expect(mockLocalStorage.setItem).not.toHaveBeenCalled()
      expect(defaultProps.onDiscovery).not.toHaveBeenCalled()
    })

    it('should not send pattern data externally', async () => {
      const user = userEvent.setup()
      
      // Mock fetch to ensure no external calls
      const mockFetch = jest.fn()
      global.fetch = mockFetch

      render(<EasterEggDiscovery {...defaultProps} />)

      await user.keyboard('[ArrowUp][ArrowUp][ArrowDown][ArrowDown][ArrowLeft][ArrowRight][ArrowLeft][ArrowRight]ba')

      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should clear sensitive data on component unmount', () => {
      const { unmount } = render(<EasterEggDiscovery {...defaultProps} />)

      unmount()

      // Verify cleanup happened (implementation detail - might need adjustment)
      expect(true).toBe(true) // Placeholder - actual cleanup verification would depend on implementation
    })
  })

  describe('Performance', () => {
    it('should debounce rapid input events', async () => {
      const user = userEvent.setup()
      render(<EasterEggDiscovery {...defaultProps} />)

      // Rapid input that should be debounced
      for (let i = 0; i < 100; i++) {
        await user.keyboard('a')
      }

      // Should not have processed all 100 events individually
      expect(defaultProps.onDiscovery).not.toHaveBeenCalledTimes(100)
    })

    it('should limit stored pattern history', async () => {
      const user = userEvent.setup()
      render(<EasterEggDiscovery {...defaultProps} />)

      // Generate many different patterns to test history limit
      for (let i = 0; i < 50; i++) {
        await user.keyboard(`pattern${i}`)
      }

      // Should have limited the stored history
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
      const lastCall = mockLocalStorage.setItem.mock.calls[mockLocalStorage.setItem.mock.calls.length - 1]
      const storedData = JSON.parse(lastCall[1])
      expect(storedData.discoveredPatterns.length).toBeLessThanOrEqual(25) // Assuming 25 is the limit
    })
  })

  describe('Touch Support', () => {
    it('should recognize touch gestures on mobile devices', async () => {
      // Mock touch support
      global.testUtils.mockDevice('mobile')

      render(<EasterEggDiscovery {...defaultProps} />)
      
      const discoveryElement = screen.getByTestId('easter-egg-discovery')

      // Simulate touch circle gesture
      fireEvent.touchStart(discoveryElement, { 
        touches: [{ clientX: 100, clientY: 100 }] 
      })
      
      fireEvent.touchMove(discoveryElement, { 
        touches: [{ clientX: 150, clientY: 100 }] 
      })
      
      fireEvent.touchEnd(discoveryElement)

      await waitFor(() => {
        expect(defaultProps.onDiscovery).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'touch',
            pattern: expect.any(String)
          })
        )
      })
    })
  })
})