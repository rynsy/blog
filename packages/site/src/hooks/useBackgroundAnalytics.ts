/**
 * Background Analytics Hook
 * Seamless integration between background system and analytics
 */

import { useEffect, useCallback, useRef } from 'react'
import { useBackgroundV3 } from '../contexts/BackgroundContextV3'
import { useAnalytics } from '../contexts/AnalyticsContext'
import type {
  BackgroundAnalyticsEvent,
  PerformanceAnalyticsEvent,
  PerformanceMetrics,
  DeviceCapabilities,
  ModuleConfiguration
} from '../interfaces/AnalyticsSystem'

interface BackgroundAnalyticsConfig {
  trackModuleActivation: boolean
  trackModuleDeactivation: boolean
  trackConfigurationChanges: boolean
  trackPerformanceIssues: boolean
  trackQualityAdjustments: boolean
  trackUserInteractions: boolean
  performanceThreshold: {
    minFPS: number
    maxMemoryMB: number
    maxRenderTime: number
  }
  batchInterval: number // ms
}

const DEFAULT_CONFIG: BackgroundAnalyticsConfig = {
  trackModuleActivation: true,
  trackModuleDeactivation: true,
  trackConfigurationChanges: true,
  trackPerformanceIssues: true,
  trackQualityAdjustments: true,
  trackUserInteractions: true,
  performanceThreshold: {
    minFPS: 30,
    maxMemoryMB: 100,
    maxRenderTime: 33 // ~30fps
  },
  batchInterval: 5000 // 5 seconds
}

