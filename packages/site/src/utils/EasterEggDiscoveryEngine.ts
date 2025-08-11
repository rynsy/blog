/**
 * AI-Powered Easter Egg Discovery Engine
 * 
 * Sophisticated pattern recognition system for discovering hidden easter eggs
 * with progressive difficulty levels, accessibility support, and performance optimization.
 */

import { PerformanceMonitor } from './PerformanceMonitor'
import { DeviceCapabilityManager } from './DeviceCapabilityManager'
import { EasterEgg, EasterEggTrigger, Achievement } from '../../../interfaces/BackgroundSystemV3'

// ============================================================================
// Pattern Recognition Types
// ============================================================================

export interface PatternEvent {
  type: 'keyboard' | 'mouse' | 'touch' | 'scroll' | 'time' | 'performance'
  data: unknown
  timestamp: number
  confidence?: number
  metadata?: Record<string, unknown>
}

export interface PatternMatch {
  patternId: string
  confidence: number
  progress: number // 0-1
  timeWindow: number // ms
  events: PatternEvent[]
  metadata?: Record<string, unknown>
}

export interface GesturePoint {
  x: number
  y: number
  timestamp: number
  pressure?: number
  velocity?: { x: number; y: number }
}

export interface KeyboardPattern {
  sequence: string[]
  timing?: {
    maxInterval: number // max ms between keys
    minInterval?: number // min ms between keys
    totalTime?: number // max time for entire sequence
  }
  modifiers?: {
    ctrl?: boolean
    alt?: boolean
    shift?: boolean
    meta?: boolean
  }
}

export interface MouseGesture {
  type: 'circle' | 'spiral' | 'zigzag' | 'figure8' | 'star' | 'triangle' | 'square' | 'heart'
  minRadius?: number
  maxRadius?: number
  tolerance: number // 0-1, higher = more forgiving
  minPoints: number
  clockwise?: boolean // undefined means either direction
  centerTolerance?: number // how close to center point variations can be
}

export interface ScrollPattern {
  type: 'rhythm' | 'distance' | 'acceleration' | 'direction_changes'
  data: {
    rhythm?: number[] // array of intervals in ms
    distance?: number // total scroll distance
    acceleration?: { min: number; max: number }
    directionChanges?: number // number of direction reversals
  }
  tolerance: number
}

export interface TimePattern {
  type: 'duration' | 'time_of_day' | 'periodic' | 'idle'
  data: {
    duration?: number // ms
    timeOfDay?: { start: number; end: number } // hours 0-23
    interval?: number // ms for periodic patterns
    idleTime?: number // ms of no interaction
  }
}

export interface PerformancePattern {
  type: 'fps_threshold' | 'memory_usage' | 'interaction_rate' | 'module_switches'
  data: {
    fpsThreshold?: { min?: number; max?: number; duration: number }
    memoryThreshold?: { min?: number; max?: number; duration: number }
    interactionRate?: { min: number; duration: number } // interactions per second
    moduleSwitches?: { count: number; timeWindow: number }
  }
}

export interface DifficultyLevel {
  level: 1 | 2 | 3 | 4 | 5
  name: 'obvious' | 'discoverable' | 'hidden' | 'cryptic' | 'legendary'
  percentage: number // % of total easter eggs at this level
  description: string
  hintSystem: {
    enabled: boolean
    nearMissThreshold: number // 0-1, how close user needs to get for hints
    maxHints: number
    hintDelay: number // ms between hints
  }
}

// ============================================================================
// Core Easter Egg Discovery Engine
// ============================================================================

export class EasterEggDiscoveryEngine {
  private isActive = false
  private patternBuffer: PatternEvent[] = []
  private activePatterns = new Map<string, PatternMatch>()
  private discoveredEasterEggs = new Set<string>()
  private nearMisses = new Map<string, number>()
  private accessibilityMode = false
  private performanceMode: 'low' | 'medium' | 'high' = 'medium'
  
  private readonly BUFFER_SIZE = 1000
  private readonly PATTERN_TIMEOUT = 30000 // 30s
  private readonly NEAR_MISS_THRESHOLD = 0.7
  private readonly PERFORMANCE_CHECK_INTERVAL = 1000 // 1s
  
  private keyboardRecognizer: KeyboardPatternRecognizer
  private mouseGestureRecognizer: MouseGestureRecognizer
  private scrollPatternRecognizer: ScrollPatternRecognizer
  private timePatternRecognizer: TimePatternRecognizer
  private performancePatternRecognizer: PerformancePatternRecognizer
  
  private easterEggRegistry = new Map<string, EasterEgg>()
  private difficultyLevels: DifficultyLevel[] = [
    {
      level: 1,
      name: 'obvious',
      percentage: 10,
      description: 'Simple sequences like Konami code, corner clicks',
      hintSystem: {
        enabled: true,
        nearMissThreshold: 0.3,
        maxHints: 3,
        hintDelay: 5000
      }
    },
    {
      level: 2,
      name: 'discoverable',
      percentage: 25,
      description: 'Mouse gestures, timing patterns, scroll patterns',
      hintSystem: {
        enabled: true,
        nearMissThreshold: 0.5,
        maxHints: 2,
        hintDelay: 10000
      }
    },
    {
      level: 3,
      name: 'hidden',
      percentage: 40,
      description: 'Complex key combinations, interaction sequences',
      hintSystem: {
        enabled: true,
        nearMissThreshold: 0.6,
        maxHints: 1,
        hintDelay: 15000
      }
    },
    {
      level: 4,
      name: 'cryptic',
      percentage: 20,
      description: 'Multi-step puzzles, pattern recognition challenges',
      hintSystem: {
        enabled: false,
        nearMissThreshold: 0.8,
        maxHints: 0,
        hintDelay: 0
      }
    },
    {
      level: 5,
      name: 'legendary',
      percentage: 5,
      description: 'Extremely complex combinations requiring dedication',
      hintSystem: {
        enabled: false,
        nearMissThreshold: 0.9,
        maxHints: 0,
        hintDelay: 0
      }
    }
  ]
  
