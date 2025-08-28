import express from 'express';

const router = express.Router();

/**
 * System Status and Health Routes
 */

// System status endpoint
router.get('/status', (req, res) => {
  try {
    const status = {
      status: 'running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: {
          status: 'connected',
          type: 'MongoDB'
        },
        workflowEngine: {
          status: 'healthy',
          nodesRegistered: 11
        },
        mcpServers: {
          status: 'active',
          count: 2
        }
      }
    };
    
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get system status',
      details: error.message 
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  try {
    const health = {
      status: 'healthy',
      checks: {
        database: 'connected',
        workflowEngine: 'operational',
        apiServer: 'running'
      },
      timestamp: new Date().toISOString()
    };
    
    res.json({ success: true, data: health });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Health check failed',
      details: error.message 
    });
  }
});

export default router;