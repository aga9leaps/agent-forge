import mysql from "mysql2/promise";
import config from "../config/config.js";

class SQLDatabase {
  static async createPool() {
    if (!this.pool) {
      this.pool = mysql.createPool({
        host: config.sql.DB_HOST,
        user: config.sql.DB_USER,
        password: config.sql.DB_PASSWORD,
        database: config.sql.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
      });

      // Pool event handling
      this.pool.on("connection", () => {
        console.log("New connection established in pool");
      });

      this.pool.on("error", (err) => {
        console.error("Pool error:", err);
      });

      console.log("MySQL pool created.");
    }
    return this.pool;
  }

  static async closePool() {
    try {
      if (this.pool) {
        await this.pool.end();
        console.log("MySQL pool connections closed.");
      }
    } catch (err) {
      console.error("Error closing MySQL pool:", err);
    }
  }

  // Utility method for health check
  static async checkConnection() {
    try {
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();
      return true;
    } catch (error) {
      console.error("Database health check failed:", error);
      return false;
    }
  }
}

export default SQLDatabase;
