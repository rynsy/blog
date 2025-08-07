import { BackgroundModule, ModuleSetupParams } from '../../contexts/BackgroundContext'
import { debugBackground } from '../../utils/debug'

interface GradientConfig {
  speed: number
  colors: {
    light: string[]
    dark: string[]
  }
}

const defaultConfig: GradientConfig = {
  speed: 0.002,  // Subtle, gentle animation
  colors: {
    light: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'],  // Blue to purple to pink to amber
    dark: ['#1e40af', '#7c3aed', '#be185d', '#d97706']    // Darker versions
  }
}

class GradientModule implements BackgroundModule {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private animationId: number | null = null
  private startTime: number = Date.now()
  private config: GradientConfig
  private currentTheme: 'light' | 'dark'
  private isRunning = false

  constructor(canvas: HTMLCanvasElement, theme: 'light' | 'dark', config: GradientConfig = defaultConfig) {
    debugBackground.gradient('Constructor called', { 
      canvas: canvas.tagName,
      width: canvas.width, 
      height: canvas.height,
      theme 
    })
    
    this.canvas = canvas
    this.currentTheme = theme
    this.config = config
    
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Failed to get 2D context from canvas')
    }
    this.ctx = ctx
    debugBackground.gradient('2D context obtained successfully')
  }

  private animate = () => {
    if (!this.isRunning) {
      debugBackground.gradient('Animation stopped, isRunning:', this.isRunning)
      return
    }
    const currentTime = Date.now()
    const elapsed = (currentTime - this.startTime) * this.config.speed
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    
    // Create multiple animated gradients for more dynamic movement
    const colors = this.config.colors[this.currentTheme]
    const numColors = colors.length
    
    // Primary gradient with complex movement patterns
    const gradient1 = this.ctx.createLinearGradient(
      Math.sin(elapsed * 0.5) * this.canvas.width * 0.3,
      Math.cos(elapsed * 0.3) * this.canvas.height * 0.3,
      this.canvas.width + Math.sin(elapsed * 0.8) * 300,
      this.canvas.height + Math.cos(elapsed * 0.6) * 300
    )
    
    // Add color stops with more dynamic animation
    for (let i = 0; i < numColors; i++) {
      const position = i / (numColors - 1)
      const wave1 = Math.sin(elapsed * 2 + i * Math.PI / 2) * 0.15
      const wave2 = Math.cos(elapsed * 1.5 + i * Math.PI / 3) * 0.1
      const animatedPosition = position + wave1 + wave2
      const clampedPosition = Math.max(0, Math.min(1, animatedPosition))
      
      gradient1.addColorStop(clampedPosition, colors[i])
    }
    
    // Apply primary gradient
    this.ctx.fillStyle = gradient1
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    
    // Add secondary radial gradient for more depth
    const centerX = this.canvas.width / 2 + Math.sin(elapsed * 0.4) * 200
    const centerY = this.canvas.height / 2 + Math.cos(elapsed * 0.7) * 150
    const radius = Math.min(this.canvas.width, this.canvas.height) * (0.8 + Math.sin(elapsed) * 0.3)
    
    const radialGradient = this.ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, radius
    )
    
    // Cycle through colors for the radial gradient
    const colorIndex = Math.floor(elapsed * 2) % numColors
    const nextColorIndex = (colorIndex + 1) % numColors
    const blend = (elapsed * 2) % 1
    
    radialGradient.addColorStop(0, colors[colorIndex] + '40') // 25% opacity
    radialGradient.addColorStop(0.6, colors[nextColorIndex] + '20') // 12% opacity
    radialGradient.addColorStop(1, 'transparent')
    
    // Apply radial gradient with multiply blend mode for depth
    this.ctx.globalCompositeOperation = 'multiply'
    this.ctx.fillStyle = radialGradient
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    
    // Reset composite operation
    this.ctx.globalCompositeOperation = 'source-over'
    
    // Add animated particles for more life
    this.ctx.globalCompositeOperation = 'soft-light'
    this.ctx.globalAlpha = 0.15
    
    const particleCount = 30
    for (let i = 0; i < particleCount; i++) {
      const angle = (elapsed * 0.5 + i / particleCount * Math.PI * 2)
      const distance = (Math.sin(elapsed * 0.3 + i) + 1) * 0.3 + 0.2
      const x = this.canvas.width / 2 + Math.cos(angle) * this.canvas.width * distance
      const y = this.canvas.height / 2 + Math.sin(angle) * this.canvas.height * distance
      const radius = (Math.sin(elapsed * 2 + i) + 1) * 2 + 1
      
      this.ctx.beginPath()
      this.ctx.arc(x, y, radius, 0, Math.PI * 2)
      this.ctx.fillStyle = colors[i % numColors] + '60' // 37% opacity
      this.ctx.fill()
    }
    
    // Reset composite operation
    this.ctx.globalCompositeOperation = 'source-over'
    this.ctx.globalAlpha = 1
    
    this.animationId = requestAnimationFrame(this.animate)
  }

  pause(): void {
    this.isRunning = false
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  resume(): void {
    debugBackground.gradient('Resume called', { 
      wasRunning: this.isRunning, 
      animationId: this.animationId,
      hasCanvas: !!this.canvas,
      hasContext: !!this.ctx
    })
    if (!this.isRunning) {
      this.isRunning = true
      debugBackground.gradient('Starting animation loop')
      this.startTime = Date.now() // Reset start time
      this.animate()
    }
  }

  destroy(): void {
    this.pause()
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  onThemeChange(theme: 'light' | 'dark'): void {
    this.currentTheme = theme
    // Gradient will automatically update on next frame
  }

  onResize(width: number, height: number): void {
    // Canvas dimensions are handled by CanvasHost
    // Module doesn't need to do anything special for resize
  }
}

export const setup = ({ canvas, width, height, theme }: ModuleSetupParams): BackgroundModule => {
  debugBackground.gradient('Setup function called', {
    canvas: canvas.constructor.name,
    width,
    height,
    theme
  })

  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error('Gradient module requires HTMLCanvasElement')
  }
  
  const module = new GradientModule(canvas, theme)
  debugBackground.gradient('Module created, starting animation...')
  module.resume() // Start animation
  return module
}