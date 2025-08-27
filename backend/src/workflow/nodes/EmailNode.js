import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import path from 'path';

/**
 * Email Node
 * Send emails via SMTP, Gmail, or other email providers
 */
class EmailNode {
  static definition = {
    type: 'email',
    name: 'Email',
    description: 'Send emails via SMTP, Gmail, or other email providers',
    icon: 'email.svg',
    providers: ['smtp', 'gmail', 'outlook', 'sendgrid', 'mailgun'],
    inputs: {
      provider: {
        type: 'string',
        enum: ['smtp', 'gmail', 'outlook', 'sendgrid', 'mailgun'],
        default: 'smtp',
        description: 'Email service provider'
      },
      to: {
        type: 'array',
        required: true,
        description: 'Recipient email addresses'
      },
      cc: {
        type: 'array',
        description: 'CC recipients'
      },
      bcc: {
        type: 'array',
        description: 'BCC recipients'
      },
      from: {
        type: 'string',
        description: 'Sender email address (defaults to configured sender)'
      },
      replyTo: {
        type: 'string',
        description: 'Reply-to email address'
      },
      subject: {
        type: 'string',
        required: true,
        description: 'Email subject line'
      },
      body: {
        type: 'string',
        required: true,
        description: 'Email body content'
      },
      bodyType: {
        type: 'string',
        enum: ['text', 'html'],
        default: 'html',
        description: 'Email body format'
      },
      attachments: {
        type: 'array',
        description: 'File attachments (path, content, or URL)'
      },
      priority: {
        type: 'string',
        enum: ['low', 'normal', 'high'],
        default: 'normal',
        description: 'Email priority'
      }
    },
    outputs: {
      messageId: 'Unique message identifier',
      accepted: 'List of accepted recipients',
      rejected: 'List of rejected recipients',
      success: 'Whether email was sent successfully',
      error: 'Error message if sending failed'
    }
  };

  /**
   * Execute email sending operation
   * @param {Object} step - Step definition
   * @param {Object} config - Resolved configuration
   * @param {Object} context - Execution context
   * @returns {Object} Send result
   */
  static async execute(step, config, context) {
    try {
      // Create email transporter
      const transporter = await EmailNode.createTransporter(config);
      
      // Prepare email message
      const message = await EmailNode.prepareMessage(config, context);
      
      // Send email
      console.log(`Sending email to: ${Array.isArray(config.to) ? config.to.join(', ') : config.to}`);
      const result = await transporter.sendMail(message);
      
      return {
        success: true,
        messageId: result.messageId,
        accepted: result.accepted,
        rejected: result.rejected,
        response: result.response,
        provider: config.provider
      };

    } catch (error) {
      console.error('Email sending failed:', error);
      
      if (step.on_error === 'stop') {
        throw error;
      }

      return {
        success: false,
        error: error.message,
        provider: config.provider
      };
    }
  }

  /**
   * Create email transporter based on provider
   */
  static async createTransporter(config) {
    switch (config.provider) {
      case 'gmail':
        return nodemailer.createTransporter({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_USER || process.env.SMTP_USER,
            pass: process.env.GMAIL_PASS || process.env.SMTP_PASS
          }
        });

      case 'outlook':
        return nodemailer.createTransporter({
          service: 'outlook',
          auth: {
            user: process.env.OUTLOOK_USER || process.env.SMTP_USER,
            pass: process.env.OUTLOOK_PASS || process.env.SMTP_PASS
          }
        });

      case 'sendgrid':
        return nodemailer.createTransporter({
          service: 'SendGrid',
          auth: {
            user: 'apikey',
            pass: process.env.SENDGRID_API_KEY
          }
        });

      case 'mailgun':
        return nodemailer.createTransporter({
          service: 'Mailgun',
          auth: {
            user: process.env.MAILGUN_USERNAME,
            pass: process.env.MAILGUN_PASSWORD
          }
        });

      case 'smtp':
      default:
        return nodemailer.createTransporter({
          host: process.env.SMTP_HOST || 'localhost',
          port: parseInt(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true' || false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          },
          tls: {
            rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false'
          }
        });
    }
  }

