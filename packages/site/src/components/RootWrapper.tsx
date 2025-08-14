import React, { useState, useEffect } from 'react'
import { ThemeProvider } from '../contexts/ThemeContext'
// import { BackgroundProvider } from '../contexts/BackgroundContext' // Temporarily disabled
import { debug } from '../utils/debug'
import { initializeNewRelic } from '../utils/newrelic'

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
      {/* BackgroundProvider moved to layout.tsx, BackgroundClient temporarily disabled */}
      {children}
    </ThemeProvider>
  )
}

export default RootWrapper