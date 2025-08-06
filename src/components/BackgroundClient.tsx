import React, { useEffect } from 'react'
import { useBackground } from '../contexts/BackgroundContext'
import { registerDefaultModules } from '../bgModules/registry'
import { debugBackground } from '../utils/debug'
import CanvasHost from './CanvasHost'
import ControlTray from './ControlTray'

const BackgroundClient: React.FC = () => {
  const { registerModule, modules, currentModule, isActive } = useBackground()

  useEffect(() => {
    // Check if modules are already registered to avoid duplicate registration
    if (Object.keys(modules).length === 0) {
      console.log('🎨 BackgroundClient: MOUNTING - registering background modules')
      debugBackground.client('🚀 BackgroundClient MOUNTING - registering background modules')
      registerDefaultModules(registerModule)
    } else {
      console.log('🎨 BackgroundClient: REMOUNTING - modules already registered')
      debugBackground.client('🔄 BackgroundClient REMOUNTING - modules already registered, count:', Object.keys(modules).length)
    }
    
    return () => {
      console.log('🎨 BackgroundClient: UNMOUNTING - cleaning up')
      debugBackground.client('💥 BackgroundClient UNMOUNTING - cleaning up')
    }
  }, [registerModule])

  console.log('🎨 BackgroundClient: Rendering, current state:', {
    moduleCount: Object.keys(modules).length,
    currentModule,
    isActive
  })

  useEffect(() => {
    debugBackground.client('State update:', {
      registeredModules: Object.keys(modules),
      currentModule,
      isActive,
      totalModules: Object.keys(modules).length
    })
  }, [modules, currentModule, isActive])

  // Only log on significant state changes, not every render
  if (Object.keys(modules).length > 0) {
    debugBackground.client('Ready with modules:', Object.keys(modules))
  }

  return (
    <>
      <CanvasHost />
      <ControlTray />
    </>
  )
}

export default BackgroundClient