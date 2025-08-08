import React, { useEffect } from 'react'
import { useBackgroundV3 } from '../contexts/BackgroundContextV3'
import { registerDefaultModulesV3 } from '../bgModules/registryV3'
import { debugBackground } from '../utils/debug'
import CanvasHostV3 from './CanvasHostV3'
import ControlTrayV3 from './ControlTrayV3'

const BackgroundClientV3: React.FC = () => {
  const { 
    registeredModules,
    activeModules,
    currentModule, 
    isActive, 
    isPaused,
    performanceMetrics,
    deviceCapabilities
  } = useBackgroundV3()

  useEffect(() => {
    // Register default modules on mount
    if (registeredModules.size === 0) {
      console.log('🎨 BackgroundClientV3: Registering background modules')
      debugBackground.client('🚀 BackgroundClientV3 MOUNTING - registering background modules')
      
      registerDefaultModulesV3().catch(error => {
        console.error('Failed to register default modules:', error)
        debugBackground.client('❌ Failed to register default modules:', error)
      })
    } else {
      console.log('🎨 BackgroundClientV3: Modules already registered')
      debugBackground.client('🔄 BackgroundClientV3 REMOUNTING - modules already registered, count:', registeredModules.size)
    }
    
    return () => {
      console.log('🎨 BackgroundClientV3: Component unmounting')
      debugBackground.client('💥 BackgroundClientV3 UNMOUNTING - cleaning up')
    }
  }, [])

  // Log state changes for debugging
  useEffect(() => {
    debugBackground.client('BackgroundClientV3 state update:', {
      registeredModules: registeredModules.size,
      activeModules: activeModules.size,
      currentModule,
      isActive,
      isPaused,
      performanceMetrics: {
        fps: Math.round(performanceMetrics.fps),
        memoryUsage: performanceMetrics.memoryUsage
      },
      deviceCapabilities: {
        webgl: deviceCapabilities.webgl,
        webgl2: deviceCapabilities.webgl2,
        isMobile: deviceCapabilities.isMobile,
        isLowEnd: deviceCapabilities.isLowEnd
      }
    })
  }, [
    registeredModules.size,
    activeModules.size, 
    currentModule, 
    isActive, 
    isPaused,
    performanceMetrics.fps,
    performanceMetrics.memoryUsage
  ])

  // Performance warnings
  useEffect(() => {
    if (performanceMetrics.fps > 0 && performanceMetrics.fps < 15) {
      console.warn('⚠️ BackgroundClientV3: Poor performance detected:', {
        fps: performanceMetrics.fps,
        frameTime: performanceMetrics.frameTime,
        memoryUsage: performanceMetrics.memoryUsage
      })
    }
  }, [performanceMetrics])

  // Device capability warnings  
  useEffect(() => {
    if (deviceCapabilities.isLowEnd && activeModules.size > 1) {
      console.warn('⚠️ BackgroundClientV3: Multiple modules active on low-end device')
    }
  }, [deviceCapabilities.isLowEnd, activeModules.size])

  debugBackground.client('BackgroundClientV3 rendering with state:', {
    hasRegisteredModules: registeredModules.size > 0,
    hasActiveModules: activeModules.size > 0,
    currentModule,
    isActive
  })

  return (
    <>
      {/* Canvas host for rendering background modules */}
      <CanvasHostV3 />
      
      {/* Control interface */}
      <ControlTrayV3 />
      
      {/* Development info overlay */}
      {process.env.NODE_ENV === 'development' && (
        <div 
          className="fixed top-4 left-4 z-[9998] bg-gray-900/80 text-white rounded-lg px-3 py-2 text-xs font-mono backdrop-blur-sm"
          style={{ fontSize: '10px' }}
        >
          <div className="space-y-1">
            <div className="font-bold text-blue-400">BackgroundSystem V3</div>
            <div>Registered: {registeredModules.size}</div>
            <div>Active: {activeModules.size}</div>
            <div>Current: {currentModule || 'None'}</div>
            <div>State: {isActive ? (isPaused ? 'Paused' : 'Active') : 'Inactive'}</div>
            {performanceMetrics.fps > 0 && (
              <>
                <div>FPS: {Math.round(performanceMetrics.fps)}</div>
                <div>Memory: {performanceMetrics.memoryUsage}MB</div>
              </>
            )}
            <div>Device: {deviceCapabilities.isLowEnd ? 'Low-end' : deviceCapabilities.isMobile ? 'Mobile' : 'Desktop'}</div>
          </div>
        </div>
      )}
    </>
  )
}

export default BackgroundClientV3
