// Debug utility for development-only console logging
const isDev = process.env.NODE_ENV === 'development'
console.log('🔍 Debug utility loaded, isDev:', isDev, 'NODE_ENV:', process.env.NODE_ENV)

export const debug = {
  log: (prefix: string, message: string, data?: any) => {
    if (isDev) {
      if (data) {
        console.log(`${prefix} ${message}`, data)
      } else {
        console.log(`${prefix} ${message}`)
      }
    }
  },
  
  warn: (prefix: string, message: string, data?: any) => {
    if (isDev) {
      if (data) {
        console.warn(`${prefix} ${message}`, data)
      } else {
        console.warn(`${prefix} ${message}`)
      }
    }
  },
  
  error: (prefix: string, message: string, data?: any) => {
    if (isDev) {
      if (data) {
        console.error(`${prefix} ${message}`, data)
      } else {
        console.error(`${prefix} ${message}`)
      }
    }
  }
}

// Export specific debug functions for each component
export const debugBackground = {
  client: (message: string, data?: any) => debug.log('🎨 BackgroundClient:', message, data),
  canvas: (message: string, data?: any) => debug.log('🖼️ CanvasHost:', message, data),
  controls: (message: string, data?: any) => debug.log('🎛️ ControlTray:', message, data),
  gradient: (message: string, data?: any) => debug.log('🌈 GradientModule:', message, data),
}