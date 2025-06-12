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

const chat = async (req, res) => {
  const { message } = req.body;

  // Simple intent and date extraction (expand as needed)
  const lowerMsg = message.toLowerCase();
  let fromDate = "20240401";
  let toDate = "20240831";

  // Extract dates if present in message (YYYYMMDD or YYYY-MM-DD)
  const dateRegex = /(\d{4}[-]?\d{2}[-]?\d{2})/g;
  const dates = message.match(dateRegex);
  if (dates && dates.length >= 2) {
    fromDate = dates[0].replace(/-/g, "");
    toDate = dates[1].replace(/-/g, "");
  }

  let result;
  if (lowerMsg.includes("profit") || lowerMsg.includes("p&l")) {
    result = await fetchProfitAndLossAndUploadPDF(fromDate, toDate);
  } else if (lowerMsg.includes("ratio")) {
    result = await fetchRatioAnalysisAndUploadPDF(fromDate, toDate);
  } else {
    return res.json({ reply: "Please specify a valid report: Profit and Loss or Ratio Analysis." });
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

export default {
  downloadReport, chat
};
