# 09 - 5 Simple Agents to Build & Test

## Overview

Here are 5 simple, practical agents you can build and test using the hybrid MCP + Workflow architecture. Each agent demonstrates different capabilities and is designed to be implementable in 30-60 minutes.

---

## 1. 📧 Email Assistant Agent

**Purpose**: Automatically process, categorize, and respond to customer emails.

### Setup

#### Context Configuration
```json
// /backend/configs/contexts/emailassistant.json
{
  "company": {
    "name": "Email Assistant Co",
    "industry": "Business Services",
    "website": "https://emailassistant.com"
  },
  "prompts": {
    "agents": {
      "email": {
        "systemPrompt": "You are an intelligent email assistant. Help categorize, prioritize, and draft responses to customer emails. Always be professional and helpful.",
        "temperature": 0.6,
        "tools": ["categorize_email", "draft_response", "check_sender_history", "schedule_followup"]
      }
    }
  },
  "dataSources": {
    "databases": {
      "primary": {
        "type": "mysql",
        "connection": "email_db",
        "host": "localhost",
        "database": "email_assistant",
        "credentials": "EMAIL_DB"
      }
    }
  },
  "agentMappings": {
    "email": {
      "dataSources": ["primary"],
      "permissions": {
        "primary": ["read", "write"]
      },
      "mcpServer": "email-assistant"
    }
  }
}
```

#### MCP Server
```javascript
// /src/mcp/servers/EmailAssistantServer.js
import { MCPServer } from '@modelcontextprotocol/sdk';
import DataSourceService from '../../services/DataSourceService.js';

class EmailAssistantServer extends MCPServer {
  constructor(context) {
    super({
      name: 'email-assistant',
      version: '1.0.0',
      description: 'Email processing and management tools'
    });
    
    this.context = context;
    this.agentType = null;
    this.registerTools();
  }

  registerTools() {
    // Categorize email
    this.addTool({
      name: 'categorize_email',
      description: 'Categorize email by type and priority',
      parameters: {
        subject: { type: 'string', required: true },
        sender: { type: 'string', required: true },
        body: { type: 'string', required: true }
      }
    }, async (params) => {
      // Simple keyword-based categorization
      const subject = params.subject.toLowerCase();
      const body = params.body.toLowerCase();
      
      let category = 'general';
      let priority = 'normal';
      
      // Support keywords
      if (subject.includes('help') || subject.includes('problem') || subject.includes('issue')) {
        category = 'support';
        priority = 'high';
      }
      // Sales keywords
      else if (subject.includes('quote') || subject.includes('pricing') || subject.includes('demo')) {
        category = 'sales';
        priority = 'high';
      }
      // Billing keywords
      else if (subject.includes('invoice') || subject.includes('payment') || subject.includes('billing')) {
        category = 'billing';
        priority = 'medium';
      }
      
      // Urgent keywords
      if (subject.includes('urgent') || subject.includes('asap') || body.includes('immediately')) {
        priority = 'urgent';
      }
      
      return {
        category,
        priority,
        confidence: 0.8
      };
    });

    // Check sender history
    this.addTool({
      name: 'check_sender_history',
      description: 'Get email history for sender',
      parameters: {
        sender_email: { type: 'string', required: true }
      }
    }, async (params) => {
      try {
        const history = await DataSourceService.executeQuery(
          this.context,
          this.agentType,
          'primary',
          'SELECT subject, category, created_at FROM emails WHERE sender_email = ? ORDER BY created_at DESC LIMIT 10',
          'read'
        );
        
        return {
          sender: params.sender_email,
          email_count: history.length,
          recent_emails: history,
          is_frequent_sender: history.length > 3
        };
      } catch (error) {
        return {
          sender: params.sender_email,
          email_count: 0,
          recent_emails: [],
          is_frequent_sender: false
        };
      }
    });

    // Save email to database
    this.addTool({
      name: 'save_email',
      description: 'Save processed email to database',
      parameters: {
        subject: { type: 'string', required: true },
        sender: { type: 'string', required: true },
        body: { type: 'string', required: true },
        category: { type: 'string', required: true },
        priority: { type: 'string', required: true },
        response_draft: { type: 'string' }
      }
    }, async (params) => {
      try {
        await DataSourceService.executeQuery(
          this.context,
          this.agentType,
          'primary',
          `INSERT INTO emails (subject, sender_email, body, category, priority, response_draft, processed_at) 
           VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          'write'
        );
        
        return { success: true, message: 'Email saved successfully' };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
  }

  setAgentType(agentType) {
    this.agentType = agentType;
  }
}

export default EmailAssistantServer;
```

#### Agent Controller
```javascript
// /src/controllers/EmailAgentController.js
import AgentService from '../services/AgentService.js';

