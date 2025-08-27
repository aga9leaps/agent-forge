# Generic Agent Refactoring Plan

**Purpose**: Transform the business-specific Magic Paints agent into a generic, configurable agent platform  
**Date**: 2025-08-26  
**Priority**: HIGH - Must complete before workflow implementation

---

## Overview

The current codebase contains hardcoded business logic specific to Magic Paints. This refactoring will extract all business context into configuration files, making the agent platform suitable for any industry or use case.

---

## Refactoring Strategy

### 1. Configuration Architecture

Create a layered configuration system:

```
backend/configs/
├── contexts/                    # Business contexts
│   ├── default.json            # Default/generic context
│   ├── magic-paints.json       # Magic Paints specific
│   └── template.json           # Template for new contexts
├── prompts/                    # System prompts
│   ├── agents/
│   │   ├── default.json
│   │   ├── sales-agent.json
│   │   ├── finance-agent.json
│   │   └── reporting-agent.json
│   └── tools/
│       └── tool-prompts.json
└── schemas/
    └── context-schema.json     # Validation schema
```

### 2. Generic Context Structure

```javascript
{
  "company": {
    "name": "{{COMPANY_NAME}}",
    "industry": "{{INDUSTRY}}",
    "description": "{{COMPANY_DESCRIPTION}}",
    "location": {
      "city": "{{CITY}}",
      "state": "{{STATE}}",
      "country": "{{COUNTRY}}"
    }
  },
  "products": [
    {
      "id": "{{PRODUCT_ID}}",
      "name": "{{PRODUCT_NAME}}",
      "category": "{{CATEGORY}}",
      "description": "{{DESCRIPTION}}"
    }
  ],
  "agents": {
    "sales": {
      "persona": "{{AGENT_NAME}}",
      "role": "{{AGENT_ROLE}}",
      "personality": "{{PERSONALITY_TRAITS}}"
    }
  },
  "prompts": {
    "systemPrompt": "{{SYSTEM_PROMPT}}",
    "greetingTemplate": "{{GREETING}}",
    "responseTemplates": {}
  },
  "integrations": {
    "accounting": {
      "system": "{{ACCOUNTING_SYSTEM}}",
      "reportTypes": []
    }
  }
}
```

### 3. Code Changes Required

#### Phase 1: Extract Business Context (Day 1)

**Files to Modify:**

1. **`src/utils/constants.js`**
   - Move all Magic Paints constants to config
   - Create generic constants only
   - Add config loader utility

2. **`src/services/ConfigurationService.js`** (NEW)
   - Load context configurations
   - Validate against schema
   - Provide context injection methods

3. **`src/middleware/contextMiddleware.js`** (NEW)
   - Inject context based on tenant/client
   - Make context available to all services

#### Phase 2: Refactor Services (Day 2)

**Services to Update:**

1. **`PreSalesAgentService.js`**
   - Replace hardcoded prompts with templates
   - Use context injection for company info
   - Make product logic generic

2. **`FinanceBotService.js`**
   - Remove Magic Paints references
   - Use configurable report types
   - Abstract accounting system

3. **`salesAgentService.js`**
   - Parameterize all messages
   - Use template system
   - Remove product-specific logic

#### Phase 3: Abstract Tools (Day 3)

**Tool Refactoring:**

1. **Financial Report Tools**
   - Create interface for accounting systems
   - Move Tally-specific code to adapter
   - Support multiple accounting systems

2. **`toolsDefinition.js`**
   - Make descriptions configurable
   - Use context for business terms
   - Support dynamic tool loading

#### Phase 4: Repository Renaming (Day 4)

**Rename Repositories:**
- `mpCustomersRepository.js` → `customerRepository.js`
- `mpSalesTasksRepository.js` → `salesTaskRepository.js`
- `mpTasksRepository.js` → `taskRepository.js`

Update all imports and references.

---

## Implementation Steps

### Step 1: Create Configuration Service

