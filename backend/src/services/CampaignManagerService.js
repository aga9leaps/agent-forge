import MPTasksRepository from "../repository/mpTasksRepository.js";
import MPCustomersRepository from "../repository/mpCustomersRepository.js";
import WhatsAppService from "./WhatsAppService.js";
import { googleCloudStorageService } from "../serviceConfigs/GoogleCloudStorageService.js";
import { OpenAI } from "openai";
import cron from "node-cron";
import dotenv from "dotenv";
import RemiderRepository from "../repository/reminderRepository.js";
import { reminderPhases } from "../utils/constants.js";

dotenv.config({ path: "./configs/.env" });
export default class CampaignManagerService {
  constructor() {
    this.mpTasksRepository = new MPTasksRepository(process.env.MP_TASKS_COLLECTION || "mp_tasks");
    this.mpCustomersRepository = new MPCustomersRepository(process.env.MP_CUSTOMERS_COLLECTION || "mp_customers");
    this.reminderRepository = new RemiderRepository();
    this.whatsAppService = WhatsAppService;
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.scheduledJobs = new Map();
  }

  async refineMessage(originalMessage, campaignType) {
    try {
      // For birthday campaigns, return a template showing how personalization will work
      if (campaignType === 'birthday') {
        return `🎉 Happy Birthday, [Customer Name] ji! 🎂\n\nWishing you and your entire team a wonderful day filled with happiness and joy!\n\nThank you for being such a valued partner with us. Your continued trust and support mean the world to us.\n\nMay this special day bring you prosperity, good health, and countless reasons to smile! 🌟\n\nWarmest birthday wishes,\nTeam 🎨`;
      }
      
      const prompt = this.generateRefinementPrompt(originalMessage, campaignType);
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a professional marketing copywriter. Refine the given message to make it more engaging, professional, and suitable for WhatsApp marketing while keeping it concise and personalized."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error("Error refining message:", error);
      return originalMessage; // Return original message if refinement fails
    }
  }

  generateRefinementPrompt(message, campaignType) {
    const contextMap = {
      'product_launch': 'This is a product launch announcement. Make it exciting and highlight key benefits.',
      'scheme_launch': 'This is about a new scheme or offer. Make it attractive and create urgency.',
      'newsletter': 'This is a newsletter update. Make it informative and engaging.',
      'seasonal_offers': 'This is a seasonal offer promotion. Make it timely, festive, and create urgency with seasonal appeal.',
      'price_drop_notification': 'This is a price drop notification. Make it exciting, emphasize savings, and create urgency to purchase.',
      'product_restock_alert': 'This is a product restock alert. Make it informative, create urgency about limited availability, and encourage immediate action.',
      'limited_time_discounts': 'This is a limited-time discount offer. Make it urgent, emphasize the time-sensitive nature, and highlight the savings.',
      'birthday': 'This is a birthday message. Make it warm, personal, and celebratory.',
      'anniversary': 'This is an anniversary message. Make it appreciative and relationship-focused.'
    };

    const context = contextMap[campaignType] || 'This is a marketing message. Make it professional and engaging.';
    
    return `${context}\n\nOriginal message: "${message}"\n\nPlease refine this message to make it more effective for WhatsApp marketing while keeping the core message intact.`;
  }

  async uploadMedia(fileBuffer, fileName, fileType) {
    try {
      const mediaUrl = await googleCloudStorageService.uploadFile(fileBuffer, fileName, fileType);
      return mediaUrl;
    } catch (error) {
      console.error("Error uploading media:", error);
      throw error;
    }
  }

