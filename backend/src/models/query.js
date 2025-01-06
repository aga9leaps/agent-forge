class Query {
  constructor(rawQuery, userId, timestamp = new Date()) {
    this.rawQuery = rawQuery;
    this.userId = userId;
    this.timestamp = timestamp;
    this.parsedQuery = null;
    this.taskType = null;
  }
}

export default Query;
