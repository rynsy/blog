import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { EasterEggDiscoveryEngine } from '../utils/EasterEggDiscoveryEngine'
import { PerformanceMonitor } from '../utils/PerformanceMonitor'
import { DeviceCapabilityManager } from '../utils/DeviceCapabilityManager'
import { useBackground } from '../contexts/BackgroundContextV3'
import { useTheme } from '../contexts/ThemeContext'
import { 
  EasterEgg, 
  Achievement, 
  EasterEggEvent,
  PatternRecognitionConfig,
  DiscoveryProgress
} from '../interfaces/BackgroundSystemV3'

/**
 * AI-Powered Easter Egg Provider Component
 * 
 * This component integrates the easter egg discovery system with the background
 * provider and provides a React context for managing easter egg state throughout
 * the application.
 */

interface EasterEggContextType {
  // Discovery state
  discoveredEasterEggs: Achievement[]
  activeProgress: Map<string, DiscoveryProgress>
  totalEasterEggs: number
  discoveryRate: number // percentage of discovered eggs
  
  // Configuration
  isEnabled: boolean
  recognitionConfig: PatternRecognitionConfig
  
  // Actions
  triggerDiscoveryCheck: (event: EasterEggEvent) => void
  resetProgress: (easterEggId?: string) => void
  enableDiscovery: (enabled: boolean) => void
  updateConfig: (config: Partial<PatternRecognitionConfig>) => void
  
  // Accessibility
  setAccessibilityMode: (enabled: boolean) => void
  getKeyboardAlternatives: () => string[]
  
  // Sharing and persistence
  getShareableUrl: () => string
  exportProgress: () => string
  importProgress: (data: string) => boolean
}

const EasterEggContext = createContext<EasterEggContextType | undefined>(undefined)

export const useEasterEgg = () => {
  const context = useContext(EasterEggContext)
  if (context === undefined) {
    throw new Error('useEasterEgg must be used within an EasterEggProvider')
  }
  return context
}

interface EasterEggProviderProps {
  children: ReactNode
  enabled?: boolean
  config?: Partial<PatternRecognitionConfig>
}

const DEFAULT_RECOGNITION_CONFIG: PatternRecognitionConfig = {
  enabled: true,
  sensitivity: 'medium',
  adaptiveLearning: true,
  falsePositiveReduction: true,
  performanceMode: 'medium',
  accessibilityMode: false
}

