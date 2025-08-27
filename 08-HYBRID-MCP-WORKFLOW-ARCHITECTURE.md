# 08 - Hybrid MCP + Workflow Architecture Guide

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Multi-Customer Setup](#multi-customer-setup)
3. [Multiple Agent Types](#multiple-agent-types)
4. [Data Source Mapping](#data-source-mapping)
5. [MCP Server Integration](#mcp-server-integration)
6. [Hybrid Architecture Benefits](#hybrid-architecture-benefits)
7. [Implementation Guide](#implementation-guide)
8. [Usage Examples](#usage-examples)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

This system combines **Workflow Orchestration** with **Model Context Protocol (MCP)** servers to create a powerful hybrid platform that supports:

- 🏢 **Multi-tenant customers** with isolated data and configurations
- 🤖 **Multiple agent types** per customer (sales, support, marketing, hr, finance)
- 📊 **Data source mapping** with fine-grained permissions
- 🔧 **Real-time AI tools** via MCP servers
- 🔄 **Automated workflows** for business processes
- 🧠 **Intelligent automation** combining AI decision-making with process execution

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    CUSTOMER LAYER                           │
├─────────────────┬─────────────────┬─────────────────────────┤
│   Customer 1    │   Customer 2    │   Customer N           │
│   (TechStart)   │   (Fashion)     │   (ACME Corp)          │
│                 │                 │                        │
│ ┌─────────────┐ │ ┌─────────────┐ │ ┌─────────────────────┐ │
│ │Sales Agent  │ │ │Sales Agent  │ │ │Sales Agent          │ │
│ │Support Agent│ │ │Marketing    │ │ │Support Agent        │ │
│ │Marketing    │ │ │Agent        │ │ │Manufacturing Agent  │ │
│ └─────────────┘ │ └─────────────┘ │ └─────────────────────┘ │
└─────────────────┴─────────────────┴─────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    MCP LAYER                                │
├─────────────────┬─────────────────┬─────────────────────────┤
│  TechStart-CRM  │  Fashion-Analy  │  ACME-Inventory        │
│  MCP Server     │  MCP Server     │  MCP Server            │
│                 │                 │                        │
│ • search_cust   │ • trend_analysis│ • check_inventory      │
│ • get_orders    │ • campaign_perf │ • schedule_maint       │
│ • calc_ltv      │ • segment_users │ • order_materials      │
└─────────────────┴─────────────────┴─────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                   WORKFLOW LAYER                            │
├─────────────────┬─────────────────┬─────────────────────────┤
│   Order Proc    │  Support Auto   │   Marketing Camp       │
│   Workflows     │  Workflows      │   Workflows            │
│                 │                 │                        │
│ • Shopify       │ • Ticket Route  │ • Email Campaigns      │
│ • Google Sheets │ • Escalation    │ • Analytics Reports    │
│ • Email Notify  │ • Knowledge Base│ • Social Media Posts   │
└─────────────────┴─────────────────┴─────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                  DATA SOURCE LAYER                          │
├─────────────────┬─────────────────┬─────────────────────────┤
│    Databases    │      APIs       │      File Storage      │
│                 │                 │                        │
│ • MySQL/CRM     │ • Shopify       │ • Google Drive         │
│ • MongoDB/Events│ • Salesforce    │ • S3 Storage           │
│ • BigQuery/DW   │ • Zendesk       │ • Local Files          │
└─────────────────┴─────────────────┴─────────────────────────┘
```

---

## Multi-Customer Setup

### 1. Customer Context Configuration

Each customer gets their own configuration file in `/backend/configs/contexts/`:

```json
// /backend/configs/contexts/techstart.json
{
  "company": {
    "name": "TechStart Inc",
    "industry": "Technology",
    "website": "https://techstart.com",
    "timezone": "America/New_York"
  },
  "prompts": {
    "agents": {
      "sales": {
        "systemPrompt": "You are a technical sales assistant for TechStart Inc, a cutting-edge AI startup. Help customers understand our SaaS solutions, pricing, and technical integrations.",
        "temperature": 0.7,
        "tools": ["search_customers", "get_customer_orders", "check_inventory", "update_customer_notes"]
      },
      "support": {
        "systemPrompt": "You are TechStart's technical support agent. Help customers troubleshoot issues, provide documentation, and escalate complex problems.",
        "temperature": 0.3,
        "tools": ["search_tickets", "get_documentation", "escalate_ticket", "update_ticket"]
      },
      "marketing": {
        "systemPrompt": "You are TechStart's marketing assistant. Create campaigns, analyze customer data, and generate marketing content.",
        "temperature": 0.8,
        "tools": ["analyze_campaigns", "segment_users", "create_content", "schedule_posts"]
      },
      "hr": {
        "systemPrompt": "You are TechStart's HR assistant. Help with employee inquiries, policy questions, and internal communications.",
        "temperature": 0.5,
        "tools": ["get_policies", "schedule_meetings", "track_pto", "send_announcements"]
      },
      "finance": {
        "systemPrompt": "You are TechStart's finance assistant. Help with invoicing, payment tracking, and financial reporting.",
        "temperature": 0.2,
        "tools": ["generate_reports", "track_payments", "create_invoices", "expense_analysis"]
      }
    }
  },
  "dataSources": {
    "databases": {
      "primary": {
        "type": "mysql",
        "connection": "techstart_main",
        "host": "db1.techstart.com",
        "database": "techstart_crm",
        "credentials": "TECHSTART_DB"
      },
      "analytics": {
        "type": "mongodb",
        "connection": "techstart_analytics", 
        "uri": "mongodb://analytics.techstart.com/events",
        "credentials": "TECHSTART_MONGO"
      },
      "warehouse": {
        "type": "bigquery",
        "projectId": "techstart-analytics",
        "credentials": "TECHSTART_BQ"
      }
    },
    "apis": {
      "crm": {
        "provider": "salesforce",
        "instance": "techstart.salesforce.com",
        "credentials": "TECHSTART_SFDC"
      },
      "ecommerce": {
        "provider": "shopify",
        "store": "techstart.myshopify.com",
        "credentials": "TECHSTART_SHOPIFY"
      },
      "support": {
        "provider": "zendesk",
        "subdomain": "techstart",
        "credentials": "TECHSTART_ZENDESK"
      }
    },
    "files": {
      "documents": {
        "provider": "google_drive",
        "folderId": "1ABC123_techstart_docs",
        "credentials": "TECHSTART_GDRIVE"
      },
      "storage": {
        "provider": "s3",
        "bucket": "techstart-files",
        "region": "us-east-1",
        "credentials": "TECHSTART_S3"
      }
    }
  },
  "agentMappings": {
    "sales": {
      "dataSources": ["primary", "crm", "ecommerce", "analytics"],
      "permissions": {
        "primary": ["read", "write"],
        "crm": ["read", "write"], 
        "ecommerce": ["read"],
        "analytics": ["read"]
      },
      "mcpServer": "techstart-crm"
    },
    "support": {
      "dataSources": ["primary", "support", "documents"],
      "permissions": {
        "primary": ["read", "write"],
        "support": ["read", "write"],
        "documents": ["read"]
      },
      "mcpServer": "techstart-support"
    },
    "marketing": {
      "dataSources": ["analytics", "warehouse", "crm", "storage"],
      "permissions": {
        "analytics": ["read"],
        "warehouse": ["read"],
        "crm": ["read"],
        "storage": ["read", "write"]
      },
      "mcpServer": "techstart-analytics"
    },
    "hr": {
      "dataSources": ["primary", "documents"],
      "permissions": {
        "primary": ["read", "write"],
        "documents": ["read", "write"]
      },
      "mcpServer": "techstart-hr"
    },
    "finance": {
      "dataSources": ["primary", "warehouse", "ecommerce"],
      "permissions": {
        "primary": ["read", "write"],
        "warehouse": ["read"],
        "ecommerce": ["read"]
      },
      "mcpServer": "techstart-finance"
    }
  },
  "workflows": {
    "sales": [
      "lead-qualification",
      "demo-booking", 
      "quote-generation",
      "deal-closure"
    ],
    "support": [
      "ticket-routing",
      "escalation",
      "knowledge-base-update"
    ],
    "marketing": [
      "campaign-automation",
      "lead-nurturing", 
      "content-generation"
    ],
    "hr": [
      "employee-onboarding",
      "policy-updates",
      "performance-reviews"
    ],
    "finance": [
      "invoice-processing",
      "payment-reminders",
      "financial-reporting"
    ]
  },
  "notifications": {
    "slack": {
      "channels": {
        "sales": "#techstart-sales",
        "support": "#techstart-support",
        "marketing": "#techstart-marketing"
      },
      "webhook": "https://hooks.slack.com/techstart/webhook"
    },
    "email": {
      "from": "noreply@techstart.com",
      "templates": {
        "welcome": "techstart-welcome-template",
        "support": "techstart-support-template"
      }
    }
  }
}
```

### 2. Additional Customer Examples

```json
// /backend/configs/contexts/fashionboutique.json
{
  "company": {
    "name": "Fashion Boutique",
    "industry": "Fashion Retail",
    "website": "https://fashionboutique.com"
  },
  "prompts": {
    "agents": {
      "sales": {
        "systemPrompt": "You are a fashion consultant for Fashion Boutique. Help customers find the perfect outfits, suggest styling tips, and process orders with enthusiasm and fashion expertise.",
        "temperature": 0.8,
        "tools": ["product_search", "style_recommendations", "check_sizes", "process_order"]
      },
      "marketing": {
        "systemPrompt": "You are Fashion Boutique's marketing specialist. Create engaging fashion content, analyze trends, and manage social media campaigns.",
        "temperature": 0.9,
        "tools": ["trend_analysis", "content_creation", "social_scheduling", "influencer_outreach"]
      }
    }
  },
  "agentMappings": {
    "sales": {
      "dataSources": ["primary", "ecommerce", "inventory"],
      "mcpServer": "fashion-sales"
    },
    "marketing": {
      "dataSources": ["analytics", "social", "content"],
      "mcpServer": "fashion-marketing"
    }
  }
}
```

```json
// /backend/configs/contexts/acmecorp.json
{
  "company": {
    "name": "ACME Corporation",
    "industry": "Manufacturing",
    "website": "https://acme-corp.com"
  },
  "prompts": {
    "agents": {
      "sales": {
        "systemPrompt": "You are ACME Corp's industrial equipment sales specialist. Help customers with machinery quotes, technical specifications, and maintenance contracts.",
        "temperature": 0.4,
        "tools": ["equipment_catalog", "generate_quote", "check_availability", "schedule_demo"]
      },
      "support": {
        "systemPrompt": "You are ACME's technical support engineer. Help with equipment troubleshooting, maintenance scheduling, and parts ordering.",
        "temperature": 0.3,
        "tools": ["diagnostic_tools", "maintenance_schedule", "parts_catalog", "create_work_order"]
      }
    }
  },
  "agentMappings": {
    "sales": {
      "dataSources": ["primary", "inventory", "pricing"],
      "mcpServer": "acme-sales"
    },
    "support": {
      "dataSources": ["primary", "maintenance", "parts"],
      "mcpServer": "acme-support"
    }
  }
}
```

---

## Multiple Agent Types

### 1. Agent Router Structure

```javascript
// App.js - Register multiple agent routes
import createSalesAgentRouter from "./src/routes/salesAgentRouter.js";
import supportAgentRouter from "./src/routes/supportAgentRouter.js";
import marketingAgentRouter from "./src/routes/marketingAgentRouter.js";
import hrAgentRouter from "./src/routes/hrAgentRouter.js";
import financeAgentRouter from "./src/routes/financeAgentRouter.js";
import workflowRouter from "./src/routes/workflowRouter.js";

// Register all agent routes with context middleware
app.use("/api", contextMiddleware);
app.use("/api/sales", createSalesAgentRouter());
app.use("/api/support", supportAgentRouter);
app.use("/api/marketing", marketingAgentRouter);
app.use("/api/hr", hrAgentRouter);
app.use("/api/finance", financeAgentRouter);
app.use("/api/workflows", workflowRouter);
```

### 2. Agent Controller Pattern

```javascript
// /src/controllers/SupportAgentController.js
import AgentService from '../services/AgentService.js';
import MCPServerManager from '../mcp/MCPServerManager.js';

class SupportAgentController {
  async handleChat(req, res) {
    try {
      const { message, ticketId, priority } = req.body;
      const context = { ...req.context, agentType: 'support' };
      
      // Get support-specific system prompt and tools
      const agentConfig = context.prompts?.agents?.support;
      const systemPrompt = agentConfig?.systemPrompt || 'You are a helpful support agent.';
      
      const conversationHistory = [
        { role: 'user', content: message }
      ];
      
      // Add ticket context if provided
      if (ticketId) {
        const mcpServer = await MCPServerManager.getServerForCustomer(context, 'support');
        const ticketData = await mcpServer.executeTool('get_ticket', { ticket_id: ticketId });
        
        conversationHistory.unshift({
          role: 'system',
          content: `Ticket Context: ${JSON.stringify(ticketData)}`
        });
      }
      
      const result = await AgentService.processRequest({
        systemPrompt,
        conversationHistory,
        consumer: context.company?.name || 'Customer',
        context,
        temperature: agentConfig?.temperature || 0.3
      });
      
      res.json({
        success: true,
        response: result.response,
        ticketId: ticketId || result.ticketId,
        toolCalls: result.tool_calls,
        agentType: 'support'
      });
      
    } catch (error) {
      console.error('Support agent error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  async createTicket(req, res) {
    try {
      const { title, description, priority = 'normal', category } = req.body;
      const context = { ...req.context, agentType: 'support' };
      
      const mcpServer = await MCPServerManager.getServerForCustomer(context, 'support');
      const ticket = await mcpServer.executeTool('create_ticket', {
        title,
        description,
        priority,
        category,
        customer_id: req.body.customer_id
      });
      
      res.json({
        success: true,
        ticket
      });
    } catch (error) {
      console.error('Create ticket error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getTickets(req, res) {
    try {
      const { status, priority, limit = 50 } = req.query;
      const context = { ...req.context, agentType: 'support' };
      
      const mcpServer = await MCPServerManager.getServerForCustomer(context, 'support');
      const tickets = await mcpServer.executeTool('search_tickets', {
        status,
        priority,
        limit: parseInt(limit)
      });
      
      res.json({
        success: true,
        tickets
      });
    } catch (error) {
      console.error('Get tickets error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

export default new SupportAgentController();
```

### 3. Agent-Specific Routes

```javascript
// /src/routes/supportAgentRouter.js
import express from 'express';
import SupportAgentController from '../controllers/SupportAgentController.js';

const router = express.Router();

// Chat with support agent
router.post('/chat', SupportAgentController.handleChat);

// Ticket management
router.post('/tickets', SupportAgentController.createTicket);
router.get('/tickets', SupportAgentController.getTickets);
router.get('/tickets/:id', SupportAgentController.getTicket);
router.put('/tickets/:id', SupportAgentController.updateTicket);

// Knowledge base
router.get('/kb/search', SupportAgentController.searchKnowledgeBase);
router.post('/kb/articles', SupportAgentController.createArticle);

export default router;
```

---

## Data Source Mapping

### 1. Data Source Service

```javascript
// /src/services/DataSourceService.js
import mysql from 'mysql2/promise';
import { MongoClient } from 'mongodb';
import { BigQuery } from '@google-cloud/bigquery';
import axios from 'axios';

class DataSourceService {
  constructor() {
    this.connections = new Map();
    this.clients = new Map();
  }

  /**
   * Get data source configuration for agent with permission checking
   */
  getDataSourceConfig(context, agentType, dataSourceName) {
    const agentMapping = context.agentMappings?.[agentType];
    if (!agentMapping?.dataSources.includes(dataSourceName)) {
      throw new Error(`Agent ${agentType} doesn't have access to ${dataSourceName}`);
    }

    // Find data source in any category
    const dataSource = context.dataSources?.databases?.[dataSourceName] ||
                      context.dataSources?.apis?.[dataSourceName] ||
                      context.dataSources?.files?.[dataSourceName];

    if (!dataSource) {
      throw new Error(`Data source ${dataSourceName} not found`);
    }

    return {
      ...dataSource,
      permissions: agentMapping.permissions[dataSourceName] || ['read']
    };
  }

  /**
   * Get database connection with connection pooling
   */
  async getDatabaseConnection(context, agentType, dataSourceName) {
    const config = this.getDataSourceConfig(context, agentType, dataSourceName);
    const connectionKey = `${context.company.name}_${agentType}_${dataSourceName}`;

    if (this.connections.has(connectionKey)) {
      return this.connections.get(connectionKey);
    }

    let connection;
    switch (config.type) {
      case 'mysql':
        connection = await mysql.createPool({
          host: config.host,
          database: config.database,
          user: process.env[`${config.credentials}_USER`],
          password: process.env[`${config.credentials}_PASS`],
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0
        });
        break;

      case 'mongodb':
        const client = new MongoClient(config.uri, {
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        });
        await client.connect();
        connection = client.db();
        break;

      case 'bigquery':
        connection = new BigQuery({
          projectId: config.projectId,
          keyFilename: process.env[`${config.credentials}_KEY_FILE`]
        });
        break;

      default:
        throw new Error(`Unsupported database type: ${config.type}`);
    }

    const connectionInfo = { connection, config, lastUsed: Date.now() };
    this.connections.set(connectionKey, connectionInfo);
    
    // Set up connection cleanup
    setTimeout(() => {
      this.cleanupConnection(connectionKey);
    }, 30 * 60 * 1000); // 30 minutes

    return connectionInfo;
  }

  /**
   * Execute query with permission and audit logging
   */
  async executeQuery(context, agentType, dataSourceName, query, operation = 'read') {
    const { connection, config } = await this.getDatabaseConnection(context, agentType, dataSourceName);
    
    // Check permissions
    if (!config.permissions.includes(operation)) {
      throw new Error(`Agent ${agentType} doesn't have ${operation} permission for ${dataSourceName}`);
    }

    // Log query for audit
    console.log(`[AUDIT] ${context.company.name}:${agentType} ${operation} on ${dataSourceName}: ${query.substring(0, 100)}...`);

    try {
      let result;
      switch (config.type) {
        case 'mysql':
          const [rows] = await connection.execute(query);
          result = rows;
          break;

        case 'mongodb':
          // Parse MongoDB query (simplified)
          const queryParts = query.split('.');
          const collection = queryParts[0];
          const method = queryParts[1];
          const params = queryParts[2] ? JSON.parse(queryParts[2]) : {};
          result = await connection.collection(collection)[method](params);
          break;

        case 'bigquery':
          const [job] = await connection.createQueryJob({ query });
          const [rows] = await job.getQueryResults();
          result = rows;
          break;

        default:
          throw new Error(`Unsupported query execution for ${config.type}`);
      }

      return result;
    } catch (error) {
      console.error(`[ERROR] Query failed for ${context.company.name}:${agentType}:${dataSourceName}:`, error);
      throw error;
    }
  }

  /**
   * Get API client with rate limiting and caching
   */
  async getApiClient(context, agentType, apiName) {
    const config = this.getDataSourceConfig(context, agentType, apiName);
    const clientKey = `${context.company.name}_${agentType}_${apiName}`;

    if (this.clients.has(clientKey)) {
      const cached = this.clients.get(clientKey);
      if (Date.now() - cached.created < 60000) { // 1 minute cache
        return cached;
      }
    }

    let client;
    switch (config.provider) {
      case 'salesforce':
        client = axios.create({
          baseURL: `https://${config.instance}/services/data/v57.0`,
          headers: {
            'Authorization': `Bearer ${process.env[config.credentials + '_TOKEN']}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        });
        break;

      case 'shopify':
        client = axios.create({
          baseURL: `https://${config.store}/admin/api/2024-01`,
          headers: {
            'X-Shopify-Access-Token': process.env[config.credentials + '_TOKEN'],
            'Content-Type': 'application/json'
          },
          timeout: 30000
        });
        break;

      case 'zendesk':
        client = axios.create({
          baseURL: `https://${config.subdomain}.zendesk.com/api/v2`,
          auth: {
            username: process.env[config.credentials + '_USER'],
            password: process.env[config.credentials + '_TOKEN']
          },
          timeout: 30000
        });
        break;

      default:
        throw new Error(`Unsupported API provider: ${config.provider}`);
    }

    const clientInfo = { client, config, created: Date.now() };
    this.clients.set(clientKey, clientInfo);
    return clientInfo;
  }

  /**
   * Clean up unused connections
   */
  cleanupConnection(connectionKey) {
    const connection = this.connections.get(connectionKey);
    if (connection && Date.now() - connection.lastUsed > 30 * 60 * 1000) {
      if (connection.connection.end) {
        connection.connection.end();
      }
      this.connections.delete(connectionKey);
      console.log(`[CLEANUP] Closed connection: ${connectionKey}`);
    }
  }
}

export default new DataSourceService();
```

### 2. Enhanced Database Node

```javascript
// /src/workflow/nodes/DatabaseNode.js
import DataSourceService from '../../services/DataSourceService.js';

class DatabaseNode {
  static definition = {
    type: 'database',
    name: 'Database',
    description: 'Execute database operations with data source mapping',
    operations: {
      mysql: ['select', 'insert', 'update', 'delete', 'query'],
      mongodb: ['find', 'insert', 'update', 'delete', 'aggregate', 'count']
    },
    inputs: {
      operation: {
        type: 'string',
        required: true,
        description: 'Database operation (e.g., primary.mysql.select, analytics.mongodb.find)'
      },
      query: {
        type: 'any',
        description: 'Query string (SQL) or query object (MongoDB)'
      },
      data: {
        type: 'any',
        description: 'Data to insert or update'
      },
      collection: {
        type: 'string',
        description: 'Collection/table name'
      }
    }
  };

  static async execute(step, config, context) {
    try {
      // Parse operation: "dataSource.database.action"
      const [dataSourceName, dbType, action] = config.operation.split('.');
      
      if (!dataSourceName || !dbType || !action) {
        throw new Error('Operation must be in format "dataSource.database.action" (e.g., "primary.mysql.select")');
      }

      // Get agent type from context
      const agentType = context.agentType || 'general';
      
      let result;
      switch (dbType) {
        case 'mysql':
          result = await DatabaseNode.handleMySQL(dataSourceName, action, config, context, agentType);
          break;
        case 'mongodb':
          result = await DatabaseNode.handleMongoDB(dataSourceName, action, config, context, agentType);
          break;
        default:
          throw new Error(`Unsupported database type: ${dbType}`);
      }

      return {
        success: true,
        operation: config.operation,
        dataSource: dataSourceName,
        ...result
      };

    } catch (error) {
      console.error('Database operation failed:', error);
      
      if (step.on_error === 'stop') {
        throw error;
      }

      return {
        success: false,
        error: error.message,
        operation: config.operation
      };
    }
  }

  static async handleMySQL(dataSourceName, action, config, context, agentType) {
    switch (action) {
      case 'select':
      case 'query':
        if (!config.query) throw new Error('Query is required for select operation');
        const result = await DataSourceService.executeQuery(
          context, 
          agentType, 
          dataSourceName, 
          config.query, 
          'read'
        );
        return {
          data: result,
          count: Array.isArray(result) ? result.length : 1
        };

      case 'insert':
        if (!config.collection) throw new Error('Table name is required for insert operation');
        if (!config.data) throw new Error('Data is required for insert operation');
        
        const fields = Object.keys(config.data);
        const values = Object.values(config.data);
        const placeholders = fields.map(() => '?').join(', ');
        
        const insertQuery = `INSERT INTO ${config.collection} (${fields.join(', ')}) VALUES (${placeholders})`;
        const insertResult = await DataSourceService.executeQuery(
          context,
          agentType, 
          dataSourceName,
          insertQuery,
          'write'
        );
        
        return {
          insertedId: insertResult.insertId,
          count: insertResult.affectedRows,
          data: { id: insertResult.insertId, ...config.data }
        };

      case 'update':
        if (!config.collection) throw new Error('Table name is required for update operation');
        if (!config.data) throw new Error('Data is required for update operation');
        if (!config.where) throw new Error('WHERE condition is required for update operation');
        
        const updateFields = Object.keys(config.data);
        const updateValues = Object.values(config.data);
        const setClause = updateFields.map(field => `${field} = ?`).join(', ');
        
        const updateQuery = `UPDATE ${config.collection} SET ${setClause} WHERE ${config.where}`;
        const updateResult = await DataSourceService.executeQuery(
          context,
          agentType,
          dataSourceName,
          updateQuery,
          'write'
        );
        
        return {
          count: updateResult.affectedRows,
          data: config.data
        };

      case 'delete':
        if (!config.collection) throw new Error('Table name is required for delete operation');
        if (!config.where) throw new Error('WHERE condition is required for delete operation');
        
        const deleteQuery = `DELETE FROM ${config.collection} WHERE ${config.where}`;
        const deleteResult = await DataSourceService.executeQuery(
          context,
          agentType,
          dataSourceName,
          deleteQuery,
          'write'
        );
        
        return {
          count: deleteResult.affectedRows
        };

      default:
        throw new Error(`Unsupported MySQL action: ${action}`);
    }
  }

  static async handleMongoDB(dataSourceName, action, config, context, agentType) {
    if (!config.collection) {
      throw new Error('Collection name is required for MongoDB operations');
    }

    const mongoQuery = `${config.collection}.${action}.${JSON.stringify(config.query || {})}`;
    
    switch (action) {
      case 'find':
        const findResult = await DataSourceService.executeQuery(
          context,
          agentType,
          dataSourceName,
          mongoQuery,
          'read'
        );
        return {
          data: findResult,
          count: Array.isArray(findResult) ? findResult.length : 1
        };

      case 'insert':
        if (!config.data) throw new Error('Data is required for insert operation');
        const insertQuery = `${config.collection}.insertOne.${JSON.stringify(config.data)}`;
        const insertResult = await DataSourceService.executeQuery(
          context,
          agentType,
          dataSourceName,
          insertQuery,
          'write'
        );
        return {
          insertedId: insertResult.insertedId,
          count: 1,
          data: config.data
        };

      default:
        throw new Error(`Unsupported MongoDB action: ${action}`);
    }
  }
}

export default DatabaseNode;
```

---

## MCP Server Integration

### 1. Customer-Specific MCP Servers

```javascript
// /src/mcp/servers/TechStartCRMServer.js
import { MCPServer } from '@modelcontextprotocol/sdk';
import DataSourceService from '../../services/DataSourceService.js';

class TechStartCRMServer extends MCPServer {
  constructor(context) {
    super({
      name: 'techstart-crm',
      version: '1.0.0',
      description: 'TechStart CRM and Sales Tools'
    });
    
    this.context = context;
    this.agentType = null;
    
    this.registerTools();
    this.registerResources();
  }

  registerTools() {
    // Customer search tool
    this.addTool({
      name: 'search_customers',
      description: 'Search customers in TechStart CRM by name, email, or company',
      parameters: {
        query: { 
          type: 'string', 
          description: 'Search query (name, email, or company)' 
        },
        limit: { 
          type: 'number', 
          default: 10,
          description: 'Maximum number of results to return'
        },
        include_inactive: {
          type: 'boolean',
          default: false,
          description: 'Include inactive customers in results'
        }
      }
    }, async (params) => {
      const statusFilter = params.include_inactive ? '' : 'AND status = "active"';
      const query = `
        SELECT id, name, email, company, status, created_at, last_contact_date
        FROM customers 
        WHERE (name LIKE ? OR email LIKE ? OR company LIKE ?) ${statusFilter}
        ORDER BY last_contact_date DESC
        LIMIT ?
      `;
      
      const searchTerm = `%${params.query}%`;
      const customers = await DataSourceService.executeQuery(
        this.context,
        this.agentType,
        'crm',
        query,
        'read'
      );
      
      return { 
        customers,
        total: customers.length,
        query: params.query
      };
    });

    // Get customer orders
    this.addTool({
      name: 'get_customer_orders',
      description: 'Get orders for a specific customer',
      parameters: {
        customer_id: { type: 'string', required: true },
        status: { 
          type: 'string', 
          enum: ['pending', 'processing', 'completed', 'cancelled', 'any'],
          default: 'any',
          description: 'Filter by order status'
        },
        limit: { type: 'number', default: 20 }
      }
    }, async (params) => {
      const statusFilter = params.status !== 'any' ? 'AND status = ?' : '';
      const query = `
        SELECT o.id, o.order_number, o.status, o.total_amount, o.created_at,
               oi.product_name, oi.quantity, oi.unit_price
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.customer_id = ? ${statusFilter}
        ORDER BY o.created_at DESC
        LIMIT ?
      `;
      
      const queryParams = params.status !== 'any' 
        ? [params.customer_id, params.status, params.limit]
        : [params.customer_id, params.limit];
        
      const orders = await DataSourceService.executeQuery(
        this.context,
        this.agentType,
        'primary',
        query,
        'read'
      );
      
      // Group order items by order
      const groupedOrders = orders.reduce((acc, row) => {
        const orderId = row.id;
        if (!acc[orderId]) {
          acc[orderId] = {
            id: row.id,
            order_number: row.order_number,
            status: row.status,
            total_amount: row.total_amount,
            created_at: row.created_at,
            items: []
          };
        }
        if (row.product_name) {
          acc[orderId].items.push({
            product_name: row.product_name,
            quantity: row.quantity,
            unit_price: row.unit_price
          });
        }
        return acc;
      }, {});
      
      return { 
        orders: Object.values(groupedOrders),
        customer_id: params.customer_id
      };
    });

    // Calculate customer lifetime value
    this.addTool({
      name: 'calculate_customer_ltv',
      description: 'Calculate customer lifetime value with detailed analytics',
      parameters: {
        customer_id: { type: 'string', required: true },
        include_projections: { 
          type: 'boolean', 
          default: true,
          description: 'Include future value projections'
        }
      }
    }, async (params) => {
      // Get customer order history from primary database
      const orderHistory = await DataSourceService.executeQuery(
        this.context,
        this.agentType,
        'primary',
        'SELECT total_amount, created_at FROM orders WHERE customer_id = ? AND status = "completed"',
        'read'
      );
      
      // Get analytics data from analytics database
      const analyticsQuery = `customer_analytics.findOne.{"customer_id": "${params.customer_id}"}`;
      const analytics = await DataSourceService.executeQuery(
        this.context,
        this.agentType,
        'analytics',
        analyticsQuery,
        'read'
      );
      
      const totalSpent = orderHistory.reduce((sum, order) => sum + order.total_amount, 0);
      const orderCount = orderHistory.length;
      const avgOrderValue = orderCount > 0 ? totalSpent / orderCount : 0;
      
      let projectedLtv = totalSpent;
      if (params.include_projections && analytics) {
        const monthlyOrderFreq = analytics.avg_orders_per_month || 0.5;
        const churnRate = analytics.churn_probability || 0.1;
        const expectedLifetimeMonths = 1 / churnRate;
        projectedLtv = avgOrderValue * monthlyOrderFreq * expectedLifetimeMonths;
      }
      
      return {
        customer_id: params.customer_id,
        current_ltv: totalSpent,
        projected_ltv: projectedLtv,
        order_count: orderCount,
        avg_order_value: avgOrderValue,
        first_order_date: orderHistory[0]?.created_at,
        last_order_date: orderHistory[orderHistory.length - 1]?.created_at,
        analytics: analytics || {}
      };
    });

    // Update customer notes (sales agent only)
    this.addTool({
      name: 'update_customer_notes',
      description: 'Update customer notes and interaction log (sales agents only)',
      parameters: {
        customer_id: { type: 'string', required: true },
        notes: { type: 'string', required: true },
        interaction_type: {
          type: 'string',
          enum: ['call', 'email', 'meeting', 'demo', 'quote', 'other'],
          default: 'other'
        }
      }
    }, async (params) => {
      if (this.agentType !== 'sales') {
        throw new Error('Only sales agents can update customer notes');
      }
      
      // Update customer notes
      const updateQuery = `
        UPDATE customers 
        SET notes = CONCAT(COALESCE(notes, ''), '\n[${new Date().toISOString()}] ${params.interaction_type.toUpperCase()}: ${params.notes}'),
            updated_at = NOW(),
            last_contact_date = NOW()
        WHERE id = ?
      `;
      
      await DataSourceService.executeQuery(
        this.context,
        this.agentType,
        'crm',
        updateQuery,
        'write'
      );
      
      // Log interaction
      const logQuery = `
        INSERT INTO customer_interactions (customer_id, agent_type, interaction_type, notes, created_at)
        VALUES (?, ?, ?, ?, NOW())
      `;
      
      await DataSourceService.executeQuery(
        this.context,
        this.agentType,
        'primary',
        logQuery,
        'write'
      );
      
      return { 
        success: true, 
        message: 'Customer notes updated and interaction logged',
        customer_id: params.customer_id
      };
    });

    // Real-time inventory check via Shopify
    this.addTool({
      name: 'check_inventory',
      description: 'Check real-time inventory levels from Shopify',
      parameters: {
        product_id: { 
          type: 'string', 
          description: 'Shopify product ID or SKU'
        },
        location_id: {
          type: 'string',
          description: 'Specific location ID (optional)'
        }
      }
    }, async (params) => {
      const { client } = await DataSourceService.getApiClient(this.context, this.agentType, 'ecommerce');
      
      let product;
      if (params.product_id.includes('gid://')) {
        // GraphQL ID format
        const numericId = params.product_id.split('/').pop();
        const response = await client.get(`/products/${numericId}.json`);
        product = response.data.product;
      } else if (params.product_id.match(/^\d+$/)) {
        // Numeric product ID
        const response = await client.get(`/products/${params.product_id}.json`);
        product = response.data.product;
      } else {
        // Search by SKU
        const response = await client.get('/products.json', {
          params: { limit: 250 }
        });
        product = response.data.products.find(p => 
          p.variants.some(v => v.sku === params.product_id)
        );
      }
      
      if (!product) {
        throw new Error(`Product not found: ${params.product_id}`);
      }
      
      const inventory = product.variants.map(variant => ({
        variant_id: variant.id,
        sku: variant.sku,
        title: variant.title,
        price: variant.price,
        inventory_quantity: variant.inventory_quantity,
        inventory_policy: variant.inventory_policy,
        available: variant.inventory_quantity > 0 || variant.inventory_policy === 'continue'
      }));
      
      return {
        product_id: product.id,
        product_title: product.title,
        product_status: product.status,
        variants: inventory,
        total_inventory: inventory.reduce((sum, v) => sum + (v.inventory_quantity || 0), 0)
      };
    });

    // Get current promotions
    this.addTool({
      name: 'get_current_promotions',
      description: 'Get active promotions and discount codes',
      parameters: {
        customer_eligible: {
          type: 'boolean',
          default: false,
          description: 'Filter for promotions this customer is eligible for'
        },
        customer_id: {
          type: 'string',
          description: 'Customer ID for eligibility checking'
        }
      }
    }, async (params) => {
      const { client } = await DataSourceService.getApiClient(this.context, this.agentType, 'ecommerce');
      
      // Get price rules (promotions)
      const response = await client.get('/price_rules.json');
      const now = new Date();
      
      const activePromotions = response.data.price_rules.filter(rule => {
        const startDate = new Date(rule.starts_at);
        const endDate = rule.ends_at ? new Date(rule.ends_at) : null;
        return startDate <= now && (!endDate || endDate >= now);
      });
      
      // Get discount codes for active promotions
      const promotionsWithCodes = await Promise.all(
        activePromotions.map(async (promotion) => {
          try {
            const codesResponse = await client.get(`/price_rules/${promotion.id}/discount_codes.json`);
            return {
              ...promotion,
              discount_codes: codesResponse.data.discount_codes
            };
          } catch (error) {
            return {
              ...promotion,
              discount_codes: []
            };
          }
        })
      );
      
      return {
        active_promotions: promotionsWithCodes,
        count: promotionsWithCodes.length,
        customer_id: params.customer_id
      };
    });
  }

  registerResources() {
    // Customer context resource
    this.addResource({
      name: 'customer_context',
      description: 'Current customer interaction context and company information',
      type: 'application/json'
    }, async () => {
      return {
        company: this.context.company,
        current_promotions: await this.getCurrentPromotions(),
        recent_announcements: await this.getRecentAnnouncements(),
        agent_capabilities: this.context.agentMappings[this.agentType],
        data_sources: this.context.agentMappings[this.agentType]?.dataSources || []
      };
    });

    // Sales playbook resource
    this.addResource({
      name: 'sales_playbook',
      description: 'Sales methodologies and best practices for TechStart',
      type: 'text/markdown'
    }, async () => {
      return `
# TechStart Sales Playbook

## Qualification Criteria
- Company size: 50+ employees
- Technology budget: $50K+ annually
- Current pain points with manual processes
- Decision maker involvement

## Product Positioning
- **AI-First Platform**: Leading edge technology
- **ROI Focus**: Show clear cost savings
- **Integration**: Works with existing tools
- **Support**: White-glove onboarding

## Common Objections & Responses
1. **"Too expensive"** → Focus on ROI and cost of current manual processes
2. **"Security concerns"** → Highlight SOC2, GDPR compliance
3. **"No time for implementation"** → Emphasize quick setup and support

## Next Steps Framework
- Demo → Technical evaluation → Pilot → Contract
      `;
    });
  }

  setAgentType(agentType) {
    this.agentType = agentType;
  }

  async getCurrentPromotions() {
    try {
      const { client } = await DataSourceService.getApiClient(this.context, this.agentType, 'ecommerce');
      const response = await client.get('/price_rules.json');
      const now = new Date();
      
      return response.data.price_rules.filter(rule => {
        const startDate = new Date(rule.starts_at);
        const endDate = rule.ends_at ? new Date(rule.ends_at) : null;
        return startDate <= now && (!endDate || endDate >= now);
      });
    } catch (error) {
      console.error('Error fetching promotions:', error);
      return [];
    }
  }

  async getRecentAnnouncements() {
    try {
      const announcements = await DataSourceService.executeQuery(
        this.context,
        this.agentType,
        'primary',
        'SELECT title, content, created_at FROM announcements WHERE active = 1 ORDER BY created_at DESC LIMIT 5',
        'read'
      );
      return announcements;
    } catch (error) {
      console.error('Error fetching announcements:', error);
      return [];
    }
  }
}

export default TechStartCRMServer;
```

### 2. MCP Server Manager

```javascript
// /src/mcp/MCPServerManager.js
import TechStartCRMServer from './servers/TechStartCRMServer.js';
import TechStartSupportServer from './servers/TechStartSupportServer.js';
import FashionSalesServer from './servers/FashionSalesServer.js';
import FashionMarketingServer from './servers/FashionMarketingServer.js';
import ACMESalesServer from './servers/ACMESalesServer.js';
import ACMESupportServer from './servers/ACMESupportServer.js';

class MCPServerManager {
  constructor() {
    this.servers = new Map();
    this.serverRegistry = new Map();
    
    // Register available server classes
    this.registerServerClasses();
  }

  registerServerClasses() {
    // TechStart servers
    this.serverRegistry.set('techstart-crm', TechStartCRMServer);
    this.serverRegistry.set('techstart-support', TechStartSupportServer);
    
    // Fashion Boutique servers
    this.serverRegistry.set('fashion-sales', FashionSalesServer);
    this.serverRegistry.set('fashion-marketing', FashionMarketingServer);
    
    // ACME Corp servers
    this.serverRegistry.set('acme-sales', ACMESalesServer);
    this.serverRegistry.set('acme-support', ACMESupportServer);
  }

  async getServerForCustomer(context, agentType) {
    const serverKey = `${context.company.name.toLowerCase().replace(/\s+/g, '-')}-${agentType}`;
    
    if (this.servers.has(serverKey)) {
      return this.servers.get(serverKey);
    }
    
    // Get MCP server type from agent mapping
    const mcpServerType = context.agentMappings?.[agentType]?.mcpServer;
    if (!mcpServerType) {
      throw new Error(`No MCP server configured for agent type: ${agentType}`);
    }
    
    const ServerClass = this.serverRegistry.get(mcpServerType);
    if (!ServerClass) {
      throw new Error(`MCP server class not found: ${mcpServerType}`);
    }
    
    // Create and initialize server
    const server = new ServerClass(context);
    server.setAgentType(agentType);
    
    try {
      await server.connect();
      console.log(`[MCP] Connected server: ${mcpServerType} for ${context.company.name}:${agentType}`);
    } catch (error) {
      console.error(`[MCP] Failed to connect server ${mcpServerType}:`, error);
      throw error;
    }
    
    this.servers.set(serverKey, server);
    
    // Set up cleanup after inactivity
    setTimeout(() => {
      this.cleanupServer(serverKey);
    }, 30 * 60 * 1000); // 30 minutes
    
    return server;
  }

  async getAvailableTools(context, agentType) {
    try {
      const server = await this.getServerForCustomer(context, agentType);
      return server.getAvailableTools();
    } catch (error) {
      console.error(`[MCP] Error getting tools for ${agentType}:`, error);
      return [];
    }
  }

  async getAvailableResources(context, agentType) {
    try {
      const server = await this.getServerForCustomer(context, agentType);
      return server.getAvailableResources();
    } catch (error) {
      console.error(`[MCP] Error getting resources for ${agentType}:`, error);
      return [];
    }
  }

  async executeTool(context, agentType, toolName, parameters) {
    const server = await this.getServerForCustomer(context, agentType);
    return server.executeTool(toolName, parameters);
  }

  async getResource(context, agentType, resourceName) {
    const server = await this.getServerForCustomer(context, agentType);
    return server.getResource(resourceName);
  }

  cleanupServer(serverKey) {
    const server = this.servers.get(serverKey);
    if (server) {
      server.disconnect();
      this.servers.delete(serverKey);
      console.log(`[MCP] Cleaned up server: ${serverKey}`);
    }
  }

  async healthCheck(context, agentType) {
    try {
      const server = await this.getServerForCustomer(context, agentType);
      return {
        status: 'healthy',
        server_type: context.agentMappings?.[agentType]?.mcpServer,
        tools_count: server.getAvailableTools().length,
        resources_count: server.getAvailableResources().length,
        last_checked: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        last_checked: new Date().toISOString()
      };
    }
  }
}

export default new MCPServerManager();
```

### 3. Enhanced Agent Service with MCP

```javascript
// /src/services/AgentService.js
import OpenAI from 'openai';
import MCPServerManager from '../mcp/MCPServerManager.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

class AgentService {
  static async processRequest({ 
    systemPrompt, 
    conversationHistory, 
    consumer, 
    context, 
    temperature = 0.7,
    maxToolCalls = 5
  }) {
    try {
      const agentType = context.agentType || 'general';
      
      // Get MCP tools and resources for this agent
      const availableTools = await MCPServerManager.getAvailableTools(context, agentType);
      const availableResources = await MCPServerManager.getAvailableResources(context, agentType);
      
      // Enhanced system prompt with MCP capabilities
      const enhancedSystemPrompt = `
        ${systemPrompt}
        
        REAL-TIME TOOLS AVAILABLE:
        ${availableTools.map(tool => `- ${tool.name}: ${tool.description}`).join('\n')}
        
        RESOURCES AVAILABLE:
        ${availableResources.map(resource => `- ${resource.name}: ${resource.description}`).join('\n')}
        
        CONTEXT INFORMATION:
        - Customer: ${context.company.name}
        - Industry: ${context.company.industry}
        - Agent Type: ${agentType}
        - Available Data Sources: ${context.agentMappings?.[agentType]?.dataSources?.join(', ') || 'None'}
        
        INSTRUCTIONS:
        - Use tools when you need real-time data or want to perform actions
        - Always explain what tools you're using and why
        - Provide specific, actionable responses based on real data when possible
        - Respect data permissions - only access what your agent type allows
      `;

      let messages = [
        { role: 'system', content: enhancedSystemPrompt },
        ...conversationHistory
      ];

      let toolCallCount = 0;
      let finalResponse = null;

      // Main conversation loop with tool calling
      while (toolCallCount < maxToolCalls) {
        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages,
          tools: availableTools.map(tool => ({
            type: 'function',
            function: {
              name: tool.name,
              description: tool.description,
              parameters: tool.parameters
            }
          })),
          tool_choice: 'auto',
          temperature
        });

        const message = response.choices[0].message;
        messages.push(message);

        // Check if AI wants to use tools
        if (message.tool_calls && message.tool_calls.length > 0) {
          console.log(`[AGENT] ${agentType} making ${message.tool_calls.length} tool calls`);
          
          const toolResults = [];
          
          for (const toolCall of message.tool_calls) {
            try {
              console.log(`[TOOL] Executing ${toolCall.function.name} with params:`, toolCall.function.arguments);
              
              const result = await MCPServerManager.executeTool(
                context,
                agentType,
                toolCall.function.name,
                JSON.parse(toolCall.function.arguments)
              );
              
              toolResults.push({
                tool_call_id: toolCall.id,
                role: 'tool',
                content: JSON.stringify(result)
              });
              
              console.log(`[TOOL] ${toolCall.function.name} completed successfully`);
              
            } catch (error) {
              console.error(`[TOOL] ${toolCall.function.name} failed:`, error);
              
              toolResults.push({
                tool_call_id: toolCall.id,
                role: 'tool',
                content: JSON.stringify({ 
                  error: error.message,
                  tool_name: toolCall.function.name
                })
              });
            }
          }
          
          // Add tool results to conversation
          messages.push(...toolResults);
          toolCallCount++;
          
        } else {
          // No more tool calls, we have final response
          finalResponse = message.content;
          break;
        }
      }

      // If we hit max tool calls, get final response
      if (!finalResponse) {
        const finalCompletion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            ...messages,
            { 
              role: 'system', 
              content: 'Provide your final response based on all the tool results and information gathered.' 
            }
          ],
          temperature
        });
        finalResponse = finalCompletion.choices[0].message.content;
      }

      return {
        response: finalResponse,
        tool_calls_made: toolCallCount,
        tools_available: availableTools.length,
        conversation_length: messages.length
      };

    } catch (error) {
      console.error('AgentService error:', error);
      throw error;
    }
  }
}

export default AgentService;
```

### 4. MCP Workflow Node

```javascript
// /src/workflow/nodes/MCPNode.js
import MCPServerManager from '../../mcp/MCPServerManager.js';

class MCPNode {
  static definition = {
    type: 'mcp',
    name: 'MCP Tool',
    description: 'Execute MCP server tools within workflows',
    inputs: {
      tool_name: {
        type: 'string',
        required: true,
        description: 'Name of MCP tool to execute'
      },
      parameters: {
        type: 'object',
        description: 'Parameters to pass to the tool'
      },
      agent_type: {
        type: 'string',
        description: 'Override agent type for tool execution'
      }
    },
    outputs: {
      result: 'Tool execution result',
      success: 'Whether tool executed successfully',
      tool_name: 'Name of executed tool'
    }
  };

  static async execute(step, config, context) {
    try {
      const agentType = config.agent_type || context.agentType || 'general';
      
      console.log(`[MCP NODE] Executing ${config.tool_name} for ${agentType}`);
      
      const result = await MCPServerManager.executeTool(
        context,
        agentType,
        config.tool_name,
        config.parameters || {}
      );
      
      return {
        success: true,
        result,
        tool_name: config.tool_name,
        agent_type: agentType
      };
      
    } catch (error) {
      console.error('MCP node execution failed:', error);
      
      if (step.on_error === 'stop') {
        throw error;
      }
      
      return {
        success: false,
        error: error.message,
        tool_name: config.tool_name
      };
    }
  }

  static validate(config) {
    const errors = [];
    
    if (!config.tool_name) {
      errors.push('Tool name is required');
    }
    
    return errors;
  }

  static getExamples() {
    return {
      searchCustomers: {
        tool_name: 'search_customers',
        parameters: {
          query: '{{inputs.customer_query}}',
          limit: 10
        }
      },
      calculateLTV: {
        tool_name: 'calculate_customer_ltv',
        parameters: {
          customer_id: '{{inputs.customer_id}}',
          include_projections: true
        }
      },
      updateNotes: {
        tool_name: 'update_customer_notes',
        agent_type: 'sales',
        parameters: {
          customer_id: '{{inputs.customer_id}}',
          notes: '{{inputs.interaction_summary}}',
          interaction_type: 'call'
        }
      }
    };
  }
}

export default MCPNode;
```

---

## Hybrid Architecture Benefits

### Comparison Matrix

| Capability | Workflow Nodes | MCP Servers | Hybrid System |
|-----------|----------------|-------------|---------------|
| **Batch Processing** | ✅ Excellent | ❌ No | ✅ Excellent |
| **Real-time Data** | ❌ Static snapshots | ✅ Live data | ✅ Both |
| **AI Decision Making** | ❌ Pre-defined logic | ✅ Dynamic decisions | ✅ Intelligent flows |
| **Complex Orchestration** | ✅ Multi-step flows | ❌ Single actions | ✅ Smart workflows |
| **User Interaction** | ❌ Background only | ✅ Conversational | ✅ Both modes |
| **Data Permissions** | ✅ Basic | ✅ Advanced | ✅ Comprehensive |
| **Scalability** | ✅ High | ✅ High | ✅ Very High |
| **Development Speed** | 🔶 Medium | 🔶 Medium | ✅ Fast |

### Use Case Examples

#### **1. Intelligent Order Processing (Hybrid)**
```yaml
# Workflow that uses AI decision-making with MCP tools
name: intelligent-order-processing
steps:
  - id: get_order_details
    type: mcp
    config:
      tool_name: get_customer_orders
      parameters:
        customer_id: "{{inputs.customer_id}}"
        status: "pending"
        
  - id: ai_risk_assessment
    type: agent
    config:
      agentType: sales
      prompt: |
        Analyze this pending order for potential issues:
        Order Details: {{steps.get_order_details.output.result}}
        
        Check for:
        - Inventory availability
        - Customer payment history  
        - Fraud indicators
        - Special handling requirements
        
        Provide risk score and recommendations.
        
  - id: auto_approve_or_flag
    type: conditional
    condition: "{{steps.ai_risk_assessment.output.risk_score < 0.3}}"
    if_true:
      - id: auto_approve
        type: shopify
        config:
          operation: orders.update
          resourceId: "{{inputs.order_id}}"
          data:
            status: "processing"
    if_false:
      - id: flag_for_review
        type: slack
        config:
          operation: messages.send
          channel: "#order-review"
          text: |
            🚨 Order flagged for manual review
            Order: {{inputs.order_id}}
            Risk Score: {{steps.ai_risk_assessment.output.risk_score}}
            Issues: {{steps.ai_risk_assessment.output.issues}}
```

#### **2. Dynamic Customer Support (MCP + Workflows)**
```bash
# Customer asks AI agent a question
curl -X POST http://localhost:3000/api/support/chat \
  -H "X-Context: techstart" \
  -d '{
    "message": "My API integration is failing with 403 errors"
  }'

# AI agent automatically:
# 1. Uses MCP to search similar tickets
# 2. Checks customer API key status  
# 3. Reviews documentation
# 4. If complex, triggers workflow for escalation
# 5. Updates ticket with findings
```

#### **3. Sales Lead Qualification (Full Hybrid)**
```yaml
name: ai-lead-qualification
steps:
  - id: enrich_lead_data
    type: mcp
    config:
      tool_name: search_customers
      parameters:
        query: "{{inputs.lead_email}}"
        
  - id: ai_qualification
    type: agent
    config:
      agentType: sales
      prompt: |
        Qualify this lead:
        Email: {{inputs.lead_email}}
        Company: {{inputs.company}}
        Message: {{inputs.message}}
        
        Existing Data: {{steps.enrich_lead_data.output.result}}
        
        Use your tools to:
        1. Calculate potential deal size
        2. Check current promotions
        3. Assess fit with our ICP
        4. Recommend next actions
        
  - id: update_crm_with_ai_insights
    type: mcp
    config:
      tool_name: update_customer_notes
      parameters:
        customer_id: "{{steps.ai_qualification.output.customer_id}}"
        notes: |
          AI Qualification Results:
          Score: {{steps.ai_qualification.output.qualification_score}}/100
          Deal Size: ${{steps.ai_qualification.output.estimated_deal_value}}
          Next Action: {{steps.ai_qualification.output.recommended_next_action}}
          Reasoning: {{steps.ai_qualification.output.qualification_reasoning}}
        interaction_type: "lead_qualification"
        
  - id: route_based_on_score
    type: conditional
    condition: "{{steps.ai_qualification.output.qualification_score >= 70}}"
    if_true:
      - id: schedule_demo
        type: email
        config:
          to: ["{{inputs.lead_email}}"]
          subject: "Let's schedule a demo - {{context.company.name}}"
          template: "high_value_lead"
          
      - id: notify_sales_team
        type: slack
        config:
          operation: messages.send
          channel: "#hot-leads"
          text: |
            🔥 Hot Lead Alert!
            Company: {{inputs.company}}
            Score: {{steps.ai_qualification.output.qualification_score}}/100
            Estimated Value: ${{steps.ai_qualification.output.estimated_deal_value}}
            
    if_false:
      - id: nurture_sequence
        type: email
        config:
          to: ["{{inputs.lead_email}}"]
          subject: "Thanks for your interest"
          template: "nurture_sequence_start"
```

---

## Implementation Guide

### 1. Environment Setup

```bash
# Install additional MCP dependencies
npm install @modelcontextprotocol/sdk
npm install googleapis nodemailer

# Environment variables for each customer
# TechStart
TECHSTART_DB_USER=techstart_user
TECHSTART_DB_PASS=techstart_password
TECHSTART_MONGO_URI=mongodb://techstart.mongo.com/events
TECHSTART_SFDC_TOKEN=00D...salesforce_token
TECHSTART_SHOPIFY_TOKEN=shpat_...shopify_token
TECHSTART_ZENDESK_USER=support@techstart.com
TECHSTART_ZENDESK_TOKEN=zendesk_api_token

# Fashion Boutique
FASHION_DB_USER=fashion_user
FASHION_DB_PASS=fashion_password
FASHION_SHOPIFY_TOKEN=shpat_...fashion_token
FASHION_KLAVIYO_TOKEN=klaviyo_api_key

# Shared services
SLACK_BOT_TOKEN=xoxb-shared-bot-token
OPENAI_API_KEY=sk-openai-api-key
EMAIL_SMTP_HOST=smtp.sendgrid.net
EMAIL_SMTP_USER=apikey
EMAIL_SMTP_PASS=sendgrid_api_key
```

### 2. Directory Structure

```
/backend/
├── src/
│   ├── controllers/
│   │   ├── SalesAgentController.js
│   │   ├── SupportAgentController.js
│   │   ├── MarketingAgentController.js
│   │   └── workflowController.js
│   ├── routes/
│   │   ├── salesAgentRouter.js
│   │   ├── supportAgentRouter.js
│   │   ├── marketingAgentRouter.js
│   │   └── workflowRouter.js
│   ├── services/
│   │   ├── AgentService.js
│   │   ├── DataSourceService.js
│   │   └── ConfigurationService.js
│   ├── mcp/
│   │   ├── MCPServerManager.js
│   │   └── servers/
│   │       ├── TechStartCRMServer.js
│   │       ├── TechStartSupportServer.js
│   │       ├── FashionSalesServer.js
│   │       └── ACMESalesServer.js
│   ├── workflow/
│   │   ├── WorkflowEngine.js
│   │   └── nodes/
│   │       ├── HttpRequestNode.js
│   │       ├── GoogleSheetsNode.js
│   │       ├── ShopifyNode.js
│   │       ├── DatabaseNode.js
│   │       ├── MCPNode.js
│   │       └── ...
│   └── middleware/
│       └── contextMiddleware.js
├── configs/
│   └── contexts/
│       ├── techstart.json
│       ├── fashionboutique.json
│       └── acmecorp.json
└── workflows/
    ├── customers/
    │   ├── techstart/
    │   │   ├── sales/
    │   │   │   ├── lead-qualification.yml
    │   │   │   └── quote-generation.yml
    │   │   └── support/
    │   │       └── ticket-escalation.yml
    │   ├── fashionboutique/
    │   └── acmecorp/
    └── examples/
        ├── shopify-order-processor.yml
        ├── customer-support-alert.yml
        └── daily-sales-report.yml
```

### 3. Customer Onboarding Process

#### Step 1: Create Customer Configuration
```bash
# Create customer context file
cp /backend/configs/contexts/template.json /backend/configs/contexts/newcustomer.json

# Edit configuration for new customer
vim /backend/configs/contexts/newcustomer.json
```

#### Step 2: Set Up Data Sources
```bash
# Add environment variables for customer
echo "NEWCUSTOMER_DB_USER=customer_db_user" >> .env
echo "NEWCUSTOMER_DB_PASS=customer_db_password" >> .env
echo "NEWCUSTOMER_SHOPIFY_TOKEN=shpat_customer_token" >> .env
```

#### Step 3: Create MCP Server
```javascript
// Create customer-specific MCP server
// /src/mcp/servers/NewCustomerCRMServer.js
import { MCPServer } from '@modelcontextprotocol/sdk';
import DataSourceService from '../../services/DataSourceService.js';

class NewCustomerCRMServer extends MCPServer {
  // Implementation specific to customer needs
}
```

#### Step 4: Register MCP Server
```javascript
// Add to MCPServerManager.js
this.serverRegistry.set('newcustomer-crm', NewCustomerCRMServer);
```

#### Step 5: Create Customer Workflows
```bash
mkdir -p /workflows/customers/newcustomer/sales
mkdir -p /workflows/customers/newcustomer/support

# Create customer-specific workflows
vim /workflows/customers/newcustomer/sales/lead-processing.yml
```

#### Step 6: Test Integration
```bash
# Test agent chat
curl -X POST http://localhost:3000/api/sales/chat \
  -H "X-Context: newcustomer" \
  -d '{"message": "Test MCP integration"}'

# Test workflow
curl -X POST http://localhost:3000/api/workflows/load \
  -H "X-Context: newcustomer" \
  -d '{"filePath": "customers/newcustomer/sales/lead-processing.yml"}'
```

---

## Usage Examples

### 1. Multi-Agent Customer Scenarios

#### **TechStart Inc - Full Suite**

```bash
# Sales Agent - Lead qualification with real-time data
curl -X POST http://localhost:3000/api/sales/chat \
  -H "X-Context: techstart" \
  -d '{
    "message": "I have a new lead from ACME Corp asking about our enterprise AI platform. Can you help me qualify them?"
  }'

# AI Response uses MCP tools to:
# - Search existing customers for ACME Corp  
# - Calculate potential deal size
# - Check current enterprise promotions
# - Provide qualification recommendations

# Support Agent - Technical issue resolution
curl -X POST http://localhost:3000/api/support/chat \
  -H "X-Context: techstart" \
  -d '{
    "message": "Customer is getting 403 errors on API endpoint /v1/predictions",
    "customer_id": "cust_123"
  }'

# AI Response uses MCP tools to:
# - Check customer API key status
# - Search similar resolved tickets
# - Review API documentation  
# - Provide troubleshooting steps

# Marketing Agent - Campaign performance analysis
curl -X POST http://localhost:3000/api/marketing/chat \
  -H "X-Context: techstart" \
  -d '{
    "message": "How did our Q3 email campaign perform? What should we optimize for Q4?"
  }'

# AI Response uses MCP tools to:
# - Analyze campaign metrics from warehouse
# - Segment user engagement data
# - Compare with industry benchmarks
# - Recommend Q4 strategy

# Execute automated workflow for new leads
curl -X POST http://localhost:3000/api/workflows/execute/intelligent-lead-qualification \
  -H "X-Context: techstart" \
  -d '{
    "inputs": {
      "lead_email": "john@acmecorp.com",
      "company": "ACME Corp",
      "message": "Interested in enterprise AI solutions for manufacturing"
    }
  }'
```

#### **Fashion Boutique - Retail Focus**

```bash
# Sales Agent - Style consultation
curl -X POST http://localhost:3000/api/sales/chat \
  -H "X-Context: fashionboutique" \
  -d '{
    "message": "Customer wants outfit recommendations for a summer wedding. Budget $500."
  }'

# AI Response uses MCP tools to:
# - Check current inventory levels
# - Search products by category/price
# - Get trending summer styles  
# - Create outfit combinations

# Marketing Agent - Trend analysis
curl -X POST http://localhost:3000/api/marketing/chat \
  -H "X-Context: fashionboutique" \
  -d '{
    "message": "What are the trending colors and styles for fall? Should we adjust our inventory?"
  }'

# Execute inventory restock workflow
curl -X POST http://localhost:3000/api/workflows/execute/automated-restock-analysis \
  -H "X-Context: fashionboutique" \
  -d '{
    "inputs": {
      "threshold": 10,
      "season": "fall"
    }
  }'
```

#### **ACME Corp - Manufacturing**

```bash
# Sales Agent - Equipment quote
curl -X POST http://localhost:3000/api/sales/chat \
  -H "X-Context: acmecorp" \
  -d '{
    "message": "Customer needs quote for hydraulic press system, 500-ton capacity, delivery in 8 weeks"
  }'

# AI Response uses MCP tools to:
# - Check equipment catalog availability
# - Calculate pricing with discounts
# - Verify production/delivery timeline
# - Generate formal quote document

# Support Agent - Maintenance scheduling  
curl -X POST http://localhost:3000/api/support/chat \
  -H "X-Context: acmecorp" \
  -d '{
    "message": "Customer reports unusual vibration in Machine ID MFG-001. Last service was 6 months ago.",
    "machine_id": "MFG-001"
  }'

# Execute predictive maintenance workflow
curl -X POST http://localhost:3000/api/workflows/execute/predictive-maintenance \
  -H "X-Context: acmecorp" \
  -d '{
    "inputs": {
      "machine_id": "MFG-001",
      "issue_type": "vibration",
      "priority": "medium"
    }
  }'
