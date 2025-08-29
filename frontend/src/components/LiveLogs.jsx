import React, { useState, useEffect, useRef } from 'react'
import { Terminal, Play, X, Maximize2, Minimize2 } from 'lucide-react'

function LiveLogs({ isOpen, onClose, executionId, workflowName }) {
  const [logs, setLogs] = useState([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const logsEndRef = useRef(null)
  const pollIntervalRef = useRef(null)

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(scrollToBottom, [logs])

  // Simulate log fetching (in real implementation, you'd websocket or poll)
  useEffect(() => {
    if (!isOpen || !executionId) return

    const fetchLogs = async () => {
      try {
        // Get execution details
        const response = await fetch(`http://localhost:3000/api/workflows/executions/${executionId}`)
        if (response.ok) {
          const execution = await response.json()
          
          if (execution.success && execution.execution) {
            const newLogs = []
            
            // Add execution start log
            newLogs.push({
              timestamp: execution.execution.startTime,
              level: 'info',
              message: `🚀 Starting workflow: ${workflowName}`,
              data: { executionId }
            })

            // Add step logs
            if (execution.execution.stepResults) {
              execution.execution.stepResults.forEach(step => {
                newLogs.push({
                  timestamp: new Date().toISOString(),
                  level: step.success ? 'success' : 'error',
                  message: `${step.success ? '✅' : '❌'} Step: ${step.stepId}`,
                  data: step.success ? step.output : step.error
                })
              })
            }

            // Add completion log
            if (execution.execution.status === 'completed') {
              newLogs.push({
                timestamp: execution.execution.endTime,
                level: 'success',
                message: `🎉 Workflow completed in ${execution.execution.duration}ms`,
                data: execution.execution.outputs
              })
            } else if (execution.execution.status === 'failed') {
              newLogs.push({
                timestamp: execution.execution.endTime || new Date().toISOString(),
                level: 'error',
                message: `💥 Workflow failed: ${execution.execution.error?.message}`,
                data: execution.execution.error
              })
            }

            setLogs(newLogs)

            // Stop polling if workflow is done
            if (execution.execution.status !== 'running') {
              clearInterval(pollIntervalRef.current)
            }
          }
        }
      } catch (error) {
        setLogs(prev => [...prev, {
          timestamp: new Date().toISOString(),
          level: 'error',
          message: `Failed to fetch execution logs: ${error.message}`,
          data: null
        }])
      }
    }

    // Initial fetch
    fetchLogs()

    // Poll every 500ms for updates
    pollIntervalRef.current = setInterval(fetchLogs, 500)

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [isOpen, executionId, workflowName])

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const getLevelColor = (level) => {
    switch (level) {
      case 'success': return 'text-green-600'
      case 'error': return 'text-red-600'
      case 'warning': return 'text-yellow-600'
      default: return 'text-blue-600'
    }
  }

  const getLevelBg = (level) => {
    switch (level) {
      case 'success': return 'bg-green-50 border-green-200'
      case 'error': return 'bg-red-50 border-red-200'
      case 'warning': return 'bg-yellow-50 border-yellow-200'
      default: return 'bg-blue-50 border-blue-200'
    }
  }

  if (!isOpen) return null

  return (
    <div className={`fixed bg-white border border-gray-300 shadow-lg ${
      isFullscreen 
        ? 'inset-4 z-50' 
        : 'bottom-4 right-4 w-1/2 h-96 z-40'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-gray-600" />
          <span className="font-medium text-sm">Live Execution Logs</span>
          {executionId && (
            <span className="text-xs text-gray-500 font-mono">
              {executionId.slice(0, 8)}...
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 hover:bg-gray-200 rounded"
            title={isFullscreen ? "Minimize" : "Maximize"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Logs Content */}
      <div className="flex-1 overflow-auto p-3 bg-gray-900 text-green-400 font-mono text-xs" 
           style={{ height: isFullscreen ? 'calc(100% - 60px)' : 'calc(100% - 60px)' }}>
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Waiting for logs...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map((log, index) => (
              <div key={index} className="flex gap-2">
                <span className="text-gray-500 shrink-0">
                  [{formatTimestamp(log.timestamp)}]
                </span>
                <span className={`shrink-0 ${getLevelColor(log.level)}`}>
                  {log.level.toUpperCase()}
                </span>
                <span className="flex-1">{log.message}</span>
              </div>
            ))}
            
            {/* Auto-scroll anchor */}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>

      {/* Footer with execution info */}
      <div className="p-2 bg-gray-50 border-t text-xs text-gray-600">
        <div className="flex justify-between">
          <span>Workflow: {workflowName}</span>
          <span>{logs.length} log entries</span>
        </div>
      </div>
    </div>
  )
}

export default LiveLogs