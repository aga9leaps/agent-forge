import axios from 'axios';

/**
 * Shopify Node
 * Interact with Shopify Admin API for e-commerce operations
 */
class ShopifyNode {
  static definition = {
    type: 'shopify',
    name: 'Shopify',
    description: 'Connect to Shopify store and manage products, orders, customers',
    icon: 'shopify.svg',
    operations: {
      products: ['list', 'get', 'create', 'update', 'delete', 'count'],
      orders: ['list', 'get', 'create', 'update', 'fulfill', 'cancel', 'count'],
      customers: ['list', 'get', 'create', 'update', 'delete', 'search'],
      inventory: ['levels', 'adjust', 'locations']
    },
    inputs: {
      operation: {
        type: 'string',
        required: true,
        description: 'The operation to perform (e.g., products.list, orders.get)'
      },
      store: {
        type: 'string',
        required: true,
        description: 'Your Shopify store domain (e.g., your-store.myshopify.com)'
      },
      accessToken: {
        type: 'string',
        required: true,
        description: 'Shopify Admin API access token'
      },
      apiVersion: {
        type: 'string',
        default: '2024-01',
        description: 'Shopify API version'
      },
      resourceId: {
        type: 'string',
        description: 'ID of specific resource (for get, update, delete operations)'
      },
      data: {
        type: 'object',
        description: 'Data payload for create/update operations'
      },
      params: {
        type: 'object',
        description: 'Query parameters (limit, fields, etc.)'
      }
    },
    outputs: {
      data: 'The response data from Shopify API',
      count: 'Total count (for list operations)',
      success: 'Whether the operation succeeded',
      error: 'Error message if operation failed'
    }
  };

  /**
   * Execute Shopify API operation
   * @param {Object} step - Step definition
   * @param {Object} config - Resolved configuration
   * @param {Object} context - Execution context
   * @returns {Object} API response
   */
  static async execute(step, config, context) {
    try {
      // Parse operation (e.g., "products.list" -> ["products", "list"])
      const [resource, action] = config.operation.split('.');
      
      if (!resource || !action) {
        throw new Error('Operation must be in format "resource.action" (e.g., "products.list")');
      }

      // Build API client
      const client = ShopifyNode.createClient(config);
      
      // Execute operation
      let result;
      switch (resource) {
        case 'products':
          result = await ShopifyNode.handleProducts(client, action, config);
          break;
        case 'orders':
          result = await ShopifyNode.handleOrders(client, action, config);
          break;
        case 'customers':
          result = await ShopifyNode.handleCustomers(client, action, config);
          break;
        case 'inventory':
          result = await ShopifyNode.handleInventory(client, action, config);
          break;
        default:
          throw new Error(`Unsupported resource: ${resource}`);
      }

      return {
        success: true,
        resource,
        action,
        ...result
      };

    } catch (error) {
      console.error('Shopify operation failed:', error);
      
      if (step.on_error === 'stop') {
        throw error;
      }

      return {
        success: false,
        error: error.message,
        statusCode: error.response?.status,
        operation: config.operation
      };
    }
  }

