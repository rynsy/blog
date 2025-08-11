import { DeviceCapabilities, PerformanceMetrics } from '../../../interfaces/BackgroundSystemV3'

/**
 * Abstract base class for rendering strategies
 */
export abstract class RenderingStrategy {
  protected canvas: HTMLCanvasElement
  protected performanceMetrics: PerformanceMetrics = {
    fps: 0,
    frameTime: 0,
    memoryUsage: 0,
    renderTime: 0,
    timestamp: Date.now()
  }

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
  }

  abstract initialize(): Promise<void>
  abstract render(data: RenderData): void
  abstract cleanup(): void
  abstract getPerformanceMetrics(): PerformanceMetrics
  abstract getName(): string
}

/**
 * Canvas 2D rendering strategy for broad compatibility
 */
export class Canvas2DStrategy extends RenderingStrategy {
  private ctx: CanvasRenderingContext2D | null = null

  async initialize(): Promise<void> {
    this.ctx = this.canvas.getContext('2d')
    if (!this.ctx) {
      throw new Error('Failed to get 2D rendering context')
    }
    console.log('🎨 Canvas2D rendering strategy initialized')
  }

  render(data: RenderData): void {
    if (!this.ctx) return
    
    const startTime = performance.now()
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    
    // Apply transform if provided
    this.ctx.save()
    if (data.transform) {
      this.ctx.translate(data.transform.x, data.transform.y)
      this.ctx.scale(data.transform.scale, data.transform.scale)
    }
    
    // Render based on data type
    if (data.type === 'graph' && data.nodes && data.links) {
      this.renderGraph(data)
    } else if (data.type === 'particles' && data.particles) {
      this.renderParticles(data)
    }
    
    this.ctx.restore()
    
    // Update performance metrics
    const renderTime = performance.now() - startTime
    this.updateMetrics(renderTime)
  }

  private renderGraph(data: RenderData) {
    if (!this.ctx || !data.nodes || !data.links) return
    
    const { nodes, links } = data
    
    // Draw links
    this.ctx.strokeStyle = data.theme === 'dark' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(79, 70, 229, 0.4)'
    this.ctx.lineWidth = 2
    
    links.forEach(link => {
      const source = nodes.find(n => n.id === link.source)
      const target = nodes.find(n => n.id === link.target)
      
      if (source && target && source.x !== undefined && source.y !== undefined && target.x !== undefined && target.y !== undefined) {
        this.ctx!.beginPath()
        this.ctx!.moveTo(source.x, source.y)
        this.ctx!.lineTo(target.x, target.y)
        this.ctx!.stroke()
      }
    })
    
    // Draw nodes
    nodes.forEach(node => {
      if (node.x === undefined || node.y === undefined) return
      
      this.ctx!.beginPath()
      this.ctx!.arc(node.x, node.y, node.radius || 10, 0, 2 * Math.PI)
      this.ctx!.fillStyle = node.color || '#6366f1'
      this.ctx!.fill()
      
      // Node border
      this.ctx!.strokeStyle = '#ffffff'
      this.ctx!.lineWidth = 2
      this.ctx!.stroke()
      
      // Node label
      if (node.label) {
        this.ctx!.fillStyle = '#ffffff'
        this.ctx!.font = '12px sans-serif'
        this.ctx!.textAlign = 'center'
        this.ctx!.textBaseline = 'middle'
        this.ctx!.fillText(node.label, node.x, node.y)
      }
    })
  }

  private renderParticles(data: RenderData) {
    if (!this.ctx || !data.particles) return
    
    data.particles.forEach(particle => {
      this.ctx!.beginPath()
      this.ctx!.arc(particle.x, particle.y, particle.radius || 2, 0, 2 * Math.PI)
      this.ctx!.fillStyle = particle.color || '#6366f1'
      this.ctx!.globalAlpha = particle.alpha || 0.7
      this.ctx!.fill()
    })
    
    this.ctx.globalAlpha = 1
  }

  private updateMetrics(renderTime: number) {
    this.performanceMetrics.renderTime = renderTime
    this.performanceMetrics.timestamp = Date.now()
  }

  cleanup(): void {
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    }
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics }
  }

  getName(): string {
    return 'Canvas2D'
  }
}

/**
 * WebGL rendering strategy for better performance with complex scenes
 */
export class WebGLStrategy extends RenderingStrategy {
  private gl: WebGLRenderingContext | null = null
  private shaderProgram: WebGLProgram | null = null
  private positionBuffer: WebGLBuffer | null = null
  private colorBuffer: WebGLBuffer | null = null

  async initialize(): Promise<void> {
    this.gl = this.canvas.getContext('webgl')
    if (!this.gl) {
      throw new Error('WebGL not supported')
    }
    
    await this.initializeShaders()
    this.setupBuffers()
    
    // Basic WebGL setup
    this.gl.clearColor(0.0, 0.0, 0.0, 0.0)
    this.gl.enable(this.gl.BLEND)
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA)
    
