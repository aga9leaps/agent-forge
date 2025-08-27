import axios from 'axios';

/**
 * HTTP Request Node
 * Makes HTTP requests to external APIs and services
 */
class HttpRequestNode {
  static definition = {
    type: 'http',
    name: 'HTTP Request',
    description: 'Make HTTP requests to any API or web service',
    icon: 'http.svg',
    inputs: {
      method: {
        type: 'string',
        enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
        default: 'GET',
        required: true
      },
      url: {
        type: 'string',
        required: true,
        description: 'The URL to send the request to'
      },
      headers: {
        type: 'object',
        default: {},
        description: 'Request headers as key-value pairs'
      },
      params: {
        type: 'object',
        default: {},
        description: 'Query parameters'
      },
      body: {
        type: 'any',
        description: 'Request body (for POST, PUT, PATCH)'
      },
      authentication: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['none', 'bearer', 'basic', 'apiKey'],
            default: 'none'
          },
          credentials: {
            type: 'object'
          }
        }
      },
      timeout: {
        type: 'number',
        default: 30000,
        description: 'Request timeout in milliseconds'
      },
      responseType: {
        type: 'string',
        enum: ['json', 'text', 'arraybuffer', 'stream'],
        default: 'json'
      }
    },
    outputs: {
      data: 'The response data',
      status: 'HTTP status code',
      headers: 'Response headers',
      error: 'Error message if request failed'
    }
  };

  /**
   * Execute HTTP request
   * @param {Object} step - Step definition
   * @param {Object} config - Resolved configuration
   * @param {Object} context - Execution context
   * @returns {Object} Response data
   */
  static async execute(step, config, context) {
    try {
      // Build axios config
      const axiosConfig = {
        method: config.method || 'GET',
        url: config.url,
        params: config.params,
        headers: config.headers || {},
        timeout: config.timeout || 30000,
        responseType: config.responseType || 'json'
      };

      // Add body for appropriate methods
      if (['POST', 'PUT', 'PATCH'].includes(axiosConfig.method)) {
        axiosConfig.data = config.body;
      }

      // Handle authentication
      if (config.authentication && config.authentication.type !== 'none') {
        switch (config.authentication.type) {
          case 'bearer':
            axiosConfig.headers['Authorization'] = `Bearer ${config.authentication.credentials.token}`;
            break;
          case 'basic':
            const auth = Buffer.from(
              `${config.authentication.credentials.username}:${config.authentication.credentials.password}`
            ).toString('base64');
            axiosConfig.headers['Authorization'] = `Basic ${auth}`;
            break;
          case 'apiKey':
            const { headerName = 'X-API-Key', key } = config.authentication.credentials;
            axiosConfig.headers[headerName] = key;
            break;
        }
      }

      // Make the request
      console.log(`HTTP ${axiosConfig.method} ${axiosConfig.url}`);
      const response = await axios(axiosConfig);

      // Return standardized response
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        success: true
      };

    } catch (error) {
      // Handle errors gracefully
      const errorResponse = {
        success: false,
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      };

      // Check if we should throw or return error
      if (step.on_error === 'stop') {
        throw new Error(`HTTP request failed: ${error.message}`);
      }

      return errorResponse;
    }
  }

  /**
   * Validate node configuration
   * @param {Object} config - Node configuration
   * @returns {Array} Validation errors
   */
  static validate(config) {
    const errors = [];

    if (!config.url) {
      errors.push('URL is required');
    } else {
      try {
        new URL(config.url);
      } catch (e) {
        errors.push('Invalid URL format');
      }
    }

    if (!config.method) {
      errors.push('HTTP method is required');
    }

    return errors;
  }

  /**
   * Get example configuration
   * @returns {Object} Example config
   */
  static getExample() {
    return {
      method: 'POST',
      url: 'https://api.example.com/data',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        name: '{{inputs.name}}',
        email: '{{inputs.email}}'
      },
      authentication: {
        type: 'bearer',
        credentials: {
          token: '{{env.API_TOKEN}}'
        }
      }
    };
  }
}

export default HttpRequestNode;