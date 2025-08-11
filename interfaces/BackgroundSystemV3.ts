/**
 * Phase 3 Interactive Background System - Core Interface Definitions
 * 
 * This file contains all the TypeScript interfaces and types for the enhanced
 * background system architecture, serving as the contract between components.
 */

import { JSONSchema7 } from 'json-schema'

// ============================================================================
// Core Module Interfaces
// ============================================================================

export interface ModuleSetupParamsV3 {
  canvas: HTMLCanvasElement | OffscreenCanvas
  width: number
  height: number
  theme: 'light' | 'dark'
  deviceCapabilities: DeviceCapabilities
  performanceHints: PerformanceHints
  layerIndex: number
  resourceManager: ResourceManager
}

export interface BackgroundModuleV3 extends BackgroundModule {
  // Enhanced lifecycle
  initialize(params: ModuleSetupParamsV3): Promise<void>
  preload(): Promise<void>
  activate(): Promise<void>
  deactivate(): Promise<void>
  
  // Resource management
  getMemoryUsage(): MemoryStats
  getPerformanceMetrics(): PerformanceMetrics
  
  // Configuration
  getConfiguration(): ModuleConfiguration
  setConfiguration(config: Partial<ModuleConfiguration>): Promise<void>
  validateConfiguration(config: unknown): ValidationResult
  
  // Multi-canvas support
  getCanvasRequirements(): CanvasRequirements
  
  // Module communication
  onMessage(message: ModuleMessage): Promise<ModuleResponse>
  sendMessage(targetModule: string, message: ModuleMessage): Promise<ModuleResponse>
  
  // URL parameter support
  serializeState(): SerializableState
  deserializeState(state: SerializableState): Promise<void>
}

export interface ModuleRegistryEntryV3 {
  readonly id: string
  readonly version: string
  readonly name: string
  readonly description: string
  readonly category: ModuleCategory
  readonly capabilities: ModuleCapability[]
  readonly tags: string[]
  
  // Resource requirements
  readonly memoryBudget: number // in MB
  readonly cpuIntensity: 'low' | 'medium' | 'high'
  readonly requiresWebGL: boolean
  readonly preferredCanvas: 'canvas2d' | 'webgl' | 'webgl2'
  
  // Dependencies
  readonly dependencies: ModuleDependency[]
  readonly conflicts: string[] // Module IDs that conflict
  
  // Loading
  load(): Promise<ModuleExport>
  fallback?: () => Promise<ModuleExport>
  preload?: () => Promise<void>
  
  // Configuration
  configSchema: JSONSchema7
  defaultConfig: ModuleConfiguration
  
  // Preview
  thumbnail?: string // Base64 or URL
  previewVideo?: string // URL to preview video
}

// ============================================================================
// Performance & Device Capabilities
// ============================================================================

export interface DeviceCapabilities {
  webgl: boolean
  webgl2: boolean
  offscreenCanvas: boolean
  deviceMemory: number // GB
  hardwareConcurrency: number
  isMobile: boolean
  isLowEnd: boolean
  supportedFormats: {
    webp: boolean
    avif: boolean
    webgl: WebGLCapabilities
  }
  networkSpeed: 'slow' | 'medium' | 'fast'
  batteryLevel?: number
  isCharging?: boolean
}

export interface WebGLCapabilities {
  maxTextureSize: number
  maxViewportDims: [number, number]
  maxVertexAttribs: number
  maxVaryingVectors: number
  maxFragmentUniforms: number
  extensions: string[]
}

export interface PerformanceHints {
  targetFPS: number
  maxMemoryMB: number
  preferredQuality: 'low' | 'medium' | 'high'
  enableOptimizations: boolean
  adaptiveQuality: boolean
}

export interface PerformanceMetrics {
  fps: number
  frameTime: number // ms
  memoryUsage: number // MB
  nodeCount?: number
  renderTime: number // ms
  cpuUsage?: number // percentage
  timestamp: number
}