  async createCampaign(campaignData) {
    try {
      // Upload media if provided
      let mediaUrl = null;
      let mediaType = null;
      
      if (campaignData.mediaFile) {
        mediaUrl = await this.uploadMedia(
          campaignData.mediaFile.buffer,
          campaignData.mediaFile.originalname,
          campaignData.mediaFile.mimetype
        );
        mediaType = campaignData.mediaFile.mimetype;
      }

      // For scheduled reminder triggers, we don't need target audience processing
      let targetNumbers = [];
      let targetCustomers = [];
      
      if (campaignData.isReminderSchedule || campaignData.taskType === 'scheduled_reminder') {
        // For scheduled reminders, we don't pre-fetch targets since they will be fetched at execution time
        targetNumbers = ['scheduled_trigger']; // Placeholder to indicate scheduled execution
      } else {
        // Get target audience for regular campaigns
        targetNumbers = await this.getTargetAudience(campaignData.targetAudience);
        
        // For birthday campaigns, also store customer data for personalization
        if (campaignData.campaignType === 'birthday' || campaignData.targetAudience === 'birthday_today') {
          targetCustomers = await this.getTargetCustomers(campaignData.targetAudience);
        }
      }
      
      // Create task data
      const taskData = {
        taskName: campaignData.taskName,
        taskType: campaignData.taskType,
        campaignType: campaignData.campaignType,
        message: campaignData.message,
        refinedMessage: campaignData.refinedMessage,
        mediaUrl,
        mediaType,
        targetAudience: campaignData.targetAudience,
        targetNumbers,
        targetCustomers, // Store customer data for personalization
        scheduleType: campaignData.scheduleType,
        scheduledDateTime: campaignData.scheduledDateTime,
        frequency: campaignData.frequency,
        cronTime: campaignData.cronTime,
        isActive: true,
        totalTargets: targetNumbers.length,
        createdBy: campaignData.createdBy || 'admin',
        useReminderTemplates: campaignData.useReminderTemplates || false, // Flag for reminder campaigns
        isReminderSchedule: campaignData.isReminderSchedule || false, // Flag for scheduled reminder triggers
        reminderType: campaignData.reminderType || null // Store reminder type for scheduled triggers
      };

      // Create campaign task
      const result = await this.mpTasksRepository.createCampaignTask(taskData);

      // If it's immediate, execute now
      if (campaignData.scheduleType === 'immediate') {
        await this.executeCampaign(result.taskId);
      } else if (campaignData.scheduleType === 'scheduled' && campaignData.scheduledDateTime) {
        // Generate cron expression based on frequency
        const cronTime = campaignData.cronTime || this.generateCronExpression(
          campaignData.scheduledDateTime, 
          campaignData.frequency || 'once'
        );
        
        // Schedule the campaign
        this.scheduleCampaign(result.taskId, cronTime, campaignData.frequency);
      }

      return result;
    } catch (error) {
      console.error("Error creating campaign:", error);
      throw error;
    }
  }

  async getTargetAudience(targetAudience) {
    try {
      switch (targetAudience) {
        case 'all':
          return await this.mpCustomersRepository.getAllCustomerPhoneNumbers();
        case 'birthday_today':
          const birthdayCustomers = await this.mpCustomersRepository.getCustomerBirthdayList();
          return birthdayCustomers.map(customer => customer.Primary_Mobile_Number).filter(Boolean);
        case 'anniversary_today':
          // Add anniversary support if needed
          return [];
        case 'order_due':
          // For order reminders - get customers with due orders
          const orderDueCustomers = await this.getReminderTargetCustomers('order');
          return orderDueCustomers.map(customer => customer.Primary_Mobile_Number).filter(Boolean);
        case 'payment_due':
          // For payment reminders - get customers with due payments
          const paymentDueCustomers = await this.getReminderTargetCustomers('payment');
          return paymentDueCustomers.map(customer => customer.Primary_Mobile_Number).filter(Boolean);
        default:
          // Check if it's a state name
          const stateCustomers = await this.mpCustomersRepository.getCustomersByState(targetAudience);
          if (stateCustomers.length > 0) {
            return stateCustomers.map(customer => customer.Primary_Mobile_Number).filter(Boolean);
          }
          // Fallback to all customers
          return await this.mpCustomersRepository.getAllCustomerPhoneNumbers();
      }
    } catch (error) {
      console.error("Error getting target audience:", error);
      return [];
    }
  }

  // Get target customers with full data for personalization
  async getTargetCustomers(targetAudience) {
    try {
      switch (targetAudience) {
        case 'birthday_today':
          return await this.mpCustomersRepository.getCustomerBirthdayList();
        case 'anniversary_today':
          // Add anniversary support if needed
          return [];
        case 'order_due':
          return await this.getReminderTargetCustomers('order');
        case 'payment_due':
          return await this.getReminderTargetCustomers('payment');
        default:
          return [];
      }
    } catch (error) {
      console.error("Error getting target customers:", error);
      return [];
    }
  }

