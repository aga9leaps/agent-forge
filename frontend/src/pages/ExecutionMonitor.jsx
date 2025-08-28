import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  RefreshCw,
  Filter,
  Download
} from 'lucide-react'
import { agentForgeAPI } from '../services/api'

function ExecutionMonitor() {
  const [selectedExecution, setSelectedExecution] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')

  // Mock data for demonstration
  const mockExecutions = [
    {
      id: '219a8149-de94-48f2-ad0d-07116b1240ba',
      workflowName: 'simple-node-tests',
      status: 'completed',
      startTime: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
      endTime: new Date(Date.now() - 299134).toISOString(),
      duration: 866,
      inputs: { message: 'Testing the platform' },
      outputs: { test_results: '[object Object]' },
      stepResults: [
        { stepId: 'log_input', status: 'completed', duration: 45, output: 'Processing: Testing the platform' },
        { stepId: 'transform_message', status: 'completed', duration: 23, output: { original: 'Testing the platform', uppercase: 'TESTING THE PLATFORM' } },
        { stepId: 'http_request', status: 'completed', duration: 750, output: { status: 200, data: {} } },
        { stepId: 'final_output', status: 'completed', duration: 48, output: 'Processed 20 characters' },
      ]
    },
    {
      id: 'abc123-def456-ghi789',
      workflowName: 'shopify-order-processor',
      status: 'running',
      startTime: new Date(Date.now() - 30000).toISOString(), // 30 seconds ago
      endTime: null,
      duration: 30000,
      inputs: { orderId: '12345' },
      outputs: null,
      stepResults: [
        { stepId: 'fetch_order', status: 'completed', duration: 234, output: { orderId: '12345', total: 99.99 } },
        { stepId: 'update_inventory', status: 'running', duration: null, output: null },
      ]
    },
    {
      id: 'xyz789-uvw456-rst123',
      workflowName: 'customer-support-alert',
      status: 'failed',
      startTime: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
      endTime: new Date(Date.now() - 598500).toISOString(),
      duration: 1500,
      inputs: { ticketId: '67890' },
      outputs: null,
      error: {
        message: 'Failed to send notification email',
        step: 'send_email'
      },
      stepResults: [
        { stepId: 'fetch_ticket', status: 'completed', duration: 156, output: { ticketId: '67890', priority: 'high' } },
        { stepId: 'send_email', status: 'failed', duration: 1344, error: 'SMTP connection failed' },
      ]
    }
  ]

  const filteredExecutions = mockExecutions.filter(execution => 
    statusFilter === 'all' || execution.status === statusFilter
  )

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'running':
        return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'running':
        return 'bg-blue-100 text-blue-800'
      case 'failed':
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
            <Play className="mr-3 h-8 w-8 text-forge-600" />
            Execution Monitor
          </h1>
          <p className="text-gray-600 mt-1">Monitor and debug workflow executions</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="btn-secondary px-4 py-2">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </button>
          <button className="btn-secondary px-4 py-2">
            <Download className="mr-2 h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-100">
              <Play className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Executions</p>
              <p className="text-2xl font-bold text-gray-900">{mockExecutions.length}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-green-100">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {mockExecutions.filter(e => e.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-100">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Running</p>
              <p className="text-2xl font-bold text-gray-900">
                {mockExecutions.filter(e => e.status === 'running').length}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-red-100">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-gray-900">
                {mockExecutions.filter(e => e.status === 'failed').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Executions List */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Executions</h2>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select text-sm"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="running">Running</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredExecutions.map((execution) => (
              <div
                key={execution.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedExecution?.id === execution.id ? 'border-forge-500 bg-forge-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedExecution(execution)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(execution.status)}
                    <div>
                      <div className="font-medium text-gray-900">{execution.workflowName}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(execution.startTime).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(execution.status)}`}>
                      {execution.status}
                    </span>
                    <div className="text-sm text-gray-500 mt-1">
                      {execution.duration ? `${execution.duration}ms` : 'Running...'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Execution Details */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Execution Details</h2>
            {selectedExecution && (
              <button className="btn-secondary px-3 py-1 text-sm">
                <Eye className="mr-1 h-4 w-4" />
                View Full Log
              </button>
            )}
          </div>

          {selectedExecution ? (
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-600">Execution ID</label>
                  <p className="text-sm text-gray-900 font-mono">{selectedExecution.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Workflow</label>
                  <p className="text-sm text-gray-900">{selectedExecution.workflowName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Start Time</label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedExecution.startTime).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Duration</label>
                  <p className="text-sm text-gray-900">
                    {selectedExecution.duration ? `${selectedExecution.duration}ms` : 'Running...'}
                  </p>
                </div>
              </div>

              {/* Inputs */}
              <div>
                <label className="text-sm font-medium text-gray-600">Inputs</label>
                <pre className="mt-1 text-xs bg-gray-50 p-3 rounded-md overflow-auto">
                  {JSON.stringify(selectedExecution.inputs, null, 2)}
                </pre>
              </div>

              {/* Step Results */}
              <div>
                <label className="text-sm font-medium text-gray-600 mb-2 block">Step Results</label>
                <div className="space-y-2">
                  {selectedExecution.stepResults.map((step, index) => (
                    <div key={step.stepId} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{index + 1}. {step.stepId}</span>
                          {step.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                          {step.status === 'running' && <Clock className="h-4 w-4 text-blue-500" />}
                          {step.status === 'failed' && <XCircle className="h-4 w-4 text-red-500" />}
                        </div>
                        <span className="text-xs text-gray-500">
                          {step.duration ? `${step.duration}ms` : 'Running...'}
                        </span>
                      </div>
                      
                      {step.output && (
                        <div className="mt-2">
                          <label className="text-xs font-medium text-gray-600">Output:</label>
                          <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto max-h-20">
                            {typeof step.output === 'string' ? step.output : JSON.stringify(step.output, null, 2)}
                          </pre>
                        </div>
                      )}
                      
                      {step.error && (
                        <div className="mt-2">
                          <label className="text-xs font-medium text-red-600">Error:</label>
                          <pre className="text-xs bg-red-50 p-2 rounded mt-1 text-red-700">
                            {step.error}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Outputs */}
              {selectedExecution.outputs && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Outputs</label>
                  <pre className="mt-1 text-xs bg-gray-50 p-3 rounded-md overflow-auto">
                    {JSON.stringify(selectedExecution.outputs, null, 2)}
                  </pre>
                </div>
              )}

              {/* Error */}
              {selectedExecution.error && (
                <div>
                  <label className="text-sm font-medium text-red-600">Error</label>
                  <div className="mt-1 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-700">{selectedExecution.error.message}</p>
                    {selectedExecution.error.step && (
                      <p className="text-xs text-red-600 mt-1">Failed at step: {selectedExecution.error.step}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <Play className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Select an execution to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ExecutionMonitor