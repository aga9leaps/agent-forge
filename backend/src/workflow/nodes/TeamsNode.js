import axios from 'axios';

/**
 * Microsoft Teams Node
 * Send messages and interact with Microsoft Teams via Microsoft Graph API
 */
class TeamsNode {
  static definition = {
    type: 'teams',
    name: 'Microsoft Teams',
    description: 'Send messages and interact with Microsoft Teams',
    icon: 'teams.svg',
    operations: {
      messages: ['send', 'reply'],
      channels: ['list', 'get'],
      teams: ['list', 'get', 'members'],
      webhooks: ['send']
    },
    inputs: {
      operation: {
        type: 'string',
        required: true,
        description: 'The operation to perform (e.g., messages.send, webhooks.send)'
      },
      accessToken: {
        type: 'string',
        description: 'Microsoft Graph API access token'
      },
      webhookUrl: {
        type: 'string',
        description: 'Teams Incoming Webhook URL'
      },
      teamId: {
        type: 'string',
        description: 'Microsoft Teams team ID'
      },
      channelId: {
        type: 'string',
        description: 'Teams channel ID'
      },
      messageId: {
        type: 'string',
        description: 'Message ID (for reply operations)'
      },
      subject: {
        type: 'string',
        description: 'Message subject'
      },
      body: {
        type: 'string',
        description: 'Message body content'
      },
      bodyType: {
        type: 'string',
        enum: ['text', 'html'],
        default: 'html',
        description: 'Message body format'
      },
      importance: {
        type: 'string',
        enum: ['low', 'normal', 'high'],
        default: 'normal',
        description: 'Message importance'
      },
      mentions: {
        type: 'array',
        description: 'User mentions'
      },
      attachments: {
        type: 'array',
        description: 'File attachments'
      },
      title: {
        type: 'string',
        description: 'Webhook message title'
      },
      text: {
        type: 'string',
        description: 'Webhook message text'
      },
      summary: {
        type: 'string',
        description: 'Webhook message summary'
      },
      themeColor: {
        type: 'string',
        description: 'Webhook message theme color (hex)'
      },
      sections: {
        type: 'array',
        description: 'Webhook message sections (MessageCard format)'
      },
      potentialAction: {
        type: 'array',
        description: 'Webhook message actions'
      }
    },
    outputs: {
      success: 'Whether the operation succeeded',
      data: 'Response data from Microsoft Graph API',
      messageId: 'ID of sent message',
      error: 'Error message if operation failed'
    }
  };

