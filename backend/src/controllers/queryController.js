import Query from "../models/query.js";

class QueryController {
  constructor(orchestrator) {
    this.orchestrator = orchestrator;
  }

  async submitQuery(req, res) {
    try {
      const { rawQuery, userId } = req.body;

      // Validate request
      if (!rawQuery || !userId) {
        return res.status(400).json({
          success: false,
          error: "Raw query and userId are required",
        });
      }

      const query = new Query(rawQuery, userId);
      const task = await this.orchestrator.processQuery(query);

      return res.json({
        success: true,
        taskId: task.id,
        status: task.status,
        message: "Query submitted successfully",
      });
    } catch (error) {
      console.error("Error in submitQuery:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to submit query",
      });
    }
  }

  async getWorkflowStatus(req, res) {
    try {
      const { taskId } = req.params;

      if (!taskId) {
        return res.status(400).json({
          success: false,
          error: "Task ID is required",
        });
      }

      const workflow = await this.orchestrator.getWorkflowStatus(taskId);

      if (!workflow) {
        return res.status(404).json({
          success: false,
          error: "Workflow not found",
        });
      }

      return res.json({
        success: true,
        workflow: workflow,
      });
    } catch (error) {
      console.error("Error in getWorkflowStatus:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to get workflow status",
      });
    }
  }
}

export default QueryController;
