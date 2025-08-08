/**
 * Easter Egg Discovery System Implementation Example
 * 
 * This demonstrates a comprehensive easter egg system with achievement tracking,
 * various trigger types, and reward mechanisms for the background system.
 */

import { 
  EasterEgg, 
  EasterEggTrigger, 
  EasterEggReward, 
  Achievement 
} from '../interfaces/BackgroundSystemV3'

// ============================================================================
// Easter Egg Manager
// ============================================================================

export class EasterEggManager {
  private easterEggs: Map<string, EasterEgg> = new Map()
  private achievements: Map<string, Achievement> = new Map()
  private discoveredEggs: Set<string> = new Set()
  
  // Tracking state for various trigger types
  private keySequenceState: KeySequenceTracker = new KeySequenceTracker()
  private clickPatternState: ClickPatternTracker = new ClickPatternTracker()
  private timeTracker: TimeTracker = new TimeTracker()
  private performanceTracker: PerformanceTracker = new PerformanceTracker()
  private configurationTracker: ConfigurationTracker = new ConfigurationTracker()
  
  // Storage keys
  private readonly STORAGE_KEY = 'background-easter-eggs'
  private readonly ACHIEVEMENTS_KEY = 'background-achievements'
  
  constructor() {
    this.loadProgress()
    this.setupEventListeners()
    this.registerBuiltInEasterEggs()
  }

  // ============================================================================
  // Easter Egg Registration
  // ============================================================================

  registerEasterEgg(egg: EasterEgg): void {
    this.easterEggs.set(egg.id, egg)
    
    // Create achievement if not exists
    if (!this.achievements.has(egg.id)) {
      this.achievements.set(egg.id, {
        id: egg.id,
        name: egg.name,
        description: egg.description,
        icon: this.getEggIcon(egg),
        discovered: this.discoveredEggs.has(egg.id),
        timestamp: undefined
      })
    }
  }

  private registerBuiltInEasterEggs(): void {
    // Konami Code Easter Egg
    this.registerEasterEgg({
      id: 'konami-code',
      name: 'The Classic',
      description: 'You know the code...',
      category: 'sequence',
      trigger: {
        type: 'keySequence',
        condition: ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'],
        timeout: 30000
      },
      reward: {
        type: 'module',
        unlock: 'retro-matrix',
        notification: {
          title: 'Konami Code Activated!',
          description: 'Unlocked the retro matrix background module',
          icon: '🎮',
          sound: 'achievement'
        }
      },
      rarity: 'legendary'
    })

    // Time Dedication Easter Egg
    this.registerEasterEgg({
      id: 'time-dedication',
      name: 'Dedication',
      description: 'Spent significant time exploring backgrounds',
      category: 'time',
      trigger: {
        type: 'timeSpent',
        condition: { totalTime: 5 * 60 * 1000 }, // 5 minutes
        timeout: undefined
      },
      reward: {
        type: 'theme',
        unlock: 'midnight',
        notification: {
          title: 'Time Well Spent',
          description: 'Unlocked the midnight theme',
          icon: '⏰'
        }
      },
      rarity: 'common'
    })

    // Performance Enthusiast Easter Egg
    this.registerEasterEgg({
      id: 'performance-enthusiast',
      name: 'Performance Enthusiast',
      description: 'Achieved consistently high performance',
      category: 'performance',
      trigger: {
        type: 'performance',
        condition: { minFPS: 58, duration: 60000 }, // 58+ FPS for 1 minute
        timeout: undefined
      },
      reward: {
        type: 'configuration',
        unlock: 'high-performance-preset',
        notification: {
          title: 'Smooth Operator',
          description: 'Unlocked high-performance preset',
          icon: '⚡'
        }
      },
      rarity: 'rare'
    })

    // Secret Click Pattern
    this.registerEasterEgg({
      id: 'secret-pattern',
      name: 'Pattern Master',
      description: 'Discovered the secret click pattern',
      category: 'interaction',
      trigger: {
        type: 'clickPattern',
        condition: { pattern: 'circle', precision: 0.8, timeLimit: 10000 },
        timeout: undefined
      },
      reward: {
        type: 'module',
        unlock: 'spiral-galaxy',
        notification: {
          title: 'Pattern Recognized!',
          description: 'Unlocked the spiral galaxy module',
          icon: '🌌'
        }
      },
      rarity: 'rare'
    })

    // Configuration Explorer
    this.registerEasterEgg({
      id: 'configuration-explorer',
      name: 'Configuration Explorer',
      description: 'Tried many different configurations',
      category: 'configuration',
      trigger: {
        type: 'configMatch',
        condition: { uniqueConfigurations: 10 },
        timeout: undefined
      },
      reward: {
        type: 'achievement',
        unlock: 'explorer-badge',
        notification: {
          title: 'Configuration Explorer',
          description: 'You\'ve tried many different settings!',
          icon: '🔬'
        }
      },
      rarity: 'common'
    })

    // Developer Console Easter Egg
    this.registerEasterEgg({
      id: 'developer-console',
      name: 'Inspector',
      description: 'Found the hidden console command',
      category: 'interaction',
      trigger: {
        type: 'keySequence',
        condition: ['F12', 'console.log("background.unlock()")'],
        timeout: 5000
      },
      reward: {
        type: 'module',
        unlock: 'debug-visualizer',
        notification: {
          title: 'Developer Mode Activated',
          description: 'Unlocked debug visualizer module',
          icon: '👨‍💻'
        }
      },
      rarity: 'legendary'
    })
  }