class EmailAgentController {
  async processEmail(req, res) {
    try {
      const { subject, sender, body } = req.body;
      const context = { ...req.context, agentType: 'email' };
      
      const result = await AgentService.processRequest({
        systemPrompt: context.prompts?.agents?.email?.systemPrompt,
        conversationHistory: [{
          role: 'user',
          content: `Process this email:
            Subject: ${subject}
            From: ${sender}
            Body: ${body}
            
            Please:
            1. Categorize this email
            2. Check sender history
            3. Draft a professional response
            4. Save the email and response to database`
        }],
        consumer: 'Email System',
        context,
        temperature: 0.6
      });
      
      res.json({
        success: true,
        response: result.response,
        tool_calls: result.tool_calls_made
      });
      
    } catch (error) {
      console.error('Email processing error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getEmailStats(req, res) {
    try {
      const context = { ...req.context, agentType: 'email' };
      
      const result = await AgentService.processRequest({
        systemPrompt: context.prompts?.agents?.email?.systemPrompt,
        conversationHistory: [{
          role: 'user',
          content: 'Give me email statistics for today - how many emails by category and priority?'
        }],
        consumer: 'Email System',
        context
      });
      
      res.json({
        success: true,
        stats: result.response
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

export default new EmailAgentController();
```

#### Database Schema
```sql
CREATE DATABASE email_assistant;
USE email_assistant;

CREATE TABLE emails (
  id INT PRIMARY KEY AUTO_INCREMENT,
  subject VARCHAR(255) NOT NULL,
  sender_email VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  priority VARCHAR(20) NOT NULL,
  response_draft TEXT,
  processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(sender_email),
  INDEX(category),
  INDEX(priority)
);
```

### Testing

```bash
# Process an email
curl -X POST http://localhost:3000/api/email/process \
  -H "X-Context: emailassistant" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Urgent: Need help with login issues",
    "sender": "customer@example.com",
    "body": "Hi, I cannot log into my account and need immediate assistance. This is blocking my work."
  }'

# Get email statistics
curl -X GET http://localhost:3000/api/email/stats \
  -H "X-Context: emailassistant"
```

---

## 2. 🛒 Inventory Monitor Agent

**Purpose**: Monitor product inventory levels and automatically trigger restock workflows.

### Setup

#### Context Configuration
```json
// /backend/configs/contexts/inventorymonitor.json
{
  "company": {
    "name": "Inventory Monitor Inc",
    "industry": "Retail Technology"
  },
  "prompts": {
    "agents": {
      "inventory": {
        "systemPrompt": "You are an inventory management AI. Monitor stock levels, predict demand, and manage restock workflows. Be proactive about preventing stockouts.",
        "temperature": 0.3,
        "tools": ["check_stock_levels", "predict_demand", "create_restock_order", "notify_supplier"]
      }
    }
  },
  "dataSources": {
    "databases": {
      "inventory": {
        "type": "mysql",
        "connection": "inventory_db",
        "host": "localhost", 
        "database": "inventory_monitor",
        "credentials": "INVENTORY_DB"
      }
    }
  },
  "agentMappings": {
    "inventory": {
      "dataSources": ["inventory"],
      "permissions": {
        "inventory": ["read", "write"]
      },
      "mcpServer": "inventory-monitor"
    }
  }
}
```

#### MCP Server
```javascript
// /src/mcp/servers/InventoryMonitorServer.js
import { MCPServer } from '@modelcontextprotocol/sdk';
import DataSourceService from '../../services/DataSourceService.js';

class InventoryMonitorServer extends MCPServer {
  constructor(context) {
    super({
      name: 'inventory-monitor',
      version: '1.0.0'
    });
    
    this.context = context;
    this.agentType = null;
    this.registerTools();
  }

  registerTools() {
    // Check current stock levels
    this.addTool({
      name: 'check_stock_levels',
      description: 'Check current inventory levels for all products',
      parameters: {
        low_stock_threshold: { type: 'number', default: 10 },
        category: { type: 'string', description: 'Filter by product category' }
      }
    }, async (params) => {
      let query = `
        SELECT 
          p.id, p.name, p.sku, p.category,
          i.current_stock, i.min_stock, i.max_stock,
          (i.current_stock <= i.min_stock) as is_low_stock,
          (i.current_stock = 0) as is_out_of_stock
        FROM products p
        JOIN inventory i ON p.id = i.product_id
        WHERE i.current_stock <= ?
      `;
      
      const params_array = [params.low_stock_threshold];
      
      if (params.category) {
        query += ' AND p.category = ?';
        params_array.push(params.category);
      }
      
      query += ' ORDER BY i.current_stock ASC';
      
      const results = await DataSourceService.executeQuery(
        this.context,
        this.agentType,
        'inventory',
        query,
        'read'
      );
      
      return {
        low_stock_items: results,
        total_items_checked: results.length,
        out_of_stock_count: results.filter(item => item.is_out_of_stock).length,
        low_stock_count: results.filter(item => item.is_low_stock).length
      };
    });

    // Get sales velocity for demand prediction
    this.addTool({
      name: 'get_sales_velocity',
      description: 'Get sales velocity for products over specified period',
      parameters: {
        product_ids: { type: 'array', items: { type: 'string' } },
        days: { type: 'number', default: 30 }
      }
    }, async (params) => {
      const productIds = params.product_ids.join(',');
      
      const query = `
        SELECT 
          product_id,
          SUM(quantity_sold) as total_sold,
          COUNT(DISTINCT DATE(sold_date)) as sales_days,
          AVG(quantity_sold) as avg_daily_sales,
          MAX(sold_date) as last_sale_date
        FROM sales_history 
        WHERE product_id IN (${productIds}) 
        AND sold_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY product_id
      `;
      
      const results = await DataSourceService.executeQuery(
        this.context,
        this.agentType,
        'inventory',
        query,
        'read'
      );
      
      return results.map(item => ({
        ...item,
        predicted_days_until_stockout: item.avg_daily_sales > 0 
          ? Math.ceil(item.current_stock / item.avg_daily_sales)
          : null
      }));
    });

    // Create restock recommendation
    this.addTool({
      name: 'create_restock_order',
      description: 'Create restock order recommendation',
      parameters: {
        product_id: { type: 'string', required: true },
        suggested_quantity: { type: 'number', required: true },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
        reason: { type: 'string', required: true }
      }
    }, async (params) => {
      const orderId = `RO-${Date.now()}-${params.product_id}`;
      
      await DataSourceService.executeQuery(
        this.context,
        this.agentType,
        'inventory',
        `INSERT INTO restock_orders 
         (order_id, product_id, suggested_quantity, priority, reason, status, created_at)
         VALUES (?, ?, ?, ?, ?, 'pending', NOW())`,
        'write'
      );
      
      // Update product status
      await DataSourceService.executeQuery(
        this.context,
        this.agentType,
        'inventory',
        'UPDATE inventory SET restock_pending = TRUE WHERE product_id = ?',
        'write'
      );
      
      return {
        order_id: orderId,
        product_id: params.product_id,
        quantity: params.suggested_quantity,
        priority: params.priority,
        status: 'pending'
      };
    });

    // Get supplier information
    this.addTool({
      name: 'get_supplier_info',
      description: 'Get supplier information for products',
      parameters: {
        product_id: { type: 'string', required: true }
      }
    }, async (params) => {
      const result = await DataSourceService.executeQuery(
        this.context,
        this.agentType,
        'inventory',
        `SELECT s.name, s.email, s.phone, s.lead_time_days, s.min_order_quantity
         FROM suppliers s
         JOIN products p ON s.id = p.supplier_id
         WHERE p.id = ?`,
        'read'
      );
      
      return result[0] || null;
    });
  }

  setAgentType(agentType) {
    this.agentType = agentType;
  }
}

export default InventoryMonitorServer;
```

#### Workflow
```yaml
# /workflows/customers/inventorymonitor/automated-restock-check.yml
name: automated-restock-check
description: Daily inventory check and automated restock workflow

inputs:
  low_stock_threshold:
    type: number
    default: 10

outputs:
  restock_orders_created: "{{steps.create_orders.output.orders_created}}"
  notifications_sent: "{{steps.send_notifications.output.success}}"

steps:
  - id: inventory_analysis
    type: agent
    config:
      agentType: inventory
      prompt: |
        Perform daily inventory analysis:
        1. Check all stock levels below threshold: {{inputs.low_stock_threshold}}
        2. Calculate sales velocity for low stock items
        3. Predict stockout dates
        4. Create restock recommendations for critical items
        
        Focus on items with less than 7 days of stock remaining.

  - id: create_orders
    type: mcp
    config:
      tool_name: create_restock_order
      agent_type: inventory
      parameters:
        product_id: "{{steps.inventory_analysis.output.critical_products[0].id}}"
        suggested_quantity: "{{steps.inventory_analysis.output.critical_products[0].recommended_quantity}}"
        priority: "high"
        reason: "Automated daily check - {{steps.inventory_analysis.output.critical_products[0].reasoning}}"

  - id: send_notifications
    type: email
    config:
      provider: smtp
      to: ["inventory@company.com", "purchasing@company.com"]
      subject: "Daily Inventory Alert - {{now}}"
      body: |
        <h2>Daily Inventory Report</h2>
        
        <h3>Critical Stock Alerts:</h3>
        {{steps.inventory_analysis.output.summary}}
        
        <h3>Restock Orders Created:</h3>
        {{steps.create_orders.output.order_summary}}
        
        <p>Please review and approve pending orders in the system.</p>
      bodyType: html

  - id: slack_alert
    type: slack
    config:
      operation: messages.send
      token: "{{env.SLACK_BOT_TOKEN}}"
      channel: "#inventory-alerts"
      text: |
        📦 Daily Inventory Check Complete
        
        • Low stock items: {{steps.inventory_analysis.output.low_stock_count}}
        • Out of stock: {{steps.inventory_analysis.output.out_of_stock_count}}
        • Restock orders created: {{steps.create_orders.output.orders_created}}
        
        Check email for detailed report.
```

#### Database Schema
```sql
CREATE DATABASE inventory_monitor;
USE inventory_monitor;

CREATE TABLE products (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) UNIQUE,
  category VARCHAR(100),
  supplier_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventory (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id VARCHAR(50),
  current_stock INT DEFAULT 0,
  min_stock INT DEFAULT 5,
  max_stock INT DEFAULT 100,
  restock_pending BOOLEAN DEFAULT FALSE,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE suppliers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  lead_time_days INT DEFAULT 7,
  min_order_quantity INT DEFAULT 1
);

CREATE TABLE restock_orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id VARCHAR(100) UNIQUE,
  product_id VARCHAR(50),
  suggested_quantity INT,
  priority VARCHAR(20),
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE sales_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id VARCHAR(50),
  quantity_sold INT,
  sold_date DATE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX(product_id, sold_date)
);

-- Sample data
INSERT INTO products VALUES 
('PROD001', 'Widget A', 'WID001', 'Electronics', 1),
('PROD002', 'Gadget B', 'GAD002', 'Electronics', 1),
('PROD003', 'Tool C', 'TOL003', 'Tools', 2);

INSERT INTO suppliers VALUES 
(1, 'TechSupplier Inc', 'orders@techsupplier.com', '555-0123', 5, 50),
(2, 'ToolCorp', 'sales@toolcorp.com', '555-0456', 7, 25);

INSERT INTO inventory VALUES 
(1, 'PROD001', 8, 10, 100, FALSE),  -- Low stock
(2, 'PROD002', 0, 5, 50, FALSE),   -- Out of stock  
(3, 'PROD003', 25, 15, 200, FALSE); -- Normal stock
```

### Testing

```bash
# Check inventory levels
curl -X POST http://localhost:3000/api/inventory/chat \
  -H "X-Context: inventorymonitor" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Check current stock levels and create restock orders for any critical items"
  }'

# Execute automated restock workflow
curl -X POST http://localhost:3000/api/workflows/load \
  -H "X-Context: inventorymonitor" \
  -d '{"filePath": "customers/inventorymonitor/automated-restock-check.yml"}'

curl -X POST http://localhost:3000/api/workflows/execute/automated-restock-check \
  -H "X-Context: inventorymonitor" \
  -d '{"inputs": {"low_stock_threshold": 15}}'
```

---

## 3. 📅 Meeting Scheduler Agent

**Purpose**: Automatically schedule, manage, and coordinate meetings.

### Setup

#### Context Configuration
```json
// /backend/configs/contexts/meetingscheduler.json
{
  "company": {
    "name": "Meeting Scheduler Pro",
    "industry": "Productivity Software"
  },
  "prompts": {
    "agents": {
      "scheduler": {
        "systemPrompt": "You are a professional meeting scheduler AI. Help users find optimal meeting times, check availability, send invitations, and manage calendar conflicts. Always confirm details before scheduling.",
        "temperature": 0.4,
        "tools": ["check_availability", "create_meeting", "send_invitation", "find_conflicts", "suggest_times"]
      }
    }
  },
  "dataSources": {
    "databases": {
      "calendar": {
        "type": "mysql",
        "connection": "calendar_db", 
        "host": "localhost",
        "database": "meeting_scheduler",
        "credentials": "CALENDAR_DB"
      }
    }
  },
  "agentMappings": {
    "scheduler": {
      "dataSources": ["calendar"],
      "permissions": {
        "calendar": ["read", "write"]
      },
      "mcpServer": "meeting-scheduler"
    }
  }
}
```

#### MCP Server
```javascript
// /src/mcp/servers/MeetingSchedulerServer.js
import { MCPServer } from '@modelcontextprotocol/sdk';
import DataSourceService from '../../services/DataSourceService.js';

class MeetingSchedulerServer extends MCPServer {
  constructor(context) {
    super({
      name: 'meeting-scheduler',
      version: '1.0.0'
    });
    
    this.context = context;
    this.agentType = null;
    this.registerTools();
  }

  registerTools() {
    // Check availability for users
    this.addTool({
      name: 'check_availability',
      description: 'Check availability for multiple users in a date/time range',
      parameters: {
        user_emails: { type: 'array', items: { type: 'string' }, required: true },
        start_date: { type: 'string', required: true, description: 'YYYY-MM-DD format' },
        end_date: { type: 'string', required: true },
        start_time: { type: 'string', default: '09:00', description: 'HH:MM format' },
        end_time: { type: 'string', default: '17:00' },
        duration_minutes: { type: 'number', required: true }
      }
    }, async (params) => {
      const userEmails = params.user_emails.map(email => `'${email}'`).join(',');
      
      // Get existing meetings in the time range
      const conflicts = await DataSourceService.executeQuery(
        this.context,
        this.agentType,
        'calendar',
        `SELECT attendee_email, meeting_date, start_time, end_time, title
         FROM meetings m
         JOIN meeting_attendees ma ON m.id = ma.meeting_id
         WHERE ma.attendee_email IN (${userEmails})
         AND meeting_date BETWEEN ? AND ?
         ORDER BY meeting_date, start_time`,
        'read'
      );
      
      // Find free time slots
      const freeSlots = this.findFreeTimeSlots(
        conflicts,
        params.start_date,
        params.end_date,
        params.start_time,
        params.end_time,
        params.duration_minutes,
        params.user_emails
      );
      
      return {
        user_emails: params.user_emails,
        date_range: `${params.start_date} to ${params.end_date}`,
        conflicts: conflicts,
        free_slots: freeSlots,
        recommended_times: freeSlots.slice(0, 5) // Top 5 recommendations
      };
    });

    // Create a meeting
    this.addTool({
      name: 'create_meeting',
      description: 'Create a new meeting with attendees',
      parameters: {
        title: { type: 'string', required: true },
        description: { type: 'string' },
        organizer_email: { type: 'string', required: true },
        attendee_emails: { type: 'array', items: { type: 'string' }, required: true },
        meeting_date: { type: 'string', required: true },
        start_time: { type: 'string', required: true },
        duration_minutes: { type: 'number', required: true },
        location: { type: 'string' },
        meeting_type: { type: 'string', enum: ['in-person', 'video', 'phone'], default: 'video' }
      }
    }, async (params) => {
      // Calculate end time
      const startTime = new Date(`${params.meeting_date}T${params.start_time}:00`);
      const endTime = new Date(startTime.getTime() + params.duration_minutes * 60000);
      const endTimeStr = endTime.toTimeString().substr(0, 5);
      
      // Create meeting
      const meetingId = `MTG-${Date.now()}`;
      
      await DataSourceService.executeQuery(
        this.context,
        this.agentType,
        'calendar',
        `INSERT INTO meetings 
         (meeting_id, title, description, organizer_email, meeting_date, start_time, end_time, location, meeting_type, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        'write'
      );
      
      // Add attendees
      for (const email of params.attendee_emails) {
        await DataSourceService.executeQuery(
          this.context,
          this.agentType,
          'calendar',
          `INSERT INTO meeting_attendees (meeting_id, attendee_email, status)
           VALUES (?, ?, 'pending')`,
          'write'
        );
      }
      
      return {
        meeting_id: meetingId,
        title: params.title,
        date_time: `${params.meeting_date} ${params.start_time}-${endTimeStr}`,
        attendees: params.attendee_emails,
        location: params.location,
        status: 'created'
      };
    });

    // Find meeting conflicts
    this.addTool({
      name: 'find_conflicts',
      description: 'Find scheduling conflicts for a proposed meeting time',
      parameters: {
        user_emails: { type: 'array', items: { type: 'string' }, required: true },
        proposed_date: { type: 'string', required: true },
        proposed_start_time: { type: 'string', required: true },
        duration_minutes: { type: 'number', required: true }
      }
    }, async (params) => {
      const startTime = new Date(`${params.proposed_date}T${params.proposed_start_time}:00`);
      const endTime = new Date(startTime.getTime() + params.duration_minutes * 60000);
      const endTimeStr = endTime.toTimeString().substr(0, 5);
      
      const userEmails = params.user_emails.map(email => `'${email}'`).join(',');
      
      const conflicts = await DataSourceService.executeQuery(
        this.context,
        this.agentType,
        'calendar',
        `SELECT m.title, m.meeting_date, m.start_time, m.end_time, ma.attendee_email
         FROM meetings m
         JOIN meeting_attendees ma ON m.id = ma.meeting_id
         WHERE ma.attendee_email IN (${userEmails})
         AND m.meeting_date = ?
         AND NOT (m.end_time <= ? OR m.start_time >= ?)`,
        'read'
      );
      
      return {
        proposed_time: `${params.proposed_date} ${params.proposed_start_time}-${endTimeStr}`,
        conflicts: conflicts,
        has_conflicts: conflicts.length > 0,
        conflicted_attendees: [...new Set(conflicts.map(c => c.attendee_email))]
      };
    });

    // Get user's calendar for a date range
    this.addTool({
      name: 'get_calendar',
      description: 'Get calendar events for a user in date range',
      parameters: {
        user_email: { type: 'string', required: true },
        start_date: { type: 'string', required: true },
        end_date: { type: 'string', required: true }
      }
    }, async (params) => {
      const events = await DataSourceService.executeQuery(
        this.context,
        this.agentType,
        'calendar',
        `SELECT m.meeting_id, m.title, m.meeting_date, m.start_time, m.end_time, m.location, m.meeting_type
         FROM meetings m
         JOIN meeting_attendees ma ON m.id = ma.meeting_id
         WHERE ma.attendee_email = ?
         AND m.meeting_date BETWEEN ? AND ?
         ORDER BY m.meeting_date, m.start_time`,
        'read'
      );
      
      return {
        user_email: params.user_email,
        date_range: `${params.start_date} to ${params.end_date}`,
        events: events,
        total_meetings: events.length
      };
    });
  }

  findFreeTimeSlots(conflicts, startDate, endDate, startTime, endTime, duration, userEmails) {
    const slots = [];
    const currentDate = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    while (currentDate <= endDateObj) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Skip weekends (optional)
      if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }
      
      const dayConflicts = conflicts.filter(c => c.meeting_date === dateStr);
      const freeSlots = this.findFreeSlotsInDay(dayConflicts, startTime, endTime, duration);
      
      freeSlots.forEach(slot => {
        slots.push({
          date: dateStr,
          start_time: slot.start,
          end_time: slot.end,
          duration_minutes: duration,
          available_for_all: true // Simplified - assume all users are free if no conflicts
        });
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return slots;
  }

  findFreeSlotsInDay(dayConflicts, startTime, endTime, duration) {
    // Sort conflicts by start time
    dayConflicts.sort((a, b) => a.start_time.localeCompare(b.start_time));
    
    const slots = [];
    let currentTime = startTime;
    
    for (const conflict of dayConflicts) {
      // Check if there's a free slot before this conflict
      if (this.getMinutesFromTime(conflict.start_time) - this.getMinutesFromTime(currentTime) >= duration) {
        slots.push({
          start: currentTime,
          end: conflict.start_time
        });
      }
      currentTime = conflict.end_time > currentTime ? conflict.end_time : currentTime;
    }
    
    // Check for slot after last conflict
    if (this.getMinutesFromTime(endTime) - this.getMinutesFromTime(currentTime) >= duration) {
      slots.push({
        start: currentTime,
        end: endTime
      });
    }
    
    return slots;
  }

  getMinutesFromTime(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  setAgentType(agentType) {
    this.agentType = agentType;
  }
}

export default MeetingSchedulerServer;
```

#### Database Schema
```sql
CREATE DATABASE meeting_scheduler;
USE meeting_scheduler;

CREATE TABLE meetings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  meeting_id VARCHAR(50) UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  organizer_email VARCHAR(255) NOT NULL,
  meeting_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location VARCHAR(255),
  meeting_type VARCHAR(20) DEFAULT 'video',
  status VARCHAR(20) DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(meeting_date),
  INDEX(organizer_email)
);

CREATE TABLE meeting_attendees (
  id INT PRIMARY KEY AUTO_INCREMENT,
  meeting_id VARCHAR(50),
  attendee_email VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, declined
  FOREIGN KEY (meeting_id) REFERENCES meetings(meeting_id),
  INDEX(attendee_email)
);

-- Sample data
INSERT INTO meetings VALUES 
(1, 'MTG-001', 'Team Standup', 'Daily team standup', 'manager@company.com', '2024-01-15', '09:00:00', '09:30:00', 'Conference Room A', 'in-person', 'scheduled', NOW()),
(2, 'MTG-002', 'Project Review', 'Quarterly project review', 'pm@company.com', '2024-01-15', '14:00:00', '15:30:00', 'Zoom', 'video', 'scheduled', NOW());

INSERT INTO meeting_attendees VALUES 
(1, 'MTG-001', 'dev1@company.com', 'accepted'),
(2, 'MTG-001', 'dev2@company.com', 'accepted'),
(3, 'MTG-002', 'dev1@company.com', 'pending'),
(4, 'MTG-002', 'manager@company.com', 'accepted');
```

### Testing

```bash
# Check availability
curl -X POST http://localhost:3000/api/scheduler/chat \
  -H "X-Context: meetingscheduler" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Find available time slots for john@company.com and jane@company.com tomorrow between 9 AM and 5 PM for a 60-minute meeting"
  }'

# Schedule a meeting
curl -X POST http://localhost:3000/api/scheduler/chat \
  -H "X-Context: meetingscheduler" \
  -d '{
    "message": "Schedule a project kickoff meeting for tomorrow at 2 PM with john@company.com, jane@company.com, and bob@company.com. Duration: 90 minutes. Location: Conference Room B"
  }'
```

---

## 4. 📊 Expense Tracker Agent

**Purpose**: Track, categorize, and analyze business expenses automatically.

### Setup

#### Context Configuration
```json
// /backend/configs/contexts/expensetracker.json
{
  "company": {
    "name": "Expense Tracker Pro",
    "industry": "Financial Technology"
  },
  "prompts": {
    "agents": {
      "expense": {
        "systemPrompt": "You are a smart expense tracking AI. Help users categorize expenses, flag unusual transactions, generate reports, and ensure policy compliance. Be thorough in your analysis.",
        "temperature": 0.3,
        "tools": ["categorize_expense", "check_policy_compliance", "flag_duplicate", "calculate_totals", "generate_report"]
      }
    }
  },
  "dataSources": {
    "databases": {
      "expenses": {
        "type": "mysql",
        "connection": "expense_db",
        "host": "localhost",
        "database": "expense_tracker", 
        "credentials": "EXPENSE_DB"
      }
    }
  },
  "agentMappings": {
    "expense": {
      "dataSources": ["expenses"],
      "permissions": {
        "expenses": ["read", "write"]
      },
      "mcpServer": "expense-tracker"
    }
  }
}
```

#### MCP Server
```javascript
// /src/mcp/servers/ExpenseTrackerServer.js
import { MCPServer } from '@modelcontextprotocol/sdk';
import DataSourceService from '../../services/DataSourceService.js';

class ExpenseTrackerServer extends MCPServer {
  constructor(context) {
    super({
      name: 'expense-tracker',
      version: '1.0.0'
    });
    
    this.context = context;
    this.agentType = null;
    this.registerTools();
  }

  registerTools() {
    // Categorize expense automatically
    this.addTool({
      name: 'categorize_expense',
      description: 'Automatically categorize an expense based on description and merchant',
      parameters: {
        description: { type: 'string', required: true },
        merchant: { type: 'string', required: true },
        amount: { type: 'number', required: true }
      }
    }, async (params) => {
      const description = params.description.toLowerCase();
      const merchant = params.merchant.toLowerCase();
      
      let category = 'Other';
      let subcategory = null;
      let confidence = 0.5;
      
      // Travel expenses
      if (merchant.includes('uber') || merchant.includes('lyft') || merchant.includes('taxi')) {
        category = 'Travel';
        subcategory = 'Transportation';
        confidence = 0.95;
      }
      else if (merchant.includes('hotel') || merchant.includes('marriott') || merchant.includes('hilton')) {
        category = 'Travel';
        subcategory = 'Lodging';
        confidence = 0.9;
      }
      else if (merchant.includes('airline') || merchant.includes('delta') || merchant.includes('united')) {
        category = 'Travel';
        subcategory = 'Airfare';
        confidence = 0.95;
      }
      // Meals
      else if (merchant.includes('restaurant') || merchant.includes('cafe') || merchant.includes('pizza')) {
        category = 'Meals';
        subcategory = 'Business Meals';
        confidence = 0.8;
      }
      else if (merchant.includes('starbucks') || merchant.includes('coffee')) {
        category = 'Meals';
        subcategory = 'Coffee/Beverages';
        confidence = 0.9;
      }
      // Office supplies
      else if (merchant.includes('staples') || merchant.includes('office depot') || description.includes('supplies')) {
        category = 'Office Supplies';
        subcategory = 'General Supplies';
        confidence = 0.85;
      }
      // Software/Tech
      else if (merchant.includes('aws') || merchant.includes('microsoft') || merchant.includes('adobe')) {
        category = 'Software';
        subcategory = 'SaaS/Cloud';
        confidence = 0.9;
      }
      
      // Check for policy violations
      const policyFlags = this.checkPolicyFlags(category, params.amount, merchant);
      
      return {
        category,
        subcategory,
        confidence,
        policy_flags: policyFlags,
        suggested_tags: this.generateTags(description, merchant, category)
      };
    });

    // Save expense to database
    this.addTool({
      name: 'save_expense',
      description: 'Save an expense record to the database',
      parameters: {
        user_email: { type: 'string', required: true },
        description: { type: 'string', required: true },
        merchant: { type: 'string', required: true },
        amount: { type: 'number', required: true },
        expense_date: { type: 'string', required: true },
        category: { type: 'string', required: true },
        subcategory: { type: 'string' },
        payment_method: { type: 'string' },
        receipt_url: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } }
      }
    }, async (params) => {
      const expenseId = `EXP-${Date.now()}`;
      const tagsStr = params.tags ? params.tags.join(',') : '';
      
      await DataSourceService.executeQuery(
        this.context,
        this.agentType,
        'expenses',
        `INSERT INTO expenses 
         (expense_id, user_email, description, merchant, amount, expense_date, category, subcategory, payment_method, receipt_url, tags, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
        'write'
      );
      
      return {
        expense_id: expenseId,
        status: 'saved',
        amount: params.amount,
        category: params.category
      };
    });

    // Check for duplicate expenses
    this.addTool({
      name: 'check_duplicates',
      description: 'Check for potential duplicate expenses',
      parameters: {
        user_email: { type: 'string', required: true },
        merchant: { type: 'string', required: true },
        amount: { type: 'number', required: true },
        expense_date: { type: 'string', required: true },
        days_window: { type: 'number', default: 3 }
      }
    }, async (params) => {
      const duplicates = await DataSourceService.executeQuery(
        this.context,
        this.agentType,
        'expenses',
        `SELECT expense_id, description, merchant, amount, expense_date
         FROM expenses
         WHERE user_email = ?
         AND merchant = ?
         AND ABS(amount - ?) < 0.01
         AND ABS(DATEDIFF(expense_date, ?)) <= ?
         AND status != 'deleted'`,
        'read'
      );
      
      return {
        potential_duplicates: duplicates,
        is_duplicate: duplicates.length > 0,
        confidence: duplicates.length > 0 ? 0.8 : 0.1
      };
    });

    // Get expense summary for user
    this.addTool({
      name: 'get_expense_summary',
      description: 'Get expense summary for a user in a date range',
      parameters: {
        user_email: { type: 'string', required: true },
        start_date: { type: 'string', required: true },
        end_date: { type: 'string', required: true },
        group_by: { type: 'string', enum: ['category', 'month', 'merchant'], default: 'category' }
      }
    }, async (params) => {
      let query;
      
      if (params.group_by === 'category') {
        query = `
          SELECT category, subcategory, COUNT(*) as count, SUM(amount) as total
          FROM expenses
          WHERE user_email = ? AND expense_date BETWEEN ? AND ?
          GROUP BY category, subcategory
          ORDER BY total DESC
        `;
      } else if (params.group_by === 'month') {
        query = `
          SELECT DATE_FORMAT(expense_date, '%Y-%m') as month, COUNT(*) as count, SUM(amount) as total
          FROM expenses  
          WHERE user_email = ? AND expense_date BETWEEN ? AND ?
          GROUP BY DATE_FORMAT(expense_date, '%Y-%m')
          ORDER BY month DESC
        `;
      } else {
        query = `
          SELECT merchant, COUNT(*) as count, SUM(amount) as total
          FROM expenses
          WHERE user_email = ? AND expense_date BETWEEN ? AND ?
          GROUP BY merchant
          ORDER BY total DESC
          LIMIT 10
        `;
      }
      
      const results = await DataSourceService.executeQuery(
        this.context,
        this.agentType,
        'expenses',
        query,
        'read'
      );
      
      const totalAmount = results.reduce((sum, item) => sum + parseFloat(item.total), 0);
      const totalCount = results.reduce((sum, item) => sum + item.count, 0);
      
      return {
        user_email: params.user_email,
        date_range: `${params.start_date} to ${params.end_date}`,
        group_by: params.group_by,
        summary: results,
        totals: {
          amount: totalAmount,
          count: totalCount,
          average: totalCount > 0 ? totalAmount / totalCount : 0
        }
      };
    });

    // Flag policy violations
    this.addTool({
      name: 'check_policy_compliance',
      description: 'Check if expense complies with company policy',
      parameters: {
        category: { type: 'string', required: true },
        amount: { type: 'number', required: true },
        description: { type: 'string', required: true },
        receipt_provided: { type: 'boolean', default: false }
      }
    }, async (params) => {
      const violations = [];
      const warnings = [];
      
      // Amount limits
      const limits = {
        'Meals': { single: 50, daily: 150 },
        'Travel': { single: 500, daily: 1000 },
        'Office Supplies': { single: 200, monthly: 500 }
      };
      
      if (limits[params.category] && params.amount > limits[params.category].single) {
        violations.push(`Amount $${params.amount} exceeds single expense limit of $${limits[params.category].single} for ${params.category}`);
      }
      
      // Receipt requirements
      if (params.amount > 25 && !params.receipt_provided) {
        violations.push('Receipt required for expenses over $25');
      }
      
      // Description requirements
      if (params.description.length < 10) {
        warnings.push('Expense description should be more detailed');
      }
      
      return {
        compliant: violations.length === 0,
        violations,
        warnings,
        risk_level: violations.length > 0 ? 'high' : warnings.length > 0 ? 'medium' : 'low'
      };
    });
  }

  checkPolicyFlags(category, amount, merchant) {
    const flags = [];
    
    if (amount > 1000) {
      flags.push('high_amount');
    }
    
    if (merchant.includes('bar') || merchant.includes('liquor')) {
      flags.push('alcohol');
    }
    
    return flags;
  }

  generateTags(description, merchant, category) {
    const tags = [];
    
    if (description.includes('client')) tags.push('client');
    if (description.includes('conference')) tags.push('conference');
    if (description.includes('training')) tags.push('training');
    if (merchant.includes('uber') || merchant.includes('lyft')) tags.push('rideshare');
    
    return tags;
  }

  setAgentType(agentType) {
    this.agentType = agentType;
  }
}

export default ExpenseTrackerServer;
```

#### Database Schema
```sql
CREATE DATABASE expense_tracker;
USE expense_tracker;

CREATE TABLE expenses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  expense_id VARCHAR(50) UNIQUE,
  user_email VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  merchant VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  expense_date DATE NOT NULL,
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  payment_method VARCHAR(50),
  receipt_url VARCHAR(500),
  tags TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(user_email, expense_date),
  INDEX(category),
  INDEX(merchant)
);

-- Sample data
INSERT INTO expenses VALUES 
(1, 'EXP-001', 'john@company.com', 'Client dinner at restaurant', 'The Steakhouse', 125.50, '2024-01-10', 'Meals', 'Business Meals', 'Credit Card', NULL, 'client', 'approved', NOW()),
(2, 'EXP-002', 'jane@company.com', 'Uber ride to client office', 'Uber Technologies', 23.75, '2024-01-10', 'Travel', 'Transportation', 'Credit Card', NULL, 'rideshare,client', 'approved', NOW());
```

### Testing

```bash
# Process an expense
curl -X POST http://localhost:3000/api/expense/chat \
  -H "X-Context: expensetracker" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Process this expense: $45.50 spent at Starbucks on 2024-01-15 for coffee with client. User: john@company.com"
  }'

# Get expense report
curl -X POST http://localhost:3000/api/expense/chat \
  -H "X-Context: expensetracker" \
  -d '{
    "message": "Generate expense summary for john@company.com from January 1 to January 31, 2024, grouped by category"
  }'
```

---

## 5. 🎫 Support Ticket Agent

**Purpose**: Automatically triage, categorize, and route support tickets based on content and priority.

### Setup

#### Context Configuration
```json
// /backend/configs/contexts/supportticket.json
{
  "company": {
    "name": "Support Ticket Pro",
    "industry": "Customer Support Technology"
  },
  "prompts": {
    "agents": {
      "support": {
        "systemPrompt": "You are an intelligent support ticket agent. Help triage incoming tickets, categorize by urgency and type, route to appropriate teams, and suggest initial responses. Always prioritize customer satisfaction.",
        "temperature": 0.4,
        "tools": ["categorize_ticket", "route_ticket", "suggest_response", "escalate_ticket", "search_knowledge_base"]
      }
    }
  },
  "dataSources": {
    "databases": {
      "support": {
        "type": "mysql",
        "connection": "support_db",
        "host": "localhost",
        "database": "support_tickets",
        "credentials": "SUPPORT_DB"
      }
    }
  },
  "agentMappings": {
    "support": {
      "dataSources": ["support"],
      "permissions": {
        "support": ["read", "write"]
      },
      "mcpServer": "support-ticket"
    }
  }
}
```

#### MCP Server
```javascript
// /src/mcp/servers/SupportTicketServer.js
import { MCPServer } from '@modelcontextprotocol/sdk';
import DataSourceService from '../../services/DataSourceService.js';

class SupportTicketServer extends MCPServer {
  constructor(context) {
    super({
      name: 'support-ticket',
      version: '1.0.0'
    });
    
    this.context = context;
    this.agentType = null;
    this.registerTools();
  }

  registerTools() {
    // Categorize and prioritize ticket
    this.addTool({
      name: 'categorize_ticket',
      description: 'Categorize ticket by type, priority, and complexity',
      parameters: {
        subject: { type: 'string', required: true },
        description: { type: 'string', required: true },
        customer_email: { type: 'string', required: true },
        customer_plan: { type: 'string', default: 'basic' }
      }
    }, async (params) => {
      const subject = params.subject.toLowerCase();
      const description = params.description.toLowerCase();
      
      let category = 'General';
      let priority = 'medium';
      let complexity = 'simple';
      let estimated_resolution_hours = 24;
      
      // Technical issues
      if (subject.includes('api') || subject.includes('integration') || description.includes('error')) {
        category = 'Technical';
        complexity = 'complex';
        estimated_resolution_hours = 48;
      }
      
      // Billing issues
      if (subject.includes('billing') || subject.includes('payment') || subject.includes('invoice')) {
        category = 'Billing';
        priority = 'high';
        estimated_resolution_hours = 12;
      }
      
      // Account issues
      if (subject.includes('login') || subject.includes('password') || subject.includes('account')) {
        category = 'Account';
        priority = 'high';
        estimated_resolution_hours = 4;
      }
      
      // Feature requests
      if (subject.includes('feature') || subject.includes('enhancement') || description.includes('suggestion')) {
        category = 'Feature Request';
        priority = 'low';
        complexity = 'simple';
        estimated_resolution_hours = 168; // 1 week
      }
      
      // Urgency indicators
      if (subject.includes('urgent') || subject.includes('critical') || description.includes('down')) {
        priority = 'critical';
        estimated_resolution_hours = Math.floor(estimated_resolution_hours / 4);
      }
      
      // Premium customer prioritization
      if (params.customer_plan === 'enterprise' || params.customer_plan === 'premium') {
        if (priority === 'medium') priority = 'high';
        estimated_resolution_hours = Math.floor(estimated_resolution_hours / 2);
      }
      
      return {
        category,
        priority,
        complexity,
        estimated_resolution_hours,
        suggested_team: this.getRecommendedTeam(category, complexity),
        urgency_score: this.calculateUrgencyScore(priority, params.customer_plan)
      };
    });

    // Route ticket to appropriate team
    this.addTool({
      name: 'route_ticket',
      description: 'Route ticket to the appropriate support team',
      parameters: {
        ticket_id: { type: 'string', required: true },
        category: { type: 'string', required: true },
        priority: { type: 'string', required: true },
        complexity: { type: 'string', required: true }
      }
    }, async (params) => {
      const team = this.getRecommendedTeam(params.category, params.complexity);
      
      await DataSourceService.executeQuery(
        this.context,
        this.agentType,
        'support',
        'UPDATE tickets SET assigned_team = ?, routing_timestamp = NOW() WHERE ticket_id = ?',
        'write'
      );
      
      return {
        ticket_id: params.ticket_id,
        routed_to: team,
        routing_reason: `Category: ${params.category}, Priority: ${params.priority}, Complexity: ${params.complexity}`
      };
    });

    // Create ticket
    this.addTool({
      name: 'create_ticket',
      description: 'Create a new support ticket',
      parameters: {
        customer_email: { type: 'string', required: true },
        subject: { type: 'string', required: true },
        description: { type: 'string', required: true },
        category: { type: 'string', required: true },
        priority: { type: 'string', required: true },
        complexity: { type: 'string', required: true },
        customer_plan: { type: 'string', default: 'basic' }
      }
    }, async (params) => {
      const ticketId = `TKT-${Date.now()}`;
      const team = this.getRecommendedTeam(params.category, params.complexity);
      
      await DataSourceService.executeQuery(
        this.context,
        this.agentType,
        'support',
        `INSERT INTO tickets 
         (ticket_id, customer_email, subject, description, category, priority, complexity, status, assigned_team, customer_plan, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?, ?, NOW())`,
        'write'
      );
      
      return {
        ticket_id: ticketId,
        status: 'created',
        assigned_team: team,
        category: params.category,
        priority: params.priority
      };
    });

    // Search knowledge base for similar issues
    this.addTool({
      name: 'search_knowledge_base',
      description: 'Search knowledge base for similar issues and solutions',
      parameters: {
        query: { type: 'string', required: true },
        category: { type: 'string' },
        limit: { type: 'number', default: 5 }
      }
    }, async (params) => {
      let query = `
        SELECT kb.id, kb.title, kb.solution, kb.category, kb.votes
        FROM knowledge_base kb
        WHERE (kb.title LIKE ? OR kb.keywords LIKE ? OR kb.solution LIKE ?)
      `;
      
      const searchTerm = `%${params.query}%`;
      const queryParams = [searchTerm, searchTerm, searchTerm];
      
      if (params.category) {
        query += ' AND kb.category = ?';
        queryParams.push(params.category);
      }
      
      query += ' ORDER BY kb.votes DESC LIMIT ?';
      queryParams.push(params.limit);
      
      const results = await DataSourceService.executeQuery(
        this.context,
        this.agentType,
        'support',
        query,
        'read'
      );
      
      return {
        query: params.query,
        results: results,
        count: results.length,
        has_solutions: results.length > 0
      };
    });

    // Get ticket statistics
    this.addTool({
      name: 'get_ticket_stats',
      description: 'Get ticket statistics for dashboard',
      parameters: {
        time_period: { type: 'string', enum: ['today', 'week', 'month'], default: 'today' },
        team: { type: 'string' }
      }
    }, async (params) => {
      let dateFilter = 'DATE(created_at) = CURDATE()';
      if (params.time_period === 'week') {
        dateFilter = 'created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
      } else if (params.time_period === 'month') {
        dateFilter = 'created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
      }
      
      let teamFilter = '';
      if (params.team) {
        teamFilter = `AND assigned_team = '${params.team}'`;
      }
      
      const stats = await DataSourceService.executeQuery(
        this.context,
        this.agentType,
        'support',
        `SELECT 
           COUNT(*) as total_tickets,
           SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_tickets,
           SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_tickets,
           SUM(CASE WHEN priority = 'critical' THEN 1 ELSE 0 END) as critical_tickets,
           AVG(CASE WHEN status = 'closed' THEN 
             TIMESTAMPDIFF(HOUR, created_at, resolved_at) ELSE NULL END) as avg_resolution_hours
         FROM tickets 
         WHERE ${dateFilter} ${teamFilter}`,
        'read'
      );
      
      const categoryBreakdown = await DataSourceService.executeQuery(
        this.context,
        this.agentType,
        'support',
        `SELECT category, COUNT(*) as count
         FROM tickets 
         WHERE ${dateFilter} ${teamFilter}
         GROUP BY category
         ORDER BY count DESC`,
        'read'
      );
      
      return {
        time_period: params.time_period,
        team: params.team,
        overview: stats[0],
        category_breakdown: categoryBreakdown
      };
    });
  }

  getRecommendedTeam(category, complexity) {
    const teamRouting = {
      'Technical': complexity === 'complex' ? 'Engineering' : 'L2 Technical',
      'Billing': 'Finance',
      'Account': 'Customer Success',
      'Feature Request': 'Product Team',
      'General': 'L1 Support'
    };
    
    return teamRouting[category] || 'L1 Support';
  }

  calculateUrgencyScore(priority, customerPlan) {
    const priorityScores = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
    const planMultipliers = { 'basic': 1, 'premium': 1.5, 'enterprise': 2 };
    
    return priorityScores[priority] * planMultipliers[customerPlan];
  }

  setAgentType(agentType) {
    this.agentType = agentType;
  }
}

export default SupportTicketServer;
```

#### Database Schema
```sql
CREATE DATABASE support_tickets;
USE support_tickets;

CREATE TABLE tickets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ticket_id VARCHAR(50) UNIQUE,
  customer_email VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  priority VARCHAR(20) NOT NULL,
  complexity VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'open',
  assigned_team VARCHAR(100),
  assigned_agent VARCHAR(255),
  customer_plan VARCHAR(50) DEFAULT 'basic',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  routing_timestamp TIMESTAMP NULL,
  resolved_at TIMESTAMP NULL,
  INDEX(customer_email),
  INDEX(category),
  INDEX(priority),
  INDEX(status),
  INDEX(assigned_team)
);

CREATE TABLE knowledge_base (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  keywords TEXT,
  solution TEXT NOT NULL,
  votes INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(category)
);

-- Sample knowledge base entries
INSERT INTO knowledge_base VALUES 
(1, 'Login Issues - Password Reset', 'Account', 'login,password,reset,forgot', 'To reset your password: 1) Go to login page 2) Click "Forgot Password" 3) Enter email 4) Check email for reset link', 15, NOW()),
(2, 'API Rate Limiting Errors', 'Technical', 'api,rate,limit,429,error', 'Rate limits apply: Basic plan 100/hour, Premium 1000/hour, Enterprise 10000/hour. Implement exponential backoff in your code.', 23, NOW()),
(3, 'Billing Invoice Questions', 'Billing', 'invoice,bill,payment,charge', 'Invoices are sent monthly on the same date you subscribed. Download from Account > Billing. Contact billing@company.com for questions.', 8, NOW());

-- Sample tickets
INSERT INTO tickets VALUES 
(1, 'TKT-001', 'customer1@company.com', 'Cannot login to account', 'I forgot my password and the reset email is not coming through', 'Account', 'high', 'simple', 'open', 'Customer Success', NULL, 'premium', NOW(), NULL, NULL),
(2, 'TKT-002', 'dev@startup.com', 'API returning 429 errors', 'Our integration is getting rate limited. We are on basic plan but need higher limits urgently.', 'Technical', 'critical', 'complex', 'open', 'Engineering', NULL, 'basic', NOW(), NULL, NULL);
```

### Testing

```bash
# Process a new support ticket
curl -X POST http://localhost:3000/api/support/chat \
  -H "X-Context: supportticket" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Process this support ticket: Customer john@enterprise.com (enterprise plan) reports: Subject: Critical API outage - all endpoints returning 500 errors. Description: Our production API integration has been down for 30 minutes. All endpoints returning 500 internal server errors. This is blocking our customer transactions."
  }'

