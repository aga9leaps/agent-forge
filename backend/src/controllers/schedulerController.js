class SchedulerController {
  constructor(scheduler) {
    this.scheduler = scheduler;
  }

  async scheduleQuery(req, res) {
    try {
      const { cronExpression, rawQuery, userId, metadata } = req.body;

      // Validate request
      if (!cronExpression || !rawQuery || !userId) {
        return res.status(400).json({
          success: false,
          error: "Cron expression, raw query, and userId are required",
        });
      }

      const query = new Query(rawQuery, userId);
      const scheduleId = this.scheduler.scheduleTask(
        cronExpression,
        query,
        metadata
      );

      return res.json({
        success: true,
        scheduleId: scheduleId,
        message: "Query scheduled successfully",
      });
    } catch (error) {
      console.error("Error in scheduleQuery:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to schedule query",
      });
    }
  }

  async getScheduledTask(req, res) {
    try {
      const { scheduleId } = req.params;

      if (!scheduleId) {
        return res.status(400).json({
          success: false,
          error: "Schedule ID is required",
        });
      }

      const scheduledTask = this.scheduler.getScheduledTask(scheduleId);

      if (!scheduledTask) {
        return res.status(404).json({
          success: false,
          error: "Scheduled task not found",
        });
      }

      return res.json({
        success: true,
        scheduledTask: {
          id: scheduleId,
          cronExpression: scheduledTask.cronExpression,
          metadata: scheduledTask.metadata,
          createdAt: scheduledTask.createdAt,
        },
      });
    } catch (error) {
      console.error("Error in getScheduledTask:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to get scheduled task",
      });
    }
  }

  async listScheduledTasks(req, res) {
    try {
      const tasks = this.scheduler.listScheduledTasks();
      return res.json({
        success: true,
        tasks: tasks,
      });
    } catch (error) {
      console.error("Error in listScheduledTasks:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to list scheduled tasks",
      });
    }
  }

  async cancelScheduledTask(req, res) {
    try {
      const { scheduleId } = req.params;

      if (!scheduleId) {
        return res.status(400).json({
          success: false,
          error: "Schedule ID is required",
        });
      }

      const cancelled = this.scheduler.cancelTask(scheduleId);

      if (!cancelled) {
        return res.status(404).json({
          success: false,
          error: "Scheduled task not found",
        });
      }

      return res.json({
        success: true,
        message: "Scheduled task cancelled successfully",
      });
    } catch (error) {
      console.error("Error in cancelScheduledTask:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to cancel scheduled task",
      });
    }
  }
}

export default SchedulerController;
