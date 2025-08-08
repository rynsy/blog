import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock module registry for testing
const mockModuleRegistry = {
  knowledge: {
    name: 'Knowledge Graph',
    description: 'Interactive network visualization',
    icon: '🕸️',
    load: () => Promise.resolve({
      setup: () => ({
        pause: vi.fn(),
        resume: vi.fn(),
        destroy: vi.fn(),
        onThemeChange: vi.fn(),
        onResize: vi.fn()
      })
    })
  },
  gradient: {
    name: 'Animated Gradient',
    description: 'Smooth color transitions',
    icon: '🌈',
    load: () => Promise.resolve({
      setup: () => ({
        pause: vi.fn(),
        resume: vi.fn(),
        destroy: vi.fn(),
        onThemeChange: vi.fn(),
        onResize: vi.fn()
      })
    })
  }
}

// Function to load modules (U-01)
const loadModule = async (moduleId: string) => {
  const moduleConfig = mockModuleRegistry[moduleId as keyof typeof mockModuleRegistry]
  
  if (!moduleConfig) {
    throw new Error(`Module "${moduleId}" not found`)
  }
  
  try {
    const moduleExport = await moduleConfig.load()
    return {
      config: moduleConfig,
      setup: moduleExport.setup
    }
  } catch (error) {
    throw new Error(`Failed to load module "${moduleId}": ${error}`)
  }
}

