import axios from "axios";
import xml2js from "xml2js";
import { Parser } from "json2csv";
import dotenv from "dotenv";
import { uploadFileToS3 } from "../s3Utils.js";
import fs from "fs";
import path from "path";

dotenv.config({ path: "../../configs/.env" });
const TALLY_URL = process.env.TALLY_URL;

const xmlRequest = `
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <EXPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Voucher Register</REPORTNAME>
        <STATICVARIABLES>
          <SVFROMDATE>20240401</SVFROMDATE>
          <SVTODATE>20240831</SVTODATE>
          <SVCURRENTCOMPANY>11 ZMC ENTERPRISES NGP - (from 1-Apr-23)</SVCURRENTCOMPANY>
          <VOUCHERTYPENAME></VOUCHERTYPENAME>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE>
          <VOUCHER>
            <DATE/>
            <VOUCHERTYPENAME/>
            <VOUCHERNUMBER/>
            <PARTYLEDGERNAME/>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME/>
              <AMOUNT/>
            </ALLLEDGERENTRIES.LIST>
            <ACCOUNTINGALLOCATIONS.LIST>
              <LEDGERNAME/>
              <AMOUNT/>
            </ACCOUNTINGALLOCATIONS.LIST>
          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>
`;

const __dirname = path
  .dirname(new URL(import.meta.url).pathname)
  .replace(/^\/([a-zA-Z]:)/, "$1");
const masterLedgerData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "master_ledger_response.json"), "utf-8")
);

// Function to find address by ledger name
function getAddressForLedger(ledgerName) {
  let ledgers = [];

  function findLedgers(obj) {
    if (!obj) return;
    if (typeof obj === "object") {
      if (obj.LEDGER) {
        const ledger = obj.LEDGER;
        ledgers = ledgers.concat(Array.isArray(ledger) ? ledger : [ledger]);
      }
      for (const key in obj) {
        findLedgers(obj[key]);
      }
    }
  }

  findLedgers(masterLedgerData);

  for (const ledger of ledgers) {
    const name = ledger?.NAME || ledger?.["$"]?.NAME;
    if (name?.trim() === ledgerName?.trim()) {
      const addressList =
        ledger?.["LEDMAILINGDETAILS.LIST"]?.["ADDRESS.LIST"]?.ADDRESS;
      return Array.isArray(addressList)
        ? addressList.join(", ")
        : addressList || "";
    }
  }
  return "";
}

function formatValue(value) {
  const absValue = Math.abs(value).toFixed(2); // Format to 2 decimal places if needed
  return value < 0 ? `${absValue}Dr` : `${absValue}Cr`;
}

