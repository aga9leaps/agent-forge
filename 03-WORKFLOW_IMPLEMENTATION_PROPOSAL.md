# Workflow Implementation Proposal - Text-Based Approach

**Date**: 2025-08-26  
**Approach**: Extend existing agent platform with workflow capabilities using text-based configuration

---

## Overview

Since you don't need a visual UI, we can move much faster by building a powerful text-based workflow system that leverages your existing agent architecture. Workflows will be defined in YAML/JSON files, similar to how GitHub Actions or Kubernetes work.

---

## Proposed Architecture

### 1. Workflow Definition Format (YAML)

```yaml
# workflows/customer-onboarding.yaml
name: Customer Onboarding Workflow
version: 1.0
description: Automated customer onboarding with document processing

# Trigger configuration
trigger:
  type: webhook
  config:
    path: /webhooks/new-customer
    method: POST
    
# Input schema validation
inputs:
  customer_name:
    type: string
    required: true
  email:
    type: string
    required: true
  documents:
    type: array
    required: false

# Workflow steps
steps:
  - id: validate_customer
    name: Validate Customer Data
    type: agent_tool
    tool: vectorSearch
    config:
      query: "customer {{inputs.customer_name}} verification"
    on_error: stop
    
  - id: create_account
    name: Create Customer Account
    type: database
    operation: insert
    config:
      collection: customers
      data:
        name: "{{inputs.customer_name}}"
        email: "{{inputs.email}}"
        created_at: "{{now}}"
        
  - id: process_documents
    name: Process Documents
    type: conditional
    condition: "{{inputs.documents}} != null"
    if_true:
      - id: classify_docs
        type: agent_tool
        tool: imageClassification
        config:
          images: "{{inputs.documents}}"
          
  - id: send_welcome
    name: Send Welcome Message
    type: communication
    channel: whatsapp
    config:
      to: "{{inputs.phone}}"
      template: welcome_message
      params:
        name: "{{inputs.customer_name}}"
        
  - id: generate_report
    name: Generate Onboarding Report
    type: agent_tool
    tool: generateReport
    config:
      type: customer_onboarding
      data:
        customer: "{{steps.create_account.output}}"
        documents: "{{steps.classify_docs.output}}"
        
# Output configuration
outputs:
  customer_id: "{{steps.create_account.output.id}}"
  report_url: "{{steps.generate_report.output.url}}"
  status: "{{workflow.status}}"
```

### 2. Implementation Plan - Practical Steps

#### Phase 1: Core Workflow Engine (1-2 weeks)

**Step 1: Create Workflow Models & Parser**

```javascript
// backend/src/workflow/WorkflowEngine.js
import yaml from 'js-yaml';
import { toolSelector } from '../agentTools/toolCalls.js';

class WorkflowEngine {
  constructor() {
    this.workflows = new Map();
    this.executions = new Map();
  }
  
  async loadWorkflow(filePath) {
    const workflowDef = yaml.load(await fs.readFile(filePath));
    this.validateWorkflow(workflowDef);
    this.workflows.set(workflowDef.name, workflowDef);
    return workflowDef;
  }
  
  async executeWorkflow(workflowName, inputs, context) {
    const workflow = this.workflows.get(workflowName);
    const execution = {
      id: uuid(),
      workflow: workflowName,
      startTime: new Date(),
      context: { ...context, inputs, steps: {} }
    };
    
    try {
      for (const step of workflow.steps) {
        const result = await this.executeStep(step, execution.context);
        execution.context.steps[step.id] = { output: result };
      }
      
      return this.formatOutputs(workflow.outputs, execution.context);
    } catch (error) {
      execution.error = error;
      throw error;
    } finally {
      execution.endTime = new Date();
      this.executions.set(execution.id, execution);
    }
  }
  
  async executeStep(step, context) {
    switch (step.type) {
      case 'agent_tool':
        // Use existing tool system
        return await toolSelector(step.tool, 
          this.resolveParams(step.config, context));
          
      case 'database':
        // Use existing repositories
        return await this.executeDatabaseOp(step, context);
        
      case 'communication':
        // Use existing WhatsApp/Email services
        return await this.executeCommunication(step, context);
        
      case 'conditional':
        // Simple conditional logic
        return await this.executeConditional(step, context);
        
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }
}
```

