import React, { useState, useCallback, useMemo } from 'react'
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
} from 'reactflow'
import 'reactflow/dist/style.css'
import {
  Database,
  Globe,
  Mail,
  MessageSquare,
  Bot,
  Code,
  GitBranch,
  Play,
  Settings,
  Zap,
  Phone,
  Hash
} from 'lucide-react'

// Custom Node Components
const WorkflowNode = ({ data, isConnectable }) => {
  const getIcon = (type) => {
    const icons = {
      output: Play,
      transform: Code,
      conditional: GitBranch,
      agent: Bot,
      http: Globe,
      database: Database,
      email: Mail,
      slack: MessageSquare,
      shopify: Hash,
      google_sheets: Database,
      telegram: MessageSquare,
      discord: MessageSquare,
      teams: MessageSquare,
      twilio: Phone,
    }
    return icons[type] || Settings
  }

  const getNodeColor = (type) => {
    const colors = {
      output: 'bg-blue-500',
      transform: 'bg-purple-500',
      conditional: 'bg-yellow-500',
      agent: 'bg-green-500',
      http: 'bg-orange-500',
      database: 'bg-indigo-500',
      email: 'bg-red-500',
      slack: 'bg-purple-600',
      shopify: 'bg-green-600',
      google_sheets: 'bg-emerald-500',
      telegram: 'bg-blue-400',
      discord: 'bg-indigo-600',
      teams: 'bg-blue-600',
      twilio: 'bg-red-600',
    }
    return colors[type] || 'bg-gray-500'
  }

  const IconComponent = getIcon(data.type)
  const nodeColor = getNodeColor(data.type)

  return (
    <div className="px-4 py-2 shadow-lg rounded-lg bg-white border-2 border-gray-200 hover:border-forge-400 transition-colors">
      <div className="flex items-center space-x-2">
        <div className={`p-2 rounded-full ${nodeColor} text-white`}>
          <IconComponent className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-900">{data.label}</div>
          <div className="text-xs text-gray-500">{data.type}</div>
        </div>
      </div>
      
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-forge-500 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-forge-500 border-2 border-white"
      />
    </div>
  )
}

// Start Node Component
const StartNode = ({ isConnectable }) => (
  <div className="px-4 py-2 shadow-lg rounded-full bg-green-500 text-white border-2 border-green-600">
    <div className="flex items-center space-x-2">
      <Zap className="h-4 w-4" />
      <span className="text-sm font-semibold">Start</span>
    </div>
    <Handle
      type="source"
      position={Position.Right}
      isConnectable={isConnectable}
      className="w-3 h-3 bg-green-600 border-2 border-white"
    />
  </div>
)

