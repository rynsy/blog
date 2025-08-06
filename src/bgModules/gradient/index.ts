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
  speed: 0.002,  // Slow, subtle animation
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
    
    debugBackground.gradient('Animation frame, animationId will be:', 'next frame')
    const currentTime = Date.now()
    const elapsed = (currentTime - this.startTime) * this.config.speed
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    
    // TEMPORARY: Draw a solid red rectangle to test visibility
    this.ctx.fillStyle = 'red'
    this.ctx.fillRect(50, 50, 200, 100)
    this.ctx.fillStyle = 'blue'
    this.ctx.fillRect(300, 150, 200, 100)
    
    // Create animated gradient
    const gradient = this.ctx.createLinearGradient(
      0, 0,
      this.canvas.width + Math.sin(elapsed) * 200,
      this.canvas.height + Math.cos(elapsed * 0.7) * 200
    )
    
    const colors = this.config.colors[this.currentTheme]
    const numColors = colors.length
    
    for (let i = 0; i < numColors; i++) {
      const position = i / (numColors - 1)
      // Add some animation to the color positions
      const animatedPosition = position + Math.sin(elapsed + i * 2) * 0.1
      const clampedPosition = Math.max(0, Math.min(1, animatedPosition))
      
      gradient.addColorStop(clampedPosition, colors[i])
    }
    
    // Apply gradient
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    
    // Add some subtle noise/texture
    this.ctx.globalCompositeOperation = 'overlay'
    this.ctx.globalAlpha = 0.1
    
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * this.canvas.width
      const y = Math.random() * this.canvas.height
      const radius = Math.random() * 3 + 1
      
      this.ctx.beginPath()
      this.ctx.arc(x, y, radius, 0, Math.PI * 2)
      this.ctx.fillStyle = 'white'
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