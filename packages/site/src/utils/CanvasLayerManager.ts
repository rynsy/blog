import { CanvasRequirements, CanvasLayer, ModuleRegistryEntryV3 } from '../interfaces/BackgroundSystemV3'

/**
 * Manages layered canvas system for multiple background modules
 * Handles canvas creation, layering, and resource management
 */
export class CanvasLayerManager {
  private layers = new Map<string, CanvasLayer>()
  private canvasContainer: HTMLElement | null = null
  private nextZIndex = 1
  private resizeObserver: ResizeObserver | null = null
  private pixelRatio = window.devicePixelRatio || 1

  // Pre-defined layer types
  private readonly LAYER_TYPES = {
    BACKGROUND: 'background-layer',
    INTERACTIVE: 'interactive-layer',
    OVERLAY: 'overlay-layer'
  } as const

  constructor() {
    this.initializeContainer()
    this.setupResizeObserver()
    this.createDefaultLayers()
  }

  /**
   * Create a canvas layer for a module
   */
  async createLayer(module: ModuleRegistryEntryV3 | string): Promise<HTMLCanvasElement> {
    // Handle string ID (fallback for simpler calls)
    if (typeof module === 'string') {
      const requirements = this.getDefaultRequirements()
      requirements.interactive = true // Assume interactive for direct calls
      return this.createDedicatedLayer(module, requirements)
    }

    const requirements = module.getCanvasRequirements ? 
      module.getCanvasRequirements() : 
      this.getDefaultRequirements()

    // Check if module needs a dedicated layer
    if (requirements.dedicated) {
      return this.createDedicatedLayer(module.id, requirements)
    }

    // Use shared layer based on requirements
    const layerType = this.determineLayerType(requirements)
    const existingLayer = this.layers.get(layerType)
    
    if (existingLayer) {
      return existingLayer.canvas
    }

    // Create new shared layer if needed
    return this.createSharedLayer(layerType, requirements)
  }

  /**
   * Create a dedicated layer for a specific module
   */
  createDedicatedLayer(moduleId: string, requirements: CanvasRequirements): HTMLCanvasElement {
    const layerId = `${moduleId}-layer`
    
    // Remove existing layer if it exists
    this.releaseLayer(layerId)

    const canvas = this.createCanvasElement(requirements)
    const zIndex = requirements.zIndex || this.nextZIndex++

    const layer: CanvasLayer = {
      id: layerId,
      canvas,
      zIndex,
      visible: true,
      interactive: requirements.interactive,
      moduleId
    }

    this.layers.set(layerId, layer)
    this.addCanvasToContainer(canvas, layer)

    console.log(`🎨 Created dedicated canvas layer for module: ${moduleId}`)
    return canvas
  }

  /**
   * Get an existing layer by ID
   */
  getLayer(layerId: string): CanvasLayer | undefined {
    return this.layers.get(layerId)
  }

  /**
   * Get all layers
   */
  getAllLayers(): CanvasLayer[] {
    return Array.from(this.layers.values()).sort((a, b) => a.zIndex - b.zIndex)
  }

  /**
   * Show/hide a layer
   */
  setLayerVisibility(layerId: string, visible: boolean): void {
    const layer = this.layers.get(layerId)
    if (layer) {
      layer.visible = visible
      layer.canvas.style.display = visible ? 'block' : 'none'
    }
  }

  /**
   * Update layer z-index
   */
  setLayerZIndex(layerId: string, zIndex: number): void {
    const layer = this.layers.get(layerId)
    if (layer) {
      layer.zIndex = zIndex
      layer.canvas.style.zIndex = zIndex.toString()
    }
  }

  /**
   * Release a layer and clean up resources
   */
  releaseLayer(layerId: string): void {
    const layer = this.layers.get(layerId)
    if (layer) {
      // Remove canvas from DOM
      if (layer.canvas.parentNode) {
        layer.canvas.parentNode.removeChild(layer.canvas)
      }

      // Clear canvas context and resources
      this.clearCanvas(layer.canvas)
      
      this.layers.delete(layerId)
      console.log(`🗑️ Released canvas layer: ${layerId}`)
    }
  }

