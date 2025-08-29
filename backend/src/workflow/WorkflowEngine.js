import fs from 'fs/promises';
import yaml from 'js-yaml';
import { v4 as uuid } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Core Workflow Execution Engine
 * Parses YAML/JSON workflow definitions and executes them step by step
 */
class WorkflowEngine {
  constructor() {
    this.workflows = new Map();           // Loaded workflow definitions
    this.executions = new Map();          // Active/completed executions
    this.nodeExecutors = new Map();       // Registered node type executors
    this.workflowsDir = path.join(__dirname, '../../workflows');
    this.initialized = false;
    
    // Don't call initialize() here - will be called explicitly
  }

  async initialize() {
    if (this.initialized) return;
    
    await this.registerBuiltInNodes();
    
    // Auto-load all workflows from the workflows directory
    try {
      await this.loadAllWorkflows();
    } catch (error) {
      console.warn('Failed to auto-load workflows:', error.message);
    }
    
    this.initialized = true;
    console.log('WorkflowEngine core initialization complete');
  }

  /**
   * Load workflow definition from file
   * @param {string} filePath - Path to workflow file
   * @returns {Object} Parsed workflow definition
   */
  async loadWorkflow(filePath) {
    try {
      const fullPath = path.isAbsolute(filePath) 
        ? filePath 
        : path.join(this.workflowsDir, filePath);
        
      const content = await fs.readFile(fullPath, 'utf8');
      
      // Parse based on file extension
      const ext = path.extname(fullPath).toLowerCase();
      let workflowDef;
      
      if (ext === '.yaml' || ext === '.yml') {
        workflowDef = yaml.load(content);
      } else if (ext === '.json') {
        workflowDef = JSON.parse(content);
      } else {
        throw new Error(`Unsupported file type: ${ext}`);
      }
      
      // Validate workflow definition
      this.validateWorkflow(workflowDef);
      
      // Store in memory
      this.workflows.set(workflowDef.name, {
        ...workflowDef,
        filePath: fullPath,
        loadedAt: new Date()
      });
      
      console.log(`Workflow '${workflowDef.name}' loaded successfully`);
      return workflowDef;
      
    } catch (error) {
      console.error(`Error loading workflow from ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Execute a workflow with given inputs
   * @param {string} workflowName - Name of workflow to execute
   * @param {Object} inputs - Input parameters
   * @param {Object} context - Business context (from middleware)
   * @returns {Object} Execution result
   */
  async executeWorkflow(workflowName, inputs = {}, context = {}) {
    const workflow = this.workflows.get(workflowName);
    if (!workflow) {
      throw new Error(`Workflow '${workflowName}' not found`);
    }

    const executionId = uuid();
    const execution = {
      id: executionId,
      workflowName,
      status: 'running',
      startTime: new Date(),
      endTime: null,
      inputs,
      context: {
        ...context,
        workflow: {
          name: workflowName,
          execution_id: executionId
        },
        inputs,
        steps: {},
        env: process.env
      },
      outputs: {},
      error: null,
      stepResults: []
    };

    this.executions.set(executionId, execution);
    
    try {
      console.log(`Starting workflow execution: ${workflowName} [${executionId}]`);
      
      // Validate inputs against schema
      if (workflow.inputs) {
        this.validateInputs(inputs, workflow.inputs);
      }
      
      // Execute steps sequentially
      for (const step of workflow.steps) {
        console.log(`Executing step: ${step.id}`);
        
        const stepResult = await this.executeStep(step, execution.context, execution);
        
        // Store step result in context
        execution.context.steps[step.id] = {
          output: stepResult,
          status: 'completed',
          executedAt: new Date()
        };
        
        execution.stepResults.push({
          stepId: step.id,
          status: 'completed',
          output: stepResult,
          duration: Date.now() - execution.startTime
        });
        
        console.log(`Step '${step.id}' completed`);
      }
      
      // Process outputs
      if (workflow.outputs) {
        execution.outputs = this.processOutputs(workflow.outputs, execution.context);
      } else {
        // Default: return last step output or success status
        const lastStep = workflow.steps[workflow.steps.length - 1];
        execution.outputs = lastStep 
          ? execution.context.steps[lastStep.id].output 
          : { status: 'completed' };
      }
      
      execution.status = 'completed';
      console.log(`Workflow '${workflowName}' completed successfully [${executionId}]`);
      
    } catch (error) {
      console.error(`Workflow '${workflowName}' failed [${executionId}]:`, error);
      execution.status = 'failed';
      execution.error = {
        message: error.message,
        stack: error.stack,
        step: execution.stepResults[execution.stepResults.length - 1]?.stepId
      };
      throw error;
      
    } finally {
      execution.endTime = new Date();
      execution.duration = execution.endTime - execution.startTime;
    }
    
    return {
      executionId,
      status: execution.status,
      outputs: execution.outputs,
      duration: execution.duration,
      error: execution.error
    };
  }

  /**
   * Execute a single workflow step
   * @param {Object} step - Step definition
   * @param {Object} context - Execution context
   * @param {Object} execution - Execution state
   * @returns {*} Step result
   */
  async executeStep(step, context, execution) {
    try {
      // Resolve step configuration with context variables
      const resolvedConfig = this.resolveVariables(step.config, context);
      
      // Get node executor
      const executor = this.nodeExecutors.get(step.type);
      if (!executor) {
        throw new Error(`Unknown step type: ${step.type}`);
      }
      
      // Execute the step
      const result = await executor(step, resolvedConfig, context);
      
      return result;
      
    } catch (error) {
      // Handle step errors based on error strategy
      const errorStrategy = step.on_error || 'stop';
      
      switch (errorStrategy) {
        case 'continue':
          console.warn(`Step '${step.id}' failed but continuing:`, error);
          return { error: error.message, status: 'failed' };
          
        case 'retry':
          if (step.retry && step.retry.attempts > 0) {
            console.log(`Retrying step '${step.id}', attempts remaining: ${step.retry.attempts}`);
            // Implement retry logic here
            // For now, just fail
          }
          throw error;
          
        case 'stop':
        default:
          throw error;
      }
    }
  }

  /**
   * Load node modules from the nodes directory
   */
  async loadNodeModules() {
    const nodesToLoad = [
      { name: 'http', file: 'HttpRequestNode.js', type: 'http' },
      { name: 'google_sheets', file: 'GoogleSheetsNode.js', type: 'google_sheets' },
      { name: 'shopify', file: 'ShopifyNode.js', type: 'shopify' },
      { name: 'database', file: 'DatabaseNode.js', type: 'database' },
      { name: 'email', file: 'EmailNode.js', type: 'email' },
      { name: 'datetime', file: 'DateTimeNode.js', type: 'datetime' },
      { name: 'slack', file: 'SlackNode.js', type: 'slack' },
      { name: 'telegram', file: 'TelegramNode.js', type: 'telegram' },
      { name: 'twilio', file: 'TwilioNode.js', type: 'twilio' },
      { name: 'discord', file: 'DiscordNode.js', type: 'discord' },
      { name: 'teams', file: 'TeamsNode.js', type: 'teams' }
    ];

    for (const node of nodesToLoad) {
      try {
        const { default: NodeClass } = await import(`./nodes/${node.file}`);
        this.registerNodeType(node.type, NodeClass.execute);
        console.log(`Registered node: ${node.name} (${node.type})`);
      } catch (error) {
        console.warn(`Could not load ${node.name} node:`, error.message);
      }
    }
  }

  /**
   * Register built-in node type executors
   */
  async registerBuiltInNodes() {
    // Import node classes
    await this.loadNodeModules();
    // Agent node - execute AI agent
    this.registerNodeType('agent', async (step, config, context) => {
      // Import here to avoid circular dependencies
      const { default: AgentService } = await import('../services/AgentService.js');
      
      // Build conversation history from prompt
      const conversationHistory = [{
        role: 'user',
        content: config.prompt || config.message || 'Please help me.'
      }];
      
      const systemPrompt = config.system_prompt 
        ? config.system_prompt
        : (context.context?.prompts?.agents?.sales?.systemPrompt || '');
      
      return await AgentService.processRequest({
        systemPrompt,
        conversationHistory,
        consumer: context.context?.company?.name || 'User',
        tools: config.tools || [],
        temperature: config.temperature || 0.7
      });
    });

    // Agent Tool node - execute registered agent tools
    this.registerNodeType('agent_tool', async (step, config, context) => {
      // Import here to avoid circular dependencies
      const { toolSelector } = await import('../agentTools/toolCalls.js');
      
      return await toolSelector(step.tool, config);
    });

    // Transform node - JavaScript data transformation
    this.registerNodeType('transform', async (step, config, context) => {
      const expression = config.expression;
      if (!expression) {
        throw new Error('Transform node requires an expression');
      }
      
      // Create a safe execution context
      const safeContext = {
        inputs: context.inputs,
        steps: context.steps,
        env: context.env,
        workflow: context.workflow
      };
      
      // Simple expression evaluation (in production, use a safer sandbox)
      const func = new Function('context', `
        with(context) {
          ${expression}
        }
      `);
      
      return func(safeContext);
    });

    // Output node - format output
    this.registerNodeType('output', async (step, config, context) => {
      return config;
    });

    // Conditional node - conditional execution
    this.registerNodeType('conditional', async (step, config, context) => {
      const condition = this.evaluateCondition(step.condition, context);
      
      if (condition && step.if_true) {
        const results = [];
        for (const subStep of step.if_true) {
          const result = await this.executeStep(subStep, context, null);
          results.push(result);
        }
        return { condition: true, results };
      } else if (!condition && step.if_false) {
        const results = [];
        for (const subStep of step.if_false) {
          const result = await this.executeStep(subStep, context, null);
          results.push(result);
        }
        return { condition: false, results };
      }
      
      return { condition, skipped: true };
    });
  }

  /**
   * Register a custom node type
   * @param {string} type - Node type name
   * @param {Function} executor - Async function to execute the node
   */
  registerNodeType(type, executor) {
    this.nodeExecutors.set(type, executor);
  }

  /**
   * Validate workflow definition
   * @param {Object} workflow - Workflow definition to validate
   */
  validateWorkflow(workflow) {
    if (!workflow.name) {
      throw new Error('Workflow must have a name');
    }
    
    if (!workflow.steps || !Array.isArray(workflow.steps)) {
      throw new Error('Workflow must have steps array');
    }
    
    // Validate each step has required fields
    for (const step of workflow.steps) {
      if (!step.id) {
        throw new Error('Each step must have an id');
      }
      if (!step.type) {
        throw new Error(`Step '${step.id}' must have a type`);
      }
    }
    
    // Check for duplicate step IDs
    const stepIds = workflow.steps.map(s => s.id);
    const duplicates = stepIds.filter((id, index) => stepIds.indexOf(id) !== index);
    if (duplicates.length > 0) {
      throw new Error(`Duplicate step IDs found: ${duplicates.join(', ')}`);
    }
  }

  /**
   * Validate inputs against schema
   * @param {Object} inputs - Provided inputs
   * @param {Object} inputSchema - Input schema from workflow
   */
  validateInputs(inputs, inputSchema) {
    for (const [key, schema] of Object.entries(inputSchema)) {
      if (schema.required && !(key in inputs)) {
        throw new Error(`Required input '${key}' is missing`);
      }
      
      if (key in inputs) {
        const value = inputs[key];
        const expectedType = schema.type;
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        
        if (actualType !== expectedType) {
          throw new Error(`Input '${key}' should be ${expectedType}, got ${actualType}`);
        }
      }
    }
  }

  /**
   * Resolve variables in configuration using context
   * @param {*} config - Configuration with potential variables
   * @param {Object} context - Execution context
   * @returns {*} Resolved configuration
   */
  resolveVariables(config, context) {
    if (typeof config === 'string') {
      // Replace {{variable}} patterns
      return config.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
        const value = this.getNestedValue(context, path.trim());
        return value !== undefined ? value : match;
      });
    }
    
    if (Array.isArray(config)) {
      return config.map(item => this.resolveVariables(item, context));
    }
    
    if (config && typeof config === 'object') {
      const resolved = {};
      for (const [key, value] of Object.entries(config)) {
        resolved[key] = this.resolveVariables(value, context);
      }
      return resolved;
    }
    
    return config;
  }

  /**
   * Get nested value from object using dot notation
   * @param {Object} obj - Object to search
   * @param {string} path - Dot notation path
   * @returns {*} Value at path
   */
  getNestedValue(obj, path) {
    // Handle special functions
    if (path === 'now') return new Date().toISOString();
    if (path === 'uuid') return uuid();
    
    return path.split('.').reduce((current, key) => {
      return current?.[key];
    }, obj);
  }

  /**
   * Process workflow outputs using context
   * @param {Object} outputsDef - Outputs definition
   * @param {Object} context - Execution context
   * @returns {Object} Processed outputs
   */
  processOutputs(outputsDef, context) {
    const outputs = {};
    
    for (const [key, expression] of Object.entries(outputsDef)) {
      outputs[key] = this.resolveVariables(expression, context);
    }
    
    return outputs;
  }

  /**
   * Evaluate a condition expression
   * @param {string} condition - Condition to evaluate
   * @param {Object} context - Execution context
   * @returns {boolean} Condition result
   */
  evaluateCondition(condition, context) {
    // Resolve variables first
    const resolvedCondition = this.resolveVariables(condition, context);
    
    // Simple expression evaluation (in production, use a safer method)
    try {
      // Create safe evaluation context
      const safeContext = {
        ...context.inputs,
        steps: context.steps
      };
      
      const func = new Function(...Object.keys(safeContext), `return ${resolvedCondition}`);
      return func(...Object.values(safeContext));
    } catch (error) {
      console.error('Error evaluating condition:', resolvedCondition, error);
      return false;
    }
  }

  /**
   * Get workflow execution by ID
   * @param {string} executionId - Execution ID
   * @returns {Object} Execution details
   */
  getExecution(executionId) {
    return this.executions.get(executionId);
  }

  /**
   * Load all workflows from the workflows directory
   * @returns {Promise<number>} Number of workflows loaded
   */
  async loadAllWorkflows() {
    try {
      const files = await fs.readdir(this.workflowsDir);
      let loadedCount = 0;
      
      for (const file of files) {
        if (file.endsWith('.yaml') || file.endsWith('.yml') || file.endsWith('.json')) {
          try {
            await this.loadWorkflow(file);
            loadedCount++;
          } catch (error) {
            console.warn(`Failed to load workflow ${file}:`, error.message);
          }
        }
      }
      
      console.log(`Loaded ${loadedCount} workflows from ${this.workflowsDir}`);
      return loadedCount;
    } catch (error) {
      console.error('Error loading workflows directory:', error);
      throw error;
    }
  }

  /**
   * List all loaded workflows
   * @returns {Array} List of workflow names
   */
  listWorkflows() {
    return Array.from(this.workflows.keys());
  }

  /**
   * Get workflow definition
   * @param {string} workflowName - Workflow name
   * @returns {Object} Workflow definition
   */
  getWorkflow(workflowName) {
    return this.workflows.get(workflowName);
  }
}

export default WorkflowEngine;