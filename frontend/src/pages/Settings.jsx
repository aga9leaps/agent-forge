import React, { useState } from 'react'
import { 
  Settings as SettingsIcon, 
  Save, 
  RefreshCw,
  Database,
  Key,
  Bell,
  Users,
  Shield,
  Monitor,
  Globe
} from 'lucide-react'
import toast from 'react-hot-toast'

function Settings() {
  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState({
    // General settings
    platformName: 'Agent Forge',
    platformDescription: 'Where AI agents are forged',
    defaultContext: 'default',
    maxConcurrentExecutions: 10,
    logLevel: 'info',
    
    // Database settings
    databaseHost: 'localhost',
    databasePort: 3306,
    databaseName: 'agent_forge',
    mongoUri: 'mongodb://localhost:27017/agent_forge',
    
    // API settings
    apiTimeout: 30000,
    rateLimitRequests: 100,
    rateLimitWindow: 60000,
    
    // Security settings
    jwtExpiration: '24h',
    enableApiKeys: true,
    requireAuth: false,
    corsOrigins: '*',
    
    // Notification settings
    enableEmailNotifications: true,
    emailSmtpHost: 'smtp.gmail.com',
    emailSmtpPort: 587,
    notifyOnFailure: true,
    notifyOnSuccess: false,
  })

  const tabs = [
    { id: 'general', name: 'General', icon: SettingsIcon },
    { id: 'database', name: 'Database', icon: Database },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'monitoring', name: 'Monitoring', icon: Monitor },
  ]

  const handleSave = () => {
    // In real implementation, this would call the API
    toast.success('Settings saved successfully')
  }

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
      // Reset to default values
      toast.success('Settings reset to defaults')
    }
  }

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Platform Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Platform Name
                  </label>
                  <input
                    type="text"
                    value={settings.platformName}
                    onChange={(e) => updateSetting('platformName', e.target.value)}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Context
                  </label>
                  <select
                    value={settings.defaultContext}
                    onChange={(e) => updateSetting('defaultContext', e.target.value)}
                    className="select w-full"
                  >
                    <option value="default">Default</option>
                    <option value="techstart">TechStart</option>
                    <option value="retail-chain">Retail Chain</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Platform Description
                </label>
                <textarea
                  value={settings.platformDescription}
                  onChange={(e) => updateSetting('platformDescription', e.target.value)}
                  className="textarea w-full"
                  rows={3}
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Concurrent Executions
                  </label>
                  <input
                    type="number"
                    value={settings.maxConcurrentExecutions}
                    onChange={(e) => updateSetting('maxConcurrentExecutions', parseInt(e.target.value))}
                    className="input w-full"
                    min="1"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Log Level
                  </label>
                  <select
                    value={settings.logLevel}
                    onChange={(e) => updateSetting('logLevel', e.target.value)}
                    className="select w-full"
                  >
                    <option value="error">Error</option>
                    <option value="warn">Warning</option>
                    <option value="info">Info</option>
                    <option value="debug">Debug</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )

      case 'database':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">MySQL Database</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Host
                  </label>
                  <input
                    type="text"
                    value={settings.databaseHost}
                    onChange={(e) => updateSetting('databaseHost', e.target.value)}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Port
                  </label>
                  <input
                    type="number"
                    value={settings.databasePort}
                    onChange={(e) => updateSetting('databasePort', parseInt(e.target.value))}
                    className="input w-full"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Database Name
                  </label>
                  <input
                    type="text"
                    value={settings.databaseName}
                    onChange={(e) => updateSetting('databaseName', e.target.value)}
                    className="input w-full"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">MongoDB</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Connection URI
                </label>
                <input
                  type="text"
                  value={settings.mongoUri}
                  onChange={(e) => updateSetting('mongoUri', e.target.value)}
                  className="input w-full"
                  placeholder="mongodb://localhost:27017/agent_forge"
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button className="btn-secondary px-4 py-2">
                Test Connection
              </button>
              <button className="btn-secondary px-4 py-2">
                Run Migrations
              </button>
            </div>
          </div>
        )

      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Authentication</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Require Authentication
                    </label>
                    <p className="text-sm text-gray-500">
                      Enable authentication for API access
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.requireAuth}
                    onChange={(e) => updateSetting('requireAuth', e.target.checked)}
                    className="rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Enable API Keys
                    </label>
                    <p className="text-sm text-gray-500">
                      Allow API key authentication
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enableApiKeys}
                    onChange={(e) => updateSetting('enableApiKeys', e.target.checked)}
                    className="rounded"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">JWT Configuration</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Token Expiration
                </label>
                <select
                  value={settings.jwtExpiration}
                  onChange={(e) => updateSetting('jwtExpiration', e.target.value)}
                  className="select w-full"
                >
                  <option value="1h">1 Hour</option>
                  <option value="24h">24 Hours</option>
                  <option value="7d">7 Days</option>
                  <option value="30d">30 Days</option>
                </select>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">CORS</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Allowed Origins
                </label>
                <input
                  type="text"
                  value={settings.corsOrigins}
                  onChange={(e) => updateSetting('corsOrigins', e.target.value)}
                  className="input w-full"
                  placeholder="*"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Comma-separated list of allowed origins, or * for all
                </p>
              </div>
            </div>
          </div>
        )

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Email Notifications</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Enable Email Notifications
                    </label>
                    <p className="text-sm text-gray-500">
                      Send email notifications for workflow events
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enableEmailNotifications}
                    onChange={(e) => updateSetting('enableEmailNotifications', e.target.checked)}
                    className="rounded"
                  />
                </div>

                {settings.enableEmailNotifications && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-4 p-4 border-l-2 border-gray-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        SMTP Host
                      </label>
                      <input
                        type="text"
                        value={settings.emailSmtpHost}
                        onChange={(e) => updateSetting('emailSmtpHost', e.target.value)}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        SMTP Port
                      </label>
                      <input
                        type="number"
                        value={settings.emailSmtpPort}
                        onChange={(e) => updateSetting('emailSmtpPort', parseInt(e.target.value))}
                        className="input w-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Triggers</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Notify on Workflow Failure
                    </label>
                    <p className="text-sm text-gray-500">
                      Send notifications when workflows fail
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifyOnFailure}
                    onChange={(e) => updateSetting('notifyOnFailure', e.target.checked)}
                    className="rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Notify on Workflow Success
                    </label>
                    <p className="text-sm text-gray-500">
                      Send notifications when workflows complete successfully
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifyOnSuccess}
                    onChange={(e) => updateSetting('notifyOnSuccess', e.target.checked)}
                    className="rounded"
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 'monitoring':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">API Rate Limiting</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Requests per Window
                  </label>
                  <input
                    type="number"
                    value={settings.rateLimitRequests}
                    onChange={(e) => updateSetting('rateLimitRequests', parseInt(e.target.value))}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Window Size (ms)
                  </label>
                  <input
                    type="number"
                    value={settings.rateLimitWindow}
                    onChange={(e) => updateSetting('rateLimitWindow', parseInt(e.target.value))}
                    className="input w-full"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Timeouts</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Timeout (ms)
                </label>
                <input
                  type="number"
                  value={settings.apiTimeout}
                  onChange={(e) => updateSetting('apiTimeout', parseInt(e.target.value))}
                  className="input w-full"
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">System Information</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Version:</span>
                    <span className="ml-2 text-gray-900">Type 35 (v2.0)</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Node.js:</span>
                    <span className="ml-2 text-gray-900">v18.19.1</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Uptime:</span>
                    <span className="ml-2 text-gray-900">2h 34m 12s</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Memory Usage:</span>
                    <span className="ml-2 text-gray-900">156MB / 512MB</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <SettingsIcon className="mr-3 h-8 w-8 text-forge-600" />
            Settings
          </h1>
          <p className="text-gray-600 mt-1">Configure Agent Forge platform settings</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleReset}
            className="btn-secondary px-4 py-2"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset
          </button>
          <button
            onClick={handleSave}
            className="btn-primary px-4 py-2"
          >
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-forge-100 text-forge-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="mr-3 h-4 w-4" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="card">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings