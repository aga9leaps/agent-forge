import React from 'react'
import { useQuery } from 'react-query'
import { 
  Activity, 
  Workflow, 
  Database, 
  Play, 
  CheckCircle, 
  AlertCircle,
  Clock,
  TrendingUp,
  Car
} from 'lucide-react'
import { agentForgeAPI } from '../services/api'

function Dashboard() {
  const { data: workflows, isLoading: workflowsLoading } = useQuery(
    'workflows',
    agentForgeAPI.workflows.list,
    { refetchInterval: 30000 }
  )

  const { data: systemStatus } = useQuery(
    'system-status',
    agentForgeAPI.system.status,
    { refetchInterval: 5000 }
  )

  const stats = [
    {
      name: 'Total Workflows',
      value: workflows?.data?.total || 0,
      icon: Workflow,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      change: '+12%',
      changeType: 'positive',
    },
    {
      name: 'Active Executions',
      value: '3',
      icon: Play,
      color: 'text-green-600',
      bg: 'bg-green-100',
      change: '+2',
      changeType: 'positive',
    },
    {
      name: 'Contexts',
      value: '5',
      icon: Database,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
      change: '+1',
      changeType: 'positive',
    },
    {
      name: 'Success Rate',
      value: '98.5%',
      icon: CheckCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
      change: '+0.3%',
      changeType: 'positive',
    },
  ]

  const recentExecutions = [
    {
      id: '1',
      workflow: 'shopify-order-processor',
      status: 'completed',
      duration: '1.2s',
      timestamp: '2 minutes ago',
    },
    {
      id: '2',
      workflow: 'customer-support-alert',
      status: 'running',
      duration: '0.8s',
      timestamp: '5 minutes ago',
    },
    {
      id: '3',
      workflow: 'inventory-restock-alert',
      status: 'completed',
      duration: '2.1s',
      timestamp: '10 minutes ago',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Car className="mr-3 h-8 w-8 text-forge-600" />
            Agent Forge Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Type 35 - Where AI agents are forged</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="card">
            <div className="flex items-center">
              <div className={`flex-shrink-0 p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  <span className={`ml-2 text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Executions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Executions</h2>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {recentExecutions.map((execution) => (
              <div key={execution.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`status-${execution.status}`}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{execution.workflow}</p>
                    <p className="text-xs text-gray-500">{execution.timestamp}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{execution.duration}</p>
                  <p className={`text-xs capitalize ${
                    execution.status === 'completed' ? 'text-green-600' :
                    execution.status === 'running' ? 'text-blue-600' : 'text-red-600'
                  }`}>
                    {execution.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Health */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">System Health</h2>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Workflow Engine</span>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm text-green-600">Healthy</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">MCP Servers</span>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm text-green-600">2 Active</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Database Connection</span>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm text-green-600">Connected</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Node Registry</span>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm text-green-600">11 Nodes</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-forge-500 hover:bg-forge-50 transition-colors group">
            <div className="text-center">
              <Workflow className="h-8 w-8 text-gray-400 group-hover:text-forge-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600 group-hover:text-forge-700">Create Workflow</p>
            </div>
          </button>
          <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-forge-500 hover:bg-forge-50 transition-colors group">
            <div className="text-center">
              <Database className="h-8 w-8 text-gray-400 group-hover:text-forge-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600 group-hover:text-forge-700">New Context</p>
            </div>
          </button>
          <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-forge-500 hover:bg-forge-50 transition-colors group">
            <div className="text-center">
              <Play className="h-8 w-8 text-gray-400 group-hover:text-forge-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600 group-hover:text-forge-700">Run Test</p>
            </div>
          </button>
          <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-forge-500 hover:bg-forge-50 transition-colors group">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-gray-400 group-hover:text-forge-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600 group-hover:text-forge-700">View Logs</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard