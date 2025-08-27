import configurationService from '../services/ConfigurationService.js';

/**
 * Middleware to inject business context into requests
 * Context can be determined by:
 * - Header: x-context
 * - Query parameter: context
 * - Path parameter (for multi-tenant routes)
 * - Default: 'default' context
 */
export const contextMiddleware = async (req, res, next) => {
  try {
    // Determine context name from various sources
    const contextName = 
      req.headers['x-context'] || 
      req.query.context || 
      req.params.tenant ||
      req.body?.context ||
      'default';

    // Load the context
    const context = await configurationService.loadContext(contextName);
    
    // Attach to request object
    req.context = context;
    req.contextName = contextName;
    
    // Also set as active context in configuration service
    await configurationService.setActiveContext(contextName);
    
    // Add helper method to inject context into templates
    req.injectContext = (template) => {
      return configurationService.injectContext(template, context);
    };

    // Add helper for deep context injection
    req.deepInjectContext = (obj) => {
      return configurationService.deepInjectContext(obj, context);
    };
    
    next();
  } catch (error) {
    console.error('Context middleware error:', error);
    
    // If context loading fails, use default
    try {
      const defaultContext = await configurationService.loadContext('default');
      req.context = defaultContext;
      req.contextName = 'default';
      
      req.injectContext = (template) => {
        return configurationService.injectContext(template, defaultContext);
      };

      req.deepInjectContext = (obj) => {
        return configurationService.deepInjectContext(obj, defaultContext);
      };
      
      next();
    } catch (defaultError) {
      // If even default fails, return error
      res.status(500).json({
        error: 'Failed to load business context',
        message: error.message
      });
    }
  }
};

/**
 * Middleware to require a specific context
 * @param {string} requiredContext - Context name that must be present
 */
export const requireContext = (requiredContext) => {
  return async (req, res, next) => {
    if (req.contextName !== requiredContext) {
      return res.status(403).json({
        error: 'Invalid context',
        message: `This endpoint requires '${requiredContext}' context`
      });
    }
    next();
  };
};

/**
 * Middleware to validate context has required features
 * @param {Array} requiredFeatures - Array of required feature paths
 */
export const requireFeatures = (requiredFeatures) => {
  return (req, res, next) => {
    const missingFeatures = [];
    
    for (const feature of requiredFeatures) {
      const value = feature.split('.').reduce((obj, key) => obj?.[key], req.context);
      if (!value) {
        missingFeatures.push(feature);
      }
    }
    
    if (missingFeatures.length > 0) {
      return res.status(400).json({
        error: 'Missing required features',
        message: `Context '${req.contextName}' is missing: ${missingFeatures.join(', ')}`
      });
    }
    
    next();
  };
};

/**
 * Helper middleware to log context usage
 */
export const logContext = (req, res, next) => {
  console.log(`[Context: ${req.contextName}] ${req.method} ${req.path}`);
  next();
};

export default contextMiddleware;