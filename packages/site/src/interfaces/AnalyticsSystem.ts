/**
 * Privacy-First Analytics System - TypeScript Interfaces
 * Umami Analytics integration with GDPR compliance and granular consent management
 */

// ============================================================================
// Core Analytics Interfaces
// ============================================================================

export interface AnalyticsConfig {
  websiteId: string
  scriptUrl: string
  trackPageViews: boolean
  trackEvents: boolean
  respectDoNotTrack: boolean
  cookieless: boolean
  sessionTimeout: number
  dataRetention: number // days
  anonymizeIp: boolean
  enabled: boolean
}

export interface ConsentPreferences {
  analytics: boolean
  performance: boolean
  marketing: boolean
  functional: boolean
  timestamp: number
  version: string
  userId?: string // Anonymous hash
}

export interface AnalyticsEvent {
  name: string
  data?: Record<string, unknown>
  url?: string
  referrer?: string
  timestamp?: number
  sessionId?: string
  userId?: string // Anonymous hash
}

export interface BackgroundAnalyticsEvent extends AnalyticsEvent {
  moduleId: string
  eventType: 'module_activated' | 'module_deactivated' | 'module_config_changed' | 
            'easter_egg_discovered' | 'easter_egg_progress' | 'performance_issue' |
            'user_interaction' | 'accessibility_feature_used' | 'quality_adjustment'
  performanceMetrics?: {
    fps: number
    memory: number
    renderTime: number
    cpuUsage?: number
  }
  deviceInfo?: {
    isMobile: boolean
    isLowPower: boolean
    webglSupport: boolean
    screenSize: string
  }
}

export interface EasterEggAnalyticsEvent extends AnalyticsEvent {
  eggId: string
  eventType: 'discovered' | 'progress' | 'hint_shown' | 'failed_attempt' | 'shared'
  discoveryTime?: number // ms from first interaction
  attemptsCount?: number
  hintsUsed?: number
  discoveryMethod?: 'sequence' | 'interaction' | 'performance' | 'time' | 'contextual'
  difficulty?: number
  rarity?: 'common' | 'rare' | 'legendary'
}

export interface PerformanceAnalyticsEvent extends AnalyticsEvent {
  eventType: 'fps_drop' | 'memory_spike' | 'quality_adjusted' | 'module_optimized' | 'battery_low'
  beforeMetrics: {
    fps: number
    memory: number
    cpu?: number
    battery?: number
  }
  afterMetrics?: {
    fps: number
    memory: number
    cpu?: number
    battery?: number
  }
  optimization?: {
    action: string
    success: boolean
    impact: number
  }
}

export interface AccessibilityAnalyticsEvent extends AnalyticsEvent {
  eventType: 'screen_reader_detected' | 'high_contrast_enabled' | 'reduced_motion_enabled' | 
            'keyboard_navigation' | 'voice_control_used' | 'accessibility_feature_used'
  feature: string
  enabled: boolean
  userInitiated: boolean
}

export interface SessionData {
  sessionId: string
  startTime: number
  endTime?: number
  duration?: number
  pageViews: number
  events: number
  bounceRate: boolean
  devices: string[]
  referrer?: string
  userAgent: string
  screenResolution: string
  language: string
  timezone: string
}

// ============================================================================
// Consent Management Interfaces
// ============================================================================

export interface ConsentBanner {
  show: boolean
  position: 'top' | 'bottom' | 'center'
  style: 'minimal' | 'detailed' | 'modal'
  language: string
  customText?: {
    title?: string
    description?: string
    acceptAll?: string
    rejectAll?: string
    customize?: string
    save?: string
  }
}

export interface ConsentCategory {
  id: string
  name: string
  description: string
  required: boolean
  enabled: boolean
  cookies: ConsentCookie[]
  purposes: string[]
  retention: string
  dataTypes: string[]
}

export interface ConsentCookie {
  name: string
  provider: string
  purpose: string
  expiry: string
  type: 'functional' | 'analytics' | 'marketing' | 'performance'
}

export interface ConsentValidationResult {
  valid: boolean
  categories: {
    [categoryId: string]: boolean
  }
  timestamp: number
  version: string
  errors?: string[]
}

export interface PrivacySettings {
  anonymizeData: boolean
  encryptData: boolean
  localOnly: boolean
  shareData: boolean
  deleteOnExit: boolean
  retentionPeriod: number // days
  exportData: boolean
  rightToBeForgotten: boolean
}

// ============================================================================
// Dashboard and Reporting Interfaces
// ============================================================================

export interface AnalyticsDashboard {
  enabled: boolean
  publicUrl?: string
  adminUrl?: string
  customDomains?: string[]
  authentication?: {
    required: boolean
    provider: string
    allowedUsers: string[]
  }
}

export interface AnalyticsReport {
  id: string
  name: string
  description: string
  type: 'background_usage' | 'easter_eggs' | 'performance' | 'accessibility' | 'custom'
  timeRange: {
    start: Date
    end: Date
  }
  filters?: {
    modules?: string[]
    devices?: string[]
    countries?: string[]
    referrers?: string[]
  }
  metrics: AnalyticsMetric[]
  generated: Date
  format: 'json' | 'csv' | 'pdf'
}

export interface AnalyticsMetric {
  name: string
  value: number | string
  change?: number // percentage change
  trend?: 'up' | 'down' | 'stable'
  unit?: string
  description?: string
}

// ============================================================================
// Privacy and Compliance Interfaces
// ============================================================================

