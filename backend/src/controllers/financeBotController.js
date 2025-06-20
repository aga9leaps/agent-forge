// import AWS from "aws-sdk";

// const downloadReport = async (req, res) => {
//   const { reportName, fromDate, toDate } = req.params;
//   // Map reportName to S3 key and filename
//   const s3Key = `Tally/tally-pdf-reports/${reportName}_${fromDate}_${toDate}.pdf`;
//   const fileName = `${reportName}.pdf`;

//   const s3 = new AWS.S3();
//   const params = {
//     Bucket: process.env.TALLY_AWS_BUCKET_NAME,
//     Key: s3Key,
//     ResponseContentDisposition: `attachment; filename=${fileName}`
//   };
//   try {
//     s3.getObject(params)
//       .createReadStream()
//       .on('error', err => res.status(404).send('File not found'))
//       .pipe(res);
//   } catch (err) {
//     res.status(500).send('Error downloading file');
//   }
// };

// export default {
//   downloadReport
// };
import AWS from "aws-sdk";
import { downloadFileFromS3 } from "../../Tally/s3Utils.js";
import path from "path";
import fs from "fs";
import os from "os";
import { fetchProfitAndLossAndUploadPDF } from "../../Tally/FinanacialReports/ProfitLossReport.js";
import { fetchRatioAnalysisAndUploadPDF } from "../../Tally/FinanacialReports/RatioAnalysisReport.js";
import { fetchCashFlowStatementAndUploadPDF } from "../../Tally/FinanacialReports/CashFlowStatementReport.js";
import { fetchCashFlowProjectionAndUploadPDF } from "../../Tally/FinanacialReports/CashFlowProjectionReport.js";
import { fetchExpenseAnalysisAndUploadPDF } from "../../Tally/FinanacialReports/ExpenseAnalysisReport.js";
import { sarvamAiService } from "../serviceConfigs/SarvamAIService.js";
import multer from "multer";

// Configure multer for audio file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log("File filter check:", {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    });

    // Accept audio files and common audio formats
    const allowedMimeTypes = [
      "audio/wav",
      "audio/mpeg",
      "audio/mp3",
      "audio/mp4",
      "audio/ogg",
      "audio/webm",
      "audio/aac",
      "audio/x-wav",
      "audio/x-m4a",
      "application/octet-stream", // For some browsers that send this for audio
    ];

    if (
      allowedMimeTypes.includes(file.mimetype) ||
      file.mimetype.startsWith("audio/")
    ) {
      cb(null, true);
    } else {
      console.error("File type not allowed:", file.mimetype);
      cb(
        new Error(`Only audio files are allowed. Received: ${file.mimetype}`),
        false
      );
    }
  },
});