  async executeCampaign(taskId) {
    try {
      const task = await this.mpTasksRepository.findOne({ taskId });
      if (!task) {
        throw new Error(`Task with ID ${taskId} not found`);
      }

      // Update task status to in_progress
      await this.mpTasksRepository.updateCampaignTask(taskId, { status: 'in_progress' });

      let result;

      // Handle scheduled reminder triggers - just call the sendReminders API
      if (task.taskType === 'scheduled_reminder' || task.isReminderSchedule) {
        console.log(`Executing scheduled reminder trigger for ${task.reminderType || task.campaignType} reminders`);
        result = await this.sendReminders(task.reminderType || task.campaignType);
        
        // Update task execution results
        const updateData = {
          status: result.success ? 'completed' : 'failed',
          executedAt: new Date(),
          message: result.message,
          results: result
        };
        
        await this.mpTasksRepository.updateCampaignTask(taskId, updateData);
        return result;
      }

      // Handle reminder campaigns differently
      if (task.taskType === 'reminder' || task.useReminderTemplates) {
        result = await this.executeReminderCampaign(taskId);
        return result;
      }

      // Regular campaign execution
      const messageToSend = task.refinedMessage || task.message;
      let sentCount = 0;
      let failedCount = 0;
      const sentTo = [];
      const failedTo = [];

      // Send messages to all target numbers
      for (const phoneNumber of task.targetNumbers) {
        try {
          let messageToSend = task.refinedMessage || task.message;
          
          // For birthday campaigns, personalize the saved refined message
          if (task.campaignType === 'birthday' || task.targetAudience === 'birthday_today') {
            // Find customer data for this phone number
            const customer = task.targetCustomers?.find(c => c.Primary_Mobile_Number === phoneNumber);
            if (customer) {
              messageToSend = this.personalizeMessageWithCustomerData(messageToSend, customer);
              console.log(`Personalizing birthday message for ${customer.Contact_Name} (${customer.Primary_Mobile_Number})`);
            } else {
              // If no customer data found, try to fetch from database
              const customerFromDb = await this.mpCustomersRepository.getCustomerDetailsFromPhoneNumber(phoneNumber);
              if (customerFromDb) {
                messageToSend = this.personalizeMessageWithCustomerData(messageToSend, customerFromDb);
                console.log(`Personalizing birthday message for ${customerFromDb.Contact_Name} (${customerFromDb.Primary_Mobile_Number})`);
              }
            }
          }
          
          await this.whatsAppService.sendMessageToWhatsApp(
            phoneNumber, 
            messageToSend, 
            task.mediaUrl, 
            task.mediaType
          );
          sentCount++;
          sentTo.push(phoneNumber);
          
          // Add small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Failed to send message to ${phoneNumber}:`, error);
          failedCount++;
          failedTo.push(phoneNumber);
        }
      }

      // Update task execution
      await this.mpTasksRepository.updateTaskExecution(taskId, {
        status: 'completed',
        sentCount,
        failedCount,
        message: `Campaign executed: ${sentCount} sent, ${failedCount} failed`,
        sentTo,
        failedTo
      });

      return { success: true, sentCount, failedCount };
    } catch (error) {
      console.error("Error executing campaign:", error);
      
      // Update task status to failed
      await this.mpTasksRepository.updateCampaignTask(taskId, { 
        status: 'failed',
        updatedAt: new Date()
      });
      
      throw error;
    }
  }

  scheduleCampaign(taskId, cronTime, frequency = 'once') {
    try {
      const job = cron.schedule(cronTime, async () => {
        console.log(`Executing ${frequency} scheduled campaign: ${taskId}`);
        await this.executeCampaign(taskId);
        
        // If it's a one-time schedule, remove the job after execution
        if (frequency === 'once') {
          console.log(`One-time campaign ${taskId} completed, removing scheduled job`);
          this.scheduledJobs.delete(taskId);
          job.stop();
        }
      }, {
        scheduled: false,
        timezone: "Asia/Kolkata"
      });

      this.scheduledJobs.set(taskId, job);
      job.start();
      
      console.log(`Campaign ${taskId} scheduled with cron: ${cronTime} (${frequency})`);
    } catch (error) {
      console.error("Error scheduling campaign:", error);
      throw error;
    }
  }

