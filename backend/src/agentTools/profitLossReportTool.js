import { fetchProfitAndLossAndUploadPDF } from "../../Tally/FinanacialReports/ProfitLossReport.js";

export async function profitLossReportTool({ fromDate, toDate }) {
  return await fetchProfitAndLossAndUploadPDF(fromDate, toDate);
}