```

### 2. Cross-Agent Collaboration

#### **Scenario: Complex Customer Issue**

```bash
# Step 1: Support agent identifies potential sales opportunity
curl -X POST http://localhost:3000/api/support/chat \
  -H "X-Context: techstart" \
  -d '{
    "message": "Customer asking about API rate limits. They mention scaling to 10x current volume.",
    "customer_id": "cust_789"
  }'

# Step 2: Support agent creates internal referral
curl -X POST http://localhost:3000/api/workflows/execute/support-to-sales-handoff \
  -H "X-Context: techstart" \
  -d '{
    "inputs": {
      "customer_id": "cust_789",
      "opportunity_type": "upsell",
      "details": "Customer scaling 10x, needs higher API limits"
    }
  }'

# Step 3: Sales agent gets notification and follows up
curl -X POST http://localhost:3000/api/sales/chat \
  -H "X-Context: techstart" \
  -d '{
    "message": "I got a referral from support about customer cust_789 needing to scale API usage. What can you tell me?"
  }'

# Step 4: Marketing agent creates targeted content
curl -X POST http://localhost:3000/api/marketing/chat \
  -H "X-Context: techstart" \
  -d '{
    "message": "Create content about scaling API usage for enterprise customers like the recent cust_789 case"
  }'
```

### 3. Workflow + MCP Integration Examples

#### **Smart Order Processing with AI Decision Making**

```yaml
name: smart-order-processing
description: Process orders with AI fraud detection and dynamic routing