  private eventListeners: (() => void)[] = []
  private performanceMonitor?: PerformanceMonitor
  private deviceCapabilityManager?: DeviceCapabilityManager
  
  constructor(
    performanceMonitor?: PerformanceMonitor,
    deviceCapabilityManager?: DeviceCapabilityManager
  ) {
    this.performanceMonitor = performanceMonitor
    this.deviceCapabilityManager = deviceCapabilityManager
    
    // Initialize pattern recognizers
    this.keyboardRecognizer = new KeyboardPatternRecognizer()
    this.mouseGestureRecognizer = new MouseGestureRecognizer()
    this.scrollPatternRecognizer = new ScrollPatternRecognizer()
    this.timePatternRecognizer = new TimePatternRecognizer()
    this.performancePatternRecognizer = new PerformancePatternRecognizer()
    
    // Load saved progress
    this.loadProgress()
    
    // Setup default easter eggs
    this.setupDefaultEasterEggs()
    
    // Detect accessibility preferences
    this.detectAccessibilityPreferences()
  }
  
  /**
   * Start the easter egg discovery system
   */
  start(): void {
    if (this.isActive) return
    
    this.isActive = true
    this.setupEventListeners()
    this.startPerformanceMonitoring()
    
    console.log('🥚 Easter Egg Discovery Engine activated')
  }
  
  /**
   * Stop the easter egg discovery system
   */
  stop(): void {
    if (!this.isActive) return
    
    this.isActive = false
    this.cleanup()
    
    console.log('🥚 Easter Egg Discovery Engine deactivated')
  }
  
  /**
   * Register a new easter egg
   */
  registerEasterEgg(easterEgg: EasterEgg): void {
    this.easterEggRegistry.set(easterEgg.id, easterEgg)
  }
  
  /**
   * Check if an easter egg has been discovered
   */
  isDiscovered(easterEggId: string): boolean {
    return this.discoveredEasterEggs.has(easterEggId)
  }
  
  /**
   * Get all discovered easter eggs
   */
  getDiscoveredEasterEggs(): Achievement[] {
    return Array.from(this.discoveredEasterEggs)
      .map(id => this.easterEggRegistry.get(id))
      .filter(Boolean)
      .map(egg => ({
        id: egg!.id,
        name: egg!.name,
        description: egg!.description,
        icon: '🥚', // Default icon
        discovered: true,
        timestamp: Date.now() // Would be stored in real implementation
      }))
  }
  
  /**
   * Enable/disable accessibility mode
   */
  setAccessibilityMode(enabled: boolean): void {
    this.accessibilityMode = enabled
    if (enabled) {
      this.setupAccessibilityAlternatives()
    }
  }
  
  /**
   * Set performance mode
   */
  setPerformanceMode(mode: 'low' | 'medium' | 'high'): void {
    this.performanceMode = mode
    this.adjustPerformanceSettings()
  }
  
  /**
   * Process a new event for pattern matching
   */
  private processEvent(event: PatternEvent): void {
    if (!this.isActive) return
    
    // Add to buffer with size limit
    this.patternBuffer.push(event)
    if (this.patternBuffer.length > this.BUFFER_SIZE) {
      this.patternBuffer.shift()
    }
    
    // Check all registered patterns
    this.checkPatterns(event)
    
    // Clean up expired patterns
    this.cleanupExpiredPatterns()
  }
  
  /**
   * Check all patterns against the current event
   */
  private checkPatterns(event: PatternEvent): void {
    for (const [eggId, easterEgg] of this.easterEggRegistry.entries()) {
      if (this.discoveredEasterEggs.has(eggId)) continue
      
      const match = this.matchPattern(easterEgg.trigger, event)
      if (match) {
        if (match.confidence >= 1.0) {
          this.triggerEasterEgg(easterEgg)
        } else {
          this.updatePatternProgress(eggId, match)
        }
      }
    }
  }
  
  /**
   * Match an event against a pattern
   */
  private matchPattern(trigger: EasterEggTrigger, event: PatternEvent): PatternMatch | null {
    switch (trigger.type) {
      case 'keySequence':
        return this.keyboardRecognizer.match(trigger.condition as KeyboardPattern, event)
      
      case 'clickPattern':
        return this.mouseGestureRecognizer.match(trigger.condition as MouseGesture, event)
      
      case 'timeSpent':
        return this.timePatternRecognizer.match(trigger.condition as TimePattern, event)
      
      case 'performance':
        return this.performancePatternRecognizer.match(trigger.condition as PerformancePattern, event)
      
      default:
        return null
    }
  }
  
