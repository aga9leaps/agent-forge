class Task {
  constructor(query, priority = 1) {
    this.id = Date.now().toString();
    this.query = query;
    this.status = "PENDING";
    this.priority = priority;
    this.assignedAgent = null;
    this.createdAt = new Date();
    this.startedAt = null;
    this.completedAt = null;
    this.result = null;
  }
}

export default Task;