  // Convert frequency and datetime to cron expression
  generateCronExpression(scheduleDateTime, frequency) {
    const date = new Date(scheduleDateTime);
    const minute = date.getMinutes();
    const hour = date.getHours();
    const dayOfMonth = date.getDate();
    const month = date.getMonth() + 1;
    const dayOfWeek = date.getDay();

    switch (frequency) {
      case 'daily':
        return `${minute} ${hour} * * *`;
      case 'weekly':
        return `${minute} ${hour} * * ${dayOfWeek}`;
      case 'monthly':
        return `${minute} ${hour} ${dayOfMonth} * *`;
      case 'once':
      default:
        return `${minute} ${hour} ${dayOfMonth} ${month} *`;
    }
  }

  async getAllCampaigns() {
    try {
      return await this.mpTasksRepository.getAllCampaignTasks();
    } catch (error) {
      console.error("Error fetching all campaigns:", error);
      return [];
    }
  }

  async updateCampaign(taskId, updateData) {
    try {
      // Upload new media if provided
      if (updateData.mediaFile) {
        const mediaUrl = await this.uploadMedia(
          updateData.mediaFile.buffer,
          updateData.mediaFile.originalname,
          updateData.mediaFile.mimetype
        );
        updateData.mediaUrl = mediaUrl;
        updateData.mediaType = updateData.mediaFile.mimetype;
        delete updateData.mediaFile;
      }

      // Update target numbers if target audience changed
      if (updateData.targetAudience) {
        const targetNumbers = await this.getTargetAudience(updateData.targetAudience);
        updateData.targetNumbers = targetNumbers;
        updateData.totalTargets = targetNumbers.length;
      }

      return await this.mpTasksRepository.updateCampaignTask(taskId, updateData);
    } catch (error) {
      console.error("Error updating campaign:", error);
      throw error;
    }
  }

  async toggleCampaignStatus(taskId, isActive) {
    try {
      // If deactivating, cancel scheduled job
      if (!isActive && this.scheduledJobs.has(taskId)) {
        const job = this.scheduledJobs.get(taskId);
        job.stop();
        this.scheduledJobs.delete(taskId);
      }

      return await this.mpTasksRepository.toggleCampaignTaskStatus(taskId, isActive);
    } catch (error) {
      console.error("Error toggling campaign status:", error);
      throw error;
    }
  }

  async deleteCampaign(taskId) {
    try {
      // Cancel scheduled job if exists
      if (this.scheduledJobs.has(taskId)) {
        const job = this.scheduledJobs.get(taskId);
        job.stop();
        this.scheduledJobs.delete(taskId);
      }

      return await this.mpTasksRepository.deleteCampaignTask(taskId);
    } catch (error) {
      console.error("Error deleting campaign:", error);
      throw error;
    }
  }

  async getCustomerGroups() {
    try {
      return await this.mpCustomersRepository.getCustomerGroups();
    } catch (error) {
      console.error("Error fetching customer groups:", error);
      return [];
    }
  }

  async sendBirthdayMessages() {
    try {
      console.log("Sending birthday messages...");
      
      const birthdayCustomers = await this.mpCustomersRepository.getCustomerBirthdayList();
      
      if (birthdayCustomers.length === 0) {
        console.log("No birthday customers found for today");
        return { success: true, sentCount: 0, message: "No birthdays today" };
      }

      let sentCount = 0;
      let failedCount = 0;

      for (const customer of birthdayCustomers) {
        try {
          if (customer.Primary_Mobile_Number) {
            // Create personalized birthday message
            const personalizedMessage = this.createPersonalizedBirthdayMessage(customer);
            
            await this.whatsAppService.sendMessageToWhatsApp(
              customer.Primary_Mobile_Number,
              personalizedMessage
            );
            sentCount++;
            console.log(`Personalized birthday message sent to ${customer.Contact_Name} (${customer.Primary_Mobile_Number})`);
          }
        } catch (error) {
          console.error(`Failed to send birthday message to ${customer.Contact_Name}:`, error);
          failedCount++;
        }
      }

      return { success: true, sentCount, failedCount };
    } catch (error) {
      console.error("Error sending birthday messages:", error);
      throw error;
    }
  }