  /**
   * Update pattern progress and check for near misses
   */
  private updatePatternProgress(eggId: string, match: PatternMatch): void {
    this.activePatterns.set(eggId, match)
    
    // Check for near miss (hint system)
    if (match.confidence >= this.NEAR_MISS_THRESHOLD) {
      this.handleNearMiss(eggId, match)
    }
  }
  
  /**
   * Handle near miss for hint system
   */
  private handleNearMiss(eggId: string, match: PatternMatch): void {
    const easterEgg = this.easterEggRegistry.get(eggId)
    if (!easterEgg) return
    
    const difficulty = this.difficultyLevels.find(d => d.level === this.getDifficultyLevel(easterEgg))
    if (!difficulty?.hintSystem.enabled) return
    
    const nearMissCount = this.nearMisses.get(eggId) || 0
    this.nearMisses.set(eggId, nearMissCount + 1)
    
    // Show hint if threshold met
    if (nearMissCount >= difficulty.hintSystem.nearMissThreshold * 10) {
      this.showHint(easterEgg, match)
    }
  }
  
  /**
   * Trigger an easter egg discovery
   */
  private triggerEasterEgg(easterEgg: EasterEgg): void {
    this.discoveredEasterEggs.add(easterEgg.id)
    this.activePatterns.delete(easterEgg.id)
    this.nearMisses.delete(easterEgg.id)
    
    // Save progress
    this.saveProgress()
    
    // Show reward
    this.showReward(easterEgg)
    
    // Emit discovery event
    this.emitDiscoveryEvent(easterEgg)
    
    console.log(`🎉 Easter egg discovered: ${easterEgg.name}`)
  }
  
  /**
   * Show hint to user
   */
  private showHint(easterEgg: EasterEgg, match: PatternMatch): void {
    if (!easterEgg.hints || easterEgg.hints.length === 0) return
    
    const hintIndex = Math.min(
      Math.floor(match.progress * easterEgg.hints.length),
      easterEgg.hints.length - 1
    )
    
    const hint = easterEgg.hints[hintIndex]
    this.showNotification({
      title: 'Hint',
      description: hint,
      type: 'hint',
      duration: 5000
    })
  }
  
  /**
   * Show reward notification
   */
  private showReward(easterEgg: EasterEgg): void {
    this.showNotification({
      title: easterEgg.reward.notification.title,
      description: easterEgg.reward.notification.description,
      type: 'reward',
      duration: 8000,
      icon: easterEgg.reward.notification.icon || '🥚'
    })
  }
  
  /**
   * Show notification (to be implemented by integrating component)
   */
  private showNotification(notification: {
    title: string
    description: string
    type: 'hint' | 'reward'
    duration: number
    icon?: string
  }): void {
    // This would integrate with the site's notification system
    console.log(`📨 ${notification.type.toUpperCase()}: ${notification.title} - ${notification.description}`)
  }
  
