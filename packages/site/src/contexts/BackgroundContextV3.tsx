import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react'
import { useTheme } from './ThemeContext'
import {
  BackgroundModuleV3,
  ModuleSetupParamsV3,
  BackgroundUrlParams,
  PerformanceMetrics,
  MemoryStats,
  GlobalBackgroundConfiguration,
  ModuleConfiguration,
  DeviceCapabilities,
  SerializableState,
  ModuleRegistryEntryV3,
  QualityPreset
} from '../../interfaces/BackgroundSystemV3'
import { UrlParameterManager } from '../utils/UrlParameterManager'
import { PerformanceMonitor } from '../utils/PerformanceMonitor'
import { DeviceCapabilityManager } from '../utils/DeviceCapabilityManager'
import { ResourceManager } from '../utils/ResourceManager'
import { ModuleRegistryV3 } from '../utils/ModuleRegistryV3'
import { CanvasLayerManager } from '../utils/CanvasLayerManager'

// Enhanced background context interface
interface BackgroundContextV3Type {
  // Module management
  currentModule: string | null
  activeModules: Map<string, BackgroundModuleV3>
  moduleStack: string[]
  
  // State management
  isActive: boolean
  isPaused: boolean
  globalConfig: GlobalBackgroundConfiguration
  moduleConfigurations: Map<string, ModuleConfiguration>
  
  // Performance monitoring
  performanceMetrics: PerformanceMetrics
  memoryUsage: MemoryStats
  
  // URL parameter integration
  urlParams: BackgroundUrlParams
  
  // Registry access
  registeredModules: Map<string, ModuleRegistryEntryV3>
  
  // Device capabilities
  deviceCapabilities: DeviceCapabilities
  
  // Actions
  activateModule: (moduleId: string, config?: Partial<ModuleConfiguration>) => Promise<void>
  deactivateModule: (moduleId: string) => Promise<void>
  updateModuleConfiguration: (moduleId: string, config: Partial<ModuleConfiguration>) => Promise<void>
  generateShareableUrl: () => string
  
  // Legacy compatibility
  setCurrentModule: (moduleId: string | null) => void
  toggleActive: () => void
  togglePause: () => void
  registerModule: (moduleId: string, moduleConfig: any) => void
  modules: any // Legacy registry
}

const BackgroundContextV3 = createContext<BackgroundContextV3Type | undefined>(undefined)

export const useBackgroundV3 = () => {
  const context = useContext(BackgroundContextV3)
  if (context === undefined) {
    throw new Error('useBackgroundV3 must be used within a BackgroundProviderV3')
  }
  return context
}

// Legacy hook for backward compatibility
export const useBackground = () => {
  const context = useBackgroundV3()
  // Map V3 interface to legacy interface
  return {
    currentModule: context.currentModule,
    isActive: context.isActive,
    isPaused: context.isPaused,
    modules: Object.fromEntries(
      Array.from(context.registeredModules.entries()).map(([id, entry]) => [
        id,
        {
          name: entry.name,
          description: entry.description,
          icon: entry.thumbnail,
          load: entry.load
        }
      ])
    ),
    setCurrentModule: context.setCurrentModule,
    toggleActive: context.toggleActive,
    togglePause: context.togglePause,
    registerModule: context.registerModule
  }
}

interface BackgroundProviderV3Props {
  children: ReactNode
  initialConfig?: Partial<GlobalBackgroundConfiguration>
}

const DEFAULT_GLOBAL_CONFIG: GlobalBackgroundConfiguration = {
  maxActiveModules: 2,
  maxMemoryUsageMB: 100,
  targetFPS: 60,
  enablePerformanceMonitoring: true,
  enableDebugMode: false,
  enableEasterEggs: true,
  qualityPresets: {
    low: {
      targetFPS: 30,
      maxParticles: 50,
      enableShadows: false,
      enableAntialiasing: false,
      textureQuality: 'low',
      effectsEnabled: []
    },
    medium: {
      targetFPS: 45,
      maxParticles: 150,
      enableShadows: false,
      enableAntialiasing: true,
      textureQuality: 'medium',
      effectsEnabled: ['bloom']
    },
    high: {
      targetFPS: 60,
      maxParticles: 500,
      enableShadows: true,
      enableAntialiasing: true,
      textureQuality: 'high',
      effectsEnabled: ['bloom', 'motion-blur', 'depth-of-field']
    }
  },
  featureFlags: {
    enableWebGL2: true,
    enableOffscreenCanvas: true,
    enableWorkerThreads: false,
    enableExperimentalModules: false
  }
}

