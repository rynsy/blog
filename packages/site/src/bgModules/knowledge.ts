import { ModuleSetupParams, ModuleInstance } from '../types/background'

interface Node {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  connections: string[]
  label: string
}

interface Connection {
  from: string
  to: string
  strength: number
}

export const setup = (params: ModuleSetupParams): ModuleInstance => {
  const { canvas, theme, performance } = params
  const ctx = canvas.getContext('2d')
  
  if (!ctx) {
    throw new Error('Failed to get 2D context for knowledge module')
  }

  let animationId: number | null = null
  let isRunning = false
  let nodes: Node[] = []
  let connections: Connection[] = []

  // Initialize knowledge graph nodes
  const initializeNodes = () => {
    const nodeData = [
      { id: 'tech', label: 'Technology', x: canvas.width * 0.3, y: canvas.height * 0.3 },
      { id: 'design', label: 'Design', x: canvas.width * 0.7, y: canvas.height * 0.3 },
      { id: 'ai', label: 'AI/ML', x: canvas.width * 0.5, y: canvas.height * 0.6 },
      { id: 'data', label: 'Data', x: canvas.width * 0.2, y: canvas.height * 0.7 },
      { id: 'web', label: 'Web Dev', x: canvas.width * 0.8, y: canvas.height * 0.7 }
    ]

    nodes = nodeData.map(node => ({
      ...node,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      radius: 25 + Math.random() * 15,
      connections: []
    }))

    // Create connections between nodes
    connections = [
      { from: 'tech', to: 'ai', strength: 0.8 },
      { from: 'tech', to: 'web', strength: 0.9 },
      { from: 'design', to: 'web', strength: 0.7 },
      { from: 'ai', to: 'data', strength: 0.85 },
      { from: 'data', to: 'tech', strength: 0.6 }
    ]
  }

  const updatePhysics = () => {
    const damping = 0.98
    const repulsion = 1000
    const attraction = 0.1

    // Apply forces between nodes
    nodes.forEach((nodeA, i) => {
      nodes.forEach((nodeB, j) => {
        if (i === j) return

        const dx = nodeB.x - nodeA.x
        const dy = nodeB.y - nodeA.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < 1) return

        // Repulsion force
        const force = repulsion / (distance * distance)
        nodeA.vx -= (dx / distance) * force
        nodeA.vy -= (dy / distance) * force
      })

      // Apply connection forces
      connections.forEach(conn => {
        if (conn.from === nodeA.id) {
          const nodeB = nodes.find(n => n.id === conn.to)
          if (nodeB) {
            const dx = nodeB.x - nodeA.x
            const dy = nodeB.y - nodeA.y
            nodeA.vx += dx * attraction * conn.strength
            nodeA.vy += dy * attraction * conn.strength
          }
        }
      })

      // Update position
      nodeA.x += nodeA.vx
      nodeA.y += nodeA.vy

      // Apply damping
      nodeA.vx *= damping
      nodeA.vy *= damping

      // Boundary conditions
      const margin = nodeA.radius
      if (nodeA.x < margin) { nodeA.x = margin; nodeA.vx *= -0.8 }
      if (nodeA.x > canvas.width - margin) { nodeA.x = canvas.width - margin; nodeA.vx *= -0.8 }
      if (nodeA.y < margin) { nodeA.y = margin; nodeA.vy *= -0.8 }
      if (nodeA.y > canvas.height - margin) { nodeA.y = canvas.height - margin; nodeA.vy *= -0.8 }
    })
  }

  const render = () => {
    if (!ctx || !isRunning) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set colors based on theme
    const nodeColor = theme === 'dark' ? '#3B82F6' : '#1E40AF'
    const connectionColor = theme === 'dark' ? '#374151' : '#E5E7EB'
    const textColor = theme === 'dark' ? '#F3F4F6' : '#1F2937'

    // Draw connections
    ctx.strokeStyle = connectionColor
    ctx.lineWidth = 2
    connections.forEach(conn => {
      const nodeFrom = nodes.find(n => n.id === conn.from)
      const nodeTo = nodes.find(n => n.id === conn.to)
      
      if (nodeFrom && nodeTo) {
        ctx.globalAlpha = conn.strength * 0.6
        ctx.beginPath()
        ctx.moveTo(nodeFrom.x, nodeFrom.y)
        ctx.lineTo(nodeTo.x, nodeTo.y)
        ctx.stroke()
      }
    })

    // Draw nodes
    ctx.globalAlpha = 0.8
    nodes.forEach(node => {
      // Node circle
      ctx.fillStyle = nodeColor
      ctx.beginPath()
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2)
      ctx.fill()

      // Node border
      ctx.strokeStyle = theme === 'dark' ? '#60A5FA' : '#3B82F6'
      ctx.lineWidth = 2
      ctx.stroke()

      // Node label
      ctx.fillStyle = textColor
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.globalAlpha = 1
      ctx.fillText(node.label, node.x, node.y)
      ctx.globalAlpha = 0.8
    })

    ctx.globalAlpha = 1

    // Update physics and continue animation
    updatePhysics()

    if (isRunning) {
      animationId = requestAnimationFrame(render)
    }
  }

  const start = () => {
    if (!isRunning) {
      isRunning = true
      initializeNodes()
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
      // Reinitialize nodes for new canvas size
      if (isRunning) {
        initializeNodes()
        render()
      }
    }
  }
}