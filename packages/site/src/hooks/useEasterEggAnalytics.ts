/**
 * Easter Egg Analytics Hook
 * Privacy-first tracking for easter egg discovery patterns
 */

import { useEffect, useCallback, useRef } from 'react'
import { useAnalytics } from '../contexts/AnalyticsContext'
import type {
  EasterEggAnalyticsEvent,
  AnalyticsEvent
} from '../interfaces/AnalyticsSystem'
import type {
  EasterEgg,
  Achievement,
  PatternMatch,
  PatternEvent
} from '../interfaces/BackgroundSystemV3'

interface EasterEggAnalyticsConfig {
  trackDiscoveries: boolean
  trackProgress: boolean
  trackHints: boolean
  trackFailedAttempts: boolean
  trackSharing: boolean
  aggregateOnly: boolean
  maxFailedAttempts: number
  progressUpdateInterval: number
}

const DEFAULT_CONFIG: EasterEggAnalyticsConfig = {
  trackDiscoveries: true,
  trackProgress: true,
  trackHints: true,
  trackFailedAttempts: true,
  trackSharing: true,
  aggregateOnly: true,
  maxFailedAttempts: 100, // Prevent spam
  progressUpdateInterval: 10000 // 10 seconds
}

interface DiscoverySession {
  eggId: string
  startTime: number
  attempts: number
  hintsUsed: number
  nearMisses: number
  progressHistory: Array<{
    confidence: number
    timestamp: number
  }>
  lastProgressUpdate: number
}