```javascript
// src/services/ConfigurationService.js
class ConfigurationService {
  constructor() {
    this.contexts = new Map();
    this.activeContext = null;
  }
  
  async loadContext(contextName) {
    const contextPath = `./configs/contexts/${contextName}.json`;
    const promptsPath = `./configs/prompts/${contextName}/`;
    
    // Load and validate context
    const context = await this.loadAndValidate(contextPath);
    const prompts = await this.loadPrompts(promptsPath);
    
    return { ...context, prompts };
  }
  
  injectContext(obj, context) {
    // Replace placeholders with context values
    return this.deepReplace(obj, context);
  }
}
```

### Step 2: Create Context Middleware

```javascript
// src/middleware/contextMiddleware.js
export const contextMiddleware = (configService) => {
  return async (req, res, next) => {
    // Determine context from request (header, param, etc)
    const contextName = req.headers['x-context'] || 'default';
    
    try {
      const context = await configService.loadContext(contextName);
      req.context = context;
      next();
    } catch (error) {
      res.status(400).json({ error: 'Invalid context' });
    }
  };
};
```

### Step 3: Refactor a Service Example

```javascript
// Before (hardcoded):
class FinanceBotService {
  async generateResponse() {
    const systemPrompt = `You are a financial reporting assistant for Magic Paints...`;
    // ...
  }
}

// After (configurable):
class FinanceBotService {
  async generateResponse(context) {
    const systemPrompt = context.prompts.agents.finance.systemPrompt;
    // Inject context values into prompt
    const contextualPrompt = this.configService.injectContext(
      systemPrompt, 
      context
    );
    // ...
  }
}
```

### Step 4: Create Magic Paints Context File

```json
// configs/contexts/magic-paints.json
{
  "company": {
    "name": "Magic Paints",
    "industry": "Paint Manufacturing",
    "description": "Leading paint manufacturer in India",
    "location": {
      "city": "Raipur",
      "state": "Chhattisgarh",
      "country": "India"
    }
  },
  "products": [
    {
      "id": "putty",
      "name": "Wall Putty",
      "category": "Surface Preparation",
      "variants": ["Regular", "Premium"]
    },
    {
      "id": "emulsion",
      "name": "Interior Emulsion",
      "category": "Interior Paints",
      "variants": ["Silk", "Ultimax", "XTmax"]
    }
  ],
  "agents": {
    "sales": {
      "persona": "Vijay",
      "role": "Senior Sales Consultant",
      "personality": "Professional, knowledgeable, helpful"
    }
  }
}
```

---

## Testing Strategy

### 1. Unit Tests
- Test configuration loading
- Test context injection
- Test placeholder replacement

### 2. Integration Tests
- Test with default context
- Test with Magic Paints context
- Test context switching

### 3. Regression Tests
- Ensure existing functionality works
- Verify no hardcoded values remain
- Test all API endpoints

---

## Migration Plan

### Phase 1: Parallel Implementation
1. Implement configuration system alongside existing code
2. Test thoroughly without breaking current functionality
3. Gradually migrate services to use configuration

### Phase 2: Switch Over
1. Enable configuration-based system
2. Deprecate hardcoded values
3. Monitor for issues

### Phase 3: Cleanup
1. Remove all hardcoded business logic
2. Archive Magic Paints specific code
3. Document configuration process

---

## Success Criteria

- [ ] No business-specific code in core services
- [ ] All prompts externalized to configuration
- [ ] Easy to add new business contexts
- [ ] Existing Magic Paints functionality preserved
- [ ] Performance not degraded
- [ ] Documentation updated

---

## Timeline

- **Day 1**: Configuration service and context structure
- **Day 2**: Service refactoring (3-4 services)
- **Day 3**: Tool abstraction and adapters
- **Day 4**: Repository renaming and cleanup
- **Day 5**: Testing and documentation

**Total Duration**: 5 working days

---

## Next Steps

1. Review and approve this plan
2. Create configuration directory structure
3. Begin implementation with ConfigurationService
4. Refactor one service as proof of concept

---

*This refactoring is essential for creating a truly generic agent platform that can serve multiple industries and use cases.*