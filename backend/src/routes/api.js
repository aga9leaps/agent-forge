import express from "express";
import AuthController from "../controllers/authController.js";
import SQLDatabase from "../database/sql.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Initialize SQL database
const sqlInstance = await SQLDatabase.createPool();

// Initialize services

// Initialize controllers
const authController = new AuthController(sqlInstance);

// Authentication routes
router.post("/auth/login", (req, res) => authController.login(req, res));
router.post("/auth/logout", (req, res) => authController.logout(req, res));

// Query routes

// Scheduler routes

export default router;
