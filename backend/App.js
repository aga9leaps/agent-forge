import express from "express";
import createAgentRouter from "./src/routes/agentRouter.js";
import createSalesAgentRouter from "./src/routes/salesAgentRouter.js";
import createCampaignManagerRouter from "./src/routes/campaignManagerRouter.js";
import workflowRouter from "./src/routes/workflowRouter.js";
import systemRouter from "./src/routes/systemRouter.js";
import contextRouter from "./src/routes/contextRouter.js";
import { contextMiddleware } from "./src/middleware/contextMiddleware.js";
import cors from "cors";
import initializeDatabases from "./src/utils/initializeDatabases.js";
import CampaignScheduler from "./src/services/CampaignScheduler.js";
import dotenv from "dotenv";

// Initialize environment variables
dotenv.config({ path: "./configs/.env" });
console.log("Starting server with OpenAI Key:", process.env.OPENAI_API_KEY ? "Set (hidden)" : "Not Set");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // Enable CORS for all routes
// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

async function initializeApplication() {
  try {
    const mongoClient = await initializeDatabases(process.env.SQL_DB_NAME);
    console.log("Application initialized successfully.");
    
    // Get the specific magic_paints database
    const magicPaintsDb = mongoClient.db("magic_paints");
    console.log("Connected to magic_paints database");
    
    return magicPaintsDb; // Return the specific database
  } catch (error) {
    console.error("Error initializing application:", error);
    process.exit(1);
  }
}

const magicPaintsDb = await initializeApplication();

// Initialize Campaign Scheduler
const campaignScheduler = new CampaignScheduler();
campaignScheduler.initialize();

app.use(express.json());

// Add context middleware for all API routes
app.use("/api", contextMiddleware);

// API Routes Only (No Frontend)
app.use("/api", createAgentRouter());
app.use("/api/sales", createSalesAgentRouter());
app.use("/api/campaign", createCampaignManagerRouter());
app.use("/api/workflows", workflowRouter);
app.use("/api", systemRouter);
app.use("/api/contexts", contextRouter);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    name: "Agent Forge API",
    version: "2.0",
    status: "operational",
    endpoints: {
      workflows: "/api/workflows",
      contexts: "/api/contexts", 
      system: "/api/status"
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  console.log('\n=== Agent Forge API Server ===');
  console.log('API Endpoints:');
  console.log('GET     /                          - API Information');
  console.log('GET     /api/status                - System Status');
  console.log('GET     /api/workflows             - List Workflows');
  console.log('POST    /api/workflows/execute/:name - Execute Workflow');
  console.log('GET     /api/workflows/executions/:id - Get Execution Details');
  console.log('POST    /api/workflows/reload      - Reload Workflows');
  console.log('GET     /api/contexts              - List Contexts');
  console.log('GET     /api/contexts/:name        - Get Context');
  console.log('POST    /api/agent/*               - Legacy Agent Endpoints');
  
  console.log("\n✅ API Server Ready! (Frontend removed)");
  console.log("🚀 Test with: curl http://localhost:3000/api/workflows");
});
