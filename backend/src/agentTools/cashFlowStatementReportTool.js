import { fetchCashFlowStatementAndUploadPDF } from "../../Tally/FinanacialReports/CashFlowStatementReport.js";

export async function cashFlowStatementReportTool({ fromDate, toDate }) {
  return await fetchCashFlowStatementAndUploadPDF(fromDate, toDate);
}