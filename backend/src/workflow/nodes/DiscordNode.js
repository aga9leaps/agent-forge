import axios from 'axios';

/**
 * Discord Node
 * Send messages, manage channels, and interact with Discord servers
 */
class DiscordNode {
  static definition = {
    type: 'discord',
    name: 'Discord',
    description: 'Send messages and interact with Discord servers',
    icon: 'discord.svg',
    operations: {
      messages: ['send', 'edit', 'delete', 'get'],
      channels: ['list', 'get', 'create', 'modify'],
      guilds: ['get', 'list', 'members'],
      webhooks: ['send', 'create', 'list', 'delete']
    },
    inputs: {
      operation: {
        type: 'string',
        required: true,
        description: 'The operation to perform (e.g., messages.send, webhooks.send)'
      },
      token: {
        type: 'string',
        description: 'Discord Bot Token (for bot operations)'
      },
      webhookUrl: {
        type: 'string',
        description: 'Discord Webhook URL (for webhook operations)'
      },
      channelId: {
        type: 'string',
        description: 'Discord Channel ID'
      },
      messageId: {
        type: 'string',
        description: 'Discord Message ID (for edit/delete operations)'
      },
      guildId: {
        type: 'string',
        description: 'Discord Server (Guild) ID'
      },
      content: {
        type: 'string',
        description: 'Message content'
      },
      embeds: {
        type: 'array',
        description: 'Rich embed objects'
      },
      files: {
        type: 'array',
        description: 'File attachments'
      },
      username: {
        type: 'string',
        description: 'Webhook username override'
      },
      avatarUrl: {
        type: 'string',
        description: 'Webhook avatar URL override'
      },
      tts: {
        type: 'boolean',
        default: false,
        description: 'Send as text-to-speech message'
      },
      allowedMentions: {
        type: 'object',
        description: 'Controls mentions (@everyone, @here, @role, @user)'
      },
      components: {
        type: 'array',
        description: 'Message components (buttons, select menus)'
      },
      threadId: {
        type: 'string',
        description: 'Thread ID (for thread messages)'
      }
    },
    outputs: {
      success: 'Whether the operation succeeded',
      data: 'Response data from Discord API',
      messageId: 'ID of sent/updated message',
      error: 'Error message if operation failed'
    }
  };

