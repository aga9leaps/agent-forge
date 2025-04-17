import { v4 as uuidv4 } from "uuid";
import BaseMongoRepository from "../../core/baseRepository/baseMongoRepository.js";

export default class TasksRepository extends BaseMongoRepository {
  constructor(collectionName) {
    super(collectionName);
  }

  async setCronJob(jobDetails) {
    const jobId = `job-${uuidv4()}`;
    const cronJob = {
      jobId,
      jobName: jobDetails.jobName,
      jobType: jobDetails.jobType, // "recurring" or "one-time"
      cronTime: jobDetails.cronTime, // cron expression (for recurring) OR ISO date (for one-time)
      frequency: jobDetails.frequency,
      nextRun: jobDetails.nextRun, // For one-time jobs
      jobData: jobDetails.cronJobData,
      isActive: true,
      createdAt: new Date(),
    };

    return await this.insertOne(cronJob);
  }

  async getAllCronJobs() {
    const jobs = await this.find({});
    return jobs || [];
  }

  async getAllActiveCronJobs() {
    const activeTasks = await this.find({ isActive: true });

    return activeTasks || null;
  }

  async updateCronJob(jobId, jobDetails) {
    return await this.findOneAndUpdate(
      { jobId },
      {
        $set: {
          jobName: jobDetails.jobName,
          jobType: jobDetails.jobType,
          cronTime: jobDetails.cronTime,
          frequency: jobDetails.frequency,
          nextRun: jobDetails.nextRun,
          jobData: jobDetails.cronJobData,
          isActive: true,
        },
      },
      { returnDocument: "after", upsert: true }
    );
  }

  async deactivateCronJob(jobId, isActive) {
    return await this.updateOne(
      { jobId },
      { $set: { isActive: isActive, status: "completed" } }
    );
  }

  async disableCronJob(jobId) {
    const status = await this.updateOne(
      { jobId },
      {
        $set: { isActive: false },
      }
    );

    if (!status?.acknowledged) return false;
    return true;
  }

  async deleteJobById(jobId) {
    const status = await this.deleteOne({ jobId });

    if (!status?.acknowledged) return false;

    return true;
  }

  async deleteAllJobs() {
    const status = await this.deleteMany();

    if (!status?.acknowledged) return false;

    return true;
  }
}
