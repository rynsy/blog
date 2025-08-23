import { ModuleRegistryV3 } from '../utils/ModuleRegistryV3'
import { 
  ModuleRegistryEntryV3, 
  ModuleCategory, 
  ModuleCapability,
  ModuleSetupParamsV3
} from '../interfaces/BackgroundSystemV3'

// Extend ModuleCapability enum for advanced features
declare module '../interfaces/BackgroundSystemV3' {
  namespace ModuleCapability {
    const THEME_AWARE = 'theme-aware';
    const REAL_TIME_PHYSICS = 'real-time-physics';
    const PHYSICS = 'physics';
  }
}

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
  },
  {
    id: 'fluid-simulation-enhanced',
    version: '2.0.0',
    name: 'Enhanced Fluid Simulation',
    description: 'WebGL-based Navier-Stokes fluid dynamics with advanced mouse interaction and theme adaptation',
    category: ModuleCategory.SIMULATION,
    capabilities: [
      ModuleCapability.WEBGL,
      ModuleCapability.MOUSE,
      ModuleCapability.TOUCH,
      ModuleCapability.THEME_AWARE
    ],
    tags: ['fluid', 'simulation', 'webgl', 'interactive', 'physics', 'advanced'],
    memoryBudget: 35, // MB
    cpuIntensity: 'high',
    requiresWebGL: true,
    preferredCanvas: 'webgl',
    dependencies: [],
    conflicts: ['heavy-particle-system'],
    load: () => import('./advanced/FluidSimulation'),
    configSchema: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean', default: true },
        quality: { 
          type: 'string', 
          enum: ['low', 'medium', 'high'],
          default: 'medium'
        },
        viscosity: {
          type: 'number',
          minimum: 0.01,
          maximum: 0.1,
          default: 0.03
        },
        iterations: {
          type: 'number',
          minimum: 5,
          maximum: 30,
          default: 12
        },
        gridResolution: {
          type: 'number',
          minimum: 1,
          maximum: 4,
          default: 2
        }
      }
    },
    defaultConfig: {
      enabled: true,
      quality: 'medium',
      viscosity: 0.03,
      iterations: 12,
      gridResolution: 2
    },
    thumbnail: '💧',
    easterEggConfig: {
      id: 'fluid-maestro',
      difficulty: 4,
      triggers: [{
        type: 'interaction',
        condition: { count: 50, pattern: 'spiral' }
      }],
      reward: {
        type: 'visual',
        unlock: 'aurora-fluid-mode',
        notification: {
          title: 'Fluid Maestro!',
          description: 'You have mastered the art of fluid manipulation!',
          icon: '🌊',
          duration: 5000
        },
        persistentEffect: {
          type: 'timed',
          duration: 15000
        }
      },
      discoveryHint: 'Draw spirals in the fluid to unlock its true potential...'
    }
  },
  {
    id: 'falling-sand',
    version: '1.0.0',
    name: 'Falling Sand',
    description: 'Interactive cellular automata with multi-material physics simulation',
    category: ModuleCategory.SIMULATION,
    capabilities: [
      ModuleCapability.WEBGL,
      ModuleCapability.MOUSE,
      ModuleCapability.KEYBOARD,
      ModuleCapability.REAL_TIME_PHYSICS
    ],
    tags: ['cellular-automata', 'physics', 'interactive', 'elements', 'sandbox'],
    memoryBudget: 45, // MB
    cpuIntensity: 'high',
    requiresWebGL: true,
    preferredCanvas: 'webgl',
    dependencies: [],
    conflicts: [],
    load: () => import('./advanced/FallingSand'),
    configSchema: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean', default: true },
        quality: { 
          type: 'string', 
          enum: ['low', 'medium', 'high'],
          default: 'medium'
        },
        cellSize: {
          type: 'number',
          minimum: 2,
          maximum: 8,
          default: 4
        },
        gravity: {
          type: 'number',
          minimum: 0.1,
          maximum: 2.0,
          default: 0.8
        },
        enableInteractions: {
          type: 'boolean',
          default: true
        }
      }
    },
    defaultConfig: {
      enabled: true,
      quality: 'medium',
      cellSize: 4,
      gravity: 0.8,
      enableInteractions: true
    },
    thumbnail: '🏖️',
    easterEggConfig: {
      id: 'alchemist-master',
      difficulty: 5,
      triggers: [{
        type: 'interaction',
        condition: { count: 20, type: 'element-combinations' }
      }],
      reward: {
        type: 'visual',
        unlock: 'rainbow-elements-mode',
        notification: {
          title: 'Alchemist Master!',
          description: 'You have discovered the secrets of elemental combinations!',
          icon: '🧙‍♂️',
          duration: 7000
        },
        persistentEffect: {
          type: 'timed',
          duration: 20000
        }
      },
      discoveryHint: 'Experiment with all element combinations to unlock the secret...'
    }
  },
  {
    id: 'dvd-logo-bouncer',
    version: '1.0.0',
    name: 'DVD Logo Bouncer',
    description: 'Classic DVD logo bouncing animation with physics and easter eggs',
    category: ModuleCategory.INTERACTIVE,
    capabilities: [
      ModuleCapability.WEBGL,
      ModuleCapability.MOUSE,
      ModuleCapability.PHYSICS
    ],
    tags: ['animation', 'physics', 'nostalgia', 'bouncing', 'interactive'],
    memoryBudget: 20, // MB
    cpuIntensity: 'medium',
    requiresWebGL: true,
    preferredCanvas: 'webgl',
    dependencies: [],
    conflicts: [],
    load: () => import('./advanced/DVDLogoBouncer'),
    configSchema: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean', default: true },
        quality: { 
          type: 'string', 
          enum: ['low', 'medium', 'high'],
          default: 'medium'
        },
        logoCount: {
          type: 'number',
          minimum: 1,
          maximum: 10,
          default: 2
        },
        speed: {
          type: 'number',
          minimum: 1.0,
          maximum: 8.0,
          default: 3.0
        },
        gravity: {
          type: 'number',
          minimum: 0.0,
          maximum: 1.0,
          default: 0.0
        },
        colorChangeOnBounce: {
          type: 'boolean',
          default: true
        }
      }
    },
    defaultConfig: {
      enabled: true,
      quality: 'medium',
      logoCount: 2,
      speed: 3.0,
      gravity: 0.0,
      colorChangeOnBounce: true
    },
    thumbnail: '📀',
    easterEggConfig: {
      id: 'corner-hunter',
      difficulty: 3,
      triggers: [{
        type: 'performance',
        condition: { count: 3, type: 'corner-hits' }
      }],
      reward: {
        type: 'visual',
        unlock: 'rainbow-logo-mode',
        notification: {
          title: 'Corner Hunter!',
          description: 'You witnessed the legendary perfect corner hit!',
          icon: '🎯',
          duration: 5000
        },
        persistentEffect: {
          type: 'timed',
          duration: 10000
        }
      },
      discoveryHint: 'Wait for the perfect corner collision...'
    }
  }
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
