import { UrlParameterManager } from '../UrlParameterManager'
import { BackgroundUrlParams } from '../../interfaces/BackgroundSystemV3'

// Mock window and location
const mockLocation = {
  origin: 'https://example.com',
  pathname: '/test',
  href: 'https://example.com/test',
  search: ''
}

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
})

// Mock URLSearchParams for specific tests
const originalURLSearchParams = window.URLSearchParams

describe('UrlParameterManager', () => {
  let manager: UrlParameterManager

  beforeEach(() => {
    manager = new UrlParameterManager()
    mockLocation.search = ''
  })

  describe('parameter validation', () => {
    it('should validate valid background module parameter', () => {
      const params = { bg: 'knowledge' }
      const result = manager.validateParams(params)
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate valid node count parameter', () => {
      const params = { nodes: '25' }
      const result = manager.validateParams(params)
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid node count', () => {
      const params = { nodes: '500' } // Above maximum
      const result = manager.validateParams(params)
      
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should validate theme parameter', () => {
      const validThemes = ['light', 'dark', 'auto']
      
      validThemes.forEach(theme => {
        const params = { theme }
        const result = manager.validateParams(params)
        
        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })
    })

    it('should reject invalid theme', () => {
      const params = { theme: 'invalid' }
      const result = manager.validateParams(params)
      
      expect(result.valid).toBe(false)
    })

    it('should validate colors parameter', () => {
      const params = { colors: '#ff0000,#00ff00,#0000ff' }
      const result = manager.validateParams(params)
      
      expect(result.valid).toBe(true)
    })

    it('should reject invalid color format', () => {
      const params = { colors: 'red,green,blue' } // Not hex
      const result = manager.validateParams(params)
      
      expect(result.valid).toBe(false)
    })
  })

  describe('URL parsing', () => {
    it('should parse empty URL parameters', () => {
      mockLocation.search = ''
      const params = manager.parseFromUrl()
      
      expect(params).toEqual({})
    })

    it('should parse single background parameter', () => {
      mockLocation.search = '?bg=knowledge'
      const params = manager.parseFromUrl()
      
      expect(params.bg).toBe('knowledge')
    })

    it('should parse multiple parameters', () => {
      mockLocation.search = '?bg=knowledge&nodes=50&theme=dark'
      const params = manager.parseFromUrl()
      
      expect(params.bg).toBe('knowledge')
      expect(params.nodes).toBe(50) // Should be transformed to number
      expect(params.theme).toBe('dark')
    })

    it('should ignore invalid parameters gracefully', () => {
      mockLocation.search = '?bg=knowledge&invalid=value&nodes=25'
      const params = manager.parseFromUrl()
      
      expect(params.bg).toBe('knowledge')
      expect(params.nodes).toBe(25)
      expect('invalid' in params).toBe(false)
    })
  })

  describe('URL generation', () => {
    it('should generate basic shareable URL', () => {
      const config = {
        currentModule: 'knowledge',
        theme: 'dark'
      }
      
      const url = manager.generateShareableUrl(config)
      
      expect(url).toContain('https://example.com/test')
      expect(url).toContain('bg=knowledge')
      expect(url).toContain('theme=dark')
    })

    it('should handle complex configuration', () => {
      const config = {
        currentModule: 'knowledge',
        theme: 'light',
        moduleConfigurations: {
          knowledge: {
            nodes: 75,
            connections: 'dense',
            physics: { enabled: true }
          }
        }
      }
      
      const url = manager.generateShareableUrl(config)
      
      expect(url).toContain('nodes=75')
      expect(url).toContain('connections=dense')
      expect(url).toContain('physics=high')
    })

    it('should return base URL on generation error', () => {
      // Create a config that will cause JSON.stringify to throw
      const circularConfig: any = {}
      circularConfig.self = circularConfig
      
      const url = manager.generateShareableUrl(circularConfig)
      
      expect(url).toBe('https://example.com/test')
    })
  })

  describe('parameter summary', () => {
    it('should create readable summary for basic parameters', () => {
      const params: BackgroundUrlParams = {
        bg: 'knowledge',
        theme: 'dark',
        nodes: 50
      }
      
      const summary = manager.getUrlParameterSummary(params)
      
      expect(summary).toContain('Module: Interactive Knowledge Graph')
      expect(summary).toContain('Theme: Dark')
      expect(summary).toContain('Nodes: 50')
    })

    it('should handle unknown module gracefully', () => {
      const params: BackgroundUrlParams = {
        bg: 'unknown-module'
      }
      
      const summary = manager.getUrlParameterSummary(params)
      
      expect(summary).toContain('Module: unknown-module')
    })

    it('should return empty array for no parameters', () => {
      const params: BackgroundUrlParams = {}
      
      const summary = manager.getUrlParameterSummary(params)
      
      expect(summary).toEqual([])
    })
  })

  describe('base64 validation', () => {
    it('should validate correct base64 strings', () => {
      const validBase64 = btoa('test string')
      const params = { config: validBase64 }
      
      const result = manager.validateParams(params)
      expect(result.valid).toBe(true)
    })

    it('should reject invalid base64 strings', () => {
      const params = { config: 'not-valid-base64!' }
      
      const result = manager.validateParams(params)
      expect(result.valid).toBe(false)
    })
  })
})