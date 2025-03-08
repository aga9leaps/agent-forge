import express from "express";
import cors from "cors";
import apiRoutes from "./src/routes/api.js";
import config from "./src/config/config.js";
import errorHandler from "./src/middlewares/errorHandler.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", apiRoutes);

// 404 Error handling middleware
app.use((req, res, next) => {
  const error = new Error("URL NOT FOUND");
  error.status = 404;
  next(error);
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(config.server.PORT, () => {
  console.log(`Server running on port ${config.server.PORT}`);
});