const VisualWorkflowEditor = ({ workflowData, onWorkflowChange }) => {
  const [savedPositions, setSavedPositions] = useState(new Map())
  const nodeTypes = useMemo(
    () => ({
      workflowNode: WorkflowNode,
      startNode: StartNode,
    }),
    []
  )

  // Parse YAML to create initial nodes and edges
  const parseWorkflowToNodes = useCallback((yamlData) => {
    const nodes = []
    const edges = []
    
    // Add start node
    nodes.push({
      id: 'start',
      type: 'startNode',
      position: { x: 50, y: 150 },
      data: { label: 'Start' },
    })

    try {
      // Simple YAML parsing for steps
      const lines = yamlData.split('\n')
      let currentStep = null
      let stepCounter = 0
      let yPosition = 150

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        
        if (line.startsWith('- id:') || line.startsWith('id:')) {
          if (currentStep) {
            // Add the previous step as a node
            // Use saved position if available, otherwise default position
            const savedPos = savedPositions.get(currentStep.id)
            const position = savedPos || { x: 250 + (stepCounter * 200), y: yPosition }
            
            nodes.push({
              id: currentStep.id,
              type: 'workflowNode',
              position: position,
              data: {
                label: currentStep.id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                type: currentStep.type || 'unknown',
                config: currentStep.config || {}
              },
            })
            
            // Connect to previous node
            const sourceId = stepCounter === 0 ? 'start' : nodes[stepCounter - 1]?.id
            if (sourceId) {
              edges.push({
                id: `${sourceId}-${currentStep.id}`,
                source: sourceId,
                target: currentStep.id,
                animated: true,
                style: { stroke: '#0ea5e9', strokeWidth: 2 }
              })
            }
            
            stepCounter++
          }
          
          currentStep = {
            id: line.replace(/- id:/, '').replace(/id:/, '').trim(),
            type: null,
            config: {}
          }
        } else if (line.startsWith('type:') && currentStep) {
          currentStep.type = line.replace('type:', '').trim()
        }
      }
      
      // Add the last step
      if (currentStep) {
        // Use saved position if available, otherwise default position
        const savedPos = savedPositions.get(currentStep.id)
        const position = savedPos || { x: 250 + (stepCounter * 200), y: yPosition }
        
        nodes.push({
          id: currentStep.id,
          type: 'workflowNode',
          position: position,
          data: {
            label: currentStep.id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            type: currentStep.type || 'unknown',
            config: currentStep.config || {}
          },
        })
        
        const sourceId = stepCounter === 0 ? 'start' : nodes[nodes.length - 2]?.id
        if (sourceId) {
          edges.push({
            id: `${sourceId}-${currentStep.id}`,
            source: sourceId,
            target: currentStep.id,
            animated: true,
            style: { stroke: '#0ea5e9', strokeWidth: 2 }
          })
        }
      }
    } catch (error) {
      console.error('Error parsing workflow:', error)
    }

    return { nodes, edges }
  }, [])

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => parseWorkflowToNodes(workflowData),
    [workflowData, parseWorkflowToNodes]
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Save node positions when they change
  const handleNodesChange = useCallback((changes) => {
    onNodesChange(changes)
    
    // Save positions for any moved nodes
    changes.forEach(change => {
      if (change.type === 'position' && change.position) {
        setSavedPositions(prev => new Map(prev.set(change.id, change.position)))
      }
    })
  }, [onNodesChange])

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  // Convert visual workflow back to YAML
  const convertNodesToYaml = useCallback(() => {
    const workflowNodes = nodes.filter(node => node.type === 'workflowNode')
    
    let yamlOutput = `name: visual-workflow
version: "1.0"
description: "Workflow created with visual editor"

inputs:
  data:
    type: string
    required: true
    description: "Input data for the workflow"

steps:
`

    workflowNodes.forEach(node => {
      const nodeId = node.data.label.toLowerCase().replace(/\s+/g, '_')
      const nodeType = node.data.type
      
      yamlOutput += `  - id: ${nodeId}
    type: ${nodeType}
    config:
      # Configuration for ${nodeType} node
      message: "Processing in ${node.data.label}"
      
`
    })

    yamlOutput += `outputs:
  result: "{{steps.${workflowNodes[workflowNodes.length - 1]?.data.label.toLowerCase().replace(/\s+/g, '_') || 'final'}.output}}"

trigger:
  type: manual`

    return yamlOutput
  }, [nodes])

  // Handle node addition from drag and drop
  const onDrop = useCallback(
    (event) => {
      event.preventDefault()
      
      const reactFlowBounds = event.currentTarget.getBoundingClientRect()
      const nodeType = event.dataTransfer.getData('application/reactflow')
      
      if (!nodeType) return

      // Calculate position relative to the flow
      const position = {
        x: event.clientX - reactFlowBounds.left - 100, // Offset to center the node
        y: event.clientY - reactFlowBounds.top - 50,
      }

      const nodeId = `${nodeType}_${Date.now()}`
      const newNode = {
        id: nodeId,
        type: 'workflowNode',
        position,
        data: {
          label: nodeType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          type: nodeType,
          config: {}
        },
      }

      // Add node to visual editor
      setNodes((nds) => nds.concat(newNode))
      
      // Save position for persistence
      setSavedPositions(prev => new Map(prev.set(nodeId, position)))
      
      // Update YAML if callback provided
      if (onWorkflowChange) {
        // Add to YAML as well
        setTimeout(() => {
          const newYaml = convertNodesToYaml()
          onWorkflowChange(newYaml)
        }, 100)
      }
    },
    [setNodes, setSavedPositions, onWorkflowChange, convertNodesToYaml]
  )

  const onDragOver = useCallback((event) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  // Sync visual changes back to YAML
  React.useEffect(() => {
    if (onWorkflowChange) {
      const newYaml = convertNodesToYaml()
      onWorkflowChange(newYaml)
    }
  }, [nodes, edges, convertNodesToYaml, onWorkflowChange])

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gray-50"
      >
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === 'startNode') return '#10b981'
            return '#0ea5e9'
          }}
          className="bg-white border border-gray-200 rounded-lg"
        />
        <Background variant="dots" gap={20} size={1} />
      </ReactFlow>
    </div>
  )
}

export default VisualWorkflowEditor