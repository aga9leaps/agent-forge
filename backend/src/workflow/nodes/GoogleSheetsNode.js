import { google } from 'googleapis';
import path from 'path';

/**
 * Google Sheets Node
 * Read, write, update, and manage Google Sheets data
 */
class GoogleSheetsNode {
  static definition = {
    type: 'google_sheets',
    name: 'Google Sheets',
    description: 'Read and write data to Google Sheets',
    icon: 'google-sheets.svg',
    operations: ['read', 'write', 'append', 'update', 'clear', 'create'],
    inputs: {
      operation: {
        type: 'string',
        enum: ['read', 'write', 'append', 'update', 'clear', 'create'],
        default: 'read',
        required: true,
        description: 'The operation to perform'
      },
      spreadsheetId: {
        type: 'string',
        required: true,
        description: 'The ID of the Google Spreadsheet'
      },
      range: {
        type: 'string',
        required: true,
        description: 'The A1 notation range (e.g., Sheet1!A1:B10)'
      },
      values: {
        type: 'array',
        description: 'Values to write (2D array for write/update operations)'
      },
      valueInputOption: {
        type: 'string',
        enum: ['RAW', 'USER_ENTERED'],
        default: 'USER_ENTERED',
        description: 'How values should be interpreted'
      },
      majorDimension: {
        type: 'string',
        enum: ['ROWS', 'COLUMNS'],
        default: 'ROWS',
        description: 'Whether values are by row or column'
      },
      includeValuesInResponse: {
        type: 'boolean',
        default: true,
        description: 'Whether to return the updated values'
      }
    },
    outputs: {
      values: 'The cell values',
      range: 'The range that was read/written',
      majorDimension: 'Row or column orientation',
      updatedRange: 'The actual range that was updated',
      updatedRows: 'Number of rows updated',
      updatedColumns: 'Number of columns updated',
      updatedCells: 'Number of cells updated',
      spreadsheetId: 'The spreadsheet ID'
    }
  };

  /**
   * Get authenticated Google Sheets client
   * @param {Object} context - Execution context
   * @returns {Object} Google Sheets API client
   */
  static async getAuthClient(context) {
    try {
      // Try to use service account from environment
      const clientEmail = process.env.SHEET_CLIENT_EMAIL || process.env.GCS_CLIENT_EMAIL;
      const privateKey = (process.env.SHEET_PRIVATE_KEY || process.env.GCS_PRIVATE_KEY || '').replace(/\\n/g, '\n');

      if (clientEmail && privateKey) {
        // Service account authentication
        const auth = new google.auth.JWT({
          email: clientEmail,
          key: privateKey,
          scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        return google.sheets({ version: 'v4', auth });
      }

      // Try using application default credentials
      const auth = new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      return google.sheets({ version: 'v4', auth });

    } catch (error) {
      throw new Error(`Failed to authenticate with Google Sheets: ${error.message}`);
    }
  }

  /**
   * Execute Google Sheets operation
   * @param {Object} step - Step definition
   * @param {Object} config - Resolved configuration
   * @param {Object} context - Execution context
   * @returns {Object} Operation result
   */
  static async execute(step, config, context) {
    try {
      const sheets = await GoogleSheetsNode.getAuthClient(context);
      let result;

      switch (config.operation) {
        case 'read':
          result = await GoogleSheetsNode.readData(sheets, config);
          break;

        case 'write':
          result = await GoogleSheetsNode.writeData(sheets, config);
          break;

        case 'append':
          result = await GoogleSheetsNode.appendData(sheets, config);
          break;

        case 'update':
          result = await GoogleSheetsNode.updateData(sheets, config);
          break;

        case 'clear':
          result = await GoogleSheetsNode.clearData(sheets, config);
          break;

        case 'create':
          result = await GoogleSheetsNode.createSheet(sheets, config);
          break;

        default:
          throw new Error(`Unknown operation: ${config.operation}`);
      }

      return result;

    } catch (error) {
      console.error('Google Sheets operation failed:', error);
      
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
   * Read data from spreadsheet
   */
  static async readData(sheets, config) {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: config.spreadsheetId,
      range: config.range,
      majorDimension: config.majorDimension || 'ROWS',
      valueRenderOption: 'UNFORMATTED_VALUE',
      dateTimeRenderOption: 'FORMATTED_STRING'
    });

    return {
      success: true,
      values: response.data.values || [],
      range: response.data.range,
      majorDimension: response.data.majorDimension,
      rowCount: response.data.values ? response.data.values.length : 0,
      columnCount: response.data.values && response.data.values[0] ? response.data.values[0].length : 0
    };
  }

  /**
   * Write data to spreadsheet (overwrites existing data)
   */
  static async writeData(sheets, config) {
    if (!config.values || !Array.isArray(config.values)) {
      throw new Error('Values must be provided as a 2D array for write operation');
    }

    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: config.spreadsheetId,
      range: config.range,
      valueInputOption: config.valueInputOption || 'USER_ENTERED',
      includeValuesInResponse: config.includeValuesInResponse !== false,
      resource: {
        majorDimension: config.majorDimension || 'ROWS',
        values: config.values
      }
    });

    return {
      success: true,
      updatedRange: response.data.updatedRange,
      updatedRows: response.data.updatedRows,
      updatedColumns: response.data.updatedColumns,
      updatedCells: response.data.updatedCells,
      values: response.data.updatedData?.values
    };
  }

