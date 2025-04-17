import fs from "fs/promises";
import path from "path";
import SQLDatabase from "../databases/sql.js";

class BaseSqlRepository {
  constructor() {
    this.pool = null;
  }

  async getPool() {
    if (!this.pool) {
      this.pool = await SQLDatabase.getSqlConnection();
    }
    return this.pool;
  }

  async createTable(tableSchemaPath) {
    try {
      const pool = await this.getPool();

      const schemaFilePath = path.resolve(tableSchemaPath);
      const tableSchema = await fs.readFile(schemaFilePath, "utf8");

      await pool.query(tableSchema);
      console.log(`Created ${tableName} table`);
    } catch (error) {
      console.error("Error creating table:", error?.message || error);
      return;
    }
  }

  async checkIfTableAlreadyExists(tableName) {
    try {
      const pool = await this.getPool();
      const [rows] = await pool.query(`SHOW TABLES LIKE '${tableName}'`);

      if (rows.length > 0) {
        console.log(`Table "${tableName}" already exists.`);
        return true;
      } else {
        console.log(`Table "${tableName}" does not exist.`);
        return false;
      }
    } catch (error) {
      console.error("Error checking table existence:", error?.message || error);
      return;
    }
  }

  async executeQuery(query, params = []) {
    try {
      const pool = await this.getPool();
      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      if (error?.code === "ER_NO_SUCH_TABLE") {
        console.warn(error?.message);
      } else {
        console.error(
          "Error fetching reminder rules:",
          error?.message || error
        );
      }
      return [];
    }
  }
}

export default BaseSqlRepository;
