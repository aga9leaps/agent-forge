// import axios from "axios";
// import puppeteer from "puppeteer";
// import { uploadFileToS3 } from "../s3Utils.js";
// import dotenv from "dotenv";
// dotenv.config({ path: "../../configs/.env" });

// const tallyConfig = {
//     host: 'localhost', // Change if needed
//     port: 9001,
// };

// export async function fetchRatioAnalysisAndUploadPDF(fromDate, toDate) {
//     const tallyRequest = `
// <ENVELOPE>
//     <HEADER>
//         <TALLYREQUEST>Export Data</TALLYREQUEST>
//     </HEADER>
//     <BODY>
//         <EXPORTDATA>
//             <REQUESTDESC>
//                 <REPORTNAME>Ratio Analysis</REPORTNAME>
//                 <STATICVARIABLES>
//                     <SVFROMDATE>${fromDate}</SVFROMDATE>
//                     <SVTODATE>${toDate}</SVTODATE>
//                     <SVEXPORTFORMAT>$$SysName:HTML</SVEXPORTFORMAT>
//                     <ISDETAILEDMODE>Yes</ISDETAILEDMODE>
//                     <EXPLODEFLAG>Yes</EXPLODEFLAG>
//                 </STATICVARIABLES>
//             </REQUESTDESC>
//         </EXPORTDATA>
//     </BODY>
// </ENVELOPE>
// `;

//     try {
//         const url = `http://${tallyConfig.host}:${tallyConfig.port}`;
//         const response = await axios.post(url, tallyRequest, {
//             headers: { "Content-Type": "application/xml" }
//         });

//         if (response && response.data) {
//             // Convert HTML to PDF using Puppeteer (no local HTML file)
//             const browser = await puppeteer.launch({ headless: "new" });
//             const page = await browser.newPage();
//             await page.setContent(response.data, { waitUntil: "networkidle0" });
//             const pdfBuffer = await page.pdf({ format: "A4" });
//             await browser.close();

//             // Upload PDF to S3
//             const s3Key = `Tally/tally-pdf-reports/ratio_analysis_report_${fromDate}_${toDate}.pdf`;
//             await uploadFileToS3(pdfBuffer, s3Key, "application/pdf");
//             const s3Url = `https://${process.env.TALLY_AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
//             console.log("Ratio Analysis PDF uploaded to S3:", s3Url);
//             return s3Url;
//         } else {
//             throw new Error("No data received from Tally");
//         }
//     } catch (error) {
//         console.error("Error fetching or processing Ratio Analysis report:", error.message);
//         if (error.response) {
//             console.error("Status:", error.response.status);
//             console.error("Data:", error.response.data);
//         }
//         throw error;
//     }
// }

// // Example usage (uncomment to test):
// fetchRatioAnalysisAndUploadPDF("20240401", "20240831");
import axios from "axios";
import puppeteer from "puppeteer";
import { uploadFileToS3 } from "../s3Utils.js";
import dotenv from "dotenv";
dotenv.config({ path: "../../configs/.env" });

const tallyConfig = {
  host: 'localhost',
  port: 9001,
};

// Utility to format YYYYMMDD to "Month YYYY"
function formatDateRange(fromDate, toDate) {
  const format = (dateStr) => {
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const dateObj = new Date(`${year}-${month}-01`);
    return dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
  };
  return `${format(fromDate)} to ${format(toDate)}`;
}

export async function fetchRatioAnalysisAndUploadPDF(fromDate, toDate) {
  const tallyRequest = `
<ENVELOPE>
    <HEADER>
        <TALLYREQUEST>Export Data</TALLYREQUEST>
    </HEADER>
    <BODY>
        <EXPORTDATA>
            <REQUESTDESC>
                <REPORTNAME>Ratio Analysis</REPORTNAME>
                <STATICVARIABLES>
                    <SVFROMDATE>${fromDate}</SVFROMDATE>
                    <SVTODATE>${toDate}</SVTODATE>
                    <SVEXPORTFORMAT>$$SysName:HTML</SVEXPORTFORMAT>
                    <ISDETAILEDMODE>Yes</ISDETAILEDMODE>
                    <EXPLODEFLAG>Yes</EXPLODEFLAG>
                    <SHOWVERTICALANALYSIS>Yes</SHOWVERTICALANALYSIS>
                </STATICVARIABLES>
            </REQUESTDESC>
        </EXPORTDATA>
    </BODY>
</ENVELOPE>
`;

  try {
    const url = `http://${tallyConfig.host}:${tallyConfig.port}`;
    const response = await axios.post(url, tallyRequest, {
      headers: { "Content-Type": "application/xml" }
    });

    if (response && response.data) {
      const browser = await puppeteer.launch({ headless: "new" });
      const page = await browser.newPage();
      await page.setContent(response.data, { waitUntil: "networkidle0" });
      const pdfBuffer = await page.pdf({ format: "A3" });
      await browser.close();

      const s3Key = `Tally/tally-pdf-reports/ratio_analysis_report_${fromDate}_${toDate}.pdf`;
      await uploadFileToS3(pdfBuffer, s3Key, "application/pdf");
      const s3Url = `https://${process.env.TALLY_AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
      console.log("Ratio Analysis PDF uploaded to S3:", s3Url);

      const downloadUrl = `${process.env.BACKEND_BASE_URL}/api/download/ratio_analysis_report/${fromDate}/${toDate}`;
      const dateRangeText = formatDateRange(fromDate, toDate);

      return {
        message: `Your Ratio Analysis Report is ready. You can download it using the link below.`,
        downloadUrl
      };
    } else {
      throw new Error("No data received from Tally");
    }
  } catch (error) {
    console.error("Error fetching or processing Ratio Analysis report:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
    throw error;
  }
}

// Example usage (uncomment to test):
// fetchRatioAnalysisAndUploadPDF("20240401", "20240831");