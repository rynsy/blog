import { BackgroundModule, ModuleSetupParams } from '../../contexts/BackgroundContext'
import { BackgroundModuleV3, ModuleSetupParamsV3 } from '../interfaces/BackgroundSystemV3'

/**
 * Simplified fallback version of the knowledge graph for low-end devices
 * Uses minimal resources and simpler rendering
 */
class KnowledgeGraphFallback implements BackgroundModule {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private width: number
  private height: number
  private theme: 'light' | 'dark'
  private animationId: number | null = null
  private isRunning = false
  private time = 0
  private nodes: Array<{x: number, y: number, dx: number, dy: number, size: number, color: string}> = []

  constructor(params: ModuleSetupParams | ModuleSetupParamsV3) {
    this.canvas = params.canvas as HTMLCanvasElement
    this.ctx = this.canvas.getContext('2d')!
    this.width = params.width
    this.height = params.height
    this.theme = params.theme

    this.initializeSimpleNodes()
  }

  private initializeSimpleNodes() {
    const colors = this.theme === 'dark'
      ? ['#6366f1', '#8b5cf6', '#ec4899']
      : ['#4f46e5', '#7c3aed', '#db2777']

    // Create only 8 nodes for minimal resource usage
    this.nodes = Array.from({ length: 8 }, () => ({
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      dx: (Math.random() - 0.5) * 0.5,
      dy: (Math.random() - 0.5) * 0.5,
      size: 8 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)]
    }))
  }

  private render = () => {
    if (!this.isRunning) return

    this.ctx.clearRect(0, 0, this.width, this.height)
    this.time += 0.01

    // Update and render nodes with simple physics
    this.nodes.forEach(node => {
      // Simple bouncing physics
      node.x += node.dx
      node.y += node.dy

      if (node.x <= node.size || node.x >= this.width - node.size) {
        node.dx = -node.dx
      }
      if (node.y <= node.size || node.y >= this.height - node.size) {
        node.dy = -node.dy
      }

      // Draw simple node
      this.ctx.beginPath()
      this.ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2)
      this.ctx.fillStyle = node.color + '80'
      this.ctx.fill()
    })

    // Draw simple connections
    this.ctx.strokeStyle = this.theme === 'dark' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(79, 70, 229, 0.3)'
    this.ctx.lineWidth = 1

    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const dx = this.nodes[j].x - this.nodes[i].x
        const dy = this.nodes[j].y - this.nodes[i].y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < 150) {
          this.ctx.beginPath()
          this.ctx.moveTo(this.nodes[i].x, this.nodes[i].y)
          this.ctx.lineTo(this.nodes[j].x, this.nodes[j].y)
          this.ctx.stroke()
        }
      }
    }

    this.animationId = requestAnimationFrame(this.render)
  }

  pause(): void {
    this.isRunning = false
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  resume(): void {
    if (!this.isRunning) {
      this.isRunning = true
      this.render()
    }
  }

  destroy(): void {
    this.pause()
    this.ctx.clearRect(0, 0, this.width, this.height)
  }

  onThemeChange(theme: 'light' | 'dark'): void {
    this.theme = theme
    this.initializeSimpleNodes()
  }

  onResize(width: number, height: number): void {
    this.width = width
    this.height = height
    // Keep nodes in bounds
    this.nodes.forEach(node => {
      node.x = Math.min(node.x, width - node.size)
      node.y = Math.min(node.y, height - node.size)
    })
  }
}

export const setup = (params: ModuleSetupParams | ModuleSetupParamsV3): BackgroundModule => {
  const module = new KnowledgeGraphFallback(params)
  module.resume()
  return module
}