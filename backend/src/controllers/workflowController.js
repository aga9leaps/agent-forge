import WorkflowEngine from '../workflow/WorkflowEngine.js';

// Create singleton workflow engine instance
const workflowEngine = new WorkflowEngine();

// Initialize the workflow engine
(async () => {
  try {
    await workflowEngine.initialize();
    console.log('WorkflowEngine initialized successfully');
  } catch (error) {
    console.error('Failed to initialize WorkflowEngine:', error);
  }
})();

/**
 * Workflow Controller
 * Handles HTTP requests for workflow operations
 */
class WorkflowController {
  
  /**
   * Load a workflow from file
   * POST /api/workflows/load
   */
  async loadWorkflow(req, res) {
    try {
      const { filePath } = req.body;
      
      if (!filePath) {
        return res.status(400).json({
          success: false,
          error: 'filePath is required'
        });
      }
      
      const workflow = await workflowEngine.loadWorkflow(filePath);
      
      res.json({
        success: true,
        message: `Workflow '${workflow.name}' loaded successfully`,
        workflow: {
          name: workflow.name,
          version: workflow.version,
          description: workflow.description,
          steps: workflow.steps.length,
          inputs: workflow.inputs ? Object.keys(workflow.inputs) : [],
          outputs: workflow.outputs ? Object.keys(workflow.outputs) : []
        }
      });
      
    } catch (error) {
      console.error('Error loading workflow:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Execute a workflow
   * POST /api/workflows/execute/:workflowName
   */
  async executeWorkflow(req, res) {
    try {
      const { workflowName } = req.params;
      const { inputs = {} } = req.body;
      
      // Ensure WorkflowEngine is initialized
      if (!workflowEngine.initialized) {
        console.log('WorkflowEngine not initialized yet, initializing now...');
        await workflowEngine.initialize();
      }
      
      console.log('Registered node types:', Array.from(workflowEngine.nodeExecutors.keys()));
      
      // Use context from middleware if available
      const context = req.context || {};
      
      console.log(`Executing workflow: ${workflowName} with inputs:`, inputs);
      
      const result = await workflowEngine.executeWorkflow(workflowName, inputs, context);
      
      res.json({
        success: true,
        executionId: result.executionId,
        status: result.status,
        outputs: result.outputs,
        duration: result.duration
      });
      
    } catch (error) {
      console.error('Error executing workflow:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * Get workflow execution details
   * GET /api/workflows/executions/:executionId
   */
  async getExecution(req, res) {
    try {
      const { executionId } = req.params;
      
      const execution = workflowEngine.getExecution(executionId);
      
      if (!execution) {
        return res.status(404).json({
          success: false,
          error: 'Execution not found'
        });
      }
      
      res.json({
        success: true,
        execution: {
          id: execution.id,
          workflowName: execution.workflowName,
          status: execution.status,
          startTime: execution.startTime,
          endTime: execution.endTime,
          duration: execution.duration,
          inputs: execution.inputs,
          outputs: execution.outputs,
          stepResults: execution.stepResults,
          error: execution.error
        }
      });
      
    } catch (error) {
      console.error('Error getting execution:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * List all loaded workflows
   * GET /api/workflows
   */
  async listWorkflows(req, res) {
    try {
      const workflowNames = workflowEngine.listWorkflows();
      const workflows = [];
      
      for (const name of workflowNames) {
        const workflow = workflowEngine.getWorkflow(name);
        workflows.push({
          name: workflow.name,
          version: workflow.version,
          description: workflow.description,
          steps: workflow.steps.length,
          loadedAt: workflow.loadedAt,
          filePath: workflow.filePath
        });
      }
      
      res.json({
        success: true,
        workflows,
        total: workflows.length
      });
      
    } catch (error) {
      console.error('Error listing workflows:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get workflow definition
   * GET /api/workflows/:workflowName
   */
  async getWorkflow(req, res) {
    try {
      const { workflowName } = req.params;
      
      const workflow = workflowEngine.getWorkflow(workflowName);
      
      if (!workflow) {
        return res.status(404).json({
          success: false,
          error: 'Workflow not found'
        });
      }
      
      res.json({
        success: true,
        workflow: {
          name: workflow.name,
          version: workflow.version,
          description: workflow.description,
          inputs: workflow.inputs,
          outputs: workflow.outputs,
          steps: workflow.steps,
          trigger: workflow.trigger,
          loadedAt: workflow.loadedAt
        }
      });
      
    } catch (error) {
      console.error('Error getting workflow:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Validate workflow file
   * POST /api/workflows/validate
   */
  async validateWorkflow(req, res) {
    try {
      const { filePath, workflowData } = req.body;
      
      let workflow;
      if (workflowData) {
        // Validate provided workflow data
        workflow = workflowData;
      } else if (filePath) {
        // Load and validate from file
        workflow = await workflowEngine.loadWorkflow(filePath);
      } else {
        return res.status(400).json({
          success: false,
          error: 'Either filePath or workflowData is required'
        });
      }
      
      // Validation is done in loadWorkflow
      res.json({
        success: true,
        message: 'Workflow is valid',
        workflow: {
          name: workflow.name,
          version: workflow.version,
          steps: workflow.steps.length,
          hasInputs: !!workflow.inputs,
          hasOutputs: !!workflow.outputs,
          hasTrigger: !!workflow.trigger
        }
      });
      
    } catch (error) {
      console.error('Error validating workflow:', error);
      res.status(400).json({
        success: false,
        error: error.message,
        type: 'validation_error'
      });
    }
  }
}

export default new WorkflowController();