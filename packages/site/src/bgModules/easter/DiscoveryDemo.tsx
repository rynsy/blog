import React, { useEffect, useRef, useCallback, useState } from 'react'
import { BackgroundModuleV3, ModuleSetupParamsV3, EasterEggEvent } from '../../interfaces/BackgroundSystemV3'

/**
 * Easter Egg Discovery Demo Module
 * 
 * A demonstration background module that showcases the AI-powered easter egg
 * discovery system with interactive patterns, visual feedback, and integration
 * with the discovery engine.
 */

interface DiscoveryDemoState {
  particles: Particle[]
  discoveryMode: boolean
  patternVisualization: boolean
  lastInteraction: number
  gestureTrail: { x: number; y: number; timestamp: number }[]
  performanceMetrics: {
    fps: number
    interactions: number
    discoveryAttempts: number
  }
}

interface Particle {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  life: number
  maxLife: number
  type: 'normal' | 'discovery' | 'pattern' | 'achievement'
}

class DiscoveryDemoModule implements BackgroundModuleV3 {
  private canvas!: HTMLCanvasElement
  private ctx!: CanvasRenderingContext2D
  private animationId?: number
  private isRunning = false
  private state: DiscoveryDemoState
  private lastFrame = 0
  private params!: ModuleSetupParamsV3
  
  constructor() {
    this.state = {
      particles: [],
      discoveryMode: false,
      patternVisualization: false,
      lastInteraction: 0,
      gestureTrail: [],
      performanceMetrics: {
        fps: 0,
        interactions: 0,
        discoveryAttempts: 0
      }
    }
  }
  
  async initialize(params: ModuleSetupParamsV3): Promise<void> {
    this.params = params
    this.canvas = params.canvas as HTMLCanvasElement
    
    const context = this.canvas.getContext('2d')
    if (!context) {
      throw new Error('Could not get 2D context from canvas')
    }
    
    this.ctx = context
    this.setupCanvas()
    this.initializeParticles()
    this.setupEventListeners()
    
    console.log('🎨 Discovery Demo Module initialized')
  }
  
  private setupCanvas(): void {
    this.canvas.width = this.params.width
    this.canvas.height = this.params.height
    
    // Set up canvas with proper scaling for high DPI displays
    const dpr = window.devicePixelRatio || 1
    this.canvas.width = this.params.width * dpr
    this.canvas.height = this.params.height * dpr
    this.canvas.style.width = `${this.params.width}px`
    this.canvas.style.height = `${this.params.height}px`
    this.ctx.scale(dpr, dpr)
    
    // Configure rendering context
    this.ctx.lineCap = 'round'
    this.ctx.lineJoin = 'round'
  }
  
  private initializeParticles(): void {
    const particleCount = this.params.deviceCapabilities.isMobile ? 50 : 100
    
    for (let i = 0; i < particleCount; i++) {
      this.state.particles.push(this.createParticle('normal'))
    }
  }
  
  private createParticle(type: Particle['type'] = 'normal'): Particle {
    const colors = {
      normal: this.params.theme === 'dark' ? '#4f46e5' : '#6366f1',
      discovery: '#f59e0b',
      pattern: '#10b981',
      achievement: '#ef4444'
    }
    
    return {
      id: Math.random().toString(36).substr(2, 9),
      x: Math.random() * this.params.width,
      y: Math.random() * this.params.height,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      size: Math.random() * 4 + 2,
      color: colors[type],
      life: 0,
      maxLife: 300 + Math.random() * 200,
      type
    }
  }
  
  private setupEventListeners(): void {
    // Mouse/touch interaction handlers
    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const rect = this.canvas.getBoundingClientRect()
      const clientX = 'clientX' in e ? e.clientX : e.touches[0].clientX
      const clientY = 'clientY' in e ? e.clientY : e.touches[0].clientY
      const x = clientX - rect.left
      const y = clientY - rect.top
      
      this.handleInteraction(x, y, 'move')
    }
    
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const rect = this.canvas.getBoundingClientRect()
      const clientX = 'clientX' in e ? e.clientX : e.touches[0].clientX
      const clientY = 'clientY' in e ? e.clientY : e.touches[0].clientY
      const x = clientX - rect.left
      const y = clientY - rect.top
      
