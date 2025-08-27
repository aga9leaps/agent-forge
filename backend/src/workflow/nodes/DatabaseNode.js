/**
 * Database Node
 * Execute database operations on MySQL, MongoDB, and other databases
 */
class DatabaseNode {
  static definition = {
    type: 'database',
    name: 'Database',
    description: 'Execute database operations (SQL and NoSQL)',
    icon: 'database.svg',
    operations: {
      mysql: ['select', 'insert', 'update', 'delete', 'query'],
      mongodb: ['find', 'insert', 'update', 'delete', 'aggregate', 'count']
    },
    inputs: {
      operation: {
        type: 'string',
        required: true,
        description: 'Database operation (e.g., mysql.select, mongodb.find)'
      },
      connection: {
        type: 'string',
        enum: ['mysql', 'mongodb', 'default'],
        default: 'default',
        description: 'Database connection to use'
      },
      collection: {
        type: 'string',
        description: 'Collection name (MongoDB) or table name (SQL)'
      },
      query: {
        type: 'any',
        description: 'Query string (SQL) or query object (MongoDB)'
      },
      data: {
        type: 'any',
        description: 'Data to insert or update'
      },
      params: {
        type: 'array',
        description: 'Query parameters for prepared statements'
      },
      options: {
        type: 'object',
        description: 'Additional options (limit, sort, etc.)'
      }
    },
    outputs: {
      data: 'Query results',
      count: 'Number of affected rows/documents',
      insertedId: 'ID of inserted record',
      success: 'Whether operation succeeded',
      error: 'Error message if operation failed'
    }
  };

