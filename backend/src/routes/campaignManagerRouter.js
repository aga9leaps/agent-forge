import express from "express";
import multer from "multer";
import CampaignManagerController from "../controllers/CampaignManagerController.js";

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

export default function createCampaignManagerRouter() {
  const campaignManagerController = new CampaignManagerController();

  // Message refinement
  router.post("/refine-message", campaignManagerController.refineMessage.bind(campaignManagerController));

  // Campaign CRUD operations
  router.post("/campaigns", upload.single('media'), campaignManagerController.createCampaign.bind(campaignManagerController));
  router.get("/campaigns", campaignManagerController.getAllCampaigns.bind(campaignManagerController));
  router.put("/campaigns/:taskId", upload.single('media'), campaignManagerController.updateCampaign.bind(campaignManagerController));
  router.patch("/campaigns/:taskId/toggle", campaignManagerController.toggleCampaignStatus.bind(campaignManagerController));
  router.delete("/campaigns/:taskId", campaignManagerController.deleteCampaign.bind(campaignManagerController));

  // Campaign execution
  router.post("/campaigns/:taskId/execute", campaignManagerController.executeCampaign.bind(campaignManagerController));

  // Customer groups
  router.get("/customer-groups", campaignManagerController.getCustomerGroups.bind(campaignManagerController));

  // Birthday messages
  router.post("/send-birthday-messages", campaignManagerController.sendBirthdayMessages.bind(campaignManagerController));

  // Media upload
  router.post("/upload-media", upload.single('media'), campaignManagerController.uploadMedia.bind(campaignManagerController));

  // Reminder endpoints
  router.post("/send-reminders", campaignManagerController.sendReminders.bind(campaignManagerController));
  router.post("/campaigns/:taskId/execute-reminder", campaignManagerController.executeReminderCampaign.bind(campaignManagerController));

  return router;
}
