/**
 * TypeScript Utility Types for Background System V3
 * 
 * This file contains utility types, type guards, and branded types
 * to enhance type safety across the interactive background system.
 */

import {
  DeviceCapabilities,
  ModuleConfiguration,
  PerformanceMetrics,
  ValidationResult,
  CanvasRequirements,
  BackgroundModuleV3,
  ModuleRegistryEntryV3
} from '@/interfaces/BackgroundSystemV3'

// ============================================================================
// Branded Types for Domain Safety
// ============================================================================

// Module ID brand to prevent string confusion
export type ModuleId = string & { readonly __brand: 'ModuleId' }
export const createModuleId = (id: string): ModuleId => id as ModuleId

// Canvas ID brand for layer management
export type CanvasId = string & { readonly __brand: 'CanvasId' }
export const createCanvasId = (id: string): CanvasId => id as CanvasId

// Performance timestamp brand
export type PerformanceTimestamp = number & { readonly __brand: 'PerformanceTimestamp' }
export const createPerformanceTimestamp = (time: number): PerformanceTimestamp => 
  time as PerformanceTimestamp

// Memory size in MB brand
export type MemoryMB = number & { readonly __brand: 'MemoryMB' }
export const createMemoryMB = (mb: number): MemoryMB => mb as MemoryMB

// ============================================================================
// Configuration Validation Types
// ============================================================================

// Strict configuration with required and optional fields
export type StrictModuleConfiguration<T extends Record<string, unknown> = {}> = 
  ModuleConfiguration & T & {
    readonly enabled: boolean
    readonly quality: 'low' | 'medium' | 'high'
  }

// Configuration update type with partial override
export type ConfigurationUpdate<T extends ModuleConfiguration> = 
  Partial<Omit<T, 'enabled'>> & {
    enabled?: boolean
  }

// Device capability requirements type
export type DeviceRequirements = {
  readonly [K in keyof DeviceCapabilities]?: DeviceCapabilities[K] extends boolean 
    ? boolean
    : DeviceCapabilities[K] extends number
    ? { min?: number; max?: number; preferred?: number }
    : DeviceCapabilities[K]
}

// ============================================================================
// WebGL Context Types
// ============================================================================

// Strict WebGL context wrapper
export interface StrictWebGLContext {
  readonly context: WebGLRenderingContext | WebGL2RenderingContext
  readonly version: '1' | '2'
  readonly capabilities: WebGLCapabilities
  readonly isLost: boolean
}

export interface WebGLCapabilities {
  readonly maxTextureSize: number
  readonly maxViewportDims: readonly [number, number]
  readonly maxVertexAttribs: number
  readonly maxVaryingVectors: number
  readonly maxFragmentUniforms: number
  readonly extensions: readonly string[]
  readonly floatTextures: boolean
  readonly anisotropicFiltering: boolean
}

// Canvas context union with strict typing
export type CanvasContext = 
  | { type: 'canvas2d'; context: CanvasRenderingContext2D }
  | { type: 'webgl'; context: StrictWebGLContext }
  | { type: 'webgl2'; context: StrictWebGLContext }

// ============================================================================
// Performance Monitoring Types
// ============================================================================

// Performance metrics with computed values
export interface EnhancedPerformanceMetrics extends PerformanceMetrics {
  readonly computedFPS: number
  readonly averageFrameTime: number
  readonly memoryEfficiency: number // MB per FPS
  readonly performanceScore: number // 0-100 overall score
  readonly recommendations: readonly PerformanceRecommendation[]
}

export interface PerformanceRecommendation {
  readonly type: 'quality' | 'memory' | 'cpu' | 'gpu'
  readonly severity: 'info' | 'warning' | 'critical'
  readonly message: string
  readonly action?: PerformanceAction
}

export interface PerformanceAction {
  readonly type: 'reduce_quality' | 'limit_nodes' | 'disable_effects' | 'switch_renderer'
  readonly parameters: Record<string, unknown>
}

// ============================================================================
// Module Lifecycle Types
// ============================================================================

// Module state machine types
export type ModuleState = 
  | 'uninitialized'
  | 'loading'
  | 'ready'
  | 'active'
  | 'paused'
  | 'error'
  | 'destroyed'

export interface ModuleLifecycleInfo {
  readonly moduleId: ModuleId
  readonly currentState: ModuleState
  readonly previousState: ModuleState | null
  readonly stateChangeTimestamp: PerformanceTimestamp
  readonly errorInfo?: ModuleError
}