  /**
   * Create Shopify API client
   */
  static createClient(config) {
    const baseURL = `https://${config.store}/admin/api/${config.apiVersion || '2024-01'}`;
    
    return axios.create({
      baseURL,
      headers: {
        'X-Shopify-Access-Token': config.accessToken,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  /**
   * Handle product operations
   */
  static async handleProducts(client, action, config) {
    switch (action) {
      case 'list':
        const listResponse = await client.get('/products.json', { params: config.params });
        return {
          data: listResponse.data.products,
          count: listResponse.data.products.length
        };

      case 'get':
        if (!config.resourceId) throw new Error('Product ID required for get operation');
        const getResponse = await client.get(`/products/${config.resourceId}.json`, { params: config.params });
        return {
          data: getResponse.data.product
        };

      case 'create':
        if (!config.data) throw new Error('Product data required for create operation');
        const createResponse = await client.post('/products.json', { product: config.data });
        return {
          data: createResponse.data.product
        };

      case 'update':
        if (!config.resourceId) throw new Error('Product ID required for update operation');
        if (!config.data) throw new Error('Product data required for update operation');
        const updateResponse = await client.put(`/products/${config.resourceId}.json`, { product: config.data });
        return {
          data: updateResponse.data.product
        };

      case 'delete':
        if (!config.resourceId) throw new Error('Product ID required for delete operation');
        await client.delete(`/products/${config.resourceId}.json`);
        return {
          data: { id: config.resourceId, deleted: true }
        };

      case 'count':
        const countResponse = await client.get('/products/count.json', { params: config.params });
        return {
          count: countResponse.data.count
        };

      default:
        throw new Error(`Unsupported product action: ${action}`);
    }
  }

  /**
   * Handle order operations
   */
  static async handleOrders(client, action, config) {
    switch (action) {
      case 'list':
        const listResponse = await client.get('/orders.json', { params: config.params });
        return {
          data: listResponse.data.orders,
          count: listResponse.data.orders.length
        };

      case 'get':
        if (!config.resourceId) throw new Error('Order ID required for get operation');
        const getResponse = await client.get(`/orders/${config.resourceId}.json`, { params: config.params });
        return {
          data: getResponse.data.order
        };

      case 'update':
        if (!config.resourceId) throw new Error('Order ID required for update operation');
        if (!config.data) throw new Error('Order data required for update operation');
        const updateResponse = await client.put(`/orders/${config.resourceId}.json`, { order: config.data });
        return {
          data: updateResponse.data.order
        };

      case 'fulfill':
        if (!config.resourceId) throw new Error('Order ID required for fulfill operation');
        const fulfillmentData = {
          fulfillment: {
            location_id: config.data?.location_id,
            tracking_number: config.data?.tracking_number,
            tracking_company: config.data?.tracking_company,
            line_items: config.data?.line_items || []
          }
        };
        const fulfillResponse = await client.post(`/orders/${config.resourceId}/fulfillments.json`, fulfillmentData);
        return {
          data: fulfillResponse.data.fulfillment
        };

      case 'cancel':
        if (!config.resourceId) throw new Error('Order ID required for cancel operation');
        const cancelResponse = await client.post(`/orders/${config.resourceId}/cancel.json`, {
          reason: config.data?.reason || 'other',
          email: config.data?.email !== false
        });
        return {
          data: cancelResponse.data.order
        };

      case 'count':
        const countResponse = await client.get('/orders/count.json', { params: config.params });
        return {
          count: countResponse.data.count
        };

      default:
        throw new Error(`Unsupported order action: ${action}`);
    }
  }

  /**
   * Handle customer operations
   */
  static async handleCustomers(client, action, config) {
    switch (action) {
      case 'list':
        const listResponse = await client.get('/customers.json', { params: config.params });
        return {
          data: listResponse.data.customers,
          count: listResponse.data.customers.length
        };

      case 'get':
        if (!config.resourceId) throw new Error('Customer ID required for get operation');
        const getResponse = await client.get(`/customers/${config.resourceId}.json`, { params: config.params });
        return {
          data: getResponse.data.customer
        };

      case 'create':
        if (!config.data) throw new Error('Customer data required for create operation');
        const createResponse = await client.post('/customers.json', { customer: config.data });
        return {
          data: createResponse.data.customer
        };

      case 'update':
        if (!config.resourceId) throw new Error('Customer ID required for update operation');
        if (!config.data) throw new Error('Customer data required for update operation');
        const updateResponse = await client.put(`/customers/${config.resourceId}.json`, { customer: config.data });
        return {
          data: updateResponse.data.customer
        };

      case 'search':
        const searchResponse = await client.get('/customers/search.json', { params: config.params });
        return {
          data: searchResponse.data.customers,
          count: searchResponse.data.customers.length
        };

      default:
        throw new Error(`Unsupported customer action: ${action}`);
    }
  }

  /**
   * Handle inventory operations
   */
  static async handleInventory(client, action, config) {
    switch (action) {
      case 'levels':
        const levelsResponse = await client.get('/inventory_levels.json', { params: config.params });
        return {
          data: levelsResponse.data.inventory_levels
        };

      case 'adjust':
        if (!config.data || !config.data.inventory_item_id || !config.data.location_id) {
          throw new Error('Inventory item ID and location ID required for adjust operation');
        }
        const adjustResponse = await client.post('/inventory_levels/adjust.json', config.data);
        return {
          data: adjustResponse.data.inventory_level
        };

      case 'locations':
        const locationsResponse = await client.get('/locations.json', { params: config.params });
        return {
          data: locationsResponse.data.locations
        };

      default:
        throw new Error(`Unsupported inventory action: ${action}`);
    }
  }

  /**
   * Validate configuration
   */
  static validate(config) {
    const errors = [];

    if (!config.operation) {
      errors.push('Operation is required');
    } else if (!config.operation.includes('.')) {
      errors.push('Operation must be in format "resource.action"');
    }

    if (!config.store) {
      errors.push('Store domain is required');
    }

    if (!config.accessToken) {
      errors.push('Access token is required');
    }

    return errors;
  }

  /**
   * Get example configurations
   */
  static getExamples() {
    return {
      listProducts: {
        operation: 'products.list',
        store: '{{env.SHOPIFY_STORE}}',
        accessToken: '{{env.SHOPIFY_ACCESS_TOKEN}}',
        params: {
          limit: 10,
          fields: 'id,title,vendor,product_type'
        }
      },
      getOrder: {
        operation: 'orders.get',
        store: '{{env.SHOPIFY_STORE}}',
        accessToken: '{{env.SHOPIFY_ACCESS_TOKEN}}',
        resourceId: '{{inputs.order_id}}'
      },
      createCustomer: {
        operation: 'customers.create',
        store: '{{env.SHOPIFY_STORE}}',
        accessToken: '{{env.SHOPIFY_ACCESS_TOKEN}}',
        data: {
          first_name: '{{inputs.first_name}}',
          last_name: '{{inputs.last_name}}',
          email: '{{inputs.email}}',
          phone: '{{inputs.phone}}'
        }
      },
      fulfillOrder: {
        operation: 'orders.fulfill',
        store: '{{env.SHOPIFY_STORE}}',
        accessToken: '{{env.SHOPIFY_ACCESS_TOKEN}}',
        resourceId: '{{inputs.order_id}}',
        data: {
          tracking_number: '{{inputs.tracking_number}}',
          tracking_company: 'DHL'
        }
      }
    };
  }
}

export default ShopifyNode;