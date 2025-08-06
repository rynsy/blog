import { ModuleRegistry } from '../contexts/BackgroundContext'

// Module registry with lazy loading
export const moduleRegistry: ModuleRegistry = {
  gradient: {
    name: 'Animated Gradient',
    description: 'A smooth animated gradient background that responds to theme changes',
    icon: '🌈',
    load: () => import('./gradient')
  },
  // Future modules will be added here:
  // knowledge: {
  //   name: 'Knowledge Graph',
  //   description: 'Interactive site navigation graph',
  //   icon: '🕸️',
  //   load: () => import('./knowledge')
  // },
  // fluid: {
  //   name: 'Fluid Simulation',
  //   description: 'Navier-Stokes ink swirling with theme colors',
  //   icon: '🌊',
  //   load: () => import('./fluid')
  // }
}

// Register modules function for use in components
export const registerDefaultModules = (registerModule: (id: string, config: ModuleRegistry[string]) => void) => {
  Object.entries(moduleRegistry).forEach(([id, config]) => {
    registerModule(id, config)
  })
}