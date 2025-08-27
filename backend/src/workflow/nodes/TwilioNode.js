import axios from 'axios';

/**
 * Twilio Node (SMS/Voice)
 * Send SMS, make calls, and interact with Twilio services
 */
class TwilioNode {
  static definition = {
    type: 'twilio',
    name: 'Twilio',
    description: 'Send SMS messages, make calls, and use Twilio services',
    icon: 'twilio.svg',
    operations: {
      sms: ['send', 'list', 'get'],
      calls: ['make', 'list', 'get', 'hangup'],
      verify: ['send', 'check'],
      whatsapp: ['send', 'list']
    },
    inputs: {
      operation: {
        type: 'string',
        required: true,
        description: 'The operation to perform (e.g., sms.send, calls.make)'
      },
      accountSid: {
        type: 'string',
        required: true,
        description: 'Twilio Account SID'
      },
      authToken: {
        type: 'string',
        required: true,
        description: 'Twilio Auth Token'
      },
      from: {
        type: 'string',
        description: 'Sender phone number (Twilio number)'
      },
      to: {
        type: 'string',
        description: 'Recipient phone number (E.164 format)'
      },
      body: {
        type: 'string',
        description: 'Message body (for SMS/WhatsApp)'
      },
      url: {
        type: 'string',
        description: 'TwiML URL for calls'
      },
      statusCallback: {
        type: 'string',
        description: 'Status callback URL'
      },
      statusCallbackEvent: {
        type: 'array',
        description: 'Events to track (initiated, ringing, answered, completed)'
      },
      statusCallbackMethod: {
        type: 'string',
        enum: ['GET', 'POST'],
        default: 'POST',
        description: 'HTTP method for status callback'
      },
      timeout: {
        type: 'number',
        default: 60,
        description: 'Call timeout in seconds'
      },
      record: {
        type: 'boolean',
        default: false,
        description: 'Record the call'
      },
      mediaUrl: {
        type: 'array',
        description: 'Media URLs for MMS'
      },
      serviceSid: {
        type: 'string',
        description: 'Verify Service SID (for verification)'
      },
      channel: {
        type: 'string',
        enum: ['sms', 'call'],
        default: 'sms',
        description: 'Verification channel'
      },
      code: {
        type: 'string',
        description: 'Verification code to check'
      },
      callSid: {
        type: 'string',
        description: 'Call SID (for call operations)'
      },
      messageSid: {
        type: 'string',
        description: 'Message SID (for message operations)'
      }
    },
    outputs: {
      success: 'Whether the operation succeeded',
      data: 'Response data from Twilio API',
      sid: 'Resource SID (message/call)',
      status: 'Status of the resource',
      error: 'Error message if operation failed'
    }
  };