  // Personalize message by replacing placeholders with customer data
  personalizeMessageWithCustomerData(message, customer) {
    try {
      console.log("🔄 Personalizing message with customer data:", {
        Contact_Name: customer.Contact_Name,
        Particulars: customer.Particulars,
        Primary_Mobile_Number: customer.Primary_Mobile_Number
      });
      
      // Extract contact name and business name
      const contactName = customer.Contact_Name || 'Valued Customer';
      const businessName = customer.Particulars || '';
      
      // Clean up contact name (remove titles like Mr, Mrs, etc.)
      const cleanContactName = contactName.replace(/^(Mr\.?|Mrs\.?|Ms\.?|Dr\.?|Prof\.?|Shri\.?|Smt\.?)\s+/i, '').trim();
      
      // Get first name from contact name
      const firstName = cleanContactName.split(' ')[0] || cleanContactName;
      
      console.log("📝 Extracted data for personalization:", { 
        firstName, 
        contactName: cleanContactName, 
        businessName 
      });
      
      // Replace placeholders in the message
      let personalizedMessage = message;
      
      // Replace [Customer Name] with first name
      personalizedMessage = personalizedMessage.replace(/\[Customer Name\]/g, firstName);
      
      // Replace [Business Name] with business name or remove the reference if empty
      if (businessName && businessName.trim()) {
        personalizedMessage = personalizedMessage.replace(/\[Business Name\]/g, businessName);
      } else {
        // Remove business-specific text if no business name
        personalizedMessage = personalizedMessage.replace(/\s*at\s*\[Business Name\]/g, '');
        personalizedMessage = personalizedMessage.replace(/\s*\[Business Name\]\s*/g, '');
      }
      
      // Clean up any remaining placeholder brackets or extra spaces
      personalizedMessage = personalizedMessage.replace(/\[\w+\s*\w*\]/g, '');
      personalizedMessage = personalizedMessage.replace(/\s+/g, ' ').trim();
      
      console.log("✅ Personalized message created:", personalizedMessage.substring(0, 100) + "...");
      
      return personalizedMessage;
    } catch (error) {
      console.error("Error personalizing message:", error);
      return message; // Return original message if personalization fails
    }
  }

  // Create personalized birthday message
  createPersonalizedBirthdayMessage(customer) {
    try {
      console.log("🎂 Creating personalized birthday message for customer:", {
        Contact_Name: customer.Contact_Name,
        Particulars: customer.Particulars,
        Primary_Mobile_Number: customer.Primary_Mobile_Number
      });
      
      // Extract contact name and business name
      const contactName = customer.Contact_Name || 'Valued Customer';
      const businessName = customer.Particulars || '';
      
      console.log("📝 Extracted data:", { contactName, businessName });
      
      // Clean up contact name (remove titles like Mr, Mrs, etc.)
      const cleanContactName = contactName.replace(/^(Mr\.?|Mrs\.?|Ms\.?|Dr\.?|Prof\.?|Shri\.?|Smt\.?)\s+/i, '').trim();
      
      // Get first name from contact name
      const firstName = cleanContactName.split(' ')[0] || cleanContactName;
      
      console.log("🏷️ Processed names:", { cleanContactName, firstName });
      
      // Create personalized message
      let personalizedMessage = `🎉 Happy Birthday, ${firstName}! 🎂\n\n`;
      
      // Add business-specific greeting if business name exists
      if (businessName && businessName.trim()) {
        personalizedMessage += `Wishing you and the entire team at ${businessName} a wonderful day filled with happiness and joy!\n\n`;
      } else {
        personalizedMessage += `Wishing you a wonderful day filled with happiness and joy!\n\n`;
      }
      
      // Add personalized appreciation
      personalizedMessage += `Thank you for being such a valued partner with us. Your continued trust and support mean the world to us.\n\n`;
      
      // Add birthday wishes
      personalizedMessage += `May this special day bring you prosperity, good health, and countless reasons to smile! 🌟\n\n`;
      
      // Closing
      personalizedMessage += `Warmest birthday wishes,\nTeam 🎨`;
      
      console.log("✅ Generated personalized message:", personalizedMessage);
      
      return personalizedMessage;
    } catch (error) {
      console.error("Error creating personalized birthday message:", error);
      // Return a fallback message
      return `🎉 Happy Birthday! 🎂\n\nWishing you a wonderful day filled with happiness and joy. Thank you for being a valued customer!\n\nBest regards,\nTeam`;
    }
  }
  
