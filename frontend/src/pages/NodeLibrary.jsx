import React, { useState } from 'react'
import { 
  Boxes, 
  Search, 
  Globe, 
  Database, 
  Mail, 
  MessageSquare,
  Calendar,
  Code,
  Workflow,
  Users,
  Zap
} from 'lucide-react'

const nodeCategories = {
  core: {
    name: 'Core',
    icon: Zap,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    nodes: [
      {
        name: 'Output',
        type: 'output',
        description: 'Display, log, or return data from your workflow',
        inputs: ['Any data'],
        outputs: ['Formatted output'],
        icon: '📄',
        status: 'stable'
      },
      {
        name: 'Transform',
        type: 'transform',
        description: 'Transform data using JavaScript expressions',
        inputs: ['Any data'],
        outputs: ['Transformed data'],
        icon: '🔄',
        status: 'stable'
      },
      {
        name: 'Conditional',
        type: 'conditional',
        description: 'Execute different paths based on conditions',
        inputs: ['Condition', 'Data'],
        outputs: ['Conditional result'],
        icon: '🔀',
        status: 'stable'
      },
      {
        name: 'Agent',
        type: 'agent',
        description: 'Interact with AI agents using MCP protocols',
        inputs: ['Message', 'Context'],
        outputs: ['Agent response'],
        icon: '🤖',
        status: 'stable'
      }
    ]
  },
  integrations: {
    name: 'Integrations',
    icon: Globe,
    color: 'text-green-600',
    bg: 'bg-green-100',
    nodes: [
      {
        name: 'HTTP Request',
        type: 'http',
        description: 'Make HTTP requests to any API endpoint',
        inputs: ['URL', 'Headers', 'Body'],
        outputs: ['Response data'],
        icon: '🌐',
        status: 'stable'
      },
      {
        name: 'Database',
        type: 'database',
        description: 'Execute SQL queries on configured databases',
        inputs: ['Query', 'Parameters'],
        outputs: ['Query results'],
        icon: '🗄️',
        status: 'stable'
      },
      {
        name: 'Shopify',
        type: 'shopify',
        description: 'Interact with Shopify store APIs',
        inputs: ['Operation', 'Data'],
        outputs: ['Shopify response'],
        icon: '🛍️',
        status: 'stable'
      },
      {
        name: 'Google Sheets',
        type: 'google_sheets',
        description: 'Read from and write to Google Sheets',
        inputs: ['Sheet ID', 'Range', 'Data'],
        outputs: ['Sheet data'],
        icon: '📊',
        status: 'beta',
        note: 'Requires googleapis package'
      }
    ]
  },
  communication: {
    name: 'Communication',
    icon: MessageSquare,
    color: 'text-purple-600',
    bg: 'bg-purple-100',
    nodes: [
      {
        name: 'Email',
        type: 'email',
        description: 'Send emails via SMTP',
        inputs: ['To', 'Subject', 'Body'],
        outputs: ['Send status'],
        icon: '📧',
        status: 'beta',
        note: 'Requires nodemailer package'
      },
      {
        name: 'Slack',
        type: 'slack',
        description: 'Send messages to Slack channels',
        inputs: ['Channel', 'Message'],
        outputs: ['Message status'],
        icon: '💬',
        status: 'stable'
      },
      {
        name: 'Discord',
        type: 'discord',
        description: 'Send messages to Discord channels',
        inputs: ['Channel', 'Message'],
        outputs: ['Message status'],
        icon: '🎮',
        status: 'stable'
      },
      {
        name: 'Telegram',
        type: 'telegram',
        description: 'Send messages via Telegram bot',
        inputs: ['Chat ID', 'Message'],
        outputs: ['Message status'],
        icon: '✈️',
        status: 'stable'
      },
      {
        name: 'Microsoft Teams',
        type: 'teams',
        description: 'Send messages to Teams channels',
        inputs: ['Channel', 'Message'],
        outputs: ['Message status'],
        icon: '👥',
        status: 'stable'
      },
      {
        name: 'Twilio SMS',
        type: 'twilio',
        description: 'Send SMS messages via Twilio',
        inputs: ['To', 'Message'],
        outputs: ['SMS status'],
        icon: '📱',
        status: 'stable'
      }
    ]
  },
  utilities: {
    name: 'Utilities',
    icon: Calendar,
    color: 'text-orange-600',
    bg: 'bg-orange-100',
    nodes: [
      {
        name: 'DateTime',
        type: 'datetime',
        description: 'Date and time operations',
        inputs: ['Date', 'Format'],
        outputs: ['Formatted date'],
        icon: '📅',
        status: 'stable'
      }
    ]
  }
}

