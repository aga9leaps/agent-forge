import Task from "../models/task.js";

class Orchestrator {
  constructor(queryInterpreter, taskManager) {
    this.queryInterpreter = queryInterpreter;
    this.taskManager = taskManager;
    this.activeWorkflows = new Map();
  }

  async processQuery(query) {
    try {
      const interpretedQuery = await this.queryInterpreter.interpretQuery(
        query
      );

      const task = new Task(interpretedQuery);

      const routedTask = await this.taskManager.routeTask(task);

      this.activeWorkflows.set(task.id, {
        taskId: task.id,
        status: "IN_PROGRESS",
        startTime: new Date(),
      });

      return routedTask;
    } catch (error) {
      console.error("Error in workflow:", error);
      throw new Error("Workflow processing failed");
    }
  }

  async getWorkflowStatus(taskId) {
    const workflow = this.activeWorkflows.get(taskId);
    if (!workflow) return null;

    const task = this.taskManager.getTaskStatus(taskId);
    return {
      ...workflow,
      task: task,
    };
  }
}

export default Orchestrator;