export interface GDPRCompliance {
  lawfulBasis: 'consent' | 'legitimate_interest' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task'
  dataController: {
    name: string
    contact: string
    address: string
    email: string
    phone?: string
  }
  dataProcessor?: {
    name: string
    contact: string
    country: string
  }
  dataRetention: {
    period: number // days
    purgeSchedule: string // cron format
    anonymization: boolean
  }
  userRights: {
    access: boolean
    rectification: boolean
    erasure: boolean
    portability: boolean
    restriction: boolean
    objection: boolean
  }
}

export interface CCPACompliance {
  businessPurpose: string[]
  commercialPurpose: string[]
  thirdPartySharing: boolean
  saleOfData: boolean
  optOutEnabled: boolean
  categories: {
    personalInfo: string[]
    sensitiveInfo: string[]
    commercialInfo: string[]
    biometricInfo: string[]
    internetActivity: string[]
    geolocationData: string[]
    audioVisual: string[]
    professionalInfo: string[]
    educationInfo: string[]
    inferences: string[]
  }
}

export interface DataProcessingRecord {
  id: string
  timestamp: number
  activity: string
  dataTypes: string[]
  purposes: string[]
  retention: number
  lawfulBasis: string
  consent?: string
  userHash?: string
  location?: string
  encrypted: boolean
  anonymized: boolean
}

// ============================================================================
// Integration and Configuration Interfaces
// ============================================================================

export interface UmamiConfig {
  websiteId: string
  scriptUrl: string
  apiUrl?: string
  apiKey?: string
  trackLocalhost: boolean
  autoTrack: boolean
  domains?: string[]
  ignoredPaths?: string[]
  ignoredEvents?: string[]
  customProperties?: Record<string, string>
  dataAttributes?: Record<string, string>
}

export interface AnalyticsIntegration {
  provider: 'umami' | 'plausible' | 'matomo' | 'google-analytics' | 'custom'
  config: Record<string, unknown>
  enabled: boolean
  fallback?: AnalyticsIntegration
  testMode: boolean
}

export interface AnalyticsMiddleware {
  name: string
  enabled: boolean
  order: number
  transform?: (event: AnalyticsEvent) => AnalyticsEvent | null
  validate?: (event: AnalyticsEvent) => boolean
  enrich?: (event: AnalyticsEvent) => Record<string, unknown>
}

// ============================================================================
// Local Analytics and Offline Support
// ============================================================================

export interface LocalAnalytics {
  enabled: boolean
  storageQuota: number // MB
  syncInterval: number // minutes
  batchSize: number
  compression: boolean
  encryption: boolean
  offlineSupport: boolean
  purgeOldData: boolean
  purgeThreshold: number // days
}

export interface AnalyticsBatch {
  id: string
  events: AnalyticsEvent[]
  timestamp: number
  compressed: boolean
  encrypted: boolean
  retries: number
  lastError?: string
}

export interface AnalyticsQueue {
  add: (event: AnalyticsEvent) => Promise<void>
  flush: () => Promise<void>
  size: () => number
  clear: () => Promise<void>
  pause: () => void
  resume: () => void
}

// ============================================================================
// Testing and Validation Interfaces
// ============================================================================

export interface AnalyticsTest {
  name: string
  description: string
  category: 'tracking' | 'privacy' | 'performance' | 'compliance'
  run: () => Promise<AnalyticsTestResult>
  expectedResult?: unknown
  timeout?: number
}

export interface AnalyticsTestResult {
  success: boolean
  message: string
  data?: unknown
  duration: number
  errors?: string[]
  warnings?: string[]
}

export interface AnalyticsValidation {
  schema: object
  required: string[]
  validate: (data: unknown) => AnalyticsValidationResult
}

export interface AnalyticsValidationResult {
  valid: boolean
  errors: Array<{
    field: string
    message: string
    value?: unknown
  }>
  warnings: Array<{
    field: string
    message: string
    value?: unknown
  }>
}

// ============================================================================
// Performance and Optimization Interfaces
// ============================================================================

export interface AnalyticsPerformance {
  bundleSize: number // bytes
  scriptLoadTime: number // ms
  eventQueueTime: number // ms
  networkLatency: number // ms
  memoryUsage: number // bytes
  cpuUsage: number // percentage
  batterySavingMode: boolean
  performanceBudget: {
    maxBundleSize: number
    maxLoadTime: number
    maxMemoryUsage: number
  }
}

export interface AnalyticsOptimization {
  lazy Loading: boolean
  preconnect: boolean
  prefetch: boolean
  defer: boolean
  compression: boolean
  minification: boolean
  treeshaking: boolean
  codeShplitting: boolean
  serviceWorker: boolean
}

// ============================================================================
// Export Collections for Convenience
// ============================================================================

export type AnalyticsCore = {
  AnalyticsConfig: AnalyticsConfig
  ConsentPreferences: ConsentPreferences
  AnalyticsEvent: AnalyticsEvent
  BackgroundAnalyticsEvent: BackgroundAnalyticsEvent
  EasterEggAnalyticsEvent: EasterEggAnalyticsEvent
  PerformanceAnalyticsEvent: PerformanceAnalyticsEvent
}

export type ConsentManagement = {
  ConsentBanner: ConsentBanner
  ConsentCategory: ConsentCategory
  ConsentCookie: ConsentCookie
  ConsentValidationResult: ConsentValidationResult
  PrivacySettings: PrivacySettings
}

export type Compliance = {
  GDPRCompliance: GDPRCompliance
  CCPACompliance: CCPACompliance
  DataProcessingRecord: DataProcessingRecord
}

export type Integration = {
  UmamiConfig: UmamiConfig
  AnalyticsIntegration: AnalyticsIntegration
  AnalyticsMiddleware: AnalyticsMiddleware
  LocalAnalytics: LocalAnalytics
}