  /**
   * Prepare email message object
   */
  static async prepareMessage(config, context) {
    const message = {
      from: config.from || process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: Array.isArray(config.to) ? config.to.join(', ') : config.to,
      subject: config.subject,
      priority: config.priority || 'normal'
    };

    // Add optional fields
    if (config.cc) {
      message.cc = Array.isArray(config.cc) ? config.cc.join(', ') : config.cc;
    }
    if (config.bcc) {
      message.bcc = Array.isArray(config.bcc) ? config.bcc.join(', ') : config.bcc;
    }
    if (config.replyTo) {
      message.replyTo = config.replyTo;
    }

    // Set body content
    if (config.bodyType === 'html') {
      message.html = config.body;
    } else {
      message.text = config.body;
    }

    // Handle attachments
    if (config.attachments && Array.isArray(config.attachments)) {
      message.attachments = await EmailNode.prepareAttachments(config.attachments);
    }

    return message;
  }

  /**
   * Prepare email attachments
   */
  static async prepareAttachments(attachments) {
    const prepared = [];

    for (const attachment of attachments) {
      if (typeof attachment === 'string') {
        // File path
        if (await EmailNode.fileExists(attachment)) {
          prepared.push({
            filename: path.basename(attachment),
            path: attachment
          });
        }
      } else if (attachment.path) {
        // File path object
        prepared.push({
          filename: attachment.filename || path.basename(attachment.path),
          path: attachment.path,
          contentType: attachment.contentType
        });
      } else if (attachment.content) {
        // Content attachment
        prepared.push({
          filename: attachment.filename || 'attachment',
          content: attachment.content,
          contentType: attachment.contentType
        });
      } else if (attachment.url) {
        // URL attachment (will be downloaded)
        prepared.push({
          filename: attachment.filename || 'attachment',
          href: attachment.url,
          contentType: attachment.contentType
        });
      }
    }

    return prepared;
  }

  /**
   * Check if file exists
   */
  static async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate configuration
   */
  static validate(config) {
    const errors = [];

    if (!config.to || (Array.isArray(config.to) && config.to.length === 0)) {
      errors.push('At least one recipient (to) is required');
    }

    if (!config.subject) {
      errors.push('Subject is required');
    }

    if (!config.body) {
      errors.push('Body content is required');
    }

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const recipients = Array.isArray(config.to) ? config.to : [config.to];
    
    for (const email of recipients) {
      if (!emailRegex.test(email)) {
        errors.push(`Invalid email address: ${email}`);
      }
    }

    return errors;
  }

  /**
   * Get example configurations
   */
  static getExamples() {
    return {
      orderConfirmation: {
        provider: 'smtp',
        to: ['{{inputs.customer_email}}'],
        subject: 'Order Confirmation - {{inputs.order_number}}',
        body: `
          <h2>Order Confirmation</h2>
          <p>Dear {{inputs.customer_name}},</p>
          <p>Thank you for your order! Your order #{{inputs.order_number}} has been confirmed.</p>
          <p><strong>Order Total:</strong> ${{inputs.total}}</p>
          <p>We'll notify you when your order ships.</p>
          <p>Best regards,<br>{{context.company.name}}</p>
        `,
        bodyType: 'html'
      },
      notification: {
        provider: 'gmail',
        to: ['admin@company.com'],
        subject: 'System Alert - {{inputs.alert_type}}',
        body: `
          Alert Details:
          Type: {{inputs.alert_type}}
          Message: {{inputs.message}}
          Timestamp: {{now}}
          
          System: {{context.workflow.name}}
        `,
        bodyType: 'text',
        priority: 'high'
      },
      report: {
        provider: 'smtp',
        to: ['manager@company.com'],
        cc: ['team@company.com'],
        subject: 'Daily Report - {{inputs.date}}',
        body: `
          <h1>Daily Sales Report</h1>
          <p>Date: {{inputs.date}}</p>
          <ul>
            <li>Total Sales: ${{inputs.total_sales}}</li>
            <li>Orders: {{inputs.order_count}}</li>
            <li>New Customers: {{inputs.new_customers}}</li>
          </ul>
        `,
        bodyType: 'html',
        attachments: [
          {
            filename: 'daily-report.pdf',
            path: '{{steps.generate_report.output.file_path}}'
          }
        ]
      }
    };
  }
}

export default EmailNode;