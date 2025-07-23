import BaseMongoRepository from "./baseRepository/baseMongoRepository.js";

class FinanceChatRepository extends BaseMongoRepository {
  constructor() {
    super(process.env.FINANCE_CHAT_COLLECTION || "finance_chats");
  }
  async getHistory(username, limit = 50) {
    try {
      const doc = await this.findOne({ username });

      if (!doc || !doc.chats || doc.chats.length === 0) {
        return [];
      }

      // Get the last N messages
      let messages = doc.chats.slice(-limit);

      // Prevent duplicate feedback responses
      // If the last two messages are both feedback responses with the same content,
      // remove one of them
      if (messages.length >= 2) {
        const lastMsg = messages[messages.length - 1];
        const secondLastMsg = messages[messages.length - 2];

        if (
          lastMsg.isFeedbackResponse &&
          secondLastMsg.isFeedbackResponse &&
          lastMsg.content === secondLastMsg.content
        ) {
          console.log("Found duplicate feedback responses, removing one");
          messages = messages.slice(0, -1); // Remove the last one
        }
      }
      // Map to the expected format
      return messages.map(
        ({
          role,
          content,
          feedback,
          isFeedbackResponse,
          timestamp,
          downloadUrl,
        }) => ({
          role,
          content,
          feedback, // Include feedback in the returned data
          isFeedbackResponse, // Include flag for feedback response messages
          timestamp: timestamp
            ? timestamp.toISOString()
            : new Date().toISOString(), // Include timestamp for better tracking
          downloadUrl: downloadUrl || null, // Include downloadUrl if available
        })
      );
    } catch (error) {
      console.error("Error fetching chat history:", error);
      return [];
    }
  }
  async saveConversation(
    username,
    role,
    content,
    isFeedbackResponse = false,
    downloadUrl = null
  ) {
    await this.updateOne(
      { username },
      {
        $push: {
          chats: {
            role,
            content,
            timestamp: new Date(),
            feedback: null, // Initialize feedback as null
            isFeedbackResponse: isFeedbackResponse, // Flag to identify feedback response messages
            downloadUrl: downloadUrl, // Store downloadUrl directly in the chat document
          },
        },
      },
      { upsert: true }
    );
  }

  // async saveFeedback(username, messageIndex, feedbackType) {
  //   try {
  //     // Get the document for the user
  //     const doc = await this.findOne({ username });

  //     if (!doc || !doc.chats || doc.chats.length <= messageIndex) {
  //       throw new Error(`Message at index ${messageIndex} not found for user ${username}`);
  //     }

  //     // Create the update query to set feedback for specific message
  //     const updateQuery = {};
  //     updateQuery[`chats.${messageIndex}.feedback`] = feedbackType;

  //     // Update the document
  //     await this.updateOne(
  //       { username },
  //       { $set: updateQuery }
  //     );

  //     return true;
  //   } catch (error) {
  //     console.error(`Error saving feedback for message ${messageIndex}:`, error);
  //     return false;
  //   }
  // }
  async saveFeedback(username, messageIndex, feedbackType) {
    try {
      // Get the document for the user
      const doc = await this.findOne({ username });

      if (!doc || !doc.chats) {
        console.error(`No chat history found for user ${username}`);
        return false;
      }

      // Find all bot messages that aren't feedback responses
      const assistantMessages = doc.chats.filter(
        (chat) => chat.role === "assistant" && !chat.isFeedbackResponse
      );

      // Log what we're trying to do for debugging
      console.log(
        `DB: Total messages: ${doc.chats.length}, Bot messages: ${assistantMessages.length}, Target index: ${messageIndex}`
      );

      // Validate the index
      if (messageIndex < 0 || messageIndex >= assistantMessages.length) {
        console.error(
          `Bot message index ${messageIndex} out of bounds (max: ${
            assistantMessages.length - 1
          })`
        );
        return false;
      }

      // Find the target bot message
      const targetAssistantMsg = assistantMessages[messageIndex];

      // Find its position in the full chat array
      let actualIndex = -1;

      // First try to match by _id if available
      if (targetAssistantMsg._id) {
        actualIndex = doc.chats.findIndex(
          (msg) =>
            msg._id &&
            targetAssistantMsg._id &&
            msg._id.toString() === targetAssistantMsg._id.toString()
        );
      }

      // If _id matching fails, try content+timestamp matching
      if (actualIndex === -1) {
        console.log(
          "ID match failed, trying to match by message content and timestamp..."
        );
        actualIndex = doc.chats.findIndex(
          (msg) =>
            msg.role === targetAssistantMsg.role &&
            msg.content === targetAssistantMsg.content &&
            !msg.isFeedbackResponse &&
            msg.timestamp &&
            targetAssistantMsg.timestamp &&
            msg.timestamp.toString() === targetAssistantMsg.timestamp.toString()
        );
      }

      // Last resort, try just by content
      if (actualIndex === -1) {
        console.log(
          "Content+timestamp match failed, trying just by content..."
        );
        actualIndex = doc.chats.findIndex(
          (msg) =>
            msg.role === targetAssistantMsg.role &&
            msg.content === targetAssistantMsg.content &&
            !msg.isFeedbackResponse
        );
      }

      if (actualIndex === -1) {
        console.error(
          `Could not find bot message at index ${messageIndex} in the chat history`
        );
        return false;
      }

      console.log(
        `Found bot message at actual index ${actualIndex} for bot index ${messageIndex}`
      );

      // Check if this message already has feedback (to avoid duplicate processing)
      if (doc.chats[actualIndex].feedback === feedbackType) {
        console.log(
          `Message at index ${actualIndex} already has feedback '${feedbackType}', skipping update`
        );
        return true;
      }
      // Create the update query to set feedback for specific message
      // Make sure we don't overwrite any existing fields like downloadUrl
      const updateQuery = {};
      updateQuery[`chats.${actualIndex}.feedback`] = feedbackType;

      // Update the document, preserving all other fields
      await this.updateOne({ username }, { $set: updateQuery });

      console.log(
        `Successfully updated feedback for message at ${actualIndex} to '${feedbackType}'`
      );
      return true;
    } catch (error) {
      console.error(
        `Error saving feedback for message ${messageIndex}:`,
        error
      );
      return false;
    }
  }
  async clearHistory(username) {
    // Remove the entire document for the user
    await this.deleteOne({ username });
  }

  async updateMessage(username, messageIndex, newContent, downloadUrl = null) {
    try {
      // Get the document for the user
      const doc = await this.findOne({ username });

      if (!doc || !doc.chats || doc.chats.length <= messageIndex) {
        console.error(
          `Message at index ${messageIndex} not found for user ${username}`
        );
        return false;
      }

      // Create the update query to update the message content
      const updateQuery = {};
      updateQuery[`chats.${messageIndex}.content`] = newContent;

      // Update downloadUrl if provided
      if (downloadUrl !== null) {
        updateQuery[`chats.${messageIndex}.downloadUrl`] = downloadUrl;
      }

      // Update the document
      await this.updateOne({ username }, { $set: updateQuery });

      console.log(
        `Successfully updated message at index ${messageIndex} for user ${username}`
      );
      return true;
    } catch (error) {
      console.error(`Error updating message at index ${messageIndex}:`, error);
      return false;
    }
  }
}

export default new FinanceChatRepository();
