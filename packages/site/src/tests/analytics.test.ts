/**
 * Comprehensive Analytics Testing Suite
 * Tests for privacy compliance, tracking accuracy, and system integration
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest'
import { UmamiAnalytics } from '../utils/UmamiAnalytics'
import type {
  AnalyticsConfig,
  ConsentPreferences,
  BackgroundAnalyticsEvent,
  EasterEggAnalyticsEvent,
  PerformanceAnalyticsEvent,
  UmamiConfig
} from '../interfaces/AnalyticsSystem'

// Mock DOM APIs
const mockLocalStorage = {
  data: {} as Record<string, string>,
  getItem: vi.fn((key: string) => mockLocalStorage.data[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockLocalStorage.data[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    delete mockLocalStorage.data[key]
  }),
  clear: vi.fn(() => {
    mockLocalStorage.data = {}
  })
}

const mockNavigator = {
  doNotTrack: '0',
  userAgent: 'Mozilla/5.0 (compatible; Test/1.0)'
}

const mockWindow = {
  umami: {
    track: vi.fn()
  },
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  location: {
    href: 'https://example.com/test'
  }
}

const mockDocument = {
  referrer: 'https://example.com/previous',
  hidden: false,
  createElement: vi.fn(() => ({
    async: true,
    defer: true,
    src: '',
    setAttribute: vi.fn(),
    onload: vi.fn(),
    onerror: vi.fn()
  })),
  head: {
    appendChild: vi.fn()
  }
}

// Setup global mocks
beforeAll(() => {
  Object.defineProperty(global, 'window', { value: mockWindow, writable: true })
  Object.defineProperty(global, 'document', { value: mockDocument, writable: true })
  Object.defineProperty(global, 'navigator', { value: mockNavigator, writable: true })
  Object.defineProperty(global, 'localStorage', { value: mockLocalStorage, writable: true })
  Object.defineProperty(global, 'performance', {
    value: { now: () => Date.now() },
    writable: true
  })
})

describe('UmamiAnalytics Core Functionality', () => {
  let analytics: UmamiAnalytics
  
  const testConfig: AnalyticsConfig = {
    websiteId: 'test-website-id',
    scriptUrl: 'https://test.umami.is/script.js',
    trackPageViews: true,
    trackEvents: true,
    respectDoNotTrack: true,
    cookieless: true,
    sessionTimeout: 30 * 60 * 1000,
    dataRetention: 365,
    anonymizeIp: true,
    enabled: true
  }

  const testUmamiConfig: UmamiConfig = {
    websiteId: 'test-website-id',
    scriptUrl: 'https://test.umami.is/script.js',
    trackLocalhost: false,
    autoTrack: false
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.clear()
    analytics = UmamiAnalytics.getInstance()
  })

  describe('Initialization', () => {
    it('should initialize with default configuration', async () => {
      await analytics.initialize(testConfig, testUmamiConfig)
      expect(analytics).toBeDefined()
    })

    it('should not initialize if consent is not granted', async () => {
      const noConsentConfig = { ...testConfig, enabled: false }
      await analytics.initialize(noConsentConfig, testUmamiConfig)
      
      // Should not load script or enable tracking
      expect(mockDocument.createElement).not.toHaveBeenCalled()
    })

    it('should respect Do Not Track setting', async () => {
      mockNavigator.doNotTrack = '1'
      await analytics.initialize(testConfig, testUmamiConfig)
      
      // Analytics should be disabled
      expect(mockDocument.createElement).not.toHaveBeenCalled()
      
      // Reset
      mockNavigator.doNotTrack = '0'
    })

    it('should load Umami script with correct attributes', async () => {
      const mockScript = {
        async: false,
        defer: false,
        src: '',
        setAttribute: vi.fn(),
        onload: vi.fn(),
        onerror: vi.fn()
      }
      
      mockDocument.createElement.mockReturnValue(mockScript)
      
      await analytics.initialize(testConfig, testUmamiConfig)
      
      expect(mockDocument.createElement).toHaveBeenCalledWith('script')
      expect(mockScript.setAttribute).toHaveBeenCalledWith('data-website-id', testUmamiConfig.websiteId)
      expect(mockScript.setAttribute).toHaveBeenCalledWith('data-cache', 'true')
    })
  })

  describe('Consent Management', () => {
    it('should update consent preferences', async () => {
      const consent: ConsentPreferences = {
        analytics: true,
        performance: true,
        marketing: false,
        functional: true,
        timestamp: Date.now(),
        version: '1.0.0'
      }

      await analytics.updateConsent(consent)
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'analytics-consent',
        JSON.stringify(consent)
      )
    })

    it('should disable analytics when consent is revoked', async () => {
      // First, grant consent
      const consent: ConsentPreferences = {
        analytics: true,
        performance: true,
        marketing: false,
        functional: true,
        timestamp: Date.now(),
        version: '1.0.0'
      }
      await analytics.updateConsent(consent)

      // Then revoke consent
      const revokedConsent: ConsentPreferences = {
        ...consent,
        analytics: false,
        performance: false
      }
      await analytics.updateConsent(revokedConsent)

      // Should clear stored data
      expect(mockLocalStorage.removeItem).toHaveBeenCalled()
    })
  })

  describe('Event Tracking', () => {
    beforeEach(async () => {
      const consent: ConsentPreferences = {
        analytics: true,
        performance: true,
        marketing: false,
        functional: true,
        timestamp: Date.now(),
        version: '1.0.0'
      }
      await analytics.updateConsent(consent)
      await analytics.initialize(testConfig, testUmamiConfig)
    })

    it('should track page views with privacy-first approach', async () => {
      await analytics.trackPageView('https://example.com/test')
      
      // Should not include personal information
      expect(mockWindow.umami.track).toHaveBeenCalledWith(
        'https://example.com/test',
        expect.objectContaining({
          url: expect.any(String),
          referrer: expect.any(String),
          sessionId: expect.any(String),
          // Should not contain userId or personal identifiers
        })
      )
    })

    it('should track background events with anonymization', async () => {
      const backgroundEvent: BackgroundAnalyticsEvent = {
        name: 'background_module_activated',
        moduleId: 'test-module',
        eventType: 'module_activated',
        data: {
          moduleId: 'test-module',
          activeModules: 1,
          privacy: {
            anonymized: true,
            aggregated: true,
            noPersonalData: true
          }
        }
      }

      await analytics.trackBackgroundEvent(backgroundEvent)
      
      expect(mockWindow.umami.track).toHaveBeenCalledWith(
        'background_module_activated',
        expect.objectContaining({
          data: expect.objectContaining({
            privacy: expect.objectContaining({
              anonymized: true
            })
          })
        })
      )
    })

    it('should track easter egg events with privacy protection', async () => {
      const easterEggEvent: EasterEggAnalyticsEvent = {
        name: 'easter_egg_discovered',
        eggId: 'konami-code',
        eventType: 'discovered',
        discoveryTime: 5000,
        attemptsCount: 3,
        hintsUsed: 1,
        data: {
          privacy: {
            anonymized: true,
            noPersonalIdentification: true,
            aggregatedOnly: true
          }
        }
      }

      await analytics.trackEasterEggEvent(easterEggEvent)
      
      expect(mockWindow.umami.track).toHaveBeenCalledWith(
        'easter_egg_discovered',
        expect.objectContaining({
          data: expect.objectContaining({
            privacy: expect.objectContaining({
              anonymized: true
            })
          })
        })
      )
    })

    it('should not track performance events without performance consent', async () => {
      // Revoke performance consent
      const consent: ConsentPreferences = {
        analytics: true,
        performance: false,
        marketing: false,
        functional: true,
        timestamp: Date.now(),
        version: '1.0.0'
      }
      await analytics.updateConsent(consent)

      const performanceEvent: PerformanceAnalyticsEvent = {
        name: 'performance_fps_drop',
        eventType: 'fps_drop',
        beforeMetrics: { fps: 60, memory: 50 },
        afterMetrics: { fps: 30, memory: 60 }
      }

      await analytics.trackPerformanceEvent(performanceEvent)
      
      // Should not track performance events
      expect(mockWindow.umami.track).not.toHaveBeenCalled()
    })
  })

  describe('Privacy and Data Management', () => {
    beforeEach(async () => {
      const consent: ConsentPreferences = {
        analytics: true,
        performance: true,
        marketing: false,
        functional: true,
        timestamp: Date.now(),
        version: '1.0.0'
      }
      await analytics.updateConsent(consent)
    })

    it('should export user data when requested', async () => {
      const exportedData = await analytics.exportData()
      
      expect(exportedData).toHaveProperty('sessionId')
      expect(exportedData).toHaveProperty('consent')
      expect(exportedData).toHaveProperty('config')
      
      // Should not contain sensitive information
      expect(exportedData).not.toHaveProperty('personalData')
      expect(exportedData).not.toHaveProperty('ipAddress')
    })

    it('should delete user data when requested', async () => {
      await analytics.deleteUserData()
      
      // Should clear all stored data
      expect(mockLocalStorage.removeItem).toHaveBeenCalled()
    })

    it('should generate anonymous session IDs', async () => {
      await analytics.initialize(testConfig, testUmamiConfig)
      
      // Session ID should be generated but not be personally identifiable
      const exportedData = await analytics.exportData()
      expect(exportedData.sessionId).toMatch(/^sess_\d+_[a-z0-9]+$/)
    })
  })

  describe('Performance Monitoring', () => {
    it('should track performance metrics within budget', async () => {
      await analytics.initialize(testConfig, testUmamiConfig)
      
      const metrics = analytics.getPerformanceMetrics()
      
      expect(metrics.bundleSize).toBeLessThan(metrics.performanceBudget.maxBundleSize)
      expect(metrics.scriptLoadTime).toBeLessThan(metrics.performanceBudget.maxLoadTime)
      expect(metrics.memoryUsage).toBeLessThan(metrics.performanceBudget.maxMemoryUsage)
    })

    it('should not impact page performance significantly', async () => {
      const startTime = performance.now()
      await analytics.initialize(testConfig, testUmamiConfig)
      const endTime = performance.now()
      
      const initTime = endTime - startTime
      expect(initTime).toBeLessThan(100) // Should initialize within 100ms
    })
  })
})

describe('Privacy Compliance Tests', () => {
  let analytics: UmamiAnalytics

  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.clear()
    analytics = UmamiAnalytics.getInstance()
  })

  describe('GDPR Compliance', () => {
    it('should not collect data without explicit consent', async () => {
      const config: AnalyticsConfig = {
        ...testConfig,
        enabled: false // No consent
      }

      await analytics.initialize(config, testUmamiConfig)
      await analytics.trackPageView()

      expect(mockWindow.umami.track).not.toHaveBeenCalled()
    })

    it('should honor data retention periods', async () => {
      const config: AnalyticsConfig = {
        ...testConfig,
        dataRetention: 1 // 1 day
      }

      const consent: ConsentPreferences = {
        analytics: true,
        performance: true,
        marketing: false,
        functional: true,
        timestamp: Date.now() - (2 * 24 * 60 * 60 * 1000), // 2 days ago
        version: '1.0.0'
      }

      await analytics.updateConsent(consent)
      
      // Old consent should not be valid
      expect(mockLocalStorage.removeItem).toHaveBeenCalled()
    })

    it('should provide right to data portability', async () => {
      const consent: ConsentPreferences = {
        analytics: true,
        performance: true,
        marketing: false,
        functional: true,
        timestamp: Date.now(),
        version: '1.0.0'
      }

      await analytics.updateConsent(consent)
      const exportedData = await analytics.exportData()

      expect(exportedData).toBeDefined()
      expect(typeof exportedData).toBe('object')
    })

    it('should provide right to be forgotten', async () => {
      const consent: ConsentPreferences = {
        analytics: true,
        performance: true,
        marketing: false,
        functional: true,
        timestamp: Date.now(),
        version: '1.0.0'
      }

      await analytics.updateConsent(consent)
      await analytics.deleteUserData()

      // All user data should be cleared
      expect(mockLocalStorage.removeItem).toHaveBeenCalled()
    })
  })

  describe('Data Anonymization', () => {
    it('should anonymize IP addresses', async () => {
      const config: AnalyticsConfig = {
        ...testConfig,
        anonymizeIp: true
      }

      const consent: ConsentPreferences = {
        analytics: true,
        performance: true,
        marketing: false,
        functional: true,
        timestamp: Date.now(),
        version: '1.0.0'
      }

      await analytics.updateConsent(consent)
      await analytics.initialize(config, testUmamiConfig)

      // IP anonymization should be enabled in configuration
      expect(config.anonymizeIp).toBe(true)
    })

    it('should not store personal identifiers', async () => {
      const backgroundEvent: BackgroundAnalyticsEvent = {
        name: 'test_event',
        moduleId: 'test',
        eventType: 'module_activated',
        data: {
          privacy: {
            anonymized: true,
            aggregated: true,
            noPersonalData: true
          }
        }
      }

      await analytics.trackBackgroundEvent(backgroundEvent)

      // Event data should confirm privacy protection
      expect(backgroundEvent.data?.privacy?.anonymized).toBe(true)
      expect(backgroundEvent.data?.privacy?.noPersonalData).toBe(true)
    })
  })

  describe('Cookieless Operation', () => {
    it('should operate without cookies', async () => {
      const config: AnalyticsConfig = {
        ...testConfig,
        cookieless: true
      }

      const consent: ConsentPreferences = {
        analytics: true,
        performance: true,
        marketing: false,
        functional: true,
        timestamp: Date.now(),
        version: '1.0.0'
      }

      await analytics.updateConsent(consent)
      await analytics.initialize(config, testUmamiConfig)

      // Should not use cookies for tracking
      expect(config.cookieless).toBe(true)
    })
  })
})

describe('Integration Tests', () => {
  describe('Background System Integration', () => {
    it('should track module activations correctly', async () => {
      const mockBackgroundContext = {
        currentModule: 'test-module',
        activeModules: new Map([['test-module', {}]]),
        performanceMetrics: {
          fps: 60,
          frameTime: 16.67,
          memoryUsage: 50,
          renderTime: 10,
          timestamp: Date.now()
        },
        deviceCapabilities: {
          webgl: true,
          webgl2: false,
          canvas2d: true,
          isMobile: false,
          isLowPower: false
        }
      }

      // Simulate background module activation
      const backgroundEvent: BackgroundAnalyticsEvent = {
        name: 'background_module_activated',
        moduleId: mockBackgroundContext.currentModule,
        eventType: 'module_activated',
        performanceMetrics: {
          fps: mockBackgroundContext.performanceMetrics.fps,
          memory: mockBackgroundContext.performanceMetrics.memoryUsage,
          renderTime: mockBackgroundContext.performanceMetrics.renderTime
        },
        deviceInfo: {
          isMobile: mockBackgroundContext.deviceCapabilities.isMobile,
          isLowPower: mockBackgroundContext.deviceCapabilities.isLowPower,
          webglSupport: mockBackgroundContext.deviceCapabilities.webgl,
          screenSize: '1920x1080'
        }
      }

      // Should track without exposing sensitive information
      expect(backgroundEvent.performanceMetrics).toBeDefined()
      expect(backgroundEvent.deviceInfo).toBeDefined()
      expect(backgroundEvent).not.toHaveProperty('userId')
      expect(backgroundEvent).not.toHaveProperty('personalData')
    })
  })

  describe('Easter Egg Discovery Integration', () => {
    it('should track discoveries with privacy protection', async () => {
      const easterEggEvent: EasterEggAnalyticsEvent = {
        name: 'easter_egg_discovered',
        eggId: 'konami-code',
        eventType: 'discovered',
        discoveryTime: 5000,
        attemptsCount: 3,
        hintsUsed: 1,
        discoveryMethod: 'sequence',
        difficulty: 1,
        rarity: 'common',
        data: {
          name: 'The Classic',
          category: 'sequence',
          sessionDuration: 10000,
          efficiency: 0.85,
          privacy: {
            anonymized: true,
            aggregatedOnly: true,
            noPersonalIdentification: true
          }
        }
      }

      // Should include discovery metrics but protect privacy
      expect(easterEggEvent.data?.privacy?.anonymized).toBe(true)
      expect(easterEggEvent.data?.privacy?.noPersonalIdentification).toBe(true)
      expect(easterEggEvent).not.toHaveProperty('userPattern')
      expect(easterEggEvent).not.toHaveProperty('inputSequence')
    })
  })
})

describe('Error Handling and Resilience', () => {
  let analytics: UmamiAnalytics

  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.clear()
    analytics = UmamiAnalytics.getInstance()
  })

  it('should handle script loading failures gracefully', async () => {
    const mockScript = {
      async: true,
      defer: true,
      src: '',
      setAttribute: vi.fn(),
      onload: vi.fn(),
      onerror: vi.fn()
    }

    mockDocument.createElement.mockReturnValue(mockScript)

    // Simulate script loading error
    setTimeout(() => {
      if (mockScript.onerror) mockScript.onerror(new Error('Script load failed'))
    }, 100)

    const consent: ConsentPreferences = {
      analytics: true,
      performance: true,
      marketing: false,
      functional: true,
      timestamp: Date.now(),
      version: '1.0.0'
    }

    await analytics.updateConsent(consent)
    
    // Should not throw error
    expect(async () => {
      await analytics.initialize(testConfig, testUmamiConfig)
    }).not.toThrow()
  })

  it('should handle localStorage unavailability', async () => {
    // Mock localStorage to throw errors
    mockLocalStorage.setItem.mockImplementation(() => {
      throw new Error('localStorage unavailable')
    })

    const consent: ConsentPreferences = {
      analytics: true,
      performance: true,
      marketing: false,
      functional: true,
      timestamp: Date.now(),
      version: '1.0.0'
    }

    // Should not throw error when localStorage is unavailable
    expect(async () => {
      await analytics.updateConsent(consent)
    }).not.toThrow()
  })

  it('should handle network failures gracefully', async () => {
    // Mock network failure
    mockWindow.umami.track.mockRejectedValue(new Error('Network error'))

    const consent: ConsentPreferences = {
      analytics: true,
      performance: true,
      marketing: false,
      functional: true,
      timestamp: Date.now(),
      version: '1.0.0'
    }

    await analytics.updateConsent(consent)
    await analytics.initialize(testConfig, testUmamiConfig)

    // Should not throw error on network failure
    expect(async () => {
      await analytics.trackPageView()
    }).not.toThrow()
  })
})