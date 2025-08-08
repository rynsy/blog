/**
 * URL Parameter System Implementation Example
 * 
 * This demonstrates how to implement shareable configuration URLs,
 * deep linking, and parameter validation for the background system.
 */

import { 
  BackgroundUrlParams, 
  UrlParameterSchema, 
  ModuleConfiguration,
  SerializableState,
  ValidationResult 
} from '../interfaces/BackgroundSystemV3'

// ============================================================================
// URL Parameter Manager
// ============================================================================

export class UrlParameterManager {
  private parameterSchema: UrlParameterSchema
  private compressionEnabled: boolean = true
  private maxUrlLength: number = 2048 // Browser URL length limit

  constructor() {
    this.parameterSchema = this.createParameterSchema()
  }

  // ============================================================================
  // Parameter Schema Definition
  // ============================================================================

  private createParameterSchema(): UrlParameterSchema {
    return {
      // Module selection
      bg: {
        type: 'string',
        required: false,
        validate: (value) => typeof value === 'string' && value.length > 0
      },
      
      stack: {
        type: 'array',
        required: false,
        transform: (value) => value.split(',').filter(v => v.length > 0),
        validate: (value) => Array.isArray(value) && value.length <= 5 // Max 5 modules
      },

      // Configuration
      config: {
        type: 'string',
        required: false,
        validate: (value) => this.validateBase64Config(value as string)
      },

      // Interactive graph specific
      nodes: {
        type: 'number',
        required: false,
        default: 20,
        validate: (value) => typeof value === 'number' && value >= 5 && value <= 200
      },

      connections: {
        type: 'string',
        required: false,
        default: 'medium',
        validate: (value) => ['sparse', 'medium', 'dense'].includes(value as string)
      },

      physics: {
        type: 'string',
        required: false,
        default: 'medium',
        validate: (value) => ['low', 'medium', 'high'].includes(value as string)
      },

      // Visual parameters
      theme: {
        type: 'string',
        required: false,
        default: 'auto',
        validate: (value) => ['light', 'dark', 'auto'].includes(value as string)
      },

      colors: {
        type: 'array',
        required: false,
        transform: (value) => value.split(',').map(c => c.trim()),
        validate: (value) => this.validateColorArray(value as string[])
      },

      // Performance
      quality: {
        type: 'string',
        required: false,
        default: 'medium',
        validate: (value) => ['low', 'medium', 'high'].includes(value as string)
      },

      fps: {
        type: 'number',
        required: false,
        default: 60,
        validate: (value) => typeof value === 'number' && value >= 15 && value <= 120
      },

      // Easter eggs
      unlocked: {
        type: 'array',
        required: false,
        transform: (value) => value.split(',').filter(v => v.length > 0),
        validate: (value) => Array.isArray(value) && value.length <= 50
      }
    }
  }

  // ============================================================================
  // URL Parsing and Validation
  // ============================================================================

  parseFromUrl(url?: string): { params: BackgroundUrlParams; errors: string[] } {
    const urlObj = new URL(url || window.location.href)
    const searchParams = urlObj.searchParams
    const errors: string[] = []
    const params: BackgroundUrlParams = {}

    // Parse each parameter according to schema
    for (const [key, schema] of Object.entries(this.parameterSchema)) {
      const rawValue = searchParams.get(key)
      
      if (rawValue === null) {
        // Use default if available
        if (schema.default !== undefined) {
          params[key as keyof BackgroundUrlParams] = schema.default
        }
        continue
      }

      try {
        // Transform the value
        let value: any = rawValue
        if (schema.transform) {
          value = schema.transform(rawValue)
        } else if (schema.type === 'number') {
          value = parseFloat(rawValue)
          if (isNaN(value)) {
            throw new Error(`Invalid number: ${rawValue}`)
          }
        } else if (schema.type === 'boolean') {
          value = rawValue === 'true' || rawValue === '1'
        }

        // Validate the transformed value
        if (schema.validate && !schema.validate(value)) {
          errors.push(`Invalid value for parameter '${key}': ${rawValue}`)
          continue
        }

        params[key as keyof BackgroundUrlParams] = value
      } catch (error) {
        errors.push(`Error parsing parameter '${key}': ${error.message}`)
      }
    }

    return { params, errors }
  }

  // ============================================================================
  // URL Generation
  // ============================================================================

