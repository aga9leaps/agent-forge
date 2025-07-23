import { CronJob } from "cron";
import EventEmitter from "events";
import TasksRepository from "../repository/tasksRepository.js";
import MPTasksRepository from "../repository/mpTasksRepository.js";
import CampaignManagerService from "./CampaignManagerService.js";
import dotenv from "dotenv";
dotenv.config({ path: "./configs/.env" });

export default class CronJobService extends EventEmitter {
  constructor() {
    super();
    this.jobs = {};
    this.taskRepository = new TasksRepository(process.env.TASKS_COLLECTION);
    this.mpTasksRepository = new MPTasksRepository(process.env.MP_TASKS_COLLECTION || "mp_tasks");
    this.campaignManagerService = new CampaignManagerService();
  }

  async initialize() {
    try {
      console.log("Initializing CronJobService");
      const activeJobs = await this.taskRepository.getAllActiveCronJobs();
      const activeMPJobs = await this.mpTasksRepository.getScheduledTasks();
      
      console.log("🚀 ~ CronJobService ~ initialize ~ activeJobs:", activeJobs.length);
      console.log("🚀 ~ CronJobService ~ initialize ~ activeMPJobs:", activeMPJobs.length);
      
      // Schedule regular jobs
      activeJobs.forEach((job) => {
        if (this.isValidJob(job)) {
          try {
            this.scheduleJob(job);
          } catch (error) {
            console.error(`Failed to schedule job ${job.jobId}:`, error.message);
          }
        } else {
          console.warn(`Skipping invalid job:`, job.jobId);
        }
      });
      
      // Schedule MP campaign jobs
      activeMPJobs.forEach((job) => {
        if (this.isValidMPJob(job)) {
          try {
            this.scheduleMPCampaign(job);
          } catch (error) {
            console.error(`Failed to schedule MP campaign ${job.taskId}:`, error.message);
          }
        } else {
          console.warn(`Skipping invalid MP campaign:`, job.taskId);
        }
      });
      
      console.log("✅ CronJobService initialized successfully");
    } catch (error) {
      console.error("❌ Error initializing CronJobService:", error);
    }
  }

  isValidJob(job) {
    return job && job.jobId && job.cronTime && job.cronTime.trim();
  }

  isValidMPJob(job) {
    return job && job.taskId && job.cronTime && job.cronTime.trim() && job.isActive;
  }

  async emitAsync(eventName, ...args) {
    const listeners = this.listeners(eventName);
    await Promise.all(listeners.map((listener) => listener(...args)));
  }

  scheduleJob(job) {
    try {
      const { jobId, jobName, jobType, cronTime, nextRun, jobData } = job;
      
      if (!jobId) {
        throw new Error("Job ID is required");
      }
      
      if (!cronTime || !cronTime.trim()) {
        throw new Error(`Invalid cron time for job ${jobId}: cronTime is null or empty`);
      }
      
      console.log("🚀 ~ CronJobService ~ scheduleJob ~ jobId:", jobId, jobName);

      if (this.jobs[jobId]) this.jobs[jobId].stop();

      this.jobs[jobId] = new CronJob(
        cronTime,
        async () => {
          try {
            console.log(`Executing job: ${jobName}`);
            await this.emitAsync(jobName, jobData);

            if (jobType === "one-time") {
              await this.taskRepository.deactivateCronJob(jobId);
              this.jobs[jobId].stop();
              delete this.jobs[jobId];
            }
          } catch (error) {
            console.error(`Error executing job ${jobName}:`, error);
          }
        },
        null,
        true,
        "Asia/Kolkata"
      );
      
      console.log(`✅ Job ${jobId} scheduled successfully`);
    } catch (error) {
      console.error(`❌ Error scheduling job:`, error);
      throw error;
    }
  }

  scheduleMPCampaign(campaign) {
    try {
      const { taskId, taskName, cronTime, scheduleType } = campaign;
      
      if (!taskId) {
        throw new Error("Campaign task ID is required");
      }
      
      if (!cronTime || !cronTime.trim()) {
        throw new Error(`Invalid cron time for campaign ${taskId}: cronTime is null or empty`);
      }
      
      console.log("🚀 ~ CronJobService ~ scheduleMPCampaign ~ taskId:", taskId, taskName);

      if (this.jobs[taskId]) this.jobs[taskId].stop();

      this.jobs[taskId] = new CronJob(
        cronTime,
        async () => {
          try {
            console.log(`Executing MP campaign: ${taskName}`);
            await this.campaignManagerService.executeCampaign(taskId);

            if (scheduleType === "scheduled") {
              await this.mpTasksRepository.updateCampaignTask(taskId, { isActive: false });
              this.jobs[taskId].stop();
              delete this.jobs[taskId];
            }
          } catch (error) {
            console.error(`Error executing MP campaign ${taskName}:`, error);
          }
        },
        null,
        true,
        "Asia/Kolkata"
      );
      
      console.log(`✅ MP Campaign ${taskId} scheduled successfully`);
    } catch (error) {
      console.error(`❌ Error scheduling MP campaign:`, error);
      throw error;
    }
  }
}
