import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ConfigurationService {
  constructor() {
    this.contexts = new Map();
    this.prompts = new Map();
    this.activeContext = null;
    this.configPath = path.join(__dirname, '../../configs');
  }

  /**
   * Load a business context configuration
   * @param {string} contextName - Name of the context to load
   * @returns {Object} Loaded context with prompts
   */
  async loadContext(contextName = 'default') {
    try {
      // Check cache first
      if (this.contexts.has(contextName)) {
        return this.contexts.get(contextName);
      }

      // Load context configuration
      const contextPath = path.join(this.configPath, 'contexts', `${contextName}.json`);
      const contextData = await fs.readFile(contextPath, 'utf8');
      const context = JSON.parse(contextData);

      // Load associated prompts if they exist
      const prompts = await this.loadPrompts(contextName);
      
      // Merge context and prompts
      const fullContext = {
        ...context,
        prompts
      };

      // Cache the context
      this.contexts.set(contextName, fullContext);
      
      return fullContext;
    } catch (error) {
      console.error(`Error loading context ${contextName}:`, error);
      
      // Fall back to default context if specified context fails
      if (contextName !== 'default') {
        console.log('Falling back to default context...');
        return this.loadContext('default');
      }
      
      throw error;
    }
  }

  /**
   * Load prompts for a specific context
   * @param {string} contextName - Name of the context
   * @returns {Object} Prompts object
   */
  async loadPrompts(contextName) {
    const prompts = {};
    
    try {
      // Try to load context-specific prompts
      const promptsPath = path.join(this.configPath, 'prompts', contextName);
      
      // Load agent prompts
      const agentPromptsPath = path.join(promptsPath, 'agents.json');
      try {
        const agentPromptsData = await fs.readFile(agentPromptsPath, 'utf8');
        prompts.agents = JSON.parse(agentPromptsData);
      } catch (error) {
        // Use default prompts if context-specific not found
        prompts.agents = await this.loadDefaultPrompts('agents');
      }

      // Load tool prompts
      const toolPromptsPath = path.join(promptsPath, 'tools.json');
      try {
        const toolPromptsData = await fs.readFile(toolPromptsPath, 'utf8');
        prompts.tools = JSON.parse(toolPromptsData);
      } catch (error) {
        prompts.tools = await this.loadDefaultPrompts('tools');
      }

    } catch (error) {
      console.log(`No specific prompts for ${contextName}, using defaults`);
      prompts.agents = await this.loadDefaultPrompts('agents');
      prompts.tools = await this.loadDefaultPrompts('tools');
    }
    
    return prompts;
  }

  /**
   * Load default prompts
   * @param {string} type - Type of prompts (agents, tools)
   * @returns {Object} Default prompts
   */
  async loadDefaultPrompts(type) {
    try {
      const defaultPromptsPath = path.join(this.configPath, 'prompts', 'default', `${type}.json`);
      const data = await fs.readFile(defaultPromptsPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error loading default ${type} prompts:`, error);
      return {};
    }
  }

  /**
   * Set the active context
   * @param {string} contextName - Name of the context to activate
   */
  async setActiveContext(contextName) {
    const context = await this.loadContext(contextName);
    this.activeContext = context;
    return context;
  }

  /**
   * Get the active context
   * @returns {Object} Active context
   */
  getActiveContext() {
    return this.activeContext || this.loadContext('default');
  }

  /**
   * Inject context values into a template string
   * @param {string} template - Template string with placeholders
   * @param {Object} context - Context object with values
   * @returns {string} Processed string with injected values
   */
  injectContext(template, context) {
    if (!template || typeof template !== 'string') {
      return template;
    }

    let processed = template;
    
    // Replace {{PLACEHOLDER}} style placeholders
    processed = processed.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const value = this.getNestedValue(context, path.trim());
      return value !== undefined ? value : match;
    });

    // Replace {placeholder} style placeholders for backward compatibility
    processed = processed.replace(/\{([^}]+)\}/g, (match, path) => {
      const value = this.getNestedValue(context, path.trim());
      return value !== undefined ? value : match;
    });

    return processed;
  }

  /**
   * Get nested value from object using dot notation
   * @param {Object} obj - Object to search
   * @param {string} path - Dot notation path
   * @returns {any} Value at path
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current?.[key];
    }, obj);
  }

  /**
   * Deep inject context into an object
   * @param {Object} obj - Object with potential template strings
   * @param {Object} context - Context for injection
   * @returns {Object} Object with injected values
   */
  deepInjectContext(obj, context) {
    if (typeof obj === 'string') {
      return this.injectContext(obj, context);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.deepInjectContext(item, context));
    }
    
    if (obj && typeof obj === 'object') {
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.deepInjectContext(value, context);
      }
      return result;
    }
    
    return obj;
  }

  /**
   * Get configuration value with fallback
   * @param {string} path - Dot notation path
   * @param {any} defaultValue - Default value if not found
   * @returns {any} Configuration value
   */
  async getConfig(path, defaultValue = null) {
    const context = this.activeContext || await this.loadContext('default');
    return this.getNestedValue(context, path) || defaultValue;
  }

  /**
   * List available contexts
   * @returns {Array} List of available context names
   */
  async listContexts() {
    try {
      const contextsPath = path.join(this.configPath, 'contexts');
      const files = await fs.readdir(contextsPath);
      
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));
    } catch (error) {
      console.error('Error listing contexts:', error);
      return ['default'];
    }
  }

  /**
   * Validate context against schema
   * @param {Object} context - Context to validate
   * @returns {boolean} Validation result
   */
  async validateContext(context) {
    // TODO: Implement JSON schema validation
    // For now, just check basic structure
    return context && 
           context.company && 
           context.agents && 
           context.metadata;
  }

  /**
   * Create a new context from template
   * @param {string} name - Name for the new context
   * @param {Object} config - Configuration overrides
   * @returns {Object} New context
   */
  async createContext(name, config = {}) {
    // Load default as template
    const template = await this.loadContext('default');
    
    // Merge with provided config
    const newContext = {
      ...template,
      ...config,
      metadata: {
        ...template.metadata,
        ...config.metadata,
        lastUpdated: new Date().toISOString()
      }
    };
    
    // Save to file
    const contextPath = path.join(this.configPath, 'contexts', `${name}.json`);
    await fs.writeFile(contextPath, JSON.stringify(newContext, null, 2));
    
    // Clear cache
    this.contexts.delete(name);
    
    return newContext;
  }
}

// Export as singleton
export default new ConfigurationService();
export { ConfigurationService };