import React, { useState, useEffect } from 'react'
import { ThemeProvider } from '../contexts/ThemeContext'
import { BackgroundProviderV3 } from '../contexts/BackgroundContextV3'
import { debug } from '../utils/debug'
import { initializeNewRelic } from '../utils/newrelic'
import { registerDefaultModulesV3 } from '../bgModules/registryV3'

// BackgroundClient temporarily removed
// const BackgroundClient = React.lazy(() => import("./BackgroundClient"))

// Global flag to track if we've ever initialized the background system
let globalBackgroundInitialized = false

interface RootWrapperProps {
  children: React.ReactNode
}

const RootWrapper: React.FC<RootWrapperProps> = ({ children }) => {
  // Use a more specific client-only check to avoid hydration mismatches
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // This only runs on the client
    setIsClient(true)
    
    // Initialize New Relic as early as possible
    initializeNewRelic()
    
    if (!globalBackgroundInitialized) {
      console.log('🏠 RootWrapper: FIRST MOUNT - initializing background system')
      debug.log('🏠 RootWrapper:', 'FIRST MOUNT - initializing background system')
      
      // Initialize V3 background system
      registerDefaultModulesV3().then(() => {
        console.log('✅ V3 background system initialized successfully')
      }).catch((error) => {
        console.error('❌ Failed to initialize V3 background system:', error)
      })
      
      globalBackgroundInitialized = true
    } else {
      console.log('🏠 RootWrapper: REMOUNT - background system already initialized (React Strict Mode)')
      debug.log('🏠 RootWrapper:', 'REMOUNT - background system already initialized (React Strict Mode)')
    }
    
    return () => {
      console.log('🏠 RootWrapper: UNMOUNTED - this is expected in React Strict Mode during development')
      debug.log('🏠 RootWrapper:', 'UNMOUNTED - this is expected in React Strict Mode during development')
    }
  }, [])

  // Remove all console logs from render to avoid SSR/client mismatch
  // The providers must always be present for consistent hydration
  return (
    <ThemeProvider>
      <BackgroundProviderV3>
        {children}
      </BackgroundProviderV3>
    </ThemeProvider>
  )
}

export default RootWrapper