      this.handleInteraction(x, y, 'down')
    }
    
    this.canvas.addEventListener('mousemove', handlePointerMove)
    this.canvas.addEventListener('mousedown', handlePointerDown)
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault()
      handlePointerMove(e)
    }, { passive: false })
    this.canvas.addEventListener('touchstart', handlePointerDown)
    
    // Easter egg event listener
    window.addEventListener('easterEggEvent', this.handleEasterEggEvent.bind(this))
  }
  
  private handleInteraction(x: number, y: number, type: 'move' | 'down'): void {
    const now = Date.now()
    this.state.lastInteraction = now
    this.state.performanceMetrics.interactions++
    
    // Add to gesture trail
    this.state.gestureTrail.push({ x, y, timestamp: now })
    
    // Limit trail length
    if (this.state.gestureTrail.length > 50) {
      this.state.gestureTrail.shift()
    }
    
    // Create interaction particles
    for (let i = 0; i < 3; i++) {
      const particle = this.createParticle('discovery')
      particle.x = x + (Math.random() - 0.5) * 20
      particle.y = y + (Math.random() - 0.5) * 20
      particle.vx = (Math.random() - 0.5) * 4
      particle.vy = (Math.random() - 0.5) * 4
      this.state.particles.push(particle)
    }
    
    // Emit easter egg event for pattern recognition
    const easterEggEvent: EasterEggEvent = {
      type: 'mouse',
      data: {
        x,
        y,
        type,
        trail: this.state.gestureTrail.slice(-10) // Last 10 points
      },
      timestamp: now,
      moduleId: 'discovery-demo',
      metadata: {
        interactionCount: this.state.performanceMetrics.interactions,
        trailLength: this.state.gestureTrail.length
      }
    }
    
    this.emitEasterEggEvent(easterEggEvent)
  }
  
  private handleEasterEggEvent(event: CustomEvent): void {
    const { type, data, confidence } = event.detail
    
    if (confidence && confidence > 0.7) {
      // High confidence pattern detected - create special effects
      this.createPatternFeedback(data, confidence)
    }
  }
  
  private createPatternFeedback(data: any, confidence: number): void {
    const particleCount = Math.floor(confidence * 10)
    
    for (let i = 0; i < particleCount; i++) {
      const particle = this.createParticle('pattern')
      if (data.x !== undefined && data.y !== undefined) {
        particle.x = data.x + (Math.random() - 0.5) * 50
        particle.y = data.y + (Math.random() - 0.5) * 50
      }
      particle.size = 3 + confidence * 5
      this.state.particles.push(particle)
    }
    
    this.state.patternVisualization = true
    setTimeout(() => {
      this.state.patternVisualization = false
    }, 1000)
  }
  
  private emitEasterEggEvent(event: EasterEggEvent): void {
    const customEvent = new CustomEvent('easterEggEvent', {
      detail: event
    })
    window.dispatchEvent(customEvent)
  }
  
  async activate(): Promise<void> {
    this.isRunning = true
    this.lastFrame = performance.now()
    this.animate()
    console.log('🎨 Discovery Demo Module activated')
  }
  
  async deactivate(): Promise<void> {
    this.isRunning = false
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
    console.log('🎨 Discovery Demo Module deactivated')
  }
  
  private animate = (currentTime: number = performance.now()): void => {
    if (!this.isRunning) return
    
    const deltaTime = currentTime - this.lastFrame
    this.lastFrame = currentTime
    
    // Update FPS
    this.state.performanceMetrics.fps = Math.round(1000 / deltaTime)
    
    this.update(deltaTime)
    this.render()
    
    this.animationId = requestAnimationFrame(this.animate)
  }
  
  private update(deltaTime: number): void {
    // Clean up old gesture trail points
    const now = Date.now()
    this.state.gestureTrail = this.state.gestureTrail.filter(
      point => now - point.timestamp < 2000
    )
    
    // Update particles
    for (let i = this.state.particles.length - 1; i >= 0; i--) {
      const particle = this.state.particles[i]
      
      // Update position
      particle.x += particle.vx
      particle.y += particle.vy
      
      // Apply some physics
      particle.vy += 0.02 // gravity
      particle.vx *= 0.998 // drag
      particle.vy *= 0.998
      
      // Boundary bouncing
      if (particle.x <= 0 || particle.x >= this.params.width) {
        particle.vx *= -0.8
        particle.x = Math.max(0, Math.min(this.params.width, particle.x))
      }
      if (particle.y <= 0 || particle.y >= this.params.height) {
        particle.vy *= -0.8
        particle.y = Math.max(0, Math.min(this.params.height, particle.y))
      }
      
      // Update life
      particle.life += deltaTime
      
      // Remove expired particles
      if (particle.life > particle.maxLife) {
        this.state.particles.splice(i, 1)
      }
    }
    
    // Maintain minimum particle count
    const targetCount = this.params.deviceCapabilities.isMobile ? 30 : 60
    while (this.state.particles.length < targetCount) {
      this.state.particles.push(this.createParticle('normal'))
    }
  }
  
  private render(): void {
    // Clear canvas with background
    this.ctx.fillStyle = this.params.theme === 'dark' ? '#0f0f0f' : '#fafafa'
    this.ctx.fillRect(0, 0, this.params.width, this.params.height)
    
    // Render gesture trail
    if (this.state.gestureTrail.length > 1) {
      this.renderGestureTrail()
    }
    
    // Render particles
    for (const particle of this.state.particles) {
      this.renderParticle(particle)
    }
    
    // Render pattern visualization overlay
    if (this.state.patternVisualization) {
      this.renderPatternOverlay()
    }
    
    // Render debug info if in debug mode
    if (this.params.performanceHints.enableOptimizations) {
      this.renderDebugInfo()
    }
  }
  
  private renderGestureTrail(): void {
    if (this.state.gestureTrail.length < 2) return
    
    this.ctx.strokeStyle = this.params.theme === 'dark' ? 'rgba(99, 102, 241, 0.5)' : 'rgba(67, 56, 202, 0.5)'
    this.ctx.lineWidth = 2
    this.ctx.beginPath()
    
    for (let i = 0; i < this.state.gestureTrail.length; i++) {
      const point = this.state.gestureTrail[i]
      const age = Date.now() - point.timestamp
      const alpha = Math.max(0, 1 - age / 2000)
      
      this.ctx.globalAlpha = alpha
      
      if (i === 0) {
        this.ctx.moveTo(point.x, point.y)
      } else {
        this.ctx.lineTo(point.x, point.y)
      }
    }
    
    this.ctx.stroke()
    this.ctx.globalAlpha = 1
  }
  
  private renderParticle(particle: Particle): void {
    const age = particle.life / particle.maxLife
    const alpha = Math.max(0, 1 - age)
    
    this.ctx.globalAlpha = alpha
    this.ctx.fillStyle = particle.color
    
    // Different rendering based on particle type
    switch (particle.type) {
      case 'normal':
        this.ctx.beginPath()
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        this.ctx.fill()
        break
        
      case 'discovery':
        this.ctx.beginPath()
        this.ctx.arc(particle.x, particle.y, particle.size * (1 + Math.sin(particle.life * 0.01)), 0, Math.PI * 2)
        this.ctx.fill()
        break
        
      case 'pattern':
        this.ctx.save()
        this.ctx.translate(particle.x, particle.y)
        this.ctx.rotate(particle.life * 0.005)
        this.ctx.fillRect(-particle.size, -particle.size, particle.size * 2, particle.size * 2)
        this.ctx.restore()
        break
        
      case 'achievement':
        this.ctx.save()
        this.ctx.translate(particle.x, particle.y)
        this.ctx.rotate(particle.life * 0.01)
        for (let i = 0; i < 5; i++) {
          this.ctx.rotate(Math.PI * 2 / 5)
          this.ctx.beginPath()
          this.ctx.moveTo(0, -particle.size)
          this.ctx.lineTo(particle.size * 0.3, -particle.size * 0.3)
          this.ctx.lineTo(particle.size, 0)
          this.ctx.fill()
        }
        this.ctx.restore()
        break
    }
    
    this.ctx.globalAlpha = 1
  }
  
  private renderPatternOverlay(): void {
    const gradient = this.ctx.createRadialGradient(
      this.params.width / 2, this.params.height / 2, 0,
      this.params.width / 2, this.params.height / 2, Math.max(this.params.width, this.params.height) / 2
    )
    
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.2)')
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0)')
    
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, this.params.width, this.params.height)
  }
  
  private renderDebugInfo(): void {
    this.ctx.fillStyle = this.params.theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)'
    this.ctx.font = '12px monospace'
    
    const info = [
      `FPS: ${this.state.performanceMetrics.fps}`,
      `Particles: ${this.state.particles.length}`,
      `Interactions: ${this.state.performanceMetrics.interactions}`,
      `Trail: ${this.state.gestureTrail.length}`,
      `Discovery: ${this.state.discoveryMode ? 'ON' : 'OFF'}`
    ]
    
    info.forEach((text, index) => {
      this.ctx.fillText(text, 10, 20 + index * 15)
    })
  }
  
  // BackgroundModuleV3 interface methods
  pause(): void {
    this.isRunning = false
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
  }
  
  resume(): void {
    if (!this.isRunning) {
      this.isRunning = true
      this.lastFrame = performance.now()
      this.animate()
    }
  }
  
  destroy(): void {
    this.pause()
    
    // Clean up event listeners
    window.removeEventListener('easterEggEvent', this.handleEasterEggEvent.bind(this))
    
    // Clear state
    this.state.particles = []
    this.state.gestureTrail = []
    
    console.log('🎨 Discovery Demo Module destroyed')
  }
  
  onThemeChange(theme: 'light' | 'dark'): void {
    this.params.theme = theme
    
    // Update particle colors for new theme
    this.state.particles.forEach(particle => {
      if (particle.type === 'normal') {
        particle.color = theme === 'dark' ? '#4f46e5' : '#6366f1'
      }
    })
  }
  
  onResize(width: number, height: number): void {
    this.params.width = width
    this.params.height = height
    this.setupCanvas()
  }
  
  async handleEasterEggEvent(event: EasterEggEvent): Promise<void> {
    // Handle specific easter egg events for this module
    if (event.type === 'achievement') {
      // Create celebration particles
      for (let i = 0; i < 20; i++) {
        const particle = this.createParticle('achievement')
        particle.x = this.params.width / 2 + (Math.random() - 0.5) * 100
        particle.y = this.params.height / 2 + (Math.random() - 0.5) * 100
        this.state.particles.push(particle)
      }
    }
  }
}

// Module factory function for the registry
export const setup = (params: ModuleSetupParamsV3): BackgroundModuleV3 => {
  const module = new DiscoveryDemoModule()
  
  // Initialize asynchronously but return module immediately
  module.initialize(params).catch(console.error)
  
  return module
}

export default {
  setup
}
