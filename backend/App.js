import express from "express";
import ConfigLoader from "./core/ConfigLoader.js";
import initializeDatabases from "./core/utils/initializeDatabases.js";
import createAgentRouter from "./src/routes/agentRouter.js";
import cors from "cors";
const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;
let clientConfig;

async function initializeApplication() {
  try {
    clientConfig = await ConfigLoader.loadClientConfig("magic_paints");

    await initializeDatabases(clientConfig?.databases.sql.dbName);

    console.log("Application initialized successfully.");
  } catch (error) {
    console.error("Error initializing application:", error);
    process.exit(1);
  }
}

await initializeApplication();

app.use(express.json());
app.use("/api", createAgentRouter(clientConfig));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
