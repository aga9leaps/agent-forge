import express from "express";
import ReportingAgentController from "../controllers/reportingAgentController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();
const reportingAgentController = new ReportingAgentController();

// Report Scheduling Routes
router.post("/schedules", (req, res) => reportingAgentController.scheduleReport(req, res));
router.get("/schedules", (req, res) => reportingAgentController.getSchedules(req, res));
router.put("/schedules/:id", (req, res) => reportingAgentController.updateSchedule(req, res));
router.delete("/schedules/:id", (req, res) => reportingAgentController.deleteSchedule(req, res));

// Cash Flow Projections Routes
router.get("/cash-flow-projections", (req, res) => reportingAgentController.getCashFlowProjections(req, res));

// Financial Alerts Routes
router.post("/alerts", (req, res) => reportingAgentController.createAlert(req, res));
router.get("/alerts", (req, res) => reportingAgentController.getAlerts(req, res));
router.put("/alerts/:id", (req, res) => reportingAgentController.updateAlert(req, res));
router.delete("/alerts/:id", (req, res) => reportingAgentController.deleteAlert(req, res));

// Report Assignment Routes
router.post("/assignments", (req, res) => reportingAgentController.assignReport(req, res));
router.get("/assignments", (req, res) => reportingAgentController.getAssignments(req, res));
router.delete("/assignments/:id", (req, res) => reportingAgentController.deleteAssignment(req, res));

export default router;