  updateUrl(params: Partial<BackgroundUrlParams>, options: UpdateUrlOptions = {}): void {
    const { replace = false, silent = false, baseUrl } = options
    
    const url = new URL(baseUrl || window.location.href)
    
    // Clear existing background-related parameters
    for (const key of Object.keys(this.parameterSchema)) {
      url.searchParams.delete(key)
    }

    // Set new parameters
    const serializedParams = this.serializeParams(params)
    for (const [key, value] of serializedParams.entries()) {
      url.searchParams.set(key, value)
    }

    // Check URL length
    if (url.toString().length > this.maxUrlLength) {
      console.warn('Generated URL exceeds maximum length, attempting compression...')
      
      // Try to compress the configuration
      if (params.config) {
        const compressedConfig = this.compressConfig(params.config)
        url.searchParams.set('config', compressedConfig)
      }

      // If still too long, warn user
      if (url.toString().length > this.maxUrlLength) {
        console.warn('URL still too long after compression. Some browsers may not support this URL.')
      }
    }

    // Update browser history
    if (!silent) {
      if (replace) {
        window.history.replaceState({}, '', url.toString())
      } else {
        window.history.pushState({}, '', url.toString())
      }
      
      // Emit custom event for listeners
      window.dispatchEvent(new CustomEvent('background-url-updated', {
        detail: { url: url.toString(), params }
      }))
    }
  }

  generateShareableUrl(configuration: BackgroundConfiguration, options: ShareUrlOptions = {}): string {
    const { 
      baseUrl = window.location.origin + window.location.pathname,
      includeTheme = true,
      includePerformance = false,
      compress = true 
    } = options

    const params: BackgroundUrlParams = {
      bg: configuration.moduleId
    }

    // Add theme if requested
    if (includeTheme && configuration.theme !== 'auto') {
      params.theme = configuration.theme
    }

    // Add performance settings if requested
    if (includePerformance) {
      params.quality = configuration.quality || 'medium'
      params.fps = configuration.fps || 60
    }

    // Handle module-specific parameters
    if (configuration.moduleId === 'knowledge') {
      const graphConfig = configuration.config as GraphModuleConfiguration
      if (graphConfig) {
        params.nodes = graphConfig.nodeCount
        params.connections = graphConfig.connectionDensity
        params.physics = graphConfig.physicsIntensity
        
        if (graphConfig.customColors && graphConfig.customColors.length > 0) {
          params.colors = graphConfig.customColors.join(',')
        }
      }
    }

    // Serialize complex configuration
    if (configuration.config && Object.keys(configuration.config).length > 0) {
      const configString = JSON.stringify(configuration.config)
      params.config = compress ? this.compressConfig(configString) : btoa(configString)
    }

    // Build URL
    const url = new URL(baseUrl)
    const serializedParams = this.serializeParams(params)
    
    for (const [key, value] of serializedParams.entries()) {
      url.searchParams.set(key, value)
    }

    return url.toString()
  }

  // ============================================================================
  // Configuration Serialization
  // ============================================================================

  private serializeParams(params: Partial<BackgroundUrlParams>): URLSearchParams {
    const searchParams = new URLSearchParams()

    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue

      const schema = this.parameterSchema[key]
      if (!schema) continue

      if (schema.type === 'array' && Array.isArray(value)) {
        searchParams.set(key, value.join(','))
      } else {
        searchParams.set(key, String(value))
      }
    }

