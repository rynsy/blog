import React, { useEffect, useRef } from 'react'
import { useBackground } from '../contexts/BackgroundContext'
import { useTheme } from '../contexts/ThemeContext'

interface CanvasHostProps {
  className?: string
}

const CanvasHost: React.FC<CanvasHostProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { 
    currentModule, 
    isActive, 
    isPaused, 
    modules,
    _setModuleInstance,
    _moduleInstance 
  } = useBackground() as any // Type assertion needed for internal methods
  const { theme } = useTheme()

  // Initialize and manage module lifecycle
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !currentModule || !modules[currentModule] || !isActive) {
      // Clean up existing module if conditions aren't met
      if (_moduleInstance) {
        _moduleInstance.destroy()
        _setModuleInstance(null)
      }
      return
    }

    let mounted = true

    const initializeModule = async () => {
      try {
        // Load the module
        const moduleExport = await modules[currentModule].load()
        
        // Check if component is still mounted and module is still current
        if (!mounted || currentModule !== currentModule) return

        // Set canvas size
        const updateCanvasSize = () => {
          canvas.width = window.innerWidth
          canvas.height = window.innerHeight
        }
        updateCanvasSize()

        // Setup the module
        const moduleInstance = moduleExport.setup({
          canvas,
          width: canvas.width,
          height: canvas.height,
          theme
        })

        if (mounted) {
          _setModuleInstance(moduleInstance)
          
          // Start paused if needed
          if (isPaused || document.hidden) {
            moduleInstance.pause()
          }
        } else {
          // Component was unmounted, clean up
          moduleInstance.destroy()
        }
      } catch (error) {
        console.error('Failed to initialize background module:', error)
      }
    }

    initializeModule()

    return () => {
      mounted = false
      if (_moduleInstance) {
        _moduleInstance.destroy()
        _setModuleInstance(null)
      }
    }
  }, [currentModule, isActive, modules, theme])

  // Handle pause/resume
  useEffect(() => {
    if (!_moduleInstance) return

    if (isPaused || document.hidden) {
      _moduleInstance.pause()
    } else if (isActive) {
      _moduleInstance.resume()
    }
  }, [isPaused, isActive, _moduleInstance])

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      
      if (_moduleInstance?.onResize) {
        _moduleInstance.onResize(canvas.width, canvas.height)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [_moduleInstance])

  // Add reduced motion accessibility banner
  const [showReducedMotionBanner, setShowReducedMotionBanner] = React.useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = () => {
      setShowReducedMotionBanner(mediaQuery.matches && isActive && !isPaused)
    }

    handleChange()
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [isActive, isPaused])

  return (
    <>
      {/* Accessibility banner for reduced motion */}
      {showReducedMotionBanner && (
        <div 
          className="fixed top-0 left-0 right-0 z-50 bg-yellow-100 dark:bg-yellow-900 border-b border-yellow-300 dark:border-yellow-700 px-4 py-2 text-sm text-yellow-800 dark:text-yellow-200"
          role="banner"
          aria-label="Accessibility notice"
        >
          Animations are disabled due to your reduced motion preference.
        </div>
      )}
      
      {/* Background canvas */}
      <canvas
        ref={canvasRef}
        className={`fixed inset-0 pointer-events-none ${className}`}
        style={{ 
          zIndex: -1,
          width: '100vw',
          height: '100vh'
        }}
        aria-hidden="true"
      />
      
      {/* Background overlay for text readability */}
      {isActive && currentModule && (
        <div 
          className="fixed inset-0 bg-white/75 dark:bg-gray-900/75 pointer-events-none"
          style={{ zIndex: 0 }}
          aria-hidden="true"
        />
      )}
    </>
  )
}

export default CanvasHost