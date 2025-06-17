import { fetchCashFlowStatementAndUploadPDF } from "../../Tally/FinanacialReports/CashFlowStatementReport.js";

function init() {
  async function execute({ fromDate, toDate }) {
    return await fetchCashFlowStatementAndUploadPDF(fromDate, toDate);
  }
  return { execute };
}
export { init };