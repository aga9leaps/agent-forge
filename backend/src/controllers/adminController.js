import AwsS3Service from "../services/awsS3Service.js";

class AdminController {
  constructor(cronJobService, cronJobsRepository) {
    this.cronJobService = cronJobService;
    this.cronJobsRepository = cronJobsRepository;
    this.s3Service = new AwsS3Service();
  }

  async postTask(req, res) {
    try {
      const { jobName, jobType, cronTime, frequency, nextRun, jobData } = req.body;

      let uploadedMediaUrl = "https://placeholder.com/default-image"; // Better default URL

      // Check if a file was uploaded
      if (req.file) {
        try {
          const fileBuffer = req.file.buffer;
          const fileName = `${Date.now()}-${req.file.originalname}`;
          const fileType = req.file.mimetype;
          const fileCategory = "jobs"; // Folder name in S3

          // Upload file to S3 and get URL
          const fileUrl = await this.s3Service.uploadFileFromBuffer(
            fileBuffer,
            fileName,
            fileType,
            fileCategory
          );
          uploadedMediaUrl = fileUrl;
        } catch (uploadError) {
          console.error("Error uploading file to S3:", uploadError);
          // Continue with default URL if upload fails
        }
      }

      let cronJobData = JSON.parse(jobData);
      cronJobData.uploadMediaUrl = uploadedMediaUrl;

      // Save job in the repository
      const newJob = await this.cronJobsRepository.setCronJob({
        jobName,
        jobType,
        cronTime,
        frequency,
        nextRun,
        cronJobData,
        uploadedMediaUrl,
      });

      await this.cronJobService.initialize();
      return res.status(201).json(newJob);
    } catch (error) {
      console.error("Error creating task:", error);
      return res.status(500).json({ error: "Failed to create task: " + error.message });
    }
  }

  async getAllTasks(req, res) {
    try {
      console.log("Attempting to fetch tasks from collection:", this.cronJobsRepository.collection);
      console.log("Database instance available:", !!this.cronJobsRepository.db);
      
      if (this.cronJobsRepository.db) {
        console.log("Database name:", this.cronJobsRepository.db.databaseName);
        const collections = await this.cronJobsRepository.db.listCollections().toArray();
        console.log("Available collections:", collections.map(c => c.name));
      }
      
      const tasks = await this.cronJobsRepository.getAllCronJobs();
      console.log(`Retrieved ${tasks ? tasks.length : 0} tasks from database`);

      if (!tasks || tasks.length === 0) {
        return res.status(200).json([]); // Return empty array instead of 404
      }

      return res.status(200).json(tasks);
    } catch (error) {
      console.error("Error getting tasks:", error);
      return res.status(500).json({ 
        error: "Failed to get tasks", 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
      });
    }
  }

  async editTask(req, res) {
    try {
      const { jobId, jobName, jobType, cronTime, frequency, nextRun, jobData } =
        req.body;

      if (!jobId) {
        return res.status(400).json({ message: "jobId is required" });
      }

      let cronJobData;
      try {
        cronJobData = JSON.parse(jobData);
      } catch (parseError) {
        return res.status(400).json({ message: "Invalid job data format" });
      }

      const updatedJob = await this.cronJobsRepository.updateCronJob(jobId, {
        jobName,
        jobType,
        cronTime,
        frequency,
        nextRun,
        cronJobData,
      });

      if (!updatedJob)
        return res.status(404).json({ message: "No task found with this id" });

      await this.cronJobService.initialize();
      return res.status(200).json(updatedJob); // Changed to 200 OK
    } catch (error) {
      console.error("Error updating task:", error);
      return res.status(500).json({ error: "Failed to update task: " + error.message });
    }
  }

  async getActiveCronJobs(req, res) {
    try {
      const activeTasks = await this.cronJobsRepository.getAllActiveCronJobs();

      if (!activeTasks || activeTasks.length === 0) {
        return res.status(200).json([]); // Return empty array instead of 404
      }

      return res.status(200).json(activeTasks);
    } catch (error) {
      console.error("Error fetching active tasks:", error);
      return res.status(500).json({ error: "Failed to fetch active tasks: " + error.message });
    }
  }

  async disableActiveCronJob(req, res) {
    try {
      const { jobId, isActive } = req.body;

      if (!jobId) {
        return res.status(400).json({ message: "jobId is required" });
      }

      console.log(`Received request to update job ${jobId}, current isActive: ${isActive}, setting to: ${!isActive}`);

      // Toggle the active state: if currently active, disable it; if inactive, enable it
      const newActiveState = !isActive;
      const updateStatus = await this.cronJobsRepository.toggleCronJobStatus(jobId, newActiveState);

      if (!updateStatus) {
        return res.status(404).json({ message: "No task found with this id" });
      }

      await this.cronJobService.initialize(); // Reinitialize to update active jobs
      return res.status(200).json({ 
        message: "Task status updated successfully",
        newState: newActiveState 
      });
    } catch (error) {
      console.error("Error updating task status:", error);
      return res.status(500).json({ error: "Failed to update task status: " + error.message });
    }
  }

  async deleteCronJobById(req, res) {
    try {
      const { jobId } = req.body;

      if (!jobId) {
        return res.status(400).json({ message: "jobId is required" });
      }

      const deleteStatus = await this.cronJobsRepository.deleteJobById(jobId);
      
      if (!deleteStatus) {
        return res.status(404).json({ message: "No task found with this id" });
      }
      
      await this.cronJobService.initialize(); // Reinitialize to update active jobs
      return res.status(200).json({ message: "Task deleted successfully" });
    } catch (error) {
      console.error("Error deleting task:", error);
      return res.status(500).json({ error: "Failed to delete task: " + error.message });
    }
  }

  async deleteAllCronJobs(req, res) {
    try {
      const deleteStatus = await this.cronJobsRepository.deleteAllJobs();
      
      if (!deleteStatus) {
        return res.status(500).json({ message: "Failed to delete all tasks" });
      }
      
      await this.cronJobService.initialize(); // Reinitialize to update active jobs
      return res.status(200).json({ message: "All tasks deleted successfully" });
    } catch (error) {
      console.error("Error deleting all tasks:", error);
      return res.status(500).json({ error: "Failed to delete all tasks: " + error.message });
    }
  }

  async resetUser(req, res) {
    try {
      const { phoneNumber } = req.body;
      
      if (!phoneNumber) {
        return res.status(400).json({ message: "phoneNumber is required" });
      }
      
      const resetStatus = await this.cronJobsRepository.resetUser(phoneNumber);
      
      if (!resetStatus) {
        return res.status(404).json({ message: "User not found or reset failed" });
      }
      
      return res.status(200).json({ message: "User reset successful" });
    } catch (error) {
      console.error("Error resetting user:", error);
      return res.status(500).json({ error: "Failed to reset user: " + error.message });
    }
  }

  async cleanupDatabase(req, res) {
    try {
      const cleanupResult = await this.cronJobsRepository.cleanupNullValues();
      
      if (!cleanupResult.acknowledged) {
        return res.status(500).json({ 
          message: "Database cleanup failed", 
          error: cleanupResult.error 
        });
      }
      
      return res.status(200).json({ 
        message: "Database cleanup completed successfully",
        results: {
          isActiveUpdated: cleanupResult.isActiveUpdated,
          nextRunUpdated: cleanupResult.nextRunUpdated
        }
      });
    } catch (error) {
      console.error("Error during database cleanup:", error);
      return res.status(500).json({ error: "Failed to cleanup database: " + error.message });
    }
  }
}

export default AdminController;