export interface MemoryStats {
  used: number // MB
  allocated: number // MB
  peak: number // MB
  leaks: number // count of potential leaks
}

// ============================================================================
// Canvas & Rendering
// ============================================================================

export interface CanvasRequirements {
  dedicated: boolean // Needs its own canvas
  interactive: boolean // Receives mouse/touch events  
  zIndex: number // Layer priority
  alpha: boolean // Needs alpha channel
  preserveDrawingBuffer: boolean
  contextType: 'canvas2d' | 'webgl' | 'webgl2'
  contextAttributes?: WebGLContextAttributes
  size?: {
    width: number
    height: number
    maintainAspectRatio: boolean
  }
}

export interface CanvasLayer {
  id: string
  canvas: HTMLCanvasElement
  zIndex: number
  visible: boolean
  interactive: boolean
  moduleId?: string
}

export interface RenderData {
  timestamp: number
  deltaTime: number
  theme: 'light' | 'dark'
  dimensions: { width: number; height: number }
  transform: ViewTransform
}

export interface ViewTransform {
  x: number
  y: number
  scale: number
  rotation?: number
}

// ============================================================================
// Module Configuration & State
// ============================================================================

export interface ModuleConfiguration {
  [key: string]: unknown
  enabled: boolean
  quality: 'low' | 'medium' | 'high'
  colors?: string[]
  animationSpeed?: number
  physics?: PhysicsConfiguration
  interactions?: InteractionConfiguration
}

export interface PhysicsConfiguration {
  enabled: boolean
  gravity: number
  damping: number
  collisionDetection: boolean
  forces: {
    attraction: number
    repulsion: number
    centering: number
  }
}

export interface InteractionConfiguration {
  enableDrag: boolean
  enableClick: boolean
  enableHover: boolean
  enableKeyboard: boolean
  clickToCreate: boolean
  doubleClickAction?: 'delete' | 'edit' | 'clone'
  keyboardShortcuts: Record<string, string>
}

export interface SerializableState {
  version: number
  moduleId: string
  config: ModuleConfiguration
  data?: unknown
  timestamp: number
}

// ============================================================================
// URL Parameter System
// ============================================================================

export interface BackgroundUrlParams {
  // Module selection
  bg?: string // module ID
  stack?: string // comma-separated module IDs for multi-module
  
  // Configuration
  config?: string // base64 encoded JSON configuration
  
  // Interactive graph specific
  nodes?: number
  connections?: 'sparse' | 'medium' | 'dense'
  physics?: 'low' | 'medium' | 'high'
  
  // Visual parameters
  theme?: 'light' | 'dark' | 'auto'
  colors?: string // comma-separated hex colors
  
  // Performance
  quality?: 'low' | 'medium' | 'high'
  fps?: number
  
  // Easter eggs
  unlocked?: string // comma-separated achievement IDs
}

export interface UrlParameterSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'array'
    required?: boolean
    default?: unknown
    validate?: (value: unknown) => boolean
    transform?: (value: string) => unknown
  }
}

// ============================================================================
// Module Communication
// ============================================================================

export interface ModuleMessage<T = unknown> {
  id: string
  sourceModule: string
  targetModule: string
  type: string
  payload: T
  timestamp: number
  requiresResponse?: boolean
}

export interface ModuleResponse<T = unknown> {
  messageId: string
  success: boolean
  payload?: T
  error?: string
  timestamp: number
}

export interface ModuleEvent {
  type: string
  moduleId: string
  data?: unknown
  timestamp: number
}

// ============================================================================
// Module Categories & Capabilities
// ============================================================================

export enum ModuleCategory {
  VISUAL = 'visual',
  INTERACTIVE = 'interactive',
  GENERATIVE = 'generative',
  PHYSICS = 'physics',
  UTILITY = 'utility',
  EXPERIMENTAL = 'experimental'
}

export enum ModuleCapability {
  // Rendering
  CANVAS_2D = 'canvas2d',
  WEBGL = 'webgl',
  WEBGL2 = 'webgl2',
  OFFSCREEN = 'offscreen',
  
