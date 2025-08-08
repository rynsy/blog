import { describe, it, expect } from 'vitest'
import { moduleRegistry } from '@site/bgModules/registry'

describe('Module Registry', () => {
  it('exports known modules with correct metadata', () => {
    const moduleIds = Object.keys(moduleRegistry)
    
    expect(moduleIds).toContain('gradient')
    expect(moduleIds).toContain('knowledge')
    
    // Test module metadata structure
    for (const config of Object.values(moduleRegistry)) {
      expect(config).toHaveProperty('name')
      expect(config).toHaveProperty('description') 
      expect(config).toHaveProperty('load')
      expect(typeof config.name).toBe('string')
      expect(typeof config.description).toBe('string')
      expect(typeof config.load).toBe('function')
      expect(config.name.length).toBeGreaterThan(0)
      expect(config.description.length).toBeGreaterThan(0)
    }
  })

  it('loads gradient module successfully', async () => {
    const gradientConfig = moduleRegistry.gradient
    
    const moduleExport = await gradientConfig.load()
    
    expect(moduleExport).toHaveProperty('setup')
    expect(typeof moduleExport.setup).toBe('function')
  })

  it('loads knowledge module successfully', async () => {
    const knowledgeConfig = moduleRegistry.knowledge
    
    const moduleExport = await knowledgeConfig.load()
    
    expect(moduleExport).toHaveProperty('setup')
    expect(typeof moduleExport.setup).toBe('function')
  })

  it('module setup returns correct interface', async () => {
    const gradientModule = await moduleRegistry.gradient.load()
    
    // Mock canvas and setup params
    const mockCanvas = document.createElement('canvas')
    const setupParams = {
      canvas: mockCanvas,
      width: 800,
      height: 600,
      theme: 'light' as const
    }
    
    const instance = gradientModule.setup(setupParams)
    
    expect(instance).toHaveProperty('pause')
    expect(instance).toHaveProperty('resume') 
    expect(instance).toHaveProperty('destroy')
    expect(typeof instance.pause).toBe('function')
    expect(typeof instance.resume).toBe('function')
    expect(typeof instance.destroy).toBe('function')
  })

  it('handles module load failures gracefully', async () => {
    // Test with invalid module configuration
    const invalidConfig = {
      name: 'Invalid Module',
      description: 'This module should fail to load',
      load: () => Promise.reject(new Error('Module not found'))
    }
    
    await expect(invalidConfig.load()).rejects.toThrow('Module not found')
  })
})