export const EasterEggProvider: React.FC<EasterEggProviderProps> = ({
  children,
  enabled = true,
  config = {}
}) => {
  const { theme } = useTheme()
  const backgroundContext = useBackground()
  
  // Core state
  const [discoveryEngine, setDiscoveryEngine] = useState<EasterEggDiscoveryEngine | null>(null)
  const [discoveredEasterEggs, setDiscoveredEasterEggs] = useState<Achievement[]>([])
  const [activeProgress, setActiveProgress] = useState<Map<string, DiscoveryProgress>>(new Map())
  const [totalEasterEggs, setTotalEasterEggs] = useState(0)
  const [isEnabled, setIsEnabled] = useState(enabled)
  const [recognitionConfig, setRecognitionConfig] = useState<PatternRecognitionConfig>({
    ...DEFAULT_RECOGNITION_CONFIG,
    ...config
  })
  
  // Performance monitoring
  const [performanceMonitor] = useState(() => new PerformanceMonitor())
  const [deviceCapabilityManager] = useState(() => new DeviceCapabilityManager())
  
  // Initialize discovery engine
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const engine = new EasterEggDiscoveryEngine(
      performanceMonitor,
      deviceCapabilityManager
    )
    
    // Configure the engine based on settings
    engine.setAccessibilityMode(recognitionConfig.accessibilityMode)
    engine.setPerformanceMode(recognitionConfig.performanceMode)
    
    setDiscoveryEngine(engine)
    
    // Load initial state
    const discovered = engine.getDiscoveredEasterEggs()
    setDiscoveredEasterEggs(discovered)
    
    return () => {
      engine.stop()
    }
  }, [])
  
  // Start/stop discovery based on enabled state
  useEffect(() => {
    if (!discoveryEngine) return
    
    if (isEnabled && backgroundContext.isActive) {
      discoveryEngine.start()
    } else {
      discoveryEngine.stop()
    }
  }, [discoveryEngine, isEnabled, backgroundContext.isActive])
  
  // Listen for easter egg discoveries
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const handleDiscovery = (event: CustomEvent) => {
      const { id, name, category, rarity, timestamp } = event.detail
      
      const achievement: Achievement = {
        id,
        name,
        description: `Discovered ${name}!`,
        icon: getIconForCategory(category),
        discovered: true,
        timestamp,
        category,
        rarity
      }
      
      setDiscoveredEasterEggs(prev => {
        const existing = prev.find(a => a.id === id)
        if (existing) return prev
        return [...prev, achievement]
      })
      
      // Remove from active progress
      setActiveProgress(prev => {
        const newMap = new Map(prev)
        newMap.delete(id)
        return newMap
      })
      
      // Show notification
      showDiscoveryNotification(achievement)
      
      // Trigger background module effects if configured
      handleDiscoveryEffects(achievement)
    }
    
    window.addEventListener('easterEggDiscovered', handleDiscovery)
    return () => window.removeEventListener('easterEggDiscovered', handleDiscovery)
  }, [])
  
  // Helper functions
  const getIconForCategory = (category: string): string => {
    const icons = {
      sequence: '🎮',
      interaction: '🎯',
      performance: '⚡',
      time: '⏰',
      contextual: '🔍'
    }
    return icons[category as keyof typeof icons] || '🥚'
  }
  
  const showDiscoveryNotification = (achievement: Achievement) => {
    // Integration with notification system
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Easter Egg Discovered!`, {
        body: `You found: ${achievement.name}`,
        icon: achievement.icon,
        badge: '/favicon.ico'
      })
    }
    
    // Visual feedback in the UI
    const event = new CustomEvent('showAchievementToast', {
      detail: achievement
    })
    window.dispatchEvent(event)
  }
  
  const handleDiscoveryEffects = (achievement: Achievement) => {
    // Special effects based on easter egg type
    switch (achievement.category) {
      case 'performance':
        // Trigger performance celebration effect
        triggerPerformanceCelebration()
        break
      case 'sequence':
        // Classic sequence celebration
        triggerSequenceCelebration()
        break
      case 'interaction':
        // Interactive celebration
        triggerInteractiveCelebration()
        break
    }
  }
  
  const triggerPerformanceCelebration = () => {
    // Temporary performance boost visual effect
    const event = new CustomEvent('triggerSpecialEffect', {
      detail: { type: 'performance-boost', duration: 5000 }
    })
    window.dispatchEvent(event)
  }
  
  const triggerSequenceCelebration = () => {
    // Classic celebration with retro effects
    const event = new CustomEvent('triggerSpecialEffect', {
      detail: { type: 'retro-celebration', duration: 3000 }
    })
    window.dispatchEvent(event)
  }
  
  const triggerInteractiveCelebration = () => {
    // Interactive particle burst
    const event = new CustomEvent('triggerSpecialEffect', {
      detail: { type: 'particle-burst', duration: 2000 }
    })
    window.dispatchEvent(event)
  }
  
  // Context actions
  const triggerDiscoveryCheck = useCallback((event: EasterEggEvent) => {
    if (!discoveryEngine || !isEnabled) return
    
    // Process the event through the discovery engine
    // The engine will handle pattern matching internally
    const customEvent = new CustomEvent('easterEggEvent', { detail: event })
    window.dispatchEvent(customEvent)
  }, [discoveryEngine, isEnabled])
  
  const resetProgress = useCallback((easterEggId?: string) => {
    if (easterEggId) {
      setActiveProgress(prev => {
        const newMap = new Map(prev)
        newMap.delete(easterEggId)
        return newMap
      })
    } else {
      setActiveProgress(new Map())
    }
  }, [])
  
  const enableDiscovery = useCallback((enabled: boolean) => {
    setIsEnabled(enabled)
    
    // Persist preference
    if (typeof window !== 'undefined') {
      localStorage.setItem('easter-egg-discovery-enabled', enabled.toString())
    }
  }, [])
  
  const updateConfig = useCallback((newConfig: Partial<PatternRecognitionConfig>) => {
    setRecognitionConfig(prev => ({ ...prev, ...newConfig }))
    
    if (discoveryEngine) {
      // Apply configuration changes
      if ('accessibilityMode' in newConfig) {
        discoveryEngine.setAccessibilityMode(newConfig.accessibilityMode!)
      }
      if ('performanceMode' in newConfig) {
        discoveryEngine.setPerformanceMode(newConfig.performanceMode!)
      }
    }
  }, [discoveryEngine])
  
  const setAccessibilityMode = useCallback((enabled: boolean) => {
    updateConfig({ accessibilityMode: enabled })
  }, [updateConfig])
  
  const getKeyboardAlternatives = useCallback(() => {
    // Return list of keyboard-accessible easter eggs
    return [
      'Konami Code: ↑ ↑ ↓ ↓ ← → ← → B A',
      'Matrix Code: Ctrl + T H E M A T R I X',
      'Performance Master: Maintain 58+ FPS for 30 seconds',
      'Midnight Mystery: Visit during midnight hour (00:00-01:00)',
      'Time Keeper: Press T I M E while any background is active'
    ]
  }, [])
  
  const getShareableUrl = useCallback(() => {
    if (typeof window === 'undefined') return ''
    
    const discoveredIds = discoveredEasterEggs.map(egg => egg.id)
    const params = new URLSearchParams(window.location.search)
    params.set('easter', discoveredIds.join(','))
    
    return `${window.location.origin}${window.location.pathname}?${params.toString()}`
  }, [discoveredEasterEggs])
  
  const exportProgress = useCallback(() => {
    const data = {
      discovered: discoveredEasterEggs,
      progress: Object.fromEntries(activeProgress),
      config: recognitionConfig,
      timestamp: Date.now(),
      version: '1.0'
    }
    
    return btoa(JSON.stringify(data))
  }, [discoveredEasterEggs, activeProgress, recognitionConfig])
  
  const importProgress = useCallback((data: string) => {
    try {
      const decoded = JSON.parse(atob(data))
      
      if (decoded.version === '1.0') {
        setDiscoveredEasterEggs(decoded.discovered || [])
        setActiveProgress(new Map(Object.entries(decoded.progress || {})))
        setRecognitionConfig(prev => ({ ...prev, ...decoded.config }))
        return true
      }
      
      return false
    } catch (error) {
      console.error('Failed to import easter egg progress:', error)
      return false
    }
  }, [])
  
  // Calculate discovery rate
  const discoveryRate = totalEasterEggs > 0 ? (discoveredEasterEggs.length / totalEasterEggs) * 100 : 0
  
  // Context value
  const contextValue: EasterEggContextType = {
    discoveredEasterEggs,
    activeProgress,
    totalEasterEggs,
    discoveryRate,
    isEnabled,
    recognitionConfig,
    triggerDiscoveryCheck,
    resetProgress,
    enableDiscovery,
    updateConfig,
    setAccessibilityMode,
    getKeyboardAlternatives,
    getShareableUrl,
    exportProgress,
    importProgress
  }
  
  return (
    <EasterEggContext.Provider value={contextValue}>
      {children}
    </EasterEggContext.Provider>
  )
}

export default EasterEggProvider
