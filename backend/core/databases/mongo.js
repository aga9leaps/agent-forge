import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config({ path: "./configs/.env" });

class MongoDatabase {
  static async connect() {
    const uri = process.env.MONGO_URI;
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
      this.dbInstance = await this.connect();
    }
    return this.dbInstance;
  }
}

export default MongoDatabase;
