import express from "express";
import createAgentRouter from "./src/routes/agentRouter.js";
import createSalesAgentRouter from "./src/routes/salesAgentRouter.js";
import createCampaignManagerRouter from "./src/routes/campaignManagerRouter.js";
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
app.use(express.static(".")); // Serve static files from the current directory
app.use("/api", createAgentRouter());
app.use("/api/sales", createSalesAgentRouter());
app.use("/api/campaign", createCampaignManagerRouter());

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Print available routes for debugging
  console.log('\nAvailable Routes:');
  // Safely log registered routes
  try {
    // Log static routes (just informational)
    console.log('Static file serving: /');
    
    // Log API routes we know are registered
    console.log('API Routes:');
    console.log('Various\t/api/*      (Agent Router)');
    console.log('Various\t/api/sales/* (Sales Agent Router)');
    console.log('Various\t/api/campaign/* (Campaign Manager Router)');
    
    // For a more detailed route list, we'd need to use Express Router introspection
    // which is implementation-specific and version dependent
  } catch (error) {
    console.error('Error printing routes:', error.message);
  }
  
  console.log("\nAPI Server is ready!");
});
