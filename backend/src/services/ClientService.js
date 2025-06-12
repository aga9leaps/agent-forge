import AgentService from "./AgentService.js";
import { openaiService } from "../../core/serviceConfigs/OpenAIService.js";
import WhatsAppService from "../../core/WhatsAppService.js";
import { z } from "zod";
import nodemailer from "nodemailer";
import PDFDocument from "pdfkit";
import ConsumerRepository from "../repository/consumerRepository.js";
import { vertexAIService } from "../../core/serviceConfigs/VertexAIService.js";
import PromptRepository from "../repository/promptRepository.js";
import { sttService } from "../../core/STTService.js";
import {
  DISCOUNTS_DATA,
  IMAGE_CLASSIFICATION_PROMPT,
  MODELS,
  SYSTEM_PROMPT,
} from "../utils/constants.js";

class ClientService {
  constructor(cronJobService, googleSheetService) {
    this.consumerRepository = new ConsumerRepository(
      process.env.CONSUMER_COLLECTION
    );
    this.promptRepository = new PromptRepository(
      process.env.PROMPTS_COLLECTION
    );

    this.cronJobService = cronJobService;
    this.googleSheetService = googleSheetService;

    this.registerCronListeners();
    this.responseStructure = z.object({
      score: z.number(),
      shouldSendEmail: z.boolean(),
      emailSubject: z.string(),
      emailBody: z.array(z.string()),
    });
  }

  // Handle chat request
  async handleChatRequest(query, phoneNumber) {
    try {
      const consumer = await this.consumerRepository.getConsumerByPhoneNumber(
        phoneNumber
      );
      const recentSessionId = consumer.conversations.activeSession;
      let history;
      if (!recentSessionId) history = [];
      else {
        history = consumer.conversations.sessions[recentSessionId].chats;
      }

      await this.storeConversation(consumer, "user", query);

      const systemPrompt =
        SYSTEM_PROMPT +
        `\nCurrent Dealer Discounts:\n ${DISCOUNTS_DATA.map(
          (discount, index) => `${index + 1}. ${discount}`
        ).join("\n")}.` +
        `\nCurrent customer: ${consumer.name} (${consumer.type} from ${consumer.location})`;

      const conversationHistory = [
        ...history,
        { role: "user", content: query },
      ];

      // TODO:
      AgentService.clientConfig = this.clientConfig;
      const response = await AgentService.processRequest(
        systemPrompt,
        conversationHistory,
        consumer
      );

      await this.storeConversation(consumer, "assistant", response);

      const chatHistory = [
        ...history,
        { role: "user", content: query },
        { role: "assistant", content: response },
      ];

      await this.analyzeConverstaionInRealTime(consumer, chatHistory);

      return response;
    } catch (error) {
      console.error("Error handling request:", error);
      throw new Error("Failed to handle request");
    }
  }

  // Handle image request
  async handleImageRequest(imageId, phoneNumber) {
    try {
      const mediaUrl = await WhatsAppService.getWhatsAppMediaUrl(imageId);
      const mediaBase64 = await WhatsAppService.getWhatsAppMediaBase64Buffer(
        mediaUrl
      );

      const imageType = await vertexAIService.imageAnalyser(
        MODELS.GEMINI_MODEL,
        mediaBase64,
        IMAGE_CLASSIFICATION_PROMPT
      );

      await WhatsAppService.sendMessageToWhatsApp(
        phoneNumber,
        imageType?.shortDescription
          ? imageType.shortDescription
          : "Thank you, we have received your image."
      );

      const activePrompt = await this.promptRepository.getActivePrompt(
        imageType?.imageType
      );
      if (!activePrompt) {
        console.error("No active prompt found for image type");
        return;
      }

      const analyzeImage = await vertexAIService.imageAnalyser(
        MODELS.GEMINI_MODEL,
        mediaBase64,
        activePrompt
      );
      console.log(
        "🚀 ~ ClientService ~ handleImageRequest ~ analyzeImage:",
        analyzeImage
      );
    } catch (error) {
      console.error("Error handling request:", error);
      throw new Error("Failed to handle request");
    }
  }

  // Handle audio request
  async handleAudioRequest(audioId, phoneNumber) {
    try {
      const mediaUrl = await WhatsAppService.getWhatsAppMediaUrl(audioId);
      const mediaBase64 = await WhatsAppService.getWhatsAppMediaBase64Buffer(
        mediaUrl
      );

      const transcription = await sttService.transcribeAudio(mediaBase64);
      console.log(
        "🚀 ~ ClientService ~ handleAudioRequest ~ transcription:",
        transcription
      );

      const response = await this.handleChatRequest(transcription, phoneNumber);
      console.log(
        "🚀 ~ ClientService ~ handleAudioRequest ~ response:",
        response
      );
      await WhatsAppService.sendMessageToWhatsApp(phoneNumber, response);
    } catch (error) {
      console.error("Error handling request:", error);
      throw new Error("Failed to handle request");
    }
  }

  // Utility function

  registerCronListeners() {
    this.cronJobService.on("initiateConversations", () =>
      this.initiateConversations()
    );

    this.cronJobService.on("syncData", () => this.initiateDataSync());
  }

  async initiateDataSync() {
    const init = await this.googleSheetService.init();
    if (init) {
      await this.googleSheetService.syncDealersToDB();
    }
  }

