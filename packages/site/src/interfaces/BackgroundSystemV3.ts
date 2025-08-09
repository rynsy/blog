/**
 * Phase 4 Advanced Features - Background System Type Definitions
 * Comprehensive TypeScript interfaces for multi-agent coordination
 * AI-powered Easter Egg Discovery System Integration
 */

// ============================================================================
// Core Background System Interfaces
// ============================================================================

export interface BackgroundModuleV3 {
  // Legacy compatibility
  pause: () => void
  resume: () => void
  destroy: () => void
  onThemeChange?: (theme: 'light' | 'dark') => void
  onResize?: (width: number, height: number) => void
  
  // V3 Enhanced capabilities
  initialize?: (params: ModuleSetupParamsV3) => Promise<void>
  activate?: () => Promise<void>
  deactivate?: () => Promise<void>
  setConfiguration?: (config: ModuleConfiguration) => Promise<void>
  validateConfiguration?: (config: ModuleConfiguration) => ConfigurationValidationResult
  getState?: () => Promise<SerializableState>
  setState?: (state: SerializableState) => Promise<void>
  getPerformanceMetrics?: () => PerformanceMetrics
  handleEasterEggEvent?: (event: EasterEggEvent) => Promise<void>
}

export interface ModuleSetupParamsV3 {
  canvas: HTMLCanvasElement | SVGElement
  width: number
  height: number
  theme: 'light' | 'dark'
  deviceCapabilities: DeviceCapabilities
  performanceHints: PerformanceHints
  layerIndex: number
  resourceManager: ResourceManager
}

export interface ModuleRegistryEntryV3 {
  id: string
  version: string
  name: string
  description: string
  category: ModuleCategory
  capabilities: ModuleCapability[]
  tags: string[]
  
  // Performance characteristics
  memoryBudget: number // MB
  cpuIntensity: 'low' | 'medium' | 'high'
  requiresWebGL: boolean
  preferredCanvas: 'canvas2d' | 'webgl' | 'svg'
  
  // Dependencies and conflicts
  dependencies: string[]
  conflicts: string[]
  
  // Module loading
  load: () => Promise<{ setup: (params: ModuleSetupParamsV3) => BackgroundModuleV3 }>
  
  // Configuration
  configSchema: ConfigurationSchema
  defaultConfig: ModuleConfiguration
  
  // Presentation
  thumbnail?: string
  preview?: string
  
  // Easter egg integration
  easterEggConfig?: EasterEggConfig
}

// ============================================================================
// Easter Egg System Interfaces
// ============================================================================

export interface EasterEgg {
  id: string
  name: string
  description: string
  category: 'sequence' | 'interaction' | 'performance' | 'time' | 'contextual'
  trigger: EasterEggTrigger
  reward: EasterEggReward
  rarity: 'common' | 'rare' | 'legendary'
  hints?: string[]
  requirements?: {
    moduleActive?: string[]
    timeActive?: number // milliseconds
    interactions?: number
    achievements?: string[]
  }
}

export interface EasterEggTrigger {
  type: 'keySequence' | 'clickPattern' | 'timeSpent' | 'performance' | 'contextual'
  condition: unknown // Pattern-specific condition data
  tolerance?: number // 0-1, for pattern matching flexibility
  timeWindow?: number // ms, maximum time for pattern completion
}

export interface EasterEggEvent {
  type: 'keyboard' | 'mouse' | 'touch' | 'scroll' | 'time' | 'performance' | 'module'
  data: unknown
  timestamp: number
  moduleId?: string
  confidence?: number
  metadata?: Record<string, unknown>
}

export interface EasterEggReward {
  type: 'module' | 'configuration' | 'theme' | 'achievement' | 'visual' | 'audio'
  unlock: string // ID of what to unlock
  notification: {
    title: string
    description: string
    icon?: string
    duration?: number
  }
  persistentEffect?: {
    type: 'permanent' | 'session' | 'timed'
    duration?: number // for timed effects
    data?: unknown
  }
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  discovered: boolean
  timestamp: number
  category?: string
  rarity?: 'common' | 'rare' | 'legendary'
  progress?: number // 0-1 for progressive achievements
  metadata?: Record<string, unknown>
}

export interface EasterEggConfig {
  id: string
  difficulty: 1 | 2 | 3 | 4 | 5
  triggers: EasterEggTrigger[]
  reward: EasterEggReward
  discoveryHint?: string
  requirements?: {
    moduleActive: string[]
    timeActive: number
    interactions: number
  }
}

