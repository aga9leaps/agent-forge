import { fetchTallyReportAndUploadPDF, formatDateRange } from "./tallyReportUtils.js";

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

  return fetchTallyReportAndUploadPDF({
    reportName: "ratio_analysis_report",
    tallyRequest,
    s3Key: `Tally/tally-pdf-reports/ratio_analysis_report_${fromDate}_${toDate}.pdf`,
    pdfFormat: "A3",
    replyMessage: "Your Ratio Analysis Report is ready. You can download it using the link below.",
    fromDate,
    toDate
  });
}