import { v4 as uuidv4 } from "uuid";

class CronJobsRepository {
  constructor(db, collection) {
    this.db = db;
    this.collection = collection;
  }

  async setCronJob(jobDetails) {
    try {
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

      // Check if db and collection exist
      if (!this.db || !this.collection) {
        console.error("Database or collection name not provided");
        return { acknowledged: false, error: "Database connection issue" };
      }
      
      // Safely access the collection
      const collection = this.db.collection ? this.db.collection(this.collection) : null;
      if (!collection) {
        console.error(`Collection ${this.collection} not found`);
        return { acknowledged: false, error: "Collection not found" };
      }

      const results = await collection.insertOne(cronJob);
      return { ...results, jobId };
    } catch (error) {
      console.error("Error setting cron job:", error);
      return { acknowledged: false, error: error.message };
    }
  }

  async getAllCronJobs() {
    try {
      // Check if db and collection exist
      if (!this.db || !this.collection) {
        console.error("Database or collection name not provided");
        return [];
      }
      
      // Safely access the collection
      const collection = this.db.collection ? this.db.collection(this.collection) : null;
      if (!collection) {
        console.error(`Collection ${this.collection} not found`);
        return [];
      }
      
      const jobs = await collection.find({}).toArray();
      
      // Normalize the data to ensure consistent data types
      const normalizedJobs = (jobs || []).map(job => ({
        ...job,
        isActive: job.isActive === null ? true : Boolean(job.isActive), // Convert null to true, normalize to boolean
        nextRun: job.nextRun === "null" ? null : job.nextRun, // Convert string "null" to actual null
      }));
      
      return normalizedJobs;
    } catch (error) {
      console.error("Error getting cron jobs:", error);
      return [];
    }
  }

  async getAllActiveCronJobs() {
    try {
      // Check if db and collection exist
      if (!this.db || !this.collection) {
        console.error("Database or collection name not provided");
        return [];
      }
      
      // Safely access the collection
      const collection = this.db.collection ? this.db.collection(this.collection) : null;
      if (!collection) {
        console.error(`Collection ${this.collection} not found`);
        return [];
      }
      
      // Find jobs where isActive is true OR null (treating null as active)
      const activeTasks = await collection
        .find({
          $or: [
            { isActive: true },
            { isActive: null }
          ]
        })
        .toArray();

      // Normalize the data to ensure consistent data types
      const normalizedTasks = (activeTasks || []).map(task => ({
        ...task,
        isActive: task.isActive === null ? true : Boolean(task.isActive), // Convert null to true, normalize to boolean
        nextRun: task.nextRun === "null" ? null : task.nextRun, // Convert string "null" to actual null
      }));

      return normalizedTasks;
    } catch (error) {
      console.error("Error getting active cron jobs:", error);
      return [];
    }
  }