export interface ModuleError {
  readonly code: string
  readonly message: string
  readonly stack?: string
  readonly recoverable: boolean
  readonly timestamp: PerformanceTimestamp
}

// ============================================================================
// Canvas Layer Management Types
// ============================================================================

export interface LayerConfiguration {
  readonly id: CanvasId
  readonly zIndex: number
  readonly interactive: boolean
  readonly alpha: boolean
  readonly size: {
    readonly width: number
    readonly height: number
  }
  readonly position: {
    readonly x: number
    readonly y: number
  }
  readonly clipPath?: string
  readonly filters?: readonly CSSFilter[]
}

export interface CSSFilter {
  readonly type: 'blur' | 'brightness' | 'contrast' | 'saturate' | 'opacity'
  readonly value: string
}

// Canvas pool management
export interface CanvasPool {
  readonly available: readonly HTMLCanvasElement[]
  readonly inUse: ReadonlyMap<CanvasId, HTMLCanvasElement>
  readonly maxSize: number
  readonly currentSize: number
}

// ============================================================================
// Event System Types
// ============================================================================

// Strict event types for module communication
export interface ModuleEventMap {
  'state-change': ModuleLifecycleInfo
  'performance-update': EnhancedPerformanceMetrics
  'error': ModuleError
  'config-change': { moduleId: ModuleId; config: ModuleConfiguration }
  'resource-allocated': { moduleId: ModuleId; resource: string; size: MemoryMB }
  'resource-released': { moduleId: ModuleId; resource: string }
}

export type ModuleEventHandler<T extends keyof ModuleEventMap> = 
  (event: ModuleEventMap[T]) => void | Promise<void>

// ============================================================================
// Build-time Configuration Types
// ============================================================================

// Bundle splitting configuration
export interface BundleSplitConfig {
  readonly chunks: {
    readonly core: readonly string[]
    readonly modules: readonly string[]
    readonly utils: readonly string[]
    readonly vendor: readonly string[]
  }
  readonly maxSize: {
    readonly js: MemoryMB
    readonly css: MemoryMB
  }
  readonly preload: readonly string[]
}

// Development-only types
export interface DevModeConfig {
  readonly enableHMR: boolean
  readonly showPerformanceOverlay: boolean
  readonly enableDebugMode: boolean
  readonly mockSlowNetwork: boolean
  readonly logLevel: 'error' | 'warn' | 'info' | 'debug'
}

// ============================================================================
// Type Guards
// ============================================================================

// Type guard for WebGL context
export const isWebGLContext = (
  context: CanvasRenderingContext2D | WebGLRenderingContext | WebGL2RenderingContext | null
): context is WebGLRenderingContext | WebGL2RenderingContext => {
  return context !== null && 'drawArrays' in context
}

// Type guard for WebGL2 context
export const isWebGL2Context = (
  context: WebGLRenderingContext | WebGL2RenderingContext
): context is WebGL2RenderingContext => {
  return 'texStorage2D' in context
}

// Type guard for V3 module
export const isModuleV3 = (module: unknown): module is BackgroundModuleV3 => {
  return (
    typeof module === 'object' &&
    module !== null &&
    'initialize' in module &&
    'activate' in module &&
    'deactivate' in module &&
    typeof (module as BackgroundModuleV3).initialize === 'function' &&
    typeof (module as BackgroundModuleV3).activate === 'function' &&
    typeof (module as BackgroundModuleV3).deactivate === 'function'
  )
}

// Type guard for valid configuration
export const isValidConfiguration = (
  config: unknown
): config is ModuleConfiguration => {
  return (
    typeof config === 'object' &&
    config !== null &&
    'enabled' in config &&
    'quality' in config &&
    typeof (config as ModuleConfiguration).enabled === 'boolean' &&
    ['low', 'medium', 'high'].includes((config as ModuleConfiguration).quality)
  )
}

// Type guard for performance metrics
export const isValidPerformanceMetrics = (
  metrics: unknown
): metrics is PerformanceMetrics => {
  return (
    typeof metrics === 'object' &&
    metrics !== null &&
    'fps' in metrics &&
    'frameTime' in metrics &&
    'memoryUsage' in metrics &&
    'renderTime' in metrics &&
    'timestamp' in metrics &&
    typeof (metrics as PerformanceMetrics).fps === 'number' &&
    typeof (metrics as PerformanceMetrics).frameTime === 'number' &&
    typeof (metrics as PerformanceMetrics).memoryUsage === 'number' &&
    typeof (metrics as PerformanceMetrics).renderTime === 'number' &&
    typeof (metrics as PerformanceMetrics).timestamp === 'number'
  )
}

