import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Save, 
  Play, 
  ArrowLeft, 
  Plus,
  Trash2,
  Settings,
  Eye,
  Code,
  Undo2,
  Redo2
} from 'lucide-react'
import toast from 'react-hot-toast'
import MonacoEditor from '@monaco-editor/react'
import VisualWorkflowEditor from '../components/VisualWorkflowEditor'

function WorkflowEditor() {
  const { workflowName } = useParams()
  const navigate = useNavigate()
  const [workflowData, setWorkflowData] = useState('')
  const [viewMode, setViewMode] = useState('visual') // 'visual' or 'code'
  const [isValidYaml, setIsValidYaml] = useState(true)
  const [nodeCounter, setNodeCounter] = useState(1)
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  const sampleWorkflow = `name: sample-workflow
version: "1.0"
description: "Sample workflow demonstrating Phase 1 features"

inputs:
  message:
    type: string
    required: true
    description: "Input message to process"

steps:
  - id: validate_input
    type: transform
    config:
      expression: |
        return {
          valid: inputs.message && inputs.message.length > 0,
          message: inputs.message
        }
  
  - id: process_message
    type: transform
    condition: "{{steps.validate_input.output.valid == true}}"
    config:
      expression: |
        return {
          original: inputs.message,
          uppercase: inputs.message.toUpperCase(),
          length: inputs.message.length,
          timestamp: new Date().toISOString()
        }
    on_error: "error_handler"
  
  - id: http_request
    type: http
    condition: "{{steps.process_message.success}}"
    config:
      method: GET
      url: "https://httpbin.org/json"
    on_error: "http_error_handler"
  
  - id: success_output
    type: output
    condition: "{{steps.http_request.success}}"
    config:
      message: "✅ Success: Processed {{steps.process_message.output.length}} characters"
      data: "{{steps.process_message.output}}"
  
  - id: error_handler
    type: output
    condition: "{{steps.process_message.error}}"
    config:
      message: "❌ Transform Error: {{steps.process_message.error}}"
  
  - id: http_error_handler
    type: output
    condition: "{{steps.http_request.error}}"
    config:
      message: "❌ HTTP Error: {{steps.http_request.error}}"
  
  - id: invalid_input_handler
    type: output
    condition: "{{steps.validate_input.output.valid == false}}"
    config:
      message: "❌ Invalid Input: Message cannot be empty"

outputs:
  result: "{{steps.success_output.output || steps.error_handler.output || steps.http_error_handler.output || steps.invalid_input_handler.output}}"

trigger:
  type: manual`

  useEffect(() => {
    if (workflowName) {
      // Load existing workflow
      // In real implementation, this would fetch from API
      setWorkflowData(sampleWorkflow)
    } else {
      // New workflow
      setWorkflowData(sampleWorkflow)
    }
    
    // Initialize history with the sample workflow
    setHistory([sampleWorkflow])
    setHistoryIndex(0)
  }, [workflowName, sampleWorkflow])

  const handleSave = async () => {
    try {
      // Validate YAML
      if (!isValidYaml) {
        toast.error('Please fix YAML syntax errors before saving')
        return
      }

      // In real implementation, this would call the API
      toast.success('Workflow saved successfully')
    } catch (error) {
      toast.error('Failed to save workflow')
    }
  }

  const handleExecute = async () => {
    try {
      // In real implementation, this would execute the workflow
      toast.success('Workflow execution started')
      navigate('/executions')
    } catch (error) {
      toast.error('Failed to execute workflow')
    }
  }

  const handleValidation = (markers) => {
    setIsValidYaml(markers.length === 0)
  }

  // Save state to history for undo/redo
  const saveToHistory = (newData) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1)
      newHistory.push(newData)
      return newHistory.slice(-20) // Keep only last 20 states
    })
    setHistoryIndex(prev => Math.min(prev + 1, 19))
  }

  // Undo function
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1]
      setWorkflowData(prevState)
      setHistoryIndex(prev => prev - 1)
      toast.success('Undone')
    }
  }

  // Redo function
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1]
      setWorkflowData(nextState)
      setHistoryIndex(prev => prev + 1)
      toast.success('Redone')
    }
  }

  // Enhanced workflow data setter that saves to history
  const updateWorkflowData = (newData) => {
    if (newData !== workflowData) {
      saveToHistory(workflowData) // Save current state before changing
      setWorkflowData(newData)
    }
  }

  // Function to generate node template YAML
  const generateNodeYaml = (nodeType, nodeName) => {
    const templates = {
      output: `  - id: ${nodeName}
    type: output
    condition: "{{inputs.success == true}}"  # Optional: only run if condition is true
    config:
      message: "Output message here"
    on_error: "handle_error"  # Optional: step to run on error`,
      
      transform: `  - id: ${nodeName}
    type: transform
    config:
      expression: |
        return {
          // Your transformation logic here
          result: inputs.data
        }`,
      
      conditional: `  - id: ${nodeName}
    type: conditional
    condition: "{{inputs.condition}} == true"
    if_true:
      - id: ${nodeName}_true
        type: output
        config:
          message: "Condition was true"
    if_false:
      - id: ${nodeName}_false
        type: output
        config:
          message: "Condition was false"`,
      
      agent: `  - id: ${nodeName}
    type: agent
    config:
      prompt: "Your AI prompt here"
      context: "default"`,
      
      http: `  - id: ${nodeName}
    type: http
    config:
      method: GET
      url: "https://api.example.com/data"
      headers:
        Content-Type: "application/json"`,
      
      database: `  - id: ${nodeName}
    type: database
    config:
      operation: "select"
      query: "SELECT * FROM table WHERE condition = '{{inputs.value}}'"`,
      
      email: `  - id: ${nodeName}
    type: email
    config:
      to: "recipient@example.com"
      subject: "Email Subject"
      body: "Email body content"`,
      
      slack: `  - id: ${nodeName}
    type: slack
    config:
      channel: "#general"
      message: "Slack message content"`,
      
      shopify: `  - id: ${nodeName}
    type: shopify
    config:
      operation: "get_orders"
      limit: 10`,
      
      google_sheets: `  - id: ${nodeName}
    type: google_sheets
    config:
      spreadsheet_id: "your_spreadsheet_id"
      range: "Sheet1!A1:Z100"
      operation: "read"`,
      
      telegram: `  - id: ${nodeName}
    type: telegram
    config:
      chat_id: "your_chat_id"
      message: "Telegram message content"`,
      
      discord: `  - id: ${nodeName}
    type: discord
    config:
      channel_id: "your_channel_id"
      message: "Discord message content"`,
      
      teams: `  - id: ${nodeName}
    type: teams
    config:
      webhook_url: "your_teams_webhook_url"
      message: "Teams message content"`,
      
      twilio: `  - id: ${nodeName}
    type: twilio
    config:
      to: "+1234567890"
      message: "SMS message content"`
    }
    
    return templates[nodeType] || `  - id: ${nodeName}
    type: ${nodeType}
    config:
      # Configuration for ${nodeType} node`
  }

  // Function to handle drag start for visual editor
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }

  // Function to add node to YAML editor
  const addNodeToWorkflow = (nodeType, customName = null) => {
    const nodeName = customName || `${nodeType}_${nodeCounter}`
    const nodeTemplate = generateNodeYaml(nodeType, nodeName)
    setNodeCounter(prev => prev + 1)
    
    // Find the steps section in the YAML
    const lines = workflowData.split('\n')
    let stepsIndex = lines.findIndex(line => line.trim() === 'steps:')
    
    if (stepsIndex === -1) {
      // If no steps section exists, add one at the end
      const newWorkflow = workflowData + '\n\nsteps:\n' + nodeTemplate
      setWorkflowData(newWorkflow)
    } else {
      // Find the last step and add the new node after it
      let insertIndex = stepsIndex + 1
      
      // Find where to insert the new step (after the last step)
      for (let i = stepsIndex + 1; i < lines.length; i++) {
        if (lines[i].startsWith('  - id:') || lines[i].trim().startsWith('- id:')) {
          // Find the end of this step
          let j = i + 1
          while (j < lines.length && (lines[j].startsWith('    ') || lines[j].trim() === '')) {
            j++
          }
          insertIndex = j
        } else if (lines[i].trim() && !lines[i].startsWith('  ') && !lines[i].startsWith('\t')) {
          // Found a new top-level section
          break
        }
      }
      
      lines.splice(insertIndex, 0, nodeTemplate)
      setWorkflowData(lines.join('\n'))
    }
    
    // Switch to code view to show the added node
    setViewMode('code')
    toast.success(`Added ${nodeName} node to workflow`)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/workflows')}
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {workflowName ? `Edit: ${workflowName}` : 'New Workflow'}
              </h1>
              <p className="text-sm text-gray-500">Design your automation workflow</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('visual')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'visual' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Eye className="mr-1 h-4 w-4" />
                Visual
              </button>
              <button
                onClick={() => setViewMode('code')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'code' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Code className="mr-1 h-4 w-4" />
                Code
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="h-4 w-4" />
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed"
                title="Redo (Ctrl+Y)"
              >
                <Redo2 className="h-4 w-4" />
              </button>
            </div>
            
            <button
              onClick={handleExecute}
              className="btn-secondary px-4 py-2"
            >
              <Play className="mr-2 h-4 w-4" />
              Test Run
            </button>
            <button
              onClick={handleSave}
              className="btn-primary px-4 py-2"
            >
              <Save className="mr-2 h-4 w-4" />
              Save
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col">
          {viewMode === 'code' ? (
            <div className="flex-1 p-4">
              <div className="h-full border rounded-lg overflow-hidden">
                <MonacoEditor
                  height="100%"
                  defaultLanguage="yaml"
                  value={workflowData}
                  onChange={updateWorkflowData}
                  onValidate={handleValidation}
                  options={{
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    wordWrap: 'on',
                    automaticLayout: true,
                  }}
                  theme="vs-light"
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 bg-gray-50">
              <VisualWorkflowEditor 
                workflowData={workflowData}
                onWorkflowChange={updateWorkflowData}
              />
            </div>
          )}
        </div>

        {/* Right Sidebar - Node Library */}
        <div className="w-80 bg-white border-l">
          <div className="p-4 border-b">
            <h3 className="font-medium text-gray-900">Available Nodes</h3>
            <p className="text-sm text-gray-500 mt-1">
              {viewMode === 'visual' 
                ? 'Drag nodes to the visual editor or click to add to YAML'
                : 'Click any node to add it to your workflow'
              }
            </p>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Core Nodes */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Core</h4>
              <div className="space-y-2">
                {[
                  { name: 'Output', type: 'output', description: 'Display or log data' },
                  { name: 'Transform', type: 'transform', description: 'Transform data with JavaScript' },
                  { name: 'Conditional', type: 'conditional', description: 'Conditional logic' },
                  { name: 'Agent', type: 'agent', description: 'AI agent interaction' },
                ].map(node => (
                  <div 
                    key={node.type}
                    draggable={viewMode === 'visual'}
                    onDragStart={(event) => onDragStart(event, node.type)}
                    onClick={() => addNodeToWorkflow(node.type)}
                    className={`p-3 border rounded-lg hover:bg-forge-50 hover:border-forge-300 transition-all ${
                      viewMode === 'visual' ? 'cursor-move' : 'cursor-pointer'
                    }`}
                  >
                    <div className="font-medium text-sm text-gray-900">{node.name}</div>
                    <div className="text-xs text-gray-500">{node.description}</div>
                    <div className="text-xs text-forge-600 mt-1 font-medium opacity-0 hover:opacity-100 transition-opacity">
                      {viewMode === 'visual' ? 'Drag to canvas or click →' : 'Click to add →'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Integration Nodes */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Integrations</h4>
              <div className="space-y-2">
                {[
                  { name: 'HTTP Request', type: 'http', description: 'Make HTTP requests' },
                  { name: 'Database', type: 'database', description: 'Database operations' },
                  { name: 'Email', type: 'email', description: 'Send emails' },
                  { name: 'Slack', type: 'slack', description: 'Slack integration' },
                  { name: 'Shopify', type: 'shopify', description: 'Shopify operations' },
                  { name: 'Google Sheets', type: 'google_sheets', description: 'Google Sheets operations' },
                ].map(node => (
                  <div 
                    key={node.type}
                    draggable={viewMode === 'visual'}
                    onDragStart={(event) => onDragStart(event, node.type)}
                    onClick={() => addNodeToWorkflow(node.type)}
                    className={`p-3 border rounded-lg hover:bg-forge-50 hover:border-forge-300 transition-all ${
                      viewMode === 'visual' ? 'cursor-move' : 'cursor-pointer'
                    }`}
                  >
                    <div className="font-medium text-sm text-gray-900">{node.name}</div>
                    <div className="text-xs text-gray-500">{node.description}</div>
                    <div className="text-xs text-forge-600 mt-1 font-medium opacity-0 hover:opacity-100 transition-opacity">
                      {viewMode === 'visual' ? 'Drag to canvas or click →' : 'Click to add →'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Communication Nodes */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Communication</h4>
              <div className="space-y-2">
                {[
                  { name: 'Telegram', type: 'telegram', description: 'Telegram bot integration' },
                  { name: 'Discord', type: 'discord', description: 'Discord bot integration' },
                  { name: 'Teams', type: 'teams', description: 'Microsoft Teams integration' },
                  { name: 'Twilio', type: 'twilio', description: 'SMS and voice calls' },
                ].map(node => (
                  <div 
                    key={node.type}
                    draggable={viewMode === 'visual'}
                    onDragStart={(event) => onDragStart(event, node.type)}
                    onClick={() => addNodeToWorkflow(node.type)}
                    className={`p-3 border rounded-lg hover:bg-forge-50 hover:border-forge-300 transition-all ${
                      viewMode === 'visual' ? 'cursor-move' : 'cursor-pointer'
                    }`}
                  >
                    <div className="font-medium text-sm text-gray-900">{node.name}</div>
                    <div className="text-xs text-gray-500">{node.description}</div>
                    <div className="text-xs text-forge-600 mt-1 font-medium opacity-0 hover:opacity-100 transition-opacity">
                      {viewMode === 'visual' ? 'Drag to canvas or click →' : 'Click to add →'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-gray-100 border-t px-6 py-2 flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          <span className={`flex items-center ${isValidYaml ? 'text-green-600' : 'text-red-600'}`}>
            <span className={`w-2 h-2 rounded-full mr-2 ${isValidYaml ? 'bg-green-500' : 'bg-red-500'}`}></span>
            {isValidYaml ? 'Valid YAML' : 'YAML Syntax Error'}
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <span>Lines: {workflowData.split('\n').length}</span>
          <span>Characters: {workflowData.length}</span>
        </div>
      </div>
    </div>
  )
}

export default WorkflowEditor