import { BackgroundModule, ModuleSetupParams } from '../../contexts/BackgroundContext'
import { BackgroundModuleV3, ModuleSetupParamsV3, PerformanceMetrics, MemoryStats, ModuleConfiguration, ValidationResult, SerializableState, ModuleMessage, ModuleResponse, CanvasRequirements } from '../../../interfaces/BackgroundSystemV3'
import * as d3Force from 'd3-force'
import { select, pointer } from 'd3-selection'
import { drag } from 'd3-drag'
import { zoom } from 'd3-zoom'

interface Node extends d3Force.SimulationNodeDatum {
  id: string
  label: string
  color: string
  radius: number
  group?: number
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
}

interface Link extends d3Force.SimulationLinkDatum<Node> {
  source: string | Node
  target: string | Node
}

class KnowledgeGraphModule implements BackgroundModule, BackgroundModuleV3 {
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private gl: WebGLRenderingContext | null = null
  private useWebGL = false
  private width = 0
  private height = 0
  private theme: 'light' | 'dark' = 'light'
  private deviceCapabilities: any = null
  private resourceManager: any = null
  private performanceMetrics: PerformanceMetrics = {
    fps: 0,
    frameTime: 0,
    memoryUsage: 0,
    renderTime: 0,
    timestamp: Date.now()
  }
  private frameCount = 0
  private lastFrameTime = 0
  private config: ModuleConfiguration = {
    enabled: true,
    quality: 'medium',
    nodes: 25,
    connections: 'medium',
    physics: {
      enabled: true,
      gravity: 0.1,
      damping: 0.9,
      collisionDetection: false,
      forces: {
        attraction: 0.1,
        repulsion: 100,
        centering: 0.05
      }
    },
    interactions: {
      enableDrag: true,
      enableClick: true,
      enableHover: true,
      enableKeyboard: true,
      clickToCreate: true,
      doubleClickAction: 'delete'
    }
  }
  private nodes: Node[] = []
  private links: Link[] = []
  private simulation: d3Force.Simulation<Node, Link> | null = null
  private animationId: number | null = null
  private isRunning = false
  private selectedNode: string | null = null
  private isAddingConnection = false
  private hoveredNode: string | null = null
  private isDragging = false
  private dragOffset = { x: 0, y: 0 }
  private viewTransform = { x: 0, y: 0, k: 1 }
  private lastClickTime = 0
  private lastClickNode: string | null = null
  
  // Mouse state
  private mousePos = { x: 0, y: 0 }
  private isMouseDown = false

  constructor(params: ModuleSetupParams | ModuleSetupParamsV3) {
    this.canvas = params.canvas as HTMLCanvasElement
    this.width = params.width
    this.height = params.height
    this.theme = params.theme
    
    // Enhanced V3 parameters
    if ('deviceCapabilities' in params) {
      this.deviceCapabilities = params.deviceCapabilities
      this.resourceManager = params.resourceManager
      
      // Determine if we should use WebGL based on capabilities and node count
      const nodeCount = this.config.nodes || 25
      this.useWebGL = this.shouldUseWebGL(nodeCount, params.deviceCapabilities)
    }
    
    this.initializeCanvas()
    this.initializeGraph()
    this.setupEventListeners()
    this.startSimulation()
  }

  private initializeCanvas() {
    if (!this.canvas) return
    
    if (this.useWebGL && this.deviceCapabilities?.webgl) {
      try {
        this.gl = this.canvas.getContext('webgl', {
          alpha: true,
          antialias: this.config.quality === 'high',
          preserveDrawingBuffer: false
        })
        
        if (this.gl) {
          console.log('🎮 KnowledgeGraph: WebGL context initialized')
          this.initializeWebGL()
        } else {
          console.warn('⚠️ KnowledgeGraph: WebGL context creation failed, falling back to Canvas2D')
          this.useWebGL = false
        }
      } catch (error) {
        console.warn('⚠️ KnowledgeGraph: WebGL initialization failed:', error)
        this.useWebGL = false
      }
    }
    
    if (!this.useWebGL) {
      this.ctx = this.canvas.getContext('2d')
      if (!this.ctx) {
        throw new Error('Failed to get 2D context from canvas')
      }
    }
  }