  // Reminder-specific methods
  async sendReminders(reminderType) {
    try {
      const ReminderService = (await import("./ReminderService.js")).default;
      const reminderService = new ReminderService();
      
      console.log(`Sending ${reminderType} reminders...`);
      const result = await reminderService.sendReminders(reminderType);
      
      return {
        success: result.success,
        message: result.message,
        data: result
      };
    } catch (error) {
      console.error("Error sending reminders:", error);
      throw error;
    }
  }

  async executeReminderCampaign(taskId) {
    try {
      const task = await this.mpTasksRepository.findOne({ taskId });
      if (!task) {
        throw new Error("Campaign not found");
      }

      // Update task status to in_progress
      await this.mpTasksRepository.updateCampaignTask(taskId, { status: 'in_progress' });

      const ReminderService = (await import("./ReminderService.js")).default;
      const reminderService = new ReminderService();

      let result;
      if (task.useReminderTemplates) {
        // Use the existing reminder system with hardcoded templates
        result = await reminderService.sendReminders(task.campaignType);
      } else {
        // Use custom message from campaign
        result = await this.sendCustomReminderMessage(task);
      }

      // Update task execution results
      const updateData = {
        status: result.success ? 'completed' : 'failed',
        executedAt: new Date(),
        sentCount: result.sentCount || 0,
        failedCount: result.failedCount || 0,
        results: result
      };

      await this.mpTasksRepository.updateCampaignTask(taskId, updateData);

      return {
        success: result.success,
        message: result.message,
        sentCount: result.sentCount || 0,
        failedCount: result.failedCount || 0
      };
    } catch (error) {
      console.error("Error executing reminder campaign:", error);
      
      // Update task status to failed
      await this.mpTasksRepository.updateCampaignTask(taskId, { 
        status: 'failed',
        executedAt: new Date(),
        error: error.message 
      });
      
      throw error;
    }
  }

  async sendCustomReminderMessage(task) {
    try {
      // Get customers based on reminder type
      const customers = await this.getReminderTargetCustomers(task.campaignType);
      
      let sentCount = 0;
      let failedCount = 0;
      const sentTo = [];
      const failedTo = [];

      for (const customer of customers) {
        try {
          const phoneNumber = customer.Primary_Mobile_Number?.replace(/\D/g, "");
          if (!phoneNumber) {
            failedCount++;
            failedTo.push({ customer: customer.Particulars, reason: "No phone number" });
            continue;
          }

          // Use custom message or fallback to template
          let messageToSend = task.refinedMessage || task.message;
          
          // If no custom message, use hardcoded templates
          if (!messageToSend || messageToSend.includes("predefined templates")) {
            messageToSend = this.getReminderTemplate(task.campaignType, customer);
          }

          const response = await this.whatsAppService.sendMessageToWhatsApp(
            phoneNumber,
            messageToSend
          );

          if (response?.success) {
            sentCount++;
            sentTo.push({
              customer: customer.Particulars,
              phone: phoneNumber,
              messageId: response.response?.messages?.[0]?.id || response.messages?.[0]?.id
            });
          } else {
            failedCount++;
            failedTo.push({ 
              customer: customer.Particulars, 
              phone: phoneNumber, 
              reason: response?.error || "Unknown error" 
            });
          }

          // Add small delay between messages
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          console.error(`Error sending reminder to ${customer.Particulars}:`, error);
          failedCount++;
          failedTo.push({ 
            customer: customer.Particulars, 
            reason: error.message 
          });
        }
      }

      return {
        success: true,
        message: `Sent ${sentCount} reminders, ${failedCount} failed`,
        sentCount,
        failedCount,
        sentTo,
        failedTo
      };
    } catch (error) {
      console.error("Error sending custom reminder messages:", error);
      return {
        success: false,
        message: error.message,
        sentCount: 0,
        failedCount: 0
      };
    }
  }

