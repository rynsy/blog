/**
 * Phase 4 Advanced Features - Background Provider
 * Core orchestration system for multi-agent coordination
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { 
  BackgroundState, 
  BackgroundActions, 
  BackgroundContextValue, 
  BackgroundModule,
  ModuleInstance,
  EasterEggEvent,
  PerformanceMetrics,
  UserPreferences,
  AnalyticsEvent,
  PerformanceAlert
} from '../../types/background';

// Performance monitoring
const PERFORMANCE_SAMPLE_INTERVAL = 1000; // 1 second
const PERFORMANCE_ALERT_THRESHOLDS = {
  fps: 25,
  memory: 100, // MB
  cpu: 80, // percentage
};

// Initial state
const initialState: BackgroundState = {
  activeModule: null,
  availableModules: [],
  isLoading: false,
  error: null,
  performance: {
    fps: 60,
    memoryUsage: 0,
    cpuUsage: 0,
    renderTime: 0,
    timestamp: Date.now()
  },
  easterEggs: {
    discovered: [],
    inProgress: [],
    available: []
  },
  userPreferences: {
    theme: 'auto',
    reducedMotion: false,
    highContrast: false,
    preferredModules: [],
    discoveredEasterEggs: [],
    moduleSettings: {}
  }
};

// Action types
type BackgroundAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ACTIVE_MODULE'; payload: string | null }
  | { type: 'ADD_MODULE'; payload: BackgroundModule }
  | { type: 'REMOVE_MODULE'; payload: string }
  | { type: 'UPDATE_PERFORMANCE'; payload: PerformanceMetrics }
  | { type: 'DISCOVER_EASTER_EGG'; payload: string }
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<UserPreferences> }
  | { type: 'RESET_STATE' };

// Reducer
function backgroundReducer(state: BackgroundState, action: BackgroundAction): BackgroundState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
      
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
      
    case 'SET_ACTIVE_MODULE':
      return { ...state, activeModule: action.payload };
      
    case 'ADD_MODULE':
      return {
        ...state,
        availableModules: [...state.availableModules.filter(m => m.id !== action.payload.id), action.payload]
      };
      
    case 'REMOVE_MODULE':
      return {
        ...state,
        availableModules: state.availableModules.filter(m => m.id !== action.payload)
      };
      
    case 'UPDATE_PERFORMANCE':
      return { ...state, performance: action.payload };
      
    case 'DISCOVER_EASTER_EGG':
      return {
        ...state,
        easterEggs: {
          ...state.easterEggs,
          discovered: [...state.easterEggs.discovered, action.payload],
          inProgress: state.easterEggs.inProgress.filter(id => id !== action.payload)
        }
      };
      
    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        userPreferences: { ...state.userPreferences, ...action.payload }
      };
      
    case 'RESET_STATE':
      return initialState;
      
    default:
      return state;
  }
}

// Context
const BackgroundContext = createContext<BackgroundContextValue | null>(null);

// Custom hooks for multi-agent coordination
export function useBackground(): BackgroundContextValue {
  const context = useContext(BackgroundContext);
  if (!context) {
    throw new Error('useBackground must be used within BackgroundProvider');
  }
  return context;
}

// Performance monitoring hook
function usePerformanceMonitoring(dispatch: React.Dispatch<BackgroundAction>) {
  const performanceRef = useRef<{
    lastTime: number;
    frames: number;
    memory?: any;
  }>({ lastTime: 0, frames: 0 });

  const measurePerformance = useCallback((): PerformanceMetrics => {
    const now = performance.now();
    const memory = (performance as any).memory;
    
    // FPS calculation
    performanceRef.current.frames++;
    const deltaTime = now - performanceRef.current.lastTime;
    
    let fps = 60;
    if (deltaTime >= 1000) {
      fps = Math.round((performanceRef.current.frames * 1000) / deltaTime);
      performanceRef.current.frames = 0;
      performanceRef.current.lastTime = now;
    }

    // Memory usage (if available)
    const memoryUsage = memory ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : 0;
    
    // CPU usage estimation (simplified)
    const cpuUsage = Math.min(100, Math.max(0, (60 - fps) * 2));

    return {
      fps,
      memoryUsage,
      cpuUsage,
      renderTime: deltaTime,
      timestamp: now
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const metrics = measurePerformance();
      dispatch({ type: 'UPDATE_PERFORMANCE', payload: metrics });
      
      // Check for performance alerts
      if (metrics.fps < PERFORMANCE_ALERT_THRESHOLDS.fps) {
        console.warn('🚨 Performance Alert: Low FPS detected:', metrics.fps);
      }
      if (metrics.memoryUsage > PERFORMANCE_ALERT_THRESHOLDS.memory) {
        console.warn('🚨 Performance Alert: High memory usage:', metrics.memoryUsage, 'MB');
      }
      if (metrics.cpuUsage > PERFORMANCE_ALERT_THRESHOLDS.cpu) {
        console.warn('🚨 Performance Alert: High CPU usage:', metrics.cpuUsage, '%');
      }
    }, PERFORMANCE_SAMPLE_INTERVAL);

    return () => clearInterval(interval);
  }, [measurePerformance, dispatch]);

  return measurePerformance;
}

// Easter egg coordination system
function useEasterEggSystem(
  state: BackgroundState,
  dispatch: React.Dispatch<BackgroundAction>
) {
  const easterEggEventsRef = useRef<EasterEggEvent[]>([]);
  const patternBufferRef = useRef<string[]>([]);
  
  const triggerEasterEggCheck = useCallback((event: EasterEggEvent) => {
    easterEggEventsRef.current.push(event);
    
    // Keep only recent events (last 30 seconds)
    const cutoff = Date.now() - 30000;
    easterEggEventsRef.current = easterEggEventsRef.current.filter(
      e => e.timestamp > cutoff
    );

    // Check for pattern matches
    state.availableModules.forEach(module => {
      if (!module.easterEgg || state.easterEggs.discovered.includes(module.easterEgg.id)) {
        return;
      }

      const easterEgg = module.easterEgg;
      let triggered = false;

      easterEgg.triggers.forEach(trigger => {
        switch (trigger.type) {
          case 'sequence':
            // Check for key sequence patterns
            const sequence = trigger.data as string[];
            if (patternBufferRef.current.slice(-sequence.length).join(',') === sequence.join(',')) {
              triggered = true;
            }
            break;
            
          case 'time':
            // Check for time-based triggers
            const timeData = trigger.data as { duration: number; moduleActive?: string };
            if (state.activeModule === timeData.moduleActive) {
              const moduleActiveTime = easterEggEventsRef.current
                .filter(e => e.type === 'module-active' && e.moduleId === timeData.moduleActive)
                .reduce((acc, e) => acc + (Date.now() - e.timestamp), 0);
              
              if (moduleActiveTime >= timeData.duration) {
                triggered = true;
              }
            }
            break;
            
          case 'interaction':
            // Check for interaction patterns
            const interactionData = trigger.data as { count: number; type: string };
            const interactions = easterEggEventsRef.current.filter(
              e => e.type === interactionData.type
            ).length;
            
            if (interactions >= interactionData.count) {
              triggered = true;
            }
            break;
        }
      });

      if (triggered) {
        console.log('🎉 Easter egg discovered:', easterEgg.id);
        dispatch({ type: 'DISCOVER_EASTER_EGG', payload: easterEgg.id });
        
        // Analytics event
        const analyticsEvent: AnalyticsEvent = {
          type: 'easter-egg-discovered',
          data: { easterEggId: easterEgg.id, difficulty: easterEgg.difficulty },
          timestamp: Date.now()
        };
        
        // Trigger reward
        if (easterEgg.reward) {
          switch (easterEgg.reward.type) {
            case 'visual':
              // Trigger visual effect
              console.log('🌟 Visual reward triggered:', easterEgg.reward.content);
              break;
            case 'message':
              // Show message
              console.log('💬 Message reward:', easterEgg.reward.content);
              break;
            case 'achievement':
              // Unlock achievement
              console.log('🏆 Achievement unlocked:', easterEgg.reward.content);
              break;
          }
        }
      }
    });
  }, [state, dispatch]);

  const handleKeyboardEvent = useCallback((event: KeyboardEvent) => {
    patternBufferRef.current.push(event.key);
    if (patternBufferRef.current.length > 20) {
      patternBufferRef.current = patternBufferRef.current.slice(-10);
    }
    
    triggerEasterEggCheck({
      type: 'keyboard',
      data: { key: event.key, code: event.code },
      timestamp: Date.now(),
      moduleId: state.activeModule || 'global'
    });
  }, [triggerEasterEggCheck, state.activeModule]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyboardEvent);
    return () => window.removeEventListener('keydown', handleKeyboardEvent);
  }, [handleKeyboardEvent]);

  return { triggerEasterEggCheck };
}

// Main provider component
interface BackgroundProviderProps {
  children: React.ReactNode;
}

export function BackgroundProvider({ children }: BackgroundProviderProps) {
  const [state, dispatch] = useReducer(backgroundReducer, initialState);
  const activeModuleInstanceRef = useRef<ModuleInstance | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Initialize performance monitoring
  const measurePerformance = usePerformanceMonitoring(dispatch);
  
  // Initialize easter egg system
  const { triggerEasterEggCheck } = useEasterEggSystem(state, dispatch);

  // Module management actions
  const actions: BackgroundActions = {
    switchModule: useCallback(async (moduleId: string) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        // Cleanup current module
        if (activeModuleInstanceRef.current) {
          activeModuleInstanceRef.current.destroy();
          activeModuleInstanceRef.current = null;
        }
        
        // Find and initialize new module
        const module = state.availableModules.find(m => m.id === moduleId);
        if (!module) {
          throw new Error(`Module ${moduleId} not found`);
        }
        
        if (!canvasRef.current) {
          throw new Error('Canvas not available');
        }
        
        // Check device capabilities
        const hasWebGL = !!(canvasRef.current.getContext('webgl') || canvasRef.current.getContext('webgl2'));
        if (module.requirements.webgl && !hasWebGL) {
          throw new Error('Module requires WebGL but it\'s not supported');
        }

        // Initialize module
        const instance = await module.init(canvasRef.current, {
          debug: process.env.NODE_ENV === 'development',
          performance: state.userPreferences.moduleSettings[moduleId]?.performance || 'medium',
          accessibility: {
            respectReducedMotion: state.userPreferences.reducedMotion,
            highContrast: state.userPreferences.highContrast,
            screenReader: false // TODO: Detect screen reader
          },
          preferences: state.userPreferences
        });
        
        activeModuleInstanceRef.current = instance;
        dispatch({ type: 'SET_ACTIVE_MODULE', payload: moduleId });
        
        // Start the module
        instance.start();
        
        // Analytics event
        triggerEasterEggCheck({
          type: 'module-switch',
          data: { moduleId, timestamp: Date.now() },
          timestamp: Date.now(),
          moduleId
        });
        
        dispatch({ type: 'SET_LOADING', payload: false });
      } catch (error) {
        console.error('Failed to switch module:', error);
        dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      }
    }, [state.availableModules, state.userPreferences, triggerEasterEggCheck]),

    loadModule: useCallback(async (moduleId: string) => {
      try {
        // Dynamic import based on module ID
        const moduleImport = await import(`@/bgModules/modules/${moduleId}`);
        const module = moduleImport.default as BackgroundModule;
        
        dispatch({ type: 'ADD_MODULE', payload: module });
        
        // Add easter eggs to available list
        if (module.easterEgg) {
          // Update easter eggs state (simplified)
          console.log('Easter egg available:', module.easterEgg.id);
        }
      } catch (error) {
        console.error('Failed to load module:', error);
        dispatch({ type: 'SET_ERROR', payload: `Failed to load module: ${moduleId}` });
      }
    }, []),

    unloadModule: useCallback((moduleId: string) => {
      if (state.activeModule === moduleId) {
        activeModuleInstanceRef.current?.destroy();
        activeModuleInstanceRef.current = null;
        dispatch({ type: 'SET_ACTIVE_MODULE', payload: null });
      }
      dispatch({ type: 'REMOVE_MODULE', payload: moduleId });
    }, [state.activeModule]),

    triggerEasterEggCheck,

    resetEasterEggProgress: useCallback((easterEggId: string) => {
      // Implementation for resetting easter egg progress
      console.log('Resetting easter egg progress:', easterEggId);
    }, []),

    setPerformanceMode: useCallback((mode: 'low' | 'medium' | 'high') => {
      dispatch({ 
        type: 'UPDATE_PREFERENCES', 
        payload: { 
          moduleSettings: { 
            ...state.userPreferences.moduleSettings,
            [state.activeModule || 'global']: { 
              ...(state.userPreferences.moduleSettings[state.activeModule || 'global'] || {}),
              performance: mode 
            }
          }
        }
      });
      
      // Update active module performance
      if (activeModuleInstanceRef.current) {
        // Module should implement performance mode changes
        console.log('Setting performance mode:', mode);
      }
    }, [state.activeModule, state.userPreferences.moduleSettings]),

    getPerformanceMetrics: useCallback(() => {
      return measurePerformance();
    }, [measurePerformance]),

    updatePreferences: useCallback((preferences: Partial<UserPreferences>) => {
      dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences });
      
      // Save to localStorage
      const updatedPreferences = { ...state.userPreferences, ...preferences };
      localStorage.setItem('bg-preferences', JSON.stringify(updatedPreferences));
    }, [state.userPreferences]),

    submitModule: useCallback(async (module: BackgroundModule) => {
      // Implementation for community module submission
      console.log('Submitting community module:', module.id);
      // Return validation result
      return {
        valid: true,
        errors: [],
        warnings: [],
        performanceImpact: {
          bundleSize: module.performance.estimatedBundleSize,
          estimatedCPU: module.performance.cpuIntensity,
          estimatedMemory: module.performance.memoryUsage
        },
        securityRisk: 'low' as const
      };
    }, []),

    rateModule: useCallback(async (moduleId: string, rating: number, review?: string) => {
      // Implementation for module rating
      console.log('Rating module:', moduleId, rating, review);
    }, []),

    reportModule: useCallback(async (moduleId: string, reason: string) => {
      // Implementation for module reporting
      console.log('Reporting module:', moduleId, reason);
    }, [])
  };

  // Load user preferences on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('bg-preferences');
    if (savedPreferences) {
      try {
        const preferences = JSON.parse(savedPreferences);
        dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences });
      } catch (error) {
        console.error('Failed to load preferences:', error);
      }
    }
  }, []);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (activeModuleInstanceRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        activeModuleInstanceRef.current.resize(canvas.width, canvas.height);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (activeModuleInstanceRef.current) {
        activeModuleInstanceRef.current.destroy();
      }
    };
  }, []);

  const contextValue: BackgroundContextValue = {
    state,
    actions
  };

  return (
    <BackgroundContext.Provider value={contextValue}>
      {children}
      {/* Hidden canvas for background rendering */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: -1,
          pointerEvents: 'none'
        }}
        aria-hidden="true"
      />
    </BackgroundContext.Provider>
  );
}

export default BackgroundProvider;