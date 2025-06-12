import { fetchRatioAnalysisAndUploadPDF } from "../../Tally/FinanacialReports/RatioAnalysisReport.js";

export async function ratioAnalysisReportTool({ fromDate, toDate }) {
  try {
    const s3Url = await fetchRatioAnalysisAndUploadPDF(fromDate, toDate);
    return { s3Url };
  } catch (error) {
    console.error("Error generating Ratio Analysis report:", error);
    throw error;
  }
}