  /**
   * Emit discovery event for analytics/integration
   */
  private emitDiscoveryEvent(easterEgg: EasterEgg): void {
    const event = new CustomEvent('easterEggDiscovered', {
      detail: {
        id: easterEgg.id,
        name: easterEgg.name,
        category: easterEgg.category,
        rarity: easterEgg.rarity,
        timestamp: Date.now()
      }
    })
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(event)
    }
  }
  
  /**
   * Setup default easter eggs
   */
  private setupDefaultEasterEggs(): void {
    // Level 1: Obvious - Konami Code
    this.registerEasterEgg({
      id: 'konami-code',
      name: 'The Classic',
      description: 'You found the legendary Konami Code!',
      category: 'sequence',
      trigger: {
        type: 'keySequence',
        condition: {
          sequence: ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'],
          timing: {
            maxInterval: 1000,
            totalTime: 15000
          }
        } as KeyboardPattern
      },
      reward: {
        type: 'module',
        unlock: 'konami-background',
        notification: {
          title: '🕹️ Classic Unlocked!',
          description: 'The legendary Konami Code has unlocked a special background module!'
        }
      },
      rarity: 'common',
      hints: [
        'Try some classic video game sequences...',
        'Think Nintendo, think classic cheat codes...',
        'Up, up, down, down...'
      ]
    })
    
    // Level 2: Discoverable - Circle Gesture
    this.registerEasterEgg({
      id: 'circle-of-life',
      name: 'Circle of Life',
      description: 'Your circular motion awakened something magical!',
      category: 'interaction',
      trigger: {
        type: 'clickPattern',
        condition: {
          type: 'circle',
          minRadius: 50,
          maxRadius: 200,
          tolerance: 0.7,
          minPoints: 20
        } as MouseGesture
      },
      reward: {
        type: 'configuration',
        unlock: 'particle-vortex',
        notification: {
          title: '🌀 Vortex Unlocked!',
          description: 'Your circular gesture has unlocked a particle vortex effect!'
        }
      },
      rarity: 'common',
      hints: [
        'Try drawing shapes with your mouse...',
        'Circular motions might be key...'
      ]
    })
    
    // Level 3: Hidden - Performance Trigger
    this.registerEasterEgg({
      id: 'performance-master',
      name: 'Performance Master',
      description: 'Your system runs like butter!',
      category: 'performance',
      trigger: {
        type: 'performance',
        condition: {
          type: 'fps_threshold',
          data: {
            fpsThreshold: { min: 58, duration: 30000 }
          }
        } as PerformancePattern
      },
      reward: {
        type: 'achievement',
        unlock: 'smooth-operator',
        notification: {
          title: '⚡ Smooth Operator!',
          description: 'Your system maintained perfect performance for 30 seconds!'
        }
      },
      rarity: 'rare'
    })
    
    // Level 4: Cryptic - Time-based
    this.registerEasterEgg({
      id: 'midnight-mystery',
      name: 'Midnight Mystery',
      description: 'The witching hour reveals its secrets...',
      category: 'time',
      trigger: {
        type: 'timeSpent',
        condition: {
          type: 'time_of_day',
          data: {
            timeOfDay: { start: 0, end: 1 } // Midnight to 1 AM
          }
        } as TimePattern
      },
      reward: {
        type: 'theme',
        unlock: 'midnight-theme',
        notification: {
          title: '🌙 Midnight Theme Unlocked!',
          description: 'The darkness reveals hidden beauty...'
        }
      },
      rarity: 'rare'
    })
    
    // Level 5: Legendary - Complex sequence
    this.registerEasterEgg({
      id: 'the-matrix',
      name: 'The Matrix',
      description: 'Welcome to the real world...',
      category: 'sequence',
      trigger: {
        type: 'keySequence',
        condition: {
          sequence: ['KeyT', 'KeyH', 'KeyE', 'Space', 'KeyM', 'KeyA', 'KeyT', 'KeyR', 'KeyI', 'KeyX'],
          timing: {
            maxInterval: 500,
            totalTime: 10000
          },
          modifiers: {
            ctrl: true
          }
        } as KeyboardPattern
      },
      reward: {
        type: 'module',
        unlock: 'matrix-rain',
        notification: {
          title: '💊 Red Pill Taken!',
          description: 'Reality is not what it seems... Matrix rain module unlocked!'
        }
      },
      rarity: 'legendary'
    })
  }
  
  /**
   * Get difficulty level for an easter egg
   */
  private getDifficultyLevel(easterEgg: EasterEgg): number {
    // Simple mapping based on rarity for now
    switch (easterEgg.rarity) {
      case 'common': return Math.random() < 0.5 ? 1 : 2
      case 'rare': return Math.random() < 0.5 ? 3 : 4
      case 'legendary': return 5
      default: return 3
    }
  }
  
  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    if (typeof window === 'undefined') return
    
    // Keyboard events
    const handleKeydown = (e: KeyboardEvent) => {
      this.processEvent({
        type: 'keyboard',
        data: {
          key: e.code,
          modifiers: {
            ctrl: e.ctrlKey,
            alt: e.altKey,
            shift: e.shiftKey,
            meta: e.metaKey
          }
        },
        timestamp: Date.now()
      })
    }
    
    // Mouse events
    const handleMouseMove = (e: MouseEvent) => {
      if (this.performanceMode === 'low' && Math.random() > 0.1) return // Throttle on low performance
      
      this.processEvent({
        type: 'mouse',
        data: {
          x: e.clientX,
          y: e.clientY,
          button: e.button,
          type: 'move'
        },
        timestamp: Date.now()
      })
    }
    
    const handleClick = (e: MouseEvent) => {
      this.processEvent({
        type: 'mouse',
        data: {
          x: e.clientX,
          y: e.clientY,
          button: e.button,
          type: 'click'
        },
        timestamp: Date.now()
      })
    }
    
    // Scroll events
    const handleScroll = (e: Event) => {
      this.processEvent({
        type: 'scroll',
        data: {
          scrollY: window.scrollY,
          deltaY: (e as WheelEvent).deltaY,
          deltaX: (e as WheelEvent).deltaX
        },
        timestamp: Date.now()
      })
    }
    
    // Touch events for mobile
    const handleTouch = (e: TouchEvent) => {
      if (e.touches.length === 0) return
      
      const touch = e.touches[0]
      this.processEvent({
        type: 'touch',
        data: {
          x: touch.clientX,
          y: touch.clientY,
          type: e.type,
          force: (touch as any).force || 1
        },
        timestamp: Date.now()
      })
    }
    
    // Attach listeners
    window.addEventListener('keydown', handleKeydown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('click', handleClick)
    window.addEventListener('wheel', handleScroll, { passive: true })
    window.addEventListener('touchstart', handleTouch)
    window.addEventListener('touchmove', handleTouch)
    window.addEventListener('touchend', handleTouch)
    
    // Store cleanup functions
    this.eventListeners = [
      () => window.removeEventListener('keydown', handleKeydown),
      () => window.removeEventListener('mousemove', handleMouseMove),
      () => window.removeEventListener('click', handleClick),
      () => window.removeEventListener('wheel', handleScroll),
      () => window.removeEventListener('touchstart', handleTouch),
      () => window.removeEventListener('touchmove', handleTouch),
      () => window.removeEventListener('touchend', handleTouch)
    ]
  }
  
  /**
   * Start performance monitoring for performance-based easter eggs
   */
  private startPerformanceMonitoring(): void {
    if (!this.performanceMonitor) return
    
    const checkPerformance = () => {
      if (!this.isActive) return
      
      const metrics = this.performanceMonitor!.getMetrics()
      this.processEvent({
        type: 'performance',
        data: metrics,
        timestamp: Date.now()
      })
    }
    
    const interval = setInterval(checkPerformance, this.PERFORMANCE_CHECK_INTERVAL)
    this.eventListeners.push(() => clearInterval(interval))
  }
  
  /**
   * Clean up expired pattern matches
   */
  private cleanupExpiredPatterns(): void {
    const now = Date.now()
    for (const [eggId, match] of this.activePatterns.entries()) {
      if (now - match.timeWindow > this.PATTERN_TIMEOUT) {
        this.activePatterns.delete(eggId)
      }
    }
  }
  
  /**
   * Detect accessibility preferences
   */
  private detectAccessibilityPreferences(): void {
    if (typeof window === 'undefined') return
    
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    
    // Check for high contrast preference
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches
    
    if (prefersReducedMotion || prefersHighContrast) {
      this.setAccessibilityMode(true)
    }
  }
  
  /**
   * Setup accessibility alternatives
   */
  private setupAccessibilityAlternatives(): void {
    // Add keyboard-only alternatives for gesture-based easter eggs
    // This would be expanded based on specific needs
    console.log('🔧 Accessibility alternatives activated')
  }
  
  /**
   * Adjust performance settings based on mode
   */
  private adjustPerformanceSettings(): void {
    switch (this.performanceMode) {
      case 'low':
        // Reduce pattern matching frequency
        // Disable complex gesture recognition
        break
      case 'medium':
        // Default settings
        break
      case 'high':
        // Enable all features
        // Increase pattern matching sensitivity
        break
    }
  }
  
  /**
   * Save discovery progress to localStorage
   */
  private saveProgress(): void {
    if (typeof window === 'undefined') return
    
    const progress = {
      discovered: Array.from(this.discoveredEasterEggs),
      nearMisses: Object.fromEntries(this.nearMisses),
      timestamp: Date.now()
    }
    
    localStorage.setItem('easter-egg-progress', JSON.stringify(progress))
  }
  
  /**
   * Load discovery progress from localStorage
   */
  private loadProgress(): void {
    if (typeof window === 'undefined') return
    
    try {
      const saved = localStorage.getItem('easter-egg-progress')
      if (saved) {
        const progress = JSON.parse(saved)
        this.discoveredEasterEggs = new Set(progress.discovered || [])
        this.nearMisses = new Map(Object.entries(progress.nearMisses || {}).map(([k, v]) => [k, v as number]))
      }
    } catch (error) {
      console.warn('Failed to load easter egg progress:', error)
    }
  }
  
  /**
   * Cleanup all resources
   */
  private cleanup(): void {
    // Remove event listeners
    this.eventListeners.forEach(cleanup => cleanup())
    this.eventListeners = []
    
    // Clear buffers and patterns
    this.patternBuffer = []
    this.activePatterns.clear()
    
    // Cleanup pattern recognizers
    this.keyboardRecognizer.cleanup()
    this.mouseGestureRecognizer.cleanup()
    this.scrollPatternRecognizer.cleanup()
    this.timePatternRecognizer.cleanup()
    this.performancePatternRecognizer.cleanup()
  }
}