steps:
  - id: get_order_details
    type: mcp
    config:
      tool_name: get_customer_orders
      agent_type: sales
      parameters:
        customer_id: "{{inputs.customer_id}}"
        limit: 1
        
  - id: get_customer_history  
    type: mcp
    config:
      tool_name: calculate_customer_ltv
      agent_type: sales
      parameters:
        customer_id: "{{inputs.customer_id}}"
        include_projections: true
        
  - id: ai_fraud_check
    type: agent
    config:
      agentType: sales
      temperature: 0.2
      prompt: |
        Analyze this order for fraud indicators:
        
        Order: {{inputs.order_details}}
        Customer History: {{steps.get_customer_history.output.result}}
        
        Check for:
        - Unusual order patterns
        - Shipping/billing address mismatches  
        - High-value first-time purchases
        - Velocity checks
        
        Provide fraud_score (0-1) and risk_level (low/medium/high).
        
  - id: route_order
    type: conditional
    condition: "{{steps.ai_fraud_check.output.fraud_score < 0.3}}"
    if_true:
      - id: auto_process
        type: shopify
        config:
          operation: orders.update
          resourceId: "{{inputs.order_id}}"
          data:
            tags: "auto-approved,ai-processed"
            
      - id: send_confirmation
        type: email
        config:
          to: ["{{inputs.customer_email}}"]
          subject: "Order Confirmed - {{context.company.name}}"
          body: "Your order has been confirmed and will be processed shortly."
          
    if_false:
      - id: flag_for_review
        type: slack
        config:
          operation: messages.send
          channel: "#fraud-review"
          blocks:
            - type: header
              text:
                type: plain_text
                text: "🚨 Order Flagged for Review"
            - type: section
              text:
                type: mrkdwn
                text: |
                  *Order:* {{inputs.order_id}}
                  *Customer:* {{inputs.customer_email}}
                  *Fraud Score:* {{steps.ai_fraud_check.output.fraud_score}}
                  *Risk Level:* {{steps.ai_fraud_check.output.risk_level}}
                  *Reasons:* {{steps.ai_fraud_check.output.risk_factors}}
            - type: actions
              elements:
                - type: button
                  text:
                    type: plain_text
                    text: "Approve Order"
                  style: primary
                  url: "{{env.ADMIN_URL}}/orders/{{inputs.order_id}}/approve"
                - type: button
                  text:
                    type: plain_text
                    text: "Reject Order"
                  style: danger
                  url: "{{env.ADMIN_URL}}/orders/{{inputs.order_id}}/reject"
                  
      - id: update_customer_notes
        type: mcp
        config:
          tool_name: update_customer_notes
          agent_type: sales
          parameters:
            customer_id: "{{inputs.customer_id}}"
            notes: |
              FRAUD ALERT: Order {{inputs.order_id}} flagged for review
              Fraud Score: {{steps.ai_fraud_check.output.fraud_score}}
              Risk Factors: {{steps.ai_fraud_check.output.risk_factors}}
              Flagged by AI on {{now}}
            interaction_type: "fraud_flag"