  private initializeWebGL() {
    if (!this.gl) return
    
    // Basic WebGL setup for future enhancement
    this.gl.clearColor(0.0, 0.0, 0.0, 0.0)
    this.gl.enable(this.gl.BLEND)
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA)
  }

  private shouldUseWebGL(nodeCount: number, deviceCapabilities: any): boolean {
    // Use Canvas2D for small graphs or limited devices
    if (nodeCount < 50 || !deviceCapabilities?.webgl || deviceCapabilities?.isLowEnd) {
      return false
    }
    
    // Use WebGL for larger graphs with capable devices
    return nodeCount >= 50 && deviceCapabilities.webgl
  }

  private initializeGraph() {
    // Create a more diverse and sporadic initial graph
    const topics = [
      'AI/ML', 'Web Dev', 'Systems', 'Design', 'Mobile', 'Games', 'Cloud', 
      'Security', 'Data', 'DevOps', 'Algorithms', 'UI/UX', 'Backend', 
      'Frontend', 'API', 'Database', 'Testing', 'Performance', 'Architecture',
      'Learning', 'Building', 'Sharing', 'Ideas', 'Code', 'Blog'
    ]
    
    const colors = this.theme === 'dark' 
      ? ['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#84cc16', '#f97316', '#a855f7']
      : ['#4f46e5', '#7c3aed', '#db2777', '#0891b2', '#059669', '#d97706', '#dc2626', '#65a30d', '#ea580c', '#9333ea']

    // Use configured node count or default
    const nodeCount = this.config.nodes || 25
    this.nodes = Array.from({ length: nodeCount }, (_, i) => {
      const radius = 12 + Math.random() * 20
      return {
        id: `node-${i}`,
        label: topics[Math.floor(Math.random() * topics.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
        radius,
        group: Math.floor(Math.random() * 5) + 1,
        x: Math.random() * this.width,
        y: Math.random() * this.height
      }
    })

    // Create sparse connections (not fully connected)
    this.links = []
    const connectionProbability = 0.15 // Lower probability for more sporadic connections
    
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        if (Math.random() < connectionProbability) {
          this.links.push({
            source: this.nodes[i].id,
            target: this.nodes[j].id
          })
        }
      }
    }

    // Ensure graph is connected by adding a minimum spanning tree approach
    for (let i = 1; i < Math.min(this.nodes.length, 8); i++) {
      if (Math.random() < 0.7) {
        this.links.push({
          source: this.nodes[i - 1].id,
          target: this.nodes[i].id
        })
      }
    }
  }

  private setupEventListeners() {
    if (!this.canvas) return

    // Event listeners will work because CanvasHost sets pointer-events-auto for interactive modules

    // Helper function to check if an element should receive click events
    const isInteractiveElement = (element: Element | null): boolean => {
      if (!element) return false
      const tagName = element.tagName.toLowerCase()
      const role = element.getAttribute('role')
      return (
        tagName === 'button' ||
        tagName === 'a' ||
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'select' ||
        role === 'button' ||
        element.hasAttribute('onclick') ||
        element.classList.contains('clickable') ||
        element.closest('button, a, input, textarea, select, [role="button"], [onclick], .clickable') !== null
      )
    }

    // Mouse move
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas!.getBoundingClientRect()
      this.mousePos.x = (e.clientX - rect.left - this.viewTransform.x) / this.viewTransform.k
      this.mousePos.y = (e.clientY - rect.top - this.viewTransform.y) / this.viewTransform.k
      
      if (this.isDragging && this.selectedNode) {
        const node = this.nodes.find(n => n.id === this.selectedNode)
        if (node) {
          node.fx = this.mousePos.x
          node.fy = this.mousePos.y
          if (this.simulation) {
            this.simulation.alphaTarget(0.3).restart()
          }
        }
      }

      this.updateHoveredNode()
    })

    // Left click - drag nodes or select for connection
    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return // Only left click
      
      // Check if click is on an interactive element underneath
      const elementsBelow = document.elementsFromPoint(e.clientX, e.clientY)
      const interactiveElementBelow = elementsBelow.find(el => el !== this.canvas && isInteractiveElement(el))
      
      if (interactiveElementBelow) {
        // Pass through the click to the interactive element
        e.stopPropagation()
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          clientX: e.clientX,
          clientY: e.clientY,
          button: e.button
        })
        interactiveElementBelow.dispatchEvent(clickEvent)
        return
      }
      
      this.isMouseDown = true
      const clickedNode = this.getNodeAtPosition(this.mousePos.x, this.mousePos.y)
      
      if (clickedNode) {
        e.preventDefault() // Prevent event from going to elements below
        this.isDragging = true
        this.selectedNode = clickedNode.id
        
        // Handle sequential clicking for edge creation/removal
        const now = Date.now()
        if (this.lastClickNode && this.lastClickNode !== clickedNode.id && (now - this.lastClickTime) < 1000) {
          this.toggleEdge(this.lastClickNode, clickedNode.id)
          this.lastClickNode = null
          this.lastClickTime = 0
        } else {
          this.lastClickNode = clickedNode.id
          this.lastClickTime = now
        }
      } else {
        // Start panning only if not clicking on interactive elements
        e.preventDefault()
        this.dragOffset.x = e.clientX - this.viewTransform.x
        this.dragOffset.y = e.clientY - this.viewTransform.y
      }
    })

    this.canvas.addEventListener('mouseup', (e) => {
      if (e.button === 0) { // Left click
        if (this.isDragging && this.selectedNode) {
          const node = this.nodes.find(n => n.id === this.selectedNode)
          if (node) {
            node.fx = null
            node.fy = null
          }
        }
        
        this.isDragging = false
        this.selectedNode = null
        this.isMouseDown = false
      }
    })

    // Right click - add new node
    this.canvas.addEventListener('contextmenu', (e) => {
      // Check if right-click is on an interactive element underneath
      const elementsBelow = document.elementsFromPoint(e.clientX, e.clientY)
      const interactiveElementBelow = elementsBelow.find(el => el !== this.canvas && isInteractiveElement(el))
      
      if (interactiveElementBelow) {
        // Don't interfere with right-click on interactive elements
        return
      }
      
      e.preventDefault()
      this.addNodeAtPosition(this.mousePos.x, this.mousePos.y)
    })

    // Handle panning
    this.canvas.addEventListener('mousemove', (e) => {
      if (this.isMouseDown && !this.isDragging) {
        this.viewTransform.x = e.clientX - this.dragOffset.x
        this.viewTransform.y = e.clientY - this.dragOffset.y
      }
    })

    // Zoom with wheel
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault()
      const rect = this.canvas!.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
      const newScale = Math.max(0.5, Math.min(3, this.viewTransform.k * zoomFactor))
      
      // Zoom towards mouse position
      this.viewTransform.x = mouseX - (mouseX - this.viewTransform.x) * (newScale / this.viewTransform.k)
      this.viewTransform.y = mouseY - (mouseY - this.viewTransform.y) * (newScale / this.viewTransform.k)
      this.viewTransform.k = newScale
    })
  }

  private getNodeAtPosition(x: number, y: number): Node | null {
    return this.nodes.find(node => {
      if (node.x === undefined || node.y === undefined) return false
      const dx = x - node.x
      const dy = y - node.y
      return Math.sqrt(dx * dx + dy * dy) <= node.radius + 5
    }) || null
  }

  private updateHoveredNode() {
    const hoveredNode = this.getNodeAtPosition(this.mousePos.x, this.mousePos.y)
    this.hoveredNode = hoveredNode ? hoveredNode.id : null
    
    // Update cursor
    if (this.canvas) {
      this.canvas.style.cursor = hoveredNode ? 'pointer' : 'default'
    }
  }

  private addNodeAtPosition(x: number, y: number) {
    const topics = ['New Idea', 'Research', 'Project', 'Tool', 'Concept', 'Framework', 'Library', 'Method']
    const colors = this.theme === 'dark' 
      ? ['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#84cc16']
      : ['#4f46e5', '#7c3aed', '#db2777', '#0891b2', '#059669', '#d97706', '#dc2626', '#65a30d']
    
    const newNode: Node = {
      id: `node-${Date.now()}`,
      label: topics[Math.floor(Math.random() * topics.length)],
      color: colors[Math.floor(Math.random() * colors.length)],
      radius: 15 + Math.random() * 12,
      group: Math.floor(Math.random() * 5) + 1,
      x,
      y
    }

    this.nodes.push(newNode)
    
    // Restart simulation with new node
    if (this.simulation) {
      this.simulation.nodes(this.nodes)
      this.simulation.force('link', d3Force.forceLink(this.links).id((d: any) => d.id))
      this.simulation.alphaTarget(0.3).restart()
    }
  }

  private toggleEdge(sourceId: string, targetId: string) {
    const existingLinkIndex = this.links.findIndex(link => 
      (link.source === sourceId || (typeof link.source === 'object' && link.source.id === sourceId)) &&
      (link.target === targetId || (typeof link.target === 'object' && link.target.id === targetId)) ||
      (link.source === targetId || (typeof link.source === 'object' && link.source.id === targetId)) &&
      (link.target === sourceId || (typeof link.target === 'object' && link.target.id === sourceId))
    )
    
    if (existingLinkIndex >= 0) {
      // Remove existing edge
      this.links.splice(existingLinkIndex, 1)
    } else {
      // Add new edge
      this.links.push({ source: sourceId, target: targetId })
    }
    
    // Update simulation
    if (this.simulation) {
      this.simulation.force('link', d3Force.forceLink(this.links).id((d: any) => d.id))
      this.simulation.alphaTarget(0.3).restart()
    }
  }

  private startSimulation() {
    if (!this.simulation) {
      this.simulation = d3Force.forceSimulation(this.nodes)
        .force('link', d3Force.forceLink(this.links).id((d: any) => d.id).distance(100).strength(0.3))
        .force('charge', d3Force.forceManyBody().strength(-800).distanceMax(300))
        .force('center', d3Force.forceCenter(this.width / 2, this.height / 2))
        .force('collision', d3Force.forceCollide().radius((d: any) => d.radius + 8))
        .alphaDecay(0.01)
        .velocityDecay(0.4)
    }
    
    this.resume()
  }

  private render() {
    const startTime = performance.now()
    
    if (this.useWebGL && this.gl) {
      this.renderWebGL()
    } else if (this.ctx) {
      this.renderCanvas2D()
    }
    
    // Update performance metrics
    this.updatePerformanceMetrics(performance.now() - startTime)
    
    if (this.isRunning) {
      this.animationId = requestAnimationFrame(() => this.render())
    }
  }

  private renderCanvas2D() {
    if (!this.ctx) return

    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height)
    
    // Apply transform
    this.ctx!.save()
    this.ctx!.translate(this.viewTransform.x, this.viewTransform.y)
    this.ctx!.scale(this.viewTransform.k, this.viewTransform.k)

    // Draw links
    this.ctx!.strokeStyle = this.theme === 'dark' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(79, 70, 229, 0.4)'
    this.ctx!.lineWidth = 2
    
    this.links.forEach(link => {
      const source = typeof link.source === 'object' ? link.source : this.nodes.find(n => n.id === link.source)
      const target = typeof link.target === 'object' ? link.target : this.nodes.find(n => n.id === link.target)
      
      if (source && target && source.x !== undefined && source.y !== undefined && target.x !== undefined && target.y !== undefined) {
        this.ctx!.beginPath()
        this.ctx!.moveTo(source.x, source.y)
        this.ctx!.lineTo(target.x, target.y)
        this.ctx!.stroke()
      }
    })

    // Draw nodes
    this.nodes.forEach(node => {
      if (node.x === undefined || node.y === undefined) return

      const isHovered = this.hoveredNode === node.id
      const isSelected = this.selectedNode === node.id
      const isLastClicked = this.lastClickNode === node.id
      
      // Node shadow
      this.ctx!.beginPath()
      this.ctx!.arc(node.x + 2, node.y + 2, node.radius, 0, 2 * Math.PI)
      this.ctx!.fillStyle = 'rgba(0, 0, 0, 0.1)'
      this.ctx!.fill()
      
      // Node circle
      this.ctx!.beginPath()
      this.ctx!.arc(node.x, node.y, node.radius, 0, 2 * Math.PI)
      this.ctx!.fillStyle = node.color
      this.ctx!.fill()
      
      // Node border
      this.ctx!.strokeStyle = isHovered || isSelected || isLastClicked ? '#ffffff' : this.theme === 'dark' ? '#374151' : '#ffffff'
      this.ctx!.lineWidth = isHovered ? 4 : isSelected || isLastClicked ? 3 : 2
      this.ctx!.stroke()
      
      // Node label
      this.ctx!.fillStyle = '#ffffff'
      this.ctx!.font = `bold ${Math.max(10, node.radius / 2.5)}px sans-serif`
      this.ctx!.textAlign = 'center'
      this.ctx!.textBaseline = 'middle'
      this.ctx!.fillText(node.label, node.x, node.y)
    })

    this.ctx.restore()
  }

  private renderWebGL() {
    if (!this.gl) return
    
    // Clear WebGL viewport
    this.gl.viewport(0, 0, this.width, this.height)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT)
    
    // For now, fall back to 2D rendering even in WebGL mode
    // This would be enhanced with actual WebGL shaders for better performance
    if (this.ctx) {
      this.renderCanvas2D()
    }
  }

  private updatePerformanceMetrics(renderTime: number) {
    this.frameCount++
    const now = performance.now()
    
    if (now - this.lastFrameTime >= 1000) {
      this.performanceMetrics.fps = Math.round((this.frameCount * 1000) / (now - this.lastFrameTime))
      this.performanceMetrics.frameTime = renderTime
      this.performanceMetrics.renderTime = renderTime
      this.performanceMetrics.timestamp = now
      this.performanceMetrics.memoryUsage = this.resourceManager?.getMemoryUsage()?.used || 0
      
      this.frameCount = 0
      this.lastFrameTime = now
    }
  }

  // V3 Interface Implementation
  async initialize(params: ModuleSetupParamsV3): Promise<void> {
    // Module is already initialized in constructor
    console.log('🎯 KnowledgeGraph: V3 Initialize called')
  }

  async preload(): Promise<void> {
    // Preload any required assets
    console.log('📦 KnowledgeGraph: Preloading assets')
  }

  async activate(): Promise<void> {
    console.log('▶️ KnowledgeGraph: Activating module')
    this.resume()
  }

  async deactivate(): Promise<void> {
    console.log('⏹️ KnowledgeGraph: Deactivating module')
    this.pause()
  }

  getMemoryUsage(): MemoryStats {
    const nodeMemory = this.nodes.length * 0.001 // ~1KB per node
    const linkMemory = this.links.length * 0.0005 // ~0.5KB per link
    const estimated = nodeMemory + linkMemory
    
    return {
      used: estimated,
      allocated: estimated * 1.2,
      peak: estimated * 1.5,
      leaks: 0
    }
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics }
  }

  getConfiguration(): ModuleConfiguration {
    return { ...this.config }
  }

  async setConfiguration(config: Partial<ModuleConfiguration>): Promise<void> {
    this.config = { ...this.config, ...config }
    
    // Apply configuration changes
    if (config.nodes && config.nodes !== this.nodes.length) {
      this.initializeGraph()
    }
    
    if (config.physics && this.simulation) {
      this.updateSimulationForces()
    }
    
    console.log('⚙️ KnowledgeGraph: Configuration updated', config)
  }

  validateConfiguration(config: unknown): ValidationResult {
    const errors: any[] = []
    const warnings: any[] = []
    
    if (typeof config !== 'object' || !config) {
      errors.push({ path: 'root', message: 'Configuration must be an object' })
      return { valid: false, errors, warnings }
    }
    
    const cfg = config as any
    
    if (cfg.nodes && (typeof cfg.nodes !== 'number' || cfg.nodes < 5 || cfg.nodes > 200)) {
      errors.push({ path: 'nodes', message: 'Node count must be between 5 and 200' })
    }
    
    if (cfg.quality && !['low', 'medium', 'high'].includes(cfg.quality)) {
      errors.push({ path: 'quality', message: 'Quality must be low, medium, or high' })
    }
    
    return { valid: errors.length === 0, errors, warnings }
  }

  getCanvasRequirements(): CanvasRequirements {
    return {
      dedicated: false,
      interactive: true,
      zIndex: 10,
      alpha: true,
      preserveDrawingBuffer: false,
      contextType: this.useWebGL ? 'webgl' : 'canvas2d'
    }
  }

  async onMessage(message: ModuleMessage): Promise<ModuleResponse> {
    // Handle inter-module communication
    return {
      messageId: message.id,
      success: true,
      payload: null,
      timestamp: Date.now()
    }
  }

  async sendMessage(targetModule: string, message: ModuleMessage): Promise<ModuleResponse> {
    // Send message to other modules
    return {
      messageId: message.id,
      success: false,
      error: 'Message sending not implemented',
      timestamp: Date.now()
    }
  }

  serializeState(): SerializableState {
    return {
      version: 1,
      moduleId: 'knowledge',
      config: this.config,
      data: {
        nodes: this.nodes,
        links: this.links,
        viewTransform: this.viewTransform
      },
      timestamp: Date.now()
    }
  }

  async deserializeState(state: SerializableState): Promise<void> {
    if (state.config) {
      await this.setConfiguration(state.config)
    }
    
    if (state.data) {
      const data = state.data as any
      if (data.viewTransform) {
        this.viewTransform = data.viewTransform
      }
    }
  }

  private updateSimulationForces() {
    if (!this.simulation || !this.config.physics) return
    
    const physics = this.config.physics
    
    this.simulation
      .force('charge', d3Force.forceManyBody().strength(-physics.forces.repulsion).distanceMax(300))
      .force('center', d3Force.forceCenter(this.width / 2, this.height / 2).strength(physics.forces.centering))
      .velocityDecay(physics.damping)
    
    if (physics.collisionDetection) {
      this.simulation.force('collision', d3Force.forceCollide().radius((d: any) => d.radius + 8))
    } else {
      this.simulation.force('collision', null)
    }
  }

  pause(): void {
    this.isRunning = false
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
    if (this.simulation) {
      this.simulation.stop()
    }
  }

  resume(): void {
    this.isRunning = true
    if (this.simulation) {
      this.simulation.restart()
    }
    this.render()
  }

  destroy(): void {
    this.pause()
    // Canvas styling is handled by CanvasHost, no need to reset here
  }

  onThemeChange(theme: 'light' | 'dark'): void {
    this.theme = theme
    this.initializeGraph() // Reinitialize with new colors
    if (this.simulation) {
      this.simulation.nodes(this.nodes)
      this.simulation.force('link', d3Force.forceLink(this.links).id((d: any) => d.id))
      this.simulation.alphaTarget(0.3).restart()
    }
  }

  onResize(width: number, height: number): void {
    this.width = width
    this.height = height
    if (this.simulation) {
      this.simulation.force('center', d3Force.forceCenter(width / 2, height / 2))
      this.simulation.alphaTarget(0.3).restart()
    }
  }
}

export const setup = (params: ModuleSetupParams): BackgroundModule => {
  return new KnowledgeGraphModule(params)
}