  // ============================================================================
  // Trigger Detection
  // ============================================================================

  private setupEventListeners(): void {
    // Keyboard events for key sequences
    document.addEventListener('keydown', (event) => {
      this.keySequenceState.addKey(event.code)
      this.checkKeySequenceTriggers()
    })

    // Mouse events for click patterns
    document.addEventListener('click', (event) => {
      this.clickPatternState.addClick(event.clientX, event.clientY)
      this.checkClickPatternTriggers()
    })

    // Background system events
    window.addEventListener('background-module-changed', ((event: CustomEvent) => {
      this.configurationTracker.addConfiguration(event.detail.config)
      this.checkConfigurationTriggers()
    }) as EventListener)

    window.addEventListener('background-performance-update', ((event: CustomEvent) => {
      this.performanceTracker.addMetrics(event.detail.metrics)
      this.checkPerformanceTriggers()
    }) as EventListener)

    // Time tracking
    this.timeTracker.start()
    setInterval(() => {
      this.checkTimeTriggers()
    }, 1000)
  }

  private checkKeySequenceTriggers(): void {
    this.easterEggs.forEach((egg) => {
      if (egg.trigger.type === 'keySequence' && !this.isDiscovered(egg.id)) {
        const sequence = egg.trigger.condition as string[]
        if (this.keySequenceState.matches(sequence)) {
          this.triggerEasterEgg(egg)
        }
      }
    })
  }

  private checkClickPatternTriggers(): void {
    this.easterEggs.forEach((egg) => {
      if (egg.trigger.type === 'clickPattern' && !this.isDiscovered(egg.id)) {
        const pattern = egg.trigger.condition as ClickPatternCondition
        if (this.clickPatternState.matches(pattern)) {
          this.triggerEasterEgg(egg)
        }
      }
    })
  }

  private checkTimeTriggers(): void {
    this.easterEggs.forEach((egg) => {
      if (egg.trigger.type === 'timeSpent' && !this.isDiscovered(egg.id)) {
        const condition = egg.trigger.condition as TimeCondition
        if (this.timeTracker.getTotalTime() >= condition.totalTime) {
          this.triggerEasterEgg(egg)
        }
      }
    })
  }

