import React, { useState, useEffect } from 'react'
import { ThemeProvider } from '../contexts/ThemeContext'
import { BackgroundProvider } from '../contexts/BackgroundContext'

interface RootWrapperProps {
  children: React.ReactNode
}

const RootWrapper: React.FC<RootWrapperProps> = ({ children }) => {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // During SSR or initial render, don't wrap with providers
  if (!isMounted) {
    return <>{children}</>
  }

  return (
    <ThemeProvider>
      <BackgroundProvider>
        {children}
      </BackgroundProvider>
    </ThemeProvider>
  )
}

export default RootWrapper