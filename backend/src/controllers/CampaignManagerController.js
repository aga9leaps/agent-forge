import CampaignManagerService from "../services/CampaignManagerService.js";

export default class CampaignManagerController {
  constructor() {
    this.campaignManagerService = new CampaignManagerService();
  }

  async refineMessage(req, res) {
    try {
      const { message, campaignType } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const refinedMessage = await this.campaignManagerService.refineMessage(message, campaignType);

      return res.status(200).json({
        success: true,
        originalMessage: message,
        refinedMessage
      });
    } catch (error) {
      console.error("Error refining message:", error);
      return res.status(500).json({ error: "Failed to refine message" });
    }
  }

  async createCampaign(req, res) {
    try {
      const campaignData = {
        ...req.body,
        mediaFile: req.file // If media file is uploaded
      };

      const result = await this.campaignManagerService.createCampaign(campaignData);

      return res.status(201).json({
        success: true,
        message: "Campaign created successfully",
        data: result
      });
    } catch (error) {
      console.error("Error creating campaign:", error);
      return res.status(500).json({ error: "Failed to create campaign" });
    }
  }

  async getAllCampaigns(req, res) {
    try {
      const campaigns = await this.campaignManagerService.getAllCampaigns();

      return res.status(200).json({
        success: true,
        data: campaigns
      });
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      return res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  }

  async updateCampaign(req, res) {
    try {
      const { taskId } = req.params;
      const updateData = {
        ...req.body,
        mediaFile: req.file // If media file is uploaded
      };

      const result = await this.campaignManagerService.updateCampaign(taskId, updateData);

      return res.status(200).json({
        success: true,
        message: "Campaign updated successfully",
        data: result
      });
    } catch (error) {
      console.error("Error updating campaign:", error);
      return res.status(500).json({ error: "Failed to update campaign" });
    }
  }

  async toggleCampaignStatus(req, res) {
    try {
      const { taskId } = req.params;
      const { isActive } = req.body;

      const result = await this.campaignManagerService.toggleCampaignStatus(taskId, isActive);

      return res.status(200).json({
        success: true,
        message: `Campaign ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: result
      });
    } catch (error) {
      console.error("Error toggling campaign status:", error);
      return res.status(500).json({ error: "Failed to toggle campaign status" });
    }
  }

  async deleteCampaign(req, res) {
    try {
      const { taskId } = req.params;

      const result = await this.campaignManagerService.deleteCampaign(taskId);

      return res.status(200).json({
        success: true,
        message: "Campaign deleted successfully",
        data: result
      });
    } catch (error) {
      console.error("Error deleting campaign:", error);
      return res.status(500).json({ error: "Failed to delete campaign" });
    }
  }

  async executeCampaign(req, res) {
    try {
      const { taskId } = req.params;

      const result = await this.campaignManagerService.executeCampaign(taskId);

      return res.status(200).json({
        success: true,
        message: "Campaign executed successfully",
        data: result
      });
    } catch (error) {
      console.error("Error executing campaign:", error);
      return res.status(500).json({ error: "Failed to execute campaign" });
    }
  }

  async getCustomerGroups(req, res) {
    try {
      const groups = await this.campaignManagerService.getCustomerGroups();

      return res.status(200).json({
        success: true,
        data: groups
      });
    } catch (error) {
      console.error("Error fetching customer groups:", error);
      return res.status(500).json({ error: "Failed to fetch customer groups" });
    }
  }

  async sendBirthdayMessages(req, res) {
    try {
      const result = await this.campaignManagerService.sendBirthdayMessages();

      return res.status(200).json({
        success: true,
        message: "Birthday messages sent successfully",
        data: result
      });
    } catch (error) {
      console.error("Error sending birthday messages:", error);
      return res.status(500).json({ error: "Failed to send birthday messages" });
    }
  }

  async uploadMedia(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const mediaUrl = await this.campaignManagerService.uploadMedia(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      return res.status(200).json({
        success: true,
        message: "Media uploaded successfully",
        data: {
          mediaUrl,
          mediaType: req.file.mimetype,
          fileName: req.file.originalname
        }
      });
    } catch (error) {
      console.error("Error uploading media:", error);
      return res.status(500).json({ error: "Failed to upload media" });
    }
  }

  async sendReminders(req, res) {
    try {
      const { reminderType } = req.body;

      if (!reminderType || !['order', 'payment'].includes(reminderType)) {
        return res.status(400).json({ 
          error: "Invalid reminder type. Must be 'order' or 'payment'" 
        });
      }

      const result = await this.campaignManagerService.sendReminders(reminderType);

      return res.status(200).json({
        success: true,
        message: `${reminderType} reminders processed successfully`,
        data: result
      });
    } catch (error) {
      console.error("Error sending reminders:", error);
      return res.status(500).json({ error: "Failed to send reminders" });
    }
  }

  async executeReminderCampaign(req, res) {
    try {
      const { taskId } = req.params;

      const result = await this.campaignManagerService.executeReminderCampaign(taskId);

      return res.status(200).json({
        success: true,
        message: "Reminder campaign executed successfully",
        data: result
      });
    } catch (error) {
      console.error("Error executing reminder campaign:", error);
      return res.status(500).json({ error: "Failed to execute reminder campaign" });
    }
  }
}
