import React, { useEffect, useRef } from 'react'
import { useBackground } from '../contexts/BackgroundContext'
import { useTheme } from '../contexts/ThemeContext'
import { debugBackground } from '../utils/debug'

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

  // Determine if current module needs interactivity (like knowledge graph)
  const isInteractiveModule = currentModule === 'knowledge'

  // Initialize and manage module lifecycle
  useEffect(() => {
    debugBackground.canvas('Effect triggered', {
      hasCanvas: !!canvasRef.current,
      currentModule,
      hasModuleConfig: currentModule ? !!modules[currentModule] : false,
      isActive,
      availableModules: Object.keys(modules)
    })

    const canvas = canvasRef.current
    if (!canvas || !currentModule || !modules[currentModule] || !isActive) {
      debugBackground.canvas('Conditions not met, cleaning up...')
      // Clean up existing module if conditions aren't met
      if (_moduleInstance) {
        debugBackground.canvas('Destroying existing module instance')
        _moduleInstance.destroy()
        _setModuleInstance(null)
      }
      return
    }

    let mounted = true

    const initializeModule = async () => {
      try {
        debugBackground.canvas('Loading module:', currentModule)
        
        // Load the module
        const moduleExport = await modules[currentModule].load()
        debugBackground.canvas('Module loaded successfully:', moduleExport)
        
        // Check if component is still mounted and module is still current
        if (!mounted) {
          debugBackground.canvas('Component unmounted during load')
          return
        }

        // Set canvas size
        const updateCanvasSize = () => {
          canvas.width = window.innerWidth
          canvas.height = window.innerHeight
          debugBackground.canvas('Canvas sized to:', `${canvas.width}x${canvas.height}`)
        }
        updateCanvasSize()

        // Setup the module
        debugBackground.canvas('Setting up module with params:', {
          canvas: canvas.tagName,
          width: canvas.width,
          height: canvas.height,
          theme
        })
        
        const moduleInstance = moduleExport.setup({
          canvas,
          width: canvas.width,
          height: canvas.height,
          theme
        })

        debugBackground.canvas('Module instance created:', moduleInstance)

        if (mounted) {
          _setModuleInstance(moduleInstance)
          debugBackground.canvas('Module instance set in context')
          
          // Start paused if needed
          debugBackground.canvas('Checking pause conditions:', {
            isPaused,
            documentHidden: document.hidden,
            shouldPause: isPaused || document.hidden
          })
          if (isPaused || document.hidden) {
            debugBackground.canvas('Starting module in paused state')
            moduleInstance.pause()
          } else {
            debugBackground.canvas('Module should be running')
          }
        } else {
          // Component was unmounted, clean up
          debugBackground.canvas('Component unmounted, cleaning up')
          moduleInstance.destroy()
        }
      } catch (error) {
        debugBackground.canvas('Failed to initialize background module:', error)
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

    debugBackground.canvas('Pause/Resume effect triggered:', {
      isPaused,
      documentHidden: document.hidden,
      isActive,
      shouldPause: isPaused || document.hidden
    })

    if (isPaused || document.hidden) {
      debugBackground.canvas('Pausing module due to conditions')
      _moduleInstance.pause()
    } else if (isActive) {
      debugBackground.canvas('Resuming module')
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
        className={`fixed inset-0 ${isInteractiveModule ? 'pointer-events-auto' : 'pointer-events-none'} ${className}`}
        style={{ 
          zIndex: isInteractiveModule ? 1 : -1,  // Interactive modules go above content
          width: '100vw',
          height: '100vh',
          transition: 'opacity 0.2s ease-in-out'
        }}
        aria-hidden={!isInteractiveModule}
      />
      
      {/* Background overlay for text readability - temporarily disabled for testing */}
      {false && isActive && currentModule && (
        <div 
          className="fixed inset-0 bg-white/10 dark:bg-gray-900/10 pointer-events-none"
          style={{ zIndex: 0 }}
          aria-hidden="true"
        />
      )}
    </>
  )
}

export default CanvasHost