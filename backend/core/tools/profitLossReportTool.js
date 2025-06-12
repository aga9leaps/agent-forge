import { fetchProfitAndLossAndUploadPDF } from "../../Tally/TallyReports/ProfitLossReport.js";

function init() {
  async function execute({ fromDate, toDate }) {
    const s3Url = await fetchProfitAndLossAndUploadPDF(fromDate, toDate);
    return { s3Url };
  }
  return { execute };
}
export { init };