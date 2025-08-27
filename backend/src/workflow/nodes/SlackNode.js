import axios from 'axios';

/**
 * Slack Node
 * Send messages, create channels, and interact with Slack workspace
 */
class SlackNode {
  static definition = {
    type: 'slack',
    name: 'Slack',
    description: 'Send messages and interact with Slack workspaces',
    icon: 'slack.svg',
    operations: {
      messages: ['send', 'update', 'delete', 'reply'],
      channels: ['list', 'create', 'invite', 'archive'],
      users: ['list', 'info', 'presence'],
      files: ['upload', 'list', 'delete']
    },
    inputs: {
      operation: {
        type: 'string',
        required: true,
        description: 'The operation to perform (e.g., messages.send, channels.create)'
      },
      token: {
        type: 'string',
        required: true,
        description: 'Slack Bot User OAuth Token (starts with xoxb-)'
      },
      channel: {
        type: 'string',
        description: 'Channel ID, channel name (#channel), or user ID (@user)'
      },
      text: {
        type: 'string',
        description: 'Message text content'
      },
      blocks: {
        type: 'array',
        description: 'Rich message blocks (Slack Block Kit)'
      },
      attachments: {
        type: 'array',
        description: 'Message attachments (legacy format)'
      },
      threadTs: {
        type: 'string',
        description: 'Thread timestamp for replies'
      },
      messageTs: {
        type: 'string',
        description: 'Message timestamp for updates/deletes'
      },
      username: {
        type: 'string',
        description: 'Bot username (overrides default)'
      },
      iconEmoji: {
        type: 'string',
        description: 'Bot icon emoji (e.g., :robot_face:)'
      },
      iconUrl: {
        type: 'string',
        description: 'Bot icon URL'
      },
      linkNames: {
        type: 'boolean',
        default: true,
        description: 'Enable @mentions and #channel linking'
      },
      unfurlLinks: {
        type: 'boolean',
        default: true,
        description: 'Enable automatic link unfurling'
      },
      unfurlMedia: {
        type: 'boolean',
        default: true,
        description: 'Enable automatic media unfurling'
      }
    },
    outputs: {
      data: 'Response data from Slack API',
      success: 'Whether the operation succeeded',
      error: 'Error message if operation failed',
      messageTs: 'Timestamp of sent/updated message',
      channel: 'Channel ID where message was sent'
    }
  };