  // Interaction
  MOUSE = 'mouse',
  TOUCH = 'touch',
  KEYBOARD = 'keyboard',
  GAMEPAD = 'gamepad',
  
  // Features
  MULTI_LAYER = 'multiLayer',
  AUDIO = 'audio',
  NETWORK = 'network',
  STORAGE = 'storage',
  CAMERA = 'camera',
  
  // Performance
  GPU_ACCELERATED = 'gpuAccelerated',
  WORKER_THREAD = 'workerThread',
  WASM = 'wasm'
}

// ============================================================================
// Resource Management
// ============================================================================

export interface ResourceManager {
  // Memory management
  allocateMemory(sizeInMB: number): Promise<ArrayBuffer>
  releaseMemory(buffer: ArrayBuffer): void
  getMemoryUsage(): MemoryStats
  
  // Asset loading
  loadAsset<T>(url: string, type: AssetType): Promise<T>
  cacheAsset<T>(key: string, asset: T): void
  releaseAsset(key: string): void
  
  // Performance monitoring
  startProfiling(moduleId: string): void
  endProfiling(moduleId: string): PerformanceMetrics
  
  // Cleanup
  cleanup(): void
}

export enum AssetType {
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  JSON = 'json',
  TEXT = 'text',
  SHADER = 'shader',
  MODEL = 'model'
}

// ============================================================================
// Easter Egg System
// ============================================================================

export interface EasterEgg {
  id: string
  name: string
  description: string
  category: 'interaction' | 'sequence' | 'time' | 'configuration'
  trigger: EasterEggTrigger
  reward: EasterEggReward
  rarity: 'common' | 'rare' | 'legendary'
  hints?: string[]
}

export interface EasterEggTrigger {
  type: 'keySequence' | 'clickPattern' | 'timeSpent' | 'configMatch' | 'performance'
  condition: unknown
  timeout?: number // ms
}

export interface EasterEggReward {
  type: 'module' | 'theme' | 'configuration' | 'achievement'
  unlock: unknown
  notification: {
    title: string
    description: string
    icon?: string
    sound?: string
  }
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  discovered: boolean
  timestamp?: number
  shareUrl?: string
}

// ============================================================================
// Error Handling & Validation
// ============================================================================

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  path: string
  message: string
  code: string
  severity: 'error' | 'warning'
}

export interface ValidationWarning {
  path: string
  message: string
  suggestion?: string
}

export interface ModuleDependency {
  moduleId: string
  version: string
  optional: boolean
  reason: string
}

// ============================================================================
// Global Configuration
// ============================================================================

export interface GlobalBackgroundConfiguration {
  maxActiveModules: number
  maxMemoryUsageMB: number
  targetFPS: number
  enablePerformanceMonitoring: boolean
  enableDebugMode: boolean
  enableEasterEggs: boolean
  
  // Quality presets
  qualityPresets: {
    low: QualityPreset
    medium: QualityPreset
    high: QualityPreset
  }
  
  // Feature flags
  featureFlags: Record<string, boolean>
}

export interface QualityPreset {
  targetFPS: number
  maxParticles: number
  enableShadows: boolean
  enableAntialiasing: boolean
  textureQuality: 'low' | 'medium' | 'high'
  effectsEnabled: string[]
}

// ============================================================================
// Legacy Compatibility
// ============================================================================

// Re-export existing interfaces for backward compatibility
export interface ModuleSetupParams {
  canvas: HTMLCanvasElement | SVGElement
  width: number
  height: number
  theme: 'light' | 'dark'
}

export interface BackgroundModule {
  pause(): void
  resume(): void
  destroy(): void
  onThemeChange?(theme: 'light' | 'dark'): void
  onResize?(width: number, height: number): void
}

export interface ModuleExport {
  setup: (params: ModuleSetupParams | ModuleSetupParamsV3) => BackgroundModule | BackgroundModuleV3
}