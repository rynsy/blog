import React, { useEffect } from 'react'
import { useBackground } from '../contexts/BackgroundContext'

interface BackgroundSwitcherProps {
  module: string
}

const BackgroundSwitcher: React.FC<BackgroundSwitcherProps> = ({ module }) => {
  const { setCurrentModule } = useBackground()
  
  useEffect(() => {
    console.log(`🌟 BackgroundSwitcher: Switching to ${module} background`)
    setCurrentModule(module)
  }, [module, setCurrentModule])
  
  return null // This component doesn't render anything
}

export default BackgroundSwitcher