**Step 2: Create Workflow Repository**

```javascript
// backend/src/repository/workflowRepository.js
class WorkflowRepository extends BaseMongoRepository {
  constructor(db) {
    super(db, 'workflows');
  }
  
  async saveWorkflow(workflow) {
    return this.create({
      ...workflow,
      createdAt: new Date(),
      version: workflow.version || '1.0'
    });
  }
  
  async getWorkflowByName(name) {
    return this.findOne({ name });
  }
  
  async listWorkflows(filter = {}) {
    return this.find(filter);
  }
}

// backend/src/repository/workflowExecutionRepository.js
class WorkflowExecutionRepository extends BaseMongoRepository {
  constructor(db) {
    super(db, 'workflow_executions');
  }
  
  async saveExecution(execution) {
    return this.create(execution);
  }
  
  async getExecutionHistory(workflowName, limit = 10) {
    return this.find({ workflow: workflowName })
      .sort({ startTime: -1 })
      .limit(limit);
  }
}
```

**Step 3: Create Workflow API**

```javascript
// backend/src/routes/workflowRouter.js
import express from 'express';
import WorkflowEngine from '../workflow/WorkflowEngine.js';

const router = express.Router();
const engine = new WorkflowEngine();

// Load workflow from file
router.post('/workflows/load', async (req, res) => {
  const { filePath } = req.body;
  const workflow = await engine.loadWorkflow(filePath);
  res.json({ message: 'Workflow loaded', workflow });
});

// Execute workflow
router.post('/workflows/:name/execute', async (req, res) => {
  const { name } = req.params;
  const { inputs } = req.body;
  
  const result = await engine.executeWorkflow(name, inputs, req.context);
  res.json({ result });
});

// Get execution history
router.get('/workflows/:name/executions', async (req, res) => {
  const executions = await executionRepo.getExecutionHistory(req.params.name);
  res.json({ executions });
});
```

#### Phase 2: Workflow Triggers (Week 3)

**Step 1: Create Trigger System**

```javascript
// backend/src/workflow/triggers/WebhookTrigger.js
class WebhookTrigger {
  constructor(workflowEngine) {
    this.engine = workflowEngine;
    this.webhooks = new Map();
  }
  
  register(workflow) {
    if (workflow.trigger?.type === 'webhook') {
      const path = workflow.trigger.config.path;
      this.webhooks.set(path, workflow.name);
    }
  }
  
  // Express middleware
  middleware() {
    return async (req, res, next) => {
      const workflowName = this.webhooks.get(req.path);
      if (workflowName) {
        const result = await this.engine.executeWorkflow(
          workflowName, 
          req.body,
          req.context
        );
        res.json({ workflow: workflowName, result });
      } else {
        next();
      }
    };
  }
}

// backend/src/workflow/triggers/ScheduleTrigger.js
class ScheduleTrigger {
  constructor(workflowEngine) {
    this.engine = workflowEngine;
    this.jobs = new Map();
  }
  
  register(workflow) {
    if (workflow.trigger?.type === 'schedule') {
      const job = cron.schedule(workflow.trigger.config.cron, async () => {
        await this.engine.executeWorkflow(workflow.name, {}, {});
      });
      this.jobs.set(workflow.name, job);
    }
  }
}
```

#### Phase 3: Extend with More Node Types (Week 4-5)

**Step 1: Create Node Library**

```javascript
// backend/src/workflow/nodes/
├── DataTransformNode.js    // JSON transformations
├── HttpRequestNode.js      // External API calls  
├── LoopNode.js            // Iterate over arrays
├── ParallelNode.js        // Execute steps in parallel
├── WaitNode.js            // Delays and timeouts
└── ErrorHandlerNode.js    // Try-catch logic
```

**Step 2: Add to Workflow Engine**

```javascript
// Register new node types
engine.registerNodeType('transform', DataTransformNode);
engine.registerNodeType('http', HttpRequestNode);
engine.registerNodeType('loop', LoopNode);
```