  async getReminderTargetCustomers(reminderType) {
    try {
      // This would ideally query the SQL database for customers with due dates
      // For now, return all customers as a fallback
      const allCustomers = await this.mpCustomersRepository.find({});
      
      // Filter based on reminder type logic
      // You would implement actual due date filtering here based on your SQL table
      return allCustomers.slice(0, 10); // Limit for testing
    } catch (error) {
      console.error("Error getting reminder target customers:", error);
      return [];
    }
  }

  getReminderTemplate(reminderType, customer) {
    const phase = "Phase 2"; // Default phase, you could make this dynamic
    const phaseData = reminderPhases[phase];
    
    if (!phaseData) {
      return `Dear ${customer.Contact_Name || customer.Particulars}, this is a ${reminderType} reminder.`;
    }

    const templateKey = reminderType === 'order' ? 'dealer_order_message' : 'dealer_payment_message';
    let template = phaseData[templateKey];

    // Replace placeholders with actual customer data
    if (customer.Contact_Name) {
      template = `Dear ${customer.Contact_Name}, ${template}`;
    }

    return template;
  }

  // Get reminder status and statistics
  async getReminderStatus() {
    try {
      const ReminderService = (await import("./ReminderService.js")).default;
      const reminderService = new ReminderService();
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get today's reminder statistics
      const orderStats = await this.getTodayReminderStats('order', today, tomorrow);
      const paymentStats = await this.getTodayReminderStats('payment', today, tomorrow);

      return {
        success: true,
        data: {
          order: orderStats,
          payment: paymentStats,
          lastUpdated: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error("Error getting reminder status:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get today's reminder statistics for a specific type
  async getTodayReminderStats(reminderType, today, tomorrow) {
    try {
      const ReminderService = (await import("./ReminderService.js")).default;
      const reminderService = new ReminderService();
      
      // Get all reminders sent today
      const sentReminders = await reminderService.remiderRepository.executeQuery(`
        SELECT customer_name, whatsapp_message_id, notes 
        FROM dealer_reminders 
        WHERE reminder_type = ? 
        AND status = 'Sent' 
        AND DATE(updated_at) = DATE(?)
      `, [reminderType, today]);

      // Get pending reminders for today
      const pendingReminders = await reminderService.remiderRepository.executeQuery(`
        SELECT customer_name 
        FROM dealer_reminders 
        WHERE reminder_type = ? 
        AND status = 'Pending' 
        AND DATE(reminder_date) = DATE(?)
      `, [reminderType, today]);

      // Get failed reminders for today
      const failedReminders = await reminderService.remiderRepository.executeQuery(`
        SELECT customer_name, notes 
        FROM dealer_reminders 
        WHERE reminder_type = ? 
        AND status = 'Failed' 
        AND DATE(updated_at) = DATE(?)
      `, [reminderType, today]);

      return {
        status: sentReminders.length > 0 ? 'completed' : (pendingReminders.length > 0 ? 'pending' : 'no_reminders'),
        totalSent: sentReminders.length,
        totalPending: pendingReminders.length,
        totalFailed: failedReminders.length,
        lastRunTime: sentReminders.length > 0 ? '11:00 AM' : null,
        sentTo: sentReminders.map(r => r.customer_name),
        pendingFor: pendingReminders.map(r => r.customer_name),
        failedFor: failedReminders.map(r => ({ 
          customer: r.customer_name, 
          reason: r.notes || 'Unknown error' 
        }))
      };
    } catch (error) {
      console.error(`Error getting ${reminderType} reminder stats:`, error);
      return {
        status: 'error',
        totalSent: 0,
        totalPending: 0,
        totalFailed: 0,
        lastRunTime: null,
        sentTo: [],
        pendingFor: [],
        failedFor: [],
        error: error.message
      };
    }
  }
}
