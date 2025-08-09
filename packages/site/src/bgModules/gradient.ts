import { ModuleSetupParams, ModuleInstance } from '../types/background'

export const setup = (params: ModuleSetupParams): ModuleInstance => {
  const { canvas, theme, performance } = params
  const ctx = canvas.getContext('2d')
  
  if (!ctx) {
    throw new Error('Failed to get 2D context for gradient module')
  }

  let animationId: number | null = null
  let isRunning = false
  let hue = 0

  const render = () => {
    if (!ctx || !isRunning) return

    const width = canvas.width
    const height = canvas.height
    
    // Create animated gradient based on theme
    const time = Date.now() * 0.001
    hue = (time * 10) % 360

    const gradient = ctx.createLinearGradient(0, 0, width, height)
    
    if (theme === 'dark') {
      gradient.addColorStop(0, `hsl(${hue}, 30%, 15%)`)
      gradient.addColorStop(0.5, `hsl(${(hue + 60) % 360}, 25%, 20%)`)
      gradient.addColorStop(1, `hsl(${(hue + 120) % 360}, 20%, 10%)`)
    } else {
      gradient.addColorStop(0, `hsl(${hue}, 40%, 85%)`)
      gradient.addColorStop(0.5, `hsl(${(hue + 60) % 360}, 35%, 90%)`)
      gradient.addColorStop(1, `hsl(${(hue + 120) % 360}, 30%, 95%)`)
    }

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    // Continue animation if running
    if (isRunning) {
      animationId = requestAnimationFrame(render)
    }
  }

  const start = () => {
    if (!isRunning) {
      isRunning = true
      render()
    }
  }

  const stop = () => {
    isRunning = false
    if (animationId !== null) {
      cancelAnimationFrame(animationId)
      animationId = null
    }
  }

  return {
    pause: stop,
    resume: start,
    destroy: () => {
      stop()
      ctx?.clearRect(0, 0, canvas.width, canvas.height)
    },
    onThemeChange: (newTheme: string) => {
      // Theme change will be reflected in next render cycle
      if (isRunning) {
        render()
      }
    },
    onResize: (width: number, height: number) => {
      if (isRunning) {
        render()
      }
    }
  }
}