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
const queryInterpreter = new QueryInterpreter();
const taskManager = new TaskManager();
const orchestrator = new Orchestrator(queryInterpreter, taskManager);
const scheduler = new Scheduler(orchestrator);

// Initialize controllers
const queryController = new QueryController(orchestrator);
const schedulerController = new SchedulerController(scheduler);
const authController = new AuthController(sqlInstance);

// Authentication routes
router.post("/auth/login", (req, res) => authController.login(req, res));
router.post("/auth/logout", (req, res) => authController.logout(req, res));

// Query routes
router.post("/query", (req, res) => queryController.submitQuery(req, res));
router.get("/workflow/:taskId", (req, res) =>
  queryController.getWorkflowStatus(req, res)
);

// Scheduler routes
router.post("/schedule", (req, res) =>
  schedulerController.scheduleQuery(req, res)
);

router.get(
  "/schedule/:scheduleId",

  (req, res) => schedulerController.getScheduledTask(req, res)
);
router.get("/schedules", (req, res) =>
  schedulerController.listScheduledTasks(req, res)
);
router.delete(
  "/schedule/:scheduleId",

  (req, res) => schedulerController.cancelScheduledTask(req, res)
);

export default router;
