/**
 * Browser API Type Extensions
 * Proper types for browser APIs that aren't fully typed in TypeScript
 */

// Performance Memory API
export interface PerformanceMemory {
  readonly usedJSHeapSize: number
  readonly totalJSHeapSize: number
  readonly jsHeapSizeLimit: number
}

export interface ExtendedPerformance extends Performance {
  readonly memory?: PerformanceMemory
}

// Battery API
export interface BatteryManager extends EventTarget {
  readonly charging: boolean
  readonly chargingTime: number
  readonly dischargingTime: number
  readonly level: number
  addEventListener(type: 'chargingchange' | 'chargingtimechange' | 'dischargingtimechange' | 'levelchange', listener: EventListener): void
}

export interface ExtendedNavigator extends Navigator {
  getBattery?(): Promise<BatteryManager>
  connection?: NetworkInformation
  mozConnection?: NetworkInformation
  webkitConnection?: NetworkInformation
}

// Network Information API
export interface NetworkInformation extends EventTarget {
  readonly downlink: number
  readonly effectiveType: '2g' | '3g' | '4g' | 'slow-2g'
  readonly rtt: number
  readonly saveData: boolean
  readonly type: 'bluetooth' | 'cellular' | 'ethernet' | 'none' | 'wifi' | 'wimax' | 'other' | 'unknown'
}

// Module Configuration Types
export interface ModuleConfigurationData {
  nodes?: number
  animationSpeed?: number
  particleCount?: number
  [key: string]: unknown
}

export interface SavedStateData {
  viewTransform?: {
    x: number
    y: number
    k: number
  }
  [key: string]: unknown
}

// Event Data Types
export interface KeyboardEventData {
  key: string
  timestamp: number
}

export interface MouseEventData {
  x: number
  y: number
  timestamp: number
}

export interface PatternEventData {
  pattern?: string
  sequence?: string[]
  points?: Array<{ x: number; y: number }>
  [key: string]: unknown
}

// New Relic API
export interface NewRelicAPI {
  addPageAction(name: string, attributes?: Record<string, unknown>): void
  setCustomAttribute(name: string, value: string | number | boolean): void
  recordMetric(name: string, value: number): void
  finished(timestamp?: number): void
}

export interface ExtendedWindow extends Window {
  newrelic?: NewRelicAPI
  NREUM?: unknown
}

// Select element types
export type TimeRangeValue = '1h' | '6h' | '24h' | '7d' | '30d'

// Thermal state types
export type ThermalState = 'nominal' | 'fair' | 'serious' | 'critical'