function NodeLibrary() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedNode, setSelectedNode] = useState(null)

  const allNodes = Object.values(nodeCategories).flatMap(category => 
    category.nodes.map(node => ({ ...node, category: category.name.toLowerCase() }))
  )

  const filteredNodes = allNodes.filter(node => {
    const matchesCategory = selectedCategory === 'all' || node.category === selectedCategory
    const matchesSearch = node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         node.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'stable':
        return 'bg-green-100 text-green-800'
      case 'beta':
        return 'bg-yellow-100 text-yellow-800'
      case 'alpha':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Boxes className="mr-3 h-8 w-8 text-forge-600" />
            Node Library
          </h1>
          <p className="text-gray-600 mt-1">Explore available workflow nodes and their capabilities</p>
        </div>
        <div className="bg-forge-50 px-4 py-2 rounded-lg">
          <div className="text-sm font-medium text-forge-700">
            {allNodes.length} nodes available
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="select"
        >
          <option value="all">All Categories</option>
          {Object.entries(nodeCategories).map(([key, category]) => (
            <option key={key} value={key}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Node Grid */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredNodes.map((node) => (
              <div
                key={node.type}
                className={`card cursor-pointer transition-all ${
                  selectedNode?.type === node.type ? 'ring-2 ring-forge-500' : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedNode(node)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{node.icon}</div>
                    <div>
                      <h3 className="font-medium text-gray-900">{node.name}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {node.description}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(node.status)}`}>
                    {node.status}
                  </span>
                </div>
                
                {node.note && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-xs text-yellow-700">{node.note}</p>
                  </div>
                )}
                
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Category: {node.category}</span>
                    <span>Type: {node.type}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredNodes.length === 0 && (
            <div className="text-center py-12">
              <Boxes className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No nodes found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          )}
        </div>

        {/* Node Details */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {selectedNode ? 'Node Details' : 'Select a Node'}
          </h2>

          {selectedNode ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="text-3xl">{selectedNode.icon}</div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{selectedNode.name}</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedNode.status)}`}>
                    {selectedNode.status}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                <p className="text-sm text-gray-600">{selectedNode.description}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Node Type</h4>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                  {selectedNode.type}
                </code>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Inputs</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {selectedNode.inputs.map((input, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      {input}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Outputs</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {selectedNode.outputs.map((output, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      {output}
                    </li>
                  ))}
                </ul>
              </div>

              {selectedNode.note && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <h4 className="text-sm font-medium text-yellow-800 mb-1">Note</h4>
                  <p className="text-sm text-yellow-700">{selectedNode.note}</p>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Example Configuration</h4>
                <pre className="text-xs bg-gray-50 p-3 rounded-md overflow-auto">
{`- id: ${selectedNode.name.toLowerCase().replace(/\s+/g, '_')}
  type: ${selectedNode.type}
  config:
    # Add your configuration here
    # See documentation for specific options`}
                </pre>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <Boxes className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Click on a node to view its details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Categories Overview */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Categories Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(nodeCategories).map(([key, category]) => (
            <div
              key={key}
              className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
              onClick={() => setSelectedCategory(key)}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${category.bg}`}>
                  <category.icon className={`h-5 w-5 ${category.color}`} />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{category.name}</h3>
                  <p className="text-sm text-gray-500">{category.nodes.length} nodes</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default NodeLibrary