// Type guard for device capabilities
export const hasWebGLSupport = (
  capabilities: DeviceCapabilities
): capabilities is DeviceCapabilities & { webgl: true } => {
  return capabilities.webgl === true
}

export const hasWebGL2Support = (
  capabilities: DeviceCapabilities
): capabilities is DeviceCapabilities & { webgl2: true } => {
  return capabilities.webgl2 === true
}

// ============================================================================
// Assertion Helpers
// ============================================================================

// Assert module ID is valid
export const assertValidModuleId = (id: unknown): asserts id is ModuleId => {
  if (typeof id !== 'string' || id.length === 0) {
    throw new Error(`Invalid module ID: ${id}`)
  }
}

// Assert canvas context is available
export const assertCanvasContext = <T extends RenderingContext>(
  context: T | null
): asserts context is T => {
  if (!context) {
    throw new Error('Canvas context is not available')
  }
}

// Assert WebGL capabilities
export const assertWebGLCapabilities = (
  capabilities: DeviceCapabilities
): asserts capabilities is DeviceCapabilities & { webgl: true } => {
  if (!capabilities.webgl) {
    throw new Error('WebGL is not supported on this device')
  }
}

// ============================================================================
// Utility Functions for Type Safety
// ============================================================================

// Safe property access with type narrowing
export const safeGet = <T, K extends keyof T>(
  obj: T | null | undefined,
  key: K
): T[K] | undefined => {
  return obj?.[key]
}

// Type-safe object merge
export const safeMerge = <T extends Record<string, unknown>>(
  target: T,
  ...sources: Array<Partial<T>>
): T => {
  const result = { ...target }
  
  for (const source of sources) {
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const value = source[key]
        if (value !== undefined) {
          result[key] = value as T[typeof key]
        }
      }
    }
  }
  
  return result
}

// Type-safe configuration validation
export const validateAndTransformConfig = <T extends ModuleConfiguration>(
  config: unknown,
  validator: (config: unknown) => config is T
): ValidationResult & { config?: T } => {
  if (!validator(config)) {
    return {
      valid: false,
      errors: [{
        path: 'root',
        message: 'Invalid configuration object',
        code: 'INVALID_CONFIG',
        severity: 'error' as const
      }],
      warnings: []
    }
  }
  
  return {
    valid: true,
    errors: [],
    warnings: [],
    config
  }
}

// ============================================================================
// Conditional Types for Advanced Patterns
// ============================================================================

// Extract methods from a module interface
export type ModuleMethods<T> = {
  [K in keyof T]: T[K] extends Function ? T[K] : never
}

// Extract async methods
export type AsyncModuleMethods<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => Promise<any> ? T[K] : never
}

// Configuration keys that are required vs optional
export type RequiredConfigKeys<T extends ModuleConfiguration> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K
}[keyof T]

export type OptionalConfigKeys<T extends ModuleConfiguration> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never
}[keyof T]

// Deep readonly type
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

// Mutable version of readonly type
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P]
}

// ============================================================================
// Template Literal Types
// ============================================================================

// Module ID pattern validation
export type ModuleIdPattern = `${string}/${string}` | `${string}-${string}`

// Canvas layer ID pattern
export type LayerIdPattern = `layer-${string}`

// Event type pattern
export type EventTypePattern = `${string}:${string}`

// ============================================================================
// Recursive Types for Configuration
// ============================================================================

// Nested configuration type
export type NestedConfig<T> = {
  [K in keyof T]: T[K] extends object 
    ? NestedConfig<T[K]> 
    : T[K]
}

// Configuration diff type
export type ConfigDiff<T extends ModuleConfiguration> = {
  added: Partial<T>
  removed: Array<keyof T>
  changed: Partial<T>
}

// ============================================================================
// Export All Types for Easy Import
// ============================================================================

export type {
  DeviceCapabilities,
  ModuleConfiguration,
  PerformanceMetrics,
  ValidationResult,
  CanvasRequirements,
  BackgroundModuleV3,
  ModuleRegistryEntryV3
}
