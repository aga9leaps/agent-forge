import express from "express";
import ChatController from "../controllers/chatController.js";
import CustomerInteractionController from "../controllers/customerInteractionController.js";
import AuthController from "../controllers/authController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import financeBotController from "../controllers/financeBotController.js";
import {
  translateText,
  translateMessages,
  detectLanguage,
  getSupportedLanguages,
} from "../controllers/translationController.js";
import dotenv from "dotenv";
import ReportingAgentController from "../controllers/reportingAgentController.js";
import reportingAgentRouter from "./reportingAgentRouter.js";
dotenv.config({ path: "./configs/.env" });

const createAgentRouter = () => {
  const router = express.Router();

  const chatController = new ChatController();
  chatController.initController();

  const customerInteractionController = new CustomerInteractionController();
  customerInteractionController.initController();

  // AuthController integration
  const authController = new AuthController();
  // Auth routes
  router.post("/login", (req, res) => authController.login(req, res));
  router.post("/logout", (req, res) => authController.logout(req, res));

  router.post("/chat", async (req, res) => {
    await chatController.handleChatRequest(req, res);
  });
  router.post("/send-birthday-message", async (req, res) => {
    await customerInteractionController.sendBirthdayMessage(req, res);
  });
  router.post("/process-reminder", async (req, res) => {
    await customerInteractionController.processReminders(req, res);
  });
  router.post("/send-reminder", async (req, res) => {
    await customerInteractionController.sendReminders(req, res);
  });

  router.post(
    "/finance-bot/speech-to-text",
    (req, res, next) => {
      financeBotController.upload.single("audio")(req, res, (err) => {
        if (err) {
          console.error("Multer error:", err.message);
          return res.status(400).json({
            error: "File upload error",
            details: err.message,
          });
        }
        next();
      });
    },
    financeBotController.speechToText
  );

  // New endpoint for speech-to-text with chat processing
  router.post(
    "/finance-bot/speech-to-text-chat",
    authenticateToken,
    (req, res, next) => {
      financeBotController.upload.single("audio")(req, res, (err) => {
        if (err) {
          console.error("Multer error:", err.message);
          return res.status(400).json({
            error: "File upload error",
            details: err.message,
          });
        }
        // Set processAsChat to true for this endpoint
        req.body.processAsChat = true;
        next();
      });
    },
    financeBotController.speechToText
  );

  // Translation Routes
  router.post("/translate/text", translateText);
  router.post("/translate/messages", translateMessages);
  router.post("/translate/detect-language", detectLanguage);
  router.get("/translate/supported-languages", getSupportedLanguages);
  router.get(
    "/download/:reportName/:fromDate/:toDate",
    financeBotController.downloadReport
  );
  router.get(
    "/view/:reportName/:fromDate/:toDate",
    financeBotController.viewReport
  );
  router.get(
    "/view/:reportName/:fromDate/:toDate",
    financeBotController.viewReport
  );
  router.post(
    "/finance-bot/chat",
    authenticateToken,
    financeBotController.chat
  );
  router.get(
    "/finance-bot/history",
    authenticateToken,
    financeBotController.getChatHistory
  );
  router.post(
    "/finance-bot/clearChatHistory",
    authenticateToken,
    financeBotController.clearChatHistory
  );
  router.post(
    "/finance-bot/feedback",
    authenticateToken,
    financeBotController.saveFeedback
  );
  //presales Whatsapp Webhook Listeners
  router.get("/whatsapp/preSales", async (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    const MY_WHATSAPP_VERIFY_TOKEN = process.env.MY_WHATSAPP_TOKEN;

    if (mode && token === MY_WHATSAPP_VERIFY_TOKEN) {
      console.log("listening to whatsapp webhook");

      return res.status(200).send(challenge);
    } else {
      return res.sendStatus(403);
    }
  });
  router.post("/whatsapp/preSales", async (req, res) => {
    await chatController.handleWhatsAppWebhook(req, res);
  });
    //dealers engagement Whatsapp Webhook Listeners
  router.get("/whatsapp/dealers", async (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    const MY_WHATSAPP_VERIFY_TOKEN = process.env.MY_WHATSAPP_TOKEN;

    if (mode && token === MY_WHATSAPP_VERIFY_TOKEN) {
      console.log("listening to whatsapp webhook");

      return res.status(200).send(challenge);
    } else {
      return res.sendStatus(403);
    }
  });
  router.post("/whatsapp/dealers", async (req, res) => {
    await customerInteractionController.sendReminders(req, res);
  });

  // Add reporting agent routes
  router.use("/reporting-agent", reportingAgentRouter);

  return router;
};

export default createAgentRouter;