```

### 4. Health Monitoring and Debugging

```bash
# Check MCP server health for all agents
curl -X GET http://localhost:3000/api/health/mcp \
  -H "X-Context: techstart"

# Response:
{
  "customer": "TechStart Inc",
  "agents": {
    "sales": {
      "status": "healthy",
      "server_type": "techstart-crm", 
      "tools_count": 6,
      "resources_count": 2
    },
    "support": {
      "status": "healthy", 
      "server_type": "techstart-support",
      "tools_count": 4,
      "resources_count": 1
    }
  }
}

# Check data source connections
curl -X GET http://localhost:3000/api/health/datasources/sales \
  -H "X-Context: techstart"

# List available tools for agent
curl -X GET http://localhost:3000/api/mcp/tools/sales \
  -H "X-Context: techstart"

# Test specific MCP tool
curl -X POST http://localhost:3000/api/mcp/test \
  -H "X-Context: techstart" \
  -d '{
    "agent_type": "sales",
    "tool_name": "search_customers",
    "parameters": {"query": "test", "limit": 1}
  }'
```

---

## Best Practices

### 1. Security & Data Isolation

#### **Data Source Permissions**
```javascript
// Always validate agent permissions before data access
const agentMapping = context.agentMappings?.[agentType];
if (!agentMapping?.dataSources.includes(dataSourceName)) {
  throw new Error(`Access denied: ${agentType} cannot access ${dataSourceName}`);
}

