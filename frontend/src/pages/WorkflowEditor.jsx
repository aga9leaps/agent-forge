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
  Code
} from 'lucide-react'
import toast from 'react-hot-toast'
import MonacoEditor from '@monaco-editor/react'

function WorkflowEditor() {
  const { workflowName } = useParams()
  const navigate = useNavigate()
  const [workflowData, setWorkflowData] = useState('')
  const [viewMode, setViewMode] = useState('visual') // 'visual' or 'code'
  const [isValidYaml, setIsValidYaml] = useState(true)

  const sampleWorkflow = `name: sample-workflow
version: "1.0"
description: "Sample workflow demonstrating basic functionality"

inputs:
  message:
    type: string
    required: true
    description: "Input message to process"

steps:
  - id: log_input
    type: output
    config:
      message: "Processing: {{inputs.message}}"
  
  - id: transform_message
    type: transform
    config:
      expression: |
        return {
          original: inputs.message,
          uppercase: inputs.message.toUpperCase(),
          length: inputs.message.length,
          timestamp: new Date().toISOString()
        }
  
  - id: http_request
    type: http
    config:
      method: GET
      url: "https://httpbin.org/json"
      headers:
        Content-Type: "application/json"
  
  - id: final_output
    type: output
    config:
      message: "Processed {{steps.transform_message.output.length}} characters"
      data: "{{steps.transform_message.output}}"

outputs:
  result: "{{steps.final_output.output}}"
  http_data: "{{steps.http_request.output}}"

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
  }, [workflowName])

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
                  onChange={setWorkflowData}
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
            <div className="flex-1 p-4 bg-gray-50">
              <div className="bg-white border rounded-lg p-6 h-full">
                <div className="text-center text-gray-500">
                  <Settings className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Visual Editor</h3>
                  <p className="text-sm mb-4">Visual workflow builder coming soon!</p>
                  <p className="text-xs text-gray-400">
                    For now, use the Code view to edit your workflow YAML
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Node Library */}
        <div className="w-80 bg-white border-l">
          <div className="p-4 border-b">
            <h3 className="font-medium text-gray-900">Available Nodes</h3>
            <p className="text-sm text-gray-500 mt-1">Drag nodes to add them to your workflow</p>
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
                  <div key={node.type} className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="font-medium text-sm text-gray-900">{node.name}</div>
                    <div className="text-xs text-gray-500">{node.description}</div>
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
                  <div key={node.type} className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="font-medium text-sm text-gray-900">{node.name}</div>
                    <div className="text-xs text-gray-500">{node.description}</div>
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
                  <div key={node.type} className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="font-medium text-sm text-gray-900">{node.name}</div>
                    <div className="text-xs text-gray-500">{node.description}</div>
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