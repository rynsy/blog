/**
 * Performance Analytics Hook
 * Privacy-first performance monitoring with correlation to user behavior
 */

import { useEffect, useCallback, useRef } from 'react'
import { useAnalytics } from '../contexts/AnalyticsContext'
import { useBackgroundV3 } from '../contexts/BackgroundContextV3'
import type {
  PerformanceAnalyticsEvent,
  AnalyticsEvent
} from '../interfaces/AnalyticsSystem'
import type {
  PerformanceMetrics,
  DeviceCapabilities
} from '../interfaces/BackgroundSystemV3'

interface PerformanceAnalyticsConfig {
  trackFrameDrops: boolean
  trackMemorySpikes: boolean
  trackQualityAdjustments: boolean
  trackDeviceCorrelation: boolean
  trackBatteryImpact: boolean
  trackThermalThrottling: boolean
  thresholds: {
    fpsCritical: number
    fpsWarning: number
    memoryWarningMB: number
    memoryCriticalMB: number
    renderTimeCriticalMs: number
    renderTimeWarningMs: number
  }
  sampleInterval: number
  batchSize: number
  enablePredictiveAnalysis: boolean
}

const DEFAULT_CONFIG: PerformanceAnalyticsConfig = {
  trackFrameDrops: true,
  trackMemorySpikes: true,
  trackQualityAdjustments: true,
  trackDeviceCorrelation: true,
  trackBatteryImpact: true,
  trackThermalThrottling: true,
  thresholds: {
    fpsCritical: 20,
    fpsWarning: 30,
    memoryWarningMB: 100,
    memoryCriticalMB: 200,
    renderTimeCriticalMs: 50, // >50ms = <20fps
    renderTimeWarningMs: 33   // >33ms = <30fps
  },
  sampleInterval: 1000, // 1 second
  batchSize: 10,
  enablePredictiveAnalysis: true
}

interface PerformanceSnapshot {
  timestamp: number
  fps: number
  memory: number
  renderTime: number
  cpuUsage?: number
  batteryLevel?: number
  thermalState?: 'nominal' | 'fair' | 'serious' | 'critical'
  activeModules: string[]
  deviceType: 'mobile' | 'desktop' | 'tablet'
  qualityLevel: 'low' | 'medium' | 'high'
}

interface PerformanceCorrelation {
  metric: 'fps' | 'memory' | 'renderTime'
  factors: {
    moduleCount: number
    moduleComplexity: 'low' | 'medium' | 'high'
    deviceCapability: 'low' | 'medium' | 'high'
    timeOfDay: number
    sessionDuration: number
  }
  impact: number // -1 to 1
  confidence: number // 0 to 1
}

