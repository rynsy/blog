import { BackgroundUrlParams, UrlParameterSchema } from '../interfaces/BackgroundSystemV3'

/**
 * Manages URL parameters for shareable background configurations
 * Supports deep linking, validation, and configuration compression
 */
export class UrlParameterManager {
  private readonly parameterSchema: UrlParameterSchema = {
    bg: {
      type: 'string',
      validate: (value: unknown) => typeof value === 'string' && value.length > 0
    },
    stack: {
      type: 'string',
      validate: (value: unknown) => typeof value === 'string' && /^[a-zA-Z0-9_,-]+$/.test(value)
    },
    config: {
      type: 'string',
      validate: (value: unknown) => typeof value === 'string' && this.isValidBase64(value as string)
    },
    nodes: {
      type: 'number',
      validate: (value: unknown) => {
        const num = Number(value)
        return !isNaN(num) && num >= 5 && num <= 200
      },
      transform: (value: string) => parseInt(value, 10)
    },
    connections: {
      type: 'string',
      validate: (value: unknown) => ['sparse', 'medium', 'dense'].includes(value as string)
    },
    physics: {
      type: 'string',
      validate: (value: unknown) => ['low', 'medium', 'high'].includes(value as string)
    },
    theme: {
      type: 'string',
      validate: (value: unknown) => ['light', 'dark', 'auto'].includes(value as string)
    },
    colors: {
      type: 'string',
      validate: (value: unknown) => {
        if (typeof value !== 'string') return false
        const colors = value.split(',')
        return colors.every(color => /^#[0-9A-Fa-f]{6}$/.test(color.trim()))
      },
      transform: (value: string) => value.split(',').map(color => color.trim())
    },
    quality: {
      type: 'string',
      validate: (value: unknown) => ['low', 'medium', 'high'].includes(value as string)
    },
    fps: {
      type: 'number',
      validate: (value: unknown) => {
        const num = Number(value)
        return !isNaN(num) && num >= 15 && num <= 120
      },
      transform: (value: string) => parseInt(value, 10)
    },
    unlocked: {
      type: 'string',
      validate: (value: unknown) => typeof value === 'string' && /^[a-zA-Z0-9_,-]*$/.test(value)
    }
  }

  /**
   * Parse URL parameters from current location
   */
  parseFromUrl(): BackgroundUrlParams {
    if (typeof window === 'undefined') return {}

    const params = new URLSearchParams(window.location.search)
    const result: BackgroundUrlParams = {}

    for (const [key, value] of params.entries()) {
      if (key in this.parameterSchema) {
        const schema = this.parameterSchema[key]
        
        try {
          if (schema.validate && !schema.validate(value)) {
            console.warn(`Invalid URL parameter ${key}: ${value}`)
            continue
          }

          if (schema.transform) {
            result[key as keyof BackgroundUrlParams] = schema.transform(value) as any
          } else {
            result[key as keyof BackgroundUrlParams] = value as any
          }
        } catch (error) {
          console.warn(`Error parsing URL parameter ${key}:`, error)
        }
      }
    }

    // Special handling for base64 encoded config
    if (result.config) {
      try {
        const decodedConfig = this.decompressConfig(result.config)
        // Merge decoded config into result
        Object.assign(result, decodedConfig)
      } catch (error) {
        console.warn('Failed to decode config parameter:', error)
        delete result.config
      }
    }

    return result
  }

  /**
   * Update current URL with new parameters
   */
  updateUrl(params: Partial<BackgroundUrlParams>, replace = false): void {
    if (typeof window === 'undefined') return

    const url = new URL(window.location.href)
    const searchParams = new URLSearchParams(url.search)

    // Update parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        searchParams.delete(key)
      } else {
        const stringValue = this.serializeValue(key, value)
        searchParams.set(key, stringValue)
      }
    })

    url.search = searchParams.toString()

    // Update browser history
    if (replace) {
      window.history.replaceState({}, '', url.toString())
    } else {
      window.history.pushState({}, '', url.toString())
    }
  }

  /**
   * Generate a shareable URL for the given configuration
   */
  generateShareableUrl(config: any): string {
    if (typeof window === 'undefined') return ''

    const baseUrl = `${window.location.origin}${window.location.pathname}`
    const compressedConfig = this.compressConfig(config)
    
    const params = new URLSearchParams()
    params.set('config', compressedConfig)
    
    return `${baseUrl}?${params.toString()}`
  }

  /**
   * Compress configuration object to base64 string
   */
  private compressConfig(config: any): string {
    try {
      const jsonString = JSON.stringify(config)
      return btoa(encodeURIComponent(jsonString))
    } catch (error) {
      console.error('Failed to compress configuration:', error)
      throw new Error('Configuration compression failed')
    }
  }

  /**
   * Decompress base64 string to configuration object
   */
  private decompressConfig(compressedConfig: string): any {
    try {
      const jsonString = decodeURIComponent(atob(compressedConfig))
      return JSON.parse(jsonString)
    } catch (error) {
      console.error('Failed to decompress configuration:', error)
      throw new Error('Configuration decompression failed')
    }
  }

  /**
   * Serialize a value for URL parameter
   */
  private serializeValue(key: string, value: unknown): string {
    if (Array.isArray(value)) {
      return value.join(',')
    }
    
    if (typeof value === 'object' && value !== null) {
      return this.compressConfig(value)
    }
    
    return String(value)
  }

  /**
   * Validate if a string is valid base64
   */
  private isValidBase64(str: string): boolean {
    try {
      return btoa(atob(str)) === str
    } catch {
      return false
    }
  }

  /**
   * Get current URL parameters as object
   */
  getCurrentParams(): BackgroundUrlParams {
    return this.parseFromUrl()
  }

  /**
   * Clear all background-related parameters from URL
   */
  clearParams(): void {
    if (typeof window === 'undefined') return

    const url = new URL(window.location.href)
    const searchParams = new URLSearchParams(url.search)

    // Remove all background parameters
    Object.keys(this.parameterSchema).forEach(key => {
      searchParams.delete(key)
    })

    url.search = searchParams.toString()
    window.history.replaceState({}, '', url.toString())
  }

  /**
   * Validate URL parameters against schema
   */
  validateParams(params: Record<string, unknown>): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    Object.entries(params).forEach(([key, value]) => {
      if (key in this.parameterSchema) {
        const schema = this.parameterSchema[key]
        
        if (schema.validate && !schema.validate(value)) {
          errors.push(`Invalid value for parameter '${key}': ${value}`)
        }
      } else {
        errors.push(`Unknown parameter: ${key}`)
      }
    })

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Get URL parameters as a readable summary
   */
  getUrlParameterSummary(params: BackgroundUrlParams): string[] {
    const summary: string[] = []
    
    if (params.bg) {
      const moduleNames: Record<string, string> = {
        'knowledge': 'Interactive Knowledge Graph',
        'gradient': 'Animated Gradient'
      }
      summary.push(`Module: ${moduleNames[params.bg] || params.bg}`)
    }
    
    if (params.theme) {
      summary.push(`Theme: ${params.theme.charAt(0).toUpperCase() + params.theme.slice(1)}`)
    }
    
    if (params.nodes) {
      summary.push(`Nodes: ${params.nodes}`)
    }
    
    if (params.connections) {
      summary.push(`Connections: ${params.connections.charAt(0).toUpperCase() + params.connections.slice(1)}`)
    }
    
    if (params.physics) {
      summary.push(`Physics: ${params.physics.charAt(0).toUpperCase() + params.physics.slice(1)}`)
    }
    
    if (params.quality) {
      summary.push(`Quality: ${params.quality.charAt(0).toUpperCase() + params.quality.slice(1)}`)
    }
    
    return summary
  }
}
