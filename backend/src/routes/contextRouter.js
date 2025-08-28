import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Context files directory
const contextsDir = path.join(__dirname, '../../../configs/contexts');

/**
 * Context Management Routes
 */

// List all contexts
router.get('/', async (req, res) => {
  try {
    const files = await fs.readdir(contextsDir);
    const contexts = files
      .filter(file => file.endsWith('.json'))
      .map(file => ({
        name: file.replace('.json', ''),
        filename: file,
        path: path.join(contextsDir, file)
      }));

    res.json({ success: true, data: contexts, total: contexts.length });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to list contexts',
      details: error.message 
    });
  }
});

// Get specific context
router.get('/:contextName', async (req, res) => {
  try {
    const { contextName } = req.params;
    const contextPath = path.join(contextsDir, `${contextName}.json`);
    
    const contextData = await fs.readFile(contextPath, 'utf8');
    const context = JSON.parse(contextData);
    
    res.json({ 
      success: true, 
      data: context,
      metadata: {
        name: contextName,
        path: contextPath,
        lastModified: (await fs.stat(contextPath)).mtime
      }
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.status(404).json({ 
        success: false, 
        error: `Context '${req.params.contextName}' not found` 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get context',
        details: error.message 
      });
    }
  }
});

// Create new context
router.post('/', async (req, res) => {
  try {
    const { contextName, contextData } = req.body;
    
    if (!contextName || !contextData) {
      return res.status(400).json({ 
        success: false, 
        error: 'contextName and contextData are required' 
      });
    }
    
    const contextPath = path.join(contextsDir, `${contextName}.json`);
    
    // Check if context already exists
    try {
      await fs.access(contextPath);
      return res.status(409).json({ 
        success: false, 
        error: `Context '${contextName}' already exists` 
      });
    } catch (e) {
      // Context doesn't exist, continue with creation
    }
    
    await fs.writeFile(contextPath, JSON.stringify(contextData, null, 2));
    
    res.status(201).json({ 
      success: true, 
      message: `Context '${contextName}' created successfully`,
      data: { name: contextName, path: contextPath }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create context',
      details: error.message 
    });
  }
});

// Update existing context
router.put('/:contextName', async (req, res) => {
  try {
    const { contextName } = req.params;
    const { contextData } = req.body;
    
    if (!contextData) {
      return res.status(400).json({ 
        success: false, 
        error: 'contextData is required' 
      });
    }
    
    const contextPath = path.join(contextsDir, `${contextName}.json`);
    
    // Check if context exists
    try {
      await fs.access(contextPath);
    } catch (e) {
      return res.status(404).json({ 
        success: false, 
        error: `Context '${contextName}' not found` 
      });
    }
    
    await fs.writeFile(contextPath, JSON.stringify(contextData, null, 2));
    
    res.json({ 
      success: true, 
      message: `Context '${contextName}' updated successfully`,
      data: { name: contextName, path: contextPath }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update context',
      details: error.message 
    });
  }
});

// Delete context
router.delete('/:contextName', async (req, res) => {
  try {
    const { contextName } = req.params;
    const contextPath = path.join(contextsDir, `${contextName}.json`);
    
    // Check if context exists
    try {
      await fs.access(contextPath);
    } catch (e) {
      return res.status(404).json({ 
        success: false, 
        error: `Context '${contextName}' not found` 
      });
    }
    
    await fs.unlink(contextPath);
    
    res.json({ 
      success: true, 
      message: `Context '${contextName}' deleted successfully`
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete context',
      details: error.message 
    });
  }
});

export default router;