// Check operation permissions
if (!config.permissions.includes(operation)) {
  throw new Error(`Permission denied: ${agentType} cannot ${operation} on ${dataSourceName}`);
}

// Log all data access for audit
console.log(`[AUDIT] ${context.company.name}:${agentType} ${operation} on ${dataSourceName}`);
```

#### **Environment Variable Naming**
```bash
# Use consistent naming pattern
{CUSTOMER}_{SYSTEM}_{CREDENTIAL_TYPE}

# Examples:
TECHSTART_SHOPIFY_TOKEN
TECHSTART_DB_USER  
TECHSTART_DB_PASS
FASHION_KLAVIYO_TOKEN
ACME_ERP_USERNAME
```

#### **Connection Pooling**
```javascript
// Implement connection cleanup
const connectionInfo = { connection, config, lastUsed: Date.now() };
this.connections.set(connectionKey, connectionInfo);

// Set up automatic cleanup
setTimeout(() => {
  this.cleanupConnection(connectionKey);
}, 30 * 60 * 1000); // 30 minutes
```

### 2. Performance Optimization

#### **MCP Server Caching**
```javascript
// Cache MCP server instances per customer/agent
const serverKey = `${context.company.name}-${agentType}`;
if (this.servers.has(serverKey)) {
  return this.servers.get(serverKey);
}
```

#### **Tool Call Limits**
```javascript
// Prevent infinite tool calling loops
const maxToolCalls = 5;
let toolCallCount = 0;