  /**
   * Append data to spreadsheet
   */
  static async appendData(sheets, config) {
    if (!config.values || !Array.isArray(config.values)) {
      throw new Error('Values must be provided as a 2D array for append operation');
    }

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: config.spreadsheetId,
      range: config.range,
      valueInputOption: config.valueInputOption || 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      includeValuesInResponse: config.includeValuesInResponse !== false,
      resource: {
        majorDimension: config.majorDimension || 'ROWS',
        values: config.values
      }
    });

    return {
      success: true,
      updatedRange: response.data.updates.updatedRange,
      updatedRows: response.data.updates.updatedRows,
      updatedColumns: response.data.updates.updatedColumns,
      updatedCells: response.data.updates.updatedCells,
      values: response.data.updates.updatedData?.values
    };
  }

  /**
   * Update specific cells
   */
  static async updateData(sheets, config) {
    // Similar to write but allows for batch updates
    return GoogleSheetsNode.writeData(sheets, config);
  }

  /**
   * Clear data from range
   */
  static async clearData(sheets, config) {
    const response = await sheets.spreadsheets.values.clear({
      spreadsheetId: config.spreadsheetId,
      range: config.range
    });

    return {
      success: true,
      clearedRange: response.data.clearedRange,
      spreadsheetId: config.spreadsheetId
    };
  }

  /**
   * Create a new sheet in the spreadsheet
   */
  static async createSheet(sheets, config) {
    const request = {
      spreadsheetId: config.spreadsheetId,
      resource: {
        requests: [{
          addSheet: {
            properties: {
              title: config.sheetName || 'New Sheet',
              gridProperties: {
                rowCount: config.rows || 1000,
                columnCount: config.columns || 26
              }
            }
          }
        }]
      }
    };

    const response = await sheets.spreadsheets.batchUpdate(request);
    
    return {
      success: true,
      sheetId: response.data.replies[0].addSheet.properties.sheetId,
      sheetName: response.data.replies[0].addSheet.properties.title,
      spreadsheetId: config.spreadsheetId
    };
  }

  /**
   * Validate node configuration
   */
  static validate(config) {
    const errors = [];

    if (!config.operation) {
      errors.push('Operation is required');
    }

    if (!config.spreadsheetId) {
      errors.push('Spreadsheet ID is required');
    }

    if (config.operation !== 'create' && !config.range) {
      errors.push('Range is required for this operation');
    }

    if (['write', 'append', 'update'].includes(config.operation) && !config.values) {
      errors.push('Values are required for write operations');
    }

    return errors;
  }

  /**
   * Get example configurations
   */
  static getExamples() {
    return {
      read: {
        operation: 'read',
        spreadsheetId: '{{env.SPREADSHEET_ID}}',
        range: 'Sheet1!A1:D10'
      },
      append: {
        operation: 'append',
        spreadsheetId: '{{env.SPREADSHEET_ID}}',
        range: 'Orders!A:E',
        values: [
          ['{{steps.order.output.id}}', '{{steps.order.output.customer}}', '{{steps.order.output.total}}', '{{now}}']
        ]
      },
      write: {
        operation: 'write',
        spreadsheetId: '{{env.SPREADSHEET_ID}}',
        range: 'Summary!B2:C2',
        values: [['Total Sales', '{{steps.calculate.output.total}}']]
      }
    };
  }
}

export default GoogleSheetsNode;