  private checkPerformanceTriggers(): void {
    this.easterEggs.forEach((egg) => {
      if (egg.trigger.type === 'performance' && !this.isDiscovered(egg.id)) {
        const condition = egg.trigger.condition as PerformanceCondition
        if (this.performanceTracker.meetsCondition(condition)) {
          this.triggerEasterEgg(egg)
        }
      }
    })
  }

  private checkConfigurationTriggers(): void {
    this.easterEggs.forEach((egg) => {
      if (egg.trigger.type === 'configMatch' && !this.isDiscovered(egg.id)) {
        const condition = egg.trigger.condition as ConfigurationCondition
        if (this.configurationTracker.meetsCondition(condition)) {
          this.triggerEasterEgg(egg)
        }
      }
    })
  }

  // ============================================================================
  // Easter Egg Activation
  // ============================================================================

  private triggerEasterEgg(egg: EasterEgg): void {
    if (this.isDiscovered(egg.id)) return

    console.log(`🥚 Easter egg discovered: ${egg.name}`)
    
    // Mark as discovered
    this.discoveredEggs.add(egg.id)
    this.achievements.get(egg.id)!.discovered = true
    this.achievements.get(egg.id)!.timestamp = Date.now()

    // Apply reward
    this.applyReward(egg.reward)

    // Show notification
    this.showUnlockNotification(egg)

    // Save progress
    this.saveProgress()

    // Emit event for other systems
    window.dispatchEvent(new CustomEvent('easter-egg-discovered', {
      detail: { 
        eggId: egg.id, 
        egg: egg,
        achievement: this.achievements.get(egg.id)
      }
    }))

    // Add some flair based on rarity
    this.addDiscoveryFlair(egg.rarity)
  }

  private applyReward(reward: EasterEggReward): void {
    switch (reward.type) {
      case 'module':
        // Unlock new background module
        const moduleEvent = new CustomEvent('background-module-unlocked', {
          detail: { moduleId: reward.unlock }
        })
        window.dispatchEvent(moduleEvent)
        break

      case 'theme':
        // Unlock new theme
        const themeEvent = new CustomEvent('theme-unlocked', {
          detail: { themeId: reward.unlock }
        })
        window.dispatchEvent(themeEvent)
        break

      case 'configuration':
        // Unlock configuration preset
        const configEvent = new CustomEvent('configuration-preset-unlocked', {
          detail: { presetId: reward.unlock }
        })
        window.dispatchEvent(configEvent)
        break

      case 'achievement':
        // Just the achievement itself is the reward
        console.log('Achievement unlocked:', reward.unlock)
        break
    }
  }

