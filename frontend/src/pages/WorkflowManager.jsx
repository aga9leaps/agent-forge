import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Clock,
  CheckCircle,
  AlertCircle,
  Workflow,
  Upload,
  Download
} from 'lucide-react'
import toast from 'react-hot-toast'
import { agentForgeAPI } from '../services/api'

function WorkflowManager() {
  const [selectedWorkflows, setSelectedWorkflows] = useState([])
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: workflows, isLoading, error } = useQuery(
    'workflows',
    agentForgeAPI.workflows.list
  )

  const executeMutation = useMutation(
    ({ name, inputs }) => agentForgeAPI.workflows.execute(name, inputs),
    {
      onSuccess: (data, variables) => {
        toast.success(`Workflow "${variables.name}" executed successfully`)
        navigate('/executions')
      },
      onError: (error, variables) => {
        toast.error(`Failed to execute workflow "${variables.name}": ${error.message}`)
      }
    }
  )

  const handleExecuteWorkflow = (workflowName) => {
    const inputs = {}
    executeMutation.mutate({ name: workflowName, inputs })
  }

  const handleDeleteWorkflow = (workflowName) => {
    if (window.confirm(`Are you sure you want to delete workflow "${workflowName}"?`)) {
      // In real implementation, this would call the API
      toast.success(`Workflow "${workflowName}" deleted successfully`)
      queryClient.invalidateQueries('workflows')
    }
  }

  const mockWorkflows = [
    {
      name: 'simple-node-tests',
      description: 'Simple test workflows for each implemented node type',
      steps: 10,
      status: 'active',
      lastRun: '2024-01-15T10:30:00Z',
      successRate: 98.5,
      totalRuns: 156,
      avgDuration: '1.2s'
    },
    {
      name: 'shopify-order-processor',
      description: 'Process new Shopify orders and update inventory',
      steps: 6,
      status: 'active',
      lastRun: '2024-01-15T09:45:00Z',
      successRate: 99.1,
      totalRuns: 342,
      avgDuration: '2.1s'
    },
    {
      name: 'customer-support-alert',
      description: 'Alert system for high-priority support tickets',
      steps: 4,
      status: 'paused',
      lastRun: '2024-01-14T16:20:00Z',
      successRate: 97.8,
      totalRuns: 89,
      avgDuration: '0.8s'
    }
  ]

  const workflowsData = workflows?.data?.workflows || mockWorkflows

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forge-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Workflow className="mr-3 h-8 w-8 text-forge-600" />
            Workflow Manager
          </h1>
          <p className="text-gray-600 mt-1">Create, edit, and manage your automation workflows</p>
        </div>
        <div className="flex space-x-3">
          <button className="btn-secondary px-4 py-2">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </button>
          <Link to="/workflows/editor" className="btn-primary px-4 py-2">
            <Plus className="mr-2 h-4 w-4" />
            New Workflow
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-100">
              <Workflow className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Workflows</p>
              <p className="text-2xl font-bold text-gray-900">{workflowsData.length}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-green-100">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {workflowsData.filter(w => w.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-yellow-100">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Paused</p>
              <p className="text-2xl font-bold text-gray-900">
                {workflowsData.filter(w => w.status === 'paused').length}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-purple-100">
              <Play className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Executions</p>
              <p className="text-2xl font-bold text-gray-900">
                {workflowsData.reduce((sum, w) => sum + (w.totalRuns || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Workflows Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Workflows</h2>
          <div className="flex items-center space-x-3">
            <select className="select text-sm">
              <option>All Statuses</option>
              <option>Active</option>
              <option>Paused</option>
              <option>Draft</option>
            </select>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Search workflows..."
                className="input text-sm w-64"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium text-gray-600">
                  <input type="checkbox" className="rounded" />
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Workflow</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Steps</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Success Rate</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Last Run</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {workflowsData.map((workflow) => (
                <tr key={workflow.name} className="border-b hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <input type="checkbox" className="rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <div className="font-medium text-gray-900">{workflow.name}</div>
                      <div className="text-sm text-gray-500">{workflow.description}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      workflow.status === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : workflow.status === 'paused'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1 ${
                        workflow.status === 'active' ? 'bg-green-400' : 
                        workflow.status === 'paused' ? 'bg-yellow-400' : 'bg-gray-400'
                      }`}></span>
                      {workflow.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-900">{workflow.steps}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center">
                      <div className="text-sm text-gray-900">{workflow.successRate}%</div>
                      <div className="ml-2 w-16 bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-green-500 h-1.5 rounded-full"
                          style={{ width: `${workflow.successRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-500">
                    {workflow.lastRun ? new Date(workflow.lastRun).toLocaleString() : 'Never'}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleExecuteWorkflow(workflow.name)}
                        className="text-green-600 hover:text-green-700"
                        title="Execute"
                      >
                        <Play className="h-4 w-4" />
                      </button>
                      <Link
                        to={`/workflows/editor/${workflow.name}`}
                        className="text-gray-600 hover:text-gray-700"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        className="text-gray-600 hover:text-gray-700"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteWorkflow(workflow.name)}
                        className="text-red-600 hover:text-red-700"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {workflowsData.length === 0 && (
          <div className="text-center py-12">
            <Workflow className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No workflows</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new workflow.
            </p>
            <div className="mt-6">
              <Link to="/workflows/editor" className="btn-primary px-4 py-2">
                <Plus className="mr-2 h-4 w-4" />
                New Workflow
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default WorkflowManager