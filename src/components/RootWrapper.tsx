import React, { useState, useEffect } from 'react'
import { ThemeProvider } from '../contexts/ThemeContext'

interface RootWrapperProps {
  children: React.ReactNode
}

const RootWrapper: React.FC<RootWrapperProps> = ({ children }) => {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // During SSR or initial render, don't wrap with ThemeProvider
  if (!isMounted) {
    return <>{children}</>
  }

  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  )
}

export default RootWrapper