// ============================================================================
// Performance and Device Interfaces
// ============================================================================

export interface PerformanceMetrics {
  fps: number
  frameTime: number // ms
  memoryUsage: number // MB
  renderTime: number // ms per frame
  timestamp: number
  cpuUsage?: number // percentage
  batteryLevel?: number // percentage
  thermalState?: 'nominal' | 'fair' | 'serious' | 'critical'
}

export interface MemoryStats {
  used: number // MB
  allocated: number // MB
  peak: number // MB
  leaks: number // detected memory leaks
}

export interface DeviceCapabilities {
  webgl: boolean
  webgl2: boolean
  canvas2d: boolean
  offscreenCanvas: boolean
  webWorkers: boolean
  sharedArrayBuffer: boolean
  devicePixelRatio: number
  maxTextureSize: number
  maxRenderBufferSize: number
  supportedExtensions: string[]
  preferredColorSpace: 'srgb' | 'p3' | 'rec2020'
  hardwareConcurrency: number
  memoryLimit: number // MB
  isMobile: boolean
  isLowPower: boolean
  supportsVR: boolean
  supportsAR: boolean
}

export interface WebGLCapabilities {
  supported: boolean
  version: string
  extensions: string[]
  maxTextureSize: number
  maxVertexAttributes: number
  maxFragmentUniforms: number
  maxVertexUniforms: number
  maxVaryings: number
  maxCombinedTextureUnits: number
  renderer: string
  vendor: string
}

export interface PerformanceHints {
  targetFPS: number
  maxMemoryMB: number
  preferredQuality: 'low' | 'medium' | 'high'
  enableOptimizations: boolean
  adaptiveQuality: boolean
  batteryAware: boolean
  thermalAware: boolean
}

// ============================================================================
// Configuration and State Management
// ============================================================================

export interface GlobalBackgroundConfiguration {
  maxActiveModules: number
  maxMemoryUsageMB: number
  targetFPS: number
  enablePerformanceMonitoring: boolean
  enableDebugMode: boolean
  enableEasterEggs: boolean
  qualityPresets: {
    low: QualityPreset
    medium: QualityPreset
    high: QualityPreset
  }
  featureFlags: {
    enableWebGL2: boolean
    enableOffscreenCanvas: boolean
    enableWorkerThreads: boolean
    enableExperimentalModules: boolean
  }
}

export interface QualityPreset {
  targetFPS: number
  maxParticles: number
  enableShadows: boolean
  enableAntialiasing: boolean
  textureQuality: 'low' | 'medium' | 'high'
  effectsEnabled: string[]
}

export interface ModuleConfiguration {
  enabled: boolean
  quality: 'low' | 'medium' | 'high'
  [key: string]: unknown // Module-specific configuration
}

export interface ConfigurationSchema {
  [key: string]: {
    type: 'boolean' | 'number' | 'string' | 'array' | 'object'
    default: unknown
    min?: number
    max?: number
    options?: unknown[]
    required?: boolean
    description?: string
  }
}

export interface ConfigurationValidationResult {
  valid: boolean
  errors: Array<{
    field: string
    message: string
    code: string
  }>
  warnings: Array<{
    field: string
    message: string
    code: string
  }>
}

export interface SerializableState {
  [key: string]: unknown
}

// ============================================================================
// URL Parameter System
// ============================================================================

export interface BackgroundUrlParams {
  module?: string
  modules?: string[]
  config?: Record<string, unknown>
  quality?: 'low' | 'medium' | 'high'
  debug?: boolean
  seed?: string
  easter?: string[] // Discovered easter egg IDs for sharing
}

export interface UrlParameterSchema {
  version: string
  parameters: {
    [key: string]: {
      type: 'string' | 'number' | 'boolean' | 'array' | 'object'
      encode: (value: unknown) => string
      decode: (value: string) => unknown
      validate: (value: unknown) => boolean
    }
  }
}

// ============================================================================
// Resource Management
// ============================================================================

export interface ResourceManager {
  loadTexture: (url: string, options?: TextureOptions) => Promise<Texture>
  loadAudio: (url: string, options?: AudioOptions) => Promise<AudioBuffer>
  loadShader: (vertexSource: string, fragmentSource: string) => Promise<ShaderProgram>
  loadModel: (url: string, options?: ModelOptions) => Promise<Model>
  
  // Memory management
  getMemoryUsage: () => MemoryStats
  cleanup: () => void
  preload: (resources: ResourcePreloadSpec[]) => Promise<void>
  
