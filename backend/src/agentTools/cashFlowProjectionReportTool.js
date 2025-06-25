import { fetchCashFlowProjectionAndUploadPDF } from "../../Tally/FinanacialReports/CashFlowProjectionReport.js";

export async function cashFlowProjectionReportTool({ fromDate, toDate }) {
  return await fetchCashFlowProjectionAndUploadPDF(fromDate, toDate);
}