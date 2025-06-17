import { fetchExpenseAnalysisAndUploadPDF } from "../../Tally/FinanacialReports/ExpenseAnalysisReport.js";

function init() {
  async function execute({ fromDate, toDate }) {
    return await fetchExpenseAnalysisAndUploadPDF(fromDate, toDate);
  }
  return { execute };
}
export { init };