  /**
   * Execute Twilio operation
   * @param {Object} step - Step definition
   * @param {Object} config - Resolved configuration
   * @param {Object} context - Execution context
   * @returns {Object} Operation result
   */
  static async execute(step, config, context) {
    try {
      // Parse operation (e.g., "sms.send" -> ["sms", "send"])
      const [service, action] = config.operation.split('.');
      
      if (!service || !action) {
        throw new Error('Operation must be in format "service.action" (e.g., "sms.send")');
      }

      // Create API client
      const client = TwilioNode.createClient(config);
      
      // Execute operation
      let result;
      switch (service) {
        case 'sms':
          result = await TwilioNode.handleSMS(client, action, config);
          break;
        case 'calls':
          result = await TwilioNode.handleCalls(client, action, config);
          break;
        case 'verify':
          result = await TwilioNode.handleVerify(client, action, config);
          break;
        case 'whatsapp':
          result = await TwilioNode.handleWhatsApp(client, action, config);
          break;
        default:
          throw new Error(`Unsupported service: ${service}`);
      }

      return {
        success: true,
        service,
        action,
        ...result
      };

    } catch (error) {
      console.error('Twilio operation failed:', error);
      
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
   * Create Twilio API client
   */
  static createClient(config) {
    const auth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64');
    
    return axios.create({
      baseURL: `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}`,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 30000
    });
  }

  /**
   * Handle SMS operations
   */
  static async handleSMS(client, action, config) {
    switch (action) {
      case 'send':
        if (!config.from) throw new Error('From number is required for SMS send');
        if (!config.to) throw new Error('To number is required for SMS send');
        if (!config.body) throw new Error('Message body is required for SMS send');

        const smsPayload = new URLSearchParams({
          From: config.from,
          To: config.to,
          Body: config.body
        });

        if (config.mediaUrl && Array.isArray(config.mediaUrl)) {
          config.mediaUrl.forEach(url => {
            smsPayload.append('MediaUrl', url);
          });
        }

        if (config.statusCallback) {
          smsPayload.append('StatusCallback', config.statusCallback);
        }

        if (config.statusCallbackMethod) {
          smsPayload.append('StatusCallbackMethod', config.statusCallbackMethod);
        }

        const smsResponse = await client.post('/Messages.json', smsPayload);
        
        return {
          data: smsResponse.data,
          sid: smsResponse.data.sid,
          status: smsResponse.data.status
        };

      case 'list':
        const listParams = new URLSearchParams();
        if (config.from) listParams.append('From', config.from);
        if (config.to) listParams.append('To', config.to);
        if (config.limit) listParams.append('PageSize', config.limit.toString());

        const listResponse = await client.get(`/Messages.json?${listParams}`);
        
        return {
          data: listResponse.data.messages,
          count: listResponse.data.messages.length
        };

      case 'get':
        if (!config.messageSid) throw new Error('Message SID is required for get operation');

        const getResponse = await client.get(`/Messages/${config.messageSid}.json`);
        
        return {
          data: getResponse.data,
          sid: getResponse.data.sid,
          status: getResponse.data.status
        };

      default:
        throw new Error(`Unsupported SMS action: ${action}`);
    }
  }

  /**
   * Handle Call operations
   */
  static async handleCalls(client, action, config) {
    switch (action) {
      case 'make':
        if (!config.from) throw new Error('From number is required for call');
        if (!config.to) throw new Error('To number is required for call');
        if (!config.url) throw new Error('TwiML URL is required for call');

        const callPayload = new URLSearchParams({
          From: config.from,
          To: config.to,
          Url: config.url,
          Timeout: (config.timeout || 60).toString(),
          Record: config.record ? 'true' : 'false'
        });

        if (config.statusCallback) {
          callPayload.append('StatusCallback', config.statusCallback);
          if (config.statusCallbackEvent && Array.isArray(config.statusCallbackEvent)) {
            config.statusCallbackEvent.forEach(event => {
              callPayload.append('StatusCallbackEvent', event);
            });
          }
          if (config.statusCallbackMethod) {
            callPayload.append('StatusCallbackMethod', config.statusCallbackMethod);
          }
        }

        const callResponse = await client.post('/Calls.json', callPayload);
        
        return {
          data: callResponse.data,
          sid: callResponse.data.sid,
          status: callResponse.data.status
        };

      case 'list':
        const listParams = new URLSearchParams();
        if (config.from) listParams.append('From', config.from);
        if (config.to) listParams.append('To', config.to);
        if (config.status) listParams.append('Status', config.status);
        if (config.limit) listParams.append('PageSize', config.limit.toString());

        const listResponse = await client.get(`/Calls.json?${listParams}`);
        
        return {
          data: listResponse.data.calls,
          count: listResponse.data.calls.length
        };

      case 'get':
        if (!config.callSid) throw new Error('Call SID is required for get operation');

        const getResponse = await client.get(`/Calls/${config.callSid}.json`);
        
        return {
          data: getResponse.data,
          sid: getResponse.data.sid,
          status: getResponse.data.status
        };

      case 'hangup':
        if (!config.callSid) throw new Error('Call SID is required for hangup operation');

        const hangupPayload = new URLSearchParams({
          Status: 'completed'
        });

        const hangupResponse = await client.post(`/Calls/${config.callSid}.json`, hangupPayload);
        
        return {
          data: hangupResponse.data,
          sid: hangupResponse.data.sid,
          status: hangupResponse.data.status
        };

      default:
        throw new Error(`Unsupported call action: ${action}`);
    }
  }

  /**
   * Handle Verify operations
   */
  static async handleVerify(client, action, config) {
    const verifyClient = axios.create({
      baseURL: 'https://verify.twilio.com/v2',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 30000
    });

    switch (action) {
      case 'send':
        if (!config.serviceSid) throw new Error('Service SID is required for verification');
        if (!config.to) throw new Error('To number is required for verification');

        const sendPayload = new URLSearchParams({
          To: config.to,
          Channel: config.channel || 'sms'
        });

        const sendResponse = await verifyClient.post(`/Services/${config.serviceSid}/Verifications`, sendPayload);
        
        return {
          data: sendResponse.data,
          sid: sendResponse.data.sid,
          status: sendResponse.data.status
        };

      case 'check':
        if (!config.serviceSid) throw new Error('Service SID is required for verification check');
        if (!config.to) throw new Error('To number is required for verification check');
        if (!config.code) throw new Error('Verification code is required for check');

        const checkPayload = new URLSearchParams({
          To: config.to,
          Code: config.code
        });

        const checkResponse = await verifyClient.post(`/Services/${config.serviceSid}/VerificationCheck`, checkPayload);
        
        return {
          data: checkResponse.data,
          status: checkResponse.data.status,
          valid: checkResponse.data.status === 'approved'
        };

      default:
        throw new Error(`Unsupported verify action: ${action}`);
    }
  }

  /**
   * Handle WhatsApp operations
   */
  static async handleWhatsApp(client, action, config) {
    switch (action) {
      case 'send':
        if (!config.from) throw new Error('From number is required for WhatsApp send (must include whatsapp: prefix)');
        if (!config.to) throw new Error('To number is required for WhatsApp send (must include whatsapp: prefix)');
        if (!config.body) throw new Error('Message body is required for WhatsApp send');

        const whatsappPayload = new URLSearchParams({
          From: config.from.startsWith('whatsapp:') ? config.from : `whatsapp:${config.from}`,
          To: config.to.startsWith('whatsapp:') ? config.to : `whatsapp:${config.to}`,
          Body: config.body
        });

        if (config.mediaUrl && Array.isArray(config.mediaUrl)) {
          config.mediaUrl.forEach(url => {
            whatsappPayload.append('MediaUrl', url);
          });
        }

        if (config.statusCallback) {
          whatsappPayload.append('StatusCallback', config.statusCallback);
        }

        const whatsappResponse = await client.post('/Messages.json', whatsappPayload);
        
        return {
          data: whatsappResponse.data,
          sid: whatsappResponse.data.sid,
          status: whatsappResponse.data.status
        };

      case 'list':
        const listParams = new URLSearchParams();
        if (config.from) {
          const fromNumber = config.from.startsWith('whatsapp:') ? config.from : `whatsapp:${config.from}`;
          listParams.append('From', fromNumber);
        }
        if (config.to) {
          const toNumber = config.to.startsWith('whatsapp:') ? config.to : `whatsapp:${config.to}`;
          listParams.append('To', toNumber);
        }
        if (config.limit) listParams.append('PageSize', config.limit.toString());

        const listResponse = await client.get(`/Messages.json?${listParams}`);
        
        // Filter WhatsApp messages
        const whatsappMessages = listResponse.data.messages.filter(msg => 
          msg.from.startsWith('whatsapp:') || msg.to.startsWith('whatsapp:')
        );
        
        return {
          data: whatsappMessages,
          count: whatsappMessages.length
        };

      default:
        throw new Error(`Unsupported WhatsApp action: ${action}`);
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
      errors.push('Operation must be in format "service.action"');
    }

    if (!config.accountSid) {
      errors.push('Account SID is required');
    }

    if (!config.authToken) {
      errors.push('Auth Token is required');
    }

    const [service, action] = config.operation.split('.');
    
    if (service === 'sms' && action === 'send') {
      if (!config.from || !config.to || !config.body) {
        errors.push('From, To, and Body are required for SMS send');
      }
    }

    if (service === 'calls' && action === 'make') {
      if (!config.from || !config.to || !config.url) {
        errors.push('From, To, and TwiML URL are required for making calls');
      }
    }

    return errors;
  }

  /**
   * Get example configurations
   */
  static getExamples() {
    return {
      sendSMS: {
        operation: 'sms.send',
        accountSid: '{{env.TWILIO_ACCOUNT_SID}}',
        authToken: '{{env.TWILIO_AUTH_TOKEN}}',
        from: '{{env.TWILIO_PHONE_NUMBER}}',
        to: '{{inputs.customer_phone}}',
        body: 'Your order #{{inputs.order_id}} has been shipped! Track it here: {{inputs.tracking_url}}'
      },
      sendMMS: {
        operation: 'sms.send',
        accountSid: '{{env.TWILIO_ACCOUNT_SID}}',
        authToken: '{{env.TWILIO_AUTH_TOKEN}}',
        from: '{{env.TWILIO_PHONE_NUMBER}}',
        to: '{{inputs.customer_phone}}',
        body: 'Here is your receipt:',
        mediaUrl: ['{{steps.generate_receipt.output.image_url}}']
      },
      makeCall: {
        operation: 'calls.make',
        accountSid: '{{env.TWILIO_ACCOUNT_SID}}',
        authToken: '{{env.TWILIO_AUTH_TOKEN}}',
        from: '{{env.TWILIO_PHONE_NUMBER}}',
        to: '{{inputs.customer_phone}}',
        url: 'https://your-domain.com/twiml/order-confirmation',
        record: true,
        statusCallback: 'https://your-domain.com/call-status'
      },
      sendVerification: {
        operation: 'verify.send',
        accountSid: '{{env.TWILIO_ACCOUNT_SID}}',
        authToken: '{{env.TWILIO_AUTH_TOKEN}}',
        serviceSid: '{{env.TWILIO_VERIFY_SERVICE_SID}}',
        to: '{{inputs.phone_number}}',
        channel: 'sms'
      },
      checkVerification: {
        operation: 'verify.check',
        accountSid: '{{env.TWILIO_ACCOUNT_SID}}',
        authToken: '{{env.TWILIO_AUTH_TOKEN}}',
        serviceSid: '{{env.TWILIO_VERIFY_SERVICE_SID}}',
        to: '{{inputs.phone_number}}',
        code: '{{inputs.verification_code}}'
      },
      sendWhatsApp: {
        operation: 'whatsapp.send',
        accountSid: '{{env.TWILIO_ACCOUNT_SID}}',
        authToken: '{{env.TWILIO_AUTH_TOKEN}}',
        from: 'whatsapp:{{env.TWILIO_WHATSAPP_NUMBER}}',
        to: 'whatsapp:{{inputs.customer_phone}}',
        body: 'Hello! Your order #{{inputs.order_id}} is ready for pickup.'
      }
    };
  }
}

export default TwilioNode;