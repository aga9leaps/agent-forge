import WhatsAppService from "../../core/WhatsAppService.js";
import ClientService from "../services/ClientService.js";
import CronJobService from "../services/cronJobService.js";
import GoogleSheetService from "../services/GoogleSheetService.js";

class ChatController {
  constructor() {}

  initController() {
    const cronJobService = new CronJobService();
    cronJobService.initialize();
    const googleSheetService = new GoogleSheetService();
    this.clientService = new ClientService(cronJobService, googleSheetService);
  }

  async handleChatRequest(req, res) {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
      return res
        .status(400)
        .json({ error: "phoneNumber and message are required" });
    }

    try {
      const response = await this.clientService.handleChatRequest(
        message,
        phoneNumber
      );
      const whatsAppResponse = await WhatsAppService.sendMessageToWhatsApp(
        phoneNumber,
        response
      );

      return res.status(200).json({
        generatedText: response,
        whatsAppMessageSendDetails: whatsAppResponse,
      });
    } catch (error) {
      console.error("Error in handleChatRequest:", error);
      return res.status(500).json({ error: "Failed to process the request" });
    }
  }

  async handleImageRequest(req, res) {
    const { phoneNumber, imageId } = req.body;

    if (!phoneNumber || !imageId) {
      return res
        .status(400)
        .json({ error: "Phone number and image id are required" });
    }

    try {
      const response = await this.clientService.handleImageRequest(
        imageUrl,
        phoneNumber
      );
      const whatsAppResponse = await WhatsAppService.sendMessageToWhatsApp(
        phoneNumber,
        response
      );

      return res.status(200).json({
        generatedText: response,
        whatsAppMessageSendDetails: whatsAppResponse,
      });
    } catch (error) {
      console.error("Error in handleChatRequest:", error);
      return res.status(500).json({ error: "Failed to process the request" });
    }
  }

  async handleWhatsAppWebhook(req, res) {
    const body = req.body;

    try {
      if (body.object === "whatsapp_business_account") {
        if (
          body.entry &&
          body.entry[0].changes &&
          body.entry[0].changes[0].value.statuses
        ) {
          return res.sendStatus(200);
        }

        const messages = body.entry?.[0]?.changes?.[0]?.value?.messages;

        if (messages && messages.length > 0) {
          // Send 200 OK immediately to acknowledge receipt
          res.sendStatus(200);

          const message = messages[0];
          const phoneNumber = message.from;
          const text = message.text?.body;

          switch (message.type) {
            case "text":
              const response = await this.clientService.handleChatRequest(
                text,
                phoneNumber
              );
              await WhatsAppService.sendMessageToWhatsApp(
                phoneNumber,
                response
              );
              break;
            case "image":
              await this.clientService.handleImageRequest(
                message.image.id,
                phoneNumber
              );
              break;
            case "audio":
              console.log("Audio message received:", message.audio.id);

              await this.clientService.handleAudioRequest(
                message.audio.id,
                phoneNumber
              );
              break;
            default:
              console.log("Unknown message type:", message.type);
          }
        } else {
          return res.sendStatus(200);
        }
      } else {
        return res.sendStatus(404);
      }
    } catch (error) {
      console.error("Error in handleWhatsAppWebhook:", error);
      return res.sendStatus(500);
    }
  }
}

export default ChatController;