  /**
   * Execute Slack operation
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

      // Create API client
      const client = SlackNode.createClient(config);
      
      // Execute operation
      let result;
      switch (resource) {
        case 'messages':
          result = await SlackNode.handleMessages(client, action, config);
          break;
        case 'channels':
          result = await SlackNode.handleChannels(client, action, config);
          break;
        case 'users':
          result = await SlackNode.handleUsers(client, action, config);
          break;
        case 'files':
          result = await SlackNode.handleFiles(client, action, config);
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
      console.error('Slack operation failed:', error);
      
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
   * Create Slack API client
   */
  static createClient(config) {
    return axios.create({
      baseURL: 'https://slack.com/api',
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  /**
   * Handle message operations
   */
  static async handleMessages(client, action, config) {
    switch (action) {
      case 'send':
        if (!config.channel) throw new Error('Channel is required for send operation');
        if (!config.text && !config.blocks) throw new Error('Either text or blocks is required for send operation');

        const sendPayload = {
          channel: config.channel,
          text: config.text || '',
          username: config.username,
          icon_emoji: config.iconEmoji,
          icon_url: config.iconUrl,
          link_names: config.linkNames !== false,
          unfurl_links: config.unfurlLinks !== false,
          unfurl_media: config.unfurlMedia !== false
        };

        if (config.blocks) sendPayload.blocks = config.blocks;
        if (config.attachments) sendPayload.attachments = config.attachments;
        if (config.threadTs) sendPayload.thread_ts = config.threadTs;

        const sendResponse = await client.post('/chat.postMessage', sendPayload);
        
        if (!sendResponse.data.ok) {
          throw new Error(`Slack API error: ${sendResponse.data.error}`);
        }

        return {
          data: sendResponse.data,
          messageTs: sendResponse.data.ts,
          channel: sendResponse.data.channel
        };

      case 'update':
        if (!config.channel) throw new Error('Channel is required for update operation');
        if (!config.messageTs) throw new Error('Message timestamp is required for update operation');
        if (!config.text && !config.blocks) throw new Error('Either text or blocks is required for update operation');

        const updatePayload = {
          channel: config.channel,
          ts: config.messageTs,
          text: config.text || ''
        };

        if (config.blocks) updatePayload.blocks = config.blocks;
        if (config.attachments) updatePayload.attachments = config.attachments;

        const updateResponse = await client.post('/chat.update', updatePayload);
        
        if (!updateResponse.data.ok) {
          throw new Error(`Slack API error: ${updateResponse.data.error}`);
        }

        return {
          data: updateResponse.data,
          messageTs: updateResponse.data.ts,
          channel: updateResponse.data.channel
        };

      case 'delete':
        if (!config.channel) throw new Error('Channel is required for delete operation');
        if (!config.messageTs) throw new Error('Message timestamp is required for delete operation');

        const deleteResponse = await client.post('/chat.delete', {
          channel: config.channel,
          ts: config.messageTs
        });
        
        if (!deleteResponse.data.ok) {
          throw new Error(`Slack API error: ${deleteResponse.data.error}`);
        }

        return {
          data: deleteResponse.data,
          channel: config.channel,
          deleted: true
        };

      case 'reply':
        if (!config.channel) throw new Error('Channel is required for reply operation');
        if (!config.threadTs) throw new Error('Thread timestamp is required for reply operation');
        if (!config.text && !config.blocks) throw new Error('Either text or blocks is required for reply operation');

        const replyPayload = {
          channel: config.channel,
          thread_ts: config.threadTs,
          text: config.text || ''
        };

        if (config.blocks) replyPayload.blocks = config.blocks;
        if (config.attachments) replyPayload.attachments = config.attachments;

        const replyResponse = await client.post('/chat.postMessage', replyPayload);
        
        if (!replyResponse.data.ok) {
          throw new Error(`Slack API error: ${replyResponse.data.error}`);
        }

        return {
          data: replyResponse.data,
          messageTs: replyResponse.data.ts,
          channel: replyResponse.data.channel
        };

      default:
        throw new Error(`Unsupported message action: ${action}`);
    }
  }

  /**
   * Handle channel operations
   */
  static async handleChannels(client, action, config) {
    switch (action) {
      case 'list':
        const listResponse = await client.get('/conversations.list', {
          params: {
            exclude_archived: config.excludeArchived !== false,
            limit: config.limit || 100,
            types: config.types || 'public_channel,private_channel'
          }
        });
        
        if (!listResponse.data.ok) {
          throw new Error(`Slack API error: ${listResponse.data.error}`);
        }

        return {
          data: listResponse.data.channels,
          count: listResponse.data.channels.length
        };

      case 'create':
        if (!config.name) throw new Error('Channel name is required for create operation');

        const createResponse = await client.post('/conversations.create', {
          name: config.name,
          is_private: config.isPrivate === true
        });
        
        if (!createResponse.data.ok) {
          throw new Error(`Slack API error: ${createResponse.data.error}`);
        }

        return {
          data: createResponse.data.channel
        };

      case 'invite':
        if (!config.channel) throw new Error('Channel is required for invite operation');
        if (!config.users) throw new Error('Users list is required for invite operation');

        const inviteResponse = await client.post('/conversations.invite', {
          channel: config.channel,
          users: Array.isArray(config.users) ? config.users.join(',') : config.users
        });
        
        if (!inviteResponse.data.ok) {
          throw new Error(`Slack API error: ${inviteResponse.data.error}`);
        }

        return {
          data: inviteResponse.data.channel
        };

      case 'archive':
        if (!config.channel) throw new Error('Channel is required for archive operation');

        const archiveResponse = await client.post('/conversations.archive', {
          channel: config.channel
        });
        
        if (!archiveResponse.data.ok) {
          throw new Error(`Slack API error: ${archiveResponse.data.error}`);
        }

        return {
          data: { channel: config.channel, archived: true }
        };

      default:
        throw new Error(`Unsupported channel action: ${action}`);
    }
  }

  /**
   * Handle user operations
   */
  static async handleUsers(client, action, config) {
    switch (action) {
      case 'list':
        const listResponse = await client.get('/users.list', {
          params: {
            limit: config.limit || 100,
            include_locale: config.includeLocale === true
          }
        });
        
        if (!listResponse.data.ok) {
          throw new Error(`Slack API error: ${listResponse.data.error}`);
        }

        return {
          data: listResponse.data.members,
          count: listResponse.data.members.length
        };

      case 'info':
        if (!config.user) throw new Error('User ID is required for info operation');

        const infoResponse = await client.get('/users.info', {
          params: {
            user: config.user,
            include_locale: config.includeLocale === true
          }
        });
        
        if (!infoResponse.data.ok) {
          throw new Error(`Slack API error: ${infoResponse.data.error}`);
        }

        return {
          data: infoResponse.data.user
        };

      case 'presence':
        if (!config.user) throw new Error('User ID is required for presence operation');

        const presenceResponse = await client.get('/users.getPresence', {
          params: {
            user: config.user
          }
        });
        
        if (!presenceResponse.data.ok) {
          throw new Error(`Slack API error: ${presenceResponse.data.error}`);
        }

        return {
          data: {
            user: config.user,
            presence: presenceResponse.data.presence,
            online: presenceResponse.data.online,
            auto_away: presenceResponse.data.auto_away,
            manual_away: presenceResponse.data.manual_away,
            connection_count: presenceResponse.data.connection_count,
            last_activity: presenceResponse.data.last_activity
          }
        };

      default:
        throw new Error(`Unsupported user action: ${action}`);
    }
  }

  /**
   * Handle file operations
   */
  static async handleFiles(client, action, config) {
    switch (action) {
      case 'upload':
        if (!config.file && !config.content) {
          throw new Error('Either file path or content is required for upload operation');
        }
        if (!config.channels && !config.channel) {
          throw new Error('Channel(s) required for file upload');
        }

        const uploadPayload = {
          channels: config.channels || config.channel,
          title: config.title,
          filename: config.filename,
          filetype: config.filetype,
          initial_comment: config.initialComment
        };

        if (config.content) {
          uploadPayload.content = config.content;
        } else {
          uploadPayload.file = config.file;
        }

        const uploadResponse = await client.post('/files.upload', uploadPayload);
        
        if (!uploadResponse.data.ok) {
          throw new Error(`Slack API error: ${uploadResponse.data.error}`);
        }

        return {
          data: uploadResponse.data.file
        };

      case 'list':
        const listResponse = await client.get('/files.list', {
          params: {
            channel: config.channel,
            user: config.user,
            count: config.count || 100,
            page: config.page || 1
          }
        });
        
        if (!listResponse.data.ok) {
          throw new Error(`Slack API error: ${listResponse.data.error}`);
        }

        return {
          data: listResponse.data.files,
          count: listResponse.data.files.length,
          paging: listResponse.data.paging
        };

      case 'delete':
        if (!config.fileId) throw new Error('File ID is required for delete operation');

        const deleteResponse = await client.post('/files.delete', {
          file: config.fileId
        });
        
        if (!deleteResponse.data.ok) {
          throw new Error(`Slack API error: ${deleteResponse.data.error}`);
        }

        return {
          data: { file: config.fileId, deleted: true }
        };

      default:
        throw new Error(`Unsupported file action: ${action}`);
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

    if (!config.token) {
      errors.push('Slack token is required');
    } else if (!config.token.startsWith('xoxb-')) {
      errors.push('Token should be a Bot User OAuth Token (starts with xoxb-)');
    }

    const [resource, action] = config.operation.split('.');
    
    if (resource === 'messages' && ['send', 'update', 'reply'].includes(action)) {
      if (!config.text && !config.blocks) {
        errors.push('Either text or blocks is required for message operations');
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
        token: '{{env.SLACK_BOT_TOKEN}}',
        channel: '#general',
        text: 'Hello from workflow! Order #{{inputs.order_id}} has been processed.',
        username: 'OrderBot',
        iconEmoji: ':package:'
      },
      sendRichMessage: {
        operation: 'messages.send',
        token: '{{env.SLACK_BOT_TOKEN}}',
        channel: '#alerts',
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: 'System Alert'
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*Alert Type:* {{inputs.alert_type}}\n*Message:* {{inputs.message}}\n*Time:* {{now}}'
            }
          }
        ]
      },
      createChannel: {
        operation: 'channels.create',
        token: '{{env.SLACK_BOT_TOKEN}}',
        name: 'project-{{inputs.project_name}}',
        isPrivate: false
      },
      uploadFile: {
        operation: 'files.upload',
        token: '{{env.SLACK_BOT_TOKEN}}',
        channels: '#reports',
        filename: 'daily-report.pdf',
        title: 'Daily Report - {{inputs.date}}',
        content: '{{steps.generate_report.output.content}}'
      }
    };
  }
}

export default SlackNode;