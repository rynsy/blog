/**
 * Enhanced WebGL and Canvas API Type Definitions
 * 
 * Provides strict typing for WebGL contexts, shaders, and Canvas APIs
 * with additional safety guarantees and performance optimizations.
 */

// ============================================================================
// Enhanced WebGL Context Types
// ============================================================================

// Strict WebGL program wrapper
export interface StrictWebGLProgram {
  readonly program: WebGLProgram
  readonly vertexShader: WebGLShader
  readonly fragmentShader: WebGLShader
  readonly attributes: ReadonlyMap<string, GLint>
  readonly uniforms: ReadonlyMap<string, WebGLUniformLocation>
  readonly isLinked: boolean
}

// WebGL buffer with type safety
export interface TypedWebGLBuffer<T extends ArrayBufferView> {
  readonly buffer: WebGLBuffer
  readonly target: GLenum
  readonly usage: GLenum
  readonly data: T
  readonly byteLength: number
  readonly itemCount: number
}

// WebGL texture with metadata
export interface StrictWebGLTexture {
  readonly texture: WebGLTexture
  readonly target: GLenum
  readonly width: number
  readonly height: number
  readonly format: GLenum
  readonly type: GLenum
  readonly mipLevels: number
  readonly isCompressed: boolean
}

// Vertex attribute descriptor
export interface VertexAttributeDescriptor {
  readonly name: string
  readonly location: GLint
  readonly size: 1 | 2 | 3 | 4
  readonly type: GLenum
  readonly normalized: boolean
  readonly stride: number
  readonly offset: number
}

// Uniform descriptor
export interface UniformDescriptor<T = unknown> {
  readonly name: string
  readonly location: WebGLUniformLocation
  readonly type: GLenum
  readonly size: number
  readonly value?: T
}

// ============================================================================
// Shader Type Definitions
// ============================================================================

// Shader source with metadata
export interface ShaderSource {
  readonly source: string
  readonly type: 'vertex' | 'fragment'
  readonly version: string
  readonly features: readonly ShaderFeature[]
  readonly uniforms: readonly string[]
  readonly attributes: readonly string[]
  readonly dependencies: readonly string[]
}

export type ShaderFeature = 
  | 'precision'
  | 'extensions'
  | 'textures'
  | 'lighting'
  | 'instancing'
  | 'geometry'

// Compiled shader information
export interface CompiledShader {
  readonly shader: WebGLShader
  readonly source: ShaderSource
  readonly compileTime: number
  readonly isCompiled: boolean
  readonly infoLog: string
}

// Shader program configuration
export interface ShaderProgramConfig {
  readonly vertex: ShaderSource
  readonly fragment: ShaderSource
  readonly attributeLocations?: Record<string, number>
  readonly transformFeedbackVaryings?: readonly string[]
}

// ============================================================================
// Canvas Context Type Guards
// ============================================================================

// Canvas context union type
export type AnyCanvasContext = 
  | CanvasRenderingContext2D 
  | WebGLRenderingContext 
  | WebGL2RenderingContext
  | ImageBitmapRenderingContext
  | OffscreenCanvasRenderingContext2D

// Context type predicates
export const isCanvas2DContext = (
  context: AnyCanvasContext
): context is CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D => {
  return 'fillRect' in context
}

export const isWebGLContext = (
  context: AnyCanvasContext
): context is WebGLRenderingContext => {
  return 'drawArrays' in context && !('drawElementsInstanced' in context)
}

export const isWebGL2Context = (
  context: AnyCanvasContext
): context is WebGL2RenderingContext => {
  return 'drawArrays' in context && 'texStorage2D' in context
}

export const isOffscreenContext = (
  context: AnyCanvasContext
): context is OffscreenCanvasRenderingContext2D => {
  return context.canvas instanceof OffscreenCanvas
}

// ============================================================================
// WebGL State Management Types
// ============================================================================

