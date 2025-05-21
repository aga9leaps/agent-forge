import axios from "axios";
import fs from "fs";
import path from "path";
import xml2js from "xml2js";
import { uploadFileToS3 } from "../s3Utils.js";
import dotenv from "dotenv";
dotenv.config({ path: "../../configs/.env" });

const TALLY_URL = process.env.TALLY_URL;
const xmlRequest = `<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Data</TYPE>
    <ID>Bills Payable</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
      </STATICVARIABLES>
    </DESC>
  </BODY>
</ENVELOPE>`;

async function fetchBillsPayable() {
  try {
    const response = await axios.post(TALLY_URL, xmlRequest, {
      headers: { "Content-Type": "application/xml" },
    });

    const billsData = [];
    const xmlString = response.data;
    const billSections = xmlString.split("<BILLFIXED>").slice(1);

    billSections.forEach((section) => {
      try {
        const billFixedEnd = section.indexOf("</BILLFIXED>");
        const billFixedContent = section.substring(0, billFixedEnd);
        const dateMatch = billFixedContent.match(/<BILLDATE>(.*?)<\/BILLDATE>/);
        const refMatch = billFixedContent.match(/<BILLREF>(.*?)<\/BILLREF>/);
        const partyMatch = billFixedContent.match(
          /<BILLPARTY>(.*?)<\/BILLPARTY>/
        );
        const remainingSection = section.substring(
          billFixedEnd + "</BILLFIXED>".length
        );
        const billClMatch = remainingSection.match(/<BILLCL>(.*?)<\/BILLCL>/);
        const billDueMatch = remainingSection.match(
          /<BILLDUE>(.*?)<\/BILLDUE>/
        );
        const billOverdueMatch = remainingSection.match(
          /<BILLOVERDUE>(.*?)<\/BILLOVERDUE>/
        );

        if (dateMatch && refMatch && partyMatch) {
          billsData.push({
            date: dateMatch[1].trim(),
            billref: refMatch[1].trim(),
            billParty: partyMatch[1].trim(),
            billcl: billClMatch ? billClMatch[1].trim() : "0",
            billdue: billDueMatch ? billDueMatch[1].trim() : "",
            billoverdue: billOverdueMatch ? billOverdueMatch[1].trim() : "0",
          });
        }
      } catch (e) {
        console.warn("Error processing bill section:", e.message);
      }
    });

    if (billsData.length === 0) {
      console.warn("No bill data could be extracted.");
      return;
    }

    const csvContent = [
      "Date,Bill_Ref,Party_Name,Pending_Amount,Bill_Due_On,Bill_Overdue_By_Days",
      ...billsData.map(
        (item) =>
          `"${item.date}","${item.billref}","${item.billParty}",${item.billcl},"${item.billdue}",${item.billoverdue}`
      ),
    ].join("\n");

    const s3Key = "Tally/tally-csv-reports/bills_payable_report.csv";
    await uploadFileToS3(csvContent, s3Key);
  } catch (error) {
    console.error("Error:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
  }
}

fetchBillsPayable();