    return searchParams
  }

  serializeModuleState(state: SerializableState): string {
    try {
      const compressed = this.compressConfig(JSON.stringify(state))
      return compressed
    } catch (error) {
      console.error('Failed to serialize module state:', error)
      return ''
    }
  }

  deserializeModuleState(serialized: string): SerializableState | null {
    try {
      const decompressed = this.decompressConfig(serialized)
      return JSON.parse(decompressed)
    } catch (error) {
      console.error('Failed to deserialize module state:', error)
      return null
    }
  }

  // ============================================================================
  // Configuration Compression
  // ============================================================================

  private compressConfig(configJson: string): string {
    if (!this.compressionEnabled) {
      return btoa(configJson)
    }

    try {
      // Use a simple compression algorithm
      // In production, consider using a proper compression library like pako
      const compressed = this.simpleCompress(configJson)
      return 'z:' + btoa(compressed) // Prefix to indicate compression
    } catch (error) {
      console.warn('Compression failed, falling back to base64:', error)
      return btoa(configJson)
    }
  }

  private decompressConfig(compressed: string): string {
    if (compressed.startsWith('z:')) {
      // Compressed format
      const base64Data = compressed.substring(2)
      const compressedData = atob(base64Data)
      return this.simpleDecompress(compressedData)
    } else {
      // Uncompressed base64
      return atob(compressed)
    }
  }

  private simpleCompress(str: string): string {
    // Simple RLE-style compression for demo
    // Replace common patterns in configuration JSON
    const replacements = {
      '"true"': '!t',
      '"false"': '!f',
      '"enabled":': '!e:',
      '"disabled":': '!d:',
      '"color":': '!c:',
      '"position":': '!p:',
      '"radius":': '!r:',
      '{"x":': '!x{',
      ',"y":': ',!y',
      ',"z":': ',!z'
    }

    let compressed = str
    for (const [pattern, replacement] of Object.entries(replacements)) {
      compressed = compressed.replace(new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement)
    }

    return compressed
  }

  private simpleDecompress(compressed: string): string {
    // Reverse the simple compression
    const replacements = {
      '!t': '"true"',
      '!f': '"false"',
      '!e:': '"enabled":',
      '!d:': '"disabled":',
      '!c:': '"color":',
      '!p:': '"position":',
      '!r:': '"radius":',
      '!x{': '{"x":',
      ',!y': ',"y":',
      ',!z': ',"z":'
    }

    let decompressed = compressed
    for (const [pattern, replacement] of Object.entries(replacements)) {
      decompressed = decompressed.replace(new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement)
    }

    return decompressed
  }

  // ============================================================================
  // Validation Helpers
  // ============================================================================

  private validateBase64Config(config: string): boolean {
    if (!config || typeof config !== 'string') return false
    
    try {
      // Check if it's a compressed config
      const jsonString = this.decompressConfig(config)
      JSON.parse(jsonString)
      return true
    } catch {
      return false
    }
  }

  private validateColorArray(colors: string[]): boolean {
    if (!Array.isArray(colors)) return false
    
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/
    return colors.every(color => hexColorRegex.test(color)) && colors.length <= 10
  }

  validateParameters(params: BackgroundUrlParams): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    for (const [key, value] of Object.entries(params)) {
      const schema = this.parameterSchema[key]
      if (!schema) {
        warnings.push(`Unknown parameter: ${key}`)
        continue
      }

      if (schema.required && (value === undefined || value === null)) {
        errors.push(`Required parameter missing: ${key}`)
        continue
      }

      if (value !== undefined && value !== null && schema.validate) {
        if (!schema.validate(value)) {
          errors.push(`Invalid value for parameter '${key}': ${value}`)
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.map(msg => ({ path: '', message: msg, code: 'VALIDATION_ERROR', severity: 'error' as const })),
      warnings: warnings.map(msg => ({ path: '', message: msg, suggestion: 'Remove unknown parameter' }))
    }
  }

  // ============================================================================
  // Deep Linking Support
  // ============================================================================

  createDeepLink(moduleId: string, state: Partial<SerializableState>, options: DeepLinkOptions = {}): string {
    const { 
      title,
      description,
      thumbnail,
      includeMetadata = true 
    } = options

    const params: BackgroundUrlParams = {
      bg: moduleId
    }

    // Serialize the state
    if (state && Object.keys(state).length > 0) {
      const stateString = JSON.stringify({
        version: 1,
        moduleId,
        ...state,
        timestamp: Date.now()
      })
      params.config = this.compressConfig(stateString)
    }

    let url = this.generateShareableUrl({
      moduleId,
      config: state,
      theme: 'auto'
    } as BackgroundConfiguration, { compress: true })

    // Add metadata as hash for social sharing
    if (includeMetadata) {
      const metadata = {
        title: title || `${moduleId} Background Configuration`,
        description: description || `Interactive background configuration for ${moduleId}`,
        thumbnail: thumbnail || ''
      }
      url += '#' + btoa(JSON.stringify(metadata))
    }

    return url
  }

  parseDeepLink(url: string): DeepLinkData | null {
    try {
      const urlObj = new URL(url)
      const { params, errors } = this.parseFromUrl(url)

      if (errors.length > 0) {
        console.warn('Deep link parsing errors:', errors)
      }

      let metadata: DeepLinkMetadata | undefined
      if (urlObj.hash) {
        try {
          metadata = JSON.parse(atob(urlObj.hash.substring(1)))
        } catch {
          console.warn('Failed to parse deep link metadata')
        }
      }

      let state: SerializableState | undefined
      if (params.config) {
        state = this.deserializeModuleState(params.config)
      }

      return {
        moduleId: params.bg || '',
        params,
        state,
        metadata,
        errors
      }
    } catch (error) {
      console.error('Failed to parse deep link:', error)
      return null
    }
  }

  // ============================================================================
  // Browser History Integration
  // ============================================================================

  setupHistoryListener(callback: (params: BackgroundUrlParams) => void): () => void {
    const handlePopState = () => {
      const { params } = this.parseFromUrl()
      callback(params)
    }

    window.addEventListener('popstate', handlePopState)
    
    // Also listen for custom URL update events
    const handleUrlUpdate = (event: CustomEvent) => {
      callback(event.detail.params)
    }
    
    window.addEventListener('background-url-updated', handleUrlUpdate as EventListener)

    // Return cleanup function
    return () => {
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('background-url-updated', handleUrlUpdate as EventListener)
    }
  }
}