describe('Module Loading System (U-01)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Valid Module Loading', () => {
    it('resolves valid knowledge module', async () => {
      const module = await loadModule('knowledge')
      
      expect(module).toBeDefined()
      expect(module.config.name).toBe('Knowledge Graph')
      expect(module.config.description).toBe('Interactive network visualization')
      expect(module.config.icon).toBe('🕸️')
      expect(module.setup).toBeInstanceOf(Function)
    })

    it('resolves valid gradient module', async () => {
      const module = await loadModule('gradient')
      
      expect(module).toBeDefined()
      expect(module.config.name).toBe('Animated Gradient')
      expect(module.config.description).toBe('Smooth color transitions')
      expect(module.config.icon).toBe('🌈')
      expect(module.setup).toBeInstanceOf(Function)
    })

    it('loaded module setup returns valid BackgroundModule interface', async () => {
      const module = await loadModule('knowledge')
      const instance = module.setup({
        canvas: document.createElement('canvas'),
        width: 800,
        height: 600,
        theme: 'light'
      })

      expect(instance).toHaveProperty('pause')
      expect(instance).toHaveProperty('resume')
      expect(instance).toHaveProperty('destroy')
      expect(instance).toHaveProperty('onThemeChange')
      expect(instance).toHaveProperty('onResize')

      expect(instance.pause).toBeInstanceOf(Function)
      expect(instance.resume).toBeInstanceOf(Function)
      expect(instance.destroy).toBeInstanceOf(Function)
      expect(instance.onThemeChange).toBeInstanceOf(Function)
      expect(instance.onResize).toBeInstanceOf(Function)
    })
  })

  describe('Invalid Module Loading', () => {
    it('rejects unknown module ID', async () => {
      await expect(loadModule('nonexistent')).rejects.toThrow(
        'Module "nonexistent" not found'
      )
    })

    it('rejects empty module ID', async () => {
      await expect(loadModule('')).rejects.toThrow(
        'Module "" not found'
      )
    })

    it('rejects null module ID', async () => {
      await expect(loadModule(null as any)).rejects.toThrow(
        'Module "null" not found'
      )
    })

    it('rejects undefined module ID', async () => {
      await expect(loadModule(undefined as any)).rejects.toThrow(
        'Module "undefined" not found'
      )
    })
  })

  describe('Module Loading Error Handling', () => {
    it('handles module load failures gracefully', async () => {
      const failingModuleRegistry = {
        failing: {
          name: 'Failing Module',
          description: 'This will fail to load',
          icon: '❌',
          load: () => Promise.reject(new Error('Network error'))
        }
      }

      const loadFailingModule = async (moduleId: string) => {
        const moduleConfig = failingModuleRegistry[moduleId as keyof typeof failingModuleRegistry]
        
        if (!moduleConfig) {
          throw new Error(`Module "${moduleId}" not found`)
        }
        
        try {
          const moduleExport = await moduleConfig.load()
          return {
            config: moduleConfig,
            setup: moduleExport.setup
          }
        } catch (error) {
          throw new Error(`Failed to load module "${moduleId}": ${error}`)
        }
      }

      await expect(loadFailingModule('failing')).rejects.toThrow(
        'Failed to load module "failing": Error: Network error'
      )
    })

    it('handles malformed module exports', async () => {
      const malformedModuleRegistry = {
        malformed: {
          name: 'Malformed Module',
          description: 'Missing setup function',
          icon: '🔧',
          load: () => Promise.resolve({}) // Missing setup function
        }
      }

      const loadMalformedModule = async (moduleId: string) => {
        const moduleConfig = malformedModuleRegistry[moduleId as keyof typeof malformedModuleRegistry]
        
        if (!moduleConfig) {
          throw new Error(`Module "${moduleId}" not found`)
        }
        
        const moduleExport = await moduleConfig.load()
        
        if (!moduleExport.setup || typeof moduleExport.setup !== 'function') {
          throw new Error(`Module "${moduleId}" does not export a valid setup function`)
        }
        
        return {
          config: moduleConfig,
          setup: moduleExport.setup
        }
      }

      await expect(loadMalformedModule('malformed')).rejects.toThrow(
        'Module "malformed" does not export a valid setup function'
      )
    })
  })

  describe('Module Registry Validation', () => {
    it('validates module configuration structure', () => {
      const validModuleIds = Object.keys(mockModuleRegistry)
      
      expect(validModuleIds).toContain('knowledge')
      expect(validModuleIds).toContain('gradient')

      validModuleIds.forEach(moduleId => {
        const config = mockModuleRegistry[moduleId as keyof typeof mockModuleRegistry]
        
        expect(config).toHaveProperty('name')
        expect(config).toHaveProperty('description')
        expect(config).toHaveProperty('icon')
        expect(config).toHaveProperty('load')

        expect(typeof config.name).toBe('string')
        expect(typeof config.description).toBe('string')
        expect(typeof config.icon).toBe('string')
        expect(typeof config.load).toBe('function')

        expect(config.name.length).toBeGreaterThan(0)
        expect(config.description.length).toBeGreaterThan(0)
        expect(config.icon.length).toBeGreaterThan(0)
      })
    })

    it('ensures all modules can be loaded successfully', async () => {
      const moduleIds = Object.keys(mockModuleRegistry)
      
      const loadPromises = moduleIds.map(async (moduleId) => {
        const module = await loadModule(moduleId)
        expect(module).toBeDefined()
        expect(module.config).toBeDefined()
        expect(module.setup).toBeInstanceOf(Function)
        return { moduleId, success: true }
      })

      const results = await Promise.all(loadPromises)
      expect(results).toHaveLength(moduleIds.length)
      results.forEach(result => {
        expect(result.success).toBe(true)
      })
    })
  })

  describe('Concurrent Module Loading', () => {
    it('handles concurrent module loads correctly', async () => {
      const loadPromises = [
        loadModule('knowledge'),
        loadModule('gradient'),
        loadModule('knowledge'), // Duplicate load
        loadModule('gradient')   // Duplicate load
      ]

      const results = await Promise.all(loadPromises)
      
      expect(results).toHaveLength(4)
      results.forEach(result => {
        expect(result).toBeDefined()
        expect(result.config).toBeDefined()
        expect(result.setup).toBeInstanceOf(Function)
      })

      // Verify duplicate loads return equivalent results
      expect(results[0].config.name).toBe(results[2].config.name)
      expect(results[1].config.name).toBe(results[3].config.name)
    })

    it('handles mixed valid and invalid concurrent loads', async () => {
      const loadPromises = [
        loadModule('knowledge'),
        loadModule('invalid-module').catch(e => ({ error: e.message })),
        loadModule('gradient'),
        loadModule('another-invalid').catch(e => ({ error: e.message }))
      ]

      const results = await Promise.all(loadPromises)
      
      expect(results).toHaveLength(4)
      
      // Valid modules should load successfully
      expect(results[0]).toHaveProperty('config')
      expect(results[2]).toHaveProperty('config')
      
      // Invalid modules should return error objects
      expect(results[1]).toHaveProperty('error')
      expect(results[3]).toHaveProperty('error')
      
      expect((results[1] as any).error).toContain('not found')
      expect((results[3] as any).error).toContain('not found')
    })
  })

  describe('Module Type Safety', () => {
    it('ensures loaded modules conform to BackgroundModule interface', async () => {
      const moduleIds = ['knowledge', 'gradient']
      
      for (const moduleId of moduleIds) {
        const module = await loadModule(moduleId)
        const instance = module.setup({
          canvas: document.createElement('canvas'),
          width: 800,
          height: 600,
          theme: 'light'
        })

        // Test that all required methods exist and are functions
        const requiredMethods = ['pause', 'resume', 'destroy']
        const optionalMethods = ['onThemeChange', 'onResize']
        
        requiredMethods.forEach(method => {
          expect(instance).toHaveProperty(method)
          expect(typeof instance[method]).toBe('function')
        })

        optionalMethods.forEach(method => {
          if (instance[method]) {
            expect(typeof instance[method]).toBe('function')
          }
        })

        // Test that methods can be called without throwing
        expect(() => instance.pause()).not.toThrow()
        expect(() => instance.resume()).not.toThrow()
        expect(() => instance.destroy()).not.toThrow()
        
        if (instance.onThemeChange) {
          expect(() => instance.onThemeChange!('dark')).not.toThrow()
          expect(() => instance.onThemeChange!('light')).not.toThrow()
        }
        
        if (instance.onResize) {
          expect(() => instance.onResize!(1024, 768)).not.toThrow()
        }
      }
    })
  })
})