    console.log('🚀 WebGL rendering strategy initialized')
  }

  render(data: RenderData): void {
    if (!this.gl || !this.shaderProgram) return
    
    const startTime = performance.now()
    
    // Clear canvas
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT)
    
    this.gl.useProgram(this.shaderProgram)
    
    // For now, fall back to Canvas2D for complex rendering
    // In a full implementation, this would use WebGL shaders
    const ctx = this.canvas.getContext('2d')
    if (ctx) {
      // Simplified fallback rendering
      this.fallbackRender(ctx, data)
    }
    
    const renderTime = performance.now() - startTime
    this.updateMetrics(renderTime)
  }

  private fallbackRender(ctx: CanvasRenderingContext2D, data: RenderData) {
    // Simple fallback implementation
    if (data.type === 'graph' && data.nodes) {
      data.nodes.forEach(node => {
        if (node.x === undefined || node.y === undefined) return
        
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.radius || 8, 0, 2 * Math.PI)
        ctx.fillStyle = node.color || '#6366f1'
        ctx.fill()
      })
    }
  }

  private async initializeShaders(): Promise<void> {
    if (!this.gl) return
    
    // Simple vertex shader
    const vertexShaderSource = `
      attribute vec2 a_position;
      attribute vec4 a_color;
      uniform vec2 u_resolution;
      varying vec4 v_color;
      
      void main() {
        vec2 zeroToOne = a_position / u_resolution;
        vec2 zeroToTwo = zeroToOne * 2.0;
        vec2 clipSpace = zeroToTwo - 1.0;
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
        v_color = a_color;
      }
    `
    
    // Simple fragment shader
    const fragmentShaderSource = `
      precision mediump float;
      varying vec4 v_color;
      
      void main() {
        gl_FragColor = v_color;
      }
    `
    
    const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexShaderSource)
    const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource)
    
    if (!vertexShader || !fragmentShader) {
      throw new Error('Failed to create shaders')
    }
    
    this.shaderProgram = this.gl.createProgram()
    if (!this.shaderProgram) {
      throw new Error('Failed to create shader program')
    }
    
    this.gl.attachShader(this.shaderProgram, vertexShader)
    this.gl.attachShader(this.shaderProgram, fragmentShader)
    this.gl.linkProgram(this.shaderProgram)
    
    if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS)) {
      const error = this.gl.getProgramInfoLog(this.shaderProgram)
      throw new Error(`Shader program linking failed: ${error}`)
    }
  }

  private createShader(type: number, source: string): WebGLShader | null {
    if (!this.gl) return null
    
    const shader = this.gl.createShader(type)
    if (!shader) return null
    
    this.gl.shaderSource(shader, source)
    this.gl.compileShader(shader)
    
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Shader compilation error:', this.gl.getShaderInfoLog(shader))
      this.gl.deleteShader(shader)
      return null
    }
    
    return shader
  }

  private setupBuffers(): void {
    if (!this.gl) return
    
    this.positionBuffer = this.gl.createBuffer()
    this.colorBuffer = this.gl.createBuffer()
  }

  private updateMetrics(renderTime: number) {
    this.performanceMetrics.renderTime = renderTime
    this.performanceMetrics.timestamp = Date.now()
  }

  cleanup(): void {
    if (this.gl) {
      if (this.shaderProgram) {
        this.gl.deleteProgram(this.shaderProgram)
      }
      if (this.positionBuffer) {
        this.gl.deleteBuffer(this.positionBuffer)
      }
      if (this.colorBuffer) {
        this.gl.deleteBuffer(this.colorBuffer)
      }
    }
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics }
  }

  getName(): string {
    return 'WebGL'
  }
}

/**
 * Manages adaptive rendering strategy selection based on device capabilities and performance
 */
export class AdaptiveRenderingManager {
  private currentStrategy: RenderingStrategy | null = null
  private canvas: HTMLCanvasElement
  private deviceCapabilities: DeviceCapabilities
  private performanceHistory: number[] = []
  private frameCount = 0
  private lastStrategySwitch = 0
  private readonly STRATEGY_SWITCH_COOLDOWN = 5000 // 5 seconds
  private readonly PERFORMANCE_SAMPLE_SIZE = 60 // 1 second at 60fps
  
  constructor(canvas: HTMLCanvasElement, deviceCapabilities: DeviceCapabilities) {
    this.canvas = canvas
    this.deviceCapabilities = deviceCapabilities
  }

  /**
   * Initialize the optimal rendering strategy
   */
  async initialize(nodeCount = 25): Promise<void> {
    const strategy = this.selectOptimalStrategy(nodeCount)
    await this.switchToStrategy(strategy)
  }

