import React, { useState, useEffect } from 'react'
import { ThemeProvider } from '../contexts/ThemeContext'
import { BackgroundProvider } from '../contexts/BackgroundContext'
import { debug } from '../utils/debug'

// Lazy load background components to avoid SSR issues
const BackgroundClient = React.lazy(() => import("./BackgroundClient"))

// Global flag to track if we've ever initialized the background system
let globalBackgroundInitialized = false

interface RootWrapperProps {
  children: React.ReactNode
}

const RootWrapper: React.FC<RootWrapperProps> = ({ children }) => {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    if (!globalBackgroundInitialized) {
      console.log('🏠 RootWrapper: FIRST MOUNT - initializing background system')
      debug.log('🏠 RootWrapper:', 'FIRST MOUNT - initializing background system')
      globalBackgroundInitialized = true
    } else {
      console.log('🏠 RootWrapper: REMOUNT - background system already initialized (React Strict Mode)')
      debug.log('🏠 RootWrapper:', 'REMOUNT - background system already initialized (React Strict Mode)')
    }
    
    setIsMounted(true)
    
    return () => {
      console.log('🏠 RootWrapper: UNMOUNTED - this is expected in React Strict Mode during development')
      debug.log('🏠 RootWrapper:', 'UNMOUNTED - this is expected in React Strict Mode during development')
    }
  }, [])

  // Only log on significant state changes, not every render
  if (!isMounted && !globalBackgroundInitialized) {
    console.log('🏠 RootWrapper: Initial render - SSR phase')
  }

  // During SSR or initial render, don't wrap with providers
  if (!isMounted) {
    return <>{children}</>
  }

  return (
    <ThemeProvider>
      <BackgroundProvider>
        {/* Background engine at the root level - persists across page transitions */}
        <React.Suspense fallback={null}>
          <BackgroundClient />
        </React.Suspense>
        {children}
      </BackgroundProvider>
    </ThemeProvider>
  )
}

export default RootWrapper