  /**
   * Execute Discord operation
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
          result = await DiscordNode.handleMessages(action, config);
          break;
        case 'channels':
          result = await DiscordNode.handleChannels(action, config);
          break;
        case 'guilds':
          result = await DiscordNode.handleGuilds(action, config);
          break;
        case 'webhooks':
          result = await DiscordNode.handleWebhooks(action, config);
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
      console.error('Discord operation failed:', error);
      
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
   * Create Discord API client
   */
  static createClient(config) {
    if (!config.token) {
      throw new Error('Discord token is required for bot operations');
    }

    return axios.create({
      baseURL: 'https://discord.com/api/v10',
      headers: {
        'Authorization': `Bot ${config.token}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  /**
   * Create webhook client
   */
  static createWebhookClient(webhookUrl) {
    return axios.create({
      timeout: 30000
    });
  }

  /**
   * Handle message operations
   */
  static async handleMessages(action, config) {
    const client = DiscordNode.createClient(config);

    switch (action) {
      case 'send':
        if (!config.channelId) throw new Error('Channel ID is required for send operation');
        if (!config.content && !config.embeds) throw new Error('Either content or embeds is required');

        const sendPayload = {
          content: config.content,
          tts: config.tts || false
        };

        if (config.embeds) sendPayload.embeds = config.embeds;
        if (config.components) sendPayload.components = config.components;
        if (config.allowedMentions) sendPayload.allowed_mentions = config.allowedMentions;

        const sendResponse = await client.post(`/channels/${config.channelId}/messages`, sendPayload);
        
        return {
          data: sendResponse.data,
          messageId: sendResponse.data.id
        };

      case 'edit':
        if (!config.channelId) throw new Error('Channel ID is required for edit operation');
        if (!config.messageId) throw new Error('Message ID is required for edit operation');
        if (!config.content && !config.embeds) throw new Error('Either content or embeds is required');

        const editPayload = {
          content: config.content
        };

        if (config.embeds) editPayload.embeds = config.embeds;
        if (config.components) editPayload.components = config.components;
        if (config.allowedMentions) editPayload.allowed_mentions = config.allowedMentions;

        const editResponse = await client.patch(`/channels/${config.channelId}/messages/${config.messageId}`, editPayload);
        
        return {
          data: editResponse.data,
          messageId: editResponse.data.id
        };

      case 'delete':
        if (!config.channelId) throw new Error('Channel ID is required for delete operation');
        if (!config.messageId) throw new Error('Message ID is required for delete operation');

        await client.delete(`/channels/${config.channelId}/messages/${config.messageId}`);
        
        return {
          data: { deleted: true },
          messageId: config.messageId
        };

      case 'get':
        if (!config.channelId) throw new Error('Channel ID is required for get operation');
        if (!config.messageId) throw new Error('Message ID is required for get operation');

        const getResponse = await client.get(`/channels/${config.channelId}/messages/${config.messageId}`);
        
        return {
          data: getResponse.data,
          messageId: getResponse.data.id
        };

      default:
        throw new Error(`Unsupported message action: ${action}`);
    }
  }

  /**
   * Handle channel operations
   */
  static async handleChannels(action, config) {
    const client = DiscordNode.createClient(config);

    switch (action) {
      case 'get':
        if (!config.channelId) throw new Error('Channel ID is required for get operation');

        const getResponse = await client.get(`/channels/${config.channelId}`);
        
        return {
          data: getResponse.data
        };

      case 'list':
        if (!config.guildId) throw new Error('Guild ID is required for list operation');

        const listResponse = await client.get(`/guilds/${config.guildId}/channels`);
        
        return {
          data: listResponse.data,
          count: listResponse.data.length
        };

      case 'create':
        if (!config.guildId) throw new Error('Guild ID is required for create operation');
        if (!config.name) throw new Error('Channel name is required for create operation');

        const createPayload = {
          name: config.name,
          type: config.type || 0, // 0 = text channel
          topic: config.topic,
          bitrate: config.bitrate,
          user_limit: config.userLimit,
          rate_limit_per_user: config.rateLimitPerUser,
          position: config.position,
          permission_overwrites: config.permissionOverwrites,
          parent_id: config.parentId,
          nsfw: config.nsfw || false
        };

        const createResponse = await client.post(`/guilds/${config.guildId}/channels`, createPayload);
        
        return {
          data: createResponse.data
        };

      case 'modify':
        if (!config.channelId) throw new Error('Channel ID is required for modify operation');

        const modifyPayload = {};
        if (config.name) modifyPayload.name = config.name;
        if (config.topic !== undefined) modifyPayload.topic = config.topic;
        if (config.bitrate) modifyPayload.bitrate = config.bitrate;
        if (config.userLimit) modifyPayload.user_limit = config.userLimit;
        if (config.rateLimitPerUser) modifyPayload.rate_limit_per_user = config.rateLimitPerUser;
        if (config.position) modifyPayload.position = config.position;
        if (config.permissionOverwrites) modifyPayload.permission_overwrites = config.permissionOverwrites;
        if (config.parentId) modifyPayload.parent_id = config.parentId;
        if (config.nsfw !== undefined) modifyPayload.nsfw = config.nsfw;

        const modifyResponse = await client.patch(`/channels/${config.channelId}`, modifyPayload);
        
        return {
          data: modifyResponse.data
        };

      default:
        throw new Error(`Unsupported channel action: ${action}`);
    }
  }

  /**
   * Handle guild operations
   */
  static async handleGuilds(action, config) {
    const client = DiscordNode.createClient(config);

    switch (action) {
      case 'get':
        if (!config.guildId) throw new Error('Guild ID is required for get operation');

        const getResponse = await client.get(`/guilds/${config.guildId}`);
        
        return {
          data: getResponse.data
        };

      case 'list':
        const listResponse = await client.get('/users/@me/guilds');
        
        return {
          data: listResponse.data,
          count: listResponse.data.length
        };

      case 'members':
        if (!config.guildId) throw new Error('Guild ID is required for members operation');

        const membersResponse = await client.get(`/guilds/${config.guildId}/members`, {
          params: {
            limit: config.limit || 1000
          }
        });
        
        return {
          data: membersResponse.data,
          count: membersResponse.data.length
        };

      default:
        throw new Error(`Unsupported guild action: ${action}`);
    }
  }

  /**
   * Handle webhook operations
   */
  static async handleWebhooks(action, config) {
    switch (action) {
      case 'send':
        if (!config.webhookUrl) throw new Error('Webhook URL is required for send operation');
        if (!config.content && !config.embeds) throw new Error('Either content or embeds is required');

        const client = DiscordNode.createWebhookClient(config.webhookUrl);
        const sendPayload = {
          content: config.content,
          username: config.username,
          avatar_url: config.avatarUrl,
          tts: config.tts || false
        };

        if (config.embeds) sendPayload.embeds = config.embeds;
        if (config.allowedMentions) sendPayload.allowed_mentions = config.allowedMentions;
        if (config.components) sendPayload.components = config.components;

        // Add thread_id to query params if specified
        const url = config.threadId 
          ? `${config.webhookUrl}?thread_id=${config.threadId}` 
          : config.webhookUrl;

        const sendResponse = await client.post(url, sendPayload);
        
        return {
          data: sendResponse.data,
          messageId: sendResponse.data?.id
        };

      case 'create':
        if (!config.channelId) throw new Error('Channel ID is required for create webhook');
        if (!config.name) throw new Error('Webhook name is required');

        const botClient = DiscordNode.createClient(config);
        const createPayload = {
          name: config.name,
          avatar: config.avatar
        };

        const createResponse = await botClient.post(`/channels/${config.channelId}/webhooks`, createPayload);
        
        return {
          data: createResponse.data
        };

      case 'list':
        if (!config.channelId && !config.guildId) {
          throw new Error('Either channel ID or guild ID is required for list webhooks');
        }

        const listClient = DiscordNode.createClient(config);
        const endpoint = config.channelId 
          ? `/channels/${config.channelId}/webhooks`
          : `/guilds/${config.guildId}/webhooks`;

        const listResponse = await listClient.get(endpoint);
        
        return {
          data: listResponse.data,
          count: listResponse.data.length
        };

      case 'delete':
        if (!config.webhookId) throw new Error('Webhook ID is required for delete operation');

        const deleteClient = DiscordNode.createClient(config);
        await deleteClient.delete(`/webhooks/${config.webhookId}`);
        
        return {
          data: { deleted: true }
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
    } else if (resource !== 'webhooks' || (resource === 'webhooks' && action !== 'send')) {
      // Bot operations require token
      if (!config.token) {
        errors.push('Discord token is required for bot operations');
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
        token: '{{env.DISCORD_BOT_TOKEN}}',
        channelId: '{{env.DISCORD_CHANNEL_ID}}',
        content: 'Order #{{inputs.order_id}} has been processed successfully! 🎉'
      },
      sendRichEmbed: {
        operation: 'messages.send',
        token: '{{env.DISCORD_BOT_TOKEN}}',
        channelId: '{{env.DISCORD_CHANNEL_ID}}',
        embeds: [
          {
            title: 'System Alert',
            description: '{{inputs.message}}',
            color: 0xff0000,
            fields: [
              {
                name: 'Alert Type',
                value: '{{inputs.alert_type}}',
                inline: true
              },
              {
                name: 'Timestamp',
                value: '{{now}}',
                inline: true
              }
            ],
            footer: {
              text: 'Automated Alert System'
            }
          }
        ]
      },
      webhookMessage: {
        operation: 'webhooks.send',
        webhookUrl: '{{env.DISCORD_WEBHOOK_URL}}',
        content: 'New customer signup: {{inputs.customer_name}} ({{inputs.email}})',
        username: 'SignupBot',
        avatarUrl: 'https://example.com/bot-avatar.png'
      },
      createChannel: {
        operation: 'channels.create',
        token: '{{env.DISCORD_BOT_TOKEN}}',
        guildId: '{{env.DISCORD_GUILD_ID}}',
        name: 'project-{{inputs.project_name}}',
        type: 0,
        topic: 'Discussion for {{inputs.project_name}} project'
      }
    };
  }
}

export default DiscordNode;