---

## Example Workflows

### 1. Financial Report Generation

```yaml
name: Monthly Financial Report
trigger:
  type: schedule
  config:
    cron: "0 9 1 * *"  # First day of month at 9 AM

steps:
  - id: generate_reports
    type: parallel
    steps:
      - id: profit_loss
        type: agent_tool
        tool: profitLossReport
        config:
          fromDate: "{{lastMonth.start}}"
          toDate: "{{lastMonth.end}}"
          
      - id: cash_flow
        type: agent_tool
        tool: cashFlowReport
        config:
          fromDate: "{{lastMonth.start}}"
          toDate: "{{lastMonth.end}}"
          
  - id: analyze_reports
    type: agent
    prompt: "Analyze these financial reports and provide insights"
    config:
      reports:
        profit_loss: "{{steps.profit_loss.output}}"
        cash_flow: "{{steps.cash_flow.output}}"
        
  - id: send_report
    type: communication
    channel: email
    config:
      to: "{{context.company.contact.email}}"
      subject: "Monthly Financial Report - {{lastMonth.name}}"
      body: "{{steps.analyze_reports.output}}"
      attachments: 
        - "{{steps.profit_loss.output.url}}"
        - "{{steps.cash_flow.output.url}}"
```

### 2. Customer Query Processing

```yaml
name: Smart Customer Query
trigger:
  type: webhook
  config:
    path: /customer-query

steps:
  - id: classify_query
    type: agent
    prompt: "Classify this query: sales, support, or finance"
    config:
      query: "{{inputs.message}}"
      
  - id: route_query
    type: switch
    on: "{{steps.classify_query.output.category}}"
    cases:
      sales:
        - id: sales_response
          type: agent
          context: "{{contexts.magic-paints}}"
          agent: sales
          config:
            message: "{{inputs.message}}"
            
      finance:
        - id: check_reports
          type: agent_tool
          tool: vectorSearch
          config:
            query: "{{inputs.message}}"
            
      support:
        - id: support_response
          type: agent
          agent: support
          config:
            message: "{{inputs.message}}"
```

---

## Benefits of This Approach

### 1. **Rapid Development**
- No UI development needed (saves 4-6 weeks)
- Use existing tools and services
- Text files are easy to version control

### 2. **Developer Friendly**
- Workflows as code (like Infrastructure as Code)
- Easy to test and debug
- Can use any text editor
- Git-friendly for collaboration

### 3. **Powerful Capabilities**
- Full access to your agent tools
- Conditional logic and loops
- Parallel execution
- Error handling

### 4. **Extensible**
- Easy to add new node types
- Can integrate any service
- Plugin architecture for custom nodes

---

## Migration Path

### Week 1-2: Basic Engine
- Workflow parser and executor
- Integration with existing tools
- Basic API endpoints

### Week 3: Triggers & Scheduling  
- Webhook triggers
- Cron scheduling
- Event-based triggers

### Week 4-5: Advanced Features
- Conditional logic
- Loops and iterations
- Error handling
- Parallel execution

### Week 6: Production Features
- Monitoring and logging
- Execution history
- Performance optimization
- Documentation

---

## Getting Started

1. **Create workflow directory**
   ```bash
   mkdir -p backend/workflows
   ```

2. **Write your first workflow**
   ```yaml
   # backend/workflows/hello-world.yaml
   name: Hello World
   steps:
     - id: greet
       type: agent
       prompt: "Say hello to {{inputs.name}}"
   ```

3. **Load and execute**
   ```bash
   POST /api/workflows/load
   { "filePath": "./workflows/hello-world.yaml" }
   
   POST /api/workflows/hello-world/execute
   { "inputs": { "name": "World" } }
   ```

---

## Conclusion

This text-based approach gives you:
- **80% of n8n functionality** without the UI complexity
- **2-6 weeks implementation** vs 12-16 weeks with UI
- **Full integration** with your existing agent platform
- **Production ready** faster with less complexity

The key insight is that your existing agent architecture already provides most of what a workflow engine needs. We just need to add orchestration on top.

**Ready to start with Phase 1?**