  async updateCronJob(jobId, jobDetails) {
    try {
      // Check if db and collection exist
      if (!this.db || !this.collection) {
        console.error("Database or collection name not provided");
        return null;
      }
      
      // Safely access the collection
      const collection = this.db.collection ? this.db.collection(this.collection) : null;
      if (!collection) {
        console.error(`Collection ${this.collection} not found`);
        return null;
      }
      
      const result = await collection.findOneAndUpdate(
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
    } catch (error) {
      console.error(`Error updating cron job ${jobId}:`, error);
      return null;
    }
  }

  async deactivateCronJob(jobId, isActive) {
    try {
      // Check if db and collection exist
      if (!this.db || !this.collection) {
        console.error("Database or collection name not provided");
        return false;
      }
      
      // Safely access the collection
      const collection = this.db.collection ? this.db.collection(this.collection) : null;
      if (!collection) {
        console.error(`Collection ${this.collection} not found`);
        return false;
      }
      
      const result = await collection.updateOne(
        { jobId },
        { $set: { isActive: isActive, status: "completed" } }
      );
      
      return result && result.acknowledged;
    } catch (error) {
      console.error(`Error deactivating cron job ${jobId}:`, error);
      return false;
    }
  }

  async disableCronJob(jobId) {
    try {
      // Check if db and collection exist
      if (!this.db || !this.collection) {
        console.error("Database or collection name not provided");
        return false;
      }
      
      // Safely access the collection
      const collection = this.db.collection ? this.db.collection(this.collection) : null;
      if (!collection) {
        console.error(`Collection ${this.collection} not found`);
        return false;
      }
      
      console.log(`Disabling cron job with jobId: ${jobId}`);
      
      const status = await collection.updateOne(
        { jobId },
        {
          $set: { isActive: false },
        }
      );

      console.log(`Disable job result:`, status);
      return status?.acknowledged || false;
    } catch (error) {
      console.error(`Error disabling cron job ${jobId}:`, error);
      return false;
    }
  }

  async enableCronJob(jobId) {
    try {
      // Check if db and collection exist
      if (!this.db || !this.collection) {
        console.error("Database or collection name not provided");
        return false;
      }
      
      // Safely access the collection
      const collection = this.db.collection ? this.db.collection(this.collection) : null;
      if (!collection) {
        console.error(`Collection ${this.collection} not found`);
        return false;
      }
      
      console.log(`Enabling cron job with jobId: ${jobId}`);
      
      const status = await collection.updateOne(
        { jobId },
        {
          $set: { isActive: true },
        }
      );

      console.log(`Enable job result:`, status);
      return status?.acknowledged || false;
    } catch (error) {
      console.error(`Error enabling cron job ${jobId}:`, error);
      return false;
    }
  }

  async toggleCronJobStatus(jobId, newActiveState) {
    try {
      // Check if db and collection exist
      if (!this.db || !this.collection) {
        console.error("Database or collection name not provided");
        return false;
      }
      
      // Safely access the collection
      const collection = this.db.collection ? this.db.collection(this.collection) : null;
      if (!collection) {
        console.error(`Collection ${this.collection} not found`);
        return false;
      }
      
      console.log(`Toggling cron job ${jobId} to isActive: ${newActiveState}`);
      
      const status = await collection.updateOne(
        { jobId },
        {
          $set: { isActive: Boolean(newActiveState) },
        }
      );

      console.log(`Toggle job result:`, status);
      return status?.acknowledged || false;
    } catch (error) {
      console.error(`Error toggling cron job ${jobId}:`, error);
      return false;
    }
  }

  async deleteJobById(jobId) {
    try {
      // Check if db and collection exist
      if (!this.db || !this.collection) {
        console.error("Database or collection name not provided");
        return false;
      }
      
      // Safely access the collection
      const collection = this.db.collection ? this.db.collection(this.collection) : null;
      if (!collection) {
        console.error(`Collection ${this.collection} not found`);
        return false;
      }
      
      const status = await collection.deleteOne({ jobId });
      return status?.acknowledged || false;
    } catch (error) {
      console.error(`Error deleting job ${jobId}:`, error);
      return false;
    }
  }

  async deleteAllJobs() {
    try {
      // Check if db and collection exist
      if (!this.db || !this.collection) {
        console.error("Database or collection name not provided");
        return false;
      }
      
      // Safely access the collection
      const collection = this.db.collection ? this.db.collection(this.collection) : null;
      if (!collection) {
        console.error(`Collection ${this.collection} not found`);
        return false;
      }
      
      const status = await collection.deleteMany({});
      return status?.acknowledged || false;
    } catch (error) {
      console.error("Error deleting all jobs:", error);
      return false;
    }
  }

  async resetUser(phoneNumber) {
    try {
      // Check if db exists
      if (!this.db) {
        console.error("Database not provided");
        return false;
      }
      
      // Safely access the collection
      const collection = this.db.collection ? this.db.collection("mp_consumers") : null;
      if (!collection) {
        console.error("Collection mp_consumers not found");
        return false;
      }
      
      const result = await collection.updateOne(
        {
          phoneNumber,
        },
        {
          $set: {
            [`conversations.sessions`]: {},
            [`conversations.activeSession`]: null,
            [`conversations.sessionCounters`]: {},
          },
        }
      );
      console.log("User reset successful");
      return result?.acknowledged || false;
    } catch (error) {
      console.error("User reset unsuccessful:", error);
      return false;
    }
  }

  async cleanupNullValues() {
    try {
      // Check if db and collection exist
      if (!this.db || !this.collection) {
        console.error("Database or collection name not provided");
        return false;
      }
      
      // Safely access the collection
      const collection = this.db.collection ? this.db.collection(this.collection) : null;
      if (!collection) {
        console.error(`Collection ${this.collection} not found`);
        return false;
      }
      
      console.log("Cleaning up null values in cron jobs collection...");
      
      // Update documents where isActive is null to set it to true
      const isActiveResult = await collection.updateMany(
        { isActive: null },
        { $set: { isActive: true } }
      );
      
      // Update documents where nextRun is the string "null" to set it to actual null
      const nextRunResult = await collection.updateMany(
        { nextRun: "null" },
        { $set: { nextRun: null } }
      );
      
      console.log(`Cleanup results: ${isActiveResult.modifiedCount} documents updated for isActive, ${nextRunResult.modifiedCount} documents updated for nextRun`);
      
      return {
        acknowledged: true,
        isActiveUpdated: isActiveResult.modifiedCount,
        nextRunUpdated: nextRunResult.modifiedCount
      };
    } catch (error) {
      console.error("Error cleaning up null values:", error);
      return { acknowledged: false, error: error.message };
    }
  }
}

export default CronJobsRepository;
