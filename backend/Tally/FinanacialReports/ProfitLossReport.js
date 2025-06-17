import { fetchTallyReportAndUploadPDF, formatDateRange } from "./tallyReportUtils.js";

export async function fetchProfitAndLossAndUploadPDF(fromDate, toDate) {
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

  return fetchTallyReportAndUploadPDF({
    reportName: "profit_and_loss_report",
    tallyRequest,
    s3Key: `Tally/tally-pdf-reports/profit_and_loss_report_${fromDate}_${toDate}.pdf`,
    pdfFormat: "A4",
    replyMessage: "Your Profit and Loss Report is ready. You can download it using the link below.",
    fromDate,
    toDate
  });
}