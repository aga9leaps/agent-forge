import dotenv from 'dotenv';
import OpenAI from 'openai';
import cron from 'node-cron';
import MPConsumersRepository from '../repository/MPConsumersRepository.js';
import MPSalesTasksRepository from '../repository/MPSalesTasksRepository.js';
import WhatsAppService from './WhatsAppService.js';
import { googleCloudStorageService } from '../serviceConfigs/GoogleCloudStorageService.js';

dotenv.config({ path: "./configs/.env" });

export default class SalesAgentService {
  constructor() {
    this.mpConsumersRepository = new MPConsumersRepository(process.env.MP_CONSUMERS_COLLECTION || "mp_consumers");
    this.mpSalesTasksRepository = new MPSalesTasksRepository(process.env.MP_SALES_TASKS_COLLECTION || "mp_sales_tasks");
    this.whatsAppService = WhatsAppService;
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.scheduledJobs = new Map();
  }

  async refineMessage(originalMessage, messageType) {
    try {
      console.log(`SalesAgentService.refineMessage - originalMessage: "${originalMessage}", messageType: "${messageType}"`);
      
      // For birthday messages, return a sample personalized birthday message template
      if (messageType === 'birthday' || originalMessage.toLowerCase().includes('birthday') || originalMessage.toLowerCase().includes('happy birthday')) {
        console.log("Detected birthday message, generating birthday template");
        return "🎂 Warmest birthday wishes to you, [Lead Name]! 🎉 May this day mark the beginning of a year filled with good luck, good health, and much happiness. Thank you for choosing Magic Paints! 🎈";
      }
      
      // For all other message types, use OpenAI to refine the message
      const prompt = this.generateRefinementPrompt(originalMessage, messageType);
      
      console.log(`SalesAgentService.refineMessage - Generated prompt: ${prompt}`);
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a professional sales copywriter specializing in consumer engagement and sales conversion. Create compelling WhatsApp messages that drive sales while maintaining a friendly, conversational tone. Always include emojis where appropriate to make the message more engaging."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      const refinedMessage = response.choices[0].message.content.trim();
      console.log(`SalesAgentService.refineMessage - OpenAI response: "${refinedMessage}"`);
      
      return refinedMessage;
    } catch (error) {
      console.error("Error refining message:", error);
      return originalMessage;
    }
  }