// WebGL state snapshot
export interface WebGLState {
  readonly viewport: readonly [number, number, number, number]
  readonly clearColor: readonly [number, number, number, number]
  readonly blendEnabled: boolean
  readonly blendFunc: readonly [GLenum, GLenum]
  readonly depthTestEnabled: boolean
  readonly cullFaceEnabled: boolean
  readonly currentProgram: WebGLProgram | null
  readonly activeTexture: GLenum
  readonly boundTextures: ReadonlyMap<GLenum, WebGLTexture | null>
  readonly boundBuffers: ReadonlyMap<GLenum, WebGLBuffer | null>
}

// WebGL context wrapper with state management
export class StrictWebGLContextWrapper {
  private readonly _context: WebGLRenderingContext | WebGL2RenderingContext
  private readonly _stateStack: WebGLState[] = []
  private readonly _programs = new Map<string, StrictWebGLProgram>()
  private readonly _buffers = new Map<string, TypedWebGLBuffer<ArrayBufferView>>()
  private readonly _textures = new Map<string, StrictWebGLTexture>()
  
  constructor(context: WebGLRenderingContext | WebGL2RenderingContext) {
    this._context = context
  }
  
  get context(): WebGLRenderingContext | WebGL2RenderingContext {
    return this._context
  }
  
  get isWebGL2(): boolean {
    return isWebGL2Context(this._context)
  }
  
  // State management
  pushState(): void {
    this._stateStack.push(this.captureState())
  }
  
  popState(): void {
    const state = this._stateStack.pop()
    if (state) {
      this.restoreState(state)
    }
  }
  
  private captureState(): WebGLState {
    const gl = this._context
    
    return {
      viewport: gl.getParameter(gl.VIEWPORT) as [number, number, number, number],
      clearColor: gl.getParameter(gl.COLOR_CLEAR_VALUE) as [number, number, number, number],
      blendEnabled: gl.isEnabled(gl.BLEND),
      blendFunc: [
        gl.getParameter(gl.BLEND_SRC_RGB) as GLenum,
        gl.getParameter(gl.BLEND_DST_RGB) as GLenum
      ],
      depthTestEnabled: gl.isEnabled(gl.DEPTH_TEST),
      cullFaceEnabled: gl.isEnabled(gl.CULL_FACE),
      currentProgram: gl.getParameter(gl.CURRENT_PROGRAM) as WebGLProgram | null,
      activeTexture: gl.getParameter(gl.ACTIVE_TEXTURE) as GLenum,
      boundTextures: new Map(),
      boundBuffers: new Map()
    }
  }
  
  private restoreState(state: WebGLState): void {
    const gl = this._context
    
    gl.viewport(...state.viewport)
    gl.clearColor(...state.clearColor)
    
    if (state.blendEnabled) {
      gl.enable(gl.BLEND)
      gl.blendFunc(...state.blendFunc)
    } else {
      gl.disable(gl.BLEND)
    }
    
    if (state.depthTestEnabled) {
      gl.enable(gl.DEPTH_TEST)
    } else {
      gl.disable(gl.DEPTH_TEST)
    }
    
    if (state.cullFaceEnabled) {
      gl.enable(gl.CULL_FACE)
    } else {
      gl.disable(gl.CULL_FACE)
    }
    
    gl.useProgram(state.currentProgram)
    gl.activeTexture(state.activeTexture)
  }
  
  // Resource management
  createProgram(id: string, config: ShaderProgramConfig): StrictWebGLProgram {
    const gl = this._context
    
    const vertexShader = this.compileShader(config.vertex)
    const fragmentShader = this.compileShader(config.fragment)
    
    const program = gl.createProgram()
    if (!program) {
      throw new Error('Failed to create WebGL program')
    }
    
    gl.attachShader(program, vertexShader.shader)
    gl.attachShader(program, fragmentShader.shader)
    
    // Bind attribute locations if specified
    if (config.attributeLocations) {
      for (const [name, location] of Object.entries(config.attributeLocations)) {
        gl.bindAttribLocation(program, location, name)
      }
    }
    
    gl.linkProgram(program)
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const infoLog = gl.getProgramInfoLog(program) || 'Unknown error'
      gl.deleteProgram(program)
      throw new Error(`Shader program linking failed: ${infoLog}`)
    }
    
    // Extract attributes and uniforms
    const attributes = new Map<string, GLint>()
    const uniforms = new Map<string, WebGLUniformLocation>()
    