// ============================================================================
// Supporting Types and Interfaces
// ============================================================================

export interface BackgroundConfiguration {
  moduleId: string
  config?: ModuleConfiguration
  theme?: 'light' | 'dark' | 'auto'
  quality?: 'low' | 'medium' | 'high'
  fps?: number
}

export interface GraphModuleConfiguration extends ModuleConfiguration {
  nodeCount?: number
  connectionDensity?: 'sparse' | 'medium' | 'dense'
  physicsIntensity?: 'low' | 'medium' | 'high'
  customColors?: string[]
}

export interface UpdateUrlOptions {
  replace?: boolean
  silent?: boolean
  baseUrl?: string
}

export interface ShareUrlOptions {
  baseUrl?: string
  includeTheme?: boolean
  includePerformance?: boolean
  compress?: boolean
}

export interface DeepLinkOptions {
  title?: string
  description?: string
  thumbnail?: string
  includeMetadata?: boolean
}

export interface DeepLinkMetadata {
  title: string
  description: string
  thumbnail?: string
}

export interface DeepLinkData {
  moduleId: string
  params: BackgroundUrlParams
  state?: SerializableState
  metadata?: DeepLinkMetadata
  errors: string[]
}

// ============================================================================
// Usage Examples
// ============================================================================

/*
// Example 1: Basic URL parameter management
const urlManager = new UrlParameterManager()

// Parse current URL
const { params, errors } = urlManager.parseFromUrl()
if (errors.length === 0) {
  console.log('Background module:', params.bg)
  console.log('Node count:', params.nodes)
}

// Update URL with new parameters
urlManager.updateUrl({
  bg: 'knowledge',
  nodes: 50,
  connections: 'dense',
  theme: 'dark'
})

// Example 2: Generate shareable URL
const shareUrl = urlManager.generateShareableUrl({
  moduleId: 'knowledge',
  config: {
    enabled: true,
    nodeCount: 30,
    connectionDensity: 'medium',
    customColors: ['#ff0000', '#00ff00', '#0000ff']
  },
  theme: 'dark',
  quality: 'high'
}, {
  includeTheme: true,
  includePerformance: true,
  compress: true
})

console.log('Shareable URL:', shareUrl)

// Example 3: Deep linking with metadata
const deepLink = urlManager.createDeepLink('knowledge', {
  config: { nodeCount: 25, physics: { gravity: 0.5 } }
}, {
  title: 'My Cool Knowledge Graph',
  description: 'Check out this interactive knowledge graph configuration!',
  includeMetadata: true
})

// Example 4: Listen for URL changes
const cleanup = urlManager.setupHistoryListener((params) => {
  console.log('URL changed, new params:', params)
  // Update background system with new parameters
})

// Clean up listener when done
// cleanup()

// Example 5: Parse deep link
const deepLinkData = urlManager.parseDeepLink(window.location.href)
if (deepLinkData) {
  console.log('Deep link data:', deepLinkData)
  if (deepLinkData.state) {
    // Restore module state from deep link
    restoreModuleState(deepLinkData.moduleId, deepLinkData.state)
  }
}
*/