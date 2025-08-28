import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Database, 
  Save, 
  X,
  Building,
  Settings,
  Users,
  Key
} from 'lucide-react'
import toast from 'react-hot-toast'
import MonacoEditor from '@monaco-editor/react'
import { agentForgeAPI } from '../services/api'

function ContextManager() {
  const [selectedContext, setSelectedContext] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [newContextName, setNewContextName] = useState('')
  const queryClient = useQueryClient()

  // Mock data for demonstration - in real implementation, this would come from API
  const contexts = [
    {
      name: 'default',
      company: { name: 'Default Company', industry: 'General' },
      agents: ['sales', 'support'],
      dataSources: 2,
      lastModified: '2024-01-15T10:30:00Z',
    },
    {
      name: 'techstart',
      company: { name: 'TechStart Inc', industry: 'Technology' },
      agents: ['sales', 'support', 'marketing'],
      dataSources: 3,
      lastModified: '2024-01-14T15:45:00Z',
    },
    {
      name: 'retail-chain',
      company: { name: 'Retail Chain Co', industry: 'Retail' },
      agents: ['sales', 'inventory'],
      dataSources: 4,
      lastModified: '2024-01-13T09:15:00Z',
    },
  ]

  const sampleContext = {
    company: {
      name: "Sample Company",
      industry: "Technology",
      website: "https://sample.com",
      timezone: "America/New_York"
    },
    prompts: {
      agents: {
        sales: {
          systemPrompt: "You are a helpful sales assistant for Sample Company.",
          temperature: 0.7,
          tools: ["search_customers", "get_orders"]
        },
        support: {
          systemPrompt: "You are a customer support agent for Sample Company.",
          temperature: 0.6,
          tools: ["search_tickets", "update_status"]
        }
      }
    },
    dataSources: {
      databases: {
        primary: {
          type: "mysql",
          connection: "main_db",
          host: "localhost",
          database: "sample_db",
          credentials: "DB_MAIN"
        }
      }
    },
    agentMappings: {
      sales: {
        dataSources: ["primary"],
        permissions: {
          primary: ["read", "write"]
        },
        mcpServer: "sales-assistant"
      }
    }
  }

  const handleCreateContext = () => {
    if (!newContextName.trim()) {
      toast.error('Context name is required')
      return
    }
    
    // In real implementation, this would call the API
    toast.success(`Context "${newContextName}" created successfully`)
    setShowCreateForm(false)
    setNewContextName('')
    // Refetch contexts
    queryClient.invalidateQueries('contexts')
  }

  const handleEditContext = (context) => {
    setSelectedContext(context)
    setEditedContent(JSON.stringify(sampleContext, null, 2))
    setIsEditing(true)
  }

  const handleSaveContext = () => {
    try {
      JSON.parse(editedContent) // Validate JSON
      // In real implementation, this would call the API
      toast.success('Context updated successfully')
      setIsEditing(false)
      queryClient.invalidateQueries('contexts')
    } catch (error) {
      toast.error('Invalid JSON format')
    }
  }

  const handleDeleteContext = (contextName) => {
    if (window.confirm(`Are you sure you want to delete context "${contextName}"?`)) {
      // In real implementation, this would call the API
      toast.success(`Context "${contextName}" deleted successfully`)
      queryClient.invalidateQueries('contexts')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Database className="mr-3 h-8 w-8 text-forge-600" />
            Context Manager
          </h1>
          <p className="text-gray-600 mt-1">Configure business contexts and agent settings</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary px-4 py-2"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Context
        </button>
      </div>

      {/* Create Context Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Create New Context</h3>
              <button onClick={() => setShowCreateForm(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Context Name
                </label>
                <input
                  type="text"
                  value={newContextName}
                  onChange={(e) => setNewContextName(e.target.value)}
                  className="input w-full"
                  placeholder="e.g., my-company"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="btn-secondary px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateContext}
                  className="btn-primary px-4 py-2"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Context List */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Contexts</h2>
          <div className="space-y-3">
            {contexts.map((context) => (
              <div key={context.name} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Building className="h-5 w-5 text-forge-600" />
                    <div>
                      <h3 className="font-medium text-gray-900">{context.name}</h3>
                      <p className="text-sm text-gray-500">{context.company.name}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditContext(context)}
                      className="text-gray-400 hover:text-forge-600"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteContext(context.name)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 text-gray-400 mr-1" />
                    {context.agents.length} Agents
                  </div>
                  <div className="flex items-center">
                    <Database className="h-4 w-4 text-gray-400 mr-1" />
                    {context.dataSources} Sources
                  </div>
                  <div className="flex items-center">
                    <Settings className="h-4 w-4 text-gray-400 mr-1" />
                    {context.company.industry}
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Modified: {new Date(context.lastModified).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Context Editor */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {isEditing ? `Edit: ${selectedContext?.name || 'Context'}` : 'Context Details'}
            </h2>
            {isEditing && (
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="btn-secondary px-3 py-1 text-sm"
                >
                  <X className="mr-1 h-4 w-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSaveContext}
                  className="btn-primary px-3 py-1 text-sm"
                >
                  <Save className="mr-1 h-4 w-4" />
                  Save
                </button>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="h-96">
              <MonacoEditor
                height="100%"
                defaultLanguage="json"
                value={editedContent}
                onChange={setEditedContent}
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                  wordWrap: 'on',
                }}
                theme="vs-light"
              />
            </div>
          ) : selectedContext ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Company</label>
                  <p className="text-sm text-gray-900">{selectedContext.company.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Industry</label>
                  <p className="text-sm text-gray-900">{selectedContext.company.industry}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Configured Agents</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedContext.agents.map((agent) => (
                    <span key={agent} className="px-2 py-1 bg-forge-100 text-forge-700 rounded-md text-sm">
                      {agent}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Configuration Preview</label>
                <pre className="mt-1 text-xs bg-gray-50 p-3 rounded-md overflow-auto max-h-64">
                  {JSON.stringify(sampleContext, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Select a context to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Context Templates */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Context Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'E-commerce', description: 'Sales + Inventory + Support agents', icon: '🛒' },
            { name: 'SaaS Company', description: 'Sales + Support + Marketing agents', icon: '💻' },
            { name: 'Service Business', description: 'Sales + Support + Scheduling agents', icon: '🛠️' },
          ].map((template) => (
            <div key={template.name} className="border rounded-lg p-4 hover:border-forge-500 cursor-pointer">
              <div className="text-center">
                <div className="text-2xl mb-2">{template.icon}</div>
                <h3 className="font-medium text-gray-900">{template.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                <button className="mt-3 text-sm text-forge-600 hover:text-forge-700">
                  Use Template
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ContextManager