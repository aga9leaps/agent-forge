import { fetchProfitAndLossAndUploadPDF } from "../../Tally/TallyReports/ProfitLossReport.js";

export async function profitLossReportTool({ fromDate, toDate }) {
  try {
    const s3Url = await fetchProfitAndLossAndUploadPDF(fromDate, toDate);
    return { s3Url };
  } catch (error) {
    console.error("Error generating Profit and Loss report:", error);
    throw error;
  }
}