const STORAGE_KEYS = {
  MODULE: 'bg-module-v3',
  ACTIVE: 'bg-active-v3',
  PAUSED: 'bg-paused-v3',
  CONFIG: 'bg-config-v3',
  MODULE_CONFIGS: 'bg-module-configs-v3',
  EASTER_EGGS: 'bg-easter-eggs-v3'
}

export const BackgroundProviderV3: React.FC<BackgroundProviderV3Props> = ({ 
  children, 
  initialConfig = {} 
}) => {
  const { theme } = useTheme()
  
  // Core state
  const [currentModule, setCurrentModuleState] = useState<string | null>(null)
  const [activeModules, setActiveModules] = useState<Map<string, BackgroundModuleV3>>(new Map())
  const [moduleStack, setModuleStack] = useState<string[]>([])
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [globalConfig, setGlobalConfig] = useState<GlobalBackgroundConfiguration>({
    ...DEFAULT_GLOBAL_CONFIG,
    ...initialConfig
  })
  const [moduleConfigurations, setModuleConfigurations] = useState<Map<string, ModuleConfiguration>>(new Map())
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    frameTime: 0,
    memoryUsage: 0,
    renderTime: 0,
    timestamp: Date.now()
  })
  const [memoryUsage, setMemoryUsage] = useState<MemoryStats>({
    used: 0,
    allocated: 0,
    peak: 0,
    leaks: 0
  })
  const [urlParams, setUrlParams] = useState<BackgroundUrlParams>({})
  
  // Managers and utilities
  const urlParameterManagerRef = useRef<UrlParameterManager>()
  const performanceMonitorRef = useRef<PerformanceMonitor>()
  const deviceCapabilityManagerRef = useRef<DeviceCapabilityManager>()
  const resourceManagerRef = useRef<ResourceManager>()
  const moduleRegistryRef = useRef<ModuleRegistryV3>()
  const canvasLayerManagerRef = useRef<CanvasLayerManager>()
  
  // Initialize managers
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    urlParameterManagerRef.current = new UrlParameterManager()
    performanceMonitorRef.current = new PerformanceMonitor()
    deviceCapabilityManagerRef.current = new DeviceCapabilityManager()
    resourceManagerRef.current = new ResourceManager()
    moduleRegistryRef.current = new ModuleRegistryV3()
    canvasLayerManagerRef.current = new CanvasLayerManager()
    
    // Load URL parameters
    const params = urlParameterManagerRef.current.parseFromUrl()
    setUrlParams(params)
    
    // Load saved preferences
    loadSavedPreferences()
    
    return () => {
      // Cleanup managers
      resourceManagerRef.current?.cleanup()
    }
  }, [])
  
  // Load preferences from localStorage
  const loadSavedPreferences = useCallback(() => {
    if (typeof window === 'undefined') return
    
    try {
      const savedModule = localStorage.getItem(STORAGE_KEYS.MODULE)
      const savedActive = localStorage.getItem(STORAGE_KEYS.ACTIVE)
      const savedPaused = localStorage.getItem(STORAGE_KEYS.PAUSED)
      const savedConfig = localStorage.getItem(STORAGE_KEYS.CONFIG)
      const savedModuleConfigs = localStorage.getItem(STORAGE_KEYS.MODULE_CONFIGS)
      
      if (savedModule && savedModule !== 'null') {
        setCurrentModuleState(savedModule)
      }
      
      if (savedActive !== null) {
        setIsActive(savedActive === 'true')
      }
      
      if (savedPaused !== null) {
        setIsPaused(savedPaused === 'true')
      }
      
      if (savedConfig) {
        const config = JSON.parse(savedConfig)
        setGlobalConfig(prev => ({ ...prev, ...config }))
      }
      
      if (savedModuleConfigs) {
        const configs = JSON.parse(savedModuleConfigs)
        setModuleConfigurations(new Map(Object.entries(configs)))
      }
    } catch (error) {
      console.warn('Failed to load saved background preferences:', error)
    }
  }, [])
  
  // Save preferences to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    if (currentModule) {
      localStorage.setItem(STORAGE_KEYS.MODULE, currentModule)
    } else {
      localStorage.removeItem(STORAGE_KEYS.MODULE)
    }
  }, [currentModule])
  
  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEYS.ACTIVE, isActive.toString())
  }, [isActive])
  
  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEYS.PAUSED, isPaused.toString())
  }, [isPaused])
  
  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(globalConfig))
  }, [globalConfig])
  
  useEffect(() => {
    if (typeof window === 'undefined') return
    const configObj = Object.fromEntries(moduleConfigurations.entries())
    localStorage.setItem(STORAGE_KEYS.MODULE_CONFIGS, JSON.stringify(configObj))
  }, [moduleConfigurations])
  
  // Performance monitoring
  useEffect(() => {
    if (!performanceMonitorRef.current || !globalConfig.enablePerformanceMonitoring) return
    
    const monitor = performanceMonitorRef.current
    
    const updateMetrics = () => {
      const metrics = monitor.getMetrics()
      setPerformanceMetrics(metrics)
      
      const memStats = resourceManagerRef.current?.getMemoryUsage() || {
        used: 0,
        allocated: 0,
        peak: 0,
        leaks: 0
      }
      setMemoryUsage(memStats)
      
      // Check if we need to optimize performance
      if (monitor.shouldOptimize()) {
        optimizePerformance()
      }
    }
    
    const interval = setInterval(updateMetrics, 1000)
    return () => clearInterval(interval)
  }, [globalConfig.enablePerformanceMonitoring])
  
  // Performance optimization
  const optimizePerformance = useCallback(() => {
    // Reduce quality if performance is poor
    const currentQuality = globalConfig.qualityPresets.medium
    const lowQuality = globalConfig.qualityPresets.low
    
    if (performanceMetrics.fps < 30) {
      // Apply low quality preset to all active modules
      activeModules.forEach(async (module, moduleId) => {
        const config = moduleConfigurations.get(moduleId)
        if (config && config.quality !== 'low') {
          await updateModuleConfiguration(moduleId, {
            ...config,
            quality: 'low'
          })
        }
      })
    }
  }, [performanceMetrics, activeModules, moduleConfigurations, globalConfig])
  
  // Module management functions
  const activateModule = useCallback(async (
    moduleId: string, 
    config?: Partial<ModuleConfiguration>
  ) => {
    if (!moduleRegistryRef.current) return
    
    try {
      const registryEntry = moduleRegistryRef.current.getModule(moduleId)
      if (!registryEntry) {
        throw new Error(`Module ${moduleId} not found in registry`)
      }
      
      // Check if we've reached the maximum number of active modules
      if (activeModules.size >= globalConfig.maxActiveModules) {
        // Deactivate the oldest module
        const oldestModuleId = moduleStack[0]
        if (oldestModuleId) {
          await deactivateModule(oldestModuleId)
        }
      }
      
      // Load the module
      const moduleExport = await registryEntry.load()
      
      // Get or create canvas layer  
      if (!canvasLayerManagerRef.current) {
        throw new Error('Canvas layer manager not initialized')
      }
      
      const canvas = await canvasLayerManagerRef.current.createLayer(registryEntry)
      if (!canvas) {
        throw new Error('Failed to create canvas layer')
      }
      
      // Setup module parameters
      const setupParams: ModuleSetupParamsV3 = {
        canvas,
        width: window.innerWidth,
        height: window.innerHeight,
        theme,
        deviceCapabilities: deviceCapabilityManagerRef.current?.getCapabilities() || {} as DeviceCapabilities,
        performanceHints: {
          targetFPS: globalConfig.targetFPS,
          maxMemoryMB: globalConfig.maxMemoryUsageMB,
          preferredQuality: 'medium',
          enableOptimizations: true,
          adaptiveQuality: true
        },
        layerIndex: activeModules.size,
        resourceManager: resourceManagerRef.current!
      }
      
      // Initialize the module
      const moduleInstance = moduleExport.setup(setupParams)
      
      // Only call V3 methods if they exist (backward compatibility)
      if ('initialize' in moduleInstance && typeof moduleInstance.initialize === 'function') {
        await moduleInstance.initialize(setupParams)
      }
      
      // Store module configuration
      const moduleConfig: ModuleConfiguration = {
        enabled: true,
        quality: config?.quality || 'medium',
        ...registryEntry.defaultConfig,
        ...config
      }
      
      setModuleConfigurations(prev => new Map(prev.set(moduleId, moduleConfig)))
      
      // Apply configuration to module (if V3 module)
      if ('setConfiguration' in moduleInstance && typeof moduleInstance.setConfiguration === 'function') {
        await moduleInstance.setConfiguration(moduleConfig)
      }
      
      // Add to active modules
      setActiveModules(prev => new Map(prev.set(moduleId, moduleInstance)))
      setModuleStack(prev => [...prev.filter(id => id !== moduleId), moduleId])
      
      // Set as current module if none is set
      if (!currentModule) {
        setCurrentModuleState(moduleId)
      }
      
      // Activate the module (if V3 module)
      if ('activate' in moduleInstance && typeof moduleInstance.activate === 'function') {
        await moduleInstance.activate()
      } else {
        // Fallback to legacy resume method
        if ('resume' in moduleInstance && typeof moduleInstance.resume === 'function') {
          moduleInstance.resume()
        }
      }
      
    } catch (error) {
      console.error(`Failed to activate module ${moduleId}:`, error)
      throw error
    }
  }, [activeModules, moduleStack, globalConfig, currentModule, theme])
  
  const deactivateModule = useCallback(async (moduleId: string) => {
    const moduleInstance = activeModules.get(moduleId)
    if (!moduleInstance) return
    
    try {
      // Deactivate and cleanup the module
      if ('deactivate' in moduleInstance && typeof moduleInstance.deactivate === 'function') {
        await moduleInstance.deactivate()
      } else {
        // Fallback to legacy pause method
        if ('pause' in moduleInstance && typeof moduleInstance.pause === 'function') {
          moduleInstance.pause()
        }
      }
      
      if ('destroy' in moduleInstance && typeof moduleInstance.destroy === 'function') {
        moduleInstance.destroy()
      }
      
      // Remove from active modules
      setActiveModules(prev => {
        const newMap = new Map(prev)
        newMap.delete(moduleId)
        return newMap
      })
      
      setModuleStack(prev => prev.filter(id => id !== moduleId))
      
      // Update current module if this was the current one
      if (currentModule === moduleId) {
        const remainingModules = moduleStack.filter(id => id !== moduleId)
        setCurrentModuleState(remainingModules.length > 0 ? remainingModules[remainingModules.length - 1] : null)
      }
      
      // Release canvas layer
      canvasLayerManagerRef.current?.releaseLayer(moduleId)
      
    } catch (error) {
      console.error(`Failed to deactivate module ${moduleId}:`, error)
      throw error
    }
  }, [activeModules, moduleStack, currentModule])
  
  const updateModuleConfiguration = useCallback(async (
    moduleId: string,
    config: Partial<ModuleConfiguration>
  ) => {
    const moduleInstance = activeModules.get(moduleId)
    if (!moduleInstance) return
    
    try {
      const currentConfig = moduleConfigurations.get(moduleId) || { enabled: true, quality: 'medium' }
      const newConfig = { ...currentConfig, ...config }
      
      // Validate and apply configuration (if V3 module)
      if ('validateConfiguration' in moduleInstance && typeof moduleInstance.validateConfiguration === 'function') {
        const validationResult = moduleInstance.validateConfiguration(newConfig)
        if (!validationResult.valid) {
          throw new Error(`Invalid configuration: ${validationResult.errors.map(e => e.message).join(', ')}`)
        }
      }
      
      // Apply configuration to module
      if ('setConfiguration' in moduleInstance && typeof moduleInstance.setConfiguration === 'function') {
        await moduleInstance.setConfiguration(newConfig)
      }
      
      // Update stored configuration
      setModuleConfigurations(prev => new Map(prev.set(moduleId, newConfig)))
      
    } catch (error) {
      console.error(`Failed to update module configuration for ${moduleId}:`, error)
      throw error
    }
  }, [activeModules, moduleConfigurations])
  
  const generateShareableUrl = useCallback(() => {
    if (!urlParameterManagerRef.current) return window.location.href
    
    const config = {
      currentModule,
      activeModules: Array.from(activeModules.keys()),
      moduleConfigurations: Object.fromEntries(moduleConfigurations.entries()),
      globalConfig,
      theme
    }
    
    return urlParameterManagerRef.current.generateShareableUrl(config)
  }, [currentModule, activeModules, moduleConfigurations, globalConfig, theme])
  
  // Legacy compatibility functions
  const setCurrentModule = useCallback((moduleId: string | null) => {
    if (moduleId && !activeModules.has(moduleId)) {
      // Activate the module if not already active
      activateModule(moduleId).catch(console.error)
    }
    setCurrentModuleState(moduleId)
  }, [activeModules, activateModule])
  
  const toggleActive = useCallback(() => {
    setIsActive(prev => !prev)
  }, [])
  
  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev)
  }, [])
  
  const registerModule = useCallback((moduleId: string, moduleConfig: any) => {
    // Legacy compatibility - convert to V3 format
    const v3Entry: ModuleRegistryEntryV3 = {
      id: moduleId,
      version: '1.0.0',
      name: moduleConfig.name,
      description: moduleConfig.description,
      category: 'interactive' as any,
      capabilities: [],
      tags: [],
      memoryBudget: 50,
      cpuIntensity: 'medium',
      requiresWebGL: false,
      preferredCanvas: 'canvas2d',
      dependencies: [],
      conflicts: [],
      load: moduleConfig.load,
      configSchema: {},
      defaultConfig: { enabled: true, quality: 'medium' },
      thumbnail: moduleConfig.icon
    }
    
    moduleRegistryRef.current?.registerModule(v3Entry)
  }, [])
  
  // Handle pause/resume based on global state
  useEffect(() => {
    activeModules.forEach((moduleInstance) => {
      if (isPaused || !isActive) {
        moduleInstance.pause()
      } else {
        moduleInstance.resume()
      }
    })
  }, [activeModules, isPaused, isActive])
  
  // Handle theme changes
  useEffect(() => {
    activeModules.forEach((moduleInstance) => {
      if (moduleInstance.onThemeChange) {
        moduleInstance.onThemeChange(theme)
      }
    })
  }, [activeModules, theme])
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      activeModules.forEach((moduleInstance) => {
        if (moduleInstance.onResize) {
          moduleInstance.onResize(window.innerWidth, window.innerHeight)
        }
      })
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [activeModules])
  
  // Handle visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        activeModules.forEach((moduleInstance) => {
          if (!isPaused) moduleInstance.pause()
        })
      } else {
        activeModules.forEach((moduleInstance) => {
          if (!isPaused && isActive) moduleInstance.resume()
        })
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [activeModules, isPaused, isActive])
  
  const contextValue: BackgroundContextV3Type = {
    // Module management
    currentModule,
    activeModules,
    moduleStack,
    
    // State management
    isActive,
    isPaused,
    globalConfig,
    moduleConfigurations,
    
    // Performance monitoring
    performanceMetrics,
    memoryUsage,
    
    // URL parameter integration
    urlParams,
    
    // Registry access
    registeredModules: moduleRegistryRef.current?.getAllModules() || new Map(),
    
    // Device capabilities
    deviceCapabilities: deviceCapabilityManagerRef.current?.getCapabilities() || {} as DeviceCapabilities,
    
    // Actions
    activateModule,
    deactivateModule,
    updateModuleConfiguration,
    generateShareableUrl,
    
    // Legacy compatibility
    setCurrentModule,
    toggleActive,
    togglePause,
    registerModule,
    modules: {} // Will be populated by legacy modules
  }
  
  return (
    <BackgroundContextV3.Provider value={contextValue}>
      {children}
    </BackgroundContextV3.Provider>
  )
}

export default BackgroundProviderV3
