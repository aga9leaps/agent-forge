import express from 'express';
import workflowController from '../controllers/workflowController.js';

const router = express.Router();

/**
 * Workflow Management Routes
 */

// Load workflow from file
router.post('/load', workflowController.loadWorkflow);

// Reload all workflows from disk
router.post('/reload', workflowController.reloadWorkflows);

// Validate workflow
router.post('/validate', workflowController.validateWorkflow);

// List all workflows
router.get('/', workflowController.listWorkflows);

// Get specific workflow definition
router.get('/:workflowName', workflowController.getWorkflow);

// Execute workflow
router.post('/execute/:workflowName', workflowController.executeWorkflow);

// Get execution details
router.get('/executions/:executionId', workflowController.getExecution);

export default router;