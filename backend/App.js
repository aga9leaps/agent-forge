import express from "express";
import createAgentRouter from "./src/routes/agentRouter.js";
import cors from "cors";
import initializeDatabases from "./src/utils/initializeDatabases.js";
const app = express();
import dotenv from "dotenv";
dotenv.config({ path: "./configs/.env" });
app.use(cors());
const PORT = process.env.PORT || 3000;

async function initializeApplication() {
  try {
    await initializeDatabases(process.env.SQL_DB_NAME);

    console.log("Application initialized successfully.");
  } catch (error) {
    console.error("Error initializing application:", error);
    process.exit(1);
  }
}

await initializeApplication();

app.use(express.json());
app.use(express.static(".")); // Serve static files from the current directory
app.use("/api", createAgentRouter());

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