  // Caching
  enableCache: (enabled: boolean) => void
  clearCache: () => void
  getCacheSize: () => number
}

export type AssetType = 'texture' | 'audio' | 'shader' | 'model' | 'json' | 'binary'

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  metadata?: Record<string, unknown>
}

export interface ModuleDependency {
  id: string
  version?: string
  optional: boolean
  reason?: string
}

export interface CanvasRequirements {
  type: 'canvas2d' | 'webgl' | 'webgl2' | 'svg'
  width: number
  height: number
  alpha: boolean
  antialias: boolean
  preserveDrawingBuffer: boolean
  premultipliedAlpha: boolean
  stencil: boolean
  depth: boolean
  failIfMajorPerformanceCaveat: boolean
  desynchronized: boolean
}

export interface CanvasLayer {
  id: string
  canvas: HTMLCanvasElement | SVGElement
  context: RenderingContext | null
  requirements: CanvasRequirements
  zIndex: number
  visible: boolean
  moduleId: string
  created: number
  lastUsed: number
}

// Additional interfaces needed by the discovery system
export interface PatternRecognitionConfig {
  enabled: boolean
  sensitivity: 'low' | 'medium' | 'high'
  adaptiveLearning: boolean
  falsePositiveReduction: boolean
  performanceMode: 'low' | 'medium' | 'high'
  accessibilityMode: boolean
}

export interface DiscoveryProgress {
  easterEggId: string
  progress: number // 0-1
  confidence: number // 0-1
  nearMisses: number
  timeWindow: number // ms
  lastActivity: number // timestamp
  hintsShown: number
}

export interface HintSystem {
  enabled: boolean
  nearMissThreshold: number // 0-1
  maxHints: number
  hintDelay: number // ms between hints
  adaptiveHints: boolean // Hints become more specific over time
  accessibilityHints: boolean // Alternative hints for accessibility
}

// Pattern recognition types
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

export interface TextureOptions {
  generateMipmaps?: boolean
  flipY?: boolean
  format?: 'rgb' | 'rgba' | 'alpha' | 'luminance'
  type?: 'unsigned_byte' | 'float' | 'half_float'
  wrapS?: 'clamp' | 'repeat' | 'mirror'
  wrapT?: 'clamp' | 'repeat' | 'mirror'
  minFilter?: 'nearest' | 'linear' | 'nearest_mipmap_nearest' | 'linear_mipmap_nearest' | 'nearest_mipmap_linear' | 'linear_mipmap_linear'
  magFilter?: 'nearest' | 'linear'
}

export interface AudioOptions {
  loop?: boolean
  volume?: number
  playbackRate?: number
  detune?: number
}

export interface ModelOptions {
  format?: 'gltf' | 'obj' | 'fbx'
  scale?: number
  position?: [number, number, number]
  rotation?: [number, number, number]
}

export interface ResourcePreloadSpec {
  type: 'texture' | 'audio' | 'shader' | 'model'
  url: string
  options?: unknown
  priority?: 'low' | 'medium' | 'high'
}

// ============================================================================
// Utility and Helper Types
// ============================================================================

export enum ModuleCategory {
  VISUAL = 'visualization',
  SIMULATION = 'simulation',
  INTERACTIVE = 'interactive',
  ARTISTIC = 'artistic',
  UTILITY = 'utility',
  EXPERIMENTAL = 'experimental',
  COMMUNITY = 'community',
  EASTER_EGG = 'easter-egg'
}

export enum ModuleCapability {
  WEBGL = 'webgl-rendering',
  CANVAS_2D = 'canvas2d-rendering',
  SVG = 'svg-rendering',
  AUDIO = 'audio-synthesis',
  MOUSE = 'user-interaction',
  KEYBOARD = 'keyboard-interaction',
  TOUCH = 'touch-interaction',
  PERFORMANCE_MONITORING = 'performance-monitoring',
  EASTER_EGG_INTEGRATION = 'easter-egg-integration',
  MULTI_LAYER = 'multi-layer',
  BACKGROUND_PROCESSING = 'background-processing',
  REAL_TIME_COMMUNICATION = 'real-time-communication',
  THEME_AWARE = 'theme-aware',
  REAL_TIME_PHYSICS = 'real-time-physics',
  PHYSICS = 'physics'
}

