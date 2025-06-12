import { CronJob } from "cron";
import EventEmitter from "events";
import TasksRepository from "../repository/tasksRepository.js";
import dotenv from "dotenv";
dotenv.config({ path: "./configs/.env" });

export default class CronJobService extends EventEmitter {
  constructor() {
    super();
    this.jobs = {};
    this.taskRepository = new TasksRepository(process.env.TASKS_COLLECTION);
  }

  async initialize() {
    console.log("Intialiizing CronJobService");
    const activeJobs = await this.taskRepository.getAllActiveCronJobs();
    console.log("🚀 ~ CronJobService ~ initialize ~ activeJobs:", activeJobs);
    activeJobs.forEach((job) => this.scheduleJob(job));
  }

  async emitAsync(eventName, ...args) {
    const listeners = this.listeners(eventName);
    await Promise.all(listeners.map((listener) => listener(...args)));
  }

  scheduleJob(job) {
    const { jobId, jobName, jobType, cronTime, nextRun, jobData } = job;
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
          console.error(`Error executing one-time job ${jobName}:`, error);
        }
      },
      null,
      true,
      "Asia/Kolkata"
    );
  }
}