    const numAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES)
    for (let i = 0; i < numAttributes; i++) {
      const info = gl.getActiveAttrib(program, i)
      if (info) {
        const location = gl.getAttribLocation(program, info.name)
        attributes.set(info.name, location)
      }
    }
    
    const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS)
    for (let i = 0; i < numUniforms; i++) {
      const info = gl.getActiveUniform(program, i)
      if (info) {
        const location = gl.getUniformLocation(program, info.name)
        if (location) {
          uniforms.set(info.name, location)
        }
      }
    }
    
    const strictProgram: StrictWebGLProgram = {
      program,
      vertexShader: vertexShader.shader,
      fragmentShader: fragmentShader.shader,
      attributes,
      uniforms,
      isLinked: true
    }
    
    this._programs.set(id, strictProgram)
    return strictProgram
  }
  
  private compileShader(source: ShaderSource): CompiledShader {
    const gl = this._context
    const type = source.type === 'vertex' ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER
    
    const shader = gl.createShader(type)
    if (!shader) {
      throw new Error(`Failed to create ${source.type} shader`)
    }
    
    const startTime = performance.now()
    gl.shaderSource(shader, source.source)
    gl.compileShader(shader)
    const compileTime = performance.now() - startTime
    
    const isCompiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS)
    const infoLog = gl.getShaderInfoLog(shader) || ''
    
    if (!isCompiled) {
      gl.deleteShader(shader)
      throw new Error(`Shader compilation failed: ${infoLog}`)
    }
    
    return {
      shader,
      source,
      compileTime,
      isCompiled,
      infoLog
    }
  }
  
  createBuffer<T extends ArrayBufferView>(
    id: string,
    target: GLenum,
    data: T,
    usage: GLenum = this._context.STATIC_DRAW
  ): TypedWebGLBuffer<T> {
    const gl = this._context
    
    const buffer = gl.createBuffer()
    if (!buffer) {
      throw new Error('Failed to create WebGL buffer')
    }
    
    gl.bindBuffer(target, buffer)
    gl.bufferData(target, data, usage)
    
    const typedBuffer: TypedWebGLBuffer<T> = {
      buffer,
      target,
      usage,
      data,
      byteLength: data.byteLength,
      itemCount: data.length
    }
    
    this._buffers.set(id, typedBuffer as TypedWebGLBuffer<ArrayBufferView>)
    return typedBuffer
  }
  
  createTexture(
    id: string,
    target: GLenum,
    width: number,
    height: number,
    format: GLenum,
    type: GLenum,
    data?: ArrayBufferView | null
  ): StrictWebGLTexture {
    const gl = this._context
    
    const texture = gl.createTexture()
    if (!texture) {
      throw new Error('Failed to create WebGL texture')
    }
    
    gl.bindTexture(target, texture)
    
    if (target === gl.TEXTURE_2D) {
      gl.texImage2D(target, 0, format, width, height, 0, format, type, data)
    }
    
    const strictTexture: StrictWebGLTexture = {
      texture,
      target,
      width,
      height,
      format,
      type,
      mipLevels: 1,
      isCompressed: false
    }
    
    this._textures.set(id, strictTexture)
    return strictTexture
  }
  
  // Cleanup
  cleanup(): void {
    const gl = this._context
    
    // Delete programs
    for (const program of this._programs.values()) {
      gl.deleteProgram(program.program)
      gl.deleteShader(program.vertexShader)
      gl.deleteShader(program.fragmentShader)
    }
    
    // Delete buffers
    for (const buffer of this._buffers.values()) {
      gl.deleteBuffer(buffer.buffer)
    }
    
    // Delete textures
    for (const texture of this._textures.values()) {
      gl.deleteTexture(texture.texture)
    }
    
    this._programs.clear()
    this._buffers.clear()
    this._textures.clear()
  }
}

// ============================================================================
// Canvas 2D Enhanced Types
// ============================================================================

// Enhanced Canvas 2D context with performance tracking
export interface StrictCanvas2DContext {
  readonly context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
  readonly width: number
  readonly height: number
  readonly devicePixelRatio: number
}

