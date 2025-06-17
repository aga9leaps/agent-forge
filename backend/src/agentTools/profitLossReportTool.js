import { fetchProfitAndLossAndUploadPDF } from "../../Tally/FinanacialReports/ProfitLossReport.js";

function init() {
  async function execute({ fromDate, toDate }) {
    return await fetchProfitAndLossAndUploadPDF(fromDate, toDate);
  }
  return { execute };
}
export { init };