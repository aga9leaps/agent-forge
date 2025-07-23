import SQLDatabase from "../databases/sql.js";
import MongoDatabase from "../databases/mongo.js";
import MilvusDatabase from "../databases/milvus.js";

async function initializeDatabases(SQL_DB_NAME) {
  try {
    await SQLDatabase.createPool(SQL_DB_NAME);
    console.log("SQL pool created successfully.");
  } catch (err) {
    console.error("Failed to create SQL pool: " + err.message);
    throw new Error("Failed to create SQL pool: " + err.message);
  }

  let mongoClient;
  try {
    mongoClient = await MongoDatabase.connect();
    console.log("Connected to MongoDB successfully.");
  } catch (err) {
    throw new Error("Failed to connect to MongoDB: " + err.message);
  }

  try {
    await MilvusDatabase.createClient();
    console.log("Connected to Milvus successfully.");
  } catch (err) {
    console.error("Failed to connect to Milvus: " + err.message);
    // Continue without Milvus as it may not be critical
  }
  
  return mongoClient; // Return the MongoDB client for use in the app
}

export default initializeDatabases;