async function fetchDataFromTally() {
  try {
    console.time("⏳ Tally Response Time");
    const response = await axios.post(TALLY_URL, xmlRequest, {
      headers: { "Content-Type": "text/xml" },
    });
    console.timeEnd("⏳ Tally Response Time");

    xml2js.parseString(
      response.data,
      { explicitArray: false },
      async (err, result) => {
        if (err) throw err;

        const messages =
          result?.ENVELOPE?.BODY?.IMPORTDATA?.REQUESTDATA?.TALLYMESSAGE;
        if (!messages) {
          console.error("❌ No TALLYMESSAGE found in the response.");
          return;
        }

        const messageArray = Array.isArray(messages) ? messages : [messages];
        const rows = [];

        for (const message of messageArray) {
          const voucher = message?.VOUCHER || {};
          if (!voucher) continue;

          // Format the date as yyyy-mm-dd
          const rawDate = voucher.DATE || "";
          const formattedDate = rawDate
            ? new Date(
                rawDate.substring(0, 4),
                rawDate.substring(4, 6) - 1,
                rawDate.substring(6, 8)
              )
                .toISOString()
                .split("T")[0]
            : "";
          // Extract particulars
          const particulars = [
            voucher.PARTYLEDGERNAME || "",
            ...(Array.isArray(voucher["ALLLEDGERENTRIES.LIST"])
              ? voucher["ALLLEDGERENTRIES.LIST"].map(
                  (entry) => entry.LEDGERNAME
                )
              : voucher["ALLLEDGERENTRIES.LIST"]?.LEDGERNAME
              ? [voucher["ALLLEDGERENTRIES.LIST"].LEDGERNAME]
              : []),
          ]
            .filter((name) => name)
            .join(", ");

          let grossTotal = 0;
          let gstSales18 = 0;
          let outputCGST9 = 0;
          let outputSGST9 = 0;
          let roundOff = 0;
          let outputCGST2_5 = 0;
          let outputSGST2_5 = 0;
          let gstSales5 = 0;
          let igstSales5 = 0;
          let igstSales18 = 0;
          let outputIGST5 = 0;
          let outputIGST18 = 0;
          let stateBankAmount = 0;
          let cashAmount = 0;

          // Determine gross total based on voucher type
          if (voucher.VOUCHERTYPENAME === "GST Sales") {
            // GST Sales logic from voucher.js
            const ledgerEntries = Array.isArray(voucher["LEDGERENTRIES.LIST"])
              ? voucher["LEDGERENTRIES.LIST"]
              : voucher["LEDGERENTRIES.LIST"]
              ? [voucher["LEDGERENTRIES.LIST"]]
              : [];

            for (const entry of ledgerEntries) {
              const ledgerName = (entry?.LEDGERNAME || "").trim();
              const amount = parseFloat(entry?.AMOUNT || 0);

              // Gross total is the absolute value of the party ledger entry (negative amount)
              if (ledgerName === (voucher.PARTYLEDGERNAME || "").trim()) {
                grossTotal = Math.abs(amount);
              }
            }
          } else {
            // Receipt voucher logic for gross total
            const ledgerEntries = Array.isArray(
              voucher["ALLLEDGERENTRIES.LIST"]
            )
              ? voucher["ALLLEDGERENTRIES.LIST"]
              : voucher["ALLLEDGERENTRIES.LIST"]
              ? [voucher["ALLLEDGERENTRIES.LIST"]]
              : [];

            for (const entry of ledgerEntries) {
              const ledgerName = (entry?.LEDGERNAME || "").trim();
              const amount = parseFloat(entry?.AMOUNT || 0);

              // Gross Total: Match the party ledger name
              if (ledgerName === (voucher.PARTYLEDGERNAME || "").trim()) {
                grossTotal = Math.abs(amount);
              }
              // State Bank of India, Nagpur: Match the specific ledger name
              if (ledgerName === "State Bank of India, Nagpur") {
                stateBankAmount = Math.abs(amount);
              }

              // Cash: Match the specific ledger name
              if (ledgerName.toLowerCase() === "cash") {
                cashAmount = Math.abs(amount);
              }
            }
          }
          // Process LEDGERENTRIES.LIST to get tax amounts and gross total
          const ledgerEntries = Array.isArray(voucher["LEDGERENTRIES.LIST"])
            ? voucher["LEDGERENTRIES.LIST"]
            : voucher["LEDGERENTRIES.LIST"]
            ? [voucher["LEDGERENTRIES.LIST"]]
            : [];

          for (const entry of ledgerEntries) {
            const ledgerName = (entry?.LEDGERNAME || "").trim();
            const amount = parseFloat(entry?.AMOUNT || 0);

            if (ledgerName.includes("Output CGST @ 9%")) {
              outputCGST9 += amount;
            } else if (ledgerName.includes("Output SGST @ 9%")) {
              outputSGST9 += amount;
            } else if (ledgerName.includes("Round Off")) {
              roundOff += amount;
            } else if (ledgerName.includes("Output CGST @ 2.5%")) {
              outputCGST2_5 += amount;
            } else if (ledgerName.includes("Output SGST @ 2.5%")) {
              outputSGST2_5 += amount;
            } else if (ledgerName.includes("Output IGST @ 5%")) {
              outputIGST5 += amount;
            } else if (ledgerName.includes("Output IGST@ 18%")) {
              outputIGST18 += amount;
            }
          }

          // Calculate GST Sales @18% from ALLINVENTORYENTRIES.LIST
          const inventoryEntries = Array.isArray(
            voucher["ALLINVENTORYENTRIES.LIST"]
          )
            ? voucher["ALLINVENTORYENTRIES.LIST"]
            : voucher["ALLINVENTORYENTRIES.LIST"]
            ? [voucher["ALLINVENTORYENTRIES.LIST"]]
            : [];

          for (const inventory of inventoryEntries) {
            const accountingAllocations = Array.isArray(
              inventory["ACCOUNTINGALLOCATIONS.LIST"]
            )
              ? inventory["ACCOUNTINGALLOCATIONS.LIST"]
              : inventory["ACCOUNTINGALLOCATIONS.LIST"]
              ? [inventory["ACCOUNTINGALLOCATIONS.LIST"]]
              : [];

            for (const allocation of accountingAllocations) {
              const ledgerName = (allocation?.LEDGERNAME || "").toLowerCase();
              const amount = parseFloat(allocation?.AMOUNT || 0);
              if (
                ledgerName.includes("gst sales@18%") ||
                ledgerName.includes("gst sales @18%")
              ) {
                gstSales18 += Math.abs(amount);
              } else if (ledgerName.includes("gst sales @ 5%")) {
                gstSales5 += Math.abs(amount); // Add the amount for GST Sales @ 5%
              } else if (ledgerName.includes("igst sale @5%")) {
                igstSales5 += Math.abs(amount); // Add the amount for IGST Sales @ 5%
              } else if (ledgerName.includes("igst sale @ 18%")) {
                igstSales18 += Math.abs(amount); // Add the amount for IGST Sales @ 5%
              }
            }
          }

          const row = {
            Date_Of_Action: formattedDate,
            Particulars: particulars || "",
            Buyer: voucher.PARTYNAME || voucher.BASICBUYERNAME || "",
            Consignee: voucher.CONSIGNEEMAILINGNAME || "",
            Buyer_Address: voucher["BASICBUYERADDRESS.LIST"]?.BASICBUYERADDRESS
              ? Array.isArray(
                  voucher["BASICBUYERADDRESS.LIST"].BASICBUYERADDRESS
                )
                ? voucher["BASICBUYERADDRESS.LIST"].BASICBUYERADDRESS.join(", ")
                : voucher["BASICBUYERADDRESS.LIST"].BASICBUYERADDRESS
              : "",
            Consignee_Address: voucher["ADDRESS.LIST"]?.ADDRESS
              ? Array.isArray(voucher["ADDRESS.LIST"].ADDRESS)
                ? voucher["ADDRESS.LIST"].ADDRESS.join(", ")
                : voucher["ADDRESS.LIST"].ADDRESS
              : "",
            Party_Address: getAddressForLedger(voucher.PARTYLEDGERNAME || ""),
            Voucher_Type: voucher.$?.VCHTYPE || voucher.VOUCHERTYPENAME || "",
            Voucher_No: voucher.VOUCHERNUMBER || "",
            GSTIN_UIN: voucher.PARTYGSTIN || "",
            PAN_No: voucher.BUYERPINNUMBER || voucher.CONSIGNEEPINNUMBER || "",
            Narration: voucher.NARRATION || "",
            Terms_of_Payment: voucher.BASICDUEDATEOFPYMT || "",
            Dispatch_Through: voucher.BASICSHIPPEDBY || "",
            Destination: voucher.BASICFINALDESTINATION || "",
            State: voucher.STATENAME || voucher.CONSIGNEESTATENAME || "",
            Gross_Total: formatValue(grossTotal),
            GST_Sales_At_18_Percent: formatValue(gstSales18),
            Output_CGST_At_9_Percent: formatValue(outputCGST9),
            Output_SGST_At_9_Percent: formatValue(outputSGST9),
            Output_CGST_At_2_5_Percent: formatValue(outputCGST2_5),
            Output_SGST_At_2_5_Percent: formatValue(outputSGST2_5),
            Round_Off: formatValue(roundOff),
            GST_Sales_At_5_Percent: formatValue(gstSales5),
            IGST_Sales_At_5_Percent: formatValue(igstSales5),
            IGST_Sales_At_18_Percent: formatValue(igstSales18),
            Output_IGST_At_5_Percent: formatValue(outputIGST5),
            Output_IGST_At_18_Percent: formatValue(outputIGST18),
            Voucher_Ref_No: voucher.REFERENCE || "",
            Voucher_Ref_Date: voucher.REFERENCEDATE || "",
            Sales_Tax_No: voucher.BASICBUYERSSALESTAXNO || "",
            Service_Tax_No:
              voucher["SERVICETAXDETAILS.LIST"]?.SERVICETAXNUMBER || "",
            CST_No: voucher.CSTFORMISSUENUMBER || "",
            Shipping_No: voucher.SHIPPINGBILLNO || "",
            Shipping_Date: voucher.SHIPPINGBILLDATE || "",
            Port_Code: voucher.PORTCODE || "",
            State_Bank_of_India_Nagpur: formatValue(stateBankAmount),
            Cash: formatValue(cashAmount),
          };

          rows.push(row);
        }

        const parser = new Parser();
        const csv = parser.parse(rows);
        const s3Key = "Tally/tally-csv-reports/voucher_register_report.csv";
        await uploadFileToS3(csv, s3Key);
      }
    );
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

fetchDataFromTally();