// ============================================================================
// Pattern Recognizer Classes
// ============================================================================

/**
 * Keyboard pattern recognizer for key sequences
 */
class KeyboardPatternRecognizer {
  private keyBuffer: { key: string; timestamp: number; modifiers: any }[] = []
  private readonly MAX_BUFFER_SIZE = 50
  
  match(pattern: KeyboardPattern, event: PatternEvent): PatternMatch | null {
    if (event.type !== 'keyboard') return null
    
    const eventData = event.data as any
    this.keyBuffer.push({
      key: eventData.key,
      timestamp: event.timestamp,
      modifiers: eventData.modifiers
    })
    
    // Limit buffer size
    if (this.keyBuffer.length > this.MAX_BUFFER_SIZE) {
      this.keyBuffer.shift()
    }
    
    return this.checkSequence(pattern)
  }
  
  private checkSequence(pattern: KeyboardPattern): PatternMatch | null {
    const sequence = pattern.sequence
    if (this.keyBuffer.length < sequence.length) return null
    
    // Get last N keys where N is sequence length
    const recentKeys = this.keyBuffer.slice(-sequence.length)
    
    // Check if keys match
    let matchCount = 0
    for (let i = 0; i < sequence.length; i++) {
      if (recentKeys[i].key === sequence[i]) {
        matchCount++
      }
    }
    
    const confidence = matchCount / sequence.length
    
    // Check timing if specified
    if (pattern.timing && confidence > 0.5) {
      const totalTime = recentKeys[recentKeys.length - 1].timestamp - recentKeys[0].timestamp
      if (pattern.timing.totalTime && totalTime > pattern.timing.totalTime) {
        return null
      }
      
      // Check intervals between keys
      if (pattern.timing.maxInterval) {
        for (let i = 1; i < recentKeys.length; i++) {
          const interval = recentKeys[i].timestamp - recentKeys[i - 1].timestamp
          if (interval > pattern.timing.maxInterval) {
            return null
          }
        }
      }
    }
    
    // Check modifiers if specified
    if (pattern.modifiers && confidence > 0.5) {
      const lastKey = recentKeys[recentKeys.length - 1]
      const modifiersMatch = Object.keys(pattern.modifiers).every(
        key => lastKey.modifiers[key] === pattern.modifiers![key as keyof typeof pattern.modifiers]
      )
      if (!modifiersMatch) {
        return null
      }
    }
    
    if (confidence > 0.3) {
      return {
        patternId: 'keyboard-sequence',
        confidence,
        progress: confidence,
        timeWindow: recentKeys[recentKeys.length - 1].timestamp - recentKeys[0].timestamp,
        events: recentKeys.map(k => ({
          type: 'keyboard',
          data: k,
          timestamp: k.timestamp
        }) as PatternEvent)
      }
    }
    
    return null
  }
  
