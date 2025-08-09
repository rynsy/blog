/**
 * Analytics Context Provider
 * Privacy-first analytics integration with background system tracking
 */

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { useTheme } from './ThemeContext'
import { useBackgroundV3 } from './BackgroundContextV3'
import { analytics } from '../utils/UmamiAnalytics'
import type {
  AnalyticsConfig,
  ConsentPreferences,
  BackgroundAnalyticsEvent,
  EasterEggAnalyticsEvent,
  PerformanceAnalyticsEvent,
  AccessibilityAnalyticsEvent,
  UmamiConfig,
  LocalAnalytics,
  AnalyticsPerformance,
  GDPRCompliance,
  CCPACompliance
} from '../interfaces/AnalyticsSystem'

interface AnalyticsContextType {
  // State
  isEnabled: boolean
  consent: ConsentPreferences | null
  performanceMetrics: AnalyticsPerformance
  
  // Configuration
  updateConfig: (config: Partial<AnalyticsConfig>) => void
  updateConsent: (consent: ConsentPreferences) => void
  
  // Tracking methods
  trackPageView: (url?: string, referrer?: string) => Promise<void>
  trackBackgroundEvent: (event: Omit<BackgroundAnalyticsEvent, 'timestamp' | 'sessionId' | 'userId'>) => Promise<void>
  trackEasterEggEvent: (event: Omit<EasterEggAnalyticsEvent, 'timestamp' | 'sessionId'>) => Promise<void>
  trackPerformanceEvent: (event: Omit<PerformanceAnalyticsEvent, 'timestamp' | 'sessionId'>) => Promise<void>
  trackAccessibilityEvent: (event: Omit<AccessibilityAnalyticsEvent, 'timestamp' | 'sessionId'>) => Promise<void>
  
  // Privacy and compliance
  exportUserData: () => Promise<object>
  deleteUserData: () => Promise<void>
  
  // Utility
  getPerformanceMetrics: () => AnalyticsPerformance
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined)

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext)
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider')
  }
  return context
}

interface AnalyticsProviderProps {
  children: ReactNode
  config?: Partial<AnalyticsConfig>
  umamiConfig?: Partial<UmamiConfig>
  localConfig?: Partial<LocalAnalytics>
  gdprCompliance?: GDPRCompliance
  ccpaCompliance?: CCPACompliance
}

const DEFAULT_CONFIG: AnalyticsConfig = {
  websiteId: process.env.GATSBY_UMAMI_WEBSITE_ID || '',
  scriptUrl: process.env.GATSBY_UMAMI_SCRIPT_URL || 'https://analytics.umami.is/script.js',
  trackPageViews: true,
  trackEvents: true,
  respectDoNotTrack: true,
  cookieless: true,
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  dataRetention: 365, // 1 year
  anonymizeIp: true,
  enabled: !!process.env.GATSBY_UMAMI_WEBSITE_ID
}

