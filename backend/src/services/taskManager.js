import AgentFactory from "./agentFactory.js";

class TaskManager {
  constructor(sqlInstance) {
    this.tasks = new Map();
    this.agentFactory = new AgentFactory(sqlInstance);
  }

  async routeTask(task) {
    try {
      task.status = "ROUTING";
      task.startedAt = new Date();

      // Determine appropriate agent based on report type
      const agentType = this.determineAgent(task.query.parsedQuery.reportType);
      const agent = this.agentFactory.createAgent(agentType);
      task.assignedAgent = agentType;

      // Store task
      this.tasks.set(task.id, task);

      // Process the task with the agent
      const result = await agent.processTask(task);
      task.result = result;
      task.status = "COMPLETED";

      return task;
    } catch (error) {
      task.status = "ROUTING_FAILED";
      throw error;
    }
  }

  determineAgent(reportType) {
    const agentMap = {
      GENERAL_REPORT: "GENERAL",
      FINANCIAL_REPORT: "FINANCIAL",
      OPERATIONAL_REPORT: "OPERATIONAL",
      TEAM_REPORT: "TEAM",
      CUSTOMER_INTERACTION: "CustomerInteractionAgent",
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
