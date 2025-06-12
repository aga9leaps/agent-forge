import { v4 as uuidv4 } from "uuid";
import { axiosInstance } from "../utils/axiosInstance.js";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config({ path: "./configs/.env" });

class WhatsAppService {
  async sendMessageToWhatsApp(phoneNumber, message) {
    const traceId = uuidv4();
    try {
      const response = await axiosInstance.post(
        `/messages`,
        {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: phoneNumber,
          type: "text",
          text: { preview_url: false, body: message },
        },
        {
          headers: { "X-Trace-Id": traceId },
        }
      );
      console.log(`Message sent to ${phoneNumber}: ${message}`);
      return response.data;
    } catch (error) {
      console.error("Error sending message:", error.response?.data || error);
      return null;
    }
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
