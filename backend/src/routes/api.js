import express from "express";
import SQLDatabase from "../database/sql.js";
import AuthController from "../controllers/authController.js";

const router = express.Router();

// Initialize SQL database
const sqlInstance = await SQLDatabase.createPool().catch((err) => {
  throw new Error("Failed to create SQL pool: " + err.message);
});
// Initialize services

// Initialize controllers
const authController = new AuthController(null, sqlInstance);
await authController.init();

// Authentication routes
router.post("/login", authController.login);
router.post("/logout", authController.logout);

// Query routes

// Scheduler routes

export default router;