# Get support ticket statistics
curl -X POST http://localhost:3000/api/support/chat \
  -H "X-Context: supportticket" \
  -d '{
    "message": "Show me ticket statistics for today - how many tickets by category, priority, and team?"
  }'

# Search knowledge base
curl -X POST http://localhost:3000/api/support/chat \
  -H "X-Context: supportticket" \
  -d '{
    "message": "Search knowledge base for solutions related to API rate limiting issues"
  }'
```

---

## Quick Setup Guide

### 1. Environment Variables
```bash
# Add to your .env file
EMAIL_DB_USER=root
EMAIL_DB_PASS=password
INVENTORY_DB_USER=root
INVENTORY_DB_PASS=password
CALENDAR_DB_USER=root
CALENDAR_DB_PASS=password
EXPENSE_DB_USER=root
EXPENSE_DB_PASS=password
SUPPORT_DB_USER=root
SUPPORT_DB_PASS=password

# Email settings (for notifications)
SMTP_HOST=localhost
SMTP_PORT=587
SMTP_USER=test@company.com
SMTP_PASS=testpassword
```

### 2. Create Databases
```bash
# Run all the CREATE DATABASE and table statements above
mysql -u root -p < setup_databases.sql
```

### 3. Register MCP Servers
```javascript
// Add to /src/mcp/MCPServerManager.js
this.serverRegistry.set('email-assistant', EmailAssistantServer);
this.serverRegistry.set('inventory-monitor', InventoryMonitorServer);
this.serverRegistry.set('meeting-scheduler', MeetingSchedulerServer);
this.serverRegistry.set('expense-tracker', ExpenseTrackerServer);
this.serverRegistry.set('support-ticket', SupportTicketServer);
```

### 4. Add Agent Routes
```javascript
// Add to App.js
import EmailAgentController from "./src/controllers/EmailAgentController.js";

app.use("/api/email", (req, res, next) => {
  req.context = { ...req.context, agentType: 'email' };
  next();
});
app.post("/api/email/process", EmailAgentController.processEmail);
app.get("/api/email/stats", EmailAgentController.getEmailStats);

// Similar for other agents...
```

### 5. Test Each Agent
```bash
# Start server
npm start

# Test agents one by one using the curl commands above
```

## Summary

These 5 agents demonstrate the key capabilities of the hybrid architecture:

1. **📧 Email Assistant** - Text processing, categorization, automated responses
2. **🛒 Inventory Monitor** - Data analysis, predictive modeling, automated workflows  
3. **📅 Meeting Scheduler** - Complex scheduling logic, availability checking
4. **📊 Expense Tracker** - Policy compliance, categorization, reporting
5. **🎫 Support Ticket** - Intelligent routing, knowledge base search, prioritization

Each agent showcases:
- **MCP Tools** for real-time data access and actions
- **Database integration** with proper permissions  
- **AI decision-making** combined with business logic
- **Workflow automation** for complex processes
- **Multi-tenant support** through context isolation

You can build and test these agents incrementally, starting with whichever one matches your immediate use case!