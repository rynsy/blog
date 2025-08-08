import { ModuleRegistryV3 } from '../utils/ModuleRegistryV3'
import { 
  ModuleRegistryEntryV3, 
  ModuleCategory, 
  ModuleCapability,
  ModuleSetupParamsV3
} from '../../interfaces/BackgroundSystemV3'

// Global registry instance
const moduleRegistry = new ModuleRegistryV3()

// Enhanced module registry entries with V3 features
const moduleEntries: ModuleRegistryEntryV3[] = [
  {
    id: 'gradient',
    version: '1.0.0',
    name: 'Animated Gradient',
    description: 'A smooth animated gradient background that responds to theme changes',
    category: ModuleCategory.VISUAL,
    capabilities: [ModuleCapability.CANVAS_2D],
    tags: ['gradient', 'smooth', 'theme-responsive', 'low-impact'],
    memoryBudget: 15, // MB
    cpuIntensity: 'low',
    requiresWebGL: false,
    preferredCanvas: 'canvas2d',
    dependencies: [],
    conflicts: [],
    load: () => import('./gradient'),
    configSchema: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean', default: true },
        quality: { 
          type: 'string', 
          enum: ['low', 'medium', 'high'],
          default: 'medium'
        },
        colors: {
          type: 'array',
          items: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
          default: []
        },
        animationSpeed: {
          type: 'number',
          minimum: 0.1,
          maximum: 3.0,
          default: 1.0
        }
      }
    },
    defaultConfig: {
      enabled: true,
      quality: 'medium',
      colors: [],
      animationSpeed: 1.0
    },
    thumbnail: '🌈'
  },
  {
    id: 'knowledge',
    version: '2.0.0',
    name: 'Interactive Knowledge Graph',
    description: 'Interactive network of interconnected ideas and topics with physics simulation',
    category: ModuleCategory.INTERACTIVE,
    capabilities: [
      ModuleCapability.CANVAS_2D,
      ModuleCapability.WEBGL,
      ModuleCapability.MOUSE,
      ModuleCapability.TOUCH,
      ModuleCapability.KEYBOARD
    ],
    tags: ['interactive', 'graph', 'physics', 'drag', 'nodes', 'connections'],
    memoryBudget: 75, // MB
    cpuIntensity: 'high',
    requiresWebGL: false, // Can fallback to Canvas2D
    preferredCanvas: 'webgl',
    dependencies: [],
    conflicts: ['heavy-particle-system'], // Example conflict
    load: () => import('./knowledge'),
    fallback: () => import('./knowledge/fallback'), // Simplified version
    preload: async () => {
      // Preload physics engine or other dependencies
      console.log('Preloading knowledge graph physics engine...')
    },
    configSchema: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean', default: true },
        quality: { 
          type: 'string', 
          enum: ['low', 'medium', 'high'],
          default: 'medium'
        },
        nodes: {
          type: 'number',
          minimum: 5,
          maximum: 200,
          default: 25
        },
        connections: {
          type: 'string',
          enum: ['sparse', 'medium', 'dense'],
          default: 'medium'
        },
        physics: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean', default: true },
            gravity: { type: 'number', minimum: 0, maximum: 1, default: 0.1 },
            damping: { type: 'number', minimum: 0, maximum: 1, default: 0.9 },
            collisionDetection: { type: 'boolean', default: false },
            forces: {
              type: 'object',
              properties: {
                attraction: { type: 'number', default: 0.1 },
                repulsion: { type: 'number', default: 100 },
                centering: { type: 'number', default: 0.05 }
              }
            }
          }
        },
        interactions: {
          type: 'object',
          properties: {
            enableDrag: { type: 'boolean', default: true },
            enableClick: { type: 'boolean', default: true },
            enableHover: { type: 'boolean', default: true },
            enableKeyboard: { type: 'boolean', default: true },
            clickToCreate: { type: 'boolean', default: true },
            doubleClickAction: { 
              type: 'string', 
              enum: ['delete', 'edit', 'clone'],
              default: 'delete'
            }
          }
        }
      }
    },
    defaultConfig: {
      enabled: true,
      quality: 'medium',
      nodes: 25,
      connections: 'medium',
      physics: {
        enabled: true,
        gravity: 0.1,
        damping: 0.9,
        collisionDetection: false,
        forces: {
          attraction: 0.1,
          repulsion: 100,
          centering: 0.05
        }
      },
      interactions: {
        enableDrag: true,
        enableClick: true,
        enableHover: true,
        enableKeyboard: true,
        clickToCreate: true,
        doubleClickAction: 'delete'
      }
    },
    thumbnail: '🕸️',
    previewVideo: '/assets/previews/knowledge-graph.mp4'
  }
  // More modules can be added here in the future
]

/**
 * Register all default modules with the V3 registry
 */
export const registerDefaultModulesV3 = async (): Promise<void> => {
  try {
    console.log('📦 Registering V3 background modules...')
    
    for (const moduleEntry of moduleEntries) {
      await moduleRegistry.registerModule(moduleEntry)
    }
    
    const stats = moduleRegistry.getStatistics()
    console.log('✅ Successfully registered V3 modules:', {
      totalModules: stats.totalModules,
      categories: stats.categories,
      averageMemoryBudget: Math.round(stats.averageMemoryBudget),
      webglRequiredPercent: Math.round(stats.webglRequiredPercent)
    })
    
  } catch (error) {
    console.error('❌ Failed to register V3 modules:', error)
    throw error
  }
}

/**
 * Get the module registry instance
 */
export const getModuleRegistry = (): ModuleRegistryV3 => {
  return moduleRegistry
}

/**
 * Get recommended modules for a specific device
 */
export const getRecommendedModulesForDevice = (deviceCapabilities: any, maxCount = 3) => {
  return moduleRegistry.getRecommendedModules(deviceCapabilities, maxCount)
}

/**
 * Get modules by category
 */
export const getModulesByCategory = (category: ModuleCategory) => {
  return moduleRegistry.getModulesByCategory(category)
}

/**
 * Discover modules based on criteria
 */
export const discoverModules = (criteria: {
  capabilities?: ModuleCapability[]
  category?: ModuleCategory
  maxMemoryMB?: number
  deviceCapabilities?: any
  tags?: string[]
}) => {
  return moduleRegistry.discoverModules(criteria)
}

// Re-export the registry for backward compatibility and direct access
export { moduleRegistry as registry }
export default moduleRegistry
