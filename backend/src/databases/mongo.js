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
      console.log("MongoDB connection established");
    }
    return this.client;
  }

  static disconnect() {
    return this.client ? this.client.close() : Promise.resolve();
  }

  static async getDatabase(dbName = null) {
    if (!this.client) {
      await this.connect();
    }
    
    // If a specific database name is provided, return that database
    if (dbName) {
      return this.client.db(dbName);
    }
    
    // Otherwise return the default database from the connection string
    return this.client.db();
  }
}

export default MongoDatabase;
