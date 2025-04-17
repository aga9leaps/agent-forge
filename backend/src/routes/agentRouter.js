import express from "express";
import ChatController from "../controllers/chatController.js";
import CustomerInteractionController from "../controllers/customerInteractionController.js";

const createAgentRouter = (clientConfig) => {
  const router = express.Router();

  const chatController = new ChatController(clientConfig);
  chatController.initController();

  const customerInteractionController = new CustomerInteractionController(
    clientConfig
  );
  customerInteractionController.initController();

  router.post("/chat", async (req, res) => {
    await chatController.handleChatRequest(req, res);
  });
  router.post("/send-birthday-message", async (req, res) => {
    await customerInteractionController.sendBirthdayMessage(req, res);
  });
  router.post("/process-reminder", async (req, res) => {
    await customerInteractionController.processReminders(req, res);
  });

  // Whatsapp Webhook Listeners
  router.get("/whatsapp/webhook", async (req, res) => {
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
  router.post("/whatsapp/webhook", async (req, res) => {
    await chatController.handleWhatsAppWebhook(req, res);
  });

  return router;
};

export default createAgentRouter;
