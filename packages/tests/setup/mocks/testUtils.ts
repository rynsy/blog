/**
 * Test Utilities for Vitest Testing
 * Provides utility functions for mocking device behavior and other test scenarios
 */

import { vi } from 'vitest'

export const testUtils = {
  // Mock device type for responsive/mobile testing
  mockDevice: (deviceType: 'mobile' | 'tablet' | 'desktop') => {
    const mockUserAgent = {
      mobile: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
      tablet: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
      desktop: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }

    const mockMaxTouchPoints = {
      mobile: 5,
      tablet: 10,
      desktop: 0
    }

    // Mock navigator.userAgent
    Object.defineProperty(navigator, 'userAgent', {
      value: mockUserAgent[deviceType],
      writable: true,
      configurable: true
    })

    // Mock navigator.maxTouchPoints
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: mockMaxTouchPoints[deviceType],
      writable: true,
      configurable: true
    })

    // Mock screen dimensions
    const mockScreen = {
      mobile: { width: 375, height: 667 },
      tablet: { width: 768, height: 1024 },
      desktop: { width: 1920, height: 1080 }
    }

    Object.defineProperty(screen, 'width', {
      value: mockScreen[deviceType].width,
      writable: true,
      configurable: true
    })

    Object.defineProperty(screen, 'height', {
      value: mockScreen[deviceType].height,
      writable: true,
      configurable: true
    })

    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', {
      value: mockScreen[deviceType].width,
      writable: true,
      configurable: true
    })

    Object.defineProperty(window, 'innerHeight', {
      value: mockScreen[deviceType].height,
      writable: true,
      configurable: true
    })
  },

  // Mock reduced motion preferences
  mockReducedMotion: (reducedMotion: boolean) => {
    // Mock matchMedia for prefers-reduced-motion
    window.matchMedia = vi.fn().mockImplementation((query: string) => {
      if (query === '(prefers-reduced-motion: reduce)') {
        return {
          matches: reducedMotion,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn()
        }
      }
      
      // Default return for other queries
      return {
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
      }
    })
  },

  // Mock high contrast preferences
  mockHighContrast: (highContrast: boolean) => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => {
      if (query === '(prefers-contrast: high)') {
        return {
          matches: highContrast,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn()
        }
      }
      
      return {
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
      }
    })
  },

  // Mock page visibility API
  triggerVisibilityChange: (hidden: boolean) => {
    Object.defineProperty(document, 'hidden', {
      value: hidden,
      writable: true,
      configurable: true
    })

    Object.defineProperty(document, 'visibilityState', {
      value: hidden ? 'hidden' : 'visible',
      writable: true,
      configurable: true
    })

    // Trigger the visibilitychange event
    const event = new Event('visibilitychange')
    document.dispatchEvent(event)
  },

  // Mock network connection
  mockConnection: (effectiveType: '2g' | '3g' | '4g' | 'slow-2g' = '4g', downlink: number = 10) => {
    const mockConnection = {
      effectiveType,
      downlink,
      rtt: effectiveType === 'slow-2g' ? 2000 : effectiveType === '2g' ? 1400 : effectiveType === '3g' ? 270 : 85,
      saveData: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }

    Object.defineProperty(navigator, 'connection', {
      value: mockConnection,
      writable: true,
      configurable: true
    })
  },

  // Mock battery API
  mockBattery: async (level: number = 1.0, charging: boolean = true) => {
    const mockBattery = {
      level,
      charging,
      chargingTime: charging ? 3600 : Infinity,
      dischargingTime: charging ? Infinity : Math.floor(level * 7200),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }

    // Mock getBattery function
    ;(navigator as any).getBattery = vi.fn().mockResolvedValue(mockBattery)
    
    return mockBattery
  },

  // Mock geolocation
  mockGeolocation: (coords?: { latitude: number, longitude: number, accuracy?: number }) => {
    const mockGeolocation = {
      getCurrentPosition: vi.fn((success, error, options) => {
        if (coords) {
          success({
            coords: {
              latitude: coords.latitude,
              longitude: coords.longitude,
              accuracy: coords.accuracy || 100,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null
            },
            timestamp: Date.now()
          })
        } else {
          error({
            code: 1,
            message: 'Geolocation access denied'
          })
        }
      }),
      watchPosition: vi.fn(),
      clearWatch: vi.fn()
    }

    Object.defineProperty(navigator, 'geolocation', {
      value: mockGeolocation,
      writable: true,
      configurable: true
    })
  },

  // Mock performance timing
  mockPerformanceTiming: (timing: Partial<PerformanceTiming>) => {
    const defaultTiming = {
      connectEnd: 1500,
      connectStart: 1400,
      domComplete: 5000,
      domContentLoadedEventEnd: 3000,
      domContentLoadedEventStart: 2900,
      domInteractive: 2800,
      domLoading: 2000,
      domainLookupEnd: 1300,
      domainLookupStart: 1200,
      fetchStart: 1000,
      loadEventEnd: 5200,
      loadEventStart: 5100,
      navigationStart: 0,
      redirectEnd: 0,
      redirectStart: 0,
      requestStart: 1600,
      responseEnd: 2000,
      responseStart: 1800,
      unloadEventEnd: 100,
      unloadEventStart: 50,
      ...timing
    }

    Object.defineProperty(performance, 'timing', {
      value: defaultTiming,
      writable: true,
      configurable: true
    })
  },

  // Reset all mocks to defaults
  resetAllMocks: () => {
    vi.clearAllMocks()
    
    // Reset device to desktop defaults
    testUtils.mockDevice('desktop')
    testUtils.mockReducedMotion(false)
    testUtils.mockHighContrast(false)
    
    // Reset page visibility
    Object.defineProperty(document, 'hidden', {
      value: false,
      writable: true,
      configurable: true
    })
  }
}

// Make testUtils available globally for tests
declare global {
  var testUtils: typeof testUtils
}

global.testUtils = testUtils

export default testUtils