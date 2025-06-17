import { fetchCashFlowProjectionAndUploadPDF } from "../../Tally/FinanacialReports/CashFlowProjectionReport.js";

function init() {
  async function execute({ fromDate, toDate }) {
    return await fetchCashFlowProjectionAndUploadPDF(fromDate, toDate);
  }
  return { execute };
}
export { init };