import React, { useEffect, useRef, useState } from 'react'
import { useBackgroundV3 } from '../contexts/BackgroundContextV3'
import { useTheme } from '../contexts/ThemeContext'
import { debugBackground } from '../utils/debug'

interface CanvasHostV3Props {
  className?: string
}

const CanvasHostV3: React.FC<CanvasHostV3Props> = ({ className = '' }) => {
  const {
    currentModule,
    activeModules,
    isActive,
    isPaused,
    performanceMetrics,
    deviceCapabilities
  } = useBackgroundV3()
  const { theme } = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const [showPerformanceWarning, setShowPerformanceWarning] = useState(false)
  const [showReducedMotionBanner, setShowReducedMotionBanner] = useState(false)

  // Performance monitoring
  useEffect(() => {
    const shouldWarn = performanceMetrics.fps < 20 && performanceMetrics.fps > 0
    setShowPerformanceWarning(shouldWarn)
    
    if (shouldWarn) {
      debugBackground.canvas('Performance warning triggered:', performanceMetrics)
    }
  }, [performanceMetrics])

  // Reduced motion detection
  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = () => {
      const shouldShow = mediaQuery.matches && isActive && !isPaused && activeModules.size > 0
      setShowReducedMotionBanner(shouldShow)
    }

    handleChange()
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [isActive, isPaused, activeModules.size])

  // Device capability warnings
  const showLowEndWarning = deviceCapabilities.isLowEnd && activeModules.size > 0 && isActive

  debugBackground.canvas('CanvasHostV3 render state:', {
    currentModule,
    activeModuleCount: activeModules.size,
    isActive,
    isPaused,
    deviceCapabilities: {
      isLowEnd: deviceCapabilities.isLowEnd,
      isMobile: deviceCapabilities.isMobile,
      webgl: deviceCapabilities.webgl
    },
    performanceMetrics
  })

  return (
    <>
      {/* Performance warning banner */}
      {showPerformanceWarning && (
        <div 
          className="fixed top-0 left-0 right-0 z-50 bg-orange-100 dark:bg-orange-900 border-b border-orange-300 dark:border-orange-700 px-4 py-2 text-sm text-orange-800 dark:text-orange-200"
          role="banner"
          aria-label="Performance warning"
        >
          <div className="flex items-center justify-between">
            <span>
              Performance issues detected (FPS: {Math.round(performanceMetrics.fps)}). 
              Consider reducing visual effects or switching to a simpler background.
            </span>
            <button
              onClick={() => setShowPerformanceWarning(false)}
              className="ml-4 text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-200"
              aria-label="Dismiss performance warning"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Reduced motion banner */}
      {showReducedMotionBanner && (
        <div 
          className="fixed top-0 left-0 right-0 z-50 bg-yellow-100 dark:bg-yellow-900 border-b border-yellow-300 dark:border-yellow-700 px-4 py-2 text-sm text-yellow-800 dark:text-yellow-200"
          role="banner"
          aria-label="Accessibility notice"
        >
          Animations are disabled due to your reduced motion preference. You can still interact with the background if available.
        </div>
      )}

      {/* Low-end device warning */}
      {showLowEndWarning && (
        <div 
          className="fixed bottom-4 right-4 z-50 bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700 rounded-lg px-4 py-2 text-sm text-blue-800 dark:text-blue-200 max-w-sm"
          role="alert"
          aria-label="Device performance notice"
        >
          <div className="flex items-start">
            <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium">Optimized for your device</p>
              <p className="mt-1">Background effects have been automatically adjusted for better performance.</p>
            </div>
          </div>
        </div>
      )}

      {/* Canvas container - managed by CanvasLayerManager */}
      <div
        ref={containerRef}
        id="background-canvas-container"
        className={`fixed inset-0 ${className}`}
        style={{
          zIndex: -1,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none'
        }}
        aria-hidden="true"
      >
        {/* Canvas layers will be dynamically created and managed by CanvasLayerManager */}
        {!isActive && (
          <div 
            className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-600 text-sm pointer-events-none"
            style={{ zIndex: 1000 }}
          >
            Background animations disabled
          </div>
        )}
      </div>

      {/* Debug overlay in development */}
      {process.env.NODE_ENV === 'development' && isActive && (
        <div 
          className="fixed bottom-4 left-4 z-50 bg-gray-900/90 text-white rounded-lg px-3 py-2 text-xs font-mono max-w-xs"
          style={{ fontSize: '10px' }}
        >
          <div>Active Modules: {activeModules.size}</div>
          <div>Current: {currentModule || 'None'}</div>
          <div>FPS: {Math.round(performanceMetrics.fps)}</div>
          <div>Memory: {performanceMetrics.memoryUsage}MB</div>
          <div>Frame: {Math.round(performanceMetrics.frameTime)}ms</div>
          <div>WebGL: {deviceCapabilities.webgl ? '✓' : '✗'}</div>
          <div>Mobile: {deviceCapabilities.isMobile ? '✓' : '✗'}</div>
        </div>
      )}

      {/* Accessibility: Screen reader description of current background */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isActive && currentModule && (
          `Background animation active: ${currentModule}. ${isPaused ? 'Currently paused.' : 'Currently running.'}`
        )}
        {!isActive && 'Background animations are disabled.'}
      </div>
    </>
  )
}

export default CanvasHostV3
