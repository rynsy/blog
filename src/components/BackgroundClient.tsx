import React, { useEffect } from 'react'
import { useBackground } from '../contexts/BackgroundContext'
import { registerDefaultModules } from '../bgModules/registry'
import CanvasHost from './CanvasHost'
import ControlTray from './ControlTray'

const BackgroundClient: React.FC = () => {
  const { registerModule } = useBackground()

  useEffect(() => {
    registerDefaultModules(registerModule)
  }, [registerModule])

  return (
    <>
      <CanvasHost />
      <ControlTray />
    </>
  )
}

export default BackgroundClient