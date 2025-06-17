import axios from "axios";
import * as cheerio from "cheerio";
import puppeteer from "puppeteer";
import { uploadFileToS3 } from "../s3Utils.js";
import dotenv from "dotenv";
dotenv.config({ path: "../../configs/.env" });

export async function fetchExpenseAnalysisAndUploadPDF(fromDate, toDate) {
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
</ENVELOPE>`;

  // 1. Send request to Tally
  const response = await axios.post(process.env.TALLY_URL, tallyRequest, {
    headers: { "Content-Type": "application/xml" },
  });

  // 2. Extract relevant sections from HTML
  const html = response.data;
  const $ = cheerio.load(html);

  function extractSection(startText) {
    let sectionHtml = "";
    const startElem = $(`*:contains('${startText}')`)
      .filter(function () {
        return $(this).text().trim().startsWith(startText);
      })
      .first();

    if (startElem.length === 0) return "";

    sectionHtml += `<tr><td colspan="2"><strong>${startElem.text().trim()}</strong></td></tr>`;

    let next = startElem.next();
    while (next.length) {
      const txt = next.text().trim();

      // Stop at the next major section
      if (
        /^(Sales Accounts|Closing Stock|Gross Loss|Indirect Incomes|Direct Incomes|Nett Loss|Total|Description Amount)/i.test(
          txt
        )
      )
        break;

      // Skip blank, header-like, or number-only lines
      if (
        txt === "" ||
        /^[\d,.-]+$/.test(txt) ||
        /^Description\s+Amount/i.test(txt) ||
        /^Description\s+Amount\s*\(₹?\)/i.test(txt)
      ) {
        next = next.next();
        continue;
      }

      const parts = txt.split(/\s{2,}/); // split on multiple spaces
      const label = parts[0];
      const value = parts.length > 1 ? parts[1] : "";

      // Fallback: extract trailing amount
      const match = txt.match(/^(.*?)(\s+[-\d,]+\.\d{2})$/);
      if (!value && match) {
        sectionHtml += `<tr><td>${match[1].trim()}</td><td>${match[2].trim()}</td></tr>`;
      } else {
        sectionHtml += `<tr><td>${label}</td><td>${value}</td></tr>`;
      }

      next = next.next();
    }

    return sectionHtml;
  }

  const directExpenses = extractSection("Direct Expenses");
  const indirectExpenses = extractSection("Indirect Expenses");
  const companyName = $("body").text().match(/^\s*\d+\s+([A-Z\s&]+)-/im)?.[1]?.trim() || "Company Name";

  const minimalHTML = `
<html>
  <head>
    <title>Expense Report</title>
    <style>
      body {
        font-family: "Courier New", Courier, monospace;
        padding: 30px;
        color: #000;
      }
      h1, h2 {
        text-align: center;
        margin: 0;
      }
      .subtitle {
        text-align: center;
        margin-bottom: 20px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
      }
      td {
        padding: 6px 10px;
        border-bottom: 1px solid #ccc;
      }
      .section-title {
        margin-top: 30px;
        font-weight: bold;
        padding: 8px 10px;
        background-color: #e6f0ff;
        border: 1px solid #ccc;
      }
      .right {
        text-align: right;
      }
    </style>
  </head>
  <body>
    <h1>${companyName}</h1>
    <h2>Expense Analysis Report</h2>
    <div class="subtitle">(from ${fromDate.slice(6, 8)}-${fromDate.slice(4, 6)}-${fromDate.slice(0, 4)} to ${toDate.slice(6, 8)}-${toDate.slice(4, 6)}-${toDate.slice(0, 4)})</div>

    <div class="section-title">Direct Expenses</div>
    <table>
      <tbody>
        ${directExpenses || "<tr><td colspan='2'>No Direct Expenses found.</td></tr>"}
      </tbody>
    </table>

    <div class="section-title">Indirect Expenses</div>
    <table>
      <tbody>
        ${indirectExpenses || "<tr><td colspan='2'>No Indirect Expenses found.</td></tr>"}
      </tbody>
    </table>
  </body>
</html>
`;

  // 3. Generate PDF
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setContent(minimalHTML, { waitUntil: "networkidle0" });
  const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
  await browser.close();

  // 4. Upload to S3
  const s3Key = `Tally/tally-pdf-reports/expense_analysis_report_${fromDate}_${toDate}.pdf`;
  await uploadFileToS3(pdfBuffer, s3Key, "application/pdf");
  const downloadUrl = `${process.env.BACKEND_BASE_URL}/api/download/expense_analysis_report/${fromDate}/${toDate}`;

  return {
    message: "Your Expense Analysis Report is ready. You can download it using the link below.",
    downloadUrl
  };
}