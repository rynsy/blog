import React, { useEffect, useState } from 'react'
import EasterEggProvider from './EasterEggProvider'
import EasterEggDashboard from './EasterEggDashboard'
import { useBackground } from '../contexts/BackgroundContextV3'

/**
 * Easter Egg Integration Example
 * 
 * This component demonstrates how to integrate the AI-powered easter egg
 * discovery system with existing background modules and site functionality.
 * 
 * It serves as both a working example and documentation for implementation.
 */

interface EasterEggIntegrationExampleProps {
  showDashboard?: boolean
  enableDemo?: boolean
}

const EasterEggIntegrationExample: React.FC<EasterEggIntegrationExampleProps> = ({
  showDashboard = true,
  enableDemo = false
}) => {
  const { currentModule, isActive } = useBackground()
  const [demoActive, setDemoActive] = useState(false)
  const [notificationQueue, setNotificationQueue] = useState<any[]>([])
  
  // Register easter egg demo module if demo is enabled
  useEffect(() => {
    if (!enableDemo) return
    
    const registerDemoModule = async () => {
      try {
        // Dynamic import of the demo module
        const demoModule = await import('../bgModules/easter/DiscoveryDemo')
        
        // Register with the background system
        // This would typically be done in the main app initialization
        console.log('🥚 Demo module loaded for easter egg integration')
      } catch (error) {
        console.error('Failed to load easter egg demo module:', error)
      }
    }
    
    registerDemoModule()
  }, [enableDemo])
  
  // Listen for easter egg discoveries and show notifications
  useEffect(() => {
    const handleDiscovery = (event: CustomEvent) => {
      const achievement = event.detail
      
      // Add to notification queue
      setNotificationQueue(prev => [...prev, {
        id: Date.now(),
        type: 'discovery',
        title: 'Easter Egg Discovered!',
        message: `You found: ${achievement.name}`,
        icon: achievement.icon,
        timestamp: Date.now()
      }])
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        setNotificationQueue(prev => prev.filter(n => n.id !== Date.now()))
      }, 5000)
    }
    
    const handleAchievementToast = (event: CustomEvent) => {
      const achievement = event.detail
      showAchievementToast(achievement)
    }
    
    const handleSpecialEffect = (event: CustomEvent) => {
      const { type, duration } = event.detail
      triggerSpecialEffect(type, duration)
    }
    
    window.addEventListener('easterEggDiscovered', handleDiscovery)
    window.addEventListener('showAchievementToast', handleAchievementToast)
    window.addEventListener('triggerSpecialEffect', handleSpecialEffect)
    
    return () => {
      window.removeEventListener('easterEggDiscovered', handleDiscovery)
      window.removeEventListener('showAchievementToast', handleAchievementToast)
      window.removeEventListener('triggerSpecialEffect', handleSpecialEffect)
    }
  }, [])
  
  const showAchievementToast = (achievement: any) => {
    // Create a toast notification element
    const toast = document.createElement('div')
    toast.className = 'easter-egg-toast'
    toast.innerHTML = `
      <div class="toast-icon">${achievement.icon}</div>
      <div class="toast-content">
        <h4>Achievement Unlocked!</h4>
        <p>${achievement.name}</p>
        <small>${achievement.description}</small>
      </div>
    `
    
    // Style the toast
    Object.assign(toast.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: 'rgba(16, 185, 129, 0.95)',
      color: 'white',
      padding: '16px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      zIndex: '10000',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      maxWidth: '300px',
      animation: 'slideIn 0.3s ease-out, fadeOut 0.3s ease-in 2.7s forwards',
      fontSize: '14px'
    })
    
    // Add animation styles if not already present
    if (!document.querySelector('#easter-egg-animations')) {
      const styles = document.createElement('style')
      styles.id = 'easter-egg-animations'
      styles.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        .toast-content h4 { margin: 0 0 4px 0; font-size: 14px; font-weight: 600; }
        .toast-content p { margin: 0 0 2px 0; font-size: 13px; }
        .toast-content small { font-size: 11px; opacity: 0.9; }
        .toast-icon { font-size: 24px; }
      `
      document.head.appendChild(styles)
    }
    
    document.body.appendChild(toast)
    
    // Remove after animation
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast)
      }
    }, 3000)
  }
  
  const triggerSpecialEffect = (type: string, duration: number) => {
    switch (type) {
      case 'performance-boost':
        triggerPerformanceBoostEffect(duration)
        break
      case 'retro-celebration':
        triggerRetroCelebration(duration)
        break
      case 'particle-burst':
        triggerParticleBurst(duration)
        break
      default:
        console.log(`Special effect triggered: ${type} for ${duration}ms`)
    }
  }
  
  const triggerPerformanceBoostEffect = (duration: number) => {
    // Create a temporary performance boost visual effect
    const overlay = document.createElement('div')
    overlay.className = 'performance-boost-overlay'
    
    Object.assign(overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(45deg, rgba(34, 197, 94, 0.1), rgba(59, 130, 246, 0.1))',
      pointerEvents: 'none',
      zIndex: '9999',
      animation: `pulseGlow ${duration / 1000}s ease-in-out`
    })
    
    // Add pulsing animation
    if (!document.querySelector('#performance-boost-styles')) {
      const styles = document.createElement('style')
      styles.id = 'performance-boost-styles'
      styles.textContent = `
        @keyframes pulseGlow {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
      `
      document.head.appendChild(styles)
    }
    
    document.body.appendChild(overlay)
    
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay)
      }
    }, duration)
  }
  
  const triggerRetroCelebration = (duration: number) => {
    // Create retro-style celebration effect
    const celebration = document.createElement('div')
    celebration.innerHTML = `
      <div class="retro-text">ACHIEVEMENT UNLOCKED!</div>
      <div class="retro-subtitle">Classic sequence discovered</div>
    `
    
    Object.assign(celebration.style, {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center',
      color: '#00ff00',
      fontFamily: 'monospace',
      fontSize: '24px',
      fontWeight: 'bold',
      textShadow: '0 0 10px #00ff00',
      background: 'rgba(0, 0, 0, 0.8)',
      padding: '20px',
      borderRadius: '4px',
      border: '2px solid #00ff00',
      zIndex: '10000',
      animation: `retroPop ${duration / 1000}s ease-out forwards`
    })
    
    if (!document.querySelector('#retro-celebration-styles')) {
      const styles = document.createElement('style')
      styles.id = 'retro-celebration-styles'
      styles.textContent = `
        @keyframes retroPop {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
          10% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
          20% { transform: translate(-50%, -50%) scale(1); }
          90% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
        }
        .retro-text { font-size: 28px; margin-bottom: 8px; }
        .retro-subtitle { font-size: 14px; opacity: 0.8; }
      `
      document.head.appendChild(styles)
    }
    
    document.body.appendChild(celebration)
    
    setTimeout(() => {
      if (celebration.parentNode) {
        celebration.parentNode.removeChild(celebration)
      }
    }, duration)
  }
  
  const triggerParticleBurst = (duration: number) => {
    // Create particle burst effect using canvas
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    
    Object.assign(canvas.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      pointerEvents: 'none',
      zIndex: '9998'
    })
    
    document.body.appendChild(canvas)
    
    // Simple particle system for burst effect
    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      life: number
      color: string
    }> = []
    
    // Create particles
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20,
        life: 1,
        color: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24'][Math.floor(Math.random() * 4)]
      })
    }
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.3 // gravity
        p.vx *= 0.99 // drag
        p.vy *= 0.99
        p.life -= 0.02
        
        if (p.life <= 0) {
          particles.splice(i, 1)
          continue
        }
        
        ctx.globalAlpha = p.life
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2)
        ctx.fill()
      }
      
      if (particles.length > 0) {
        requestAnimationFrame(animate)
      } else {
        if (canvas.parentNode) {
          canvas.parentNode.removeChild(canvas)
        }
      }
    }
    
    animate()
  }
  
  return (
    <EasterEggProvider enabled={isActive} config={{ sensitivity: 'medium' }}>
      <div className="easter-egg-integration-example">
        {/* Integration status */}
        <div className="integration-status">
          <h3>Easter Egg System Status</h3>
          <div className="status-grid">
            <div className="status-item">
              <span className="label">Background System:</span>
              <span className={`value ${isActive ? 'active' : 'inactive'}`}>
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="status-item">
              <span className="label">Current Module:</span>
              <span className="value">{currentModule || 'None'}</span>
            </div>
            <div className="status-item">
              <span className="label">Discovery System:</span>
              <span className="value active">Integrated</span>
            </div>
          </div>
        </div>
        
        {/* Demo controls */}
        {enableDemo && (
          <div className="demo-controls">
            <h3>Demo Controls</h3>
            <div className="controls-grid">
              <button
                onClick={() => setDemoActive(!demoActive)}
                className={`demo-button ${demoActive ? 'active' : ''}`}
              >
                {demoActive ? 'Stop Demo' : 'Start Demo'}
              </button>
              
              <button
                onClick={() => {
                  const event = new CustomEvent('easterEggDiscovered', {
                    detail: {
                      id: 'demo-achievement',
                      name: 'Demo Achievement',
                      category: 'interaction',
                      rarity: 'common',
                      timestamp: Date.now()
                    }
                  })
                  window.dispatchEvent(event)
                }}
                className="demo-button"
              >
                Trigger Demo Discovery
              </button>
              
              <button
                onClick={() => triggerSpecialEffect('particle-burst', 2000)}
                className="demo-button"
              >
                Test Particle Effect
              </button>
            </div>
          </div>
        )}
        
        {/* Dashboard */}
        {showDashboard && (
          <EasterEggDashboard 
            className="integration-dashboard"
            compact={false}
            showConfig={true}
          />
        )}
        
        {/* Implementation guide */}
        <div className="implementation-guide">
          <h3>Implementation Guide</h3>
          <div className="guide-content">
            <div className="guide-section">
              <h4>1. Provider Setup</h4>
              <pre><code>{`// Wrap your app with EasterEggProvider
<EasterEggProvider enabled={true} config={{ sensitivity: 'medium' }}>
  <YourApp />
</EasterEggProvider>`}</code></pre>
            </div>
            
            <div className="guide-section">
              <h4>2. Dashboard Integration</h4>
              <pre><code>{`// Add the dashboard component
<EasterEggDashboard 
  compact={false}
  showConfig={true}
/>`}</code></pre>
            </div>
            
            <div className="guide-section">
              <h4>3. Custom Easter Eggs</h4>
              <pre><code>{`// Register custom easter eggs
const customEasterEgg: EasterEgg = {
  id: 'my-custom-egg',
  name: 'Custom Discovery',
  description: 'A special interaction sequence',
  category: 'interaction',
  trigger: {
    type: 'keySequence',
    condition: {
      sequence: ['KeyC', 'KeyU', 'KeyS', 'KeyT', 'KeyO', 'KeyM'],
      timing: { maxInterval: 1000 }
    }
  },
  reward: {
    type: 'achievement',
    unlock: 'custom-badge',
    notification: {
      title: 'Custom Achievement!',
      description: 'You discovered the custom sequence!'
    }
  },
  rarity: 'rare'
}`}</code></pre>
            </div>
            
            <div className="guide-section">
              <h4>4. Event Handling</h4>
              <pre><code>{`// Listen for discovery events
window.addEventListener('easterEggDiscovered', (event) => {
  const achievement = event.detail
  console.log('Easter egg discovered:', achievement)
  
  // Custom handling logic here
  showCelebration(achievement)
})`}</code></pre>
            </div>
          </div>
        </div>
        
        {/* Active notifications */}
        {notificationQueue.length > 0 && (
          <div className="notification-queue">
            {notificationQueue.map(notification => (
              <div key={notification.id} className="notification-item">
                <span className="notification-icon">{notification.icon}</span>
                <div className="notification-content">
                  <strong>{notification.title}</strong>
                  <p>{notification.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </EasterEggProvider>
  )
}

export default EasterEggIntegrationExample