  cleanup(): void {
    this.keyBuffer = []
  }
}

/**
 * Mouse gesture recognizer for shapes and patterns
 */
class MouseGestureRecognizer {
  private points: GesturePoint[] = []
  private readonly MAX_POINTS = 200
  private readonly MIN_GESTURE_TIME = 100 // ms
  
  match(gesture: MouseGesture, event: PatternEvent): PatternMatch | null {
    if (event.type !== 'mouse') return null
    
    const eventData = event.data as any
    if (eventData.type === 'move') {
      this.points.push({
        x: eventData.x,
        y: eventData.y,
        timestamp: event.timestamp
      })
      
      // Limit points array size
      if (this.points.length > this.MAX_POINTS) {
        this.points.shift()
      }
    }
    
    if (eventData.type === 'click' || this.points.length >= gesture.minPoints) {
      return this.recognizeGesture(gesture)
    }
    
    return null
  }
  
  private recognizeGesture(gesture: MouseGesture): PatternMatch | null {
    if (this.points.length < gesture.minPoints) return null
    
    const recentPoints = this.points.slice(-gesture.minPoints)
    const timeSpan = recentPoints[recentPoints.length - 1].timestamp - recentPoints[0].timestamp
    
    if (timeSpan < this.MIN_GESTURE_TIME) return null
    
    let confidence = 0
    
    switch (gesture.type) {
      case 'circle':
        confidence = this.recognizeCircle(recentPoints, gesture)
        break
      case 'spiral':
        confidence = this.recognizeSpiral(recentPoints, gesture)
        break
      case 'figure8':
        confidence = this.recognizeFigure8(recentPoints, gesture)
        break
      // Add more gesture types as needed
    }
    
    if (confidence > 0.3) {
      return {
        patternId: `gesture-${gesture.type}`,
        confidence,
        progress: confidence,
        timeWindow: timeSpan,
        events: recentPoints.map(p => ({
          type: 'mouse',
          data: p,
          timestamp: p.timestamp
        }) as PatternEvent)
      }
    }
    
    return null
  }
  
  private recognizeCircle(points: GesturePoint[], gesture: MouseGesture): number {
    if (points.length < 8) return 0
    
    // Calculate center point
    const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length
    const centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length
    
    // Calculate average radius
    const radii = points.map(p => Math.sqrt((p.x - centerX) ** 2 + (p.y - centerY) ** 2))
    const avgRadius = radii.reduce((sum, r) => sum + r, 0) / radii.length
    
    // Check if radius is within bounds
    if (gesture.minRadius && avgRadius < gesture.minRadius) return 0
    if (gesture.maxRadius && avgRadius > gesture.maxRadius) return 0
    
    // Calculate how circular the path is
    const radiusVariance = radii.reduce((sum, r) => sum + Math.abs(r - avgRadius), 0) / radii.length
    const normalizedVariance = radiusVariance / avgRadius
    
    // Check angle coverage (should cover ~360 degrees for a circle)
    const angles = points.map(p => Math.atan2(p.y - centerY, p.x - centerX))
    const angleSpan = this.calculateAngleSpan(angles)
    
    const radiusScore = Math.max(0, 1 - normalizedVariance / gesture.tolerance)
    const angleScore = Math.min(1, angleSpan / (2 * Math.PI))
    
    return (radiusScore + angleScore) / 2
  }
  
  private recognizeSpiral(points: GesturePoint[], gesture: MouseGesture): number {
    // Simplified spiral detection
    if (points.length < 16) return 0
    
    const centerX = points[0].x
    const centerY = points[0].y
    
    let spiralScore = 0
    let expectedRadius = 0
    
    for (let i = 1; i < points.length; i++) {
      const radius = Math.sqrt((points[i].x - centerX) ** 2 + (points[i].y - centerY) ** 2)
      expectedRadius += 2 // Spiral should gradually increase radius
      
      const radiusError = Math.abs(radius - expectedRadius) / expectedRadius
      spiralScore += Math.max(0, 1 - radiusError)
    }
    
    return Math.min(1, spiralScore / (points.length - 1))
  }
  
  private recognizeFigure8(points: GesturePoint[], gesture: MouseGesture): number {
    // Simplified figure-8 detection
    if (points.length < 20) return 0
    
    // A figure-8 should have two loops with a crossing point
    // This is a basic implementation - could be much more sophisticated
    const midPoint = Math.floor(points.length / 2)
    const firstHalf = points.slice(0, midPoint)
    const secondHalf = points.slice(midPoint)
    
    // Check if both halves form roughly circular patterns
    const firstCircleScore = this.recognizeCircle(firstHalf, { ...gesture, type: 'circle' })
    const secondCircleScore = this.recognizeCircle(secondHalf, { ...gesture, type: 'circle' })
    
    // Check for crossing point (simplified)
    const hasCrossing = this.detectCrossing(points)
    
    return (firstCircleScore + secondCircleScore) / 2 * (hasCrossing ? 1 : 0.5)
  }
  