const chat = async (req, res) => {
  const { message } = req.body;
  let fromDate, toDate;

  // 1. Try to extract YYYYMMDD or YYYY-MM-DD
  const dateRegex = /(\d{4})[-]?(\d{2})[-]?(\d{2})/g;
  const foundDates = [];
  let match;
  while ((match = dateRegex.exec(message)) !== null) {
    foundDates.push(`${match[1]}${match[2]}${match[3]}`);
  }
  if (foundDates.length >= 2) {
    fromDate = foundDates[0];
    toDate = foundDates[1];
  } else {
    // 2. Try to extract month names and year
    const monthMap = {
      january: "01",
      february: "02",
      march: "03",
      april: "04",
      may: "05",
      june: "06",
      july: "07",
      august: "08",
      september: "09",
      october: "10",
      november: "11",
      december: "12",
    };
    const monthPattern =
      /from\s+([a-z]+)(?:\s+(\d{4}))?\s*(?:to|-)\s*([a-z]+)(?:\s+(\d{4}))?/i;
    const monthMatch = message.match(monthPattern);
    if (monthMatch) {
      const startMonth = monthMap[monthMatch[1].toLowerCase()];
      const endMonth = monthMap[monthMatch[3].toLowerCase()];
      const year1 = monthMatch[2] || monthMatch[4];
      const year2 = monthMatch[4] || monthMatch[2];
      if (startMonth && endMonth && year1) {
        fromDate = `${year1}${startMonth}01`;
        const endDateObj = new Date(
          Number(year2 || year1),
          Number(endMonth),
          0
        );
        const endDay = String(endDateObj.getDate()).padStart(2, "0");
        toDate = `${year2 || year1}${endMonth}${endDay}`;
      }
    }
  }

  let result;
  const lowerMsg = message.toLowerCase();

  try {
    // First check if we have a report type without dates
    if (
      lowerMsg.includes("profit") ||
      lowerMsg.includes("p&l") ||
      lowerMsg.includes("ratio") ||
      lowerMsg.includes("cash flow") ||
      lowerMsg.includes("expense")
    ) {
      if (!fromDate || !toDate) {
        return res.json({
          reply:
            "I see you're interested in a report. Could you please specify the date range? You can:\n" +
            "• Use specific dates (e.g., 2024-04-01 to 2024-04-30)\n" +
            "• Use month names (e.g., from April to June 2024)\n" +
            "• Or just mention a single month (e.g., April 2024)",
        });
      }
    }

    // If no report type is mentioned, list available reports
    if (
      !lowerMsg.includes("profit") &&
      !lowerMsg.includes("p&l") &&
      !lowerMsg.includes("ratio") &&
      !lowerMsg.includes("cash flow") &&
      !lowerMsg.includes("expense")
    ) {
      return res.json({
        reply:
          "We offer the following finance reports:\n" +
          "• Profit and Loss (P&L)\n" +
          "• Ratio Analysis\n" +
          "• Cash Flow Statement\n" +
          "• Cash Flow Projection\n" +
          "• Expense Analysis\n\n" +
          "Which report would you like? Please also specify the date range (e.g., 'Show me the P&L report for April 2024')",
      });
    }

    // Handle report selection with proper ordering of conditions
    if (lowerMsg.includes("profit") || lowerMsg.includes("p&l")) {
      result = await fetchProfitAndLossAndUploadPDF(fromDate, toDate);
    } else if (lowerMsg.includes("ratio")) {
      result = await fetchRatioAnalysisAndUploadPDF(fromDate, toDate);
    } else if (
      lowerMsg.includes("cash flow projection") ||
      lowerMsg.includes("cash flow forecast")
    ) {
      result = await fetchCashFlowProjectionAndUploadPDF(fromDate, toDate);
    } else if (lowerMsg.includes("cash flow")) {
      result = await fetchCashFlowStatementAndUploadPDF(fromDate, toDate);
    } else if (
      lowerMsg.includes("expense analysis") ||
      lowerMsg.includes("expense report")
    ) {
      result = await fetchExpenseAnalysisAndUploadPDF(fromDate, toDate);
    }

    // Verify result exists
    if (!result || !result.message) {
      throw new Error("Failed to generate report");
    }

    return res.json({
      reply: result.message,
      downloadUrl: result.downloadUrl,
    });
  } catch (error) {
    console.error("Error generating report:", error);
    return res.status(500).json({
      reply:
        "Sorry, there was an error generating your report. Please try again or contact support if the problem persists.",
    });
  }
};

const downloadReport = async (req, res) => {
  const { reportName, fromDate, toDate } = req.params;

  const s3Key = `Tally/tally-pdf-reports/${reportName}_${fromDate}_${toDate}.pdf`;
  const fileName = `${reportName}.pdf`;

  const tempFilePath = path.join(os.tmpdir(), fileName); // ✅ Cross-platform temp dir

  try {
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

const viewReport = async (req, res) => {
  const { reportName, fromDate, toDate } = req.params;
  const s3Key = `Tally/tally-pdf-reports/${reportName}_${fromDate}_${toDate}.pdf`;
  const fileName = `${reportName}.pdf`;

  const s3 = new AWS.S3();
  const params = {
    Bucket: process.env.TALLY_AWS_BUCKET_NAME,
    Key: s3Key,
    ResponseContentDisposition: `inline; filename=${fileName}`, // <-- inline for viewing
  };
  try {
    s3.getObject(params)
      .createReadStream()
      .on("error", (err) => res.status(404).send("File not found"))
      .pipe(res);
  } catch (err) {
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

export default {
  downloadReport,
  viewReport,
  chat,
  speechToText,
  upload,
};