export const useBackgroundAnalytics = (config: Partial<BackgroundAnalyticsConfig> = {}) => {
  const backgroundContext = useBackgroundV3()
  const analytics = useAnalytics()
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  
  // Refs to track previous values
  const previousModuleRef = useRef<string | null>(null)
  const previousActiveModulesRef = useRef<Set<string>>(new Set())
  const previousPerformanceRef = useRef<PerformanceMetrics | null>(null)
  const moduleConfigurationRef = useRef<Map<string, ModuleConfiguration>>(new Map())
  const eventBatchRef = useRef<BackgroundAnalyticsEvent[]>([])
  const lastBatchTimeRef = useRef<number>(Date.now())

  // Track module activations and deactivations
  useEffect(() => {
    if (!analytics.isEnabled || !backgroundContext) return

    const currentModule = backgroundContext.currentModule
    const previousModule = previousModuleRef.current

    if (currentModule !== previousModule) {
      // Module changed
      if (previousModule && finalConfig.trackModuleDeactivation) {
        trackModuleEvent({
          moduleId: previousModule,
          eventType: 'module_deactivated',
          data: {
            duration: Date.now() - (backgroundContext.performanceMetrics?.timestamp || Date.now()),
            reason: 'user_switched'
          }
        })
      }

      if (currentModule && finalConfig.trackModuleActivation) {
        trackModuleEvent({
          moduleId: currentModule,
          eventType: 'module_activated',
          data: {
            previousModule,
            activeModulesCount: backgroundContext.activeModules.size,
            deviceCapabilities: backgroundContext.deviceCapabilities
          }
        })
      }

      previousModuleRef.current = currentModule
    }
  }, [backgroundContext?.currentModule, analytics.isEnabled, finalConfig])

  // Track active modules changes
  useEffect(() => {
    if (!analytics.isEnabled || !backgroundContext) return

    const currentActiveModules = new Set(backgroundContext.activeModules.keys())
    const previousActiveModules = previousActiveModulesRef.current

    // Find newly activated modules
    const newlyActivated = Array.from(currentActiveModules).filter(
      moduleId => !previousActiveModules.has(moduleId)
    )

    // Find newly deactivated modules
    const newlyDeactivated = Array.from(previousActiveModules).filter(
      moduleId => !currentActiveModules.has(moduleId)
    )

    // Track newly activated modules
    newlyActivated.forEach(moduleId => {
      if (finalConfig.trackModuleActivation) {
        trackModuleEvent({
          moduleId,
          eventType: 'module_activated',
          data: {
            activationMethod: 'multi_module',
            totalActiveModules: currentActiveModules.size
          }
        })
      }
    })

    // Track newly deactivated modules
    newlyDeactivated.forEach(moduleId => {
      if (finalConfig.trackModuleDeactivation) {
        trackModuleEvent({
          moduleId,
          eventType: 'module_deactivated',
          data: {
            deactivationMethod: 'multi_module',
            remainingActiveModules: currentActiveModules.size
          }
        })
      }
    })

    previousActiveModulesRef.current = currentActiveModules
  }, [backgroundContext?.activeModules, analytics.isEnabled, finalConfig])

  // Track configuration changes
  useEffect(() => {
    if (!analytics.isEnabled || !backgroundContext || !finalConfig.trackConfigurationChanges) return

    const currentConfigurations = backgroundContext.moduleConfigurations
    const previousConfigurations = moduleConfigurationRef.current

    currentConfigurations.forEach((config, moduleId) => {
      const previousConfig = previousConfigurations.get(moduleId)
      
      if (previousConfig && JSON.stringify(config) !== JSON.stringify(previousConfig)) {
        trackModuleEvent({
          moduleId,
          eventType: 'module_config_changed',
          data: {
            previousConfig: {
              quality: previousConfig.quality,
              enabled: previousConfig.enabled
            },
            newConfig: {
              quality: config.quality,
              enabled: config.enabled
            },
            changeType: config.quality !== previousConfig.quality ? 'quality_change' : 'setting_change'
          }
        })
      }
    })

    moduleConfigurationRef.current = new Map(currentConfigurations)
  }, [backgroundContext?.moduleConfigurations, analytics.isEnabled, finalConfig])

  // Track performance metrics
  useEffect(() => {
    if (!analytics.isEnabled || !backgroundContext || !finalConfig.trackPerformanceIssues) return

    const currentMetrics = backgroundContext.performanceMetrics
    const previousMetrics = previousPerformanceRef.current

    if (currentMetrics && previousMetrics) {
      // Check for performance issues
      const performanceIssues = []

      if (currentMetrics.fps < finalConfig.performanceThreshold.minFPS) {
        performanceIssues.push('low_fps')
      }

      if (currentMetrics.memoryUsage > finalConfig.performanceThreshold.maxMemoryMB) {
        performanceIssues.push('high_memory')
      }

      if (currentMetrics.renderTime > finalConfig.performanceThreshold.maxRenderTime) {
        performanceIssues.push('slow_render')
      }

      if (performanceIssues.length > 0) {
        trackPerformanceIssue({
          eventType: 'performance_issue',
          beforeMetrics: {
            fps: previousMetrics.fps,
            memory: previousMetrics.memoryUsage,
            renderTime: previousMetrics.renderTime
          },
          afterMetrics: {
            fps: currentMetrics.fps,
            memory: currentMetrics.memoryUsage,
            renderTime: currentMetrics.renderTime
          },
          data: {
            issues: performanceIssues,
            activeModules: backgroundContext.activeModules.size,
            deviceType: backgroundContext.deviceCapabilities.isMobile ? 'mobile' : 'desktop'
          }
        })
      }

      // Track quality adjustments
      if (finalConfig.trackQualityAdjustments) {
        backgroundContext.moduleConfigurations.forEach((config, moduleId) => {
          const previousConfig = moduleConfigurationRef.current.get(moduleId)
          if (previousConfig && config.quality !== previousConfig.quality) {
            trackModuleEvent({
              moduleId,
              eventType: 'quality_adjustment',
              data: {
                previousQuality: previousConfig.quality,
                newQuality: config.quality,
                reason: 'performance_optimization',
                triggeringMetrics: {
                  fps: currentMetrics.fps,
                  memory: currentMetrics.memoryUsage
                }
              }
            })
          }
        })
      }
    }

    previousPerformanceRef.current = currentMetrics
  }, [backgroundContext?.performanceMetrics, analytics.isEnabled, finalConfig])

  // Batch processing
  useEffect(() => {
    const processBatch = () => {
      if (eventBatchRef.current.length === 0) return

      const events = [...eventBatchRef.current]
      eventBatchRef.current = []
      lastBatchTimeRef.current = Date.now()

      // Send batched events
      events.forEach(event => {
        analytics.trackBackgroundEvent(event)
      })
    }

    const interval = setInterval(() => {
      if (Date.now() - lastBatchTimeRef.current >= finalConfig.batchInterval) {
        processBatch()
      }
    }, finalConfig.batchInterval)

    return () => {
      clearInterval(interval)
      processBatch() // Process any remaining events
    }
  }, [analytics, finalConfig.batchInterval])

  const trackModuleEvent = useCallback((event: Omit<BackgroundAnalyticsEvent, 'name' | 'timestamp'>) => {
    if (!analytics.isEnabled) return

    const analyticsEvent: BackgroundAnalyticsEvent = {
      name: `background_${event.eventType}`,
      ...event,
      timestamp: Date.now(),
      performanceMetrics: backgroundContext?.performanceMetrics ? {
        fps: backgroundContext.performanceMetrics.fps,
        memory: backgroundContext.performanceMetrics.memoryUsage,
        renderTime: backgroundContext.performanceMetrics.renderTime,
        cpuUsage: backgroundContext.performanceMetrics.cpuUsage
      } : undefined,
      deviceInfo: backgroundContext?.deviceCapabilities ? {
        isMobile: backgroundContext.deviceCapabilities.isMobile,
        isLowPower: backgroundContext.deviceCapabilities.isLowPower,
        webglSupport: backgroundContext.deviceCapabilities.webgl,
        screenSize: `${window.innerWidth}x${window.innerHeight}`
      } : undefined
    }

    eventBatchRef.current.push(analyticsEvent)
  }, [analytics.isEnabled, backgroundContext])

  const trackPerformanceIssue = useCallback((event: Omit<PerformanceAnalyticsEvent, 'name' | 'timestamp'>) => {
    if (!analytics.isEnabled) return

    analytics.trackPerformanceEvent({
      name: `performance_${event.eventType}`,
      ...event,
      timestamp: Date.now()
    })
  }, [analytics])

  const trackUserInteraction = useCallback((interactionType: string, data?: Record<string, unknown>) => {
    if (!analytics.isEnabled || !finalConfig.trackUserInteractions) return

    trackModuleEvent({
      moduleId: backgroundContext?.currentModule || 'unknown',
      eventType: 'user_interaction',
      data: {
        interactionType,
        ...data
      }
    })
  }, [analytics.isEnabled, backgroundContext?.currentModule, finalConfig.trackUserInteractions])

  return {
    trackModuleEvent,
    trackPerformanceIssue,
    trackUserInteraction,
    config: finalConfig
  }
}

export default useBackgroundAnalytics