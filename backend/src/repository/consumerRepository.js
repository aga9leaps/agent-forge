import BaseMongoRepository from "./baseRepository/baseMongoRepository.js";

export default class ConsumerRepository extends BaseMongoRepository {
  constructor(collectionName) {
    super(collectionName);
  }

  async getConsumerByPhoneNumber(phoneNumber) {
    return this.findOne({ phoneNumber });
  }

  async createConsumer(consumer) {
    const consumerData = {
      ...consumer,
      conversations: {
        sessions: {},
        activeSession: null,
        sessionCounters: {},
      },
      status: "new",
      avg_engagement_scores: 0,
      createdAt: new Date(),
    };

    return this.insertOne(consumerData);
  }

  // Create a new session for a consumer
  async createNewSession(consumer, initiatorType = "agent") {
    const phoneNumber = consumer.phoneNumber;
    const now = new Date();
    const dateString = now.toISOString().split("T")[0].replace(/-/g, "");

    const currentSeq =
      (consumer.conversations.sessionCounters &&
        consumer.conversations.sessionCounters[dateString]) ||
      0;
    const newSeq = currentSeq + 1;

    const sessionId = `SESS_${dateString}_${newSeq
      .toString()
      .padStart(3, "0")}`;

    const sessionData = {
      id: sessionId,
      startTime: now,
      lastActivity: now,
      initiator: initiatorType,
      chats: [],
      metadata: {
        sentiment: "",
        engagement_scores: {},
        emailSent: false,
        emailSendAt: null,
      },
    };

    await this.updateOne(
      { phoneNumber },
      {
        $set: {
          [`conversations.sessions.${sessionId}`]: sessionData,
          "conversations.activeSession": sessionId,
          [`conversations.sessionCounters.${dateString}`]: newSeq,
        },
      }
    );

    return sessionId;
  }

  // Save a conversation message within the active session,
  // creating a new session if none exists or if the active one is expired
  async saveConversation(consumer, message) {
    const phoneNumber = consumer.phoneNumber;
    let activeSession = consumer.conversations.activeSession;

    if (!activeSession) {
      const initiatorType = message.role === "assistant" ? "agent" : "user";
      activeSession = await this.createNewSession(consumer, initiatorType);
    } else {
      const sessionData = consumer.conversations.sessions[activeSession];
      const hoursSinceLast =
        (new Date() - new Date(sessionData.lastActivity)) / (1000 * 60 * 60);
      if (hoursSinceLast >= 8) {
        const initiatorType = message.role === "assistant" ? "agent" : "user";
        activeSession = await this.createNewSession(consumer, initiatorType);
      }
    }

    await this.updateOne(
      { phoneNumber },
      {
        $push: {
          [`conversations.sessions.${activeSession}.chats`]: message,
        },
        $set: {
          [`conversations.sessions.${activeSession}.lastActivity`]: new Date(),
        },
      }
    );
  }

  async getCustomerConversation(phoneNumber, limit = 20) {
    const consumer = await this.getConsumerByPhoneNumber(phoneNumber);
    if (
      !consumer ||
      !consumer.conversations ||
      !consumer.conversations.sessions
    )
      return [];

    const sessions = Object.values(consumer.conversations.sessions);
    sessions.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    return sessions.slice(-limit);
  }

  async getConsumersWithoutActiveSession() {
    return this.find({ "conversations.activeSession": null });
  }

  async getAllCustomerData() {
    try {
      return await this.find({});
    } catch (error) {
      console.error("Error retrieving customer data:", error);
      throw error;
    }
  }

  async updateEmailSendStatus(phoneNumber, sessionId) {
    try {
      await this.updateOne(
        {
          phoneNumber,
          [`conversations.sessions.${sessionId}`]: { $exists: true },
        },
        {
          $set: {
            [`conversations.sessions.${sessionId}.metadata.emailSent`]: true,
            [`conversations.sessions.${sessionId}.metadata.emailSendAt`]:
              new Date(),
          },
        }
      );
      console.log(`Email status updated for session: ${sessionId}`);
    } catch (error) {
      console.error("Error updating email send status:", error);
      throw error;
    }
  }
}
