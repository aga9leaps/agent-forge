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
const chat = async (req, res) => {
  const { message } = req.body;

  // Date parsing block (handles various formats)
  let fromDate = "20240401";
  let toDate = "20240831";

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
      january: "01", february: "02", march: "03", april: "04",
      may: "05", june: "06", july: "07", august: "08",
      september: "09", october: "10", november: "11", december: "12"
    };
    // e.g. "from april to august 2025" or "from april 2025 to august 2025"
    const monthPattern = /from\s+([a-z]+)(?:\s+(\d{4}))?\s*(?:to|-)\s*([a-z]+)(?:\s+(\d{4}))?/i;
    const monthMatch = message.match(monthPattern);
    if (monthMatch) {
      const startMonth = monthMap[monthMatch[1].toLowerCase()];
      const endMonth = monthMap[monthMatch[3].toLowerCase()];
      // Prefer year after each month, else use the last year found
      const year1 = monthMatch[2] || monthMatch[4];
      const year2 = monthMatch[4] || monthMatch[2];
      if (startMonth && endMonth && year1) {
        fromDate = `${year1}${startMonth}01`;
        // Get last day of end month
        const endDateObj = new Date(Number(year2 || year1), Number(endMonth), 0);
        const endDay = String(endDateObj.getDate()).padStart(2, "0");
        toDate = `${year2 || year1}${endMonth}${endDay}`;
      }
    }
  }

  // Determine which report to generate
  let result;
  const lowerMsg = message.toLowerCase();
  if (lowerMsg.includes("profit") || lowerMsg.includes("p&l")) {
    result = await fetchProfitAndLossAndUploadPDF(fromDate, toDate);
  } else if (lowerMsg.includes("ratio")) {
    result = await fetchRatioAnalysisAndUploadPDF(fromDate, toDate);
  } else if (lowerMsg.includes("cash flow")) {
    result = await fetchCashFlowStatementAndUploadPDF(fromDate, toDate);
  }else if (lowerMsg.includes("cash flow projection") || lowerMsg.includes("cash flow forecast") || lowerMsg.includes("projection")) {
    result = await fetchCashFlowProjectionAndUploadPDF(fromDate, toDate);
  }else if (lowerMsg.includes("expense analysis") || lowerMsg.includes("expense report")) {
    // Special case for Expense Analysis Report
  result = await fetchExpenseAnalysisAndUploadPDF(fromDate, toDate);
  } else {
    reply: "We offer the following finance reports: Profit and Loss, Ratio Analysis, Cash Flow Statement, Cash Flow Projection, and Expense Analysis. Please let me know which report you need and for which date range (e.g., April 2024). If you need help choosing, just ask!"
  }

  return res.json({
    reply: result.message,
    downloadUrl: result.downloadUrl
  });
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
    ResponseContentDisposition: `inline; filename=${fileName}` // <-- inline for viewing
  };
  try {
    s3.getObject(params)
      .createReadStream()
      .on('error', err => res.status(404).send('File not found'))
      .pipe(res);
  } catch (err) {
    res.status(500).send('Error opening file');
  }
};

export default {
  downloadReport,
  viewReport,
  chat
};
