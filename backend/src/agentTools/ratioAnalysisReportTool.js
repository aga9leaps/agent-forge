import { fetchRatioAnalysisAndUploadPDF } from "../../Tally/FinanacialReports/RatioAnalysisReport.js";

export async function ratioAnalysisReportTool({ fromDate, toDate }) {
  return await fetchRatioAnalysisAndUploadPDF(fromDate, toDate);
}