  /**
   * Resize all canvases to match container size
   */
  resizeAllLayers(): void {
    if (!this.canvasContainer) return

    const containerRect = this.canvasContainer.getBoundingClientRect()
    const width = Math.floor(containerRect.width * this.pixelRatio)
    const height = Math.floor(containerRect.height * this.pixelRatio)
    const displayWidth = containerRect.width
    const displayHeight = containerRect.height

    for (const layer of this.layers.values()) {
      // Set actual size in memory (scaled by pixel ratio)
      layer.canvas.width = width
      layer.canvas.height = height

      // Set display size (CSS pixels)
      layer.canvas.style.width = `${displayWidth}px`
      layer.canvas.style.height = `${displayHeight}px`

      // Scale context for high-DPI displays
      const ctx = layer.canvas.getContext('2d')
      if (ctx && this.pixelRatio !== 1) {
        ctx.scale(this.pixelRatio, this.pixelRatio)
      }
    }

    console.log(`📐 Resized all canvas layers to ${displayWidth}x${displayHeight} (${width}x${height} actual)`)
  }

  /**
   * Clear all layers
   */
  clearAllLayers(): void {
    for (const layer of this.layers.values()) {
      this.clearCanvas(layer.canvas)
    }
  }

  /**
   * Get canvas layer statistics
   */
  getStatistics() {
    const stats = {
      totalLayers: this.layers.size,
      visibleLayers: 0,
      interactiveLayers: 0,
      dedicatedLayers: 0,
      sharedLayers: 0,
      totalMemoryMB: 0,
      layerDetails: [] as any[]
    }

    for (const layer of this.layers.values()) {
      if (layer.visible) stats.visibleLayers++
      if (layer.interactive) stats.interactiveLayers++
      if (layer.moduleId) stats.dedicatedLayers++
      else stats.sharedLayers++

      const memoryMB = this.calculateCanvasMemory(layer.canvas)
      stats.totalMemoryMB += memoryMB

      stats.layerDetails.push({
        id: layer.id,
        moduleId: layer.moduleId,
        zIndex: layer.zIndex,
        visible: layer.visible,
        interactive: layer.interactive,
        size: `${layer.canvas.width}x${layer.canvas.height}`,
        memoryMB: Math.round(memoryMB * 100) / 100
      })
    }

    stats.totalMemoryMB = Math.round(stats.totalMemoryMB * 100) / 100
    return stats
  }

  /**
   * Cleanup all resources
   */
  cleanup(): void {
    // Release all layers
    for (const layerId of Array.from(this.layers.keys())) {
      this.releaseLayer(layerId)
    }

    // Disconnect resize observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }

    // Remove container
    if (this.canvasContainer && this.canvasContainer.parentNode) {
      this.canvasContainer.parentNode.removeChild(this.canvasContainer)
    }
  }

