import React, { useRef, useEffect, useState, useCallback } from 'react'
import * as d3 from 'd3-force'
import { select } from 'd3-selection'
import { drag } from 'd3-drag'
import { zoom } from 'd3-zoom'

interface Node extends d3.SimulationNodeDatum {
  id: string
  label: string
  color: string
  radius: number
  group?: number
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node
  target: string | Node
}

const InteractiveGraph: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null)
  const simulationRef = useRef<d3.Simulation<Node, Link> | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [isAddingConnection, setIsAddingConnection] = useState(false)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [tempLine, setTempLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null)

  // Initial graph data
  const [nodes, setNodes] = useState<Node[]>([
    { id: 'blog', label: 'Blog', color: '#6366f1', radius: 16, group: 1 },
    { id: 'code', label: 'Code', color: '#8b5cf6', radius: 16, group: 1 },
    { id: 'ideas', label: 'Ideas', color: '#ec4899', radius: 16, group: 2 },
    { id: 'learn', label: 'Learn', color: '#06b6d4', radius: 14, group: 2 },
    { id: 'build', label: 'Build', color: '#10b981', radius: 14, group: 3 },
    { id: 'share', label: 'Share', color: '#f59e0b', radius: 14, group: 3 }
  ])

  const [links, setLinks] = useState<Link[]>([
    { source: 'blog', target: 'code' },
    { source: 'blog', target: 'ideas' },
    { source: 'code', target: 'learn' },
    { source: 'ideas', target: 'build' },
    { source: 'learn', target: 'share' },
    { source: 'build', target: 'share' },
    { source: 'code', target: 'ideas' }
  ])

  useEffect(() => {
    setIsClient(true)
  }, [])

  const addRandomNode = useCallback(() => {
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#84cc16']
    const topics = ['AI', 'Web', 'Data', 'Design', 'Mobile', 'Game', 'Cloud', 'Security', 'Art', 'Music']
    
    const newNode: Node = {
      id: `node-${Date.now()}`,
      label: topics[Math.floor(Math.random() * topics.length)],
      color: colors[Math.floor(Math.random() * colors.length)],
      radius: 12 + Math.random() * 8,
      group: Math.floor(Math.random() * 4) + 1
    }

    setNodes(prev => [...prev, newNode])
  }, [])

  const removeNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId))
    setLinks(prev => prev.filter(l => 
      (typeof l.source === 'string' ? l.source : l.source?.id) !== nodeId &&
      (typeof l.target === 'string' ? l.target : l.target?.id) !== nodeId
    ))
  }, [])

  useEffect(() => {
    if (!isClient || !svgRef.current) return

    const svg = select(svgRef.current)
    const width = 600
    const height = 400

    // Clear previous content
    svg.selectAll('*').remove()

    // Create simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(80).strength(0.8))
      .force('charge', d3.forceManyBody().strength(-300).distanceMax(200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => d.radius + 4))
      .alphaDecay(0.02)
      .velocityDecay(0.3)

    simulationRef.current = simulation

    // Create zoom behavior
    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        container.attr('transform', event.transform)
      })

    svg.call(zoomBehavior)

    // Create main container
    const container = svg.append('g')

    // Create links group
    const linkGroup = container.append('g').attr('class', 'links')
    
    // Create nodes group
    const nodeGroup = container.append('g').attr('class', 'nodes')

    // Create temporary line for connection drawing
    const tempLineElement = container.append('line')
      .attr('class', 'temp-line')
      .style('stroke', '#6366f1')
      .style('stroke-width', 2)
      .style('stroke-dasharray', '5,5')
      .style('opacity', 0)

    const updateGraph = () => {
      // Update links
      const linkElements = linkGroup.selectAll('line')
        .data(links)
        .join('line')
        .style('stroke', '#6366f1')
        .style('stroke-opacity', 0.4)
        .style('stroke-width', 2)

      // Update nodes
      const nodeElements = nodeGroup.selectAll('g')
        .data(nodes)
        .join('g')
        .style('cursor', 'grab')

      // Add circles to nodes
      nodeElements.selectAll('circle').remove()
      nodeElements.append('circle')
        .attr('r', (d: Node) => d.radius)
        .style('fill', (d: Node) => d.color)
        .style('stroke', '#fff')
        .style('stroke-width', 2)
        .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))')

      // Add labels to nodes
      nodeElements.selectAll('text').remove()
      nodeElements.append('text')
        .text((d: Node) => d.label)
        .style('fill', '#fff')
        .style('font-size', '10px')
        .style('font-weight', 'bold')
        .style('text-anchor', 'middle')
        .style('dominant-baseline', 'middle')
        .style('pointer-events', 'none')
        .style('user-select', 'none')

      // Add drag behavior
      const dragHandler = drag<SVGGElement, Node>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart()
          d.fx = d.x
          d.fy = d.y
          select(event.sourceEvent.target.parentNode).style('cursor', 'grabbing')
        })
        .on('drag', (event, d) => {
          d.fx = event.x
          d.fy = event.y
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0)
          d.fx = null
          d.fy = null
          select(event.sourceEvent.target.parentNode).style('cursor', 'grab')
        })

      nodeElements.call(dragHandler)

      // Add click handlers for node interactions
      nodeElements.on('click', (event, d) => {
        event.stopPropagation()
        
        if (event.shiftKey) {
          // Shift+click to remove node
          removeNode(d.id)
          return
        }
        
        if (isAddingConnection) {
          if (selectedNode && selectedNode !== d.id) {
            // Create connection
            const newLink = { source: selectedNode, target: d.id }
            setLinks(prev => [...prev, newLink])
            setIsAddingConnection(false)
            setSelectedNode(null)
            setTempLine(null)
          } else {
            // Select this node as connection start
            setSelectedNode(d.id)
          }
        } else {
          // Regular click - highlight node
          nodeElements.style('opacity', 0.3)
          select(event.target.parentNode).style('opacity', 1)
          
          // Reset after 1 second
          setTimeout(() => {
            nodeElements.style('opacity', 1)
          }, 1000)
        }
      })

      // Mouse move for temporary line
      svg.on('mousemove', (event) => {
        if (isAddingConnection && selectedNode) {
          const [mouseX, mouseY] = d3.pointer(event, container.node())
          const selectedNodeData = nodes.find(n => n.id === selectedNode)
          if (selectedNodeData && selectedNodeData.x !== undefined && selectedNodeData.y !== undefined) {
            tempLineElement
              .attr('x1', selectedNodeData.x)
              .attr('y1', selectedNodeData.y)
              .attr('x2', mouseX)
              .attr('y2', mouseY)
              .style('opacity', 1)
          }
        } else {
          tempLineElement.style('opacity', 0)
        }
      })

      // Simulation tick update
      simulation.on('tick', () => {
        linkElements
          .attr('x1', (d: any) => d.source.x)
          .attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x)
          .attr('y2', (d: any) => d.target.y)

        nodeElements
          .attr('transform', (d: Node) => `translate(${d.x},${d.y})`)
      })
    }

    updateGraph()

    // Click outside to cancel connection mode
    svg.on('click', () => {
      setIsAddingConnection(false)
      setSelectedNode(null)
      setTempLine(null)
    })

    return () => {
      simulation.stop()
    }
  }, [isClient, nodes, links, isAddingConnection, selectedNode, removeNode])

  if (!isClient) {
    return (
      <div className="w-[600px] h-[400px] border border-border/20 rounded-lg bg-card/5 backdrop-blur-sm flex items-center justify-center">
        <div className="text-muted-foreground">Loading physics simulation...</div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Control Panel */}
      <div className="mb-4 flex gap-2 flex-wrap justify-center">
        <button
          onClick={addRandomNode}
          className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/80 transition-colors"
        >
          Add Node
        </button>
        <button
          onClick={() => setIsAddingConnection(!isAddingConnection)}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            isAddingConnection 
              ? 'bg-amber-500 text-white' 
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          {isAddingConnection ? 'Cancel Connection' : 'Add Connection'}
        </button>
        <button
          onClick={() => simulationRef.current?.alphaTarget(0.3).restart()}
          className="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/80 transition-colors"
        >
          Reheat
        </button>
      </div>

      {/* Instructions */}
      <div className="mb-4 text-center text-xs text-muted-foreground max-w-md mx-auto">
        <p>Drag nodes • Click "Add Connection" then click two nodes • Shift+click to remove • Scroll to zoom</p>
      </div>

      {/* Graph */}
      <svg
        ref={svgRef}
        width={600}
        height={400}
        className="border border-border/20 rounded-lg bg-card/5 backdrop-blur-sm"
        style={{ cursor: isAddingConnection ? 'crosshair' : 'default' }}
      />
    </div>
  )
}

export default InteractiveGraph