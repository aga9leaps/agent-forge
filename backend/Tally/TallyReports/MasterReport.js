import dotenv from 'dotenv';
dotenv.config({ path: "../../configs/.env" });
import axios from 'axios';
import xml2js from 'xml2js';
import { Parser } from 'json2csv';
import { uploadFileToS3 } from '../s3Utils.js';
import fs from 'fs';
import path from 'path';
const Tally_URL = process.env.TALLY_URL;
const __dirname = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([a-zA-Z]:)/, '$1');
const xmlRequest = `
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <EXPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>List of Accounts</REPORTNAME>
        <STATICVARIABLES>
          <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
          <SVCURRENTCOMPANY>11 ZMC ENTERPRISES NGP - (from 1-Apr-23)</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>
`;

function formatOpeningBalance(balance) {
  if (balance === undefined || balance === null || balance === '') return '';
  
  // Handle string values that might have commas or other formatting
  const cleanBalance = typeof balance === 'string' 
    ? balance.replace(/,/g, '') 
    : balance;
  
  const num = parseFloat(cleanBalance);
  
  if (isNaN(num)) return '';
  
  // Format with 2 decimal places and Dr/Cr suffix
  if (num < 0) {
    return `${Math.abs(num).toFixed(2)} Dr`;
  }
  return `${num.toFixed(2)} Cr`;
}
// Helper function to recursively find ledgers in the response
function findLedgersInObject(obj, ledgers = []) {
  if (!obj) return ledgers;
  
  if (typeof obj === 'object') {
    if (obj.LEDGER) {
      const ledger = obj.LEDGER;
      ledgers.push(ledger);
    }
    
    for (const key in obj) {
      findLedgersInObject(obj[key], ledgers);
    }
  }
  
  return ledgers;
}

// Helper function to extract ledger name from various possible locations
function getLedgerName(ledger) {
  // Check multiple possible locations for the name
  return ledger.NAME || 
         ledger.$?.NAME || // Sometimes name is an attribute
         ledger.LEDGERNAME || 
         ledger.DISPLAYNAME || 
         ledger.DESCRIPTION || 
         'N/A';
}

axios.post(Tally_URL, xmlRequest, {
  headers: { 'Content-Type': 'text/xml' }
})
.then(response => {
  const xmlResponse = response.data;

  xml2js.parseString(xmlResponse, { explicitArray: false, attrkey: '$' }, async(err, result) => {
    if (err) {
      console.error('Error parsing XML:', err);
      return;
    }
    fs.writeFileSync(
      path.join(__dirname, 'master_ledger_response.json'),
      JSON.stringify(result, null, 2)
    );

    try {
      // Try multiple approaches to find ledgers
      let ledgers = findLedgersInObject(result);
      
      if (ledgers.length === 0) {
        // Alternative approach if recursive search didn't find anything
        const body = result?.ENVELOPE?.BODY || {};
        
        if (body.DATA?.TALLYMESSAGE?.LEDGER) {
          ledgers = Array.isArray(body.DATA.TALLYMESSAGE.LEDGER) 
            ? body.DATA.TALLYMESSAGE.LEDGER 
            : [body.DATA.TALLYMESSAGE.LEDGER];
        } 
        else if (body.IMPORTDATA?.REQUESTDATA?.TALLYMESSAGE) {
          const tallyMessages = Array.isArray(body.IMPORTDATA.REQUESTDATA.TALLYMESSAGE)
            ? body.IMPORTDATA.REQUESTDATA.TALLYMESSAGE
            : [body.IMPORTDATA.REQUESTDATA.TALLYMESSAGE];
          
          tallyMessages.forEach(msg => {
            if (msg.LEDGER) {
              ledgers = ledgers.concat(Array.isArray(msg.LEDGER) ? msg.LEDGER : [msg.LEDGER]);
            }
          });
        }
      }

      if (ledgers.length === 0) {
        console.log('Full response structure:', JSON.stringify(result, null, 2));
        throw new Error('No ledger data found after exhaustive search');
      }

      console.log(`Found ${ledgers.length} ledgers`);

      const csvData = ledgers.map((ledger, index) => {
        // Handle GST details which might be in different structures
        const gstDetails = ledger.LEDGSTREGDETAILS || {};
        const mailingDetails = ledger.LEDMAILINGDETAILS || {};
        
        // GST details might be in a LIST object or directly in the ledger
        const gstList = gstDetails.LIST || {};
        const mailingList = mailingDetails.LIST || {};
      
        return {
          'Sl. No.': index + 1,
          'Name of Ledger': getLedgerName(ledger),
          'Contact Name': ledger.LEDGERCONTACT || '',
          'Under': ledger.PARENT || '',
          'State Name': gstList.STATE || 
                      mailingList.STATE || 
                      gstDetails.STATE || 
                      mailingDetails.STATE || 
                      ledger.PRIORSTATENAME || 
                      ledger.OLDLEDSTATENAME || 
                      '',
          'GST Registration Type': gstList.GSTREGISTRATIONTYPE || 
                                 gstDetails.GSTREGISTRATIONTYPE || 
                                 ledger.GSTREGISTRATIONTYPE || 
                                 '',
          'GSTIN/UIN': ledger.PARTYGSTIN || 
                      gstList.GSTIN || 
                      ledger.GSTIN || 
                      gstDetails.GSTIN || 
                      '',
          'Opening Balance': formatOpeningBalance(ledger.OPENINGBALANCE) || '',
          'Mobile Nos.': ledger.LEDGERMOBILE || 
                        ledger.LEDGERPHONE || 
                        (mailingList.ADDRESS && mailingList.ADDRESS.find(a => a.includes('MOB.-'))) || 
                        '',
          'E-mail ID': ledger.EMAIL || '',
          'Country': mailingList.COUNTRY || 
                    mailingDetails.COUNTRY || 
                    ledger.COUNTRYOFRESIDENCE || 
                    ledger.OLDCOUNTRYNAME || 
                    ''
        };
      });

      const parser = new Parser();
      const csv = parser.parse(csvData);
      const s3Key = 'Tally/tally-csv-reports/master_report.csv';
      await uploadFileToS3(csv, s3Key);

    } catch (e) {
      console.error('Error processing ledger data:', e.message);
    }
  });
})
.catch(error => {
  console.error('Error communicating with Tally:', error.message);
});