  /**
   * Execute Teams operation
   * @param {Object} step - Step definition
   * @param {Object} config - Resolved configuration
   * @param {Object} context - Execution context
   * @returns {Object} Operation result
   */
  static async execute(step, config, context) {
    try {
      // Parse operation (e.g., "messages.send" -> ["messages", "send"])
      const [resource, action] = config.operation.split('.');
      
      if (!resource || !action) {
        throw new Error('Operation must be in format "resource.action" (e.g., "messages.send")');
      }

      let result;
      switch (resource) {
        case 'messages':
          result = await TeamsNode.handleMessages(action, config);
          break;
        case 'channels':
          result = await TeamsNode.handleChannels(action, config);
          break;
        case 'teams':
          result = await TeamsNode.handleTeams(action, config);
          break;
        case 'webhooks':
          result = await TeamsNode.handleWebhooks(action, config);
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
      console.error('Teams operation failed:', error);
      
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
   * Create Microsoft Graph API client
   */
  static createGraphClient(config) {
    if (!config.accessToken) {
      throw new Error('Access token is required for Microsoft Graph API operations');
    }

    return axios.create({
      baseURL: 'https://graph.microsoft.com/v1.0',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  /**
   * Handle message operations
   */
  static async handleMessages(action, config) {
    const client = TeamsNode.createGraphClient(config);

    switch (action) {
      case 'send':
        if (!config.teamId) throw new Error('Team ID is required for send operation');
        if (!config.channelId) throw new Error('Channel ID is required for send operation');
        if (!config.body) throw new Error('Message body is required for send operation');

        const messagePayload = {
          subject: config.subject,
          body: {
            contentType: config.bodyType === 'text' ? 'text' : 'html',
            content: config.body
          },
          importance: config.importance || 'normal'
        };

        if (config.mentions && Array.isArray(config.mentions)) {
          messagePayload.mentions = config.mentions;
        }

        if (config.attachments && Array.isArray(config.attachments)) {
          messagePayload.attachments = config.attachments;
        }

        const sendResponse = await client.post(
          `/teams/${config.teamId}/channels/${config.channelId}/messages`,
          messagePayload
        );
        
        return {
          data: sendResponse.data,
          messageId: sendResponse.data.id
        };

      case 'reply':
        if (!config.teamId) throw new Error('Team ID is required for reply operation');
        if (!config.channelId) throw new Error('Channel ID is required for reply operation');
        if (!config.messageId) throw new Error('Message ID is required for reply operation');
        if (!config.body) throw new Error('Message body is required for reply operation');

        const replyPayload = {
          body: {
            contentType: config.bodyType === 'text' ? 'text' : 'html',
            content: config.body
          }
        };

        if (config.mentions && Array.isArray(config.mentions)) {
          replyPayload.mentions = config.mentions;
        }

        const replyResponse = await client.post(
          `/teams/${config.teamId}/channels/${config.channelId}/messages/${config.messageId}/replies`,
          replyPayload
        );
        
        return {
          data: replyResponse.data,
          messageId: replyResponse.data.id
        };

      default:
        throw new Error(`Unsupported message action: ${action}`);
    }
  }

  /**
   * Handle channel operations
   */
  static async handleChannels(action, config) {
    const client = TeamsNode.createGraphClient(config);

    switch (action) {
      case 'list':
        if (!config.teamId) throw new Error('Team ID is required for list channels operation');

        const listResponse = await client.get(`/teams/${config.teamId}/channels`);
        
        return {
          data: listResponse.data.value,
          count: listResponse.data.value.length
        };

      case 'get':
        if (!config.teamId) throw new Error('Team ID is required for get channel operation');
        if (!config.channelId) throw new Error('Channel ID is required for get channel operation');

        const getResponse = await client.get(`/teams/${config.teamId}/channels/${config.channelId}`);
        
        return {
          data: getResponse.data
        };

      default:
        throw new Error(`Unsupported channel action: ${action}`);
    }
  }

  /**
   * Handle teams operations
   */
  static async handleTeams(action, config) {
    const client = TeamsNode.createGraphClient(config);

    switch (action) {
      case 'list':
        const listResponse = await client.get('/me/joinedTeams');
        
        return {
          data: listResponse.data.value,
          count: listResponse.data.value.length
        };

      case 'get':
        if (!config.teamId) throw new Error('Team ID is required for get team operation');

        const getResponse = await client.get(`/teams/${config.teamId}`);
        
        return {
          data: getResponse.data
        };

      case 'members':
        if (!config.teamId) throw new Error('Team ID is required for members operation');

        const membersResponse = await client.get(`/teams/${config.teamId}/members`);
        
        return {
          data: membersResponse.data.value,
          count: membersResponse.data.value.length
        };

      default:
        throw new Error(`Unsupported team action: ${action}`);
    }
  }

  /**
   * Handle webhook operations
   */
  static async handleWebhooks(action, config) {
    switch (action) {
      case 'send':
        if (!config.webhookUrl) throw new Error('Webhook URL is required for send operation');
        if (!config.text && !config.title) throw new Error('Either text or title is required for webhook send');

        const webhookPayload = {
          '@type': 'MessageCard',
          '@context': 'https://schema.org/extensions',
          summary: config.summary || config.title || 'Webhook Message',
          themeColor: config.themeColor,
          title: config.title,
          text: config.text
        };

        if (config.sections && Array.isArray(config.sections)) {
          webhookPayload.sections = config.sections;
        }

        if (config.potentialAction && Array.isArray(config.potentialAction)) {
          webhookPayload.potentialAction = config.potentialAction;
        }

        const webhookClient = axios.create({ timeout: 30000 });
        const webhookResponse = await webhookClient.post(config.webhookUrl, webhookPayload);
        
        return {
          data: { status: webhookResponse.status, message: 'Webhook sent successfully' }
        };

      default:
        throw new Error(`Unsupported webhook action: ${action}`);
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

    const [resource, action] = config.operation.split('.');

    // Validate webhook operations
    if (resource === 'webhooks' && action === 'send') {
      if (!config.webhookUrl) {
        errors.push('Webhook URL is required for webhook send');
      }
    } else {
      // Graph API operations require access token
      if (!config.accessToken) {
        errors.push('Access token is required for Microsoft Graph API operations');
      }
    }

    return errors;
  }

  /**
   * Get example configurations
   */
  static getExamples() {
    return {
      sendMessage: {
        operation: 'messages.send',
        accessToken: '{{env.MS_GRAPH_ACCESS_TOKEN}}',
        teamId: '{{env.TEAMS_TEAM_ID}}',
        channelId: '{{env.TEAMS_CHANNEL_ID}}',
        subject: 'Order Update',
        body: '<h2>Order Processed</h2><p>Order #{{inputs.order_id}} has been processed successfully!</p>',
        bodyType: 'html',
        importance: 'normal'
      },
      webhookAlert: {
        operation: 'webhooks.send',
        webhookUrl: '{{env.TEAMS_WEBHOOK_URL}}',
        title: 'System Alert',
        text: 'Alert: {{inputs.alert_type}} - {{inputs.message}}',
        themeColor: '#FF5733',
        summary: 'System Alert Notification'
      },
      webhookRichMessage: {
        operation: 'webhooks.send',
        webhookUrl: '{{env.TEAMS_WEBHOOK_URL}}',
        title: 'Daily Report',
        summary: 'Daily Sales Report',
        themeColor: '#0078D4',
        sections: [
          {
            activityTitle: 'Sales Summary',
            activitySubtitle: 'Daily metrics for {{inputs.date}}',
            facts: [
              {
                name: 'Total Sales',
                value: '${{inputs.total_sales}}'
              },
              {
                name: 'Orders',
                value: '{{inputs.order_count}}'
              },
              {
                name: 'New Customers',
                value: '{{inputs.new_customers}}'
              }
            ]
          }
        ],
        potentialAction: [
          {
            '@type': 'OpenUri',
            name: 'View Dashboard',
            targets: [
              {
                os: 'default',
                uri: 'https://dashboard.example.com'
              }
            ]
          }
        ]
      },
      replyToMessage: {
        operation: 'messages.reply',
        accessToken: '{{env.MS_GRAPH_ACCESS_TOKEN}}',
        teamId: '{{env.TEAMS_TEAM_ID}}',
        channelId: '{{env.TEAMS_CHANNEL_ID}}',
        messageId: '{{inputs.original_message_id}}',
        body: 'Thank you for the update! The issue has been resolved.',
        bodyType: 'text'
      },
      listTeams: {
        operation: 'teams.list',
        accessToken: '{{env.MS_GRAPH_ACCESS_TOKEN}}'
      }
    };
  }
}

export default TeamsNode;