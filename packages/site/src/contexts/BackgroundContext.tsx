import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { useTheme } from './ThemeContext'

export interface BackgroundModule {
  pause: () => void
  resume: () => void
  destroy: () => void
  onThemeChange?: (theme: 'light' | 'dark') => void
  onResize?: (width: number, height: number) => void
}

export interface ModuleSetupParams {
  canvas: HTMLCanvasElement | SVGElement
  width: number
  height: number
  theme: 'light' | 'dark'
}

export interface ModuleRegistry {
  [moduleId: string]: {
    name: string
    description: string
    icon?: string
    load: () => Promise<{ setup: (params: ModuleSetupParams) => BackgroundModule }>
  }
}

interface BackgroundContextType {
  currentModule: string | null
  isActive: boolean
  isPaused: boolean
  modules: ModuleRegistry
  setCurrentModule: (moduleId: string | null) => void
  toggleActive: () => void
  togglePause: () => void
  registerModule: (moduleId: string, moduleConfig: ModuleRegistry[string]) => void
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined)

export const useBackground = () => {
  const context = useContext(BackgroundContext)
  if (context === undefined) {
    throw new Error('useBackground must be used within a BackgroundProvider')
  }
  return context
}

interface BackgroundProviderProps {
  children: ReactNode
}

const STORAGE_KEYS = {
  MODULE: 'bg-module',
  ACTIVE: 'bg-active',
  PAUSED: 'bg-paused'
}

export const BackgroundProvider: React.FC<BackgroundProviderProps> = ({ children }) => {
  const { theme } = useTheme()
  const [currentModule, setCurrentModuleState] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [modules, setModules] = useState<ModuleRegistry>({})
  const [moduleInstance, setModuleInstance] = useState<BackgroundModule | null>(null)

  // Load preferences from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return

    const savedModule = localStorage.getItem(STORAGE_KEYS.MODULE)
    const savedActive = localStorage.getItem(STORAGE_KEYS.ACTIVE)
    const savedPaused = localStorage.getItem(STORAGE_KEYS.PAUSED)

    if (savedModule) {
      setCurrentModuleState(savedModule)
    }
    // Default to no module (null) - user must explicitly enable
    if (savedActive !== null) setIsActive(savedActive === 'true')
    if (savedPaused !== null) setIsPaused(savedPaused === 'true')
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

  // Handle theme changes
  useEffect(() => {
    if (moduleInstance?.onThemeChange) {
      moduleInstance.onThemeChange(theme)
    }
  }, [theme, moduleInstance])

  // Handle Page Visibility API
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (moduleInstance && !isPaused) {
          moduleInstance.pause()
        }
      } else {
        if (moduleInstance && !isPaused && isActive) {
          moduleInstance.resume()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [moduleInstance, isPaused, isActive])

  // Handle window resize
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleResize = () => {
      if (moduleInstance?.onResize) {
        moduleInstance.onResize(window.innerWidth, window.innerHeight)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [moduleInstance])

  // Handle prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = () => {
      if (mediaQuery.matches && isActive) {
        setIsPaused(true)
      }
    }

    handleChange() // Check initial state
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [isActive])

  const setCurrentModule = useCallback(async (moduleId: string | null) => {
    // Destroy current module
    if (moduleInstance) {
      moduleInstance.destroy()
      setModuleInstance(null)
    }

    setCurrentModuleState(moduleId)

    // Load new module if specified
    if (moduleId && modules[moduleId] && isActive) {
      try {
        const moduleExport = await modules[moduleId].load()
        // Note: Module setup will happen in CanvasHost when canvas is available
      } catch (error) {
        console.error(`Failed to load module ${moduleId}:`, error)
        setCurrentModuleState(null)
      }
    }
  }, [moduleInstance, modules, isActive])

  const toggleActive = useCallback(() => {
    const newActive = !isActive
    setIsActive(newActive)
    
    if (!newActive && moduleInstance) {
      moduleInstance.pause()
    } else if (newActive && moduleInstance && !isPaused) {
      moduleInstance.resume()
    }
  }, [isActive, moduleInstance, isPaused])

  const togglePause = useCallback(() => {
    const newPaused = !isPaused
    setIsPaused(newPaused)
    
    if (moduleInstance && isActive) {
      if (newPaused) {
        moduleInstance.pause()
      } else {
        moduleInstance.resume()
      }
    }
  }, [isPaused, moduleInstance, isActive])

  const registerModule = useCallback((moduleId: string, moduleConfig: ModuleRegistry[string]) => {
    setModules(prev => ({
      ...prev,
      [moduleId]: moduleConfig
    }))
  }, [])

  // Internal method to set module instance (used by CanvasHost)
  const setModuleInstanceInternal = useCallback((instance: BackgroundModule | null) => {
    setModuleInstance(instance)
  }, [])

  const contextValue = {
    currentModule,
    isActive,
    isPaused,
    modules,
    setCurrentModule,
    toggleActive,
    togglePause,
    registerModule,
    // Internal methods for CanvasHost
    _setModuleInstance: setModuleInstanceInternal,
    _moduleInstance: moduleInstance,
  } as BackgroundContextType & {
    _setModuleInstance: (instance: BackgroundModule | null) => void
    _moduleInstance: BackgroundModule | null
  }

  return (
    <BackgroundContext.Provider value={contextValue}>
      {children}
    </BackgroundContext.Provider>
  )
}