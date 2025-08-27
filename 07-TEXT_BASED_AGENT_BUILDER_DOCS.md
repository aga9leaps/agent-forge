# Text-Based Agent Builder Documentation

**Version**: 1.0  
**Last Updated**: 2025-08-26

---

## Table of Contents

1. [Introduction](#introduction)
2. [Quick Start](#quick-start)
3. [Workflow Definition Language](#workflow-definition-language)
4. [Node Types Reference](#node-types-reference)
5. [Triggers](#triggers)
6. [Variables and Context](#variables-and-context)
7. [Conditional Logic](#conditional-logic)
8. [Error Handling](#error-handling)
9. [Best Practices](#best-practices)
10. [Examples](#examples)
11. [API Reference](#api-reference)
12. [Troubleshooting](#troubleshooting)

---

## Introduction

The Text-Based Agent Builder allows you to create powerful automation workflows using simple YAML or JSON files. Similar to GitHub Actions or Kubernetes manifests, you define workflows as code, making them easy to version control, share, and modify.

### Key Concepts

- **Workflow**: A sequence of steps that execute in order to accomplish a task
- **Step**: An individual action within a workflow (e.g., call an agent tool, send a message)
- **Trigger**: What causes a workflow to start (e.g., webhook, schedule, event)
- **Context**: Data available throughout workflow execution (inputs, step outputs, environment)

### Why Text-Based?

- **Version Control**: Track changes in Git
- **No GUI Required**: Edit in any text editor
- **Automation Friendly**: Generate workflows programmatically
- **Fast Development**: No UI complexity
- **Portable**: Share workflows as simple files

---

## Quick Start

### 1. Create Your First Workflow

Create a file `workflows/hello-world.yaml`:

```yaml
name: Hello World Workflow
description: A simple workflow that greets a user
version: 1.0

steps:
  - id: greet
    name: Generate Greeting
    type: agent
    config:
      prompt: "Generate a friendly greeting for {{inputs.name}}"
      
  - id: send_greeting
    name: Send Greeting
    type: output
    config:
      message: "{{steps.greet.output}}"
```

### 2. Load the Workflow

```bash
POST /api/workflows/load
{
  "filePath": "./workflows/hello-world.yaml"
}
```

### 3. Execute the Workflow

```bash
POST /api/workflows/execute/hello-world
{
  "inputs": {
    "name": "Alice"
  }
}
```

### 4. Check the Result

```json
{
  "executionId": "exec_123",
  "status": "completed",
  "outputs": {
    "message": "Hello Alice! Welcome to our platform. How can I assist you today?"
  }
}
```

---

## Workflow Definition Language

### Basic Structure

```yaml
# Required fields
name: Workflow Name          # Unique identifier
version: 1.0                 # Semantic versioning

# Optional metadata
description: What this workflow does
author: your-name
tags: [automation, customer-service]

# Trigger configuration (optional)
trigger:
  type: webhook|schedule|event
  config:
    # Trigger-specific configuration

# Input validation (optional)
inputs:
  parameterName:
    type: string|number|boolean|array|object
    required: true|false
    default: default value
    description: What this parameter is for

# Workflow steps (required)
steps:
  - id: unique_step_id
    name: Human Readable Name
    type: node_type
    config:
      # Node-specific configuration
    on_error: continue|stop|retry
    retry:
      attempts: 3
      delay: 1000

# Output mapping (optional)
outputs:
  outputName: "{{steps.step_id.output.field}}"
```

### Data Types

| Type | Description | Example |
|------|-------------|---------|
| string | Text data | `"Hello World"` |
| number | Numeric values | `42`, `3.14` |
| boolean | True/False | `true`, `false` |
| array | List of values | `[1, 2, 3]` |
| object | Key-value pairs | `{name: "John", age: 30}` |

---

## Node Types Reference

### 1. Agent Node

Executes an AI agent with a specific prompt.

```yaml
- id: analyze_sentiment
  type: agent
  config:
    prompt: "Analyze the sentiment of this text: {{inputs.text}}"
    model: gpt-4  # optional, defaults to configured model
    temperature: 0.7
    context: "{{contexts.customer-support}}"  # optional context
```

### 2. Agent Tool Node

Executes any registered agent tool.

```yaml
- id: search_products
  type: agent_tool
  tool: vectorSearch
  config:
    query: "{{inputs.product_query}}"
    limit: 10
```

Available tools:
- `vectorSearch` - Search vector database
- `sqlSearch` - Execute SQL queries
- `profitLossReport` - Generate P&L report
- `cashFlowReport` - Generate cash flow report
- `ratioAnalysisReport` - Financial ratio analysis
- `expenseAnalysisReport` - Expense analysis
- `extractMetric` - Extract specific metrics

### 3. Database Node

Performs database operations.

```yaml
- id: save_customer
  type: database
  operation: insert|update|find|delete
  config:
    collection: customers
    data:
      name: "{{inputs.customer_name}}"
      email: "{{inputs.email}}"
      created_at: "{{now}}"
```

### 4. Communication Node

Sends messages via various channels.

```yaml
- id: send_notification
  type: communication
  channel: whatsapp|email|sms
  config:
    to: "{{inputs.phone}}"
    template: welcome_message
    params:
      name: "{{inputs.name}}"
      order_id: "{{steps.create_order.output.id}}"
```

### 5. HTTP Request Node

Makes external API calls.

```yaml
- id: call_external_api
  type: http
  config:
    method: GET|POST|PUT|DELETE
    url: "https://api.example.com/data"
    headers:
      Authorization: "Bearer {{env.API_TOKEN}}"
    body:
      key: "value"
    timeout: 5000
```

### 6. Transform Node

Transforms data using JavaScript expressions.

```yaml
- id: calculate_total
  type: transform
  config:
    expression: |
      const items = {{steps.get_items.output}};
      return items.reduce((sum, item) => sum + item.price, 0);
```

### 7. Conditional Node

Executes steps based on conditions.

```yaml
- id: check_customer_type
  type: conditional
  condition: "{{inputs.order_total}} > 1000"
  if_true:
    - id: apply_discount
      type: transform
      config:
        expression: "{{inputs.order_total}} * 0.9"
  if_false:
    - id: standard_price
      type: transform
      config:
        expression: "{{inputs.order_total}}"
```

### 8. Loop Node

Iterates over arrays.

```yaml
- id: process_items
  type: loop
  over: "{{inputs.items}}"
  as: item
  steps:
    - id: process_single_item
      type: agent_tool
      tool: processItem
      config:
        item: "{{item}}"
```

### 9. Parallel Node

Executes multiple steps simultaneously.

```yaml
- id: gather_data
  type: parallel
  steps:
    - id: get_customer_data
      type: database
      operation: find
      config:
        collection: customers
        
    - id: get_order_history
      type: database
      operation: find
      config:
        collection: orders
```

### 10. Wait Node

Adds delays to workflow execution.

```yaml
- id: wait_for_processing
  type: wait
  config:
    duration: 5000  # milliseconds
```

---

## Triggers

### Webhook Trigger

Starts workflow when HTTP endpoint is called.

```yaml
trigger:
  type: webhook
  config:
    path: /webhooks/new-order
    method: POST
    auth:
      type: bearer|basic|custom
      token: "{{env.WEBHOOK_SECRET}}"
```

### Schedule Trigger

Runs workflow on a schedule using cron syntax.

```yaml
trigger:
  type: schedule
  config:
    cron: "0 9 * * 1"  # Every Monday at 9 AM
    timezone: "Asia/Kolkata"
```

### Event Trigger

Starts when specific events occur.

```yaml
trigger:
  type: event
  config:
    event: database.insert
    filter:
      collection: orders
      condition: "{{data.total}} > 10000"
```

---

## Variables and Context

### Variable Sources

1. **Inputs**: `{{inputs.variableName}}`
2. **Step Outputs**: `{{steps.stepId.output}}`
3. **Context**: `{{context.company.name}}`
4. **Environment**: `{{env.API_KEY}}`
5. **Built-in Functions**: `{{now}}`, `{{uuid}}`

### Variable Interpolation

```yaml
# Simple interpolation
message: "Hello {{inputs.name}}"

# Nested access
customer: "{{steps.get_customer.output.data.name}}"

# Array access
first_item: "{{inputs.items[0]}}"

# Default values
greeting: "{{inputs.greeting || 'Hello'}}"
```

### Built-in Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{{now}}` | Current timestamp | `2024-01-15T10:30:00Z` |
| `{{today}}` | Today's date | `2024-01-15` |
| `{{uuid}}` | Random UUID | `123e4567-e89b-12d3` |
| `{{workflow.name}}` | Current workflow name | `customer-onboarding` |
| `{{workflow.execution_id}}` | Execution ID | `exec_abc123` |

---

## Conditional Logic

### Simple Conditions

```yaml
- id: check_status
  type: conditional
  condition: "{{inputs.status}} == 'active'"
  if_true:
    - id: process_active
      type: agent
      config:
        prompt: "Process active customer"
```

### Complex Conditions

```yaml
condition: |
  {{inputs.age}} >= 18 && 
  {{inputs.country}} == 'US' &&
  ({{inputs.status}} == 'active' || {{inputs.status}} == 'pending')
```

### Switch Statement

```yaml
- id: route_by_type
  type: switch
  on: "{{inputs.request_type}}"
  cases:
    sales:
      - id: handle_sales
        type: agent
        config:
          context: "{{contexts.sales}}"
    support:
      - id: handle_support
        type: agent
        config:
          context: "{{contexts.support}}"
    default:
      - id: handle_general
        type: agent
        config:
          prompt: "Handle general inquiry"
```

---

## Error Handling

### Step-Level Error Handling

```yaml
- id: risky_operation
  type: http
  config:
    url: "https://api.example.com"
  on_error: continue|stop|retry
  retry:
    attempts: 3
    delay: 1000
    backoff: exponential|linear
```

### Workflow-Level Error Handling

```yaml
error_handler:
  - id: log_error
    type: database
    operation: insert
    config:
      collection: error_logs
      data:
        workflow: "{{workflow.name}}"
        error: "{{error.message}}"
        timestamp: "{{now}}"
        
  - id: notify_admin
    type: communication
    channel: email
    config:
      to: admin@example.com
      subject: "Workflow Error: {{workflow.name}}"
      body: "Error: {{error.message}}\nStack: {{error.stack}}"
```

### Try-Catch Pattern

```yaml
- id: try_catch_block
  type: try_catch
  try:
    - id: main_operation
      type: http
      config:
        url: "{{inputs.api_url}}"
  catch:
    - id: fallback_operation
      type: agent
      config:
        prompt: "Generate fallback response"
  finally:
    - id: cleanup
      type: database
      operation: update
      config:
        collection: logs
```

---

## Best Practices

### 1. Workflow Organization

```
workflows/
├── customer/
│   ├── onboarding.yaml
│   ├── support.yaml
│   └── retention.yaml
├── finance/
│   ├── daily-reports.yaml
│   ├── monthly-summary.yaml
│   └── audit-trail.yaml
└── shared/
    ├── templates/
    └── utilities/
```

### 2. Naming Conventions

- **Workflow names**: `kebab-case` (e.g., `customer-onboarding`)
- **Step IDs**: `snake_case` (e.g., `send_welcome_email`)
- **Variables**: `camelCase` (e.g., `customerName`)

### 3. Reusable Components

Create template workflows:

```yaml
# templates/send-notification.yaml
name: send-notification-template
inputs:
  channel:
    type: string
    required: true
  recipient:
    type: string
    required: true
  message:
    type: string
    required: true
    
steps:
  - id: send
    type: communication
    channel: "{{inputs.channel}}"
    config:
      to: "{{inputs.recipient}}"
      message: "{{inputs.message}}"
```

Use in other workflows:

```yaml
- id: notify_customer
  type: workflow
  workflow: send-notification-template
  config:
    channel: whatsapp
    recipient: "{{inputs.phone}}"
    message: "Your order is ready!"
```

### 4. Testing Workflows

```yaml
# test-workflows/test-customer-onboarding.yaml
name: test-customer-onboarding
steps:
  - id: run_workflow
    type: workflow
    workflow: customer-onboarding
    config:
      inputs:
        customer_name: "Test Customer"
        email: "test@example.com"
        
  - id: verify_results
    type: conditional
    condition: "{{steps.run_workflow.output.status}} == 'success'"
    if_false:
      - id: fail_test
        type: error
        message: "Workflow test failed"
```

### 5. Documentation

Always include documentation in your workflows:

```yaml
name: complex-workflow
description: |
  This workflow handles complex customer onboarding including:
  - Identity verification
  - Account creation
  - Welcome communications
  - Initial setup
  
  Required inputs:
  - customer_name: Full name of the customer
  - email: Valid email address
  - phone: Phone number with country code
  
author: team@example.com
last_modified: 2024-01-15
version: 2.1.0
```

---

## Examples

### Example 1: Customer Support Ticket

```yaml
name: customer-support-ticket
description: Intelligent customer support ticket processing
version: 1.0

trigger:
  type: webhook
  config:
    path: /support/new-ticket

inputs:
  customer_email:
    type: string
    required: true
  subject:
    type: string
    required: true
  message:
    type: string
    required: true

steps:
  # Find customer in database
  - id: find_customer
    type: database
    operation: find
    config:
      collection: customers
      query:
        email: "{{inputs.customer_email}}"
        
  # Analyze ticket sentiment and urgency
  - id: analyze_ticket
    type: agent
    config:
      prompt: |
        Analyze this support ticket and return JSON with:
        - sentiment: positive/neutral/negative
        - urgency: low/medium/high/critical
        - category: billing/technical/general/complaint
        
        Subject: {{inputs.subject}}
        Message: {{inputs.message}}
      response_format: json
      
  # Route based on urgency
  - id: route_ticket
    type: switch
    on: "{{steps.analyze_ticket.output.urgency}}"
    cases:
      critical:
        - id: escalate_immediately
          type: parallel
          steps:
            - id: create_urgent_ticket
              type: database
              operation: insert
              config:
                collection: urgent_tickets
                data:
                  customer: "{{steps.find_customer.output}}"
                  analysis: "{{steps.analyze_ticket.output}}"
                  
            - id: notify_manager
              type: communication
              channel: whatsapp
              config:
                to: "{{env.MANAGER_PHONE}}"
                message: "URGENT: {{inputs.subject}}"
                
      high:
        - id: assign_senior_agent
          type: database
          operation: insert
          config:
            collection: tickets
            data:
              priority: high
              assigned_to: senior_agent_pool
              
      default:
        - id: create_normal_ticket
          type: database
          operation: insert
          config:
            collection: tickets
            data:
              priority: "{{steps.analyze_ticket.output.urgency}}"
              
  # Generate and send response
  - id: generate_response
    type: agent
    config:
      context: "{{contexts.customer-support}}"
      prompt: |
        Generate a response to this customer ticket:
        Customer: {{steps.find_customer.output.name}}
        History: {{steps.find_customer.output.purchase_history}}
        Sentiment: {{steps.analyze_ticket.output.sentiment}}
        
        Original message: {{inputs.message}}
        
        Be empathetic and helpful.
        
  - id: send_response
    type: communication
    channel: email
    config:
      to: "{{inputs.customer_email}}"
      subject: "Re: {{inputs.subject}}"
      body: "{{steps.generate_response.output}}"
      
outputs:
  ticket_id: "{{steps.create_normal_ticket.output.id || steps.create_urgent_ticket.output.id}}"
  urgency: "{{steps.analyze_ticket.output.urgency}}"
  response_sent: true
```

### Example 2: Daily Financial Report

```yaml
name: daily-financial-summary
description: Generate and distribute daily financial reports
version: 2.0

trigger:
  type: schedule
  config:
    cron: "0 9 * * 1-5"  # 9 AM Monday-Friday
    timezone: "Asia/Kolkata"

steps:
  # Calculate date range
  - id: calculate_dates
    type: transform
    config:
      expression: |
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        return {
          from: yesterday.toISOString().split('T')[0].replace(/-/g, ''),
          to: today.toISOString().split('T')[0].replace(/-/g, ''),
          display_date: yesterday.toLocaleDateString()
        };
        
  # Generate reports in parallel
  - id: generate_reports
    type: parallel
    steps:
      - id: sales_summary
        type: database
        operation: aggregate
        config:
          collection: orders
          pipeline:
            - match:
                created_at: 
                  $gte: "{{steps.calculate_dates.output.from}}"
                  $lt: "{{steps.calculate_dates.output.to}}"
            - group:
                _id: null
                total_sales: { $sum: "$total" }
                order_count: { $sum: 1 }
                avg_order: { $avg: "$total" }
                
      - id: expense_report
        type: agent_tool
        tool: expenseAnalysisReport
        config:
          fromDate: "{{steps.calculate_dates.output.from}}"
          toDate: "{{steps.calculate_dates.output.to}}"
          
      - id: cash_position
        type: database
        operation: find
        config:
          collection: accounts
          query:
            type: cash
          projection:
            balance: 1
            
  # Generate AI summary
  - id: generate_summary
    type: agent
    config:
      prompt: |
        Generate an executive summary for {{steps.calculate_dates.output.display_date}}:
        
        Sales:
        - Total: {{steps.sales_summary.output.total_sales}}
        - Orders: {{steps.sales_summary.output.order_count}}
        - Average: {{steps.sales_summary.output.avg_order}}
        
        Cash Position: {{steps.cash_position.output}}
        
        Provide insights and recommendations.
        
  # Distribute report
  - id: send_reports
    type: parallel
    steps:
      - id: email_executives
        type: communication
        channel: email
        config:
          to: 
            - ceo@company.com
            - cfo@company.com
          subject: "Daily Financial Summary - {{steps.calculate_dates.output.display_date}}"
          body: "{{steps.generate_summary.output}}"
          attachments:
            - "{{steps.expense_report.output.url}}"
            
      - id: post_to_slack
        type: http
        config:
          method: POST
          url: "{{env.SLACK_WEBHOOK_URL}}"
          body:
            text: "Daily Summary: {{steps.generate_summary.output}}"
            
      - id: save_to_history
        type: database
        operation: insert
        config:
          collection: report_history
          data:
            date: "{{steps.calculate_dates.output.display_date}}"
            summary: "{{steps.generate_summary.output}}"
            metrics: "{{steps.sales_summary.output}}"
```

### Example 3: Smart Product Recommendation

```yaml
name: smart-product-recommendation
description: AI-powered product recommendations based on customer behavior
version: 1.0

inputs:
  customer_id:
    type: string
    required: true
  context:
    type: string
    default: browsing
    description: browsing|cart|checkout

steps:
  # Get customer data
  - id: get_customer_profile
    type: parallel
    steps:
      - id: customer_info
        type: database
        operation: find
        config:
          collection: customers
          query:
            id: "{{inputs.customer_id}}"
            
      - id: purchase_history
        type: database
        operation: find
        config:
          collection: orders
          query:
            customer_id: "{{inputs.customer_id}}"
          sort:
            created_at: -1
          limit: 10
          
      - id: browsing_history
        type: database
        operation: find
        config:
          collection: page_views
          query:
            customer_id: "{{inputs.customer_id}}"
          sort:
            timestamp: -1
          limit: 20
          
  # Analyze customer preferences
  - id: analyze_preferences
    type: agent
    config:
      prompt: |
        Analyze this customer's preferences:
        
        Profile: {{steps.customer_info.output}}
        Recent Purchases: {{steps.purchase_history.output}}
        Browsing History: {{steps.browsing_history.output}}
        
        Return JSON with:
        - preferred_categories: array of categories
        - price_range: {min, max}
        - style_preferences: array of styles
        - brand_affinity: array of preferred brands
      response_format: json
      
  # Get recommendations
  - id: search_products
    type: agent_tool
    tool: vectorSearch
    config:
      query: |
        Products matching:
        Categories: {{steps.analyze_preferences.output.preferred_categories}}
        Price range: {{steps.analyze_preferences.output.price_range}}
        Style: {{steps.analyze_preferences.output.style_preferences}}
      limit: 20
      
  # Personalize recommendations
  - id: personalize_results
    type: agent
    config:
      prompt: |
        Select and rank the top 5 products for this customer:
        
        Customer preferences: {{steps.analyze_preferences.output}}
        Available products: {{steps.search_products.output}}
        Context: Customer is {{inputs.context}}
        
        Consider:
        - Match with preferences
        - Price appropriateness
        - Complementary products
        - Seasonal relevance
        
        Return JSON array of product IDs with reasoning.
      response_format: json
      
  # Format response
  - id: format_recommendations
    type: transform
    config:
      expression: |
        const recommendations = {{steps.personalize_results.output}};
        const products = {{steps.search_products.output}};
        
        return recommendations.map(rec => {
          const product = products.find(p => p.id === rec.product_id);
          return {
            ...product,
            recommendation_reason: rec.reasoning,
            score: rec.score
          };
        });
        
outputs:
  recommendations: "{{steps.format_recommendations.output}}"
  customer_preferences: "{{steps.analyze_preferences.output}}"
```

---

## API Reference

### Load Workflow

```bash
POST /api/workflows/load
Content-Type: application/json

{
  "filePath": "./workflows/my-workflow.yaml"
}

# Response
{
  "success": true,
  "workflow": {
    "name": "my-workflow",
    "version": "1.0",
    "steps": [...]
  }
}
```

### Execute Workflow

```bash
POST /api/workflows/execute/:workflowName
Content-Type: application/json

{
  "inputs": {
    "param1": "value1",
    "param2": "value2"
  }
}

# Response
{
  "executionId": "exec_abc123",
  "status": "completed|failed|timeout",
  "outputs": {
    "output1": "value1"
  },
  "duration": 1234,
  "steps": [
    {
      "id": "step1",
      "status": "completed",
      "duration": 500,
      "output": {...}
    }
  ]
}
```

### Get Execution Status

```bash
GET /api/workflows/executions/:executionId

# Response
{
  "executionId": "exec_abc123",
  "workflow": "my-workflow",
  "status": "running|completed|failed",
  "progress": {
    "current_step": "step3",
    "total_steps": 5,
    "percentage": 60
  },
  "logs": [...]
}
```

### List Workflows

```bash
GET /api/workflows?tag=customer&status=active

# Response
{
  "workflows": [
    {
      "name": "customer-onboarding",
      "version": "1.0",
      "description": "...",
      "last_executed": "2024-01-15T10:00:00Z",
      "execution_count": 150
    }
  ],
  "total": 15
}
```

### Get Workflow History

```bash
GET /api/workflows/:workflowName/history?limit=10

# Response
{
  "executions": [
    {
      "executionId": "exec_123",
      "status": "completed",
      "started_at": "2024-01-15T10:00:00Z",
      "completed_at": "2024-01-15T10:01:23Z",
      "trigger": "webhook",
      "outputs": {...}
    }
  ]
}
```

---

## Troubleshooting

### Common Issues

#### 1. Workflow Won't Load

**Error**: `Invalid workflow definition`

**Solution**: Validate your YAML syntax:
```bash
# Online YAML validator
https://www.yamllint.com/

# Or use command line
yamllint workflows/my-workflow.yaml
```

#### 2. Variable Not Found

**Error**: `Cannot read property 'x' of undefined`

**Solution**: Use safe navigation and defaults:
```yaml
# Instead of
value: "{{steps.maybe_null.output.field}}"

# Use
value: "{{steps.maybe_null.output.field || 'default'}}"
```

#### 3. Step Timeout

**Error**: `Step 'slow_operation' timed out after 30000ms`

**Solution**: Increase timeout for specific steps:
```yaml
- id: slow_operation
  type: http
  timeout: 60000  # 60 seconds
  config:
    url: "https://slow-api.example.com"
```

#### 4. Parallel Steps Not Working

**Error**: `Parallel execution failed`

**Solution**: Ensure steps don't depend on each other:
```yaml
# Wrong - step2 depends on step1
- id: parallel_steps
  type: parallel
  steps:
    - id: step1
      type: database
      operation: insert
    - id: step2
      type: transform
      config:
        data: "{{steps.step1.output}}"  # This won't work!

# Correct - independent steps
- id: parallel_steps
  type: parallel
  steps:
    - id: step1
      type: database
      operation: find
    - id: step2
      type: http
      config:
        url: "https://api.example.com"
```

### Debug Mode

Enable debug mode for detailed execution logs:

```yaml
name: my-workflow
debug: true  # Enable debug logging

steps:
  - id: step1
    type: agent
    debug: true  # Enable for specific step
    config:
      prompt: "..."
```

### Monitoring Best Practices

1. **Add Logging Steps**:
```yaml
- id: log_progress
  type: database
  operation: insert
  config:
    collection: workflow_logs
    data:
      workflow: "{{workflow.name}}"
      step: "customer_processed"
      customer_id: "{{inputs.customer_id}}"
      timestamp: "{{now}}"
```

2. **Use Error Handlers**:
```yaml
error_handler:
  - id: log_error
    type: http
    config:
      url: "{{env.ERROR_TRACKING_URL}}"
      method: POST
      body:
        error: "{{error}}"
        workflow: "{{workflow}}"
```

3. **Add Metrics Collection**:
```yaml
- id: track_metric
  type: http
  config:
    url: "{{env.METRICS_API}}"
    method: POST
    body:
      metric: "workflow.execution"
      value: 1
      tags:
        workflow: "{{workflow.name}}"
        status: "{{workflow.status}}"
```

---

## Appendix

### Reserved Keywords

These keywords have special meaning in workflow definitions:

- `name`, `version`, `description`, `author`, `tags`
- `trigger`, `inputs`, `outputs`, `steps`
- `id`, `type`, `config`, `on_error`, `retry`
- `condition`, `if_true`, `if_false`
- `over`, `as`, `parallel`, `timeout`

### Supported Functions

| Function | Description | Example |
|----------|-------------|---------|
| `now()` | Current timestamp | `{{now()}}` |
| `uuid()` | Generate UUID | `{{uuid()}}` |
| `date()` | Format date | `{{date(now(), 'YYYY-MM-DD')}}` |
| `json()` | Parse JSON | `{{json(steps.api.output)}}` |
| `base64()` | Base64 encode | `{{base64(inputs.data)}}` |
| `hash()` | Generate hash | `{{hash(inputs.password, 'sha256')}}` |

### Workflow Limits

| Resource | Limit | Notes |
|----------|-------|-------|
| Max steps per workflow | 100 | Can be configured |
| Max parallel steps | 10 | Per parallel block |
| Max loop iterations | 1000 | Prevents infinite loops |
| Max execution time | 5 minutes | Can be extended |
| Max step retries | 5 | Configurable per step |
| Max workflow file size | 1MB | YAML/JSON file |

---

**End of Documentation**

For more examples and updates, visit: [GitHub Repository]

Last Updated: 2025-08-26 | Version 1.0