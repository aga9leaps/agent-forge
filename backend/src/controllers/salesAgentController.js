import SalesAgentService from '../services/salesAgentService.js';

export default class SalesAgentController {
  constructor() {
    this.salesAgentService = new SalesAgentService();
  }

  async refineMessage(req, res) {
    try {
      const { originalMessage, messageType } = req.body;

      if (!originalMessage) {
        return res.status(400).json({ 
          success: false, 
          message: 'Original message is required' 
        });
      }

      const refinedMessage = await this.salesAgentService.refineMessage(originalMessage, messageType);
      
      res.json({
        success: true,
        refinedMessage
      });
    } catch (error) {
      console.error('Error refining message:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to refine message',
        error: error.message 
      });
    }
  }

  async createSalesTask(req, res) {
    try {
      console.log("SalesAgentController.createSalesTask - Request body:", req.body);
      console.log("SalesAgentController.createSalesTask - Request file:", req.file ? req.file.originalname : 'No file');
      
      const taskData = {
        ...req.body,
        mediaFile: req.file
      };

      // Handle pre-uploaded media URL
      if (req.body.mediaUrl && !taskData.mediaFile) {
        console.log("Using pre-uploaded media URL for sales task:", req.body.mediaUrl, req.body.mediaType);
        taskData.mediaUrl = req.body.mediaUrl;
        taskData.mediaType = req.body.mediaType;
      }

      console.log("SalesAgentController.createSalesTask - Task data:", taskData);

      const result = await this.salesAgentService.createSalesTask(taskData);
      
      console.log("SalesAgentController.createSalesTask - Result:", result);
      
      res.json({
        success: true,
        message: 'Sales task created successfully',
        task: result
      });
    } catch (error) {
      console.error('Error creating sales task:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to create sales task',
        error: error.message 
      });
    }
  }

  async getAllSalesTasks(req, res) {
    try {
      // Get pagination parameters from query string
      const limit = parseInt(req.query.limit) || 10;
      const offset = parseInt(req.query.offset) || 0;
      const page = Math.floor(offset / limit) + 1;
      
      console.log("SalesAgentController.getAllSalesTasks - Pagination params:", { limit, offset, page });
      
      const result = await this.salesAgentService.getAllSalesTasks(limit, offset);
      
      res.json({
        success: true,
        tasks: result.tasks,
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit)
      });
    } catch (error) {
      console.error('Error fetching sales tasks:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch sales tasks',
        error: error.message 
      });
    }
  }

  async updateSalesTask(req, res) {
    try {
      const { taskId } = req.params;
      const updateData = {
        ...req.body,
        mediaFile: req.file
      };

      // Handle pre-uploaded media URL
      if (req.body.mediaUrl && !updateData.mediaFile) {
        console.log("Using pre-uploaded media URL for sales task update:", req.body.mediaUrl, req.body.mediaType);
        updateData.mediaUrl = req.body.mediaUrl;
        updateData.mediaType = req.body.mediaType;
      }

      const result = await this.salesAgentService.updateSalesTask(taskId, updateData);
      
      res.json({
        success: true,
        message: 'Sales task updated successfully',
        result
      });
    } catch (error) {
      console.error('Error updating sales task:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to update sales task',
        error: error.message 
      });
    }
  }

  async toggleSalesTaskStatus(req, res) {
    try {
      const { taskId } = req.params;
      const { isActive } = req.body;

      const result = await this.salesAgentService.toggleSalesTaskStatus(taskId, isActive);
      
      res.json({
        success: true,
        message: `Sales task ${isActive ? 'activated' : 'deactivated'} successfully`,
        result
      });
    } catch (error) {
      console.error('Error toggling sales task status:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to toggle sales task status',
        error: error.message 
      });
    }
  }

  async deleteSalesTask(req, res) {
    try {
      const { taskId } = req.params;

      const result = await this.salesAgentService.deleteSalesTask(taskId);
      
      res.json({
        success: true,
        message: 'Sales task deleted successfully',
        result
      });
    } catch (error) {
      console.error('Error deleting sales task:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to delete sales task',
        error: error.message 
      });
    }
  }

  async executeSalesTask(req, res) {
    try {
      const { taskId } = req.params;

      const result = await this.salesAgentService.executeSalesTask(taskId);
      
      res.json({
        success: true,
        message: 'Sales task executed successfully',
        result
      });
    } catch (error) {
      console.error('Error executing sales task:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to execute sales task',
        error: error.message 
      });
    }
  }

  async getConsumerGroups(req, res) {
    try {
      const groups = await this.salesAgentService.getConsumerGroups();
      
      res.json({
        success: true,
        groups
      });
    } catch (error) {
      console.error('Error fetching consumer groups:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch consumer groups',
        error: error.message 
      });
    }
  }

  async getConsumerTypes(req, res) {
    try {
      console.log("SalesAgentController.getConsumerTypes - Getting consumer types");
      const types = await this.salesAgentService.getConsumerTypes();
      console.log("Consumer types from service:", types);
      
      res.json({
        success: true,
        types,
        data: types // Include both for compatibility
      });
    } catch (error) {
      console.error('Error fetching consumer types:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch consumer types',
        error: error.message 
      });
    }
  }

  async uploadMedia(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: 'No file uploaded' 
        });
      }

      const fileName = `sales_media_${Date.now()}_${req.file.originalname}`;
      const mediaUrl = await this.salesAgentService.uploadMedia(req.file.buffer, fileName, req.file.mimetype);
      
      res.json({
        success: true,
        message: 'Media uploaded successfully',
        url: mediaUrl,
        mediaUrl: mediaUrl,
        mediaType: req.file.mimetype,
        data: {
          mediaUrl: mediaUrl,
          mediaType: req.file.mimetype,
          fileName: req.file.originalname
        }
      });
    } catch (error) {
      console.error('Error uploading media:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to upload media',
        error: error.message 
      });
    }
  }

  async getSalesTaskStats(req, res) {
    try {
      const stats = await this.salesAgentService.getSalesTaskStats();
      
      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('Error fetching sales task stats:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch sales task stats',
        error: error.message 
      });
    }
  }

  async getConsumerStats(req, res) {
    try {
      const stats = await this.salesAgentService.getConsumerStats();
      
      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('Error fetching consumer stats:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch consumer stats',
        error: error.message 
      });
    }
  }

  async testConnection(req, res) {
    try {
      // Test database connections
      const consumerStats = await this.salesAgentService.getConsumerStats();
      const taskStats = await this.salesAgentService.getSalesTaskStats();
      
      res.json({
        success: true,
        message: 'Sales Agent API connection successful',
        data: {
          consumerStats,
          taskStats,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error testing connection:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to test connection',
        error: error.message 
      });
    }
  }
}
