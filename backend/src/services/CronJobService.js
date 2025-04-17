import { CronJob } from "cron";
import EventEmitter from "events";
import TasksRepository from "../repository/tasksRepository.js";

export default class CronJobService extends EventEmitter {
  constructor(clientConfig) {
    super();
    this.jobs = {};
    this.clientConfig = clientConfig;
    const collectionName =
      this.clientConfig?.databases?.mongo?.tasksCollectionName;
    this.taskRepository = new TasksRepository(collectionName);
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
