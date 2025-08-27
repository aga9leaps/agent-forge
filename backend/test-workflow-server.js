import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import workflowRouter from "./src/routes/workflowRouter.js";
import { contextMiddleware } from "./src/middleware/contextMiddleware.js";

// Initialize environment variables
dotenv.config({ path: "./configs/.env" });
console.log("Starting test server with OpenAI Key:", process.env.OPENAI_API_KEY ? "Set (hidden)" : "Not Set");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Add context middleware
app.use("/api", contextMiddleware);

// Workflow routes
app.use("/api/workflows", workflowRouter);

// Simple health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Workflow test server running" });
});

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`Available routes:`);
  console.log(`GET  /health - Health check`);
  console.log(`POST /api/workflows/load - Load workflow`);
  console.log(`POST /api/workflows/execute/:name - Execute workflow`);
  console.log(`GET  /api/workflows - List workflows`);
  console.log("");
  console.log("Ready to test workflows!");
});