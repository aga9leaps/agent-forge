class TaskManager {
  constructor() {
    this.tasks = new Map();
  }

  async routeTask(task) {
    try {
      task.status = "ROUTING";
      task.startedAt = new Date();

      const agent = this.determineAgent(task.query.parsedQuery.reportType);
      task.assignedAgent = agent;

      this.tasks.set(task.id, task);

      task.status = "ROUTED";

      return task;
    } catch (error) {
      task.status = "ROUTING_FAILED";
      throw error;
    }
  }

  determineAgent(reportType) {
    const agentMap = {
      GENERAL: "GeneralAgent",
      REPORT: "ReportingAgent",
      // FINANCIAL: "FinancialReportingAgent",
      // OPERATIONAL: "OperationalReportingAgent",
      // TEAM: "TeamReportingAgent",
    };

    return agentMap[reportType] || "GeneralAgent";
  }

  getTaskStatus(taskId) {
    return this.tasks.get(taskId);
  }

  updateTaskStatus(taskId, status, result = null) {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = status;
      if (result) task.result = result;
      if (status === "COMPLETED" || status === "FAILED") {
        task.completedAt = new Date();
      }
      return true;
    }
    return false;
  }
}

export default TaskManager;