  async initiateConversations() {
    try {
      const dealers =
        await this.consumerRepository.getConsumersWithoutActiveSession();

      for (const dealer of dealers) {
        try {
          await WhatsAppService.sendInitialMessage(
            dealer.phoneNumber,
            dealer.name
          );
          await this.storeConversation(
            dealer,
            "assistant",
            `Hi ${dealer.name}! 👋 I'm Vijay from Magic Paints 🎨. I'm here to assist you with any questions you may have about our products and services. Let me know how I can help! 😊`
          );
        } catch (error) {
          console.error(`Error processing dealer ${dealer.name}:`, error);
        }
      }
    } catch (error) {
      console.error(
        "Error retrieving dealers or initiating conversations:",
        error
      );
    }
  }

  async storeConversation(consumer, role, content) {
    await this.consumerRepository.saveConversation(consumer, {
      role,
      content,
      timestamp: new Date(),
    });
  }

  async analyzeConverstaionInRealTime(consumer, chatHistory) {
    try {
      const activeSessionId = consumer.conversations.activeSession;
      if (!activeSessionId) {
        console.log("No active session found... returning to handleQuery");
        return;
      }

      const activeSession = consumer.conversations.sessions[activeSessionId];

      if (!activeSession?.metadata?.emailSent) {
        console.log(
          "🚀 ~ ChatService ~ analyzeConverstaionInRealTime ~ emailSent:",
          activeSession?.metadata?.emailSent
        );
        const response = await this.shouldSendEmail(consumer, chatHistory);
        console.log(
          "🚀 ~ ChatService ~ analyzeConverstaionInRealTime ~ response:",
          response
        );

        if (response) {
          await this.consumerRepository.updateEmailSendStatus(
            consumer.phoneNumber,
            activeSessionId
          );

          return;
        }
      } else {
        console.log(
          "🚀 ~ ChatService ~ analyzeConverstaionInRealTime ~ emailSent: Already Sent"
        );
        return;
      }
    } catch (error) {
      console.error("Error analyzing conversation in real time:", error);
    }
  }

  // Should sent email, TODO: Move to AgentService and Tools
  async shouldSendEmail(consumer, chatHistory) {
    try {
      const formattedChatHistory = chatHistory
        .map((msg) => {
          return `Role:${msg.role.toUpperCase()},
          Conetnt: ${msg.content} \n`;
        })
        .join("\n");

      const prompt = `
        Analyze the following customer conversation to determine if an email should be sent to an admin for follow-up. Ensure that the emailBody is in HTML format.

        ### **Evaluation Criteria:**
        1. **Intent:** Does the customer show clear buying intent, express interest in services, request follow-ups, or ask qualifying questions?
        2. **Engagement:** Does the customer engage in a meaningful conversation, ask detailed questions, or express serious consideration?
        3. **Sentiment:** Is the sentiment positive or neutral, indicating a strong potential lead? Avoid sending emails for negative or vague interactions.
        4. **Conversion Impact:** **Send an email only if a follow-up call would significantly increase the chances of conversion.** Do not send emails for vague, uncertain, or low-intent interactions.
        5. **Chatbot Effectiveness & Scoring:** Assess how well the chatbot has already answered the customer's queries. Rate the necessity of sending an email on a scale of **1 to 10**, where:  
          - **1-4:** The chatbot handled the inquiry well, and no follow-up is needed.  
          - **5-6:** The response was decent, but a follow-up could add minor value. Don't send an email. 
          - **7-10:** The chatbot’s response was insufficient or the customer showed strong lead potential. **Only send an email if the score is above 7.**  
        6. Don't trigger email for company related questions.
        
        ---

        ### **Conversation Data:**
        ${formattedChatHistory}

        ### **Customer Details:**
        - **Name:** ${consumer.name}
        - **Phone Number:** ${consumer.phoneNumber}
        - **Location:** ${consumer.location || "Not provided"}

      `;
      const response = await openaiService.chatCompletions({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are an AI assistant specialized in analyzing customer chat histories for lead qualification.",
          },
          { role: "user", content: prompt },
        ],
        tools: [],
        temperature: 0.7,
        response_format: "json",
        responseStructure: this.responseStructure,
      });

      const content = JSON.parse(response.choices[0]?.message?.content);

      if (!content) {
        console.error("Error parsing response for email generation.");
        return false;
      }
      if (!content.shouldSendEmail) {
        console.log("No email to be sent");
        return false;
      }

      const pdfBuffer = await this.generateChatPDFBuffer(chatHistory);
      await this.sendEmailWithPDFBuffer(
        "sanandh.m@nineleaps.com",
        content?.emailSubject,
        content?.emailBody.join("\n"),
        pdfBuffer
      );

      console.log("Email sent successfully");

      return true;
    } catch (error) {
      console.error("Error analyzing customer data:", error);
      return "Analysis failed.";
    }
  }

  async generateChatPDFBuffer(chatHistory) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      let buffers = [];
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));
      doc.fontSize(18).text("Chat History", { align: "center" }).moveDown();
      chatHistory.forEach(({ role, content, timestamp }) => {
        doc.fontSize(12).text(`${role.toUpperCase()}:`, { bold: true });
        doc.text(content).moveDown();
      });
      doc.end();
    });
  }

  async sendEmailWithPDFBuffer(to, subject, text, pdfBuffer) {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html: text,
      attachments: [
        {
          filename: "ChatHistory.pdf",
          content: pdfBuffer,
          encoding: "base64",
        },
      ],
    };

    return transporter.sendMail(mailOptions);
  }
}

export default ClientService;
