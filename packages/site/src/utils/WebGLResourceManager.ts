/**
 * WebGL Resource Manager
 * Provides centralized tracking and cleanup of WebGL resources to prevent memory leaks
 */

export interface WebGLResourceTracker {
  buffers: Set<WebGLBuffer>
  textures: Set<WebGLTexture>
  framebuffers: Set<WebGLFramebuffer>
  programs: Set<WebGLProgram>
  shaders: Set<WebGLShader>
}

export interface ResourceMetrics {
  bufferCount: number
  textureCount: number
  framebufferCount: number
  programCount: number
  shaderCount: number
  estimatedMemoryUsage: number // in MB
}

export class WebGLResourceManager {
  private gl: WebGLRenderingContext
  private resources: WebGLResourceTracker
  private isContextLost: boolean = false
  private contextLossHandler?: () => void
  private contextRestoreHandler?: () => void

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl
    this.resources = {
      buffers: new Set(),
      textures: new Set(),
      framebuffers: new Set(),
      programs: new Set(),
      shaders: new Set()
    }

    // Set up context loss handling
    this.setupContextLossHandling()
  }

  private setupContextLossHandling() {
    const canvas = this.gl.canvas as HTMLCanvasElement
    
    this.contextLossHandler = () => {
      console.warn('WebGL context lost - marking resources as invalid')
      this.isContextLost = true
      this.clearResourceTracking()
    }
    
    this.contextRestoreHandler = () => {
      console.log('WebGL context restored')
      this.isContextLost = false
    }
    
    canvas.addEventListener('webglcontextlost', this.contextLossHandler)
    canvas.addEventListener('webglcontextrestored', this.contextRestoreHandler)
  }

  // Resource creation methods with automatic tracking
  createBuffer(): WebGLBuffer {
    if (this.isContextLost) {
      throw new Error('Cannot create buffer: WebGL context is lost')
    }
    
    const buffer = this.gl.createBuffer()
    if (!buffer) {
      throw new Error('Failed to create WebGL buffer')
    }
    
    this.resources.buffers.add(buffer)
    return buffer
  }

  createTexture(): WebGLTexture {
    if (this.isContextLost) {
      throw new Error('Cannot create texture: WebGL context is lost')
    }
    
    const texture = this.gl.createTexture()
    if (!texture) {
      throw new Error('Failed to create WebGL texture')
    }
    
    this.resources.textures.add(texture)
    return texture
  }

  createFramebuffer(): WebGLFramebuffer {
    if (this.isContextLost) {
      throw new Error('Cannot create framebuffer: WebGL context is lost')
    }
    
    const framebuffer = this.gl.createFramebuffer()
    if (!framebuffer) {
      throw new Error('Failed to create WebGL framebuffer')
    }
    
    this.resources.framebuffers.add(framebuffer)
    return framebuffer
  }

  createProgram(): WebGLProgram {
    if (this.isContextLost) {
      throw new Error('Cannot create program: WebGL context is lost')
    }
    
    const program = this.gl.createProgram()
    if (!program) {
      throw new Error('Failed to create WebGL program')
    }
    
    this.resources.programs.add(program)
    return program
  }

  createShader(type: number): WebGLShader {
    if (this.isContextLost) {
      throw new Error('Cannot create shader: WebGL context is lost')
    }
    
    const shader = this.gl.createShader(type)
    if (!shader) {
      throw new Error('Failed to create WebGL shader')
    }
    
    this.resources.shaders.add(shader)
    return shader
  }

  // Resource deletion methods with automatic tracking cleanup
  deleteBuffer(buffer: WebGLBuffer) {
    if (this.isContextLost) return
    
    this.gl.deleteBuffer(buffer)
    this.resources.buffers.delete(buffer)
  }

  deleteTexture(texture: WebGLTexture) {
    if (this.isContextLost) return
    
    this.gl.deleteTexture(texture)
    this.resources.textures.delete(texture)
  }

  deleteFramebuffer(framebuffer: WebGLFramebuffer) {
    if (this.isContextLost) return
    
    this.gl.deleteFramebuffer(framebuffer)
    this.resources.framebuffers.delete(framebuffer)
  }

  deleteProgram(program: WebGLProgram) {
    if (this.isContextLost) return
    
    this.gl.deleteProgram(program)
    this.resources.programs.delete(program)
  }

  deleteShader(shader: WebGLShader) {
    if (this.isContextLost) return
    
    this.gl.deleteShader(shader)
    this.resources.shaders.delete(shader)
  }

  // Bulk cleanup methods
  cleanup() {
    if (this.isContextLost) {
      this.clearResourceTracking()
      return
    }

    // Delete all tracked resources
    this.resources.buffers.forEach(buffer => this.gl.deleteBuffer(buffer))
    this.resources.textures.forEach(texture => this.gl.deleteTexture(texture))
    this.resources.framebuffers.forEach(framebuffer => this.gl.deleteFramebuffer(framebuffer))
    this.resources.programs.forEach(program => this.gl.deleteProgram(program))
    this.resources.shaders.forEach(shader => this.gl.deleteShader(shader))
    
    this.clearResourceTracking()
    this.removeEventListeners()
  }

  private clearResourceTracking() {
    this.resources.buffers.clear()
    this.resources.textures.clear()
    this.resources.framebuffers.clear()
    this.resources.programs.clear()
    this.resources.shaders.clear()
  }

  private removeEventListeners() {
    const canvas = this.gl.canvas as HTMLCanvasElement
    if (this.contextLossHandler) {
      canvas.removeEventListener('webglcontextlost', this.contextLossHandler)
    }
    if (this.contextRestoreHandler) {
      canvas.removeEventListener('webglcontextrestored', this.contextRestoreHandler)
    }
  }

  // Resource monitoring and metrics
  getResourceMetrics(): ResourceMetrics {
    const estimatedMemoryUsage = this.estimateMemoryUsage()
    
    return {
      bufferCount: this.resources.buffers.size,
      textureCount: this.resources.textures.size,
      framebufferCount: this.resources.framebuffers.size,
      programCount: this.resources.programs.size,
      shaderCount: this.resources.shaders.size,
      estimatedMemoryUsage
    }
  }

  private estimateMemoryUsage(): number {
    // Rough estimation based on typical resource sizes
    const bufferMemory = this.resources.buffers.size * 0.1 // ~100KB per buffer
    const textureMemory = this.resources.textures.size * 4 // ~4MB per texture (1024x1024 RGBA)
    const framebufferMemory = this.resources.framebuffers.size * 0.5 // ~500KB per framebuffer
    const programMemory = this.resources.programs.size * 0.01 // ~10KB per program
    const shaderMemory = this.resources.shaders.size * 0.005 // ~5KB per shader
    
    return bufferMemory + textureMemory + framebufferMemory + programMemory + shaderMemory
  }

  // Utility methods for resource validation
  isResourceValid(resource: WebGLBuffer | WebGLTexture | WebGLFramebuffer | WebGLProgram | WebGLShader): boolean {
    if (this.isContextLost) return false
    
    // Check if resource is still tracked
    return this.resources.buffers.has(resource as WebGLBuffer) ||
           this.resources.textures.has(resource as WebGLTexture) ||
           this.resources.framebuffers.has(resource as WebGLFramebuffer) ||
           this.resources.programs.has(resource as WebGLProgram) ||
           this.resources.shaders.has(resource as WebGLShader)
  }

  // Helper method to create and compile shader with proper resource tracking
  compileShader(source: string, type: number): WebGLShader {
    const shader = this.createShader(type)
    
    this.gl.shaderSource(shader, source)
    this.gl.compileShader(shader)
    
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const error = this.gl.getShaderInfoLog(shader)
      this.deleteShader(shader)
      throw new Error(`Shader compilation failed: ${error}`)
    }
    
    return shader
  }

  // Helper method to create and link program with proper resource tracking
  linkProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram {
    const program = this.createProgram()
    
    this.gl.attachShader(program, vertexShader)
    this.gl.attachShader(program, fragmentShader)
    this.gl.linkProgram(program)
    
    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      const error = this.gl.getProgramInfoLog(program)
      this.deleteProgram(program)
      throw new Error(`Program linking failed: ${error}`)
    }
    
    return program
  }

  // Memory pressure detection and cleanup recommendations
  checkMemoryPressure(): { 
    isUnderPressure: boolean
    recommendations: string[]
    metrics: ResourceMetrics 
  } {
    const metrics = this.getResourceMetrics()
    const isUnderPressure = metrics.estimatedMemoryUsage > 50 // 50MB threshold
    
    const recommendations: string[] = []
    
    if (metrics.textureCount > 20) {
      recommendations.push('Consider reducing texture count or using lower resolution textures')
    }
    
    if (metrics.bufferCount > 50) {
      recommendations.push('Consider reusing buffers or combining geometry')
    }
    
    if (metrics.programCount > 10) {
      recommendations.push('Consider shader program reuse or ubershader techniques')
    }
    
    if (isUnderPressure) {
      recommendations.push('Overall memory usage is high - consider reducing quality settings')
    }
    
    return { isUnderPressure, recommendations, metrics }
  }
}

// Utility function to create a resource manager for a WebGL context
export function createWebGLResourceManager(gl: WebGLRenderingContext): WebGLResourceManager {
  return new WebGLResourceManager(gl)
}