  private showUnlockNotification(egg: EasterEgg): void {
    // Create notification element
    const notification = document.createElement('div')
    notification.className = `
      fixed top-4 right-4 z-50 max-w-sm p-4 bg-white dark:bg-gray-800 
      border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg
      transform translate-x-full transition-transform duration-300 ease-out
    `.trim()

    notification.innerHTML = `
      <div class="flex items-start space-x-3">
        <div class="flex-shrink-0 text-2xl">
          ${egg.reward.notification.icon || '🎉'}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-gray-900 dark:text-white">
            ${egg.reward.notification.title}
          </p>
          <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">
            ${egg.reward.notification.description}
          </p>
          <div class="flex items-center mt-2">
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${this.getRarityClasses(egg.rarity)}">
              ${this.getRarityLabel(egg.rarity)}
            </span>
          </div>
        </div>
        <button class="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" onclick="this.parentElement.parentElement.remove()">
          <span class="sr-only">Close</span>
          <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
          </svg>
        </button>
      </div>
    `

    document.body.appendChild(notification)

    // Animate in
    requestAnimationFrame(() => {
      notification.style.transform = 'translateX(0)'
    })

    // Play sound if specified
    if (egg.reward.notification.sound) {
      this.playNotificationSound(egg.reward.notification.sound)
    }

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.style.transform = 'translateX(100%)'
        setTimeout(() => notification.remove(), 300)
      }
    }, 5000)
  }

  private addDiscoveryFlair(rarity: string): void {
    switch (rarity) {
      case 'legendary':
        // Epic celebration
        this.createConfettiEffect()
        this.flashScreen('#ffd700') // Gold flash
        break

      case 'rare':
        // Medium celebration  
        this.createSparkleEffect()
        this.flashScreen('#9333ea') // Purple flash
        break

      case 'common':
        // Simple celebration
        this.createSimpleEffect()
        break
    }
  }

  // ============================================================================
  // Visual Effects
  // ============================================================================

  private createConfettiEffect(): void {
    // Create confetti particles
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b']
    const confettiContainer = document.createElement('div')
    confettiContainer.className = 'fixed inset-0 pointer-events-none z-50'
    document.body.appendChild(confettiContainer)

    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div')
      confetti.className = 'absolute w-2 h-2 opacity-90'
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
      confetti.style.left = Math.random() * 100 + '%'
      confetti.style.animationName = 'confetti-fall'
      confetti.style.animationDuration = (Math.random() * 2 + 1) + 's'
      confetti.style.animationDelay = Math.random() * 2 + 's'
      confetti.style.animationFillMode = 'both'
      
      confettiContainer.appendChild(confetti)
    }

    // Add CSS animation if not already present
    if (!document.getElementById('confetti-styles')) {
      const style = document.createElement('style')
      style.id = 'confetti-styles'
      style.textContent = `
        @keyframes confetti-fall {
          0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `
      document.head.appendChild(style)
    }

    // Clean up after animation
    setTimeout(() => confettiContainer.remove(), 4000)
  }

  private createSparkleEffect(): void {
    // Create sparkle effect around the notification area
    const sparkleContainer = document.createElement('div')
    sparkleContainer.className = 'fixed top-4 right-4 w-80 h-32 pointer-events-none z-40'
    document.body.appendChild(sparkleContainer)

    for (let i = 0; i < 20; i++) {
      const sparkle = document.createElement('div')
      sparkle.className = 'absolute w-1 h-1 bg-yellow-400 rounded-full opacity-0'
      sparkle.style.left = Math.random() * 100 + '%'
      sparkle.style.top = Math.random() * 100 + '%'
      sparkle.style.animationName = 'sparkle'
      sparkle.style.animationDuration = '1.5s'
      sparkle.style.animationDelay = Math.random() * 1 + 's'
      sparkle.style.animationFillMode = 'both'
      
      sparkleContainer.appendChild(sparkle)
    }

    // Add sparkle animation
    if (!document.getElementById('sparkle-styles')) {
      const style = document.createElement('style')
      style.id = 'sparkle-styles'
      style.textContent = `
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
      `
      document.head.appendChild(style)
    }

    setTimeout(() => sparkleContainer.remove(), 3000)
  }

  private createSimpleEffect(): void {
    // Simple pulse effect on the notification
    const notification = document.querySelector('.fixed.top-4.right-4') as HTMLElement
    if (notification) {
      notification.style.animation = 'pulse 0.5s ease-in-out'
      setTimeout(() => {
        notification.style.animation = ''
      }, 500)
    }
  }

  private flashScreen(color: string): void {
    const flash = document.createElement('div')
    flash.className = 'fixed inset-0 pointer-events-none z-40'
    flash.style.backgroundColor = color
    flash.style.opacity = '0.3'
    flash.style.mixBlendMode = 'overlay'
    document.body.appendChild(flash)

    setTimeout(() => {
      flash.style.opacity = '0'
      flash.style.transition = 'opacity 0.3s ease-out'
      setTimeout(() => flash.remove(), 300)
    }, 100)
  }

  private playNotificationSound(soundType: string): void {
    // In a real implementation, you'd load and play audio files
    // For now, we'll use the Web Audio API to create simple sounds
    try {
      const audioContext = new AudioContext()
      
      if (soundType === 'achievement') {
        // Play a success chord
        const frequencies = [523.25, 659.25, 783.99] // C, E, G
        frequencies.forEach((freq, i) => {
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()
          
          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)
          
          oscillator.frequency.value = freq
          oscillator.type = 'sine'
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
          
          oscillator.start(audioContext.currentTime + i * 0.1)
          oscillator.stop(audioContext.currentTime + 0.5 + i * 0.1)
        })
      }
    } catch (error) {
      console.warn('Could not play notification sound:', error)
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private getEggIcon(egg: EasterEgg): string {
    const iconMap: Record<string, string> = {
      'sequence': '🔗',
      'interaction': '👆',
      'time': '⏰',
      'configuration': '⚙️',
      'performance': '⚡'
    }
    return iconMap[egg.category] || '🥚'
  }

  private getRarityClasses(rarity: string): string {
    switch (rarity) {
      case 'legendary':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'rare':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      case 'common':
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    }
  }

  private getRarityLabel(rarity: string): string {
    return rarity.charAt(0).toUpperCase() + rarity.slice(1)
  }

  // ============================================================================
  // Public API
  // ============================================================================

  isDiscovered(eggId: string): boolean {
    return this.discoveredEggs.has(eggId)
  }

  getDiscoveredCount(): number {
    return this.discoveredEggs.size
  }

  getTotalCount(): number {
    return this.easterEggs.size
  }

  getAchievements(): Achievement[] {
    return Array.from(this.achievements.values())
  }

  getDiscoveredAchievements(): Achievement[] {
    return this.getAchievements().filter(a => a.discovered)
  }

  generateProgressReport(): ProgressReport {
    const total = this.getTotalCount()
    const discovered = this.getDiscoveredCount()
    const achievements = this.getAchievements()
    
    const rarityBreakdown = achievements.reduce((acc, achievement) => {
      const egg = this.easterEggs.get(achievement.id)
      if (egg && achievement.discovered) {
        acc[egg.rarity] = (acc[egg.rarity] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    return {
      totalEggs: total,
      discoveredEggs: discovered,
      completionPercentage: total > 0 ? Math.round((discovered / total) * 100) : 0,
      rarityBreakdown,
      recentDiscoveries: achievements
        .filter(a => a.discovered && a.timestamp)
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        .slice(0, 5),
      hints: this.getHints()
    }
  }

  private getHints(): string[] {
    // Provide hints for undiscovered easter eggs
    const hints: string[] = []
    
    this.easterEggs.forEach((egg) => {
      if (!this.isDiscovered(egg.id) && egg.hints) {
        hints.push(...egg.hints)
      }
    })

    // Add some general hints
    if (hints.length === 0) {
      hints.push(
        'Try different key combinations...',
        'Spend time exploring different backgrounds',
        'Experiment with various settings',
        'Check the developer console for clues'
      )
    }

    return hints.slice(0, 3) // Return max 3 hints
  }

  // ============================================================================
  // Persistence
  // ============================================================================

  private saveProgress(): void {
    const progress = {
      discoveredEggs: Array.from(this.discoveredEggs),
      achievements: Array.from(this.achievements.entries()).map(([id, achievement]) => ({
        id,
        achievement
      })),
      timestamp: Date.now()
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(progress))
  }

  private loadProgress(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY)
      if (saved) {
        const progress = JSON.parse(saved)
        
        this.discoveredEggs = new Set(progress.discoveredEggs || [])
        
        if (progress.achievements) {
          progress.achievements.forEach(({ id, achievement }: any) => {
            this.achievements.set(id, achievement)
          })
        }
      }
    } catch (error) {
      console.warn('Failed to load easter egg progress:', error)
    }
  }

  reset(): void {
    this.discoveredEggs.clear()
    this.achievements.forEach(achievement => {
      achievement.discovered = false
      achievement.timestamp = undefined
    })
    
    localStorage.removeItem(this.STORAGE_KEY)
    console.log('Easter egg progress reset')
  }
}

// ============================================================================
// Tracker Classes
// ============================================================================

class KeySequenceTracker {
  private sequence: string[] = []
  private maxLength: number = 20
  
  addKey(keyCode: string): void {
    this.sequence.push(keyCode)
    
    if (this.sequence.length > this.maxLength) {
      this.sequence.shift()
    }
  }
  
  matches(targetSequence: string[]): boolean {
    if (targetSequence.length > this.sequence.length) return false
    
    const startIndex = this.sequence.length - targetSequence.length
    const recentSequence = this.sequence.slice(startIndex)
    
    return recentSequence.every((key, index) => key === targetSequence[index])
  }
}

class ClickPatternTracker {
  private clicks: { x: number; y: number; timestamp: number }[] = []
  private maxAge: number = 10000 // 10 seconds
  
  addClick(x: number, y: number): void {
    const now = Date.now()
    this.clicks.push({ x, y, timestamp: now })
    
    // Remove old clicks
    this.clicks = this.clicks.filter(click => now - click.timestamp <= this.maxAge)
  }
  
  matches(condition: ClickPatternCondition): boolean {
    if (this.clicks.length < 5) return false // Need at least 5 clicks for a pattern
    
    switch (condition.pattern) {
      case 'circle':
        return this.detectCirclePattern(condition)
      case 'star':
        return this.detectStarPattern(condition)
      case 'line':
        return this.detectLinePattern(condition)
      default:
        return false
    }
  }
  
  private detectCirclePattern(condition: ClickPatternCondition): boolean {
    if (this.clicks.length < 8) return false
    
    // Get recent clicks within time limit
    const now = Date.now()
    const recentClicks = this.clicks.filter(click => 
      now - click.timestamp <= (condition.timeLimit || 10000)
    )
    
    if (recentClicks.length < 8) return false
    
    // Calculate center point
    const centerX = recentClicks.reduce((sum, click) => sum + click.x, 0) / recentClicks.length
    const centerY = recentClicks.reduce((sum, click) => sum + click.y, 0) / recentClicks.length
    
    // Calculate if clicks form a roughly circular pattern
    const distances = recentClicks.map(click => 
      Math.sqrt(Math.pow(click.x - centerX, 2) + Math.pow(click.y - centerY, 2))
    )
    
    const avgDistance = distances.reduce((sum, dist) => sum + dist, 0) / distances.length
    const variance = distances.reduce((sum, dist) => sum + Math.pow(dist - avgDistance, 2), 0) / distances.length
    const standardDeviation = Math.sqrt(variance)
    
    // Circle if low variance in distances from center
    const precision = condition.precision || 0.8
    return (standardDeviation / avgDistance) < (1 - precision)
  }
  
  private detectStarPattern(condition: ClickPatternCondition): boolean {
    // Simplified star pattern detection
    return this.clicks.length >= 10 && this.detectAngularPattern(5)
  }
  
  private detectLinePattern(condition: ClickPatternCondition): boolean {
    if (this.clicks.length < 5) return false
    
    // Check if points are roughly collinear
    const recentClicks = this.clicks.slice(-10)
    return this.arePointsCollinear(recentClicks, condition.precision || 0.8)
  }
  
  private detectAngularPattern(expectedPeaks: number): boolean {
    // Complex angular pattern detection would go here
    // This is a simplified version
    return Math.random() < 0.1 // Placeholder
  }
  
  private arePointsCollinear(points: { x: number; y: number }[], precision: number): boolean {
    if (points.length < 3) return false
    
    // Calculate if points lie roughly on the same line
    const first = points[0]
    const last = points[points.length - 1]
    
    // Line equation: ax + by + c = 0
    const a = last.y - first.y
    const b = first.x - last.x
    const c = last.x * first.y - first.x * last.y
    
    const lineLength = Math.sqrt(a * a + b * b)
    if (lineLength === 0) return false
    
    // Check if all points are close to the line
    const threshold = 50 * (1 - precision) // Max distance from line
    
    return points.every(point => {
      const distance = Math.abs(a * point.x + b * point.y + c) / lineLength
      return distance <= threshold
    })
  }
}

class TimeTracker {
  private startTime: number = 0
  private totalTime: number = 0
  private isActive: boolean = false
  
  start(): void {
    this.startTime = Date.now()
    this.isActive = true
  }
  
  pause(): void {
    if (this.isActive) {
      this.totalTime += Date.now() - this.startTime
      this.isActive = false
    }
  }
  
  resume(): void {
    if (!this.isActive) {
      this.startTime = Date.now()
      this.isActive = true
    }
  }
  
  getTotalTime(): number {
    let current = this.totalTime
    if (this.isActive) {
      current += Date.now() - this.startTime
    }
    return current
  }
}

class PerformanceTracker {
  private metrics: Array<{ fps: number; timestamp: number }> = []
  private maxAge: number = 5 * 60 * 1000 // 5 minutes
  
  addMetrics(metrics: { fps: number }): void {
    const now = Date.now()
    this.metrics.push({ fps: metrics.fps, timestamp: now })
    
    // Remove old metrics
    this.metrics = this.metrics.filter(metric => now - metric.timestamp <= this.maxAge)
  }
  
  meetsCondition(condition: PerformanceCondition): boolean {
    const now = Date.now()
    const recentMetrics = this.metrics.filter(metric => 
      now - metric.timestamp <= condition.duration
    )
    
    if (recentMetrics.length === 0) return false
    
    // Check if all recent metrics meet the minimum FPS requirement
    return recentMetrics.every(metric => metric.fps >= condition.minFPS)
  }
}

class ConfigurationTracker {
  private configurations: Set<string> = new Set()
  
  addConfiguration(config: any): void {
    // Create a normalized hash of the configuration
    const normalized = JSON.stringify(config, Object.keys(config).sort())
    this.configurations.add(normalized)
  }
  
  meetsCondition(condition: ConfigurationCondition): boolean {
    return this.configurations.size >= condition.uniqueConfigurations
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

interface ClickPatternCondition {
  pattern: 'circle' | 'star' | 'line'
  precision?: number // 0-1, how precise the pattern needs to be
  timeLimit?: number // milliseconds
}

interface TimeCondition {
  totalTime: number // milliseconds
}

interface PerformanceCondition {
  minFPS: number
  duration: number // milliseconds
}

interface ConfigurationCondition {
  uniqueConfigurations: number
}

interface ProgressReport {
  totalEggs: number
  discoveredEggs: number
  completionPercentage: number
  rarityBreakdown: Record<string, number>
  recentDiscoveries: Achievement[]
  hints: string[]
}

// ============================================================================
// Usage Example
// ============================================================================

/*
// Example usage:
const easterEggManager = new EasterEggManager()

// Listen for discoveries
window.addEventListener('easter-egg-discovered', (event) => {
  const { eggId, egg, achievement } = event.detail
  console.log(`Discovered: ${egg.name}`)
  
  // Update UI to show new achievement
  updateAchievementBadge(achievement)
})

// Get progress report
const progress = easterEggManager.generateProgressReport()
console.log(`Progress: ${progress.discoveredEggs}/${progress.totalEggs} (${progress.completionPercentage}%)`)

// Register custom easter egg
easterEggManager.registerEasterEgg({
  id: 'custom-egg',
  name: 'Custom Discovery',
  description: 'Found the custom easter egg',
  category: 'interaction',
  trigger: {
    type: 'keySequence',
    condition: ['KeyC', 'KeyU', 'KeyS', 'KeyT', 'KeyO', 'KeyM'],
    timeout: 5000
  },
  reward: {
    type: 'achievement',
    unlock: 'custom-achievement',
    notification: {
      title: 'Custom Easter Egg!',
      description: 'You found the custom easter egg!',
      icon: '🎨'
    }
  },
  rarity: 'rare'
})
*/