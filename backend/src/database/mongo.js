import { MongoClient } from "mongodb";
import config from "../config/config.js";

class MongoDatabase {
  static async connect() {
    const uri = config.mongo.MONGO_URI;
    if (!this.client) {
      this.client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      await this.client.connect();
    }
    return this.client.db();
  }

  static disconnect() {
    return this.client ? this.client.close() : Promise.resolve();
  }

  static async getDatabase() {
    if (!this.dbInstance) {
      this.dbInstance = await connect();
    }
    return this.dbInstance;
  }
}

export default MongoDatabase;