  generateRefinementPrompt(message, messageType) {
    const contextMap = {
      'product_launch': 'This is a product launch announcement. Make it exciting, highlight key benefits, create buzz, and encourage customers to be among the first to try the new product. Include compelling reasons why they should act now.',
      'promotional': 'This is a promotional campaign. Make it attractive, create urgency with limited-time offers, emphasize savings and value, and include a clear call-to-action.',
      'announcement': 'This is a general announcement. Make it informative, engaging, and ensure the key message is communicated clearly with appropriate urgency.',
      'newsletter': 'This is a newsletter update. Make it informative, engaging, and valuable to the reader with useful insights or updates.',
      'welcome_offer': 'This is a welcome offer for new customers. Make it warm, inviting, and emphasize the special nature of this first-time offer. Create excitement about joining the Magic Paints family and highlight exclusive benefits for new customers. Include urgency and a clear call-to-action.',
      'first_time_discount': 'This is a first-time discount offer for new customers. Make it exciting, emphasize the exclusive nature and special savings available only to first-time buyers. Create urgency for new customers to take advantage of this limited-time opportunity. Include specific benefits and clear next steps.',
      'trending_products': 'This is about trending products. Make it exciting, highlight what makes these products popular right now, create desire to be part of the trend, and emphasize why these products are in high demand. Include social proof and urgency.',
      'exclusive_announcement': 'This is an exclusive announcement for special customers. Make it feel special and privileged, emphasizing the exclusive nature of the information or offer. Make the recipient feel valued and part of an exclusive group with special benefits.',
      'seasonal_offers': 'This is a seasonal offer promotion. Make it timely, festive, and create urgency with seasonal appeal. Connect the offer to the current season or upcoming holiday.',
      'price_drop_notification': 'This is a price drop notification. Make it exciting, emphasize the savings opportunity, and create urgency to purchase before prices go back up or stock runs out.',
      'product_restock_alert': 'This is a product restock alert. Make it informative, create urgency about limited availability, and encourage immediate action since the product is back in stock.',
      'limited_time_discounts': 'This is a limited-time discount offer. Make it urgent, emphasize the time-sensitive nature, highlight the savings amount or percentage, and include a clear deadline.',
      'birthday': 'This is a birthday message. Make it warm, personal, celebratory, and include wishes for prosperity and success. Make the customer feel special on their birthday.',
      'anniversary': 'This is an anniversary message. Make it appreciative, relationship-focused, and celebrate the milestone. Thank them for their continued partnership.',
      'order': 'This is an order reminder. Make it polite but urgent, helpful with order details, and provide clear next steps for completion.',
      'payment': 'This is a payment reminder. Make it professional, polite, and clear about payment status and next steps. Include helpful payment options.',
      'appointment': 'This is an appointment reminder. Make it helpful, clear with important details like time and location, and include contact information for changes.',
      'follow_up': 'This is a follow-up message. Make it friendly, helpful, focused on customer satisfaction, and show genuine care for their experience.',
      'conversation': 'This is a general sales conversation message. Make it professional, engaging, and suitable for WhatsApp marketing with a friendly, conversational tone.'
    };

    const context = contextMap[messageType] || 'This is a sales message. Make it professional, engaging, and suitable for WhatsApp marketing with a friendly, conversational tone.';
    
    console.log(`SalesAgentService.generateRefinementPrompt - messageType: ${messageType}, context: ${context}`);
    
    return `${context}\n\nOriginal message: "${message}"\n\nPlease refine this message to make it more effective for WhatsApp sales communication while keeping the core message intact and maintaining a friendly, conversational tone. Include relevant emojis to make it more engaging and visually appealing.`;
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

  async createSalesTask(taskData) {
    try {
      console.log("SalesAgentService.createSalesTask - Input data:", taskData);
      
      // Handle both field names for backward compatibility
      const targetAudience = taskData.targetAudience || taskData.targetConsumerGroup;
      console.log("Target audience/consumer group:", targetAudience);
      
      // Handle media - use existing mediaUrl if provided, or upload file if provided
      let mediaUrl = taskData.mediaUrl || null;
      let mediaType = taskData.mediaType || null;
      
      if (taskData.mediaFile && !mediaUrl) {
        console.log("Media file detected:", {
          originalname: taskData.mediaFile.originalname,
          mimetype: taskData.mediaFile.mimetype,
          size: taskData.mediaFile.buffer?.length || 'unknown'
        });
        const fileName = `sales_media_${Date.now()}_${taskData.mediaFile.originalname}`;
        mediaUrl = await this.uploadMedia(taskData.mediaFile.buffer, fileName, taskData.mediaFile.mimetype);
        mediaType = taskData.mediaFile.mimetype;
        console.log("Media uploaded successfully:", {
          mediaUrl,
          mediaType
        });
      } else if (mediaUrl) {
        console.log("Using pre-uploaded media:", {
          mediaUrl,
          mediaType
        });
      } else {
        console.log("No media file or URL provided in taskData");
      }

      // Get target audience based on consumer type
      let targetNumbers = [];
      let targetConsumers = [];
      
      if (targetAudience === 'all') {
        console.log("Getting all consumer numbers and data");
        targetNumbers = await this.mpConsumersRepository.getConsumerNumbers();
        targetConsumers = await this.mpConsumersRepository.getConsumerData();
      } else if (targetAudience === 'birthday_today') {
        console.log("Getting birthday consumers for today");
        const birthdayConsumers = await this.getBirthdayConsumersForToday();
        console.log("Birthday consumers found:", birthdayConsumers.length);
        targetNumbers = birthdayConsumers.map(consumer => consumer.Primary_Mobile_Number).filter(Boolean);
        targetConsumers = birthdayConsumers;
        console.log("Birthday target numbers:", targetNumbers.length);
      } else {
        // Target specific consumer type (e.g., "Architect", "Contractor", etc.)
        console.log("Getting consumer numbers for type:", targetAudience);
        targetNumbers = await this.mpConsumersRepository.getConsumerNumbers(targetAudience);
        targetConsumers = await this.mpConsumersRepository.getConsumerData(targetAudience);
      }
      
      console.log("Retrieved target numbers:", targetNumbers.length);
      console.log("Retrieved target consumers:", targetConsumers.length);
      
      // Create task data
      const salesTaskData = {
        taskName: taskData.taskName,
        taskType: taskData.taskType || 'sales_message',
        messageType: taskData.messageType || 'conversation',
        message: taskData.message,
        refinedMessage: taskData.refinedMessage,
        mediaUrl,
        mediaType,
        targetAudience: targetAudience,
        targetNumbers,
        targetConsumers,
        scheduleType: taskData.scheduleType,
        scheduledDateTime: taskData.scheduledDateTime,
        frequency: taskData.frequency,
        cronTime: taskData.cronTime,
        isActive: true,
        totalTargets: targetNumbers.length,
        createdBy: taskData.createdBy || 'sales_agent'
      };

      console.log("Sales task data prepared:", {
        taskName: salesTaskData.taskName,
        scheduleType: salesTaskData.scheduleType,
        scheduledDateTime: salesTaskData.scheduledDateTime,
        frequency: salesTaskData.frequency,
        cronTime: salesTaskData.cronTime,
        targetCount: salesTaskData.totalTargets,
        mediaUrl: salesTaskData.mediaUrl,
        mediaType: salesTaskData.mediaType,
        hasMedia: !!(salesTaskData.mediaUrl && salesTaskData.mediaType)
      });

      // Create sales task
      const result = await this.mpSalesTasksRepository.createSalesTask(salesTaskData);

      console.log("Sales task created with ID:", result.taskId);

      // If it's immediate, execute now
      if (taskData.scheduleType === 'immediate') {
        console.log("Executing sales task immediately:", result.taskId);
        await this.executeSalesTask(result.taskId);
      } else if (taskData.scheduleType === 'scheduled' && taskData.scheduledDateTime) {
        // Generate cron expression based on frequency
        const cronTime = taskData.cronTime || this.generateCronExpression(
          taskData.scheduledDateTime, 
          taskData.frequency || 'once'
        );
        
        console.log("Scheduling sales task:", {
          taskId: result.taskId,
          cronTime,
          frequency: taskData.frequency,
          scheduledDateTime: taskData.scheduledDateTime
        });
        
        // Schedule the task
        this.scheduleSalesTask(result.taskId, cronTime, taskData.frequency);
      } else {
        console.log("Sales task created but not executed or scheduled:", {
          taskId: result.taskId,
          scheduleType: taskData.scheduleType,
          hasScheduledDateTime: !!taskData.scheduledDateTime
        });
      }

      return result;
    } catch (error) {
      console.error("Error creating sales task:", error);
      throw error;
    }
  }

  async executeSalesTask(taskId) {
    try {
      console.log("SalesAgentService.executeSalesTask - taskId:", taskId);
      const task = await this.mpSalesTasksRepository.findOne({ taskId });
      if (!task) {
        throw new Error('Sales task not found');
      }

      console.log("Task found:", {
        taskId: task.taskId,
        targetAudience: task.targetAudience,
        targetNumbers: task.targetNumbers?.length || 0,
        totalTargets: task.totalTargets
      });

      // Update task status to in_progress
      await this.mpSalesTasksRepository.updateSalesTask(taskId, { status: 'in_progress' });

      const messageToSend = task.refinedMessage || task.message;
      let sentCount = 0;
      let failedCount = 0;
      const sentTo = [];
      const failedTo = [];

      console.log("About to send messages to", task.targetNumbers?.length || 0, "numbers");

      // Send messages to all target numbers
      for (const phoneNumber of task.targetNumbers) {
        try {
          console.log("Sending message to:", phoneNumber);
          
          // Find consumer data for personalization
          const consumer = task.targetConsumers.find(c => 
            c.Primary_Mobile_Number === phoneNumber || c.phoneNumber === phoneNumber
          );
          let personalizedMessage = messageToSend;
          
          // Personalize message based on task type and consumer data
          if (consumer) {
            if (task.targetAudience === 'birthday_today') {
              // For birthday messages, generate a personalized birthday message directly
              personalizedMessage = this.createPersonalizedBirthdayMessage(consumer);
              console.log(`Generated personalized birthday message for ${consumer.Contact_Name || consumer.name}: ${personalizedMessage.substring(0, 50)}...`);
            } else {
              // For other messages, use general personalization
              personalizedMessage = this.personalizeMessage(messageToSend, consumer);
            }
          }

          // Send WhatsApp message
          if (task.mediaUrl) {
            await this.whatsAppService.sendMessageToWhatsApp(phoneNumber, personalizedMessage, task.mediaUrl, task.mediaType);
          } else {
            await this.whatsAppService.sendMessageToWhatsApp(phoneNumber, personalizedMessage);
          }

          sentCount++;
          sentTo.push(phoneNumber);
          console.log("Message sent successfully to:", phoneNumber);
          
          // Add small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Failed to send message to ${phoneNumber}:`, error);
          failedCount++;
          failedTo.push(phoneNumber);
        }
      }

      console.log("Message sending complete:", { sentCount, failedCount });

      // Update task execution
      await this.mpSalesTasksRepository.updateTaskExecution(taskId, {
        status: 'completed',
        sentCount,
        failedCount,
        // message: `Sales task executed: ${sentCount} sent, ${failedCount} failed`,
        sentTo,
        failedTo
      });

      return { success: true, sentCount, failedCount };
    } catch (error) {
      console.error("Error executing sales task:", error);
      
      // Update task status to failed
      await this.mpSalesTasksRepository.updateSalesTask(taskId, { 
        status: 'failed',
        updatedAt: new Date()
      });
      
      throw error;
    }
  }

  personalizeMessage(message, consumer) {
    try {
      let personalizedMessage = message;
      
      // Handle both mp_consumers and mp_customers data structures
      const name = consumer.Contact_Name || consumer.name;
      const type = consumer.Consumer_Type || consumer.type;
      const location = consumer.Location || consumer.location;
      
      // Replace common placeholders
      if (name) {
        personalizedMessage = personalizedMessage.replace(/\{name\}/g, name);
        personalizedMessage = personalizedMessage.replace(/\{Name\}/g, name);
      }
      
      if (type) {
        personalizedMessage = personalizedMessage.replace(/\{type\}/g, type);
        personalizedMessage = personalizedMessage.replace(/\{Type\}/g, type);
      }
      
      if (location) {
        personalizedMessage = personalizedMessage.replace(/\{location\}/g, location);
        personalizedMessage = personalizedMessage.replace(/\{Location\}/g, location);
      }
      
      return personalizedMessage;
    } catch (error) {
      console.error("Error personalizing message:", error);
      return message;
    }
  }

  scheduleSalesTask(taskId, cronTime, frequency = 'once') {
    try {
      const job = cron.schedule(cronTime, async () => {
        console.log(`Executing scheduled sales task: ${taskId} (${frequency})`);
        try {
          // For recurring birthday tasks, we need to refresh the target list each time
          if (frequency !== 'once') {
            const task = await this.mpSalesTasksRepository.findOne({ taskId });
            if (task && task.targetAudience === 'birthday_today') {
              console.log("Refreshing birthday targets for recurring task");
              const birthdayConsumers = await this.getBirthdayConsumersForToday();
              const updatedTargetNumbers = birthdayConsumers.map(consumer => consumer.Primary_Mobile_Number).filter(Boolean);
              const updatedTargetConsumers = birthdayConsumers;
              
              // Update the task with fresh targets
              await this.mpSalesTasksRepository.updateSalesTask(taskId, {
                targetNumbers: updatedTargetNumbers,
                targetConsumers: updatedTargetConsumers,
                totalTargets: updatedTargetNumbers.length
              });
              
              console.log(`Updated birthday task with ${updatedTargetNumbers.length} fresh targets`);
            }
          }
          
          await this.executeSalesTask(taskId);
          
          // If it's a one-time task, destroy the job
          if (frequency === 'once') {
            job.destroy();
            this.scheduledJobs.delete(taskId);
          }
        } catch (error) {
          console.error(`Error executing scheduled sales task ${taskId}:`, error);
        }
      }, {
        scheduled: false,
        timezone: "Asia/Kolkata"
      });

      this.scheduledJobs.set(taskId, job);
      job.start();
      
      console.log(`Sales task ${taskId} scheduled with cron: ${cronTime} (${frequency})`);
    } catch (error) {
      console.error("Error scheduling sales task:", error);
      throw error;
    }
  }

  // Convert frequency and datetime to cron expression
  generateCronExpression(scheduleDateTime, frequency) {
    if (!scheduleDateTime) return null;
    
    try {
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
    } catch (error) {
      console.error("Error generating cron expression:", error);
      return null;
    }
  }

  async getAllSalesTasks(limit = 10, offset = 0) {
    try {
      console.log("SalesAgentService.getAllSalesTasks - Pagination params:", { limit, offset });
      return await this.mpSalesTasksRepository.getAllSalesTasks(limit, offset);
    } catch (error) {
      console.error("Error fetching all sales tasks:", error);
      return { tasks: [], total: 0 };
    }
  }

  async updateSalesTask(taskId, updateData) {
    try {
      console.log("SalesAgentService.updateSalesTask - Input data:", {
        taskId,
        hasMediaFile: !!updateData.mediaFile,
        mediaFileName: updateData.mediaFile?.originalname,
        mediaMimeType: updateData.mediaFile?.mimetype,
        hasMediaUrl: !!updateData.mediaUrl
      });
      
      // Handle pre-uploaded media URL or upload new media if provided
      if (updateData.mediaUrl && !updateData.mediaFile) {
        // Use pre-uploaded media
        console.log("Using pre-uploaded media for update:", updateData.mediaUrl, updateData.mediaType);
      } else if (updateData.mediaFile) {
        // Upload new media if provided
        console.log("Uploading new media for task update...");
        const fileName = `sales_media_${Date.now()}_${updateData.mediaFile.originalname}`;
        updateData.mediaUrl = await this.uploadMedia(updateData.mediaFile.buffer, fileName, updateData.mediaFile.mimetype);
        updateData.mediaType = updateData.mediaFile.mimetype;
        console.log("Media uploaded for update:", {
          mediaUrl: updateData.mediaUrl,
          mediaType: updateData.mediaType
        });
        delete updateData.mediaFile;
      }

      // Update target numbers if target audience changed
      if (updateData.targetAudience) {
        if (updateData.targetAudience === 'all') {
          updateData.targetNumbers = await this.mpConsumersRepository.getConsumerNumbers();
          updateData.targetConsumers = await this.mpConsumersRepository.getConsumerData();
        } else {
          updateData.targetNumbers = await this.mpConsumersRepository.getConsumerNumbers(updateData.targetAudience);
          updateData.targetConsumers = await this.mpConsumersRepository.getConsumerData(updateData.targetAudience);
        }
        updateData.totalTargets = updateData.targetNumbers.length;
      }

      return await this.mpSalesTasksRepository.updateSalesTask(taskId, updateData);
    } catch (error) {
      console.error("Error updating sales task:", error);
      throw error;
    }
  }

  async toggleSalesTaskStatus(taskId, isActive) {
    try {
      // If deactivating, cancel scheduled job
      if (!isActive && this.scheduledJobs.has(taskId)) {
        const job = this.scheduledJobs.get(taskId);
        job.destroy();
        this.scheduledJobs.delete(taskId);
      }

      return await this.mpSalesTasksRepository.toggleSalesTaskStatus(taskId, isActive);
    } catch (error) {
      console.error("Error toggling sales task status:", error);
      throw error;
    }
  }

  async deleteSalesTask(taskId) {
    try {
      // Cancel scheduled job if exists
      if (this.scheduledJobs.has(taskId)) {
        const job = this.scheduledJobs.get(taskId);
        job.destroy();
        this.scheduledJobs.delete(taskId);
      }

      return await this.mpSalesTasksRepository.deleteSalesTask(taskId);
    } catch (error) {
      console.error("Error deleting sales task:", error);
      throw error;
    }
  }

  async getConsumerGroups() {
    try {
      return await this.mpConsumersRepository.getConsumerGroups();
    } catch (error) {
      console.error("Error fetching consumer groups:", error);
      return [];
    }
  }

  async getConsumerTypes() {
    try {
      console.log("SalesAgentService.getConsumerTypes - Getting consumer types");
      const types = await this.mpConsumersRepository.getConsumerTypes();
      console.log("Consumer types from repository:", types);
      return types;
    } catch (error) {
      console.error("Error fetching consumer types:", error);
      return [];
    }
  }

  async getSalesTaskStats() {
    try {
      return await this.mpSalesTasksRepository.getTaskStats();
    } catch (error) {
      console.error("Error fetching sales task stats:", error);
      return { total: 0, byStatus: {} };
    }
  }

  async getConsumerStats() {
    try {
      return await this.mpConsumersRepository.getConsumerStats();
    } catch (error) {
      console.error("Error fetching consumer stats:", error);
      return { total: 0, byType: {} };
    }
  }

  // Get consumers who have birthday today
  async getBirthdayConsumersForToday() {
    try {
      console.log("Getting birthday consumers for today from mp_consumers...");
      
      const today = new Date();
      const todayMonth = today.getMonth() + 1; // getMonth() returns 0-11, so add 1
      const todayDate = today.getDate();
      
      console.log(`Looking for birthdays on: ${todayMonth}/${todayDate} (${today.toISOString().split('T')[0]})`);
      
      // For testing: if today is July 21st, also look for September 27th to match the sample data
      const testMonth = 9;  // September
      const testDate = 27;   // 27th
      const isTestingMode = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
      
      if (isTestingMode) {
        console.log(`TESTING MODE: Also looking for test birthday ${testMonth}/${testDate}`);
      }
      
      // Get all consumers and filter by birthday
      const allConsumers = await this.mpConsumersRepository.findAll();
      console.log(`Total consumers in database: ${allConsumers.length}`);
      
      const birthdayConsumers = allConsumers.filter(consumer => {
        if (!consumer.Date_Of_Birth) {
          console.log(`Consumer ${consumer.name} has no Date_Of_Birth field`);
          return false;
        }
        
        try {
          const birthDate = new Date(consumer.Date_Of_Birth);
          const birthMonth = birthDate.getMonth() + 1;
          const birthDay = birthDate.getDate();
          
          const isMatch = (birthMonth === todayMonth && birthDay === todayDate) || 
                         (isTestingMode && birthMonth === testMonth && birthDay === testDate);
          
          if (isMatch) {
            console.log(`✓ BIRTHDAY MATCH: ${consumer.name} - Birthday: ${birthMonth}/${birthDay}, Today: ${todayMonth}/${todayDate}${isTestingMode ? ' (or test date)' : ''}`);
          } else {
            console.log(`  ${consumer.name}: Birthday ${birthMonth}/${birthDay}, Today ${todayMonth}/${todayDate} - No match`);
          }
          
          return isMatch;
        } catch (error) {
          console.error(`Error parsing birth date for consumer ${consumer.name}:`, error);
          return false;
        }
      });
      
      console.log(`Found ${birthdayConsumers.length} consumers with birthdays today`);
      
      // Map consumers to match the expected format
      const mappedConsumers = birthdayConsumers.map(consumer => ({
        Contact_Name: consumer.name,
        Primary_Mobile_Number: consumer.phoneNumber,
        Date_Of_Birth: consumer.Date_Of_Birth,
        Consumer_Type: consumer.type,
        Location: consumer.location
      }));
      
      console.log("Mapped birthday consumers:", mappedConsumers.map(c => ({
        name: c.Contact_Name,
        phone: c.Primary_Mobile_Number,
        type: c.Consumer_Type
      })));
      
      return mappedConsumers;
      
    } catch (error) {
      console.error("Error getting birthday consumers:", error);
      return [];
    }
  }

  // Create personalized birthday message (same as Campaign Manager but adapted for mp_consumers)
  createPersonalizedBirthdayMessage(consumer) {
    try {
      // Handle both mp_consumers and mp_customers data structures
      const name = consumer.Contact_Name || consumer.name || 'Valued Customer';
      
      // Always use the actual name, not the placeholder
      const firstName = name === '[Lead Name]' ? 'Valued Customer' : name.split(' ')[0];
      
      console.log(`Creating birthday message for: ${name}, firstName: ${firstName}`);
      
      const birthdayMessages = [
        `🎉 Happy Birthday ${firstName}! 🎂 Wishing you a day filled with happiness and joy! May this new year of your life bring you prosperity and success. Thank you for being a valued part of the Magic Paints family! 🎈`,
        `🎊 Many happy returns of the day, ${firstName}! 🎁 On your special day, we wish you all the best. May your birthday be as wonderful as you are! Here's to another year of great partnership with Magic Paints! 🌟`,
        `🎂 Warmest birthday wishes to you, ${firstName}! 🎉 May this day mark the beginning of a year filled with good luck, good health, and much happiness. Thank you for choosing Magic Paints! 🎈`
      ];
      
      // Select a random birthday message
      const randomIndex = Math.floor(Math.random() * birthdayMessages.length);
      const finalMessage = birthdayMessages[randomIndex];
      
      console.log(`Generated birthday message: ${finalMessage}`);
      return finalMessage;
    } catch (error) {
      console.error("Error creating personalized birthday message:", error);
      return "🎉 Happy Birthday! Wishing you a wonderful day filled with joy and celebration! Thank you for being part of the Magic Paints family! 🎂🎈";
    }
  }
}
