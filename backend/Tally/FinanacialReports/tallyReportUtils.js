import axios from "axios";
import puppeteer from "puppeteer";
import { uploadFileToS3 } from "../s3Utils.js";
import dotenv from "dotenv";
dotenv.config({ path: "../../configs/.env" });

const TALLY_URL = process.env.TALLY_URL;

export function formatDateRange(fromDate, toDate) {
  const format = (dateStr) => {
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const dateObj = new Date(`${year}-${month}-01`);
    return dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
  };
  return `${format(fromDate)} to ${format(toDate)}`;
}

export async function fetchTallyReportAndUploadPDF({
  reportName,
  tallyRequest,
  s3Key,
  pdfFormat = "A4",
  replyMessage,
  fromDate,
  toDate
}) {
  try {
    const response = await axios.post(TALLY_URL, tallyRequest, {
      headers: { "Content-Type": "application/xml" }
    });

    if (response && response.data) {
      const browser = await puppeteer.launch({ headless: "new" });
      const page = await browser.newPage();
      await page.setContent(response.data, { waitUntil: "networkidle0" });
      const pdfBuffer = await page.pdf({
        format: "A4", 
        landscape: true, 
        margin: { top: "10mm", right: "5mm", bottom: "10mm", left: "5mm" },
        printBackground: true
      });
      await browser.close();

      await uploadFileToS3(pdfBuffer, s3Key, "application/pdf");
      const s3Url = `https://${process.env.TALLY_AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
      console.log(`${reportName} PDF uploaded to S3:`, s3Url);

      const downloadUrl = `${process.env.BACKEND_BASE_URL}/api/download/${reportName}/${fromDate}/${toDate}`;

      return {
        message: replyMessage,
        downloadUrl
      };
    } else {
      throw new Error("No data received from Tally");
    }
  } catch (error) {
    console.error(`Error fetching or processing ${reportName} report:`, error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
    throw error;
  }
}