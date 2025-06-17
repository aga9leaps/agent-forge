import { fetchTallyReportAndUploadPDF } from "./tallyReportUtils.js";

export async function fetchCashFlowStatementAndUploadPDF(fromDate, toDate) {
  const tallyRequest = `
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Data</TYPE>
    <ID>Cash Flow</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>$$SysName:HTML</SVEXPORTFORMAT>
        <SVFROMDATE>${fromDate}</SVFROMDATE>
        <SVTODATE>${toDate}</SVTODATE>
        <ISDETAILEDMODE>Yes</ISDETAILEDMODE>
        <EXPLODEFLAG>Yes</EXPLODEFLAG>
      </STATICVARIABLES>
    </DESC>
  </BODY>
</ENVELOPE>
`;

  return fetchTallyReportAndUploadPDF({
    reportName: "cash_flow_statement",
    tallyRequest,
    s3Key: `Tally/tally-pdf-reports/cash_flow_statement_${fromDate}_${toDate}.pdf`,
    pdfFormat: "A4",
    replyMessage: "Your Cash Flow Statement Report is ready. You can download it using the link below.",
    fromDate,
    toDate
  });
}