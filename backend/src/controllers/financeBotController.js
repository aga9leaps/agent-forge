import AWS from "aws-sdk";
import { downloadFileFromS3 } from "../../Tally/s3Utils.js";
import path from "path";
import fs from "fs";
import os from "os";
// import { fetchProfitAndLossAndUploadPDF } from "../../Tally/FinanacialReports/ProfitLossReport.js";
// import { fetchRatioAnalysisAndUploadPDF } from "../../Tally/FinanacialReports/RatioAnalysisReport.js";
// import { fetchCashFlowStatementAndUploadPDF } from "../../Tally/FinanacialReports/CashFlowStatementReport.js";
// import { fetchCashFlowProjectionAndUploadPDF } from "../../Tally/FinanacialReports/CashFlowProjectionReport.js";
// import { fetchExpenseAnalysisAndUploadPDF } from "../../Tally/FinanacialReports/ExpenseAnalysisReport.js";
// const chat = async (req, res) => {
//   const { message } = req.body;
//   let fromDate, toDate;

//   // 1. Try to extract YYYYMMDD or YYYY-MM-DD
//   const dateRegex = /(\d{4})[-]?(\d{2})[-]?(\d{2})/g;
//   const foundDates = [];
//   let match;
//   while ((match = dateRegex.exec(message)) !== null) {
//     foundDates.push(`${match[1]}${match[2]}${match[3]}`);
//   }
//   if (foundDates.length >= 2) {
//     fromDate = foundDates[0];
//     toDate = foundDates[1];
//   } else {
//     // 2. Try to extract month names and year
//     const monthMap = {
//       january: "01", february: "02", march: "03", april: "04",
//       may: "05", june: "06", july: "07", august: "08",
//       september: "09", october: "10", november: "11", december: "12"
//     };
//     const monthPattern = /from\s+([a-z]+)(?:\s+(\d{4}))?\s*(?:to|-)\s*([a-z]+)(?:\s+(\d{4}))?/i;
//     const monthMatch = message.match(monthPattern);
//     if (monthMatch) {
//       const startMonth = monthMap[monthMatch[1].toLowerCase()];
//       const endMonth = monthMap[monthMatch[3].toLowerCase()];
//       const year1 = monthMatch[2] || monthMatch[4];
//       const year2 = monthMatch[4] || monthMatch[2];
//       if (startMonth && endMonth && year1) {
//         fromDate = `${year1}${startMonth}01`;
//         const endDateObj = new Date(Number(year2 || year1), Number(endMonth), 0);
//         const endDay = String(endDateObj.getDate()).padStart(2, "0");
//         toDate = `${year2 || year1}${endMonth}${endDay}`;
//       }
//     }
//   }

//   let result;
//   const lowerMsg = message.toLowerCase();

//   try {
//     // First check if we have a report type without dates
//     if (lowerMsg.includes("profit") || lowerMsg.includes("p&l") || 
//         lowerMsg.includes("ratio") || lowerMsg.includes("cash flow") || 
//         lowerMsg.includes("expense")) {
      
//       if (!fromDate || !toDate) {
//         return res.json({
//           reply: "I see you're interested in a report. Could you please specify the date range? You can:\n" +
//                 "• Use specific dates (e.g., 2024-04-01 to 2024-04-30)\n" +
//                 "• Use month names (e.g., from April to June 2024)\n" +
//                 "• Or just mention a single month (e.g., April 2024)"
//         });
//       }
//     }

//     // If no report type is mentioned, list available reports
//     if (!lowerMsg.includes("profit") && !lowerMsg.includes("p&l") && 
//         !lowerMsg.includes("ratio") && !lowerMsg.includes("cash flow") && 
//         !lowerMsg.includes("expense")) {
//       return res.json({
//         reply: "We offer the following finance reports:\n" +
//               "• Profit and Loss (P&L)\n" +
//               "• Ratio Analysis\n" +
//               "• Cash Flow Statement\n" +
//               "• Cash Flow Projection\n" +
//               "• Expense Analysis\n\n" +
//               "Which report would you like? Please also specify the date range (e.g., 'Show me the P&L report for April 2024')"
//       });
//     }

