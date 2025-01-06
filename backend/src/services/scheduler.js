import cron from "node-cron";

class Scheduler {
  constructor(orchestrator) {
    this.orchestrator = orchestrator;
    this.scheduledTasks = new Map();
  }

  scheduleTask(cronExpression, query, metadata = {}) {
    // Validate cron expression
    if (!cron.validate(cronExpression)) {
      throw new Error("Invalid cron expression");
    }

    const job = cron.schedule(cronExpression, async () => {
      try {
        // Add metadata to track scheduled execution
        query.metadata = {
          ...metadata,
          scheduledExecutionTime: new Date(),
          isScheduledTask: true,
        };

        await this.orchestrator.processQuery(query);
      } catch (error) {
        console.error("Scheduled task failed:", error);
      }
    });

    const scheduleId = Date.now().toString();
    this.scheduledTasks.set(scheduleId, {
      job,
      cronExpression,
      query,
      metadata,
      createdAt: new Date(),
    });

    return scheduleId;
  }

  cancelTask(scheduleId) {
    const scheduledTask = this.scheduledTasks.get(scheduleId);
    if (scheduledTask) {
      scheduledTask.job.stop();
      this.scheduledTasks.delete(scheduleId);
      return true;
    }
    return false;
  }

  getScheduledTask(scheduleId) {
    return this.scheduledTasks.get(scheduleId);
  }

  listScheduledTasks() {
    return Array.from(this.scheduledTasks.entries()).map(([id, task]) => ({
      id,
      cronExpression: task.cronExpression,
      metadata: task.metadata,
      createdAt: task.createdAt,
    }));
  }
}

export default Scheduler;