export const useEasterEggAnalytics = (config: Partial<EasterEggAnalyticsConfig> = {}) => {
  const analytics = useAnalytics()
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  
  // Track discovery sessions
  const sessionsRef = useRef<Map<string, DiscoverySession>>(new Map())
  const discoveredEggsRef = useRef<Set<string>>(new Set())
  
  // Load saved data on mount
  useEffect(() => {
    loadSavedDiscoveries()
  }, [])

  // Setup event listeners for easter egg discovery engine
  useEffect(() => {
    if (!analytics.isEnabled || typeof window === 'undefined') return

    const handleEasterEggDiscovered = (event: CustomEvent) => {
      const { id, name, category, rarity, timestamp } = event.detail
      trackEasterEggDiscovery({
        eggId: id,
        name,
        category,
        rarity,
        timestamp
      })
    }

    const handlePatternProgress = (event: CustomEvent) => {
      const { eggId, match } = event.detail
      trackProgressUpdate(eggId, match)
    }

    const handleNearMiss = (event: CustomEvent) => {
      const { eggId, match } = event.detail
      trackNearMiss(eggId, match)
    }

    const handleHintShown = (event: CustomEvent) => {
      const { eggId, hintIndex, hint } = event.detail
      trackHintUsage(eggId, hintIndex, hint)
    }

    // Listen for discovery engine events
    window.addEventListener('easterEggDiscovered', handleEasterEggDiscovered as EventListener)
    window.addEventListener('easterEggProgress', handlePatternProgress as EventListener)
    window.addEventListener('easterEggNearMiss', handleNearMiss as EventListener)
    window.addEventListener('easterEggHint', handleHintShown as EventListener)

    return () => {
      window.removeEventListener('easterEggDiscovered', handleEasterEggDiscovered as EventListener)
      window.removeEventListener('easterEggProgress', handlePatternProgress as EventListener)
      window.removeEventListener('easterEggNearMiss', handleNearMiss as EventListener)
      window.removeEventListener('easterEggHint', handleHintShown as EventListener)
    }
  }, [analytics.isEnabled])

  const trackEasterEggDiscovery = useCallback(async (discovery: {
    eggId: string
    name: string
    category: string
    rarity: 'common' | 'rare' | 'legendary'
    timestamp: number
  }) => {
    if (!analytics.isEnabled || !finalConfig.trackDiscoveries) return

    const session = sessionsRef.current.get(discovery.eggId)
    const discoveryTime = session ? discovery.timestamp - session.startTime : 0
    
    const event: Omit<EasterEggAnalyticsEvent, 'timestamp'> = {
      name: 'easter_egg_discovered',
      eggId: discovery.eggId,
      eventType: 'discovered',
      discoveryTime,
      attemptsCount: session?.attempts || 0,
      hintsUsed: session?.hintsUsed || 0,
      discoveryMethod: determineDiscoveryMethod(discovery.category),
      difficulty: mapRarityToDifficulty(discovery.rarity),
      rarity: discovery.rarity,
      data: {
        name: discovery.name,
        category: discovery.category,
        sessionDuration: discoveryTime,
        efficiency: session ? calculateDiscoveryEfficiency(session) : 0,
        privacy: {
          anonymized: true,
          aggregatedOnly: finalConfig.aggregateOnly,
          noPersonalIdentification: true
        }
      }
    }

    await analytics.trackEasterEggEvent(event)

    // Mark as discovered and clean up session
    discoveredEggsRef.current.add(discovery.eggId)
    sessionsRef.current.delete(discovery.eggId)
    saveDiscoveryState()
  }, [analytics, finalConfig])

  const trackProgressUpdate = useCallback((eggId: string, match: PatternMatch) => {
    if (!analytics.isEnabled || !finalConfig.trackProgress) return

    let session = sessionsRef.current.get(eggId)
    if (!session) {
      session = {
        eggId,
        startTime: Date.now(),
        attempts: 0,
        hintsUsed: 0,
        nearMisses: 0,
        progressHistory: [],
        lastProgressUpdate: Date.now()
      }
      sessionsRef.current.set(eggId, session)
    }

    // Update session progress
    session.progressHistory.push({
      confidence: match.confidence,
      timestamp: Date.now()
    })

    // Throttle progress updates
    const now = Date.now()
    if (now - session.lastProgressUpdate < finalConfig.progressUpdateInterval) {
      return
    }

    session.lastProgressUpdate = now

    // Track significant progress milestones
    const milestones = [0.25, 0.5, 0.75, 0.9]
    const currentMilestone = milestones.find(m => match.confidence >= m)
    
    if (currentMilestone) {
      analytics.trackEasterEggEvent({
        name: 'easter_egg_progress',
        eggId,
        eventType: 'progress',
        data: {
          confidence: match.confidence,
          milestone: currentMilestone,
          sessionDuration: now - session.startTime,
          totalAttempts: session.attempts,
          privacy: {
            anonymized: true,
            progressMilestoneOnly: true,
            noDetailedPatterns: true
          }
        }
      })
    }
  }, [analytics, finalConfig])

  const trackNearMiss = useCallback((eggId: string, match: PatternMatch) => {
    if (!analytics.isEnabled || !finalConfig.trackFailedAttempts) return

    let session = sessionsRef.current.get(eggId)
    if (!session) {
      session = {
        eggId,
        startTime: Date.now(),
        attempts: 0,
        hintsUsed: 0,
        nearMisses: 0,
        progressHistory: [],
        lastProgressUpdate: Date.now()
      }
      sessionsRef.current.set(eggId, session)
    }

    session.nearMisses++
    session.attempts++

    // Prevent spam tracking
    if (session.attempts > finalConfig.maxFailedAttempts) {
      return
    }

    // Track near miss patterns (aggregated only)
    analytics.trackEasterEggEvent({
      name: 'easter_egg_near_miss',
      eggId,
      eventType: 'failed_attempt',
      data: {
        confidence: match.confidence,
        nearMissCount: session.nearMisses,
        totalAttempts: session.attempts,
        frustrationLevel: calculateFrustrationLevel(session),
        privacy: {
          anonymized: true,
          aggregatedPatternOnly: true,
          noSpecificInputs: true
        }
      }
    })
  }, [analytics, finalConfig])

  const trackHintUsage = useCallback((eggId: string, hintIndex: number, hint: string) => {
    if (!analytics.isEnabled || !finalConfig.trackHints) return

    const session = sessionsRef.current.get(eggId)
    if (session) {
      session.hintsUsed++
    }

    analytics.trackEasterEggEvent({
      name: 'easter_egg_hint',
      eggId,
      eventType: 'hint_shown',
      data: {
        hintIndex,
        totalHints: session?.hintsUsed || 1,
        sessionDuration: session ? Date.now() - session.startTime : 0,
        helpfulness: 'unknown', // Could be tracked via follow-up interactions
        privacy: {
          anonymized: true,
          hintIndexOnly: true,
          noHintContent: true
        }
      }
    })
  }, [analytics, finalConfig])

  const trackEasterEggSharing = useCallback(async (eggId: string, shareMethod: 'url' | 'social' | 'copy') => {
    if (!analytics.isEnabled || !finalConfig.trackSharing) return

    await analytics.trackEasterEggEvent({
      name: 'easter_egg_shared',
      eggId,
      eventType: 'shared',
      data: {
        shareMethod,
        discovered: discoveredEggsRef.current.has(eggId),
        privacy: {
          anonymized: true,
          shareMethodOnly: true,
          noPersonalData: true
        }
      }
    })
  }, [analytics, finalConfig])

  const trackCollectionStats = useCallback(async () => {
    if (!analytics.isEnabled) return

    const totalDiscovered = discoveredEggsRef.current.size
    const activeSessions = sessionsRef.current.size
    
    await analytics.trackEasterEggEvent({
      name: 'easter_egg_collection_stats',
      eggId: 'collection',
      eventType: 'progress',
      data: {
        totalDiscovered,
        activeSessions,
        completionRate: totalDiscovered / (totalDiscovered + activeSessions),
        privacy: {
          anonymized: true,
          aggregatedStatsOnly: true,
          noIndividualProgress: true
        }
      }
    })
  }, [analytics])

  const trackAccessibilityUsage = useCallback(async (feature: string, enabled: boolean) => {
    if (!analytics.isEnabled) return

    await analytics.trackEvent({
      name: 'easter_egg_accessibility',
      data: {
        feature,
        enabled,
        context: 'easter_egg_discovery',
        privacy: {
          anonymized: true,
          featureUsageOnly: true,
          noPersonalPreferences: true
        }
      }
    })
  }, [analytics])

  const determineDiscoveryMethod = (category: string): 'sequence' | 'interaction' | 'performance' | 'time' | 'contextual' => {
    switch (category) {
      case 'sequence':
        return 'sequence'
      case 'interaction':
        return 'interaction'
      case 'performance':
        return 'performance'
      case 'time':
        return 'time'
      case 'contextual':
        return 'contextual'
      default:
        return 'sequence'
    }
  }

  const mapRarityToDifficulty = (rarity: 'common' | 'rare' | 'legendary'): number => {
    switch (rarity) {
      case 'common': return Math.floor(Math.random() * 2) + 1 // 1-2
      case 'rare': return Math.floor(Math.random() * 2) + 3   // 3-4
      case 'legendary': return 5
      default: return 3
    }
  }

  const calculateDiscoveryEfficiency = (session: DiscoverySession): number => {
    if (session.attempts === 0) return 1
    
    const timeScore = Math.max(0, 1 - (Date.now() - session.startTime) / (5 * 60 * 1000)) // 5 min max
    const attemptScore = Math.max(0, 1 - session.attempts / 20) // 20 attempts max
    const hintScore = Math.max(0, 1 - session.hintsUsed / 3) // 3 hints max
    
    return (timeScore + attemptScore + hintScore) / 3
  }

  const calculateFrustrationLevel = (session: DiscoverySession): 'low' | 'medium' | 'high' => {
    const timeSpent = Date.now() - session.startTime
    const attemptRate = session.attempts / (timeSpent / 60000) // attempts per minute
    
    if (attemptRate > 10 || session.attempts > 50) return 'high'
    if (attemptRate > 5 || session.attempts > 20) return 'medium'
    return 'low'
  }

  const saveDiscoveryState = () => {
    if (typeof window === 'undefined') return

    try {
      const state = {
        discovered: Array.from(discoveredEggsRef.current),
        timestamp: Date.now()
      }
      localStorage.setItem('easter-egg-analytics-state', JSON.stringify(state))
    } catch (error) {
      console.warn('Failed to save discovery state:', error)
    }
  }

  const loadSavedDiscoveries = () => {
    if (typeof window === 'undefined') return

    try {
      const saved = localStorage.getItem('easter-egg-analytics-state')
      if (saved) {
        const state = JSON.parse(saved)
        discoveredEggsRef.current = new Set(state.discovered || [])
      }
    } catch (error) {
      console.warn('Failed to load discovery state:', error)
    }
  }

  // Periodic stats reporting
  useEffect(() => {
    if (!analytics.isEnabled) return

    const interval = setInterval(() => {
      trackCollectionStats()
    }, 5 * 60 * 1000) // Every 5 minutes

    return () => clearInterval(interval)
  }, [analytics.isEnabled, trackCollectionStats])

  return {
    trackEasterEggDiscovery,
    trackProgressUpdate,
    trackNearMiss,
    trackHintUsage,
    trackEasterEggSharing,
    trackAccessibilityUsage,
    trackCollectionStats,
    getDiscoveredCount: () => discoveredEggsRef.current.size,
    getActiveSessionsCount: () => sessionsRef.current.size,
    isDiscovered: (eggId: string) => discoveredEggsRef.current.has(eggId),
    config: finalConfig
  }
}

export default useEasterEggAnalytics