import axios from "axios";
import puppeteer from "puppeteer";
import { uploadFileToS3 } from "../s3Utils.js";
import dotenv from "dotenv";
dotenv.config({ path: "../../configs/.env" });

const tallyConfig = {
    host: 'localhost', // Change this to your Tally server IP if needed
    port: 9001, // Default Tally port
};

// Function to fetch Profit & Loss report for given dates, convert to PDF, and upload to S3
export async function fetchProfitAndLossAndUploadPDF(fromDate, toDate) {
    // Build XML request with dynamic dates
    const tallyRequest = `
<ENVELOPE>
    <HEADER>
        <TALLYREQUEST>Export Data</TALLYREQUEST>
    </HEADER>
    <BODY>
        <EXPORTDATA>
            <REQUESTDESC>
                <REPORTNAME>Profit and Loss</REPORTNAME>
                <STATICVARIABLES>
                    <SVFROMDATE>${fromDate}</SVFROMDATE>
                    <SVTODATE>${toDate}</SVTODATE>
                    <SVEXPORTFORMAT>$$SysName:HTML</SVEXPORTFORMAT>
                    <EXPLODEFLAG>Yes</EXPLODEFLAG>
                    <SHOWOPENING>Yes</SHOWOPENING>
                    <SHOWCLOSING>Yes</SHOWCLOSING>
                    <SHOWTRANSACTIONS>Yes</SHOWTRANSACTIONS>
                    <SHOWFOREIGNGAINLOSS>Yes</SHOWFOREIGNGAINLOSS>
                    <SHOWNETTRANSACTIONS>Yes</SHOWNETTRANSACTIONS>
                    <SHOWSECURITYLEVELS>Yes</SHOWSECURITYLEVELS>
                    <SHOWDETAILEDBREAKUP>Yes</SHOWDETAILEDBREAKUP>
                    <ISDETAILEDMODE>Yes</ISDETAILEDMODE>
                    <ACCOUNTSWITHVOUCHERS>Yes</ACCOUNTSWITHVOUCHERS>
                    <SVSHOWPERCENTAGE>Yes</SVSHOWPERCENTAGE>
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
            // Directly convert HTML to PDF using Puppeteer (no local HTML file)
            const browser = await puppeteer.launch({ headless: "new" });
            const page = await browser.newPage();
            await page.setContent(response.data, { waitUntil: "networkidle0" });
            const pdfBuffer = await page.pdf({ format: "A4" });
            await browser.close();

            // Upload PDF to S3
            const s3Key = `Tally/tally-pdf-reports/profit_and_loss_report_copy_${fromDate}_${toDate}.pdf`;
            await uploadFileToS3(pdfBuffer, s3Key, "application/pdf");
            const s3Url = `https://${process.env.TALLY_AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
            console.log("Profit and Loss PDF uploaded to S3:", s3Url);

            return s3Url;
        } else {
            throw new Error("No data received from Tally");
        }
    } catch (error) {
        console.error("Error fetching or processing Profit and Loss report:", error.message);
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data);
        }
        throw error;
    }
}

// Example usage (uncomment to test):
// fetchProfitAndLossAndUploadPDF("20240401", "20240831");