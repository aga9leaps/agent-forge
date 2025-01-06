import express from "express";
import cors from "cors";
import apiRoutes from "./src/routes/api.js";
import config from "./src/config/config.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", apiRoutes);

// Start server
app.listen(config.server.port, () => {
  console.log(`Server running on port ${config.server.port}`);
});