//     // Handle report selection with proper ordering of conditions
//     if (lowerMsg.includes("profit") || lowerMsg.includes("p&l")) {
//       result = await fetchProfitAndLossAndUploadPDF(fromDate, toDate);
//     } else if (lowerMsg.includes("ratio")) {
//       result = await fetchRatioAnalysisAndUploadPDF(fromDate, toDate);
//     } else if (lowerMsg.includes("cash flow projection") || lowerMsg.includes("cash flow forecast")) {
//       result = await fetchCashFlowProjectionAndUploadPDF(fromDate, toDate);
//     } else if (lowerMsg.includes("cash flow")) {
//       result = await fetchCashFlowStatementAndUploadPDF(fromDate, toDate);
//     } else if (lowerMsg.includes("expense analysis") || lowerMsg.includes("expense report")) {
//       result = await fetchExpenseAnalysisAndUploadPDF(fromDate, toDate);
//     }

//     // Verify result exists
//     if (!result || !result.message) {
//       throw new Error("Failed to generate report");
//     }

//     return res.json({
//       reply: result.message,
//       downloadUrl: result.downloadUrl
//     });

//   } catch (error) {
//     console.error("Error generating report:", error);
//     return res.status(500).json({
//       reply: "Sorry, there was an error generating your report. Please try again or contact support if the problem persists."
//     });
//   }
// };

// const downloadReport = async (req, res) => {
//   const { reportName, fromDate, toDate } = req.params;

//   const s3Key = `Tally/tally-pdf-reports/${reportName}_${fromDate}_${toDate}.pdf`;
//   const fileName = `${reportName}.pdf`;

//   const tempFilePath = path.join(os.tmpdir(), fileName); // ✅ Cross-platform temp dir

//   try {
//     await downloadFileFromS3(s3Key, tempFilePath);

//     res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
//     res.setHeader("Content-Type", "application/pdf");

//     const fileStream = fs.createReadStream(tempFilePath);
//     fileStream.pipe(res);

//     fileStream.on("close", () => {
//       fs.unlink(tempFilePath, () => {});
//     });
//   } catch (err) {
//     console.error("Download error:", err);
//     res.status(500).send("Error downloading file");
//   }
// };

// const viewReport = async (req, res) => {
//   const { reportName, fromDate, toDate } = req.params;
//   const s3Key = `Tally/tally-pdf-reports/${reportName}_${fromDate}_${toDate}.pdf`;
//   const fileName = `${reportName}.pdf`;

//   const s3 = new AWS.S3();
//   const params = {
//     Bucket: process.env.TALLY_AWS_BUCKET_NAME,
//     Key: s3Key,
//     ResponseContentDisposition: `inline; filename=${fileName}` // <-- inline for viewing
//   };
//   try {
//     s3.getObject(params)
//       .createReadStream()
//       .on('error', err => res.status(404).send('File not found'))
//       .pipe(res);
//   } catch (err) {
//     res.status(500).send('Error opening file');
//   }
// };

// export default {
//   downloadReport,
//   viewReport,
//   chat
// };
import financeBotService from "../services/FinanceBotService.js";
import financeChatRepository from "../repository/financeChatRepository.js";


export const chat = async (req, res) => {
  const { message } = req.body;
  const username = req.user?.username || "guest";

  try {
    const result = await financeBotService.handleChat(message, username);
    return res.json(result);
  } catch (error) {
    console.error("FinanceBot error in controller:", error);
    
    // Save the error message to MongoDB
    const errorMessage = "Sorry, there was an error processing your request. Please try again.";
    try {
      await financeChatRepository.saveConversation(username, "assistant", errorMessage);
    } catch (saveError) {
      console.error("Error saving controller error to MongoDB:", saveError);
    }
    
    return res.status(500).json({
      reply: errorMessage,
      error: true
    });
  }
};