const DEFAULT_UMAMI_CONFIG: UmamiConfig = {
  websiteId: process.env.GATSBY_UMAMI_WEBSITE_ID || '',
  scriptUrl: process.env.GATSBY_UMAMI_SCRIPT_URL || 'https://analytics.umami.is/script.js',
  trackLocalhost: process.env.NODE_ENV === 'development',
  autoTrack: false // We handle tracking manually for privacy compliance
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({
  children,
  config = {},
  umamiConfig = {},
  localConfig,
  gdprCompliance,
  ccpaCompliance
}) => {
  const { theme } = useTheme()
  const backgroundContext = useBackgroundV3()
  
  const [isEnabled, setIsEnabled] = useState(false)
  const [consent, setConsent] = useState<ConsentPreferences | null>(null)
  const [performanceMetrics, setPerformanceMetrics] = useState<AnalyticsPerformance>({
    bundleSize: 0,
    scriptLoadTime: 0,
    eventQueueTime: 0,
    networkLatency: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    batterySavingMode: false,
    performanceBudget: {
      maxBundleSize: 3000,
      maxLoadTime: 1000,
      maxMemoryUsage: 5 * 1024 * 1024
    }
  })
  
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  const finalUmamiConfig = { ...DEFAULT_UMAMI_CONFIG, ...umamiConfig }

  // Initialize analytics when consent is available
  useEffect(() => {
    initializeAnalytics()
  }, [consent])

  // Track background system events
  useEffect(() => {
    if (!isEnabled || !backgroundContext) return

    const handleModuleChange = async () => {
      if (backgroundContext.currentModule) {
        await trackBackgroundEvent({
          name: 'background_module_activated',
          moduleId: backgroundContext.currentModule,
          eventType: 'module_activated',
          data: {
            moduleId: backgroundContext.currentModule,
            activeModules: backgroundContext.activeModules.size,
            performance: backgroundContext.performanceMetrics,
            deviceCapabilities: backgroundContext.deviceCapabilities
          }
        })
      }
    }

    handleModuleChange()
  }, [backgroundContext?.currentModule, isEnabled])

  // Track performance metrics
  useEffect(() => {
    if (!isEnabled || !backgroundContext?.performanceMetrics) return

    const metrics = backgroundContext.performanceMetrics
    
    // Track significant performance changes
    if (metrics.fps < 30 || metrics.memoryUsage > 100) {
      trackPerformanceEvent({
        name: 'performance_issue',
        eventType: 'fps_drop',
        beforeMetrics: {
          fps: metrics.fps,
          memory: metrics.memoryUsage
        },
        data: {
          severity: metrics.fps < 20 ? 'critical' : 'warning',
          activeModules: backgroundContext.activeModules.size,
          deviceType: backgroundContext.deviceCapabilities.isMobile ? 'mobile' : 'desktop'
        }
      })
    }
  }, [backgroundContext?.performanceMetrics, isEnabled])

  // Detect accessibility features
  useEffect(() => {
    if (!isEnabled || typeof window === 'undefined') return

    const detectAccessibilityFeatures = async () => {
      // Detect screen reader
      if (window.navigator.userAgent.includes('NVDA') || 
          window.navigator.userAgent.includes('JAWS') ||
          window.speechSynthesis) {
        await trackAccessibilityEvent({
          name: 'accessibility_feature_detected',
          eventType: 'screen_reader_detected',
          feature: 'screen_reader',
          enabled: true,
          userInitiated: false
        })
      }

      // Detect reduced motion preference
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (prefersReducedMotion) {
        await trackAccessibilityEvent({
          name: 'accessibility_preference_detected',
          eventType: 'reduced_motion_enabled',
          feature: 'reduced_motion',
          enabled: true,
          userInitiated: true
        })
      }

      // Detect high contrast mode
      const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches
      if (prefersHighContrast) {
        await trackAccessibilityEvent({
          name: 'accessibility_preference_detected',
          eventType: 'high_contrast_enabled',
          feature: 'high_contrast',
          enabled: true,
          userInitiated: true
        })
      }
    }

    detectAccessibilityFeatures()
  }, [isEnabled])

  // Update performance metrics periodically
  useEffect(() => {
    if (!isEnabled) return

    const updatePerformanceMetrics = () => {
      const metrics = analytics.getPerformanceMetrics()
      setPerformanceMetrics(metrics)
    }

    const interval = setInterval(updatePerformanceMetrics, 5000) // Every 5 seconds
    return () => clearInterval(interval)
  }, [isEnabled])

  const initializeAnalytics = useCallback(async () => {
    if (!consent?.analytics) {
      setIsEnabled(false)
      return
    }

    try {
      await analytics.initialize(finalConfig, finalUmamiConfig, localConfig)
      setIsEnabled(true)
      
      // Track initialization
      await analytics.trackEvent({
        name: 'analytics_initialized',
        data: {
          version: '1.0.0',
          provider: 'umami',
          theme,
          consent: {
            analytics: consent.analytics,
            performance: consent.performance,
            marketing: consent.marketing
          }
        }
      })
    } catch (error) {
      console.error('Failed to initialize analytics:', error)
      setIsEnabled(false)
    }
  }, [consent, finalConfig, finalUmamiConfig, localConfig, theme])

  const updateConfig = useCallback((newConfig: Partial<AnalyticsConfig>) => {
    // Re-initialize with new config if already enabled
    if (isEnabled) {
      analytics.initialize({ ...finalConfig, ...newConfig }, finalUmamiConfig, localConfig)
    }
  }, [finalConfig, finalUmamiConfig, localConfig, isEnabled])

  const updateConsent = useCallback(async (newConsent: ConsentPreferences) => {
    setConsent(newConsent)
    await analytics.updateConsent(newConsent)
  }, [])

  const trackPageView = useCallback(async (url?: string, referrer?: string) => {
    if (!isEnabled) return
    await analytics.trackPageView(url, referrer)
  }, [isEnabled])

  const trackBackgroundEvent = useCallback(async (
    event: Omit<BackgroundAnalyticsEvent, 'timestamp' | 'sessionId' | 'userId'>
  ) => {
    if (!isEnabled) return
    await analytics.trackBackgroundEvent(event as BackgroundAnalyticsEvent)
  }, [isEnabled])

  const trackEasterEggEvent = useCallback(async (
    event: Omit<EasterEggAnalyticsEvent, 'timestamp' | 'sessionId'>
  ) => {
    if (!isEnabled) return
    await analytics.trackEasterEggEvent(event as EasterEggAnalyticsEvent)
  }, [isEnabled])

  const trackPerformanceEvent = useCallback(async (
    event: Omit<PerformanceAnalyticsEvent, 'timestamp' | 'sessionId'>
  ) => {
    if (!isEnabled || !consent?.performance) return
    await analytics.trackPerformanceEvent(event as PerformanceAnalyticsEvent)
  }, [isEnabled, consent?.performance])

  const trackAccessibilityEvent = useCallback(async (
    event: Omit<AccessibilityAnalyticsEvent, 'timestamp' | 'sessionId'>
  ) => {
    if (!isEnabled) return
    await analytics.trackAccessibilityEvent(event as AccessibilityAnalyticsEvent)
  }, [isEnabled])

  const exportUserData = useCallback(async () => {
    return await analytics.exportData()
  }, [])

  const deleteUserData = useCallback(async () => {
    await analytics.deleteUserData()
  }, [])

  const getPerformanceMetrics = useCallback(() => {
    return analytics.getPerformanceMetrics()
  }, [])

  const contextValue: AnalyticsContextType = {
    isEnabled,
    consent,
    performanceMetrics,
    updateConfig,
    updateConsent,
    trackPageView,
    trackBackgroundEvent,
    trackEasterEggEvent,
    trackPerformanceEvent,
    trackAccessibilityEvent,
    exportUserData,
    deleteUserData,
    getPerformanceMetrics
  }

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  )
}

export default AnalyticsProvider