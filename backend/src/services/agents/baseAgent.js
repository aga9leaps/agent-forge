class BaseAgent {
  constructor(db) {
    this.db = db;
  }

  async processTask(task) {
    throw new Error(
      "processTask method must be implemented by derived classes"
    );
  }

  async validateTask(task) {
    if (!task || !task.query || !task.query.parsedQuery) {
      throw new Error("Invalid task structure");
    }
  }
}

export default BaseAgent;
