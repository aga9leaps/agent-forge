import { v4 as uuidv4 } from "uuid";
import BaseMongoRepository from "./baseRepository/baseMongoRepository.js";

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
      nextRun: jobDetails.nextRun === "null" ? null : jobDetails.nextRun, // Ensure proper null handling
      jobData: jobDetails.cronJobData,
      isActive: Boolean(jobDetails.isActive !== false), // Ensure boolean type, default to true
      createdAt: new Date(),
    };

    return await this.insertOne(cronJob);
  }

  async getAllCronJobs() {
    const jobs = await this.find({});
    
    // Normalize the data to ensure consistent data types
    const normalizedJobs = (jobs || []).map(job => ({
      ...job,
      isActive: job.isActive === null ? true : Boolean(job.isActive), // Convert null to true, normalize to boolean
      nextRun: job.nextRun === "null" ? null : job.nextRun, // Convert string "null" to actual null
    }));
    
    return normalizedJobs;
  }

  async getAllActiveCronJobs() {
    // Find jobs where isActive is true OR null (treating null as active)
    const activeTasks = await this.find({
      $or: [
        { isActive: true },
        { isActive: null }
      ]
    });

    // Normalize the data to ensure consistent data types
    const normalizedTasks = (activeTasks || []).map(task => ({
      ...task,
      isActive: task.isActive === null ? true : Boolean(task.isActive), // Convert null to true, normalize to boolean
      nextRun: task.nextRun === "null" ? null : task.nextRun, // Convert string "null" to actual null
    }));

    return normalizedTasks;
  }

  async updateCronJob(jobId, jobDetails) {
    const result = await this.findOneAndUpdate(
      { jobId },
      {
        $set: {
          jobName: jobDetails.jobName,
          jobType: jobDetails.jobType,
          cronTime: jobDetails.cronTime,
          frequency: jobDetails.frequency,
          nextRun: jobDetails.nextRun === "null" ? null : jobDetails.nextRun, // Ensure proper null handling
          jobData: jobDetails.cronJobData,
          isActive: Boolean(jobDetails.isActive !== false), // Ensure boolean type, default to true
          updatedAt: new Date(), // Add timestamp for updates
        },
      },
      { returnDocument: "after", upsert: true }
    );
    
    // Normalize the returned data
    if (result && result.value) {
      result.value.isActive = Boolean(result.value.isActive);
      result.value.nextRun = result.value.nextRun === "null" ? null : result.value.nextRun;
    }
    
    return result;
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
