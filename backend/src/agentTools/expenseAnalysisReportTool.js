import { fetchExpenseAnalysisAndUploadPDF } from "../../Tally/FinanacialReports/ExpenseAnalysisReport.js";

export async function expenseAnalysisReportTool({ fromDate, toDate }) {
  return await fetchExpenseAnalysisAndUploadPDF(fromDate, toDate);
}