  /**
   * Execute database operation
   * @param {Object} step - Step definition
   * @param {Object} config - Resolved configuration
   * @param {Object} context - Execution context
   * @returns {Object} Operation result
   */
  static async execute(step, config, context) {
    try {
      // Parse operation (e.g., "mysql.select" -> ["mysql", "select"])
      const [dbType, action] = config.operation.split('.');
      
      if (!dbType || !action) {
        throw new Error('Operation must be in format "database.action" (e.g., "mysql.select")');
      }

      let result;
      switch (dbType) {
        case 'mysql':
          result = await DatabaseNode.handleMySQL(action, config, context);
          break;
        case 'mongodb':
          result = await DatabaseNode.handleMongoDB(action, config, context);
          break;
        default:
          throw new Error(`Unsupported database type: ${dbType}`);
      }

      return {
        success: true,
        operation: config.operation,
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

  /**
   * Handle MySQL operations
   */
  static async handleMySQL(action, config, context) {
    const { default: SQLDatabase } = await import('../../databases/sql.js');
    
    switch (action) {
      case 'select':
      case 'query':
        if (!config.query) throw new Error('Query is required for select operation');
        const selectResult = await SQLDatabase.query(config.query, config.params);
        return {
          data: selectResult,
          count: selectResult.length
        };

      case 'insert':
        if (!config.collection) throw new Error('Table name is required for insert operation');
        if (!config.data) throw new Error('Data is required for insert operation');
        
        const fields = Object.keys(config.data);
        const values = Object.values(config.data);
        const placeholders = fields.map(() => '?').join(', ');
        
        const insertQuery = `INSERT INTO ${config.collection} (${fields.join(', ')}) VALUES (${placeholders})`;
        const insertResult = await SQLDatabase.query(insertQuery, values);
        
        return {
          insertedId: insertResult.insertId,
          count: insertResult.affectedRows,
          data: { id: insertResult.insertId, ...config.data }
        };

      case 'update':
        if (!config.collection) throw new Error('Table name is required for update operation');
        if (!config.data) throw new Error('Data is required for update operation');
        if (!config.query && !config.params) throw new Error('WHERE condition is required for update operation');
        
        const updateFields = Object.keys(config.data);
        const updateValues = Object.values(config.data);
        const setClause = updateFields.map(field => `${field} = ?`).join(', ');
        
        let updateQuery = `UPDATE ${config.collection} SET ${setClause}`;
        if (config.query) {
          updateQuery += ` WHERE ${config.query}`;
          updateValues.push(...(config.params || []));
        }
        
        const updateResult = await SQLDatabase.query(updateQuery, updateValues);
        return {
          count: updateResult.affectedRows,
          data: config.data
        };

      case 'delete':
        if (!config.collection) throw new Error('Table name is required for delete operation');
        if (!config.query) throw new Error('WHERE condition is required for delete operation');
        
        const deleteQuery = `DELETE FROM ${config.collection} WHERE ${config.query}`;
        const deleteResult = await SQLDatabase.query(deleteQuery, config.params);
        
        return {
          count: deleteResult.affectedRows
        };

      default:
        throw new Error(`Unsupported MySQL action: ${action}`);
    }
  }

  /**
   * Handle MongoDB operations
   */
  static async handleMongoDB(action, config, context) {
    const { default: MongoDatabase } = await import('../../databases/mongo.js');
    
    if (!config.collection) {
      throw new Error('Collection name is required for MongoDB operations');
    }

    // Get database connection
    const client = await MongoDatabase.getClient();
    const db = client.db(process.env.MONGO_DB_NAME || 'default');
    const collection = db.collection(config.collection);

    switch (action) {
      case 'find':
        const query = config.query || {};
        const options = config.options || {};
        
        let cursor = collection.find(query);
        
        if (options.sort) cursor = cursor.sort(options.sort);
        if (options.limit) cursor = cursor.limit(options.limit);
        if (options.skip) cursor = cursor.skip(options.skip);
        
        const findResult = await cursor.toArray();
        return {
          data: findResult,
          count: findResult.length
        };

      case 'insert':
        if (!config.data) throw new Error('Data is required for insert operation');
        
        let insertResult;
        if (Array.isArray(config.data)) {
          insertResult = await collection.insertMany(config.data);
          return {
            insertedIds: insertResult.insertedIds,
            count: insertResult.insertedCount,
            data: config.data
          };
        } else {
          insertResult = await collection.insertOne(config.data);
          return {
            insertedId: insertResult.insertedId,
            count: insertResult.insertedCount,
            data: { _id: insertResult.insertedId, ...config.data }
          };
        }

      case 'update':
        if (!config.data) throw new Error('Data is required for update operation');
        const filter = config.query || {};
        const update = { $set: config.data };
        const updateOptions = config.options || {};
        
        let updateResult;
        if (updateOptions.updateMany) {
          updateResult = await collection.updateMany(filter, update, updateOptions);
        } else {
          updateResult = await collection.updateOne(filter, update, updateOptions);
        }
        
        return {
          count: updateResult.modifiedCount,
          matchedCount: updateResult.matchedCount,
          data: config.data
        };

      case 'delete':
        const deleteFilter = config.query || {};
        const deleteOptions = config.options || {};
        
        let deleteResult;
        if (deleteOptions.deleteMany) {
          deleteResult = await collection.deleteMany(deleteFilter);
        } else {
          deleteResult = await collection.deleteOne(deleteFilter);
        }
        
        return {
          count: deleteResult.deletedCount
        };

      case 'aggregate':
        if (!config.query || !Array.isArray(config.query)) {
          throw new Error('Pipeline array is required for aggregate operation');
        }
        
        const aggregateResult = await collection.aggregate(config.query).toArray();
        return {
          data: aggregateResult,
          count: aggregateResult.length
        };

      case 'count':
        const countFilter = config.query || {};
        const countResult = await collection.countDocuments(countFilter);
        return {
          count: countResult
        };

      default:
        throw new Error(`Unsupported MongoDB action: ${action}`);
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
      errors.push('Operation must be in format "database.action"');
    }

    const [dbType, action] = config.operation.split('.');
    
    if (dbType === 'mongodb' && !config.collection) {
      errors.push('Collection name is required for MongoDB operations');
    }
    
    if (dbType === 'mysql' && ['insert', 'update', 'delete'].includes(action) && !config.collection) {
      errors.push('Table name is required for MySQL write operations');
    }

    return errors;
  }

  /**
   * Get example configurations
   */
  static getExamples() {
    return {
      mysqlSelect: {
        operation: 'mysql.select',
        query: 'SELECT * FROM orders WHERE status = ? AND created_at > ?',
        params: ['pending', '2024-01-01']
      },
      mysqlInsert: {
        operation: 'mysql.insert',
        collection: 'customers',
        data: {
          name: '{{inputs.name}}',
          email: '{{inputs.email}}',
          created_at: '{{now}}'
        }
      },
      mongoFind: {
        operation: 'mongodb.find',
        collection: 'orders',
        query: { status: 'pending' },
        options: { limit: 10, sort: { created_at: -1 } }
      },
      mongoInsert: {
        operation: 'mongodb.insert',
        collection: 'logs',
        data: {
          event: 'order_created',
          orderId: '{{inputs.order_id}}',
          timestamp: '{{now}}'
        }
      },
      mongoAggregate: {
        operation: 'mongodb.aggregate',
        collection: 'orders',
        query: [
          { $match: { status: 'completed' } },
          { $group: { _id: '$customer_id', total: { $sum: '$amount' } } },
          { $sort: { total: -1 } }
        ]
      }
    };
  }
}

export default DatabaseNode;