while (toolCallCount < maxToolCalls && needsToolCalls) {
  // Execute tool calls
  toolCallCount++;
}
```

#### **Database Query Optimization**
```javascript
// Use prepared statements
const query = 'SELECT * FROM customers WHERE id = ? AND status = ?';
const result = await connection.execute(query, [customerId, status]);

// Implement query result caching for read operations
const cacheKey = `${query}-${JSON.stringify(params)}`;
if (this.queryCache.has(cacheKey)) {
  return this.queryCache.get(cacheKey);
}
```

### 3. Error Handling

#### **Graceful Degradation**
```yaml
# Workflow with fallback options
- id: primary_data_fetch
  type: mcp
  on_error: continue
  config:
    tool_name: get_customer_data
    
- id: fallback_data_fetch  
  condition: "{{steps.primary_data_fetch.output.success === false}}"
  type: database
  config:
    operation: primary.mysql.select
    query: "SELECT * FROM customers WHERE id = ?"
```

#### **Error Logging and Monitoring**
```javascript
try {
  const result = await mcpTool.execute(params);
  return result;
} catch (error) {
  console.error(`[MCP ERROR] ${toolName} failed for ${agentType}:`, {
    error: error.message,
    customer: context.company.name,
    agentType,
    toolName,
    parameters: params,
    timestamp: new Date().toISOString()
  });
  
  // Send to monitoring system
  this.sendErrorToMonitoring(error, context);
  
  throw error;
}
```

### 4. Testing Strategy

#### **Unit Tests for MCP Tools**
```javascript
// Test MCP tool execution
describe('TechStartCRMServer', () => {
  it('should search customers with valid parameters', async () => {
    const server = new TechStartCRMServer(mockContext);
    server.setAgentType('sales');
    
    const result = await server.executeTool('search_customers', {
      query: 'ACME',
      limit: 5
    });
    
    expect(result.customers).toBeInstanceOf(Array);
    expect(result.total).toBeGreaterThan(0);
  });
});
```

#### **Integration Tests for Workflows**
```javascript
// Test hybrid workflow execution
describe('Intelligent Lead Qualification', () => {
  it('should qualify lead using MCP tools and AI', async () => {
    const result = await workflowEngine.executeWorkflow(
      'intelligent-lead-qualification',
      {
        lead_email: 'test@acme.com',
        company: 'ACME Corp',
        message: 'Interested in enterprise solutions'
      },
      techstartContext
    );
    
    expect(result.status).toBe('completed');
    expect(result.outputs.qualification_score).toBeGreaterThan(0);
  });
});
```

#### **Load Testing for Multi-Agent System**
```bash
# Simulate concurrent requests to different agents
for agent in sales support marketing; do
  for i in {1..10}; do
    curl -X POST http://localhost:3000/api/$agent/chat \
      -H "X-Context: techstart" \
      -d '{"message": "Load test message"}' &
  done
