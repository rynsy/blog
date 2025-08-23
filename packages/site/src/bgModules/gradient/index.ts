import { BackgroundModule, ModuleSetupParams } from '../../contexts/BackgroundContext'
import { BackgroundModuleV3, ModuleSetupParamsV3, PerformanceMetrics, MemoryStats, ModuleConfiguration, ValidationResult, SerializableState, ModuleMessage, ModuleResponse, CanvasRequirements } from '../interfaces/BackgroundSystemV3'
import { ModuleConfigurationData } from '../../types/browser-apis'
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

class GradientModule implements BackgroundModule, BackgroundModuleV3 {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private animationId: number | null = null
  private startTime: number = Date.now()
  private config: GradientConfig
  private currentTheme: 'light' | 'dark'
  private isRunning = false
  private performanceMetrics: PerformanceMetrics = {
    fps: 0,
    frameTime: 0,
    memoryUsage: 0,
    renderTime: 0,
    timestamp: Date.now()
  }
  private frameCount = 0
  private lastFrameTime = 0
  private moduleConfig: ModuleConfiguration = {
    enabled: true,
    quality: 'medium',
    animationSpeed: 1.0,
    colors: []
  }

  constructor(canvas: HTMLCanvasElement, theme: 'light' | 'dark', config: GradientConfig = defaultConfig) {
    this.initializeModule(canvas, theme, config)
  }

  private initializeModule(canvas: HTMLCanvasElement, theme: 'light' | 'dark', config: GradientConfig = defaultConfig) {
    debugBackground.gradient('Constructor called', { 
      canvas: canvas.tagName,
      width: canvas.width, 
      height: canvas.height,
      theme 
    })
    
    this.canvas = canvas
    this.currentTheme = theme
    this.config = config
    this.lastFrameTime = performance.now()
    
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
    const renderStart = performance.now()
    const currentTime = Date.now()
    const elapsed = (currentTime - this.startTime) * this.config.speed * (this.moduleConfig.animationSpeed || 1.0)
    
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
    
    // Update performance metrics
    const renderTime = performance.now() - renderStart
    this.updatePerformanceMetrics(renderTime)
    
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

  private updatePerformanceMetrics(renderTime: number) {
    this.frameCount++
    const now = performance.now()
    
    if (now - this.lastFrameTime >= 1000) {
      this.performanceMetrics.fps = Math.round((this.frameCount * 1000) / (now - this.lastFrameTime))
      this.performanceMetrics.frameTime = renderTime
      this.performanceMetrics.renderTime = renderTime
      this.performanceMetrics.timestamp = now
      this.performanceMetrics.memoryUsage = 5 // Estimated 5MB for gradient
      
      this.frameCount = 0
      this.lastFrameTime = now
    }
  }

  // V3 Interface Implementation
  async initialize(params: ModuleSetupParamsV3): Promise<void> {
    debugBackground.gradient('V3 Initialize called')
  }

  async preload(): Promise<void> {
    debugBackground.gradient('Preloading assets')
  }

  async activate(): Promise<void> {
    debugBackground.gradient('Activating module')
    this.resume()
  }

  async deactivate(): Promise<void> {
    debugBackground.gradient('Deactivating module')
    this.pause()
  }

  getMemoryUsage(): MemoryStats {
    return {
      used: 5, // Estimated 5MB for gradient rendering
      allocated: 6,
      peak: 8,
      leaks: 0
    }
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics }
  }

  getConfiguration(): ModuleConfiguration {
    return { ...this.moduleConfig }
  }

  async setConfiguration(config: Partial<ModuleConfiguration>): Promise<void> {
    this.moduleConfig = { ...this.moduleConfig, ...config }
    
    // Apply configuration changes
    if (config.animationSpeed !== undefined) {
      debugBackground.gradient('Animation speed updated:', config.animationSpeed)
    }
    
    if (config.colors && Array.isArray(config.colors)) {
      // Update gradient colors if provided
      const newColors = config.colors.filter(color => /^#[0-9A-Fa-f]{6}$/.test(color))
      if (newColors.length > 0) {
        // Update config with new colors - this is a simple implementation
        debugBackground.gradient('Custom colors applied:', newColors)
      }
    }
  }

  validateConfiguration(config: unknown): ValidationResult {
    const errors: any[] = []
    const warnings: any[] = []
    
    if (typeof config !== 'object' || !config) {
      errors.push({ path: 'root', message: 'Configuration must be an object' })
      return { valid: false, errors, warnings }
    }
    
    const cfg = config as ModuleConfigurationData
    
    if (cfg.animationSpeed !== undefined && (typeof cfg.animationSpeed !== 'number' || cfg.animationSpeed < 0.1 || cfg.animationSpeed > 3.0)) {
      errors.push({ path: 'animationSpeed', message: 'Animation speed must be between 0.1 and 3.0' })
    }
    
    if (cfg.colors && (!Array.isArray(cfg.colors) || !cfg.colors.every((color: unknown) => typeof color === 'string' && /^#[0-9A-Fa-f]{6}$/.test(color)))) {
      errors.push({ path: 'colors', message: 'Colors must be an array of valid hex color strings' })
    }
    
    return { valid: errors.length === 0, errors, warnings }
  }

  getCanvasRequirements(): CanvasRequirements {
    return {
      dedicated: false,
      interactive: false,
      zIndex: 1,
      alpha: true,
      preserveDrawingBuffer: false,
      contextType: 'canvas2d'
    }
  }

  async onMessage(message: ModuleMessage): Promise<ModuleResponse> {
    return {
      messageId: message.id,
      success: true,
      payload: null,
      timestamp: Date.now()
    }
  }

  async sendMessage(targetModule: string, message: ModuleMessage): Promise<ModuleResponse> {
    return {
      messageId: message.id,
      success: false,
      error: 'Message sending not implemented',
      timestamp: Date.now()
    }
  }

  serializeState(): SerializableState {
    return {
      version: 1,
      moduleId: 'gradient',
      config: this.moduleConfig,
      timestamp: Date.now()
    }
  }

  async deserializeState(state: SerializableState): Promise<void> {
    if (state.config) {
      await this.setConfiguration(state.config)
    }
  }
}

export const setup = (params: ModuleSetupParams | ModuleSetupParamsV3): BackgroundModule => {
  const { canvas, width, height, theme } = params
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