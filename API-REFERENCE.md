# 🚀 Agent Forge API Reference

## Overview

Agent Forge is a **backend-only API server** for executing intelligent workflow agents with business context and automated decision-making.

**Base URL**: `http://localhost:3000`

---

## 🎯 Quick Start

### 1. Start Server
```bash
cd backend
node App.js
```

### 2. Test API
```bash
curl http://localhost:3000/api/workflows
```

### 3. Run Complete Inventory Agent
```bash
curl -X POST http://localhost:3000/api/workflows/execute/complete-inventory-agent \
  -H "Content-Type: application/json" \
  -d '{"inputs": {"business_context": "fashion-retail", "test_mode": true}}'
```

---

## 📋 API Endpoints

### **Root Endpoint**
```
GET /
```
Returns API information and available endpoints.

**Response:**
```json
{
  "name": "Agent Forge API",
  "version": "2.0",
  "status": "operational",
  "endpoints": {
    "workflows": "/api/workflows",
    "contexts": "/api/contexts",
    "system": "/api/status"
  }
}
```

### **System Status**
```
GET /api/status
```
Returns system health and configuration.

### **Workflows**

#### List All Workflows
```
GET /api/workflows
```
**Response:**
```json
{
  "success": true,
  "workflows": [
    {
      "name": "complete-inventory-agent",
      "version": "1.0",
      "description": "Complete working inventory agent with context, dummy data, and full workflow",
      "steps": 8,
      "loadedAt": "2025-08-28T16:41:43.928Z"
    }
  ],
  "total": 5
}
```

#### Execute Workflow
```
POST /api/workflows/execute/:workflowName
Content-Type: application/json

{
  "inputs": {
    "parameter1": "value1",
    "parameter2": "value2"
  }
}
```

**Response:**
```json
{
  "success": true,
  "executionId": "abc-123-def",
  "status": "completed",
  "outputs": {
    "result1": "...",
    "result2": "..."
  },
  "duration": 5
}
```

#### Get Execution Details
```
GET /api/workflows/executions/:executionId
```
Returns detailed execution results, step-by-step logs, and complete output data.

#### Reload Workflows
```
POST /api/workflows/reload
```
Reloads all workflow files from the filesystem.

### **Contexts**

#### List Contexts
```
GET /api/contexts
```
Lists available business contexts.

#### Get Context
```
GET /api/contexts/:contextName
```
Returns specific business context configuration.

---

## 🤖 Available Agents

### **1. Complete Inventory Agent** ⭐ **RECOMMENDED**
**Name**: `complete-inventory-agent`

**Description**: Full end-to-end inventory management with business context, bundle processing, and intelligent recommendations.

**Inputs**:
```json
{
  "business_context": "fashion-retail" | "electronics",
  "test_mode": true
}
```

**What it does**:
- ✅ Loads business-specific context (retail vs electronics)
- ✅ Generates contextual dummy inventory data
- ✅ Simulates recent sales with bundle processing
- ✅ Calculates inventory impact (bundle → component deduction)
- ✅ Analyzes stock levels with context-aware reorder points
- ✅ Generates purchase orders grouped by supplier
- ✅ Provides intelligent business recommendations
- ✅ Creates comprehensive executive summary

**Sample Usage**:
```bash
# Fashion Retail Context
curl -X POST http://localhost:3000/api/workflows/execute/complete-inventory-agent \
  -H "Content-Type: application/json" \
  -d '{"inputs": {"business_context": "fashion-retail", "test_mode": true}}'

# Electronics Context
curl -X POST http://localhost:3000/api/workflows/execute/complete-inventory-agent \
  -H "Content-Type: application/json" \
  -d '{"inputs": {"business_context": "electronics", "test_mode": true}}'
```

### **2. Inventory Demo**
**Name**: `inventory-demo`

**Description**: Simple inventory workflow with basic mock data processing.

**Inputs**:
```json
{
  "store_name": "Demo Store Name"
}
```

### **3. Hello World**
**Name**: `hello-world-fixed`

**Description**: Basic test workflow for system verification.

**Inputs**:
```json
{
  "name": "Test User"
}
```

---

## 💡 Business Contexts

### **Fashion Retail**
- **Seasonality**: High
- **Bundle Strategy**: Outfit-based
- **Reorder Safety Factor**: 1.5x
- **Target Margin**: 65%
- **Sample Items**: Dresses, jeans, sneakers, bags, scarves
- **Sample Bundles**: Summer outfit packages, casual look sets

### **Electronics**
- **Seasonality**: Low
- **Bundle Strategy**: Compatibility-based
- **Reorder Safety Factor**: 2.0x
- **Target Margin**: 40%
- **Sample Items**: Phones, laptops, cases, chargers
- **Sample Bundles**: Phone starter kits

---

## 📊 Sample Output

### Complete Inventory Agent Results:

```json
{
  "success": true,
  "executionId": "abc-123",
  "outputs": {
    "agent_summary": {
      "salesAnalysis": {
        "totalOrders": 5,
        "totalRevenue": 720.97,
        "bundleContributionPercent": "57.3"
      },
      "inventoryStatus": {
        "criticalStockItems": 2,
        "itemsNeedingReorder": 3,
        "inventoryHealthScore": "20.0"
      },
      "procurementSummary": {
        "totalProcurementValue": 3933,
        "urgentOrders": 2
      }
    },
    "recommendations": [
      {
        "type": "URGENT",
        "title": "2 items critically low",
        "impact": "HIGH"
      }
    ],
    "purchase_orders": [
      {
        "poNumber": "PO-3001",
        "supplier": "Trendy Imports",
        "totalCost": 1908,
        "priority": "URGENT"
      }
    ]
  }
}
```

---

## 🔧 Error Handling

### Standard Error Response:
```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400
}
```

### Common Error Codes:
- **400**: Invalid input parameters
- **404**: Workflow not found
- **500**: Internal server error

---

## 🎯 Key Features

### **✅ Working Features**:
- 🤖 **Complete Inventory Agent** with business intelligence
- 📊 **Business Context Switching** (fashion-retail vs electronics)
- 📦 **Bundle Processing Logic** (automatic component deduction)
- 🔄 **Purchase Order Generation** (supplier-grouped, priority-based)
- 💡 **Intelligent Recommendations** (context-aware business insights)
- 📈 **Real-time Analytics** (inventory health, turnover, margins)
- ⚡ **Fast Execution** (3-5ms typical response time)
- 🔍 **Detailed Logging** (step-by-step execution tracking)

### **🏗️ Architecture**:
- **Node.js Express** backend
- **YAML Workflow Engine** with transform nodes
- **MongoDB** for data persistence
- **Business Context System** for multi-tenant support
- **Modular Node Architecture** (11+ node types)

---

## 🚀 Production Deployment

### **Environment Variables**:
```bash
OPENAI_API_KEY=your_key_here
MONGO_DB_NAME=production_db
PORT=3000
```

### **Dependencies**:
```bash
npm install
```

### **Start Server**:
```bash
node App.js
```

---

## 📞 Support

**Test Endpoints**:
```bash
curl http://localhost:3000/api/status
curl http://localhost:3000/api/workflows
curl http://localhost:3000/api/contexts
```

**Working Agent Test**:
```bash
curl -X POST http://localhost:3000/api/workflows/execute/complete-inventory-agent \
  -H "Content-Type: application/json" \
  -d '{"inputs": {"business_context": "fashion-retail", "test_mode": true}}'
```

---

*Agent Forge API v2.0 - Backend-only intelligent workflow execution platform* ⚡