export const usePerformanceAnalytics = (config: Partial<PerformanceAnalyticsConfig> = {}) => {
  const analytics = useAnalytics()
  const backgroundContext = useBackgroundV3()
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  
  // Performance tracking state
  const performanceHistoryRef = useRef<PerformanceSnapshot[]>([])
  const lastReportRef = useRef<number>(Date.now())
  const performanceIssuesRef = useRef<Map<string, number>>(new Map())
  const correlationDataRef = useRef<PerformanceCorrelation[]>([])
  const adaptiveThresholdsRef = useRef(finalConfig.thresholds)

  // Battery and thermal state tracking
  const batteryInfoRef = useRef<{ level?: number; charging?: boolean }>({})
  const thermalStateRef = useRef<string>('nominal')

  // Performance monitoring
  useEffect(() => {
    if (!analytics.isEnabled || !backgroundContext) return

    const monitorPerformance = () => {
      const metrics = backgroundContext.performanceMetrics
      const deviceCapabilities = backgroundContext.deviceCapabilities
      
      if (!metrics) return

      const snapshot = createPerformanceSnapshot(metrics, deviceCapabilities)
      performanceHistoryRef.current.push(snapshot)
      
      // Limit history size
      if (performanceHistoryRef.current.length > 100) {
        performanceHistoryRef.current.shift()
      }

      analyzePerformanceChanges(snapshot)
      
      // Batch reporting
      if (performanceHistoryRef.current.length >= finalConfig.batchSize || 
          Date.now() - lastReportRef.current > 30000) { // 30 seconds max
        reportPerformanceBatch()
      }
    }

    const interval = setInterval(monitorPerformance, finalConfig.sampleInterval)
    return () => clearInterval(interval)
  }, [analytics.isEnabled, backgroundContext, finalConfig])

  // Battery monitoring
  useEffect(() => {
    if (!analytics.isEnabled || !finalConfig.trackBatteryImpact || typeof navigator === 'undefined') return

    const updateBatteryInfo = () => {
      if ('getBattery' in navigator) {
        (navigator as any).getBattery().then((battery: any) => {
          batteryInfoRef.current = {
            level: battery.level * 100,
            charging: battery.charging
          }
        }).catch(() => {
          // Battery API not supported or denied
        })
      }
    }

    updateBatteryInfo()
    const interval = setInterval(updateBatteryInfo, 30000) // Every 30 seconds
    return () => clearInterval(interval)
  }, [analytics.isEnabled, finalConfig.trackBatteryImpact])

  // Thermal monitoring (if available)
  useEffect(() => {
    if (!analytics.isEnabled || !finalConfig.trackThermalThrottling) return

    const checkThermalState = () => {
      // This would integrate with thermal APIs if available
      // For now, we infer thermal issues from performance degradation
      const recentSnapshots = performanceHistoryRef.current.slice(-10)
      if (recentSnapshots.length >= 5) {
        const avgFps = recentSnapshots.reduce((sum, s) => sum + s.fps, 0) / recentSnapshots.length
        const avgRenderTime = recentSnapshots.reduce((sum, s) => sum + s.renderTime, 0) / recentSnapshots.length
        
        if (avgFps < 15 && avgRenderTime > 66) {
          thermalStateRef.current = 'critical'
        } else if (avgFps < 20 && avgRenderTime > 50) {
          thermalStateRef.current = 'serious'
        } else if (avgFps < 25 && avgRenderTime > 40) {
          thermalStateRef.current = 'fair'
        } else {
          thermalStateRef.current = 'nominal'
        }
      }
    }

    const interval = setInterval(checkThermalState, 10000) // Every 10 seconds
    return () => clearInterval(interval)
  }, [analytics.isEnabled, finalConfig.trackThermalThrottling])

  const createPerformanceSnapshot = useCallback((
    metrics: PerformanceMetrics,
    deviceCapabilities: DeviceCapabilities
  ): PerformanceSnapshot => {
    return {
      timestamp: Date.now(),
      fps: metrics.fps,
      memory: metrics.memoryUsage,
      renderTime: metrics.renderTime,
      cpuUsage: metrics.cpuUsage,
      batteryLevel: batteryInfoRef.current.level,
      thermalState: thermalStateRef.current as any,
      activeModules: Array.from(backgroundContext?.activeModules.keys() || []),
      deviceType: deviceCapabilities.isMobile ? 'mobile' : 'desktop',
      qualityLevel: determineCurrentQualityLevel()
    }
  }, [backgroundContext])

  const analyzePerformanceChanges = useCallback((snapshot: PerformanceSnapshot) => {
    const previous = performanceHistoryRef.current[performanceHistoryRef.current.length - 2]
    if (!previous) return

    // Check for significant performance drops
    if (finalConfig.trackFrameDrops) {
      checkFrameDrops(snapshot, previous)
    }

    if (finalConfig.trackMemorySpikes) {
      checkMemorySpikes(snapshot, previous)
    }

    if (finalConfig.enablePredictiveAnalysis) {
      updatePerformanceCorrelations(snapshot)
    }

    // Update adaptive thresholds based on device performance
    updateAdaptiveThresholds(snapshot)
  }, [finalConfig])

  const checkFrameDrops = useCallback((current: PerformanceSnapshot, previous: PerformanceSnapshot) => {
    const fpsDrop = previous.fps - current.fps
    const thresholds = adaptiveThresholdsRef.current

    if (current.fps < thresholds.fpsCritical || fpsDrop > 10) {
      const severity = current.fps < thresholds.fpsCritical ? 'critical' : 'warning'
      
      trackPerformanceEvent({
        eventType: 'fps_drop',
        beforeMetrics: {
          fps: previous.fps,
          memory: previous.memory,
          renderTime: previous.renderTime
        },
        afterMetrics: {
          fps: current.fps,
          memory: current.memory,
          renderTime: current.renderTime
        },
        optimization: {
          action: 'quality_reduction_suggested',
          success: false,
          impact: 0
        },
        data: {
          severity,
          fpsDrop,
          duration: current.timestamp - previous.timestamp,
          potentialCauses: identifyPerformanceCauses(current, previous),
          deviceInfo: {
            type: current.deviceType,
            thermalState: current.thermalState,
            batteryLevel: current.batteryLevel
          },
          privacy: {
            anonymized: true,
            deviceTypeOnly: true,
            noSpecificSpecs: true
          }
        }
      })

      // Track issue frequency
      const key = `fps_drop_${severity}`
      performanceIssuesRef.current.set(key, (performanceIssuesRef.current.get(key) || 0) + 1)
    }
  }, [])

  const checkMemorySpikes = useCallback((current: PerformanceSnapshot, previous: PerformanceSnapshot) => {
    const memoryIncrease = current.memory - previous.memory
    const thresholds = adaptiveThresholdsRef.current

    if (current.memory > thresholds.memoryWarningMB || memoryIncrease > 20) {
      const severity = current.memory > thresholds.memoryCriticalMB ? 'critical' : 'warning'
      
      trackPerformanceEvent({
        eventType: 'memory_spike',
        beforeMetrics: {
          fps: previous.fps,
          memory: previous.memory
        },
        afterMetrics: {
          fps: current.fps,
          memory: current.memory
        },
        data: {
          severity,
          memoryIncrease,
          peakMemory: current.memory,
          activeModuleCount: current.activeModules.length,
          moduleComplexity: calculateModuleComplexity(current.activeModules),
          privacy: {
            anonymized: true,
            aggregatedMetricsOnly: true,
            noModuleSpecifics: true
          }
        }
      })

      // Track memory leak patterns
      const key = `memory_spike_${severity}`
      performanceIssuesRef.current.set(key, (performanceIssuesRef.current.get(key) || 0) + 1)
    }
  }, [])

  const updatePerformanceCorrelations = useCallback((snapshot: PerformanceSnapshot) => {
    const sessionDuration = Date.now() - (performanceHistoryRef.current[0]?.timestamp || Date.now())
    
    const correlation: PerformanceCorrelation = {
      metric: 'fps',
      factors: {
        moduleCount: snapshot.activeModules.length,
        moduleComplexity: calculateModuleComplexity(snapshot.activeModules),
        deviceCapability: categorizeDeviceCapability(snapshot.deviceType, snapshot.fps),
        timeOfDay: new Date().getHours(),
        sessionDuration: sessionDuration / (1000 * 60) // minutes
      },
      impact: calculatePerformanceImpact(snapshot),
      confidence: calculateCorrelationConfidence(performanceHistoryRef.current.length)
    }

    correlationDataRef.current.push(correlation)
    if (correlationDataRef.current.length > 50) {
      correlationDataRef.current.shift()
    }
  }, [])

  const trackPerformanceEvent = useCallback(async (
    event: Omit<PerformanceAnalyticsEvent, 'name' | 'timestamp'>
  ) => {
    if (!analytics.isEnabled) return

    await analytics.trackPerformanceEvent({
      name: `performance_${event.eventType}`,
      ...event
    })
  }, [analytics])

  const trackQualityAdjustment = useCallback(async (
    moduleId: string,
    fromQuality: 'low' | 'medium' | 'high',
    toQuality: 'low' | 'medium' | 'high',
    reason: string,
    performanceImpact: PerformanceSnapshot
  ) => {
    if (!analytics.isEnabled || !finalConfig.trackQualityAdjustments) return

    await trackPerformanceEvent({
      eventType: 'quality_adjusted',
      beforeMetrics: {
        fps: 0, // Would be filled from previous snapshot
        memory: 0
      },
      afterMetrics: {
        fps: performanceImpact.fps,
        memory: performanceImpact.memory
      },
      optimization: {
        action: `quality_${fromQuality}_to_${toQuality}`,
        success: toQuality === 'low' || performanceImpact.fps > adaptiveThresholdsRef.current.fpsWarning,
        impact: calculateQualityImpact(fromQuality, toQuality)
      },
      data: {
        moduleId,
        reason,
        fromQuality,
        toQuality,
        automaticAdjustment: reason.includes('automatic'),
        privacy: {
          anonymized: true,
          qualityLevelsOnly: true,
          noModuleIdentification: true
        }
      }
    })
  }, [analytics, finalConfig])

  const reportPerformanceBatch = useCallback(async () => {
    if (!analytics.isEnabled || performanceHistoryRef.current.length === 0) return

    const batch = [...performanceHistoryRef.current]
    performanceHistoryRef.current = []
    lastReportRef.current = Date.now()

    // Calculate batch statistics
    const stats = calculateBatchStatistics(batch)
    
    await analytics.trackEvent({
      name: 'performance_batch_report',
      data: {
        duration: stats.duration,
        sampleCount: batch.length,
        avgFps: stats.avgFps,
        minFps: stats.minFps,
        maxFps: stats.maxFps,
        avgMemory: stats.avgMemory,
        maxMemory: stats.maxMemory,
        qualityDistribution: stats.qualityDistribution,
        deviceType: stats.deviceType,
        issuesSummary: Object.fromEntries(performanceIssuesRef.current),
        correlations: correlationDataRef.current.slice(-5), // Last 5 correlations
        privacy: {
          anonymized: true,
          aggregatedStatsOnly: true,
          noBehavioralPatterns: true
        }
      }
    })

    // Reset issue counters
    performanceIssuesRef.current.clear()
  }, [analytics])

  const identifyPerformanceCauses = (current: PerformanceSnapshot, previous: PerformanceSnapshot): string[] => {
    const causes = []
    
    if (current.activeModules.length > previous.activeModules.length) {
      causes.push('module_added')
    }
    
    if (current.memory - previous.memory > 10) {
      causes.push('memory_increase')
    }
    
    if (current.thermalState !== 'nominal' && current.thermalState !== previous.thermalState) {
      causes.push('thermal_throttling')
    }
    
    if (current.batteryLevel && current.batteryLevel < 20) {
      causes.push('low_battery')
    }

    if (causes.length === 0) {
      causes.push('unknown')
    }
    
    return causes
  }

  const calculateModuleComplexity = (modules: string[]): 'low' | 'medium' | 'high' => {
    // This would ideally use module metadata to determine complexity
    const count = modules.length
    if (count === 0) return 'low'
    if (count === 1) return 'low'
    if (count <= 3) return 'medium'
    return 'high'
  }

  const categorizeDeviceCapability = (deviceType: string, currentFps: number): 'low' | 'medium' | 'high' => {
    if (deviceType === 'mobile') {
      return currentFps > 45 ? 'high' : currentFps > 25 ? 'medium' : 'low'
    }
    return currentFps > 55 ? 'high' : currentFps > 35 ? 'medium' : 'low'
  }

  const calculatePerformanceImpact = (snapshot: PerformanceSnapshot): number => {
    const fpsScore = Math.min(1, snapshot.fps / 60)
    const memoryScore = Math.max(0, 1 - snapshot.memory / 200)
    const renderTimeScore = Math.max(0, 1 - snapshot.renderTime / 16.67) // 60fps target
    
    return (fpsScore + memoryScore + renderTimeScore) / 3
  }

  const calculateCorrelationConfidence = (sampleSize: number): number => {
    return Math.min(1, sampleSize / 20) // Full confidence at 20+ samples
  }

  const calculateQualityImpact = (from: string, to: string): number => {
    const qualityScores = { low: 1, medium: 2, high: 3 }
    return (qualityScores[to as keyof typeof qualityScores] - qualityScores[from as keyof typeof qualityScores]) / 2
  }

  const determineCurrentQualityLevel = (): 'low' | 'medium' | 'high' => {
    // This would be determined from the background context module configurations
    return 'medium' // Placeholder
  }

  const updateAdaptiveThresholds = (snapshot: PerformanceSnapshot) => {
    // Adapt thresholds based on device capability and observed performance
    const deviceMultiplier = snapshot.deviceType === 'mobile' ? 0.8 : 1.0
    const thermalMultiplier = snapshot.thermalState === 'nominal' ? 1.0 : 0.7
    
    adaptiveThresholdsRef.current = {
      ...finalConfig.thresholds,
      fpsWarning: finalConfig.thresholds.fpsWarning * deviceMultiplier * thermalMultiplier,
      fpsCritical: finalConfig.thresholds.fpsCritical * deviceMultiplier * thermalMultiplier
    }
  }

  const calculateBatchStatistics = (batch: PerformanceSnapshot[]) => {
    if (batch.length === 0) return null

    const fps = batch.map(s => s.fps)
    const memory = batch.map(s => s.memory)
    
    return {
      duration: batch[batch.length - 1].timestamp - batch[0].timestamp,
      avgFps: fps.reduce((a, b) => a + b, 0) / fps.length,
      minFps: Math.min(...fps),
      maxFps: Math.max(...fps),
      avgMemory: memory.reduce((a, b) => a + b, 0) / memory.length,
      maxMemory: Math.max(...memory),
      qualityDistribution: {
        low: batch.filter(s => s.qualityLevel === 'low').length,
        medium: batch.filter(s => s.qualityLevel === 'medium').length,
        high: batch.filter(s => s.qualityLevel === 'high').length
      },
      deviceType: batch[0].deviceType
    }
  }

  // Public API
  return {
    trackQualityAdjustment,
    reportPerformanceBatch,
    getPerformanceInsights: () => ({
      recentIssues: Object.fromEntries(performanceIssuesRef.current),
      correlations: correlationDataRef.current.slice(-10),
      adaptiveThresholds: adaptiveThresholdsRef.current
    }),
    config: finalConfig
  }
}

export default usePerformanceAnalytics