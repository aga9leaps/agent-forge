import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import ContextManager from './pages/ContextManager'
import WorkflowManager from './pages/WorkflowManager'
import WorkflowEditor from './pages/WorkflowEditor'
import ExecutionMonitor from './pages/ExecutionMonitor'
import NodeLibrary from './pages/NodeLibrary'
import TestDataManager from './pages/TestDataManager'
import Settings from './pages/Settings'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/contexts" element={<ContextManager />} />
        <Route path="/workflows" element={<WorkflowManager />} />
        <Route path="/workflows/editor" element={<WorkflowEditor />} />
        <Route path="/workflows/editor/:workflowName" element={<WorkflowEditor />} />
        <Route path="/executions" element={<ExecutionMonitor />} />
        <Route path="/nodes" element={<NodeLibrary />} />
        <Route path="/test-data" element={<TestDataManager />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  )
}

export default App