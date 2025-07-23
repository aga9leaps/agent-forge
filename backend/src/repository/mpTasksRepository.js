import BaseMongoRepository from "./baseRepository/baseMongoRepository.js";
import { v4 as uuidv4 } from "uuid";

export default class MPTasksRepository extends BaseMongoRepository {
  constructor(collectionName) {
    super(collectionName);
  }

  async createCampaignTask(taskData) {
    try {
      const taskId = `mp_task_${uuidv4()}`;
      const campaignTask = {
        taskId,
        taskName: taskData.taskName,
        taskType: taskData.taskType, // 'broadcast' or 'personalized'
        campaignType: taskData.campaignType, // 'product_launch', 'scheme_launch', 'newsletter', 'birthday', 'anniversary'
        message: taskData.message,
        refinedMessage: taskData.refinedMessage || null,
        mediaUrl: taskData.mediaUrl || null,
        mediaType: taskData.mediaType || null,
        targetAudience: taskData.targetAudience || 'all', // 'all', 'birthday', 'custom'
        targetNumbers: taskData.targetNumbers || [],
        scheduleType: taskData.scheduleType || 'immediate', // 'immediate', 'scheduled', 'recurring'
        scheduledDateTime: taskData.scheduledDateTime || null,
        frequency: taskData.frequency || null,
        cronTime: taskData.cronTime || null,
        isActive: Boolean(taskData.isActive !== false),
        status: taskData.status || 'pending', // 'pending', 'in_progress', 'completed', 'failed'
        sentCount: 0,
        failedCount: 0,
        totalTargets: taskData.totalTargets || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: taskData.createdBy || 'admin',
        executionLogs: []
      };

      const result = await this.create(campaignTask);
      return { ...result, taskId };
    } catch (error) {
      console.error("Error creating campaign task:", error);
      throw error;
    }
  }

  async getAllCampaignTasks() {
    try {
      const tasks = await this.find({});
      return tasks.map(task => ({
        ...task,
        isActive: task.isActive === null ? true : Boolean(task.isActive),
        scheduledDateTime: task.scheduledDateTime === "null" ? null : task.scheduledDateTime,
      }));
    } catch (error) {
      console.error("Error fetching campaign tasks:", error);
      return [];
    }
  }

  async getActiveCampaignTasks() {
    try {
      const activeTasks = await this.find({
        $or: [
          { isActive: true },
          { isActive: null }
        ]
      });

      return activeTasks.map(task => ({
        ...task,
        isActive: task.isActive === null ? true : Boolean(task.isActive),
        scheduledDateTime: task.scheduledDateTime === "null" ? null : task.scheduledDateTime,
      }));
    } catch (error) {
      console.error("Error fetching active campaign tasks:", error);
      return [];
    }
  }

  async updateCampaignTask(taskId, updateData) {
    try {
      const result = await this.findOneAndUpdate(
        { taskId },
        {
          $set: {
            ...updateData,
            updatedAt: new Date(),
          },
        },
        { returnDocument: "after" }
      );
      
      if (result && result.value) {
        result.value.isActive = result.value.isActive === null ? true : Boolean(result.value.isActive);
        result.value.scheduledDateTime = result.value.scheduledDateTime === "null" ? null : result.value.scheduledDateTime;
      }
      
      return result;
    } catch (error) {
      console.error(`Error updating campaign task ${taskId}:`, error);
      throw error;
    }
  }

  async toggleCampaignTaskStatus(taskId, newActiveState) {
    try {
      const result = await this.findOneAndUpdate(
        { taskId },
        {
          $set: { 
            isActive: Boolean(newActiveState),
            updatedAt: new Date()
          },
        },
        { returnDocument: "after" }
      );
      
      if (result && result.value) {
        result.value.isActive = result.value.isActive === null ? true : Boolean(result.value.isActive);
        result.value.scheduledDateTime = result.value.scheduledDateTime === "null" ? null : result.value.scheduledDateTime;
      }
      
      return result;
    } catch (error) {
      console.error(`Error toggling campaign task ${taskId}:`, error);
      return false;
    }
  }

  async deleteCampaignTask(taskId) {
    try {
      const result = await this.deleteOne({ taskId });
      return result?.acknowledged || false;
    } catch (error) {
      console.error(`Error deleting campaign task ${taskId}:`, error);
      return false;
    }
  }

  async updateTaskExecution(taskId, executionData) {
    try {
      const result = await this.findOneAndUpdate(
        { taskId },
        {
          $set: {
            status: executionData.status,
            sentCount: executionData.sentCount,
            failedCount: executionData.failedCount,
            updatedAt: new Date()
          },
          $push: {
            executionLogs: {
              timestamp: new Date(),
              message: executionData.message,
              sentTo: executionData.sentTo || [],
              failedTo: executionData.failedTo || []
            }
          }
        },
        { returnDocument: "after" }
      );
      
      return result;
    } catch (error) {
      console.error(`Error updating task execution ${taskId}:`, error);
      throw error;
    }
  }

  async getTasksByType(taskType) {
    try {
      return await this.find({ taskType });
    } catch (error) {
      console.error(`Error fetching tasks by type ${taskType}:`, error);
      return [];
    }
  }

  async getTasksByCampaignType(campaignType) {
    try {
      return await this.find({ campaignType });
    } catch (error) {
      console.error(`Error fetching tasks by campaign type ${campaignType}:`, error);
      return [];
    }
  }

  async getScheduledTasks() {
    try {
      return await this.find({ 
        scheduleType: { $in: ['scheduled', 'recurring'] },
        isActive: true,
        status: { $in: ['pending', 'in_progress'] }
      });
    } catch (error) {
      console.error("Error fetching scheduled tasks:", error);
      return [];
    }
  }
}