done
wait
```

### 5. Monitoring and Observability

#### **Metrics Collection**
```javascript
// Track agent performance metrics
const metrics = {
  agent_type: agentType,
  customer: context.company.name,
  response_time: Date.now() - startTime,
  tool_calls_made: toolCallCount,
  tools_available: availableTools.length,
  success: !error
};

this.metricsCollector.record('agent_request', metrics);
```

#### **Health Check Endpoints**
```javascript
// /src/controllers/HealthController.js
class HealthController {
  async checkMCPHealth(req, res) {
    const context = req.context;
    const agentTypes = Object.keys(context.agentMappings || {});
    const health = {};
    
    for (const agentType of agentTypes) {
      health[agentType] = await MCPServerManager.healthCheck(context, agentType);
    }
    
    res.json({ customer: context.company.name, agents: health });
  }
  
  async checkDataSources(req, res) {
    const { agentType } = req.params;
    const context = req.context;
    
    const dataSources = context.agentMappings?.[agentType]?.dataSources || [];
    const health = {};
    
    for (const dataSource of dataSources) {
      try {
        await DataSourceService.getDatabaseConnection(context, agentType, dataSource);
        health[dataSource] = { status: 'healthy', lastChecked: new Date() };
      } catch (error) {
        health[dataSource] = { status: 'error', error: error.message };
      }
    }
    
    res.json({ agent_type: agentType, data_sources: health });
  }
}
```

---

## Troubleshooting

### 1. Common Issues

#### **MCP Server Connection Errors**
```
Error: MCP server class not found: techstart-crm
```
**Solution:**
```javascript
// Check MCPServerManager.js registration
this.serverRegistry.set('techstart-crm', TechStartCRMServer);