export type AccessibilityFeature = 
  | 'screen-reader'
  | 'high-contrast'
  | 'reduced-motion'
  | 'keyboard-navigation'
  | 'focus-indicators'
  | 'voice-control'
  | 'motor-impairment'

// ============================================================================
// WebGL and Graphics Types
// ============================================================================

export interface Texture {
  id: string
  width: number
  height: number
  format: string
  type: string
  webglTexture: WebGLTexture
  dispose: () => void
}

export interface ShaderProgram {
  id: string
  program: WebGLProgram
  uniforms: Record<string, WebGLUniformLocation>
  attributes: Record<string, number>
  use: () => void
  dispose: () => void
}

export interface Model {
  id: string
  vertices: Float32Array
  indices?: Uint16Array | Uint32Array
  textures: Texture[]
  materials: Material[]
  dispose: () => void
}

export interface Material {
  id: string
  diffuse: [number, number, number, number]
  specular: [number, number, number]
  shininess: number
  textures: {
    diffuse?: Texture
    normal?: Texture
    specular?: Texture
    emissive?: Texture
  }
}

// ============================================================================
// Analytics and Monitoring
// ============================================================================

export interface AnalyticsEvent {
  type: 'module-switch' | 'easter-egg-discovered' | 'performance-issue' | 'error' | 'user-interaction'
  data: unknown
  timestamp: number
  userId?: string // anonymized
  sessionId: string
  moduleId?: string
  category?: string
}

export interface PerformanceAlert {
  type: 'fps-drop' | 'memory-leak' | 'cpu-spike' | 'battery-drain' | 'thermal-throttle'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  metrics: PerformanceMetrics
  timestamp: number
  moduleId?: string
  actionTaken?: string
}

// ============================================================================
// Multi-Agent Coordination Types
// ============================================================================

export interface CoordinationContext {
  activeAgents: string[]
  currentPhase: string
  dependencies: Record<string, string[]>
  completedTasks: string[]
  blockedTasks: string[]
  performanceImpact: {
    bundleSizeIncrease: number
    memoryIncrease: number
    cpuIncrease: number
  }
}

export interface AgentDeliverable {
  agent: string
  deliverable: string
  status: 'not-started' | 'in-progress' | 'completed' | 'blocked'
  dependencies: string[]
  performanceImpact: number // KB
  accessibilityCompliant: boolean
  estimatedCompletion: Date
}

// ============================================================================
// Easter Egg Discovery Engine Types
// ============================================================================

export interface PatternRecognitionConfig {
  enabled: boolean
  sensitivity: 'low' | 'medium' | 'high'
  adaptiveLearning: boolean
  falsePositiveReduction: boolean
  performanceMode: 'low' | 'medium' | 'high'
  accessibilityMode: boolean
}

export interface DiscoveryProgress {
  easterEggId: string
  progress: number // 0-1
  confidence: number // 0-1
  nearMisses: number
  timeWindow: number // ms
  lastActivity: number // timestamp
  hintsShown: number
}

export interface HintSystem {
  enabled: boolean
  nearMissThreshold: number // 0-1
  maxHints: number
  hintDelay: number // ms between hints
  adaptiveHints: boolean // Hints become more specific over time
  accessibilityHints: boolean // Alternative hints for accessibility
}

// ============================================================================
// Export Collections for Convenience
// ============================================================================

// Core system types
export type BackgroundSystemCore = {
  BackgroundModuleV3: BackgroundModuleV3
  ModuleSetupParamsV3: ModuleSetupParamsV3
  ModuleRegistryEntryV3: ModuleRegistryEntryV3
  GlobalBackgroundConfiguration: GlobalBackgroundConfiguration
  ModuleConfiguration: ModuleConfiguration
}

// Easter egg types
export type EasterEggSystem = {
  EasterEgg: EasterEgg
  EasterEggTrigger: EasterEggTrigger
  EasterEggEvent: EasterEggEvent
  EasterEggReward: EasterEggReward
  Achievement: Achievement
  EasterEggConfig: EasterEggConfig
}

// Performance types
export type PerformanceSystem = {
  PerformanceMetrics: PerformanceMetrics
  MemoryStats: MemoryStats
  DeviceCapabilities: DeviceCapabilities
  PerformanceHints: PerformanceHints
  PerformanceAlert: PerformanceAlert
}

// Configuration types
export type ConfigurationSystem = {
  ConfigurationSchema: ConfigurationSchema
  ConfigurationValidationResult: ConfigurationValidationResult
  QualityPreset: QualityPreset
  SerializableState: SerializableState
}
