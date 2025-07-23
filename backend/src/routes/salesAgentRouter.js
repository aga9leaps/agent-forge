import express from "express";
import multer from "multer";
import SalesAgentController from "../controllers/SalesAgentController.js";

const router = express.Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and documents
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and documents are allowed.'), false);
    }
  }
});

export default function createSalesAgentRouter() {
  const salesAgentController = new SalesAgentController();
  // Test connection
  router.get("/test-connection", salesAgentController.testConnection.bind(salesAgentController));

  // Message refinement
  router.post("/refine-message", salesAgentController.refineMessage.bind(salesAgentController));

  // Sales task CRUD operations
  router.post("/tasks", upload.single('media'), salesAgentController.createSalesTask.bind(salesAgentController));
  router.get("/tasks", salesAgentController.getAllSalesTasks.bind(salesAgentController));
  router.put("/tasks/:taskId", upload.single('media'), salesAgentController.updateSalesTask.bind(salesAgentController));
  router.patch("/tasks/:taskId/toggle", salesAgentController.toggleSalesTaskStatus.bind(salesAgentController));
  router.delete("/tasks/:taskId", salesAgentController.deleteSalesTask.bind(salesAgentController));

  // Sales task execution
  router.post("/tasks/:taskId/execute", salesAgentController.executeSalesTask.bind(salesAgentController));

  // Consumer groups and types
  router.get("/consumer-groups", salesAgentController.getConsumerGroups.bind(salesAgentController));
  router.get("/consumer-types", salesAgentController.getConsumerTypes.bind(salesAgentController));

  // Media upload
  router.post("/upload-media", upload.single('media'), salesAgentController.uploadMedia.bind(salesAgentController));

  // Statistics
  router.get("/stats/tasks", salesAgentController.getSalesTaskStats.bind(salesAgentController));
  router.get("/stats/consumers", salesAgentController.getConsumerStats.bind(salesAgentController));

  return router;
}
