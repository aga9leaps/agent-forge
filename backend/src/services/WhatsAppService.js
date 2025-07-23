import { v4 as uuidv4 } from "uuid";
import { axiosInstance } from "../utils/axiosInstance.js";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config({ path: "./configs/.env" });

class WhatsAppService {
  async sendMessageToWhatsApp(
    phoneNumber,
    message,
    mediaUrl = null,
    mediaType = null
  ) {
    const traceId = uuidv4();
    try {
      console.log(`WhatsAppService.sendMessageToWhatsApp - Sending to ${phoneNumber}`);
      console.log(`Message: ${message.substring(0, 100)}...`);
      console.log(`Media URL: ${mediaUrl}`);
      console.log(`Media Type: ${mediaType}`);
      
      let messageData;

      if (mediaUrl && mediaType) {
        // Determine media type for WhatsApp API
        const whatsappMediaType = this.getWhatsAppMediaType(mediaType);
        console.log(`WhatsApp media type: ${whatsappMediaType}`);

        if (whatsappMediaType === "image") {
          messageData = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: phoneNumber,
            type: "image",
            image: {
              link: mediaUrl,
              caption: message,
            },
          };
        } else if (whatsappMediaType === "document") {
          messageData = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: phoneNumber,
            type: "document",
            document: {
              link: mediaUrl,
              caption: message,
              filename: "attachment.pdf",
            },
          };
        } else {
          // If media type not supported, send as text with media link
          messageData = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: phoneNumber,
            type: "text",
            text: {
              preview_url: true,
              body: `${message}\n\nMedia: ${mediaUrl}`,
            },
          };
        }
      } else {
        // Send as text message
        messageData = {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: phoneNumber,
          type: "text",
          text: { preview_url: false, body: message },
        };
      }

      console.log(`WhatsApp message data:`, JSON.stringify(messageData, null, 2));

      const response = await axiosInstance.post(`/messages`, messageData, {
        headers: { "X-Trace-Id": traceId },
      });

      console.log(
        `Message sent to ${phoneNumber}: ${message.substring(0, 50)}...${
          mediaUrl ? " with media" : ""
        }`
      );
      console.log(`WhatsApp API response:`, response.data);
      return response.data;
    } catch (error) {
      console.error("Error sending message:", error.response?.data || error);
      return null;
    }
  }

  getWhatsAppMediaType(mimeType) {
    if (mimeType.startsWith("image/")) {
      return "image";
    } else if (mimeType === "application/pdf" || mimeType.includes("document")) {
      return "document";
    }
    return "text";
  }

  async sendInitialMessage(phoneNumber, consumerName) {
    const traceId = uuidv4();
    try {
      const response = await axiosInstance.post(
        `/messages`,
        {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: phoneNumber,
          type: "template",
          template: {
            name: "sales_intro_vijay",
            language: {
              code: "en",
            },
            components: [
              {
                type: "body",
                parameters: [
                  {
                    type: "text",
                    parameter_name: "consumer_name",
                    text: consumerName,
                  },
                ],
              },
            ],
          },
        },
        {
          headers: { "X-Trace-Id": traceId },
        }
      );
      console.log(`Message sent to ${phone}:`);
      return response.data;
    } catch (error) {
      console.error("Error sending message:", error.response?.data || error);
      return null;
    }
  }

  async getWhatsAppMediaUrl(mediaId) {
    try {
      const response = await axios.get(
        `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION}/${mediaId}`,
        {
          params: {
            phone_number_id: process.env.WHATSAPP_ACCOUNT_ID,
          },
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          },
        }
      );

      console.log("Media URL:", response.data.url);
      return response.data.url;
    } catch (error) {
      console.error(
        "Error getting media details:",
        error.response?.data || error.message || error
      );
      throw error;
    }
  }

  async getWhatsAppMediaBase64Buffer(mediaUrl) {
    try {
      const token = process.env.WHATSAPP_TOKEN;
      const response = await axios.get(mediaUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "arraybuffer",
      });

      return Buffer.from(response.data).toString("base64");
    } catch (error) {
      console.error(
        "Error getting media details:",
        error.response?.data || error
      );
    }
  }
}

export default new WhatsAppService();