  /**
   * Render with current strategy and monitor performance
   */
  render(data: RenderData): void {
    if (!this.currentStrategy) {
      console.warn('No rendering strategy initialized')
      return
    }
    
    const startTime = performance.now()
    this.currentStrategy.render(data)
    const renderTime = performance.now() - startTime
    
    this.updatePerformanceHistory(renderTime)
    this.frameCount++
    
    // Check if we need to adapt the strategy
    if (this.frameCount % this.PERFORMANCE_SAMPLE_SIZE === 0) {
      this.evaluatePerformance(data)
    }
  }

  /**
   * Get current rendering strategy name
   */
  getCurrentStrategyName(): string {
    return this.currentStrategy?.getName() || 'None'
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return this.currentStrategy?.getPerformanceMetrics() || {
      fps: 0,
      frameTime: 0,
      memoryUsage: 0,
      renderTime: 0,
      timestamp: Date.now()
    }
  }

  /**
   * Cleanup current strategy
   */
  cleanup(): void {
    if (this.currentStrategy) {
      this.currentStrategy.cleanup()
      this.currentStrategy = null
    }
  }

  private selectOptimalStrategy(nodeCount: number): RenderingStrategy {
    // Use Canvas2D for small graphs or limited devices
    if (nodeCount < 50 || !this.deviceCapabilities.webgl || this.deviceCapabilities.isLowEnd) {
      return new Canvas2DStrategy(this.canvas)
    }
    
    // Use WebGL for larger graphs with capable devices
    if (nodeCount >= 50 && this.deviceCapabilities.webgl) {
      return new WebGLStrategy(this.canvas)
    }
    
    // Default fallback
    return new Canvas2DStrategy(this.canvas)
  }

  private async switchToStrategy(newStrategy: RenderingStrategy): Promise<void> {
    if (this.currentStrategy) {
      this.currentStrategy.cleanup()
    }
    
    try {
      await newStrategy.initialize()
      this.currentStrategy = newStrategy
      this.lastStrategySwitch = Date.now()
      console.log(`🔄 Switched to ${newStrategy.getName()} rendering strategy`)
    } catch (error) {
      console.error(`Failed to initialize ${newStrategy.getName()} strategy:`, error)
      
      // Fallback to Canvas2D if WebGL fails
      if (!(newStrategy instanceof Canvas2DStrategy)) {
        console.log('🔄 Falling back to Canvas2D strategy')
        const fallbackStrategy = new Canvas2DStrategy(this.canvas)
        await fallbackStrategy.initialize()
        this.currentStrategy = fallbackStrategy
      } else {
        throw error
      }
    }
  }

  private updatePerformanceHistory(renderTime: number): void {
    this.performanceHistory.push(renderTime)
    
    if (this.performanceHistory.length > this.PERFORMANCE_SAMPLE_SIZE) {
      this.performanceHistory.shift()
    }
  }

  private evaluatePerformance(data: RenderData): void {
    if (this.performanceHistory.length < this.PERFORMANCE_SAMPLE_SIZE) {
      return
    }
    
    const avgRenderTime = this.performanceHistory.reduce((a, b) => a + b, 0) / this.performanceHistory.length
    const currentFPS = 1000 / avgRenderTime
    
    // Don't switch strategies too frequently
    if (Date.now() - this.lastStrategySwitch < this.STRATEGY_SWITCH_COOLDOWN) {
      return
    }
    
    const nodeCount = data.nodes?.length || 0
    
    // If performance is poor and we're using WebGL, consider switching to Canvas2D
    if (currentFPS < 30 && this.currentStrategy instanceof WebGLStrategy && nodeCount < 100) {
      console.log('⚠️ Poor WebGL performance, switching to Canvas2D')
      const canvas2DStrategy = new Canvas2DStrategy(this.canvas)
      this.switchToStrategy(canvas2DStrategy).catch(console.error)
    }
    
    // If performance is good and we're using Canvas2D with many nodes, consider WebGL
    else if (currentFPS > 45 && this.currentStrategy instanceof Canvas2DStrategy && 
             nodeCount > 50 && this.deviceCapabilities.webgl) {
      console.log('📈 Good Canvas2D performance with many nodes, trying WebGL')
      const webglStrategy = new WebGLStrategy(this.canvas)
      this.switchToStrategy(webglStrategy).catch(console.error)
    }
  }
}

// Type definitions
export interface RenderData {
  type: 'graph' | 'particles' | 'gradient'
  timestamp: number
  deltaTime: number
  theme: 'light' | 'dark'
  dimensions: { width: number; height: number }
  transform?: {
    x: number
    y: number
    scale: number
    rotation?: number
  }
  nodes?: Array<{
    id: string
    x?: number
    y?: number
    radius?: number
    color?: string
    label?: string
  }>
  links?: Array<{
    source: string
    target: string
  }>
  particles?: Array<{
    x: number
    y: number
    radius?: number
    color?: string
    alpha?: number
  }>
}