// Canvas 2D rendering operation
export interface Canvas2DOperation {
  readonly type: 'fill' | 'stroke' | 'clear' | 'transform' | 'image' | 'text'
  readonly startTime: number
  readonly endTime?: number
  readonly cost: number // Estimated performance cost 0-1
}

// Canvas performance metrics
export interface CanvasPerformanceMetrics {
  readonly operationsPerFrame: number
  readonly averageOperationTime: number
  readonly highCostOperations: number
  readonly memoryUsage: number
}

// ============================================================================
// Type-Safe Canvas Operations
// ============================================================================

// Safe Canvas 2D operations with performance tracking
export class SafeCanvas2DWrapper {
  private readonly _context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
  private readonly _operations: Canvas2DOperation[] = []
  private readonly _maxOperationHistory = 60 // 1 second at 60fps
  
  constructor(context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) {
    this._context = context
  }
  
  get context(): CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D {
    return this._context
  }
  
  // Tracked operations
  fillRect(x: number, y: number, width: number, height: number): void {
    const operation = this.startOperation('fill')
    this._context.fillRect(x, y, width, height)
    this.endOperation(operation)
  }
  
  strokeRect(x: number, y: number, width: number, height: number): void {
    const operation = this.startOperation('stroke')
    this._context.strokeRect(x, y, width, height)
    this.endOperation(operation)
  }
  
  clearRect(x: number, y: number, width: number, height: number): void {
    const operation = this.startOperation('clear')
    this._context.clearRect(x, y, width, height)
    this.endOperation(operation)
  }
  
  drawImage(
    image: CanvasImageSource,
    dx: number,
    dy: number,
    dw?: number,
    dh?: number
  ): void {
    const operation = this.startOperation('image')
    if (dw !== undefined && dh !== undefined) {
      this._context.drawImage(image, dx, dy, dw, dh)
    } else {
      this._context.drawImage(image, dx, dy)
    }
    this.endOperation(operation)
  }
  
  private startOperation(type: Canvas2DOperation['type']): Canvas2DOperation {
    return {
      type,
      startTime: performance.now(),
      cost: this.estimateOperationCost(type)
    }
  }
  
  private endOperation(operation: Canvas2DOperation): void {
    const completedOperation = {
      ...operation,
      endTime: performance.now()
    }
    
    this._operations.push(completedOperation)
    
    // Maintain operation history limit
    if (this._operations.length > this._maxOperationHistory) {
      this._operations.shift()
    }
  }
  
  private estimateOperationCost(type: Canvas2DOperation['type']): number {
    switch (type) {
      case 'clear': return 0.1
      case 'fill': return 0.3
      case 'stroke': return 0.4
      case 'image': return 0.8
      case 'text': return 0.6
      case 'transform': return 0.2
      default: return 0.5
    }
  }
  
  getPerformanceMetrics(): CanvasPerformanceMetrics {
    if (this._operations.length === 0) {
      return {
        operationsPerFrame: 0,
        averageOperationTime: 0,
        highCostOperations: 0,
        memoryUsage: 0
      }
    }
    
    const totalTime = this._operations.reduce(
      (sum, op) => sum + ((op.endTime || op.startTime) - op.startTime),
      0
    )
    
    const highCostOps = this._operations.filter(op => op.cost > 0.6).length
    
    return {
      operationsPerFrame: this._operations.length,
      averageOperationTime: totalTime / this._operations.length,
      highCostOperations: highCostOps,
      memoryUsage: this.estimateMemoryUsage()
    }
  }
  
  private estimateMemoryUsage(): number {
    // Rough estimation based on canvas size and operations
    const canvas = this._context.canvas
    const pixelCount = canvas.width * canvas.height
    const bytesPerPixel = 4 // RGBA
    const baseMemory = (pixelCount * bytesPerPixel) / (1024 * 1024) // MB
    
    return baseMemory
  }
}

// ============================================================================
// Export All Types
// ============================================================================

export type {
  AnyCanvasContext,
  WebGLState,
  ShaderSource,
  CompiledShader,
  ShaderProgramConfig,
  VertexAttributeDescriptor,
  UniformDescriptor,
  Canvas2DOperation,
  CanvasPerformanceMetrics
}