// Verify import path
import TechStartCRMServer from './servers/TechStartCRMServer.js';
```

#### **Data Source Permission Errors**
```
Error: Agent sales doesn't have access to support_tickets
```
**Solution:**
```json
// Update customer context file
{
  "agentMappings": {
    "sales": {
      "dataSources": ["primary", "crm", "support_tickets"],
      "permissions": {
        "support_tickets": ["read"]
      }
    }
  }
}
```

#### **Tool Call Failures**
```
Error: search_customers is not a function
```
**Solution:**
```javascript
// Check tool registration in MCP server
this.addTool({
  name: 'search_customers',
  description: 'Search customers',
  parameters: { /* ... */ }
}, async (params) => {
  // Implementation
});
```

### 2. Debugging Commands

```bash
# Check server logs for MCP registration
grep "Registered node\|MCP" logs/app.log

# Test MCP tool directly
curl -X POST http://localhost:3000/api/mcp/test \
  -H "X-Context: techstart" \
  -d '{
    "agent_type": "sales", 
    "tool_name": "search_customers",
    "parameters": {"query": "test"}
  }'

# Check workflow execution details
curl -X GET http://localhost:3000/api/workflows/executions/{executionId}

# Verify context loading
curl -X GET http://localhost:3000/api/debug/context \
  -H "X-Context: techstart"
```

### 3. Performance Issues

#### **Slow Tool Execution**
```javascript
// Add timing to tool calls
console.time(`Tool: ${toolName}`);
const result = await mcpServer.executeTool(toolName, params);
console.timeEnd(`Tool: ${toolName}`);
```

#### **Database Connection Timeouts**
```javascript
// Increase connection timeout
const connection = await mysql.createConnection({
  // ... other config
  acquireTimeout: 60000,
  timeout: 60000
});
```

#### **Memory Issues with Large Results**
```javascript
// Implement result pagination
this.addTool({
  name: 'search_customers',
  parameters: {
    limit: { type: 'number', default: 50, maximum: 1000 }
  }
}, async (params) => {
  const limit = Math.min(params.limit || 50, 1000);
  // ... query with limit
});
```

---

This comprehensive documentation covers the complete hybrid MCP + Workflow architecture, providing both theoretical understanding and practical implementation guidance for a multi-tenant, multi-agent platform. The system scales from simple single-customer setups to complex enterprise deployments with multiple agents, data sources, and intelligent automation workflows.