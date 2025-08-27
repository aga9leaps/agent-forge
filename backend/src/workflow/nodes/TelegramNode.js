import axios from 'axios';

/**
 * Telegram Node
 * Send messages, photos, documents via Telegram Bot API
 */
class TelegramNode {
  static definition = {
    type: 'telegram',
    name: 'Telegram',
    description: 'Send messages and media via Telegram Bot API',
    icon: 'telegram.svg',
    operations: [
      'sendMessage', 'sendPhoto', 'sendDocument', 'sendVideo', 
      'sendAudio', 'sendLocation', 'sendContact', 'editMessage', 
      'deleteMessage', 'getUpdates', 'getChat', 'getChatMember'
    ],
    inputs: {
      operation: {
        type: 'string',
        enum: [
          'sendMessage', 'sendPhoto', 'sendDocument', 'sendVideo',
          'sendAudio', 'sendLocation', 'sendContact', 'editMessage',
          'deleteMessage', 'getUpdates', 'getChat', 'getChatMember'
        ],
        required: true,
        description: 'The operation to perform'
      },
      botToken: {
        type: 'string',
        required: true,
        description: 'Telegram Bot Token (from @BotFather)'
      },
      chatId: {
        type: 'string',
        description: 'Chat ID, username (@username), or channel ID'
      },
      text: {
        type: 'string',
        description: 'Message text (for text messages)'
      },
      parseMode: {
        type: 'string',
        enum: ['Markdown', 'MarkdownV2', 'HTML'],
        description: 'Text parsing mode'
      },
      disableWebPagePreview: {
        type: 'boolean',
        default: false,
        description: 'Disable link previews'
      },
      disableNotification: {
        type: 'boolean',
        default: false,
        description: 'Send silently'
      },
      replyToMessageId: {
        type: 'number',
        description: 'Message ID to reply to'
      },
      messageId: {
        type: 'number',
        description: 'Message ID (for edit/delete operations)'
      },
      photo: {
        type: 'string',
        description: 'Photo file path, URL, or file_id'
      },
      document: {
        type: 'string',
        description: 'Document file path, URL, or file_id'
      },
      video: {
        type: 'string',
        description: 'Video file path, URL, or file_id'
      },
      audio: {
        type: 'string',
        description: 'Audio file path, URL, or file_id'
      },
      caption: {
        type: 'string',
        description: 'Media caption'
      },
      latitude: {
        type: 'number',
        description: 'Location latitude'
      },
      longitude: {
        type: 'number',
        description: 'Location longitude'
      },
      phoneNumber: {
        type: 'string',
        description: 'Contact phone number'
      },
      firstName: {
        type: 'string',
        description: 'Contact first name'
      },
      lastName: {
        type: 'string',
        description: 'Contact last name'
      },
      userId: {
        type: 'number',
        description: 'User ID (for getChatMember operation)'
      },
      inlineKeyboard: {
        type: 'array',
        description: 'Inline keyboard markup'
      }
    },
    outputs: {
      success: 'Whether the operation succeeded',
      data: 'Response data from Telegram API',
      messageId: 'ID of sent/updated message',
      error: 'Error message if operation failed'
    }
  };

