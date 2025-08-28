import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use((config) => {
  // Add context header if available
  const context = localStorage.getItem('agent-forge-context')
  if (context) {
    config.headers['x-context'] = context
  }
  return config
})

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

// API endpoints
export const agentForgeAPI = {
  // Workflows
  workflows: {
    list: () => api.get('/workflows'),
    get: (name) => api.get(`/workflows/${name}`),
    execute: (name, inputs) => api.post(`/workflows/execute/${name}`, { inputs }),
    load: (filePath) => api.post('/workflows/load', { filePath }),
    validate: (workflowData) => api.post('/workflows/validate', { workflowData }),
  },

  // Executions
  executions: {
    get: (executionId) => api.get(`/workflows/executions/${executionId}`),
    list: () => api.get('/workflows/executions'),
  },

  // Contexts (Configuration Service)
  contexts: {
    list: () => api.get('/contexts'),
    get: (contextName) => api.get(`/contexts/${contextName}`),
    create: (contextName, contextData) => api.post('/contexts', { contextName, contextData }),
    update: (contextName, contextData) => api.put(`/contexts/${contextName}`, { contextData }),
    delete: (contextName) => api.delete(`/contexts/${contextName}`),
  },

  // Agents
  agents: {
    chat: (message, context) => api.post('/chat', { message, context }),
    sales: (message, context) => api.post('/sales/chat', { message, context }),
  },

  // System
  system: {
    status: () => api.get('/status'),
    health: () => api.get('/health'),
  },

  // File operations
  files: {
    upload: (file, path) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('path', path)
      return api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    download: (path) => api.get(`/files/download`, { params: { path } }),
    list: (directory) => api.get('/files/list', { params: { directory } }),
  },
}

export default api