export const getChatHistory = async (req, res) => {
  const username = req.user?.username || "guest";
    
  if (!username) {
    console.warn("No authenticated user found when fetching chat history");
    return res.status(401).json({ 
      error: "Authentication required",
      messages: [] 
    });
  }
    
  try {
    const history = await financeChatRepository.getHistory(username, 50);      // Format messages for frontend
    const messages = history.map(msg => ({
      from: msg.role === "user" ? "user" : "bot",
      text: msg.content,
      // Use the stored downloadUrl directly or fall back to extraction method for backward compatibility
      downloadUrl: msg.downloadUrl || (msg.role === "assistant" && 
                    msg.content.includes("downloadUrl") ? 
                    extractDownloadUrl(msg.content) : null),
      // Include feedback if available
      feedback: msg.feedback || null,
      // Pass through the feedback response flag
      isFeedbackResponse: msg.isFeedbackResponse || false
    }));
    
    return res.json({ messages });
  } catch (err) {
    console.error("Error fetching chat history:", err);
    return res.status(500).json({ 
      error: "Failed to retrieve chat history",
      messages: [] 
    });
  }
};

function extractDownloadUrl(content) {
  const urlMatch = content.match(/https?:\/\/[^\s"]+\.pdf/);
  return urlMatch ? urlMatch[0] : null;
}

export const clearChatHistory = async (req, res) => {
  const username = req.user?.username || "guest";
  try {
    await financeChatRepository.clearHistory(username);
    console.log(`Chat history cleared for user: ${username}`);
    return res.json({ success: true, message: "Chat history cleared." });
  } catch (err) {
    console.error("Error clearing chat history:", err);
    return res.status(500).json({ success: false, error: "Failed to clear chat history." });
  }
};

export const downloadReport = async (req, res) => {
  const { reportName, fromDate, toDate } = req.params;
  // Use the same path format as in tallyReportUtils.js
  const s3Key = `tally-reports/${reportName}/${fromDate}-${toDate}.pdf`;
  const fileName = `${reportName}.pdf`;
  const tempFilePath = path.join(os.tmpdir(), fileName);

  try {
    console.log(`Attempting to download file from S3: ${s3Key}`);
    await downloadFileFromS3(s3Key, tempFilePath);
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.setHeader("Content-Type", "application/pdf");
    const fileStream = fs.createReadStream(tempFilePath);
    fileStream.pipe(res);
    fileStream.on("close", () => {
      fs.unlink(tempFilePath, () => {});
    });
  } catch (err) {
    console.error("Download error:", err);
    res.status(500).send("Error downloading file");
  }
};

export const viewReport = async (req, res) => {
  const { reportName, fromDate, toDate } = req.params;
  // Use the same path format as in tallyReportUtils.js
  const s3Key = `tally-reports/${reportName}/${fromDate}-${toDate}.pdf`;
  const fileName = `${reportName}.pdf`;

  const s3 = new AWS.S3();
  const params = {
    Bucket: process.env.TALLY_AWS_BUCKET_NAME,
    Key: s3Key,
    ResponseContentDisposition: `inline; filename=${fileName}`
  };
  try {
    console.log(`Attempting to view file from S3: ${s3Key}`);
    s3.getObject(params)
      .createReadStream()
      .on("error", (err) => {
        console.error(`Error retrieving file ${s3Key}:`, err);
        res.status(404).send("File not found");
      })
      .pipe(res);
  } catch (err) {
    console.error("Error opening file:", err);
    res.status(500).send("Error opening file");
  }
};

const speechToText = async (req, res) => {
  try {
    console.log("Processing audio request...");

    if (!req.file) {
      console.error("No audio file provided in request");
      return res.status(400).json({
        error: "No audio file provided",
      });
    }

    // Get language from request body
    const targetLanguage = req.body.language || "en";
    console.log("Target language for speech recognition:", targetLanguage);

    console.log("Audio file details:", {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    // Validate minimum file size (audio files should be at least a few KB)
    if (req.file.size < 1000) {
      console.error("Audio file too small, likely corrupted or invalid");
      return res.status(400).json({
        error: "Invalid audio file",
        details:
          "Audio file is too small or corrupted. Please try recording again.",
      });
    }

    // Validate maximum file size (already handled by multer, but double-check)
    if (req.file.size > 10 * 1024 * 1024) {
      console.error("Audio file too large");
      return res.status(400).json({
        error: "Audio file too large",
        details: "Audio file must be smaller than 10MB",
      });
    }

    // Use Sarvam AI service for speech-to-text conversion
    const transcriptionResult = await sarvamAiService.sttAudio(
      req.file.buffer,
      targetLanguage
    );

    console.log("Transcription result:", transcriptionResult);

    if (!transcriptionResult || !transcriptionResult.transcript) {
      console.error("Empty transcription result from Sarvam AI");
      return res.status(500).json({
        error: "Failed to transcribe audio",
        details: "No transcript returned from service",
      });
    }

    // Send the transcribed text back to frontend
    return res.json({
      success: true,
      transcript: transcriptionResult.transcript,
      language: transcriptionResult.language_code || "unknown",
    });
  } catch (error) {
    console.error("Error in speech-to-text:", error);
    return res.status(500).json({
      error: "Failed to process audio file",
      details: error.message,
    });
  }
};

// Enhanced saveFeedback function with better error handling
const saveFeedback = async (req, res) => {
  try {
    const { messageIndex, type, includeFeedbackResponse } = req.body;
    const username = req.user.username;
    
    // Validate input
    if (messageIndex === undefined || messageIndex < 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid message index provided'
      });
    }
    
    if (!['like', 'dislike'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Feedback type must be "like" or "dislike"'
      });
    }
    
    console.log(`Saving feedback from ${username} for message index ${messageIndex}: ${type}`);
    
    // Save feedback on the original bot message
    const success = await financeChatRepository.saveFeedback(username, messageIndex, type);
    
    if (!success) {
      return res.status(400).json({ 
        success: false,
        error: `Unable to save feedback for message index ${messageIndex}` 
      });
    }
    
    // Add a feedback response message if specifically requested
    if (includeFeedbackResponse === true) {
      const feedbackResponseText = type === 'like' 
        ? "I'm glad my response was helpful! Is there anything else you'd like to know?"
        : "I'm sorry my response wasn't what you needed. Would you like me to try a different approach?";
      
      try {
        // Check if a feedback response already exists for the most recent bot message
        const history = await financeChatRepository.getHistory(username);
        
        // Look for any feedback responses in the recent messages
        const recentMessages = history.slice(-5); // Check last 5 messages
        const hasFeedbackResponse = recentMessages.some(msg => 
          msg.isFeedbackResponse === true && 
          msg.content === feedbackResponseText
        );
        
        // Also check for a duplicate in-progress request
        const duplicateInProgress = recentMessages
          .filter(msg => msg.role === "assistant")
          .slice(-2) // Check the last 2 assistant messages
          .some(msg => msg.content === feedbackResponseText);
        
        // Only add a feedback response if one doesn't already exist
        if (!hasFeedbackResponse && !duplicateInProgress) {
          // Add the feedback response message to the chat history
          await financeChatRepository.saveConversation(
            username,
            "assistant", 
            feedbackResponseText,
            true  // isFeedbackResponse
          );
          
          console.log(`Added feedback response message for ${username}`);
        } else {
          console.log(`Feedback response already exists or is a duplicate, skipping message`);
        }
      } catch (error) {
        console.error("Error adding feedback response:", error);
        // Continue execution even if adding the response fails
        // We'll still return success for the primary feedback operation
      }
    }
    
    return res.json({ 
      success: true,
      message: `Feedback saved for message index ${messageIndex}`
    });
  } catch (error) {
    console.error(`Error saving feedback:`, error);
    return res.status(500).json({ 
      success: false, 
      error: "Error saving feedback"
    });
  }
};


export default {
  downloadReport,
  viewReport,
  chat,
  speechToText,
  // upload,
  getChatHistory,
  clearChatHistory,
  saveFeedback
};
