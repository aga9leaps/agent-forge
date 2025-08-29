import React, { useState } from 'react'
import { Play, Database, Package, FileText, Copy, Check, Terminal, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import { agentForgeAPI } from '../services/api'
import LiveLogs from '../components/LiveLogs'

function TestDataManager() {
  const [activeTest, setActiveTest] = useState(null)
  const [testResults, setTestResults] = useState({})
  const [copied, setCopied] = useState('')
  const [showLogs, setShowLogs] = useState(false)
  const [currentExecution, setCurrentExecution] = useState(null)

  // Predefined test scenarios
  const testScenarios = {
    'complete-agent': {
      name: '🎯 Complete Inventory Agent - Full Context',
      description: 'Complete agent with business context, dummy data, and full workflow (BEST TEST)',
      workflow: 'complete-inventory-agent',
      inputs: {
        business_context: 'fashion-retail',
        test_mode: true
      },
      expectedBehavior: 'Complete end-to-end agent with context-aware analysis, bundle processing, purchase orders, and business recommendations'
    },

    'inventory-demo': {
      name: 'Inventory Demo - Basic Simulation',
      description: 'Simple inventory workflow with mock data (guaranteed to work)',
      workflow: 'inventory-demo',
      inputs: {
        store_name: 'Demo Fashion Store'
      },
      expectedBehavior: 'Will complete successfully with basic bundle processing, reorder calculations, and purchase orders'
    },

    'inventory-basic': {
      name: 'Inventory Management - API Test',
      description: 'Test real inventory agent with mock credentials (will show API failures)',
      workflow: 'inventory-management-agent',
      inputs: {
        shopify_store: 'demo-store.myshopify.com',
        shopify_token: 'shpat_demo_token_12345', 
        inventory_sheet_id: '1ABC123_demo_sheet_id_XYZ789',
        hours_lookback: 24
      },
      expectedBehavior: 'Will fail gracefully on API calls but show processing logic'
    },
    
    'inventory-sheets-setup': {
      name: 'Setup Inventory Sheets - Mock',
      description: 'Test Google Sheets setup workflow with mock data',
      workflow: 'setup-inventory-sheets', 
      inputs: {
        inventory_sheet_id: '1DEMO_SHEET_ID_FOR_TESTING_ONLY'
      },
      expectedBehavior: 'Will show Google Sheets structure setup (will fail on actual API)'
    },

    'shopify-api-basic': {
      name: 'Shopify API Test - Mock',
      description: 'Test Shopify integration with mock credentials',
      workflow: 'shopify-api-test',
      inputs: {
        shop_domain: 'demo-test-store.myshopify.com',
        access_token: 'shpat_demo_access_token_for_testing'
      },
      expectedBehavior: 'Will demonstrate Shopify API structure (expects auth failure)'
    },

    'hello-world-fixed': {
      name: 'Hello World - Basic Test',
      description: 'Simple workflow test that should work',
      workflow: 'hello-world-fixed',
      inputs: {
        name: 'Agent Forge Test User'
      },
      expectedBehavior: 'Should complete successfully and generate greeting'
    }
  }

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    toast.success(`Copied ${label}`)
    setTimeout(() => setCopied(''), 2000)
  }

  const runTest = async (testKey) => {
    const scenario = testScenarios[testKey]
    setActiveTest(testKey)
    
    try {
      toast.loading(`Running ${scenario.name}...`, { id: testKey })
      
      const result = await agentForgeAPI.workflows.execute(scenario.workflow, scenario.inputs)
      
      // Show live logs for successful executions
      if (result.executionId) {
        setCurrentExecution({
          id: result.executionId,
          workflowName: scenario.name
        })
        setShowLogs(true)
      }
      
      setTestResults(prev => ({
        ...prev,
        [testKey]: {
          success: true,
          result,
          timestamp: new Date().toLocaleString()
        }
      }))
      
      toast.success(`${scenario.name} completed!`, { id: testKey })
      
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [testKey]: {
          success: false,
          error: error.message,
          timestamp: new Date().toLocaleString()
        }
      }))
      
      // Don't show error toast for expected failures
      if (testKey === 'inventory-demo' || testKey === 'hello-world') {
        toast.error(`${scenario.name} failed: ${error.message}`, { id: testKey })
      } else {
        toast.success(`${scenario.name} ran (expected API failures)`, { id: testKey })
      }
    } finally {
      setActiveTest(null)
    }
  }

  const viewLogs = (testKey) => {
    const result = testResults[testKey]
    if (result?.result?.executionId) {
      setCurrentExecution({
        id: result.result.executionId,
        workflowName: testScenarios[testKey].name
      })
      setShowLogs(true)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Test Data Manager</h1>
            <p className="text-gray-600">Run workflow tests with predefined mock data</p>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">🧪 Safe Testing Environment</h3>
          <p className="text-blue-800 text-sm">
            These tests use mock data and are safe to run. API-dependent tests will show expected failures 
            but demonstrate the workflow logic. The Hello World test should complete successfully.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {Object.entries(testScenarios).map(([key, scenario]) => (
          <div key={key} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Package className="w-6 h-6 text-green-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">{scenario.name}</h3>
                  <p className="text-sm text-gray-600">{scenario.description}</p>
                </div>
              </div>
              
              <button
                onClick={() => runTest(key)}
                disabled={activeTest === key}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTest === key
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <Play className="w-4 h-4" />
                {activeTest === key ? 'Running...' : 'Run Test'}
              </button>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Test Inputs:</span>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(scenario.inputs, null, 2), 'inputs')}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                >
                  {copied === 'inputs' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  Copy JSON
                </button>
              </div>
              <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                {JSON.stringify(scenario.inputs, null, 2)}
              </pre>
            </div>

            <div className="mb-4">
              <span className="text-sm font-medium text-gray-700">Expected Behavior:</span>
              <p className="text-sm text-gray-600 mt-1">{scenario.expectedBehavior}</p>
            </div>

            {testResults[key] && (
              <div className={`mt-4 p-3 rounded-lg ${
                testResults[key].success ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${
                    testResults[key].success ? 'text-green-800' : 'text-yellow-800'
                  }`}>
                    {testResults[key].success ? '✅ Completed' : '⚠️ Expected Failure'}
                  </span>
                  <div className="flex items-center gap-2">
                    {testResults[key].success && testResults[key].result?.executionId && (
                      <button
                        onClick={() => viewLogs(key)}
                        className="flex items-center gap-1 text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                      >
                        <Terminal className="w-3 h-3" />
                        View Logs
                      </button>
                    )}
                    <span className="text-xs text-gray-500">{testResults[key].timestamp}</span>
                  </div>
                </div>
                
                {testResults[key].success && testResults[key].result && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-600">Result Summary:</span>
                      <button
                        onClick={() => copyToClipboard(JSON.stringify(testResults[key].result, null, 2), 'result')}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                      >
                        {copied === 'result' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        Copy
                      </button>
                    </div>
                    <pre className="bg-white p-2 rounded text-xs overflow-x-auto max-h-32 overflow-y-auto">
                      {JSON.stringify(testResults[key].result.outputs || testResults[key].result, null, 2)}
                    </pre>
                  </div>
                )}
                
                {!testResults[key].success && (
                  <p className="text-xs text-yellow-700 mt-1">
                    Error: {testResults[key].error}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Manual API Testing
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          You can also test workflows directly via API. Here are the curl commands:
        </p>
        
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-700">Inventory Management Agent:</span>
              <button
                onClick={() => copyToClipboard(`curl -X POST http://localhost:3000/api/workflows/execute/inventory-management-agent \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify({ inputs: testScenarios['inventory-basic'].inputs })}'`, 'curl-inventory')}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {copied === 'curl-inventory' ? '✓ Copied' : 'Copy curl'}
              </button>
            </div>
            <pre className="bg-white p-2 rounded text-xs overflow-x-auto">
              curl -X POST http://localhost:3000/api/workflows/execute/inventory-management-agent
            </pre>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-700">Hello World (should work):</span>
              <button
                onClick={() => copyToClipboard(`curl -X POST http://localhost:3000/api/workflows/execute/hello-world \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify({ inputs: testScenarios['hello-world'].inputs })}'`, 'curl-hello')}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {copied === 'curl-hello' ? '✓ Copied' : 'Copy curl'}
              </button>
            </div>
            <pre className="bg-white p-2 rounded text-xs overflow-x-auto">
              curl -X POST http://localhost:3000/api/workflows/execute/hello-world
            </pre>
          </div>
        </div>
      </div>

      {/* Live Logs Component */}
      <LiveLogs
        isOpen={showLogs}
        onClose={() => setShowLogs(false)}
        executionId={currentExecution?.id}
        workflowName={currentExecution?.workflowName}
      />
    </div>
  )
}

export default TestDataManager