import BaseMongoRepository from "./baseRepository/baseMongoRepository.js";
import { v4 as uuidv4 } from 'uuid';

export default class MPSalesTasksRepository extends BaseMongoRepository {
  constructor(collectionName = 'mp_sales_tasks') {
    super(collectionName);
  }

  async createSalesTask(taskData) {
    try {
      const collection = await this.getCollection();
      const task = {
        taskId: uuidv4(),
        ...taskData,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'pending',
        sentCount: 0,
        failedCount: 0,
        executionLogs: [],
        sentTo: [],
        failedTo: []
      };

      const result = await collection.insertOne(task);
      return { ...task, _id: result.insertedId };
    } catch (error) {
      console.error('Error creating sales task:', error);
      throw error;
    }
  }

  async getAllSalesTasks(limit = 10, offset = 0) {
    try {
      const collection = await this.getCollection();
      
      console.log("mpSalesTasksRepository.getAllSalesTasks - Executing with limit:", limit, "offset:", offset);
      
      // Get total count
      const total = await collection.countDocuments({});
      
      // Get paginated tasks
      const tasks = await collection
        .find({})
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .toArray();
      
      console.log("mpSalesTasksRepository.getAllSalesTasks - Result:", { 
        tasksCount: tasks.length, 
        total,
        limit,
        offset
      });
      
      return {
        tasks,
        total
      };
    } catch (error) {
      console.error('Error fetching all sales tasks:', error);
      return { tasks: [], total: 0 };
    }
  }

  async findOne(query) {
    try {
      const collection = await this.getCollection();
      return await collection.findOne(query);
    } catch (error) {
      console.error('Error finding sales task:', error);
      throw error;
    }
  }

  async updateSalesTask(taskId, updateData) {
    try {
      const collection = await this.getCollection();
      const result = await collection.updateOne(
        { taskId },
        { 
          $set: { 
            ...updateData, 
            updatedAt: new Date() 
          } 
        }
      );
      return result;
    } catch (error) {
      console.error('Error updating sales task:', error);
      throw error;
    }
  }

  async updateTaskExecution(taskId, executionData) {
    try {
      const collection = await this.getCollection();
      const result = await collection.updateOne(
        { taskId },
        { 
          $set: { 
            ...executionData,
            updatedAt: new Date() 
          },
          $push: {
            executionLogs: {
              timestamp: new Date(),
              ...executionData
            }
          }
        }
      );
      return result;
    } catch (error) {
      console.error('Error updating task execution:', error);
      throw error;
    }
  }

  async toggleSalesTaskStatus(taskId, isActive) {
    try {
      const collection = await this.getCollection();
      const result = await collection.updateOne(
        { taskId },
        { 
          $set: { 
            isActive,
            updatedAt: new Date() 
          } 
        }
      );
      return result;
    } catch (error) {
      console.error('Error toggling sales task status:', error);
      throw error;
    }
  }

  async deleteSalesTask(taskId) {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteOne({ taskId });
      return result;
    } catch (error) {
      console.error('Error deleting sales task:', error);
      throw error;
    }
  }

  async findByStatus(status) {
    try {
      const collection = await this.getCollection();
      return await collection.find({ status }).toArray();
    } catch (error) {
      console.error('Error finding tasks by status:', error);
      throw error;
    }
  }

  async getTaskStats() {
    try {
      const collection = await this.getCollection();
      const pipeline = [
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ];
      
      const stats = await collection.aggregate(pipeline).toArray();
      const total = await collection.countDocuments();
      
      return {
        total,
        byStatus: stats.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('Error getting task stats:', error);
      throw error;
    }
  }

  async getTasksByDateRange(startDate, endDate) {
    try {
      const collection = await this.getCollection();
      return await collection.find({
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }).toArray();
    } catch (error) {
      console.error('Error getting tasks by date range:', error);
      throw error;
    }
  }

  async updateTaskProgress(taskId, progress) {
    try {
      const collection = await this.getCollection();
      const result = await collection.updateOne(
        { taskId },
        { 
          $set: { 
            progress,
            updatedAt: new Date() 
          } 
        }
      );
      return result;
    } catch (error) {
      console.error('Error updating task progress:', error);
      throw error;
    }
  }

  async addExecutionLog(taskId, logData) {
    try {
      const collection = await this.getCollection();
      const result = await collection.updateOne(
        { taskId },
        { 
          $push: {
            executionLogs: {
              timestamp: new Date(),
              ...logData
            }
          }
        }
      );
      return result;
    } catch (error) {
      console.error('Error adding execution log:', error);
      throw error;
    }
  }
}
