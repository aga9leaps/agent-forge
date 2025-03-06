import express from "express";
import QueryInterpreter from "../services/queryInterpreter.js";
import TaskManager from "../services/taskManager.js";
import Orchestrator from "../services/orchestrator.js";
import Scheduler from "../services/scheduler.js";
import QueryController from "../controllers/queryController.js";
import SchedulerController from "../controllers/schedulerController.js";
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