  private calculateAngleSpan(angles: number[]): number {
    if (angles.length < 2) return 0
    
    // Sort angles and find the largest gap
    const sortedAngles = [...angles].sort((a, b) => a - b)
    let maxGap = 0
    
    for (let i = 1; i < sortedAngles.length; i++) {
      maxGap = Math.max(maxGap, sortedAngles[i] - sortedAngles[i - 1])
    }
    
    // Include the wrap-around gap
    const wrapGap = (2 * Math.PI) - (sortedAngles[sortedAngles.length - 1] - sortedAngles[0])
    maxGap = Math.max(maxGap, wrapGap)
    
    return (2 * Math.PI) - maxGap
  }
  
  private detectCrossing(points: GesturePoint[]): boolean {
    // Simple line intersection detection
    // This is a basic implementation - could be optimized
    for (let i = 0; i < points.length - 3; i++) {
      for (let j = i + 2; j < points.length - 1; j++) {
        if (this.linesIntersect(points[i], points[i + 1], points[j], points[j + 1])) {
          return true
        }
      }
    }
    return false
  }
  
  private linesIntersect(p1: GesturePoint, p2: GesturePoint, p3: GesturePoint, p4: GesturePoint): boolean {
    const denominator = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y)
    if (denominator === 0) return false // Lines are parallel
    
    const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denominator
    const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denominator
    
    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1
  }
  
  cleanup(): void {
    this.points = []
  }
}

/**
 * Scroll pattern recognizer
 */
class ScrollPatternRecognizer {
  private scrollEvents: { scrollY: number; deltaY: number; timestamp: number }[] = []
  private readonly MAX_EVENTS = 100
  
  match(pattern: ScrollPattern, event: PatternEvent): PatternMatch | null {
    if (event.type !== 'scroll') return null
    
    const eventData = event.data as any
    this.scrollEvents.push({
      scrollY: eventData.scrollY,
      deltaY: eventData.deltaY,
      timestamp: event.timestamp
    })
    
    if (this.scrollEvents.length > this.MAX_EVENTS) {
      this.scrollEvents.shift()
    }
    
    return this.recognizeScrollPattern(pattern)
  }
  
  private recognizeScrollPattern(pattern: ScrollPattern): PatternMatch | null {
    if (this.scrollEvents.length < 5) return null
    
    let confidence = 0
    
    switch (pattern.type) {
      case 'rhythm':
        confidence = this.recognizeRhythm(pattern)
        break
      case 'distance':
        confidence = this.recognizeDistance(pattern)
        break
      case 'direction_changes':
        confidence = this.recognizeDirectionChanges(pattern)
        break
    }
    
    if (confidence > 0.3) {
      const timeWindow = this.scrollEvents[this.scrollEvents.length - 1].timestamp - this.scrollEvents[0].timestamp
      return {
        patternId: `scroll-${pattern.type}`,
        confidence,
        progress: confidence,
        timeWindow,
        events: this.scrollEvents.map(e => ({
          type: 'scroll',
          data: e,
          timestamp: e.timestamp
        }) as PatternEvent)
      }
    }
    
    return null
  }
  
  private recognizeRhythm(pattern: ScrollPattern): number {
    if (!pattern.data.rhythm || this.scrollEvents.length < pattern.data.rhythm.length + 1) return 0
    
    const intervals = []
    for (let i = 1; i < this.scrollEvents.length; i++) {
      intervals.push(this.scrollEvents[i].timestamp - this.scrollEvents[i - 1].timestamp)
    }
    
    const targetRhythm = pattern.data.rhythm
    const recentIntervals = intervals.slice(-targetRhythm.length)
    
    let score = 0
    for (let i = 0; i < targetRhythm.length; i++) {
      if (i < recentIntervals.length) {
        const error = Math.abs(recentIntervals[i] - targetRhythm[i]) / targetRhythm[i]
        score += Math.max(0, 1 - error / pattern.tolerance)
      }
    }
    
    return score / targetRhythm.length
  }
  
  private recognizeDistance(pattern: ScrollPattern): number {
    if (!pattern.data.distance) return 0
    
    const totalDistance = this.scrollEvents.reduce((sum, event, i) => {
      if (i === 0) return 0
      return sum + Math.abs(event.scrollY - this.scrollEvents[i - 1].scrollY)
    }, 0)
    
    const error = Math.abs(totalDistance - pattern.data.distance) / pattern.data.distance
    return Math.max(0, 1 - error / pattern.tolerance)
  }
  
  private recognizeDirectionChanges(pattern: ScrollPattern): number {
    if (!pattern.data.directionChanges) return 0
    
    let changes = 0
    let lastDirection: 'up' | 'down' | null = null
    
    for (const event of this.scrollEvents) {
      const direction = event.deltaY > 0 ? 'down' : 'up'
      if (lastDirection && lastDirection !== direction) {
        changes++
      }
      lastDirection = direction
    }
    
    const error = Math.abs(changes - pattern.data.directionChanges) / pattern.data.directionChanges
    return Math.max(0, 1 - error / pattern.tolerance)
  }
  