  private initializeContainer(): void {
    // Create container if it doesn't exist
    let container = document.getElementById('background-canvas-container')
    
    if (!container) {
      container = document.createElement('div')
      container.id = 'background-canvas-container'
      container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        z-index: -1;
      `
      document.body.appendChild(container)
    }

    this.canvasContainer = container
  }

  private setupResizeObserver(): void {
    if (!this.canvasContainer || !('ResizeObserver' in window)) {
      // Fallback to window resize event
      window.addEventListener('resize', () => {
        setTimeout(() => this.resizeAllLayers(), 100)
      })
      return
    }

    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === this.canvasContainer) {
          this.resizeAllLayers()
          break
        }
      }
    })

    this.resizeObserver.observe(this.canvasContainer)
  }

  private createDefaultLayers(): void {
    // Create default shared layers
    const backgroundRequirements: CanvasRequirements = {
      dedicated: false,
      interactive: false,
      zIndex: 1,
      alpha: true,
      preserveDrawingBuffer: false,
      contextType: 'canvas2d'
    }

    const interactiveRequirements: CanvasRequirements = {
      dedicated: false,
      interactive: true,
      zIndex: 10,
      alpha: true,
      preserveDrawingBuffer: false,
      contextType: 'canvas2d'
    }

    const overlayRequirements: CanvasRequirements = {
      dedicated: false,
      interactive: false,
      zIndex: 20,
      alpha: true,
      preserveDrawingBuffer: false,
      contextType: 'canvas2d'
    }

    this.createSharedLayer(this.LAYER_TYPES.BACKGROUND, backgroundRequirements)
    this.createSharedLayer(this.LAYER_TYPES.INTERACTIVE, interactiveRequirements)
    this.createSharedLayer(this.LAYER_TYPES.OVERLAY, overlayRequirements)
  }

  private createSharedLayer(layerId: string, requirements: CanvasRequirements): HTMLCanvasElement {
    if (this.layers.has(layerId)) {
      return this.layers.get(layerId)!.canvas
    }

    const canvas = this.createCanvasElement(requirements)
    const layer: CanvasLayer = {
      id: layerId,
      canvas,
      zIndex: requirements.zIndex || this.nextZIndex++,
      visible: true,
      interactive: requirements.interactive
    }

    this.layers.set(layerId, layer)
    this.addCanvasToContainer(canvas, layer)

    console.log(`🎨 Created shared canvas layer: ${layerId}`)
    return canvas
  }

  private createCanvasElement(requirements: CanvasRequirements): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    
    // Set basic styles
    canvas.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: ${requirements.interactive ? 'auto' : 'none'};
    `

    // Set canvas size
    if (this.canvasContainer) {
      const containerRect = this.canvasContainer.getBoundingClientRect()
      const width = Math.floor(containerRect.width * this.pixelRatio)
      const height = Math.floor(containerRect.height * this.pixelRatio)
      
      canvas.width = width || 1920
      canvas.height = height || 1080
      canvas.style.width = `${containerRect.width || 1920}px`
      canvas.style.height = `${containerRect.height || 1080}px`
    }

    // Configure context attributes for WebGL if needed
    if (requirements.contextType.includes('webgl')) {
      // Context will be created by the module with the right attributes
    }

    return canvas
  }

  private addCanvasToContainer(canvas: HTMLCanvasElement, layer: CanvasLayer): void {
    if (!this.canvasContainer) return

    canvas.style.zIndex = layer.zIndex.toString()
    this.canvasContainer.appendChild(canvas)
  }

  private clearCanvas(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }

    // For WebGL contexts, we'd need to clear them differently
    const glCtx = canvas.getContext('webgl') || canvas.getContext('webgl2')
    if (glCtx) {
      glCtx.clear(glCtx.COLOR_BUFFER_BIT | glCtx.DEPTH_BUFFER_BIT)
    }
  }

  private determineLayerType(requirements: CanvasRequirements): string {
    if (requirements.interactive) {
      return this.LAYER_TYPES.INTERACTIVE
    }
    
    if (requirements.zIndex && requirements.zIndex > 15) {
      return this.LAYER_TYPES.OVERLAY
    }
    
    return this.LAYER_TYPES.BACKGROUND
  }

  private getDefaultRequirements(): CanvasRequirements {
    return {
      dedicated: false,
      interactive: false,
      zIndex: 5,
      alpha: true,
      preserveDrawingBuffer: false,
      contextType: 'canvas2d'
    }
  }

  private calculateCanvasMemory(canvas: HTMLCanvasElement): number {
    // Rough estimate: width * height * 4 bytes per pixel (RGBA)
    const bytesPerPixel = 4
    const totalPixels = canvas.width * canvas.height
    const bytesUsed = totalPixels * bytesPerPixel
    return bytesUsed / (1024 * 1024) // Convert to MB
  }
}