  /**
   * Execute Telegram operation
   * @param {Object} step - Step definition
   * @param {Object} config - Resolved configuration
   * @param {Object} context - Execution context
   * @returns {Object} Operation result
   */
  static async execute(step, config, context) {
    try {
      // Create API client
      const client = TelegramNode.createClient(config);
      
      let result;
      switch (config.operation) {
        case 'sendMessage':
          result = await TelegramNode.sendMessage(client, config);
          break;
        case 'sendPhoto':
          result = await TelegramNode.sendPhoto(client, config);
          break;
        case 'sendDocument':
          result = await TelegramNode.sendDocument(client, config);
          break;
        case 'sendVideo':
          result = await TelegramNode.sendVideo(client, config);
          break;
        case 'sendAudio':
          result = await TelegramNode.sendAudio(client, config);
          break;
        case 'sendLocation':
          result = await TelegramNode.sendLocation(client, config);
          break;
        case 'sendContact':
          result = await TelegramNode.sendContact(client, config);
          break;
        case 'editMessage':
          result = await TelegramNode.editMessage(client, config);
          break;
        case 'deleteMessage':
          result = await TelegramNode.deleteMessage(client, config);
          break;
        case 'getUpdates':
          result = await TelegramNode.getUpdates(client, config);
          break;
        case 'getChat':
          result = await TelegramNode.getChat(client, config);
          break;
        case 'getChatMember':
          result = await TelegramNode.getChatMember(client, config);
          break;
        default:
          throw new Error(`Unsupported operation: ${config.operation}`);
      }

      return {
        success: true,
        operation: config.operation,
        ...result
      };

    } catch (error) {
      console.error('Telegram operation failed:', error);
      
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
   * Create Telegram API client
   */
  static createClient(config) {
    return axios.create({
      baseURL: `https://api.telegram.org/bot${config.botToken}`,
      timeout: 30000
    });
  }

  /**
   * Send text message
   */
  static async sendMessage(client, config) {
    if (!config.chatId) throw new Error('Chat ID is required for sendMessage');
    if (!config.text) throw new Error('Text is required for sendMessage');

    const payload = {
      chat_id: config.chatId,
      text: config.text,
      parse_mode: config.parseMode,
      disable_web_page_preview: config.disableWebPagePreview,
      disable_notification: config.disableNotification,
      reply_to_message_id: config.replyToMessageId
    };

    if (config.inlineKeyboard) {
      payload.reply_markup = {
        inline_keyboard: config.inlineKeyboard
      };
    }

    const response = await client.post('/sendMessage', payload);
    
    if (!response.data.ok) {
      throw new Error(`Telegram API error: ${response.data.description}`);
    }

    return {
      data: response.data.result,
      messageId: response.data.result.message_id
    };
  }

  /**
   * Send photo
   */
  static async sendPhoto(client, config) {
    if (!config.chatId) throw new Error('Chat ID is required for sendPhoto');
    if (!config.photo) throw new Error('Photo is required for sendPhoto');

    const payload = {
      chat_id: config.chatId,
      photo: config.photo,
      caption: config.caption,
      parse_mode: config.parseMode,
      disable_notification: config.disableNotification,
      reply_to_message_id: config.replyToMessageId
    };

    if (config.inlineKeyboard) {
      payload.reply_markup = {
        inline_keyboard: config.inlineKeyboard
      };
    }

    const response = await client.post('/sendPhoto', payload);
    
    if (!response.data.ok) {
      throw new Error(`Telegram API error: ${response.data.description}`);
    }

    return {
      data: response.data.result,
      messageId: response.data.result.message_id
    };
  }

  /**
   * Send document
   */
  static async sendDocument(client, config) {
    if (!config.chatId) throw new Error('Chat ID is required for sendDocument');
    if (!config.document) throw new Error('Document is required for sendDocument');

    const payload = {
      chat_id: config.chatId,
      document: config.document,
      caption: config.caption,
      parse_mode: config.parseMode,
      disable_notification: config.disableNotification,
      reply_to_message_id: config.replyToMessageId
    };

    if (config.inlineKeyboard) {
      payload.reply_markup = {
        inline_keyboard: config.inlineKeyboard
      };
    }

    const response = await client.post('/sendDocument', payload);
    
    if (!response.data.ok) {
      throw new Error(`Telegram API error: ${response.data.description}`);
    }

    return {
      data: response.data.result,
      messageId: response.data.result.message_id
    };
  }

  /**
   * Send video
   */
  static async sendVideo(client, config) {
    if (!config.chatId) throw new Error('Chat ID is required for sendVideo');
    if (!config.video) throw new Error('Video is required for sendVideo');

    const payload = {
      chat_id: config.chatId,
      video: config.video,
      caption: config.caption,
      parse_mode: config.parseMode,
      disable_notification: config.disableNotification,
      reply_to_message_id: config.replyToMessageId
    };

    if (config.inlineKeyboard) {
      payload.reply_markup = {
        inline_keyboard: config.inlineKeyboard
      };
    }

    const response = await client.post('/sendVideo', payload);
    
    if (!response.data.ok) {
      throw new Error(`Telegram API error: ${response.data.description}`);
    }

    return {
      data: response.data.result,
      messageId: response.data.result.message_id
    };
  }

  /**
   * Send audio
   */
  static async sendAudio(client, config) {
    if (!config.chatId) throw new Error('Chat ID is required for sendAudio');
    if (!config.audio) throw new Error('Audio is required for sendAudio');

    const payload = {
      chat_id: config.chatId,
      audio: config.audio,
      caption: config.caption,
      parse_mode: config.parseMode,
      disable_notification: config.disableNotification,
      reply_to_message_id: config.replyToMessageId
    };

    if (config.inlineKeyboard) {
      payload.reply_markup = {
        inline_keyboard: config.inlineKeyboard
      };
    }

    const response = await client.post('/sendAudio', payload);
    
    if (!response.data.ok) {
      throw new Error(`Telegram API error: ${response.data.description}`);
    }

    return {
      data: response.data.result,
      messageId: response.data.result.message_id
    };
  }

  /**
   * Send location
   */
  static async sendLocation(client, config) {
    if (!config.chatId) throw new Error('Chat ID is required for sendLocation');
    if (config.latitude === undefined || config.longitude === undefined) {
      throw new Error('Latitude and longitude are required for sendLocation');
    }

    const payload = {
      chat_id: config.chatId,
      latitude: config.latitude,
      longitude: config.longitude,
      disable_notification: config.disableNotification,
      reply_to_message_id: config.replyToMessageId
    };

    if (config.inlineKeyboard) {
      payload.reply_markup = {
        inline_keyboard: config.inlineKeyboard
      };
    }

    const response = await client.post('/sendLocation', payload);
    
    if (!response.data.ok) {
      throw new Error(`Telegram API error: ${response.data.description}`);
    }

    return {
      data: response.data.result,
      messageId: response.data.result.message_id
    };
  }

  /**
   * Send contact
   */
  static async sendContact(client, config) {
    if (!config.chatId) throw new Error('Chat ID is required for sendContact');
    if (!config.phoneNumber) throw new Error('Phone number is required for sendContact');
    if (!config.firstName) throw new Error('First name is required for sendContact');

    const payload = {
      chat_id: config.chatId,
      phone_number: config.phoneNumber,
      first_name: config.firstName,
      last_name: config.lastName,
      disable_notification: config.disableNotification,
      reply_to_message_id: config.replyToMessageId
    };

    if (config.inlineKeyboard) {
      payload.reply_markup = {
        inline_keyboard: config.inlineKeyboard
      };
    }

    const response = await client.post('/sendContact', payload);
    
    if (!response.data.ok) {
      throw new Error(`Telegram API error: ${response.data.description}`);
    }

    return {
      data: response.data.result,
      messageId: response.data.result.message_id
    };
  }

  /**
   * Edit message text
   */
  static async editMessage(client, config) {
    if (!config.chatId) throw new Error('Chat ID is required for editMessage');
    if (!config.messageId) throw new Error('Message ID is required for editMessage');
    if (!config.text) throw new Error('Text is required for editMessage');

    const payload = {
      chat_id: config.chatId,
      message_id: config.messageId,
      text: config.text,
      parse_mode: config.parseMode,
      disable_web_page_preview: config.disableWebPagePreview
    };

    if (config.inlineKeyboard) {
      payload.reply_markup = {
        inline_keyboard: config.inlineKeyboard
      };
    }

    const response = await client.post('/editMessageText', payload);
    
    if (!response.data.ok) {
      throw new Error(`Telegram API error: ${response.data.description}`);
    }

    return {
      data: response.data.result,
      messageId: config.messageId
    };
  }

  /**
   * Delete message
   */
  static async deleteMessage(client, config) {
    if (!config.chatId) throw new Error('Chat ID is required for deleteMessage');
    if (!config.messageId) throw new Error('Message ID is required for deleteMessage');

    const response = await client.post('/deleteMessage', {
      chat_id: config.chatId,
      message_id: config.messageId
    });
    
    if (!response.data.ok) {
      throw new Error(`Telegram API error: ${response.data.description}`);
    }

    return {
      data: { deleted: true },
      messageId: config.messageId
    };
  }

  /**
   * Get updates
   */
  static async getUpdates(client, config) {
    const payload = {
      offset: config.offset,
      limit: config.limit || 100,
      timeout: config.timeout || 0
    };

    const response = await client.post('/getUpdates', payload);
    
    if (!response.data.ok) {
      throw new Error(`Telegram API error: ${response.data.description}`);
    }

    return {
      data: response.data.result,
      count: response.data.result.length
    };
  }

  /**
   * Get chat information
   */
  static async getChat(client, config) {
    if (!config.chatId) throw new Error('Chat ID is required for getChat');

    const response = await client.post('/getChat', {
      chat_id: config.chatId
    });
    
    if (!response.data.ok) {
      throw new Error(`Telegram API error: ${response.data.description}`);
    }

    return {
      data: response.data.result
    };
  }

  /**
   * Get chat member information
   */
  static async getChatMember(client, config) {
    if (!config.chatId) throw new Error('Chat ID is required for getChatMember');
    if (!config.userId) throw new Error('User ID is required for getChatMember');

    const response = await client.post('/getChatMember', {
      chat_id: config.chatId,
      user_id: config.userId
    });
    
    if (!response.data.ok) {
      throw new Error(`Telegram API error: ${response.data.description}`);
    }

    return {
      data: response.data.result
    };
  }

  /**
   * Validate configuration
   */
  static validate(config) {
    const errors = [];

    if (!config.operation) {
      errors.push('Operation is required');
    }

    if (!config.botToken) {
      errors.push('Bot token is required');
    }

    const requiresChatId = [
      'sendMessage', 'sendPhoto', 'sendDocument', 'sendVideo',
      'sendAudio', 'sendLocation', 'sendContact', 'editMessage',
      'deleteMessage', 'getChat', 'getChatMember'
    ];

    if (requiresChatId.includes(config.operation) && !config.chatId) {
      errors.push(`Chat ID is required for ${config.operation} operation`);
    }

    return errors;
  }

  /**
   * Get example configurations
   */
  static getExamples() {
    return {
      sendNotification: {
        operation: 'sendMessage',
        botToken: '{{env.TELEGRAM_BOT_TOKEN}}',
        chatId: '{{env.TELEGRAM_CHAT_ID}}',
        text: 'Order #{{inputs.order_id}} has been processed successfully!',
        parseMode: 'Markdown'
      },
      sendAlert: {
        operation: 'sendMessage',
        botToken: '{{env.TELEGRAM_BOT_TOKEN}}',
        chatId: '@alerts_channel',
        text: '*ALERT:* {{inputs.alert_type}}\n\n{{inputs.message}}\n\n_Time:_ {{now}}',
        parseMode: 'Markdown',
        disableNotification: false
      },
      sendDocument: {
        operation: 'sendDocument',
        botToken: '{{env.TELEGRAM_BOT_TOKEN}}',
        chatId: '{{inputs.user_id}}',
        document: '{{steps.generate_report.output.file_path}}',
        caption: 'Daily Report - {{inputs.date}}'
      },
      sendLocation: {
        operation: 'sendLocation',
        botToken: '{{env.TELEGRAM_BOT_TOKEN}}',
        chatId: '{{inputs.chat_id}}',
        latitude: '{{inputs.latitude}}',
        longitude: '{{inputs.longitude}}'
      }
    };
  }
}

export default TelegramNode;