  cleanup(): void {
    this.scrollEvents = []
  }
}

/**
 * Time pattern recognizer
 */
class TimePatternRecognizer {
  private startTime: number = Date.now()
  private lastActivity: number = Date.now()
  
  match(pattern: TimePattern, event: PatternEvent): PatternMatch | null {
    this.lastActivity = event.timestamp
    
    let confidence = 0
    
    switch (pattern.type) {
      case 'duration':
        confidence = this.checkDuration(pattern)
        break
      case 'time_of_day':
        confidence = this.checkTimeOfDay(pattern)
        break
      case 'idle':
        confidence = this.checkIdleTime(pattern)
        break
    }
    
    if (confidence > 0.3) {
      return {
        patternId: `time-${pattern.type}`,
        confidence,
        progress: confidence,
        timeWindow: event.timestamp - this.startTime,
        events: [event]
      }
    }
    
    return null
  }
  
  private checkDuration(pattern: TimePattern): number {
    if (!pattern.data.duration) return 0
    
    const elapsed = Date.now() - this.startTime
    const target = pattern.data.duration
    
    if (elapsed >= target) return 1
    return elapsed / target
  }
  
  private checkTimeOfDay(pattern: TimePattern): number {
    if (!pattern.data.timeOfDay) return 0
    
    const now = new Date()
    const hour = now.getHours()
    const { start, end } = pattern.data.timeOfDay
    
    if (start <= end) {
      return (hour >= start && hour <= end) ? 1 : 0
    } else {
      // Handles overnight ranges like 23-1
      return (hour >= start || hour <= end) ? 1 : 0
    }
  }
  
  private checkIdleTime(pattern: TimePattern): number {
    if (!pattern.data.idleTime) return 0
    
    const idleTime = Date.now() - this.lastActivity
    const target = pattern.data.idleTime
    
    if (idleTime >= target) return 1
    return idleTime / target
  }
  
  cleanup(): void {
    this.startTime = Date.now()
    this.lastActivity = Date.now()
  }
}

/**
 * Performance pattern recognizer
 */
class PerformancePatternRecognizer {
  private performanceHistory: any[] = []
  private readonly MAX_HISTORY = 100
  
  match(pattern: PerformancePattern, event: PatternEvent): PatternMatch | null {
    if (event.type !== 'performance') return null
    
    this.performanceHistory.push({
      ...event.data,
      timestamp: event.timestamp
    })
    
    if (this.performanceHistory.length > this.MAX_HISTORY) {
      this.performanceHistory.shift()
    }
    
    return this.recognizePerformancePattern(pattern)
  }
  
  private recognizePerformancePattern(pattern: PerformancePattern): PatternMatch | null {
    if (this.performanceHistory.length < 5) return null
    
    let confidence = 0
    
    switch (pattern.type) {
      case 'fps_threshold':
        confidence = this.checkFPSThreshold(pattern)
        break
      case 'memory_usage':
        confidence = this.checkMemoryThreshold(pattern)
        break
      case 'interaction_rate':
        confidence = this.checkInteractionRate(pattern)
        break
    }
    
    if (confidence > 0.3) {
      const timeWindow = this.performanceHistory[this.performanceHistory.length - 1].timestamp - this.performanceHistory[0].timestamp
      return {
        patternId: `performance-${pattern.type}`,
        confidence,
        progress: confidence,
        timeWindow,
        events: this.performanceHistory.map(p => ({
          type: 'performance',
          data: p,
          timestamp: p.timestamp
        }) as PatternEvent)
      }
    }
    
    return null
  }
  
  private checkFPSThreshold(pattern: PerformancePattern): number {
    if (!pattern.data.fpsThreshold) return 0
    
    const { min, max, duration } = pattern.data.fpsThreshold
    const recentHistory = this.performanceHistory.filter(
      p => Date.now() - p.timestamp <= duration
    )
    
    if (recentHistory.length === 0) return 0
    
    const validFrames = recentHistory.filter(p => {
      if (min !== undefined && p.fps < min) return false
      if (max !== undefined && p.fps > max) return false
      return true
    })
    
    const ratio = validFrames.length / recentHistory.length
    const timeRatio = (recentHistory[recentHistory.length - 1].timestamp - recentHistory[0].timestamp) / duration
    
    return Math.min(ratio, timeRatio)
  }
  
  private checkMemoryThreshold(pattern: PerformancePattern): number {
    // Similar to FPS but for memory usage
    if (!pattern.data.memoryThreshold) return 0
    
    const { min, max, duration } = pattern.data.memoryThreshold
    const recentHistory = this.performanceHistory.filter(
      p => Date.now() - p.timestamp <= duration
    )
    
    if (recentHistory.length === 0) return 0
    
    const validEntries = recentHistory.filter(p => {
      if (min !== undefined && p.memoryUsage < min) return false
      if (max !== undefined && p.memoryUsage > max) return false
      return true
    })
    
    return validEntries.length / recentHistory.length
  }
  
  private checkInteractionRate(pattern: PerformancePattern): number {
    // This would need integration with interaction tracking
    // Placeholder implementation
    return 0
  }
  
  cleanup(): void {
    this.performanceHistory = []
  }
}
